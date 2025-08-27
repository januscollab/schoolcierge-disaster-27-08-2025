/**
 * Infrastructure Health Check Module
 * Provides comprehensive health monitoring for all system components
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Queue } from 'bullmq';

export interface HealthStatus {
  healthy: boolean;
  timestamp: number;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    queue: ServiceHealth;
    external?: ServiceHealth;
  };
  metrics?: {
    dbLatency: number;
    redisLatency: number;
    queueDepth: number;
    memoryUsage: number;
    cpuUsage?: number;
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  error?: string;
  details?: Record<string, any>;
}

export class HealthCheckService {
  private prisma: PrismaClient;
  private redis: Redis;
  private queues: Map<string, Queue>;
  private readonly HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds
  private readonly LATENCY_THRESHOLD = {
    database: 100, // ms
    redis: 50, // ms
    queue: 200 // ms
  };

  constructor(
    prisma?: PrismaClient,
    redis?: Redis,
    queues?: Map<string, Queue>
  ) {
    this.prisma = prisma || new PrismaClient();
    this.redis = redis || new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.queues = queues || new Map();
  }

  /**
   * Perform comprehensive health check on all services
   */
  async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    // Run all health checks in parallel with timeout
    const [database, redis, queue] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkQueues()
    ]);

    const metrics = await this.collectMetrics();

    const allHealthy = 
      database.status === 'healthy' &&
      redis.status === 'healthy' &&
      queue.status === 'healthy';

    return {
      healthy: allHealthy,
      timestamp: Date.now(),
      services: {
        database,
        redis,
        queue
      },
      metrics
    };
  }

  /**
   * Check PostgreSQL database health
   */
  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Set a timeout for the health check
      const result = await Promise.race([
        this.prisma.$queryRaw<[{ healthy: number }]>`SELECT 1 as healthy`,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Database health check timeout')), this.HEALTH_CHECK_TIMEOUT)
        )
      ]);

      const latency = Date.now() - startTime;
      
      // Check connection pool status
      const poolStatus = await this.prisma.$queryRaw<[{ count: number }]>`
        SELECT count(*) as count 
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;

      return {
        status: latency > this.LATENCY_THRESHOLD.database ? 'degraded' : 'healthy',
        latency,
        details: {
          connections: poolStatus[0].count,
          threshold: this.LATENCY_THRESHOLD.database
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }

  /**
   * Check Redis cache health
   */
  private async checkRedis(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Ping Redis
      const pong = await Promise.race([
        this.redis.ping(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Redis health check timeout')), this.HEALTH_CHECK_TIMEOUT)
        )
      ]);

      const latency = Date.now() - startTime;
      
      // Get Redis info
      const info = await this.redis.info('server');
      const memInfo = await this.redis.info('memory');
      
      // Parse Redis version
      const versionMatch = info.match(/redis_version:(.+)/);
      const version = versionMatch ? versionMatch[1].trim() : 'unknown';
      
      // Parse memory usage
      const memMatch = memInfo.match(/used_memory_human:(.+)/);
      const memoryUsage = memMatch ? memMatch[1].trim() : 'unknown';

      return {
        status: latency > this.LATENCY_THRESHOLD.redis ? 'degraded' : 'healthy',
        latency,
        details: {
          version,
          memoryUsage,
          threshold: this.LATENCY_THRESHOLD.redis
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown Redis error'
      };
    }
  }

  /**
   * Check BullMQ queue health
   */
  private async checkQueues(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      if (this.queues.size === 0) {
        // If no queues are registered, create a test queue
        const testQueue = new Queue('health-check', {
          connection: this.redis
        });
        this.queues.set('health-check', testQueue);
      }

      const queueStatuses = await Promise.all(
        Array.from(this.queues.entries()).map(async ([name, queue]) => {
          const [waiting, active, completed, failed] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount()
          ]);

          return {
            name,
            waiting,
            active,
            completed,
            failed,
            healthy: failed < 100 // Consider unhealthy if too many failed jobs
          };
        })
      );

      const latency = Date.now() - startTime;
      const allHealthy = queueStatuses.every(q => q.healthy);
      const totalJobs = queueStatuses.reduce((sum, q) => 
        sum + q.waiting + q.active, 0
      );

      return {
        status: allHealthy ? 
          (latency > this.LATENCY_THRESHOLD.queue ? 'degraded' : 'healthy') : 
          'unhealthy',
        latency,
        details: {
          queues: queueStatuses,
          totalPending: totalJobs,
          threshold: this.LATENCY_THRESHOLD.queue
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown queue error'
      };
    }
  }

  /**
   * Collect system metrics
   */
  private async collectMetrics() {
    const dbLatency = await this.measureDatabaseLatency();
    const redisLatency = await this.measureRedisLatency();
    const queueDepth = await this.getQueueDepth();
    const memoryUsage = this.getMemoryUsage();

    return {
      dbLatency,
      redisLatency,
      queueDepth,
      memoryUsage,
      cpuUsage: this.getCPUUsage()
    };
  }

  private async measureDatabaseLatency(): Promise<number> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return Date.now() - start;
    } catch {
      return -1;
    }
  }

  private async measureRedisLatency(): Promise<number> {
    const start = Date.now();
    try {
      await this.redis.ping();
      return Date.now() - start;
    } catch {
      return -1;
    }
  }

  private async getQueueDepth(): Promise<number> {
    try {
      const depths = await Promise.all(
        Array.from(this.queues.values()).map(q => q.getWaitingCount())
      );
      return depths.reduce((sum, d) => sum + d, 0);
    } catch {
      return -1;
    }
  }

  private getMemoryUsage(): number {
    const used = process.memoryUsage();
    return Math.round((used.heapUsed / 1024 / 1024) * 100) / 100; // MB
  }

  private getCPUUsage(): number | undefined {
    // CPU usage requires more complex calculation
    // This is a placeholder - implement with proper CPU tracking
    return undefined;
  }

  /**
   * Express middleware for health check endpoint
   */
  expressMiddleware() {
    return async (req: any, res: any) => {
      try {
        const health = await this.checkHealth();
        const statusCode = health.healthy ? 200 : 503;
        
        res.status(statusCode).json(health);
      } catch (error) {
        res.status(503).json({
          healthy: false,
          timestamp: Date.now(),
          error: error instanceof Error ? error.message : 'Health check failed'
        });
      }
    };
  }

  /**
   * Cleanup connections
   */
  async cleanup() {
    await this.prisma.$disconnect();
    await this.redis.quit();
    await Promise.all(
      Array.from(this.queues.values()).map(q => q.close())
    );
  }
}

// Export singleton instance for use in application
export const healthCheck = new HealthCheckService();

// Export for testing
export default HealthCheckService;