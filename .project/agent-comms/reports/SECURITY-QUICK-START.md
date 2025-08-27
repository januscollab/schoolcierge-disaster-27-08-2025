# 🚀 Security Implementation Quick Start Guide

## Immediate Actions Required (30 minutes)

### 1. Fix XSS Vulnerability (10 minutes)

```bash
# Install dependencies
cd /Users/alanmahon/dev.env/projects/schoolcierge
npm install dompurify jsdom

# Apply the patch
cp .project/scripts/dashboard-html.js .project/scripts/dashboard-html.js.backup
```

Then edit `.project/scripts/dashboard-html.js`:
- Add at line 7: `const { escapeHTML, sanitizeNumber } = require('./utils/html-sanitizer');`
- Replace ALL instances of `${task.id}` with `${escapeHTML(task.id)}`
- Replace ALL instances of `${task.title}` with `${escapeHTML(task.title)}`
- Replace ALL instances of `${task.priority}` with `${escapeHTML(task.priority)}`
- Replace ALL instances of `${task.category}` with `${escapeHTML(task.category)}`
- Replace ALL instances of `${task.progress}` with `${sanitizeNumber(task.progress)}`

### 2. Setup Authentication (15 minutes)

```bash
# Install auth dependencies
npm install @clerk/express express-rate-limit

# Copy secure router
cp src/api/routes/families-secure.ts src/api/routes/families.ts
```

Update `src/api/app.ts` or main server file:
```typescript
import { clerkMiddleware } from '@clerk/express';

// Add before routes
app.use(clerkMiddleware());
```

### 3. Test Security Fixes (5 minutes)

```bash
# Make test script executable
chmod +x .project/agent-comms/reports/security-test-suite.sh

# Run security tests
.project/agent-comms/reports/security-test-suite.sh
```

---

## Environment Variables Required

Add to `.env`:
```env
# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_SECRET=<generate-random-32-char-string>
```

---

## Testing Checklist

### XSS Testing
```bash
# Test with malicious input
echo '[{"id":"<script>alert(1)</script>","title":"XSS Test"}]' > test.json
cp test.json .project/tasks/backlog.json
node .project/scripts/dashboard-html.js

# Check output - should show escaped &lt;script&gt;
grep "&lt;script" .project/tasks/dashboard.html
```

### API Authentication Testing
```bash
# Should return 401 Unauthorized
curl -I http://localhost:3000/api/families

# With valid token (get from Clerk dashboard)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/families
```

### Rate Limiting Testing
```bash
# Send 101 requests rapidly
for i in {1..101}; do curl http://localhost:3000/api/families; done
# Request 101 should return 429 Too Many Requests
```

---

## Deployment Steps

### 1. Staging Deployment (Day 1)
```bash
# Deploy to staging
git checkout -b security/critical-fixes
git add -A
git commit -m "fix: Critical security vulnerabilities - XSS and authentication"
git push origin security/critical-fixes

# Deploy to Railway staging
railway up --environment staging
```

### 2. Production Deployment (After Testing)
```bash
# After staging validation
git checkout main
git merge security/critical-fixes
git push origin main

# Deploy to production
railway up --environment production
```

---

## Monitoring Setup

Add to your monitoring service:

```javascript
// Security event tracking
const securityEvents = {
  authFailure: (userId, ip) => {
    logger.warn('AUTH_FAILURE', { userId, ip, timestamp: new Date() });
    if (getFailureCount(ip) > 5) {
      alerting.trigger('POSSIBLE_BRUTE_FORCE', { ip });
    }
  },
  
  xssAttempt: (input, source) => {
    logger.error('XSS_ATTEMPT', { input, source, timestamp: new Date() });
    alerting.trigger('XSS_ATTEMPT_DETECTED', { source });
  },
  
  rateLimitExceeded: (ip, endpoint) => {
    logger.warn('RATE_LIMIT_EXCEEDED', { ip, endpoint });
  }
};
```

---

## Verification Commands

```bash
# Verify XSS protection
npm run test:security:xss

# Verify authentication
npm run test:security:auth

# Verify rate limiting  
npm run test:security:rate-limit

# Full security scan
npm audit
npm run security:full-scan
```

---

## Emergency Rollback

If issues occur after deployment:

```bash
# Immediate rollback
git revert HEAD
git push origin main
railway up --environment production

# Or use Railway's rollback
railway rollback --environment production
```

---

## Contact for Issues

- **Security Issues**: Security Consultant Agent
- **Deployment Issues**: Infrastructure DevOps Agent
- **Database Issues**: Database Schema Agent
- **Emergency**: Create P0 incident in #security-critical

---

**Time to Implementation: 30 minutes**  
**Testing Time: 15 minutes**  
**Total Time: 45 minutes**

✅ Follow these steps in order for successful security remediation.