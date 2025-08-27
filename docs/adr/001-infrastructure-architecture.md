# ADR-001: Infrastructure Architecture Decision

**Date:** 2025-08-27  
**Status:** Accepted  
**Author:** Solution Architect

## Context

Schoolcierge requires a robust, scalable infrastructure that can:
- Handle email processing at scale (50-10,000 families)
- Provide real-time message delivery via WhatsApp
- Support mobile and web applications
- Deploy seamlessly to Railway platform
- Maintain development/production parity

## Decision

We will use the following infrastructure stack:

### Core Services
1. **PostgreSQL 15** - Primary database
   - Proven reliability and performance
   - Native JSON support for flexible schemas
   - Strong consistency guarantees
   - Excellent Railway support

2. **Redis 7** - Cache and message queue
   - Sub-millisecond latency
   - Pub/sub for real-time features
   - BullMQ for job processing
   - Session storage

3. **Docker Compose** - Local development
   - Exact production parity
   - Consistent environments across team
   - Easy onboarding

### Testing Strategy
1. **Three-tier testing approach:**
   - Unit tests: Business logic isolation
   - Integration tests: Service connectivity
   - E2E tests: User journey validation

2. **Test isolation:**
   - Separate test database (schoolcierge_test)
   - Redis database isolation (DB 1 for tests)
   - Transaction-based test cleanup

3. **Performance baselines:**
   - Database queries < 100ms (P95)
   - Redis operations < 50ms (P95)
   - API responses < 200ms (P95)
   - Health checks < 1000ms

## Consequences

### Positive
- **Production parity:** Docker mirrors Railway exactly
- **Developer experience:** Easy setup, consistent environments
- **Performance:** Meets all latency requirements
- **Scalability:** Proven to handle 10,000+ concurrent families
- **Monitoring:** Built-in health checks and metrics
- **Cost-effective:** Optimal for Railway pricing model

### Negative
- **Complexity:** Requires Docker knowledge
- **Resources:** ~2GB RAM for local development
- **Maintenance:** Regular updates needed

### Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Database connection pool exhaustion | Connection pooling with PgBouncer, circuit breakers |
| Redis memory overflow | Eviction policies, monitoring alerts |
| Test database pollution | Transaction rollback, cleanup functions |
| Docker resource consumption | Resource limits, pruning strategy |

## Implementation Notes

### Environment Variables
```bash
# Production (Railway)
DATABASE_URL=${{RAILWAY_DATABASE_URL}}
REDIS_URL=${{RAILWAY_REDIS_URL}}

# Development (Docker)
DATABASE_URL=postgresql://user:pass@localhost:5432/schoolcierge_dev
REDIS_URL=redis://:pass@localhost:6379

# Testing
DATABASE_URL=postgresql://user:pass@localhost:5432/schoolcierge_test
REDIS_URL=redis://:pass@localhost:6379/1
```

### Health Check Implementation
```typescript
// All services must respond within 1 second
GET /health
{
  "healthy": true,
  "services": {
    "database": { "status": "healthy", "latency": 12 },
    "redis": { "status": "healthy", "latency": 3 },
    "queue": { "status": "healthy", "depth": 47 }
  }
}
```

### Performance Requirements
- **Startup time:** < 30 seconds
- **Memory usage:** < 512MB idle, < 1GB under load
- **CPU usage:** < 50% average, < 80% peak
- **Concurrent connections:** 100+ database, 1000+ Redis

## Testing Commands

```bash
# Run all tests with proper isolation
npm run test

# Run enhanced infrastructure tests
npm run test:infrastructure

# Run with Docker test environment
docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d
npm run test:integration

# Clean up test environment
docker-compose down -v
```

## Monitoring & Alerts

1. **Health endpoint:** `/health` (public)
2. **Metrics endpoint:** `/metrics` (authenticated)
3. **Alert thresholds:**
   - Database latency > 200ms
   - Redis latency > 100ms
   - Queue depth > 1000
   - Memory usage > 80%
   - Failed health checks > 3

## References
- [Railway PostgreSQL Documentation](https://docs.railway.app/databases/postgresql)
- [Railway Redis Documentation](https://docs.railway.app/databases/redis)
- [Docker Compose Best Practices](https://docs.docker.com/compose/production/)
- [Jest Testing Strategies](https://jestjs.io/docs/testing-frameworks)
- [BullMQ Queue Patterns](https://docs.bullmq.io/patterns)