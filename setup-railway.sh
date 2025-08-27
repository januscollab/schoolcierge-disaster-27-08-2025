#!/bin/bash

# School'cierge Railway Infrastructure Setup
# Completes TASK-001 and TASK-002: Initialize Railway project with PostgreSQL and Redis

set -e  # Exit on any error

echo "🚀 School'cierge Railway Infrastructure Setup"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m' 
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI not found. Installing..."
    npm install -g @railway/cli
    print_status "Railway CLI installed"
fi

print_status "Railway CLI found: $(railway --version)"

# Check authentication
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    print_error "Not logged in to Railway. Please run 'railway login' first"
    echo ""
    echo "Run this command in your terminal:"
    echo "  railway login"
    echo ""
    echo "Then run this script again."
    exit 1
fi

RAILWAY_USER=$(railway whoami)
print_status "Authenticated as: $RAILWAY_USER"

# Initialize or link Railway project
echo "📦 Setting up Railway project..."
if ! railway status &> /dev/null; then
    print_warning "No Railway project found. Creating new project..."
    
    # Create project with name
    railway init schoolcierge --name "School'cierge Platform"
    print_status "Railway project 'School'cierge Platform' created"
else
    print_status "Railway project already exists"
    railway status
fi

# Create environments
echo "🌍 Setting up environments..."

# Check if staging environment exists
if railway environment list | grep -q "staging"; then
    print_status "Staging environment already exists"
else
    print_warning "Creating staging environment..."
    railway environment create staging
    print_status "Staging environment created"
fi

# Check if production environment exists  
if railway environment list | grep -q "production"; then
    print_status "Production environment already exists"
else
    print_warning "Creating production environment..."
    railway environment create production
    print_status "Production environment created"
fi

# Link to staging for development
print_status "Linking to staging environment for setup..."
railway environment use staging

# Add PostgreSQL database
echo "🐘 Setting up PostgreSQL..."
if railway service list | grep -q "postgresql"; then
    print_status "PostgreSQL service already exists"
else
    print_warning "Adding PostgreSQL service..."
    railway add postgresql
    print_status "PostgreSQL service added"
fi

# Add Redis cache
echo "🔴 Setting up Redis..."
if railway service list | grep -q "redis"; then
    print_status "Redis service already exists"
else
    print_warning "Adding Redis service..."
    railway add redis  
    print_status "Redis service added"
fi

# Set essential environment variables
echo "⚙️  Setting environment variables..."

# Set basic configuration
railway variables set NODE_ENV=staging
railway variables set API_PORT=3000
railway variables set LOG_LEVEL=info

print_status "Basic environment variables set"

# Generate domain
echo "🌐 Setting up domain..."
if railway domain list | grep -q "railway.app"; then
    DOMAIN=$(railway domain list | grep "railway.app" | head -1 | awk '{print $1}')
    print_status "Domain already exists: https://$DOMAIN"
else
    print_warning "Generating domain..."
    railway domain generate
    sleep 2
    DOMAIN=$(railway domain list | grep "railway.app" | head -1 | awk '{print $1}')
    print_status "Domain generated: https://$DOMAIN"
fi

# Create .env.example with the structure
echo "📝 Creating environment configuration template..."
cat > .env.example << EOF
# Railway Environment Variables
NODE_ENV=development
API_PORT=3000
LOG_LEVEL=debug

# Database (Railway will provide these automatically)
DATABASE_URL=postgresql://username:password@host:port/database
REDIS_URL=redis://host:port

# Authentication - Clerk (get from clerk.dev dashboard)
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# AI Services
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# WhatsApp Integration - 2Chat.io
WHAPI_API_KEY=...
WHAPI_API_URL=https://gate.whapi.cloud

# Email Integration - Mailgun  
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=...
MAILGUN_WEBHOOK_SECRET=...

# SMS Fallback - Twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# Application URLs
APP_URL=https://schoolcierge.app
API_URL=https://api.schoolcierge.app
WEB_URL=https://app.schoolcierge.app
EOF

print_status "Environment template created (.env.example)"

# Display Railway project info
echo ""
echo "📊 Railway Project Summary"
echo "=========================="
railway status

echo ""
echo "🎯 Available Services:"
railway service list

echo ""
echo "🌍 Environments:"  
railway environment list

echo ""
echo "🔗 Domains:"
railway domain list

echo ""
print_status "Railway infrastructure setup completed!"

echo ""
echo "📋 Next Steps:"
echo "1. Set up your API keys in Railway dashboard or via CLI:"
echo "   railway variables set CLERK_SECRET_KEY=sk_test_..."
echo "   railway variables set ANTHROPIC_API_KEY=sk-ant-..."
echo ""
echo "2. Deploy your application:"
echo "   railway up"
echo ""
echo "3. Monitor your services:"
echo "   railway logs"
echo ""
echo "4. Access Railway dashboard:"
echo "   railway open"

echo ""
print_status "TASK-001 and TASK-002 completed successfully! ✨"