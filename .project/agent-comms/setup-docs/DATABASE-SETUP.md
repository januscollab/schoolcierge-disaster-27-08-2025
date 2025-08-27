# Database Setup

## Status

✅ Prisma schema copied from backup
✅ Database models defined for core entities

## Schema Overview

### Core Models

- **Family**: Parents/guardians with contact info
- **School**: Schools with email domains
- **Student**: Students linked to families and schools
- **Email**: Raw emails from schools
- **Message**: Processed messages for families
- **Interaction**: User interactions with messages
- **Feedback**: User feedback on messages

### Monitoring Models

- **Metric**: Performance metrics
- **ErrorLog**: Error tracking
- **AuditLog**: Audit trail

## Setup Instructions

1. **Install Prisma**

```bash
npm install prisma @prisma/client
```

2. **Initialize Database**

```bash
# Generate Prisma client
npx prisma generate

# Create initial migration
npx prisma migrate dev --name init

# Push to production
npx prisma migrate deploy
```

3. **Local Development**

```bash
# Start PostgreSQL with Docker
docker-compose up postgres -d

# Apply migrations
npx prisma migrate dev
```

4. **Environment Variables**

```bash
DATABASE_URL=postgresql://schoolcierge_user:localdev123@localhost:5432/schoolcierge_dev
```

## Docker Services

- PostgreSQL on port 5432
- pgAdmin on port 8080 (admin@schoolcierge.dev / admin123)
- Redis on port 6379
- Redis Commander on port 8081

## Related Tasks

- TASK-006: Database Design & Prisma Setup (schema ready)
- TASK-018: GDPR Compliance (audit tables included)
