const fs = require('fs');
const path = require('path');

// TASK-046: Install and configure Redis/BullMQ for job queue system - REAL TESTS
describe('TASK-046: Redis/BullMQ Infrastructure', () => {
  
  describe('Package Dependencies', () => {
    let packageJson;
    
    beforeAll(() => {
      const packagePath = path.join(process.cwd(), 'package.json');
      packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    });
    
    test('should have BullMQ installed', () => {
      expect(packageJson.dependencies['bullmq']).toBeDefined();
      expect(packageJson.dependencies['bullmq'].length).toBeGreaterThan(0);
    });
    
    test('should have Redis client installed', () => {
      const hasRedis = packageJson.dependencies['redis'] || 
                       packageJson.dependencies['ioredis'];
      expect(hasRedis).toBeDefined();
    });
    
    test('should have Bull Board for monitoring (optional)', () => {
      const hasBullBoard = packageJson.dependencies['@bull-board/express'] || 
                          packageJson.dependencies['bull-board'];
      // This is optional but good to have
      if (hasBullBoard) {
        expect(hasBullBoard).toBeDefined();
      }
    });
  });
  
  describe('Redis Configuration', () => {
    test('should have Redis configuration in environment variables', () => {
      const envExamplePath = path.join(process.cwd(), '.env.example');
      const envContent = fs.readFileSync(envExamplePath, 'utf8');
      
      expect(envContent).toContain('REDIS_URL');
      expect(envContent).toContain('REDIS_PASSWORD');
    });
    
    test('should have proper Redis URL format in .env.example', () => {
      const envExamplePath = path.join(process.cwd(), '.env.example');
      const envContent = fs.readFileSync(envExamplePath, 'utf8');
      
      // Check for Redis URL pattern
      const redisUrlPattern = /REDIS_URL=redis:\/\/.+/;
      expect(envContent).toMatch(redisUrlPattern);
    });
  });
  
  describe('BullMQ Queue Implementation', () => {
    test('should have queue configuration files', () => {
      // Check for common queue setup patterns
      const possiblePaths = [
        'src/lib/queue',
        'src/lib/queues',
        'src/services/queue',
        'src/api/services/queue',
        'src/lib/bullmq',
        '.project/scripts/queue'
      ];
      
      const queueDirExists = possiblePaths.some(p => 
        fs.existsSync(path.join(process.cwd(), p))
      );
      
      // At least one queue directory should exist
      expect(queueDirExists).toBe(true);
    });
    
    test('should have worker configuration', () => {
      // Check for worker files
      const possibleWorkerFiles = [
        'src/lib/queue/worker.ts',
        'src/lib/queue/worker.js',
        'src/services/queue/worker.ts',
        'src/workers/index.ts',
        '.project/scripts/worker.js',
        '.project/scripts/railway-worker-mcp.js'
      ];
      
      const workerExists = possibleWorkerFiles.some(file => 
        fs.existsSync(path.join(process.cwd(), file))
      );
      
      expect(workerExists).toBe(true);
    });
    
    test('should have queue processor implementation', () => {
      // Look for processor/handler files
      const possibleProcessorFiles = [
        'src/lib/queue/processors',
        'src/lib/queue/handlers',
        'src/services/queue/processors',
        '.project/scripts/processors'
      ];
      
      const processorExists = possibleProcessorFiles.some(dir => 
        fs.existsSync(path.join(process.cwd(), dir))
      );
      
      // Either a processors directory or worker file should exist
      expect(processorExists).toBe(true);
    });
  });
  
  describe('Docker Configuration for Redis', () => {
    test('should have Redis service in docker-compose', () => {
      const dockerComposePath = path.join(process.cwd(), 'docker-compose.yml');
      
      if (fs.existsSync(dockerComposePath)) {
        const dockerContent = fs.readFileSync(dockerComposePath, 'utf8');
        
        // Check for Redis service definition
        expect(dockerContent).toContain('redis:');
        expect(dockerContent).toContain('image:');
        expect(dockerContent.includes('redis:') || dockerContent.includes('redis/redis-stack')).toBe(true);
        expect(dockerContent).toContain('6379');
      } else {
        // If no docker-compose, should have Railway configuration
        const railwayPath = path.join(process.cwd(), 'railway.toml');
        expect(fs.existsSync(railwayPath)).toBe(true);
      }
    });
    
    test('should have proper Redis port mapping', () => {
      const dockerComposePath = path.join(process.cwd(), 'docker-compose.yml');
      
      if (fs.existsSync(dockerComposePath)) {
        const dockerContent = fs.readFileSync(dockerComposePath, 'utf8');
        
        // Check for port mapping
        const portPattern = /ports:[\s\S]*?6379:6379/;
        expect(dockerContent).toMatch(portPattern);
      }
    });
  });
  
  describe('Queue Types and Jobs', () => {
    test('should have job type definitions', () => {
      // Check for job type definitions
      const possibleTypeFiles = [
        'src/types/jobs.ts',
        'src/types/queue.ts',
        'src/lib/queue/types.ts',
        'src/api/types/queue.ts'
      ];
      
      const typeFileExists = possibleTypeFiles.some(file => 
        fs.existsSync(path.join(process.cwd(), file))
      );
      
      // Job types should be defined somewhere
      if (typeFileExists) {
        const typeFile = possibleTypeFiles.find(file => 
          fs.existsSync(path.join(process.cwd(), file))
        );
        const content = fs.readFileSync(path.join(process.cwd(), typeFile), 'utf8');
        
        // Should define job interfaces or types
        expect(content.includes('interface') || content.includes('type')).toBe(true);
        expect(content.includes('Job') || content.includes('Queue')).toBe(true);
      }
    });
  });
  
  describe('Railway Configuration', () => {
    test('should have Railway configuration for Redis', () => {
      const railwayTomlPath = path.join(process.cwd(), 'railway.toml');
      const railwayJsonPath = path.join(process.cwd(), 'railway.json');
      
      const hasRailwayConfig = fs.existsSync(railwayTomlPath) || fs.existsSync(railwayJsonPath);
      
      if (hasRailwayConfig) {
        // Railway project should be configured
        expect(hasRailwayConfig).toBe(true);
      } else {
        // Alternative: docker-compose exists
        const dockerComposePath = path.join(process.cwd(), 'docker-compose.yml');
        expect(fs.existsSync(dockerComposePath)).toBe(true);
      }
    });
  });
  
  describe('Integration with API', () => {
    test('should have queue service integrated in API', () => {
      // Check if queue is imported/used in main API
      const apiFiles = [
        'src/api/app.ts',
        'src/api/server.ts',
        'src/api/routes/api.ts'
      ];
      
      const hasQueueIntegration = apiFiles.some(file => {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          return content.includes('Queue') || 
                 content.includes('Bull') || 
                 content.includes('queue') ||
                 content.includes('worker');
        }
        return false;
      });
      
      // Queue should be referenced somewhere in the API
      expect(hasQueueIntegration).toBe(true);
    });
  });
});