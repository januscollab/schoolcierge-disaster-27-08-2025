# Clerk Authentication Setup

## Status

✅ Clerk packages already installed in backup project
⚠️ No actual implementation found - just package dependencies

## Required Packages (from backup)

```json
"@clerk/backend": "^2.9.4",
"@clerk/clerk-sdk-node": "^5.1.6",
"@clerk/express": "^1.7.24"
```

## Environment Variables Required

```bash
# From .env.example
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
CLERK_WEBHOOK_SECRET=
```

## Basic Implementation Needed

### 1. Express Middleware Setup

```javascript
// src/middleware/auth.ts
import { clerkMiddleware } from '@clerk/express';

export const authMiddleware = clerkMiddleware({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
});
```

### 2. Protected Routes

```javascript
// src/middleware/requireAuth.ts
import { requireAuth } from '@clerk/express';

export const requireAuthMiddleware = requireAuth({
  onError: (error) => {
    console.error('Auth error:', error);
  },
});
```

### 3. User Context

```javascript
// src/utils/auth.ts
import { getAuth } from '@clerk/express';

export const getUserFromRequest = (req) => {
  const auth = getAuth(req);
  return auth.userId;
};
```

## Next Steps

1. Create Clerk account and get API keys
2. Implement middleware in Express app
3. Add webhook handler for user events
4. Test authentication flow

## Related Tasks

- TASK-003: Authentication Implementation (marked as complete but needs actual code)
- TASK-005: Express API Setup (has Clerk packages installed)
