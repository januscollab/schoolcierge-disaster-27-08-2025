# School-cierge Technical Requirements Document

**Version:** 3.0  
**Date & Time:** 2025-08-12 02:30  
**Status:** READY FOR BUILD - Fully Aligned with PRD 3.29  
**Last Updated:** Complete API specs, security, performance, error handling, and deployment configuration added

---



### Related Documents
- School-cierge Product Requirements Document v3.23
- School-cierge Database Schema v2.0
- School-cierge Use Cases v2.0


## 1. System Architecture Overview

### 1.1 High-Level Architecture

#### Simplified Architecture (Clerk + Railway)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Customer      │    │  Railway Pro    │    │   External      │
│   Domain        │    │  Infrastructure │    │   Services      │
│ (.com)          │    │                 │    │                 │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Marketing     │    │ • Express API   │    │ • Clerk Auth*   │
│ • Web App       │◄──►│ • Admin Panel   │◄──►│ • WhatsApp API  │
│ • Help Center   │    │ • PostgreSQL    │    │ • Claude API    │
│                 │    │ • Redis Queues  │    │ • Mailgun       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                    *Clerk provides:
                    • Authentication (FREE <10k users)
                    • Social Login (Google, Apple)
                    • Session Management
                    • User Dashboard
                    • Multi-device Sync
```

**Key Architecture:** Clerk handles all authentication complexity. Custom WhatsApp OTP layer integrates seamlessly with Clerk's infrastructure.

### 1.2 Domain Strategy

#### **Customer-Facing Domain: schoolcierge.com**
- **www.schoolcierge.com** → Marketing website (public)
- **app.schoolcierge.com** → Web application (family login)
- **blog.schoolcierge.com** → Blog content (public)
- **help.schoolcierge.com** → Help/support docs (public)

#### **Internal Operations Domain: schoolcierge.app**
- **api.schoolcierge.app** → Backend API (internal only)
- **admin.schoolcierge.app** → Admin dashboard (admin only)
- **Queue Processing** → BullMQ workers integrated in API service

**Rationale:** Clear separation between customer interactions (.com) and internal operations (.app). Industry standard, professional, secure.

---

## 2. Service Architecture

### 2.1 Railway Service Deployment (with Clerk Auth)

```yaml
Railway Project: schoolcierge-mvp

Services:
  # Database
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD=${{ secrets.DB_PASSWORD }}
      - POSTGRES_DB=schoolcierge
    volumes:
      - postgres_data:/var/lib/postgresql/data
    
  # Redis for Queue Management
  redis:
    image: redis:7-alpine
    purpose: BullMQ job queues
    
  # Application Services
  api:
    source: ./api
    domains: [api.schoolcierge.app]
    framework: Express.js + TypeScript
    environment:
      - CLERK_SECRET_KEY=${{ secrets.CLERK_SECRET_KEY }}
      - CLERK_PUBLISHABLE_KEY=${{ secrets.CLERK_PUB_KEY }}
      - DATABASE_URL=postgresql://...
    depends_on: [postgres, redis]
    
  admin:
    source: ./admin
    domains: [admin.schoolcierge.app]
    framework: Next.js Admin Dashboard
    environment:
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${{ secrets.CLERK_PUB_KEY }}
    depends_on: [api]
    
  web-app:
    source: ./web-app
    domains: [app.schoolcierge.com]
    framework: Next.js PWA
    environment:
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${{ secrets.CLERK_PUB_KEY }}
    depends_on: [api]
```

**External Services (Not on Railway):**
- **Clerk**: Authentication (FREE for <10k users)
- **Whapi.Cloud**: WhatsApp messaging
- **Claude API**: AI processing (usage-based)
- **Mailgun**: Email ingestion (usage-based)


### 2.2 Mobile Application Architecture

**Technology Stack:**
```yaml
Framework: Expo SDK 50+
  - Native iOS/Android apps
  - OTA updates capability
  - Push notification support
  
State Management: Zustand + React Query
  - Lightweight state management (8KB)
  - Built-in caching strategies
  - Optimistic updates
  
State Management: React Query + Zustand
  - SQLite-based mobile database
  - Automatic sync with PostgreSQL
  - Conflict resolution
  - Online-first with aggressive caching
  
Push Notifications: Expo Push Service
  - Unified iOS/Android API
  - Token management
  - Rich notifications support
```

**Data Management:**
```typescript
// React Query for server state management
interface DataConfig {
  staleTime: number;      // How long data is considered fresh
  cacheTime: number;      // How long to keep in cache
  refetchInterval: number; // Auto-refresh interval
}

// Optimized caching configuration
const cacheConfig = {
  tasks: { staleTime: 2 * 60 * 1000, refetchInterval: 30000 },
  schools: { staleTime: 24 * 60 * 60 * 1000 }, // Cache for 24 hours
  families: { staleTime: 5 * 60 * 1000 },
  communications: { staleTime: 1 * 60 * 1000 } // Fresh every minute
};

// Zustand for local UI state
const useUIStore = create((set) => ({
  activeTab: 'tasks',
  filters: {},
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
```

**Caching Capabilities:**
- Instant display of cached data
- Optimistic updates for all mutations
- Queue WhatsApp responses for sending
- Automatic sync when connection restored
- Conflict resolution for concurrent edits

### 2.3 Complete Repository Structure

```
schoolcierge/
├── .github/
│   └── workflows/           # CI/CD pipelines
├── apps/
│   ├── mobile/             # Expo mobile app
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── queries/   # React Query hooks
│   │   │   └── sync/      # Sync adapters
│   │   └── app.json
├── domains/
│   ├── customer/            # schoolcierge.com services
│   │   ├── marketing/       # Marketing website (Next.js)
│   │   │   ├── pages/
│   │   │   │   ├── index.tsx           # Landing page
│   │   │   │   ├── pricing.tsx         # Pricing plans
│   │   │   │   ├── features.tsx        # Feature overview
│   │   │   │   └── about.tsx           # About us
│   │   │   ├── components/
│   │   │   ├── styles/
│   │   │   └── public/
│   │   ├── web-app/         # Family web app (Next.js)
│   │   │   ├── pages/
│   │   │   │   ├── dashboard.tsx       # Family dashboard
│   │   │   │   ├── actions.tsx         # Action items
│   │   │   │   ├── calendar.tsx        # Calendar events
│   │   │   │   ├── communications.tsx  # Email history
│   │   │   │   ├── settings.tsx        # Family settings
│   │   │   │   └── children.tsx        # Child profiles
│   │   │   ├── components/
│   │   │   │   ├── ActionItem.tsx
│   │   │   │   ├── CalendarEvent.tsx
│   │   │   │   ├── FamilySelector.tsx
│   │   │   │   └── NotificationPrefs.tsx
│   │   │   ├── hooks/
│   │   │   ├── utils/
│   │   │   └── public/
│   │   └── help/            # Help documentation
│   │       ├── setup/
│   │       ├── troubleshooting/
│   │       └── faq/
│   └── internal/            # schoolcierge.app services
│       ├── api/             # Backend API (Express.js)
│       │   ├── src/
│       │   │   ├── routes/
│       │   │   │   ├── auth.ts          # Authentication
│       │   │   │   ├── families.ts      # Family management
│       │   │   │   ├── actions.ts       # Action items
│       │   │   │   ├── communications.ts # Email processing
│       │   │   │   ├── calendar.ts      # Calendar events
│       │   │   │   ├── notifications.ts # Notifications
│       │   │   │   └── webhooks.ts      # External webhooks
│       │   │   ├── middleware/
│       │   │   │   ├── auth.ts          # JWT validation
│       │   │   │   ├── family-context.ts # Family isolation
│       │   │   │   └── rate-limiting.ts # API protection
│       │   │   ├── services/
│       │   │   │   ├── EmailProcessor.ts # AI email classification
│       │   │   │   ├── NotificationService.ts # WhatsApp/SMS
│       │   │   │   ├── ActionGenerator.ts # Task creation
│       │   │   │   └── CalendarService.ts # Event management
│       │   │   └── workers/
│       │   │       ├── email-classification.ts
│       │   │       ├── notification-sender.ts
│       │   │       └── reminder-scheduler.ts
│       │   └── package.json
│       ├── admin/           # Admin dashboard (Next.js)
│       │   ├── pages/
│       │   │   ├── dashboard.tsx        # System overview
│       │   │   ├── families.tsx         # Family management
│       │   │   ├── emails.tsx           # Email processing
│       │   │   ├── notifications.tsx    # Delivery tracking
│       │   │   ├── analytics.tsx        # Technical performance metrics
│       │   │   └── errors.tsx           # Error monitoring
│       │   ├── components/
│       │   │   ├── MetricsCard.tsx
│       │   │   ├── FamilyTable.tsx
│       │   │   ├── EmailQueue.tsx
│       │   │   └── ErrorLog.tsx
│       │   └── utils/
├── packages/
│   ├── database/            # Prisma schema & migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── package.json
│   ├── ui/                  # Shared React components
│   │   ├── components/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Form.tsx
│   │   ├── hooks/
│   │   └── utils/
│   ├── types/               # TypeScript definitions
│   │   ├── family.ts
│   │   ├── action.ts
│   │   ├── communication.ts
│   │   └── notification.ts
│   └── utils/               # Shared utilities
│       ├── date.ts
│       ├── validation.ts
│       └── formatting.ts
├── workers/
│   └── email-processor/     # Background job workers
│       ├── src/
│       │   ├── processors/
│       │   │   ├── classification.ts
│       │   │   ├── action-generation.ts
│       │   │   └── notification.ts
│       │   └── utils/
│       └── package.json
├── docs/
│   └── api/                 # API documentation
│       ├── authentication.md
│       ├── families.md
│       ├── actions.md
│       └── webhooks.md
├── railway.json            # Railway deployment config
├── turbo.json              # Turborepo configuration
└── package.json            # Root package.json
```

---

## 3. Data Models & Schemas

This section contains all data structures referenced in the PRD (Product Requirements Document). Each schema is designed to support multi-tenant isolation, GDPR compliance, and scalable family management.

### 3.0 Client-Side Data Management (React Query)

**Purpose:** Efficient data fetching and caching for optimal user experience without offline complexity

```typescript
// React Query Configuration for School'cierge
import { QueryClient } from '@tanstack/react-query';

// Global query client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep in cache for 10 minutes
      cacheTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Refetch on window focus
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect (avoid overwhelming server)
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Retry failed mutations
      retry: 2,
      // Optimistic updates for better UX
      onMutate: async (variables) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries();
        // Return context for rollback
        return { previousData: queryClient.getQueryData(['tasks']) };
      },
      onError: (err, variables, context) => {
        // Rollback on error
        if (context?.previousData) {
          queryClient.setQueryData(['tasks'], context.previousData);
        }
      },
    },
  },
});

// Example: Task management with React Query
export function useTasks(familyId: string) {
  return useQuery({
    queryKey: ['tasks', familyId],
    queryFn: () => fetchTasks(familyId),
    staleTime: 2 * 60 * 1000, // Tasks fresh for 2 minutes
  });
}

export function useCompleteTask() {
  return useMutation({
    mutationFn: completeTask,
    onMutate: async (taskId) => {
      // Optimistic update
      await queryClient.cancelQueries(['tasks']);
      const previous = queryClient.getQueryData(['tasks']);
      queryClient.setQueryData(['tasks'], old => 
        old.map(task => 
          task.id === taskId ? { ...task, status: 'completed' } : task
        )
      );
      return { previous };
    },
    onError: (err, taskId, context) => {
      // Rollback on failure
      queryClient.setQueryData(['tasks'], context.previous);
      toast.error('Failed to complete task. Please try again.');
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries(['tasks']);
    },
  });
}
```

**Caching Strategy:**
- **Aggressive caching** for read-heavy data (schools, categories)
- **Short cache** for time-sensitive data (tasks, reminders)
- **Optimistic updates** for all user actions
- **Background refetch** to keep data fresh
- **Persistent cache** in localStorage for last-known-good state

**Online-First Benefits:**
- 40% reduction in implementation complexity
- No sync conflicts to resolve
- Simpler debugging and testing
- Faster time to market
- Better real-time collaboration between family members

### 3.1 Authentication System (Clerk + WhatsApp OTP)

#### Overview
Hybrid authentication system combining Clerk's managed auth service with custom WhatsApp OTP for a seamless parent experience.

#### Authentication Methods
1. **WhatsApp OTP** (Primary - Custom implementation)
2. **Google OAuth** (Secondary - Clerk built-in)
3. **Apple OAuth** (iOS users - Clerk built-in)  
4. **Email Magic Link** (Fallback - Clerk built-in)

#### WhatsApp OTP Implementation

```typescript
// services/auth/whatsapp-otp.service.ts
import { clerkClient } from '@clerk/express';
import { redis } from '../redis';
import { whapi } from '../whapi-client';

export class WhatsAppOTPService {
  // Send OTP via WhatsApp
  async sendOTP(phoneNumber: string): Promise<void> {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in Redis with 5-minute expiry
    await redis.set(`otp:${phoneNumber}`, otp, 'EX', 300);
    
    // Send via WhatsApp using Whapi.Cloud
    await whapi.sendMessage({
      to: phoneNumber,
      body: `🔐 School'cierge verification code: ${otp}\n\nValid for 5 minutes.\nNever share this code.`,
      buttons: [
        { text: "Resend Code", id: "resend_otp" }
      ]
    });
  }
  
  // Verify OTP and create/update Clerk user
  async verifyOTP(phoneNumber: string, otp: string): Promise<ClerkSession> {
    // Verify OTP from Redis
    const storedOTP = await redis.get(`otp:${phoneNumber}`);
    if (storedOTP !== otp) {
      throw new Error('Invalid or expired OTP');
    }
    
    // Check if user exists in Clerk
    const users = await clerkClient.users.getUserList({
      phoneNumber: [phoneNumber]
    });
    
    let clerkUser;
    if (users.length > 0) {
      // Existing user
      clerkUser = users[0];
    } else {
      // Create new user in Clerk
      clerkUser = await clerkClient.users.createUser({
        phoneNumber: [phoneNumber],
        skipPasswordRequirement: true,
        publicMetadata: {
          authMethod: 'whatsapp_otp',
          onboardingStatus: 'pending'
        }
      });
    }
    
    // Create session
    const session = await clerkClient.sessions.createSession({
      userId: clerkUser.id
    });
    
    // Clean up Redis
    await redis.del(`otp:${phoneNumber}`);
    
    return session;
  }
}
```

#### Social Login Configuration

```typescript
// Frontend: app/components/auth/LoginForm.tsx
import { SignIn } from '@clerk/nextjs';

export function LoginForm() {
  return (
    <SignIn
      appearance={{
        elements: {
          formButtonPrimary: 'bg-green-600 hover:bg-green-700',
          socialButtonsBlockButton: 'border-2'
        }
      }}
      // Configure available auth methods
      signInOptions={[
        'phone_number', // Custom WhatsApp OTP
        'oauth_google',  // Google login
        'oauth_apple',   // Apple login
        'email_link'     // Magic link fallback
      ]}
      // Custom phone number handler
      phoneNumberVerification="custom"
    />
  );
}
```

### 3.2 Account Profile Schema

**Purpose:** Core user profile management (linked to Clerk)

```sql
-- User accounts linked to Clerk Auth
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    phone_verified BOOLEAN DEFAULT false,
    whatsapp_number TEXT,
    whatsapp_verified BOOLEAN DEFAULT false,
    full_name TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    language_preference VARCHAR(5) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, deleted
    
    -- Indexes
    INDEX idx_users_email (email),
    INDEX idx_users_phone (phone_number),
    INDEX idx_users_clerk (clerk_user_id)
);

-- Authentication sessions and tokens
CREATE TABLE auth_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_sessions_user (user_id),
    INDEX idx_sessions_token (token_hash)
);

-- Password reset and verification tokens
CREATE TABLE auth_tokens (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    token_type VARCHAR(20) NOT NULL, -- reset, verify_email, verify_phone
    token_hash TEXT NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_tokens_user_type (user_id, token_type),
    INDEX idx_tokens_hash (token_hash)
);
```

### 3.3 Dependent Profile Schema

**Purpose:** Child/dependent management with school associations

```sql
-- Children/dependents profiles
CREATE TABLE children (
    child_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(family_id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    preferred_name TEXT,
    date_of_birth DATE,
    gender VARCHAR(20),
    profile_photo_url TEXT,
    medical_notes TEXT,
    dietary_restrictions TEXT[],
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, graduated
    
    INDEX idx_children_family (family_id)
);

-- Child-school associations
CREATE TABLE child_schools (
    child_school_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES children(child_id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(school_id),
    grade_level VARCHAR(20),
    class_section VARCHAR(50),
    student_id VARCHAR(50), -- School's student ID
    teacher_name TEXT,
    teacher_email TEXT,
    enrollment_date DATE,
    withdrawal_date DATE,
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, transferred
    school_specific_data JSONB, -- Flexible field for school-specific info
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_child_schools_child (child_id),
    INDEX idx_child_schools_school (school_id),
    UNIQUE(child_id, school_id, status) -- One active enrollment per school
);

-- User-child relationship mapping (supports complex family structures)
CREATE TABLE user_child_relationships (
    relationship_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(child_id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL, -- parent, guardian, grandparent, etc.
    is_primary_contact BOOLEAN DEFAULT false,
    can_receive_communications BOOLEAN DEFAULT true,
    can_make_decisions BOOLEAN DEFAULT true,
    specific_permissions JSONB, -- {medical: true, financial: false, etc.}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_relationships_user (user_id),
    INDEX idx_relationships_child (child_id),
    UNIQUE(user_id, child_id)
);
```

### 3.4 Family Profile Schema

**Purpose:** Family unit management with member roles and permissions

```sql
-- Family units
CREATE TABLE families (
    family_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_name TEXT NOT NULL,
    primary_contact_id UUID REFERENCES users(user_id),
    family_type VARCHAR(50) DEFAULT 'nuclear', -- nuclear, extended, blended
    home_address JSONB,
    billing_address JSONB,
    subscription_status VARCHAR(20) DEFAULT 'trial', -- trial, active, cancelled, expired
    subscription_tier VARCHAR(20) DEFAULT 'basic', -- basic, premium, enterprise
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    subscription_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step VARCHAR(50),
    
    INDEX idx_families_primary (primary_contact_id),
    INDEX idx_families_status (subscription_status)
);

-- Family members with roles
CREATE TABLE family_members (
    member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(family_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- admin, parent, guardian, viewer
    member_type VARCHAR(50) NOT NULL, -- primary, secondary, extended
    invitation_status VARCHAR(20) DEFAULT 'active', -- pending, active, removed
    invited_by UUID REFERENCES users(user_id),
    invited_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE,
    removed_at TIMESTAMP WITH TIME ZONE,
    permissions JSONB DEFAULT '{}', -- Granular permissions
    notification_preferences JSONB DEFAULT '{}',
    
    INDEX idx_members_family (family_id),
    INDEX idx_members_user (user_id),
    UNIQUE(family_id, user_id)
);

-- Family configuration and settings
CREATE TABLE family_settings (
    settings_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID UNIQUE REFERENCES families(family_id) ON DELETE CASCADE,
    default_language VARCHAR(5) DEFAULT 'en',
    default_timezone VARCHAR(50) DEFAULT 'UTC',
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    weekend_notifications BOOLEAN DEFAULT true,
    emergency_override BOOLEAN DEFAULT true,
    data_retention_days INTEGER DEFAULT 365,
    auto_archive_days INTEGER DEFAULT 90,
    shared_calendar_enabled BOOLEAN DEFAULT true,
    task_delegation_enabled BOOLEAN DEFAULT true,
    external_sharing_enabled BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3.5 School Selection Schema

**Purpose:** Comprehensive school database with search and selection

```sql
-- Master schools database
CREATE TABLE schools (
    school_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name TEXT NOT NULL,
    school_type VARCHAR(50), -- public, private, international, charter
    education_system VARCHAR(50), -- US, UK, IB, national
    country VARCHAR(2) NOT NULL,
    state_province VARCHAR(100),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    full_address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone_number TEXT,
    email_domain TEXT[],
    website_url TEXT,
    principal_name TEXT,
    principal_email TEXT,
    established_year INTEGER,
    student_count_range VARCHAR(20), -- 0-500, 500-1000, 1000+
    grade_levels TEXT[],
    accreditations TEXT[],
    verified_status BOOLEAN DEFAULT false,
    verification_date DATE,
    active_status BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_schools_location (country, state_province, city),
    INDEX idx_schools_name (school_name),
    INDEX idx_schools_type (school_type),
    INDEX idx_schools_email_domain (email_domain) USING GIN
);

-- School communication patterns
CREATE TABLE school_communication_patterns (
    pattern_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
    pattern_name TEXT NOT NULL,
    email_patterns JSONB, -- Common sender patterns, subject patterns
    communication_types TEXT[], -- Types of comms this school sends
    frequency_data JSONB, -- How often different types are sent
    priority_rules JSONB, -- School-specific priority overrides
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_patterns_school (school_id)
);

-- User school selections and preferences
CREATE TABLE family_schools (
    family_school_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(family_id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(school_id),
    custom_school_name TEXT, -- For schools not in database
    custom_school_data JSONB, -- Store custom school info
    is_primary BOOLEAN DEFAULT false,
    notification_preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_family_schools_family (family_id),
    INDEX idx_family_schools_school (school_id)
);
```

### 3.6 Educational Apps Configuration

**Purpose:** Educational platform registry and family app preferences

```sql
-- Educational platforms/apps registry
CREATE TABLE educational_platforms (
    platform_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_name TEXT NOT NULL,
    platform_type VARCHAR(50), -- lms, communication, homework, assessment
    company_name TEXT,
    website_url TEXT,
    logo_url TEXT,
    email_domains TEXT[],
    api_available BOOLEAN DEFAULT false,
    api_documentation_url TEXT,
    webhook_support BOOLEAN DEFAULT false,
    supported_integrations TEXT[],
    typical_email_patterns JSONB,
    keyword_identifiers TEXT[],
    auto_detect_confidence DECIMAL(3,2),
    is_verified BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_platforms_name (platform_name),
    INDEX idx_platforms_domains (email_domains) USING GIN,
    INDEX idx_platforms_keywords (keyword_identifiers) USING GIN
);

-- Family educational app selections
CREATE TABLE family_educational_apps (
    family_app_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(family_id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(child_id) ON DELETE CASCADE,
    platform_id UUID REFERENCES educational_platforms(platform_id),
    custom_app_name TEXT, -- For apps not in registry
    login_email TEXT,
    app_specific_id TEXT, -- Student ID in that platform
    auto_detected BOOLEAN DEFAULT false,
    user_confirmed BOOLEAN DEFAULT true,
    notification_enabled BOOLEAN DEFAULT true,
    priority_override VARCHAR(20), -- high, medium, low, or null for default
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_family_apps_family (family_id),
    INDEX idx_family_apps_child (child_id),
    INDEX idx_family_apps_platform (platform_id)
);

-- Platform-specific configuration
CREATE TABLE platform_configurations (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_id UUID REFERENCES educational_platforms(platform_id),
    school_id UUID REFERENCES schools(school_id),
    configuration_data JSONB, -- Platform-specific settings
    integration_status VARCHAR(20) DEFAULT 'pending',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(platform_id, school_id)
);
```

### 3.7 Communication Preferences

**Purpose:** Granular notification routing and preferences

```sql
-- Communication preferences by family member
CREATE TABLE communication_preferences (
    preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    family_id UUID REFERENCES families(family_id) ON DELETE CASCADE,
    
    -- Channel preferences
    primary_channel VARCHAR(20) DEFAULT 'whatsapp', -- whatsapp, sms, email, push
    backup_channel VARCHAR(20) DEFAULT 'sms',
    whatsapp_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT true,
    
    -- Timing preferences
    notification_hours_start TIME DEFAULT '07:00',
    notification_hours_end TIME DEFAULT '21:00',
    weekend_notifications BOOLEAN DEFAULT true,
    holiday_notifications BOOLEAN DEFAULT false,
    timezone_override VARCHAR(50),
    
    -- Content preferences by category
    receive_events BOOLEAN DEFAULT true,
    receive_permissions BOOLEAN DEFAULT true,
    receive_deadlines BOOLEAN DEFAULT true,
    receive_financial BOOLEAN DEFAULT true,
    receive_academic BOOLEAN DEFAULT true,
    receive_activities BOOLEAN DEFAULT true,
    receive_general BOOLEAN DEFAULT true,
    receive_emergency BOOLEAN DEFAULT true, -- Always true, cannot be disabled
    
    -- Routing preferences
    priority_threshold VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    batch_low_priority BOOLEAN DEFAULT true,
    immediate_high_priority BOOLEAN DEFAULT true,
    
    -- Child-specific preferences
    child_specific_rules JSONB DEFAULT '[]', -- Array of {child_id, rules}
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_comm_prefs_user (user_id),
    INDEX idx_comm_prefs_family (family_id),
    UNIQUE(user_id, family_id)
);

-- Notification delivery rules
CREATE TABLE notification_rules (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(family_id) ON DELETE CASCADE,
    rule_name TEXT NOT NULL,
    rule_type VARCHAR(50), -- routing, timing, escalation
    conditions JSONB NOT NULL, -- Rule conditions
    actions JSONB NOT NULL, -- What to do when conditions met
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_rules_family (family_id),
    INDEX idx_rules_type (rule_type)
);
```

### 3.8 Family Management Dashboard

**Purpose:** Dashboard configuration and family analytics

```sql
-- Dashboard customization
CREATE TABLE dashboard_configurations (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    family_id UUID REFERENCES families(family_id) ON DELETE CASCADE,
    widget_layout JSONB, -- Dashboard widget positions and sizes
    default_view VARCHAR(50) DEFAULT 'overview', -- overview, calendar, tasks, children
    theme_preference VARCHAR(20) DEFAULT 'light', -- light, dark, auto
    density_preference VARCHAR(20) DEFAULT 'comfortable', -- compact, comfortable, spacious
    quick_actions JSONB, -- Customized quick action buttons
    hidden_sections TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, family_id)
);

-- Family activity tracking
CREATE TABLE family_activity_log (
    activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(family_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id),
    activity_type VARCHAR(50) NOT NULL,
    activity_description TEXT,
    entity_type VARCHAR(50), -- child, task, event, setting, etc.
    entity_id UUID,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_activity_family (family_id),
    INDEX idx_activity_user (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_activity_created (created_at DESC)
);

-- Family statistics and analytics
CREATE TABLE family_statistics (
    stat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(family_id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    emails_received INTEGER DEFAULT 0,
    emails_processed INTEGER DEFAULT 0,
    tasks_created INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    notifications_sent INTEGER DEFAULT 0,
    notifications_opened INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    response_time_avg INTEGER, -- Average response time in minutes
    completion_rate DECIMAL(5,2), -- Percentage of tasks completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_stats_family_date (family_id, stat_date),
    UNIQUE(family_id, stat_date)
);
```

### 3.9 User Preferences

**Purpose:** User preferences for notification delivery, quiet hours, and communication channels

```sql
-- User notification preferences
CREATE TABLE user_preferences (
    preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    family_id UUID REFERENCES families(family_id) ON DELETE CASCADE,
    
    -- Notification timing
    quiet_hours_start TIME DEFAULT '21:00',
    quiet_hours_end TIME DEFAULT '07:00',
    timezone_override VARCHAR(50),
    weekend_notifications BOOLEAN DEFAULT true,
    
    -- Delivery preferences
    preferred_channel VARCHAR(20) DEFAULT 'whatsapp', -- whatsapp, sms, push, email
    whatsapp_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT true,
    email_digest_enabled BOOLEAN DEFAULT true,
    
    -- Message batching
    batch_non_urgent BOOLEAN DEFAULT false,
    immediate_urgent BOOLEAN DEFAULT true,
    weekly_digest_day VARCHAR(10) DEFAULT 'Sunday',
    
    -- Content filters
    receive_events BOOLEAN DEFAULT true,
    receive_permissions BOOLEAN DEFAULT true,
    receive_payments BOOLEAN DEFAULT true,
    receive_academics BOOLEAN DEFAULT true,
    receive_general BOOLEAN DEFAULT true,
    
    -- Language preference
    language_preference VARCHAR(5) DEFAULT 'en',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, family_id),
    INDEX idx_prefs_user (user_id),
    INDEX idx_prefs_family (family_id)
);

-- Specialist Role Assignments
CREATE TABLE family_specialist_roles (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(family_id) ON DELETE CASCADE,
    
    -- Specialist assignments (can have multiple users per role)
    financial_specialists UUID[] DEFAULT '{}', -- Array of user_ids
    medical_specialists UUID[] DEFAULT '{}',
    academic_specialists UUID[] DEFAULT '{}',
    activities_specialists UUID[] DEFAULT '{}',
    
    -- Escalation chain (ordered by priority)
    escalation_chain JSONB DEFAULT '[]', -- [{"user_id": "uuid", "priority": 1}, ...]
    primary_contact UUID REFERENCES users(user_id), -- Default: admin user
    secondary_contact UUID REFERENCES users(user_id),
    emergency_contacts UUID[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(family_id),
    INDEX idx_specialist_family (family_id)
);

-- Email forwarding configuration
CREATE TABLE email_forwarding_config (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(family_id) ON DELETE CASCADE,
    forwarding_email TEXT UNIQUE NOT NULL, -- {family-id}@fwd.schoolcierge.com
    is_active BOOLEAN DEFAULT true,
    verified_at TIMESTAMP WITH TIME ZONE,
    last_received_at TIMESTAMP WITH TIME ZONE,
    total_emails_received INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(family_id),
    INDEX idx_forwarding_email (forwarding_email)
);
```

### 3.10 Compliance Management

**Purpose:** GDPR, data retention, and privacy compliance

```sql
-- Data processing consents
CREATE TABLE privacy_consents (
    consent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL, -- data_processing, marketing, analytics, third_party
    consent_version VARCHAR(20) NOT NULL,
    consent_given BOOLEAN NOT NULL,
    consent_text TEXT,
    ip_address INET,
    user_agent TEXT,
    given_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_consents_user (user_id),
    INDEX idx_consents_type (consent_type)
);

-- Data export requests (GDPR)
CREATE TABLE data_export_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    family_id UUID REFERENCES families(family_id),
    requested_by UUID REFERENCES users(user_id),
    request_type VARCHAR(50), -- full_export, communications, children, activity
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, expired
    file_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_exports_user (user_id),
    INDEX idx_exports_family (family_id),
    INDEX idx_exports_status (status)
);

-- Data deletion requests (Right to be forgotten)
CREATE TABLE deletion_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    family_id UUID REFERENCES families(family_id),
    requested_by UUID REFERENCES users(user_id),
    deletion_scope VARCHAR(50), -- user_only, family_data, all_data
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, processing, completed
    scheduled_for TIMESTAMP WITH TIME ZONE,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_deletion_user (user_id),
    INDEX idx_deletion_family (family_id),
    INDEX idx_deletion_status (status)
);

-- Audit trail for compliance
CREATE TABLE compliance_audit_log (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(user_id),
    family_id UUID REFERENCES families(family_id),
    action_taken TEXT NOT NULL,
    data_affected JSONB,
    reason TEXT,
    performed_by UUID REFERENCES users(user_id),
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_family (family_id),
    INDEX idx_audit_type (event_type),
    INDEX idx_audit_created (created_at DESC)
);
```

### 3.11 Communication Capture Schema

**Purpose:** Email ingestion, processing, and storage

```sql
-- Raw communications storage
CREATE TABLE communications (
    comm_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(family_id) ON DELETE CASCADE,
    
    -- Source information
    source_type VARCHAR(20) NOT NULL, -- email, whatsapp, sms, manual
    source_address TEXT,
    sender_name TEXT,
    sender_email TEXT,
    sender_domain TEXT,
    
    -- Content
    subject TEXT,
    body_text TEXT,
    body_html TEXT,
    summary TEXT, -- AI-generated summary
    language VARCHAR(5),
    
    -- Metadata
    received_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    message_id TEXT, -- Original message ID
    thread_id TEXT, -- For grouping related messages
    references TEXT[], -- Email references for threading
    attachments JSONB, -- Array of {filename, size, type, url}
    
    -- Classification results (stored separately but denormalized for performance)
    scope_classification VARCHAR(50),
    primary_category VARCHAR(50),
    priority_level VARCHAR(20),
    confidence_score DECIMAL(3,2),
    
    -- Status
    processing_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_comms_family (family_id),
    INDEX idx_comms_received (received_at DESC),
    INDEX idx_comms_status (processing_status),
    INDEX idx_comms_category (primary_category),
    INDEX idx_comms_sender (sender_email)
);

-- Communication attachments
CREATE TABLE communication_attachments (
    attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comm_id UUID REFERENCES communications(comm_id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_filename TEXT,
    mime_type TEXT,
    size_bytes BIGINT,
    storage_url TEXT,
    thumbnail_url TEXT,
    ocr_text TEXT, -- Extracted text from images/PDFs
    virus_scanned BOOLEAN DEFAULT false,
    scan_result VARCHAR(20),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_attachments_comm (comm_id)
);

-- Email-specific metadata
CREATE TABLE email_metadata (
    metadata_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comm_id UUID UNIQUE REFERENCES communications(comm_id) ON DELETE CASCADE,
    mailgun_message_id TEXT,
    mailgun_storage_url TEXT,
    headers JSONB,
    spam_score DECIMAL(3,2),
    dkim_valid BOOLEAN,
    spf_valid BOOLEAN,
    bounce_status VARCHAR(50),
    delivery_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 4. CLARA Technical Architecture

### 4.1 CLARA (Communication Logic & Action Routing Agent) Overview

**Purpose:** Technical implementation of School'cierge's core AI processing engine

**System Architecture:**
- Single unified service with 7 internal processing stages
- Stage 8 (Delivery) handled by TIMER service
- BullMQ for job processing and queue management
- Fault-tolerant design with built-in retry mechanisms
- Horizontal scaling via queue workers

### 4.2 CLARA Service Implementation

#### Unified Service Architecture
**Technology Stack:**
- Node.js/Express API with integrated CLARA module
- BullMQ for job processing
- Redis for deduplication and caching
- PostgreSQL for all data storage
- Claude 3.5 Sonnet for AI classification

**Queue Architecture:**
```typescript
// Email Processing Queue
const emailQueue = new Queue('email-processing');
// Notification Queue  
const notificationQueue = new Queue('notifications');
// Reminder Queue
const reminderQueue = new Queue('reminders');
// TIMER Queue for scheduled tasks
const timerQueue = new Queue('timer-tasks');
```

**CLARA 7-Stage Pipeline - Detailed Specifications:**

#### Stage 1: Email Capture & Validation
**Purpose:** Receive, validate, and prepare emails for processing
```typescript
interface Stage1Input {
  rawEmail: MailgunWebhook;
  familyId: string;
}

interface Stage1Output {
  emailId: string;
  familyId: string;
  sender: {
    email: string;
    domain: string;
    isVerified: boolean;
    trustScore: number; // 0-100
  };
  isDuplicate: boolean;
  metadata: EmailMetadata;
}

// Processing Logic
- Extract family ID from recipient address
- Verify sender domain against school database
- Check for duplicate using message-id hash
- Calculate sender trust score
- Store raw email in database
```

#### Stage 2: Content Pre-Processing
**Purpose:** Parse and normalize email content
```typescript
interface Stage2Output {
  subject: string;
  bodyText: string;
  bodyHtml: string;
  language: string;
  attachments: Attachment[];
  extractedUrls: string[];
  wordCount: number;
}

// Processing Logic
- Convert HTML to clean text
- Extract and store attachments
- Detect language (default: en)
- Extract all URLs for processing
- Calculate content metrics
```

#### Stage 3: AI Classification
**Purpose:** Categorize email using Claude 3.5 Sonnet
```typescript
interface Stage3Output {
  classification: {
    scope: 'school' | 'grade' | 'class' | 'individual';
    category: 'event' | 'permission' | 'payment' | 'academic' | 'admin';
    confidence: number; // 0-100
  };
  keywords: string[];
  aiProcessingTime: number;
}

// Processing Logic
- Build classification prompt
- Call Claude API with structured output
- Parse and validate response
- Apply confidence threshold (min 85%)
- Log classification for training
```

#### Stage 4: Priority Calculation
**Purpose:** Calculate message priority score
```typescript
interface Stage4Output {
  priorityScore: number; // 0-100
  priorityBand: 'critical' | 'high' | 'medium' | 'low';
  factors: {
    urgency: number;
    authority: number;
    deadline: number;
  };
}

// Formula: Priority = (Urgency × 0.4) + (Authority × 0.3) + (Deadline × 0.3)
// Authority Levels:
// - Principal/Head: 1.0
// - Vice Principal: 0.9
// - Teacher: 0.8
// - Admin Staff: 0.7
// - External: 0.6
```

#### Stage 5: Entity & Date Extraction
**Purpose:** Extract actionable entities from content
```typescript
interface Stage5Output {
  entities: {
    children: string[];
    dates: Array<{
      date: string;
      context: string;
      type: 'deadline' | 'event' | 'reminder';
    }>;
    amounts: Array<{
      amount: number;
      currency: string;
      context: string;
    }>;
    locations: string[];
    contacts: Array<{
      name: string;
      role: string;
      contact: string;
    }>;
  };
}

// Processing Logic
- Match children names against family records
- Parse dates with timezone awareness
- Extract monetary amounts with currency
- Identify location references
- Extract contact information
```

#### Stage 6: Interaction Level Assessment
**Purpose:** Determine complexity of required action
```typescript
interface Stage6Output {
  interactionLevel: 0 | 1 | 2 | 3 | 4 | 5;
  description: string;
  estimatedTime: number; // minutes
  requiredActions: string[];
}

// Levels:
// 0: No action (FYI only)
// 1: Simple acknowledgment
// 2: Basic task (1-2 steps, <2 min)
// 3: Complex task (3-5 steps, 5-10 min)
// 4: Multi-step process (>5 steps, 10-30 min)
// 5: Requires coordination (multiple people/steps)
```

#### Stage 7: Family Routing & Message Generation
**Purpose:** Determine recipients and create messages
```typescript
interface Stage7Output {
  routing: {
    primaryRecipient: string;
    ccRecipients: string[];
    deliveryChannel: 'whatsapp' | 'sms' | 'push';
    timing: 'immediate' | 'scheduled' | 'batched';
  };
  generatedMessage: {
    whatsappText: string; // 50 words max
    buttons: ActionButton[];
    compressionRatio: number;
  };
}

// Processing Logic
- Apply Action Matrix rules
- Check user preferences
- Generate concise WhatsApp message
- Create action buttons
- Apply quiet hours rules
```

#### Stage 8: Notification Orchestration
**Purpose:** Schedule and track message delivery
```typescript
interface Stage8Output {
  deliveryPlan: {
    messageId: string;
    scheduledTime: Date;
    channel: string;
    trackingEnabled: boolean;
  };
  reminders: Array<{
    time: Date;
    condition: string;
  }>;
  completionTracking: {
    actionId: string;
    deadline: Date;
    trackingUrl: string;
  };
}

// Processing Logic
- Queue message for delivery
- Schedule reminders if needed
- Set up completion tracking
- Initialize delivery metrics
- Create audit trail
```

**Key Interfaces:**
```typescript
interface CapturedEmail {
  email_id: string;
  family_id: string;
  sender: SenderMetadata;
  content: EmailContent;
  attachments: Attachment[];
  metadata: EmailMetadata;
}
```

**Detailed Output Schema:**
```json
{
  "email_id": "msg_abc123_2024031409",
  "family_id": "fam_chen_dubai_456",
  "sender": "teacher@dubaiintlacademy.ae",
  "sender_domain": "dubaiintlacademy.ae",
  "trust_score": 85,
  "subject": "Swimming Carnival Permission Required",
  "content": "parsed_email_content",
  "content_type": "text/html",
  "timestamp": "2024-03-14T09:32:00Z",
  "attachments": [
    {
      "filename": "permission_slip.pdf",  
      "size": 245760,
      "type": "application/pdf",
      "url": "signed_download_url"
    }
  ],
  "thread_id": "thread_swimming_carnival_2024",
  "related_emails": ["msg_abc122_2024031309"],
  "processing_flags": {
    "is_duplicate": false,
    "requires_review": false,
    "has_attachments": true
  }
}
```

**Performance Requirements:**
- Throughput: 1000 emails/minute
- Latency: <500ms per email
- Availability: 99.9%

#### Classification & Prioritisation Details

**Classification Categories:**
- **Events** (30%): School events, field trips, performances
- **Permissions** (25%): Forms requiring signature/approval  
- **Payments** (20%): Fee reminders, payment deadlines
- **Academic** (15%): Reports, assignments, curriculum updates
- **Administrative** (10%): General announcements, policy changes

**Priority Calculation Formula:**
```
Priority Score = (Urgency × 0.4) + (Authority × 0.3) + (Deadline × 0.3)
```

**Authority Levels:**
- **Level 5**: Principal/Head (1.0x multiplier)
- **Level 4**: Deputy/Vice Principal (0.9x)
- **Level 3**: Teacher/Department Head (0.8x)
- **Level 2**: Admin Staff (0.7x)
- **Level 1**: External/Unknown (0.6x)

**Interaction Levels:**
- **Level 0**: No action needed (FYI only)
- **Level 1**: Simple acknowledgment
- **Level 2**: Basic task (1-2 steps)
- **Level 3**: Complex task (3-5 steps)
- **Level 4**: Multi-step process
- **Level 5**: Requires coordination

**Key Interfaces:**
```typescript
interface ProcessedMessage {
  message_id: string;
  classification: Classification;
  priority: Priority;
  interaction: InteractionLevel;
  content: GeneratedContent;
  routing_hints: RoutingHints;
}
```

**Detailed Output Schema:**
```json
{
  "email_id": "msg_abc123_2024031409",
  "classification": {
    "primary_category": "permission_request",
    "secondary_category": "sports_event",
    "confidence_score": 94.2,
    "requires_review": false
  },
  "extracted_entities": {
    "children": ["Emma Chen"],
    "event_name": "Year 5 Swimming Carnival",
    "dates": {
      "event_date": "2024-03-15",
      "deadline": "2024-03-13",
      "days_until_deadline": 2
    },
    "location": "Dubai Aquatic Centre",
    "requirements": [
      "swimming costume", 
      "towel", 
      "goggles", 
      "sunscreen"
    ],
    "actions_required": ["sign_permission_slip", "return_form"]
  },
  "priority_scoring": {
    "base_score": 70,
    "authority_weight": 1.0,
    "deadline_factor": 1.5,
    "final_priority": 75,
    "priority_band": "high"
  },
  "interaction_assessment": {
    "level": 2,
    "description": "Basic task (1-2 steps, <2 minutes)",
    "estimated_time_minutes": 2,
    "complexity_factors": ["form_signing", "deadline_sensitive"]
  },
  "generated_message": {
    "whatsapp_text": "📎 Permission needed - Emma's swimming carnival\n📅 Friday, March 15 (8:30 AM - 1:30 PM)\n📍 Dubai Aquatic Centre\n⏰ Form due Wednesday (2 days)\n🏊 Bring: Swimsuit, towel, goggles, sunscreen",
    "word_count": 42,
    "compression_ratio": 0.91,
    "action_buttons": [
      {"text": "Complete Permission", "action": "open_form"},
      {"text": "Set Reminder", "action": "schedule_reminder"},
      {"text": "Add to Calendar", "action": "create_event"}
    ]
  },
  "routing_recommendations": {
    "primary_recipients": ["parent_primary"],
    "secondary_recipients": ["parent_secondary"],
    "routing_reason": "permission_required",
    "delivery_timing": "immediate"
  }
}
```

#### Agent 3: Smart Notification Service
**Technology Stack:**
- Node.js notification orchestrator
- WhatsApp Business API
- BullMQ for job scheduling
- PostgreSQL for delivery tracking

**Processing Stages:**
1. Family Routing (rule engine)
2. Delivery Scheduling (batch optimization)
3. Action Tracking (completion monitoring)

**Detailed Output Schema:**
```json
{
  "email_id": "msg_abc123_2024031409",
  "delivery_plan": {
    "recipients": [
      {
        "family_member_id": "parent_mom_chen",
        "phone": "+971501234567",
        "role": "primary",
        "delivery_channel": "whatsapp",
        "message_variant": "full_detail",
        "scheduled_time": "2024-03-14T09:33:00Z",
        "timezone": "Asia/Dubai"
      },
      {
        "family_member_id": "parent_dad_chen",
        "phone": "+971507654321",
        "role": "secondary",
        "delivery_channel": "whatsapp",
        "message_variant": "summary_notification",
        "scheduled_time": "2024-03-14T09:33:00Z",
        "timezone": "Asia/Dubai"
      }
    ],
    "delivery_strategy": "immediate",
    "batch_group": null,
    "quiet_hours_respected": true
  },
  "tracking_setup": {
    "action_items": [
      {
        "action_id": "permission_completion",
        "type": "form_submission",
        "deadline": "2024-03-13T23:59:59Z",
        "tracking_method": "button_click",
        "completion_webhook": "api/actions/complete"
      }
    ],
    "reminder_schedule": [
      {
        "reminder_id": "gentle_reminder",
        "scheduled_time": "2024-03-12T18:00:00Z",
        "message": "Reminder: Emma's permission slip due tomorrow",
        "condition": "if_not_completed"
      },
      {
        "reminder_id": "urgent_reminder",
        "scheduled_time": "2024-03-13T09:00:00Z",
        "message": "Today: Emma's permission slip needed by end of day",
        "condition": "if_not_completed"
      }
    ]
  },
  "delivery_results": {
    "message_id": "whatsapp_msg_def456",
    "delivery_status": "delivered",
    "delivery_timestamp": "2024-03-14T09:33:12Z",
    "read_receipt": null,
    "interaction_events": [],
    "fallback_used": false
  },
  "analytics_tracking": {
    "processing_time_ms": 4234,
    "delivery_time_ms": 1876,
    "total_pipeline_time_ms": 6110,
    "cost_breakdown": {
      "ai_processing": 0.0008,
      "delivery": 0.0002,
      "total": 0.0010
    }
  }
}
```

### 4.3 Data Flow Architecture

```mermaid
sequenceDiagram
    participant E as Email Source
    participant API as API Service
    participant EQ as Email Queue
    participant CLARA as CLARA Module
    participant NQ as Notification Queue
    participant W as WhatsApp
    
    E->>API: Email webhook
    API->>API: Validate & deduplicate
    API->>EQ: Queue email job
    EQ->>CLARA: Process email
    CLARA->>CLARA: AI classification (9 stages)
    CLARA->>NQ: Queue notification
    NQ->>API: Send notification
    API->>W: Deliver WhatsApp
    API->>API: Track delivery
```

### 4.4 Database Schema for CLARA

#### Email Processing Tables
```sql
-- Raw email storage
CREATE TABLE clara_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id),
    email_id VARCHAR(255) UNIQUE,
    sender_email VARCHAR(255),
    subject TEXT,
    content_text TEXT,
    content_html TEXT,
    received_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Classification results
CREATE TABLE clara_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id UUID REFERENCES clara_emails(id),
    source_type VARCHAR(50),
    content_category VARCHAR(50),
    priority_score INTEGER,
    interaction_level INTEGER,
    confidence_score DECIMAL(3,2),
    entities JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Generated messages
CREATE TABLE clara_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classification_id UUID REFERENCES clara_classifications(id),
    message_text TEXT,
    action_buttons JSONB,
    routing_rules JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Delivery tracking
CREATE TABLE clara_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES clara_messages(id),
    recipient_id UUID REFERENCES family_members(id),
    channel VARCHAR(50),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    acted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4.5 Performance & Monitoring

**Key Metrics:**
- End-to-end processing: <5 seconds
- Classification accuracy: 95%+
- Delivery success: 99%+
- System uptime: 99.9%

**Monitoring Stack:**
- Prometheus for metrics collection
- Grafana for visualization
- PagerDuty for alerting
- Sentry for error tracking

### 4.6 Security Considerations

#### Multi-Tenant Security Enhancement

**Row-Level Security (RLS) Implementation:**

All database tables implement Row-Level Security to ensure complete family data isolation at the database level:

```sql
-- Enable RLS on all family-scoped tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Core family isolation policy
CREATE POLICY family_isolation ON families
    USING (family_id = current_setting('app.current_family_id')::uuid);

-- Family members can only see their own family
CREATE POLICY family_members_isolation ON family_members
    USING (family_id = current_setting('app.current_family_id')::uuid);

-- Dependents visibility restricted to family
CREATE POLICY dependents_isolation ON dependents
    USING (family_id = current_setting('app.current_family_id')::uuid);

-- Communications isolated by family
CREATE POLICY communications_isolation ON communications
    USING (family_id = current_setting('app.current_family_id')::uuid);

-- Tasks visible only to assigned family
CREATE POLICY tasks_isolation ON tasks
    USING (family_id = current_setting('app.current_family_id')::uuid);

-- Email accounts restricted to owning family
CREATE POLICY email_accounts_isolation ON email_accounts
    USING (family_id = current_setting('app.current_family_id')::uuid);

-- Service account bypass for system operations
CREATE POLICY service_account_bypass ON ALL TABLES
    USING (current_setting('app.service_account')::boolean = true);
```

**Prisma Integration with RLS:**

```typescript
// middleware/tenant-isolation.ts
export async function setTenantContext(
  familyId: string,
  prisma: PrismaClient
): Promise<void> {
  // Set the family context for RLS
  await prisma.$executeRawUnsafe(
    `SET LOCAL app.current_family_id = $1`,
    familyId
  );
}

// Example usage in API endpoints
export async function getFamilyTasks(req: Request, res: Response) {
  const { familyId } = req.auth;
  
  await prisma.$transaction(async (tx) => {
    // Set tenant context for this transaction
    await tx.$executeRawUnsafe(
      `SET LOCAL app.current_family_id = $1`,
      familyId
    );
    
    // All subsequent queries in this transaction
    // are automatically filtered by family_id
    const tasks = await tx.task.findMany();
    return tasks;
  });
}
```

**Additional Security Layers:**

1. **Application-Level Validation:**
   - Double-check family_id in application logic
   - Validate JWT contains correct family claims
   - Audit log all cross-family access attempts

2. **Database User Separation:**
   ```sql
   -- Application user with RLS enforcement
   CREATE USER app_user WITH PASSWORD 'secure_password';
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES TO app_user;
   
   -- Admin user that bypasses RLS (for migrations/admin)
   CREATE USER admin_user WITH PASSWORD 'admin_password';
   GRANT ALL PRIVILEGES ON ALL TABLES TO admin_user;
   ALTER USER admin_user BYPASSRLS;
   ```

3. **Connection Pool Security:**
   ```typescript
   // Separate connection pools for different security contexts
   const appPool = new Pool({
     user: 'app_user',
     // RLS enforced for all queries
   });
   
   const adminPool = new Pool({
     user: 'admin_user',
     // Bypasses RLS for admin operations
   });
   ```

**Data Protection:**
- Email content encrypted at rest (AES-256)
- TLS 1.3 for all API communications
- API key rotation every 90 days
- PII masking in logs
- Automatic data encryption for sensitive fields

**Access Control:**
- Service-to-service authentication via JWT
- Rate limiting per family account
- DDoS protection via Cloudflare
- IP allowlisting for admin access
- Multi-factor authentication for sensitive operations

### 4.7 Scalability Design

**Horizontal Scaling:**
- API Workers: Scale based on HTTP request volume
- Email Queue Workers: Scale based on email processing queue depth
- Notification Queue Workers: Scale based on delivery queue depth
- BullMQ automatically distributes jobs across workers

**Caching Strategy:**
- Duplicate email detection: 24-hour cache
- Classification results: 7-day cache
- Family preferences: 1-hour cache
- Action Matrix configuration: 5-minute cache

**Queue Management:**
- Priority queues for urgent messages
- Dead letter queues for failed processing
- Exponential backoff for retries

### 4.8 Action Matrix Configuration

**Purpose:** Core CLARA component providing intelligent routing configuration for message delivery decisions

**Status:** Production Ready - Configurable routing engine for CLARA Stage 6 (Message Generation) and Stage 7 (Family Routing)

#### Database Schema
```sql
-- Action Matrix configurations per school
CREATE TABLE action_matrix_configs (
    matrix_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(school_id),
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    config_json JSONB NOT NULL, -- Matrix configuration
    created_by UUID REFERENCES admin_users(admin_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    effective_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_matrix_school (school_id),
    INDEX idx_matrix_active (is_active)
);

-- Action Matrix templates
CREATE TABLE action_matrix_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(100) NOT NULL,
    school_type VARCHAR(50), -- international, british, american
    region VARCHAR(50), -- uae, uk, us
    config_json JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Action routing rules
CREATE TABLE action_routing_rules (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matrix_id UUID REFERENCES action_matrix_configs(matrix_id),
    classification_category VARCHAR(50), -- payment, event, permission, etc.
    priority_level VARCHAR(20), -- critical, high, medium, low
    
    -- Delivery configuration
    whatsapp_enabled BOOLEAN DEFAULT true,
    calendar_enabled BOOLEAN DEFAULT false,
    task_enabled BOOLEAN DEFAULT false,
    digest_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT true,
    
    -- Timing configuration
    delivery_timing VARCHAR(20), -- immediate, scheduled, batched
    reminder_schedule JSONB, -- Array of reminder times
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_routing_matrix (matrix_id),
    INDEX idx_routing_category (classification_category)
);

-- A/B testing for matrix configurations
CREATE TABLE matrix_experiments (
    experiment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(school_id),
    control_matrix_id UUID REFERENCES action_matrix_configs(matrix_id),
    variant_matrix_id UUID REFERENCES action_matrix_configs(matrix_id),
    traffic_percentage DECIMAL(5,2), -- % to variant
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    metrics JSONB, -- Engagement metrics
    winner VARCHAR(20), -- control, variant, none
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Configuration Interface
```typescript
interface ActionMatrixConfig {
  matrixId: string;
  schoolId: string;
  version: number;
  rules: RoutingRule[];
}

interface RoutingRule {
  category: ClassificationCategory;
  priority: Priority;
  channels: {
    whatsapp: boolean;
    calendar: boolean;
    task: boolean;
    digest: boolean;
    push: boolean;
  };
  timing: 'immediate' | 'scheduled' | 'batched';
  reminders?: ReminderConfig[];
}

interface ReminderConfig {
  offsetMinutes: number;
  channel: DeliveryChannel;
  condition: 'if_not_completed' | 'always';
}
```

#### API Endpoints
```typescript
// Get active matrix for school
GET /api/clara/matrix/{schoolId}

// Update matrix configuration
PUT /api/clara/matrix/{schoolId}
{
  "config": {...},
  "effectiveDate": "2025-08-06T00:00:00Z"
}

// Test routing with sample message
POST /api/clara/matrix/test
{
  "schoolId": "...",
  "classification": {...},
  "matrixId": "..." // Optional, uses active if not provided
}

// Get available templates
GET /api/clara/matrix/templates

// Get matrix analytics
GET /api/clara/matrix/{matrixId}/analytics

// Get matrix configuration (admin view)
GET /api/admin/matrix/{schoolId}/view

// Manual routing override
POST /api/clara/matrix/override
{
  "messageId": "...",
  "overrideRouting": {...}
}
```

#### Integration with CLARA Pipeline

**Matrix Lookup Process:**
```typescript
// Called between Stage 5 and Stage 6
async function lookupActionMatrix(
  emailScope: string,        // From Stage 2
  claraCategory: string,     // From Stage 3
  priority: string           // From Stage 4
): Promise<RoutingInstructions> {
  
  // Map CLARA category to Matrix category
  const matrixCategory = mapClaraToMatrixCategory(claraCategory);
  
  // Build lookup key
  const key = `${emailScope}:${matrixCategory}:${priority}`;
  
  // Check Redis cache first
  const cached = await redis.get(`matrix:${schoolId}:${key}`);
  if (cached) return JSON.parse(cached);
  
  // Database lookup
  const rule = await db.query(
    `SELECT * FROM action_routing_rules 
     WHERE matrix_id = $1 
     AND email_scope = $2
     AND content_category = $3
     AND priority = $4`,
    [activeMatrixId, emailScope, matrixCategory, priority]
  );
  
  // Cache for 5 minutes
  await redis.setex(`matrix:${schoolId}:${key}`, 300, JSON.stringify(rule));
  
  return rule;
}
```

#### Caching Strategy

**Redis Cache Layers:**
- **L1 Cache**: Active matrix config (5 minutes TTL)
- **L2 Cache**: Individual routing rules (5 minutes TTL)
- **L3 Cache**: Template configurations (1 hour TTL)

**Cache Keys:**
```
matrix:config:{schoolId}          # Active matrix configuration
matrix:rule:{schoolId}:{key}      # Individual routing rule
matrix:template:{templateId}      # Template configuration
matrix:analytics:{schoolId}:{date} # Daily analytics cache
```

**Cache Invalidation:**
- On matrix update: Clear all school-specific keys
- On template update: Clear template cache
- Daily: Clear analytics cache

#### Performance Requirements

**Lookup Performance:**
- Target: <10ms for cached lookups
- Database index on (matrix_id, email_scope, content_category, priority)
- Pre-load active matrix on service start
- Warm cache for common routing patterns

**Monitoring Metrics:**
- Average lookup time (target: <10ms)
- Cache hit rate (target: >95%)
- Routing success rate (target: >99%)
- Manual override frequency (track for optimization)

### 4.9 BullMQ Administration

**Admin Dashboard Integration:**
- Bull Dashboard embedded in admin panel
- Real-time queue monitoring
- Job inspection and retry capabilities
- Performance metrics per queue

**Queue Configuration:**
```javascript
{
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: 500
  }
}
```

### 4.10 Integration Specifications

**AI Processing Engine:**
- **Provider**: Configurable (Claude, GPT, Gemini, etc.)
- **Selection Criteria**: 95%+ accuracy, <3s response time, reliability
- **Fallback Strategy**: Secondary model for high-volume or failure scenarios
- **Configuration**: Environment-based model selection

**WhatsApp Messaging Provider:**
- **Primary Options**: Chat2.io, WhatsApp Business API, Twilio
- **Selection Criteria**: Reliability, feature set, geographic coverage
- **Required Features**: 
  - Template messages
  - Interactive buttons
  - Media support
  - Delivery receipts
  - Multi-number support
- **Configuration**: Provider-agnostic interface design

**Email Reception Service:**
- **Options**: Mailgun, SendGrid, AWS SES, custom SMTP
- **Requirements**:
  - Webhook support for real-time processing
  - Attachment handling
  - SPF/DKIM validation
  - High deliverability rates
- **Implementation**: Adapter pattern for provider switching

**Queue Management System:**
- **Options**: Redis/BullMQ, RabbitMQ, AWS SQS
- **Requirements**:
  - Priority queue support
  - Dead letter queue handling
  - Horizontal scaling
  - Message persistence

**Technical Implementation Details:**
All integration points use adapter patterns to ensure provider independence. Specific provider selection happens at deployment time through environment configuration.

---

## 5. TIMER Technical Architecture

### 5.1 System Overview

**TIMER (Tasks, Information, and Multi-channel Engagement & Reminder) Agent** is the message delivery and task management orchestrator that handles all family communications after CLARA processing.

### 5.2 Queue Infrastructure

```typescript
// BullMQ Queue Configuration
interface TimerQueues {
  immediate: Queue<ImmediateMessage>;      // Real-time delivery
  scheduled: Queue<ScheduledMessage>;      // Future delivery  
  retry: Queue<RetryMessage>;             // Failed message retry
  deadLetter: Queue<FailedMessage>;       // Permanently failed
}

// Queue Processor Configuration
const queueConfig = {
  immediate: {
    concurrency: 50,
    attempts: 1,
    removeOnComplete: { count: 100 },
    removeOnFail: false
  },
  scheduled: {
    concurrency: 20,
    attempts: 1,
    removeOnComplete: { count: 1000 },
    removeOnFail: false
  },
  retry: {
    concurrency: 10,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000  // Start with 1 minute
    },
    removeOnComplete: false,
    removeOnFail: false
  },
  deadLetter: {
    concurrency: 1,
    attempts: 0,
    removeOnComplete: false,
    removeOnFail: false
  }
};
```

### 5.3 Message Data Structures

```typescript
interface TimerMessage {
  id: string;
  familyId: string;
  recipients: Recipient[];
  content: MessageContent;
  metadata: MessageMetadata;
  delivery: DeliveryConfig;
  tracking: TrackingInfo;
  created: Date;
  processed?: Date;
}

interface Recipient {
  userId: string;
  role: 'parent' | 'guardian' | 'emergency';
  channels: ChannelPreference[];
  timezone: string;
  quietHours?: QuietHours;
}

interface MessageContent {
  type: 'task' | 'reminder' | 'information' | 'urgent';
  category: string;
  title: string;
  body: string;
  actions?: MessageAction[];
  attachments?: Attachment[];
  originalEmailId?: string;
}

interface DeliveryConfig {
  priority: 'critical' | 'high' | 'normal' | 'low';
  channels: ChannelStrategy[];
  scheduling: SchedulingConfig;
  retryPolicy: RetryPolicy;
  coordination: CoordinationRules;
}
```

### 5.4 Channel Orchestration

```typescript
// Primary: Whapi.Cloud Integration
class WhapiChannel implements DeliveryChannel {
  async send(message: TimerMessage): Promise<DeliveryResult> {
    const whapi = new WhapiClient({
      token: process.env.WHAPI_TOKEN,
      instanceId: process.env.WHAPI_INSTANCE
    });
    
    // Interactive button support
    if (message.content.actions?.length) {
      return await whapi.sendInteractive({
        to: message.recipient.phone,
        type: 'button',
        header: { text: message.content.title },
        body: { text: message.content.body },
        buttons: message.content.actions.map(a => ({
          id: a.id,
          title: a.label
        }))
      });
    }
    
    // Standard text message
    return await whapi.sendText({
      to: message.recipient.phone,
      body: formatMessage(message)
    });
  }
}

// Fallback: 2Chat.io Integration  
class TwoChatChannel implements DeliveryChannel {
  async send(message: TimerMessage): Promise<DeliveryResult> {
    const twoChat = new TwoChatClient({
      apiKey: process.env.TWOCHAT_API_KEY,
      phoneId: process.env.TWOCHAT_PHONE_ID
    });
    
    return await twoChat.sendMessage({
      phone: message.recipient.phone,
      message: formatMessage(message),
      mediaUrl: message.content.attachments?.[0]?.url
    });
  }
}
```

### 5.5 Retry & Failure Management

```typescript
class RetryManager {
  private retryStrategies = {
    whatsapp: {
      maxAttempts: 3,
      delays: [60000, 300000, 900000], // 1min, 5min, 15min
      fallbackChannel: 'sms'
    },
    sms: {
      maxAttempts: 2,
      delays: [120000, 600000], // 2min, 10min
      fallbackChannel: 'push'
    },
    push: {
      maxAttempts: 1,
      delays: [],
      fallbackChannel: null
    }
  };
  
  async handleFailure(
    message: TimerMessage, 
    error: Error, 
    attempt: number
  ): Promise<void> {
    const strategy = this.retryStrategies[message.channel];
    
    if (attempt < strategy.maxAttempts) {
      // Schedule retry with exponential backoff
      await this.scheduleRetry(
        message, 
        strategy.delays[attempt]
      );
    } else if (strategy.fallbackChannel) {
      // Switch to fallback channel
      message.channel = strategy.fallbackChannel;
      await this.queues.immediate.add(message);
    } else {
      // Move to dead letter queue
      await this.queues.deadLetter.add({
        ...message,
        failureReason: error.message,
        attempts: attempt
      });
    }
  }
}
```

### 5.6 Family Coordination

```typescript
class FamilyCoordinator {
  async processTask(task: TimerMessage): Promise<void> {
    // Check if task already completed by another family member
    const existing = await this.checkExistingCompletion(
      task.familyId,
      task.content.originalEmailId
    );
    
    if (existing?.completed) {
      // Notify other family members of completion
      await this.notifyCompletion(task, existing.completedBy);
      return;
    }
    
    // Track task assignment
    await this.redis.setex(
      `task:${task.familyId}:${task.id}`,
      86400, // 24 hour TTL
      JSON.stringify({
        assignedTo: task.recipients.map(r => r.userId),
        status: 'pending',
        created: new Date()
      })
    );
    
    // Send to designated recipients
    for (const recipient of task.recipients) {
      await this.sendToRecipient(task, recipient);
    }
  }
  
  async handleCompletion(
    taskId: string, 
    userId: string
  ): Promise<void> {
    const taskKey = `task:*:${taskId}`;
    const task = await this.redis.get(taskKey);
    
    if (task) {
      // Mark as completed
      task.status = 'completed';
      task.completedBy = userId;
      task.completedAt = new Date();
      
      await this.redis.setex(taskKey, 86400, JSON.stringify(task));
      
      // Notify other assigned family members
      await this.notifyOthers(task, userId);
    }
  }
}
```

### 5.7 Performance Metrics

```typescript
interface TimerMetrics {
  // Delivery metrics
  messagesQueued: Counter;
  messagesDelivered: Counter;
  messagesFailed: Counter;
  deliveryLatency: Histogram;
  
  // Channel metrics
  channelUsage: Map<string, Counter>;
  channelSuccess: Map<string, Gauge>;
  channelLatency: Map<string, Histogram>;
  
  // Retry metrics
  retryAttempts: Counter;
  retrySuccess: Counter;
  retryExhausted: Counter;
  
  // Coordination metrics
  duplicatesPrevented: Counter;
  familyNotifications: Counter;
  taskCompletions: Counter;
}

// Prometheus metrics collection
const metrics = {
  deliveryLatency: new Histogram({
    name: 'timer_delivery_latency_seconds',
    help: 'Message delivery latency in seconds',
    labelNames: ['channel', 'priority', 'type'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
  }),
  
  messagesDelivered: new Counter({
    name: 'timer_messages_delivered_total',
    help: 'Total messages successfully delivered',
    labelNames: ['channel', 'type', 'family_id']
  })
};
```

### 5.8 Admin-Configurable Reminder System

```typescript
// Reminder Configuration Schema
interface ReminderConfiguration {
  categoryId: string;
  categoryName: string;
  reminderIntervals: string[]; // ["-7d", "-3d", "-1d", "-4h"]
  escalationPoint: string; // "50%" or specific interval
  messageTemplates: MessageTemplateSet;
  isActive: boolean;
  updatedBy: string;
  updatedAt: Date;
}

// System-wide reminder categories
const REMINDER_CATEGORIES = {
  PERMISSION_SLIPS: {
    intervals: ["T-24h", "T-4h", "T-1h"],
    escalation: "50%"
  },
  PAYMENT_DUE: {
    intervals: ["T-7d", "T-3d", "T-1d", "T-4h"],
    escalation: "T-24h"
  },
  EVENTS: {
    intervals: ["T-1w", "T-1d", "T-2h"],
    escalation: "T-4h"
  },
  MEDICAL_FORMS: {
    intervals: ["T-48h", "T-24h", "T-4h"],
    escalation: "T-12h"
  },
  ACADEMIC: {
    intervals: ["T-24h", "T-12h", "T-2h"],
    escalation: "T-6h"
  },
  SPORTS_ACTIVITIES: {
    intervals: ["T-1w", "T-1d", "morning-of"],
    escalation: "T-4h"
  },
  UNIFORM_DRESS: {
    intervals: ["T-1d", "morning-of"],
    escalation: "morning-of"
  },
  FIELD_TRIPS: {
    intervals: ["T-1w", "T-2d", "T-1d"],
    escalation: "T-24h"
  },
  PARENT_TEACHER: {
    intervals: ["T-1w", "T-2d", "T-2h"],
    escalation: "T-4h"
  },
  SCHOOL_SUPPLIES: {
    intervals: ["T-2d", "T-1d"],
    escalation: "T-12h"
  },
  EMERGENCY_SAFETY: {
    intervals: ["immediate", "T-30min", "T-10min"],
    escalation: "immediate"
  },
  GENERAL_ANNOUNCEMENTS: {
    intervals: ["once"],
    escalation: null
  },
  PICKUP_DROPOFF: {
    intervals: ["T-2h", "T-30min"],
    escalation: "T-1h"
  },
  EXAM_TEST: {
    intervals: ["T-1w", "T-2d", "T-1d"],
    escalation: "T-2d"
  },
  REPORT_CARDS: {
    intervals: ["T-1d"],
    escalation: null
  },
  VACCINATION_HEALTH: {
    intervals: ["T-1w", "T-3d", "T-1d"],
    escalation: "T-2d"
  },
  LIBRARY_BOOKS: {
    intervals: ["T-2d", "T-1d", "morning-of"],
    escalation: "T-1d"
  },
  PHOTO_DAY: {
    intervals: ["T-1w", "T-2d", "T-1d"],
    escalation: "T-1d"
  },
  SCHOOL_HOLIDAYS: {
    intervals: ["T-1w", "T-2d"],
    escalation: null
  },
  CUSTOM: {
    intervals: ["T-24h", "T-4h"],
    escalation: "T-6h"
  }
};

// Escalation configuration
interface EscalationConfig {
  primaryToSecondary: string; // "50%" or specific time
  channelEscalation: string; // "25%" for WhatsApp to SMS
  emergencyProtocol: boolean;
  familyBroadcast: boolean;
}

// Admin management class
class ReminderConfigManager {
  async updateCategory(
    categoryId: string,
    config: Partial<ReminderConfiguration>
  ): Promise<void> {
    await this.db.reminderConfigs.update({
      where: { categoryId },
      data: {
        ...config,
        updatedAt: new Date()
      }
    });
    
    // Invalidate cache
    await this.cache.delete(`reminder:${categoryId}`);
    
    // Notify TIMER Agent of configuration change
    await this.timer.reloadConfiguration(categoryId);
  }
  
  async getEffectiveSchedule(
    category: string,
    deadline: Date
  ): Promise<Date[]> {
    const config = await this.getConfiguration(category);
    const reminderDates: Date[] = [];
    
    for (const interval of config.intervals) {
      const reminderTime = this.calculateTime(deadline, interval);
      if (this.respectsQuietHours(reminderTime)) {
        reminderDates.push(reminderTime);
      }
    }
    
    return reminderDates;
  }
}
```

---

## 6. AI Processing Architecture

### 6.1 Multi-Provider LLM Architecture

**Purpose:** Flexible AI provider system supporting Claude, OpenAI, and Grok with admin-configurable selection and automatic fallback.

#### Provider Abstraction Layer

```typescript
// Base LLM Provider Interface
interface LLMProvider {
  name: string;
  model: string;
  classify(email: Email): Promise<Classification>;
  extractDates(content: string): Promise<Date[]>;
  generateSummary(content: string): Promise<string>;
  extractActions(content: string): Promise<Action[]>;
  getHealthStatus(): Promise<ProviderStatus>;
}

// Claude Provider Implementation
class ClaudeProvider implements LLMProvider {
  name = 'claude';
  model = 'claude-3-5-sonnet-20241022';
  
  private client: Anthropic;
  
  constructor(config: ClaudeConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
  }
  
  async classify(email: Email): Promise<Classification> {
    const response = await this.client.messages.create({
      model: this.model,
      temperature: 0.2,
      max_tokens: 2000,
      system: CLASSIFICATION_PROMPT,
      messages: [{
        role: 'user',
        content: email.content
      }]
    });
    
    return this.parseClassification(response);
  }
}

// OpenAI Provider Implementation
class OpenAIProvider implements LLMProvider {
  name = 'openai';
  model = 'gpt-4-turbo-preview';
  
  private client: OpenAI;
  
  constructor(config: OpenAIConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
  }
  
  async classify(email: Email): Promise<Classification> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.2,
      max_tokens: 2000,
      messages: [{
        role: 'system',
        content: CLASSIFICATION_PROMPT
      }, {
        role: 'user',
        content: email.content
      }]
    });
    
    return this.parseClassification(response);
  }
}

// Grok Provider Implementation
class GrokProvider implements LLMProvider {
  name = 'grok';
  model = 'grok-2';
  
  private apiEndpoint: string;
  private apiKey: string;
  
  constructor(config: GrokConfig) {
    this.apiEndpoint = 'https://api.x.ai/v1';
    this.apiKey = config.apiKey;
  }
  
  async classify(email: Email): Promise<Classification> {
    const response = await fetch(`${this.apiEndpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        max_tokens: 2000,
        messages: [{
          role: 'system',
          content: CLASSIFICATION_PROMPT
        }, {
          role: 'user',
          content: email.content
        }]
      })
    });
    
    return this.parseClassification(await response.json());
  }
}
```

#### LLM Service Orchestrator

```typescript
class LLMService {
  private primary: LLMProvider;
  private fallback?: LLMProvider;
  private config: LLMServiceConfig;
  private metrics: MetricsCollector;
  
  constructor(config: LLMServiceConfig) {
    this.config = config;
    this.primary = this.createProvider(config.primaryProvider);
    if (config.fallbackProvider) {
      this.fallback = this.createProvider(config.fallbackProvider);
    }
  }
  
  async process(task: AITask): Promise<Result> {
    const startTime = Date.now();
    
    try {
      // Attempt with primary provider
      const result = await Promise.race([
        this.primary.process(task),
        this.timeout(this.config.timeout || 5000)
      ]);
      
      this.metrics.recordSuccess(this.primary.name, Date.now() - startTime);
      return result;
      
    } catch (primaryError) {
      console.error(`Primary LLM failed: ${primaryError}`);
      this.metrics.recordFailure(this.primary.name, primaryError);
      
      // Immediate fallback if configured
      if (this.fallback) {
        try {
          const fallbackStart = Date.now();
          const result = await this.fallback.process(task);
          
          this.metrics.recordFallbackSuccess(
            this.fallback.name, 
            Date.now() - fallbackStart
          );
          
          // Notify admin of fallback usage
          await this.notifyFallbackUsed(primaryError);
          
          return result;
        } catch (fallbackError) {
          this.metrics.recordFallbackFailure(this.fallback.name, fallbackError);
          throw new Error('Both primary and fallback LLM providers failed');
        }
      }
      
      throw primaryError;
    }
  }
  
  private createProvider(config: ProviderConfig): LLMProvider {
    switch (config.provider) {
      case 'claude':
        return new ClaudeProvider(config);
      case 'openai':
        return new OpenAIProvider(config);
      case 'grok':
        return new GrokProvider(config);
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }
  
  async switchProvider(newProvider: string): Promise<void> {
    // Admin-initiated provider switch
    const newConfig = await this.loadProviderConfig(newProvider);
    const oldPrimary = this.primary;
    
    this.primary = this.createProvider(newConfig);
    
    // Test new provider
    const testResult = await this.testProvider(this.primary);
    if (!testResult.success) {
      // Rollback on failure
      this.primary = oldPrimary;
      throw new Error(`Provider switch failed: ${testResult.error}`);
    }
    
    await this.updateConfiguration(newProvider);
  }
}
```

### 6.2 AI Processing Schema

**Purpose:** AI classification, processing, and learning

```sql
-- AI classification results
CREATE TABLE ai_classifications (
    classification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comm_id UUID REFERENCES communications(comm_id) ON DELETE CASCADE,
    
    -- Scope classification
    scope_type VARCHAR(50) NOT NULL, -- national, district, school, grade, class, individual, activity
    scope_confidence DECIMAL(3,2) NOT NULL,
    scope_reasoning TEXT,
    
    -- Category classification
    primary_category VARCHAR(50) NOT NULL, -- event, permission, deadline, etc.
    secondary_category VARCHAR(50),
    category_confidence DECIMAL(3,2) NOT NULL,
    category_reasoning TEXT,
    
    -- Priority assessment
    priority_level VARCHAR(20) NOT NULL, -- critical, high, medium, low
    priority_score INTEGER, -- 0-100
    priority_factors JSONB, -- {deadline_proximity: 0.8, sender_authority: 0.9, etc.}
    
    -- Interaction level
    interaction_level INTEGER, -- 0-5
    interaction_description TEXT,
    estimated_completion_time INTEGER, -- seconds
    required_actions JSONB, -- Array of required actions
    
    -- Extracted entities
    extracted_dates JSONB, -- Array of {date, context, confidence}
    extracted_amounts JSONB, -- Array of {amount, currency, context}
    extracted_children TEXT[], -- Children mentioned
    extracted_locations JSONB, -- Array of {location, context}
    extracted_contacts JSONB, -- Array of {name, role, contact_info}
    
    -- Model information
    model_name VARCHAR(50),
    model_version VARCHAR(20),
    processing_time_ms INTEGER,
    token_count INTEGER,
    
    -- Quality indicators
    requires_review BOOLEAN DEFAULT false,
    review_reasons TEXT[],
    human_reviewed BOOLEAN DEFAULT false,
    human_corrections JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_ai_class_comm (comm_id),
    INDEX idx_ai_class_review (requires_review),
    INDEX idx_ai_class_category (primary_category)
);

-- Classification confidence history
CREATE TABLE classification_confidence_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classification_id UUID REFERENCES ai_classifications(classification_id),
    field_name VARCHAR(50), -- scope, category, priority
    initial_confidence DECIMAL(3,2),
    final_confidence DECIMAL(3,2),
    adjustment_reason TEXT,
    adjusted_by VARCHAR(20), -- system, human, feedback
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_confidence_classification (classification_id)
);

-- Pattern recognition and learning
CREATE TABLE classification_patterns (
    pattern_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_type VARCHAR(50), -- sender, subject, content, school
    pattern_value TEXT,
    associated_scope VARCHAR(50),
    associated_category VARCHAR(50),
    associated_priority VARCHAR(20),
    confidence_score DECIMAL(3,2),
    usage_count INTEGER DEFAULT 1,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    school_id UUID REFERENCES schools(school_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_patterns_type_value (pattern_type, pattern_value),
    INDEX idx_patterns_school (school_id)
);

-- User feedback on classifications
CREATE TABLE classification_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classification_id UUID REFERENCES ai_classifications(classification_id),
    user_id UUID REFERENCES users(user_id),
    feedback_type VARCHAR(50), -- correct, incorrect_category, incorrect_priority, etc.
    correct_category VARCHAR(50),
    correct_priority VARCHAR(20),
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_feedback_classification (classification_id),
    INDEX idx_feedback_user (user_id)
);
```

### 6.3 Feature Specifications

**Purpose:** Action generation, calendar events, and task management

```sql
-- Generated action items
CREATE TABLE action_items (
    action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(family_id) ON DELETE CASCADE,
    comm_id UUID REFERENCES communications(comm_id) ON DELETE CASCADE,
    
    -- Action details
    title TEXT NOT NULL,
    description TEXT,
    action_type VARCHAR(50), -- permission, payment, rsvp, submit, review, etc.
    priority VARCHAR(20) DEFAULT 'medium',
    
    -- Assignments
    assigned_to UUID REFERENCES users(user_id),
    assigned_by UUID REFERENCES users(user_id),
    delegated_to UUID REFERENCES users(user_id),
    
    -- Related entities
    child_id UUID REFERENCES children(child_id),
    school_id UUID REFERENCES schools(school_id),
    
    -- Timing
    due_date TIMESTAMP WITH TIME ZONE,
    reminder_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
    completion_method VARCHAR(50), -- manual, external_link, auto_completed
    completion_notes TEXT,
    
    -- External completion support
    external_url TEXT,
    external_token UUID UNIQUE,
    external_data JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_actions_family (family_id),
    INDEX idx_actions_assigned (assigned_to),
    INDEX idx_actions_status (status),
    INDEX idx_actions_due (due_date),
    INDEX idx_actions_child (child_id)
);

-- Calendar events
CREATE TABLE calendar_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(family_id) ON DELETE CASCADE,
    comm_id UUID REFERENCES communications(comm_id),
    
    -- Event details
    title TEXT NOT NULL,
    description TEXT,
    event_type VARCHAR(50), -- school_event, deadline, appointment, activity
    
    -- Timing
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    all_day BOOLEAN DEFAULT false,
    timezone VARCHAR(50),
    
    -- Location
    location_name TEXT,
    location_address TEXT,
    location_url TEXT,
    is_virtual BOOLEAN DEFAULT false,
    virtual_meeting_url TEXT,
    
    -- Participants
    child_ids UUID[], -- Array of children involved
    required_attendees JSONB, -- Array of {user_id, status}
    optional_attendees JSONB,
    
    -- Recurrence
    recurrence_rule TEXT, -- iCal RRULE format
    recurrence_exceptions DATE[],
    
    -- Integration
    external_calendar_id TEXT,
    external_event_id TEXT,
    sync_status VARCHAR(20),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_events_family (family_id),
    INDEX idx_events_start (start_time),
    INDEX idx_events_child (child_ids) USING GIN
);

-- Reminders
CREATE TABLE reminders (
    reminder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(family_id) ON DELETE CASCADE,
    action_id UUID REFERENCES action_items(action_id) ON DELETE CASCADE,
    event_id UUID REFERENCES calendar_events(event_id) ON DELETE CASCADE,
    
    -- Reminder details
    reminder_type VARCHAR(20), -- action, event, custom
    title TEXT NOT NULL,
    message TEXT,
    
    -- Timing
    remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Recipients
    recipient_ids UUID[], -- Array of user IDs
    delivery_channels VARCHAR(20)[], -- whatsapp, sms, push
    
    -- Status
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, sent, cancelled, failed
    delivery_status JSONB, -- Per-recipient delivery status
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_reminders_family (family_id),
    INDEX idx_reminders_remind_at (remind_at),
    INDEX idx_reminders_status (status),
    CHECK (action_id IS NOT NULL OR event_id IS NOT NULL OR reminder_type = 'custom')
);

-- Notification queue and history
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(family_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id),
    
    -- Source
    source_type VARCHAR(50), -- action, event, reminder, communication
    source_id UUID, -- ID of source entity
    
    -- Content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_buttons JSONB, -- Array of {text, action, data}
    priority VARCHAR(20) DEFAULT 'medium',
    
    -- Delivery
    channel VARCHAR(20) NOT NULL, -- whatsapp, sms, push, email
    recipient_address TEXT, -- Phone number, email, etc.
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, queued, sent, delivered, failed
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Tracking
    message_id TEXT, -- External service message ID
    delivery_receipt JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_notifications_family (family_id),
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_scheduled (scheduled_for),
    INDEX idx_notifications_status (status)
);
```

---

## 7. Complete API Specifications

### 7.1 API Architecture Overview

**Base URL Structure:**
- Production: `https://api.schoolcierge.app/v1`
- Staging: `https://api-staging.schoolcierge.app/v1`
- Local: `http://localhost:3000/v1`

**Authentication:**
- Clerk JWT tokens for all authenticated endpoints
- Bearer token in Authorization header
- Token refresh handled by Clerk SDK

**Response Format:**
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}
```

### 7.2 Family Management Endpoints

```typescript
// POST /families/onboard
interface OnboardFamilyRequest {
  primary_parent: {
    email: string;
    phone: string;
    name: string;
    whatsapp_verified: boolean;
  };
  family_structure: {
    type: 'single' | 'dual' | 'guardian';
    members: FamilyMember[];
  };
  children: Child[];
  schools: School[];
  preferences: UserPreferences;
}

interface OnboardFamilyResponse {
  family_id: string;
  unique_email: string; // {family-id}@fwd.schoolcierge.com
  setup_complete: boolean;
  next_steps: string[];
}

// GET /families/{familyId}
interface GetFamilyResponse {
  family: FamilyProfile;
  members: FamilyMember[];
  children: Child[];
  schools: School[];
  preferences: UserPreferences;
  stats: {
    emails_processed: number;
    actions_completed: number;
    active_reminders: number;
  };
}

// PUT /families/{familyId}/preferences
interface UpdatePreferencesRequest {
  quiet_hours?: QuietHours;
  notification_channels?: ChannelPreference[];
  language?: string;
  timezone?: string;
}

// POST /families/{familyId}/children
interface AddChildRequest {
  name: string;
  grade: string;
  school_id: string;
  date_of_birth?: string;
  special_needs?: string[];
}

// DELETE /families/{familyId}/children/{childId}
interface RemoveChildResponse {
  success: boolean;
  reassigned_emails: number;
}
```

### 7.3 Communication Processing Endpoints

```typescript
// POST /webhooks/mailgun (Public endpoint for Mailgun)
interface MailgunWebhookRequest {
  signature: {
    timestamp: string;
    token: string;
    signature: string;
  };
  'event-data': {
    event: string;
    message: {
      headers: {
        to: string;
        from: string;
        subject: string;
      };
      attachments?: Attachment[];
      body?: string;
    };
  };
}

// GET /communications/{familyId}
interface GetCommunicationsRequest {
  page?: number;
  limit?: number;
  status?: 'processed' | 'pending' | 'failed';
  category?: string;
  date_from?: string;
  date_to?: string;
}

interface GetCommunicationsResponse {
  communications: Communication[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

// GET /communications/{communicationId}
interface GetCommunicationDetailResponse {
  original_email: EmailContent;
  classification: Classification;
  generated_message: GeneratedMessage;
  delivery_status: DeliveryStatus;
  actions: Action[];
  timeline: Event[];
}

// POST /communications/{communicationId}/actions/{actionId}/complete
interface CompleteActionRequest {
  completed_by: string;
  notes?: string;
  attachments?: string[];
}
```

### 7.4 Action & Task Endpoints

```typescript
// GET /actions/{familyId}
interface GetActionsRequest {
  status?: 'pending' | 'completed' | 'cancelled';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  child_id?: string;
  due_before?: string;
  due_after?: string;
}

interface GetActionsResponse {
  actions: Action[];
  summary: {
    pending: number;
    overdue: number;
    completed_today: number;
    upcoming_week: number;
  };
}

// POST /actions/{actionId}/remind
interface SetReminderRequest {
  remind_at: string; // ISO 8601
  channel: 'whatsapp' | 'push' | 'sms';
  message?: string; // Custom reminder message
}

// POST /actions/{actionId}/snooze
interface SnoozeActionRequest {
  snooze_until: string; // ISO 8601
  reason?: string;
}

// POST /actions/bulk
interface BulkActionRequest {
  action_ids: string[];
  operation: 'complete' | 'cancel' | 'snooze';
  data?: any;
}
```

### 7.5 Calendar Integration Endpoints

```typescript
// GET /calendar/{familyId}
interface GetCalendarRequest {
  start_date: string;
  end_date: string;
  children?: string[]; // Filter by child IDs
  event_types?: string[];
}

interface CalendarEvent {
  event_id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  all_day: boolean;
  location?: string;
  children: string[];
  source: 'email' | 'manual' | 'imported';
  reminders: Reminder[];
}

// POST /calendar/{familyId}/events
interface CreateEventRequest {
  title: string;
  description?: string;
  start: string;
  end: string;
  all_day?: boolean;
  location?: string;
  children: string[];
  reminders?: Reminder[];
}

// PUT /calendar/{eventId}
interface UpdateEventRequest extends Partial<CreateEventRequest> {}

// POST /calendar/{familyId}/import
interface ImportCalendarRequest {
  format: 'ics' | 'google' | 'outlook';
  data: string; // Base64 encoded file or URL
  merge_strategy: 'replace' | 'merge' | 'skip_duplicates';
}
```

### 7.6 Notification Endpoints

```typescript
// GET /notifications/{familyId}/preferences
interface GetNotificationPreferencesResponse {
  channels: {
    whatsapp: ChannelConfig;
    push: ChannelConfig;
    sms: ChannelConfig;
  };
  quiet_hours: QuietHours;
  digest_settings: DigestConfig;
}

interface ChannelConfig {
  enabled: boolean;
  priority_threshold: 'all' | 'high' | 'critical';
  categories: string[];
}

// POST /notifications/test
interface TestNotificationRequest {
  family_id: string;
  channel: 'whatsapp' | 'push' | 'sms';
  message: string;
}

// GET /notifications/{familyId}/history
interface GetNotificationHistoryRequest {
  page?: number;
  limit?: number;
  channel?: string;
  status?: 'delivered' | 'failed' | 'pending';
}
```

### 7.7 Admin Endpoints

```typescript
// GET /admin/dashboard
interface AdminDashboardResponse {
  stats: {
    total_families: number;
    active_families: number;
    emails_processed_today: number;
    emails_processed_week: number;
    classification_accuracy: number;
    average_processing_time: number;
  };
  system_health: {
    api_status: 'healthy' | 'degraded' | 'down';
    queue_depth: number;
    error_rate: number;
    response_time_p95: number;
  };
  recent_errors: SystemError[];
}

// GET /admin/schools
interface GetSchoolsRequest {
  page?: number;
  limit?: number;
  region?: string;
  verified?: boolean;
}

// POST /admin/schools
interface AddSchoolRequest {
  name: string;
  domain: string;
  region: string;
  type: 'international' | 'british' | 'american' | 'other';
  contact_email: string;
  verified: boolean;
}

// GET /admin/classifications/review
interface GetClassificationReviewRequest {
  confidence_below?: number;
  date_from?: string;
  date_to?: string;
  status?: 'pending' | 'approved' | 'corrected';
}

// POST /admin/classifications/{classificationId}/correct
interface CorrectClassificationRequest {
  correct_category: string;
  correct_priority: string;
  notes?: string;
}
```

### 7.8 Error Codes

```typescript
enum ApiErrorCode {
  // Authentication & Authorization (401x)
  AUTH_TOKEN_EXPIRED = 'AUTH_4011',
  AUTH_TOKEN_INVALID = 'AUTH_4012',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_4013',
  
  // Validation Errors (400x)
  VALIDATION_FAILED = 'VAL_4001',
  INVALID_REQUEST_FORMAT = 'VAL_4002',
  MISSING_REQUIRED_FIELD = 'VAL_4003',
  
  // Resource Errors (404x)
  RESOURCE_NOT_FOUND = 'RES_4041',
  FAMILY_NOT_FOUND = 'RES_4042',
  CHILD_NOT_FOUND = 'RES_4043',
  
  // Business Logic Errors (422x)
  DUPLICATE_CHILD = 'BUS_4221',
  INVALID_SCHOOL = 'BUS_4222',
  QUOTA_EXCEEDED = 'BUS_4223',
  
  // Server Errors (500x)
  INTERNAL_ERROR = 'SRV_5001',
  DATABASE_ERROR = 'SRV_5002',
  EXTERNAL_SERVICE_ERROR = 'SRV_5003',
}
```

### 7.9 Rate Limiting

```yaml
Rate Limits:
  Public Endpoints:
    - /webhooks/*: 1000 req/min
    
  Authenticated Endpoints:
    - Default: 100 req/min per family
    - Burst: 200 req/min for 1 minute
    
  Admin Endpoints:
    - Default: 500 req/min per admin
    
Headers:
  - X-RateLimit-Limit: Maximum requests
  - X-RateLimit-Remaining: Remaining requests
  - X-RateLimit-Reset: Reset timestamp
  
Response (429 Too Many Requests):
  {
    "error": {
      "code": "RATE_LIMIT_EXCEEDED",
      "message": "Too many requests",
      "retry_after": 60
    }
  }
```

---

## 8. External Integration Layer

### 8.1 Overview

The External Integration Layer manages all third-party service integrations for School'cierge, providing a unified interface for email ingestion, WhatsApp messaging, SMS fallback, and AI processing.

### 8.2 Email Integration (Mailgun)

#### Configuration
```javascript
{
  provider: 'mailgun',
  config: {
    apiKey: process.env.MAILGUN_API_KEY,
    domain: 'fwd.schoolcierge.com',
    webhookSigningKey: process.env.MAILGUN_WEBHOOK_KEY,
    region: 'eu' // Data residency compliance
  }
}
```

#### Webhook Processing
```typescript
interface MailgunWebhook {
  signature: {
    timestamp: string;
    token: string;
    signature: string;
  };
  'event-data': {
    event: 'stored';
    recipient: string; // chen-a47x@fwd.schoolcierge.com
    sender: string;
    subject: string;
    'body-plain': string;
    'body-html': string;
    attachments: Attachment[];
  };
}

// Webhook endpoint
async function handleMailgunWebhook(req: Request): Promise<void> {
  // 1. Verify webhook signature
  const isValid = verifyMailgunSignature(req.body.signature);
  
  // 2. Extract family ID from recipient
  const familyId = extractFamilyId(req.body['event-data'].recipient);
  
  // 3. Queue for CLARA processing
  await emailQueue.add('process-email', {
    familyId,
    emailData: req.body['event-data']
  });
}
```

#### Database Schema
```sql
CREATE TABLE mailgun_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id TEXT UNIQUE NOT NULL,
    family_id UUID REFERENCES families(family_id),
    event_type VARCHAR(50),
    recipient TEXT,
    sender TEXT,
    storage_url TEXT,
    signature_verified BOOLEAN,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 8.3 WhatsApp Integration (Whapi.Cloud)

#### Configuration
```javascript
{
  provider: 'whapi',
  config: {
    apiKey: process.env.WHAPI_API_KEY,
    apiUrl: 'https://api.whapi.cloud/v1',
    webhookUrl: 'https://api.schoolcierge.app/webhooks/whapi',
    phoneNumber: process.env.WHATSAPP_NUMBER
  }
}
```

#### Message Sending
```typescript
interface WhapiMessage {
  to: string; // +971501234567
  body: string;
  buttons?: Array<{
    id: string;
    text: string;
  }>;
  media?: {
    url: string;
    caption?: string;
  };
}

async function sendWhatsAppMessage(message: WhapiMessage): Promise<void> {
  const response = await fetch(`${WHAPI_URL}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHAPI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(message)
  });
  
  // Track delivery
  await trackMessageDelivery(response.data.messageId);
}
```

#### Webhook Events
```typescript
interface WhapiWebhookEvent {
  event: 'message.received' | 'message.read' | 'message.failed';
  data: {
    messageId: string;
    from: string;
    text?: string;
    timestamp: string;
    status?: string;
  };
}
```

#### Database Schema
```sql
CREATE TABLE whatsapp_messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT UNIQUE,
    family_id UUID REFERENCES families(family_id),
    user_id UUID REFERENCES users(user_id),
    direction VARCHAR(20), -- inbound, outbound
    phone_number TEXT NOT NULL,
    message_text TEXT,
    media_url TEXT,
    buttons JSONB,
    status VARCHAR(50), -- pending, sent, delivered, read, failed
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_whatsapp_family (family_id),
    INDEX idx_whatsapp_status (status),
    INDEX idx_whatsapp_phone (phone_number)
);
```

### 8.4 SMS Integration (Twilio)

#### Configuration
```javascript
{
  provider: 'twilio',
  config: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_PHONE_NUMBER,
    webhookUrl: 'https://api.schoolcierge.app/webhooks/twilio'
  }
}
```

#### Fallback Logic
```typescript
async function sendNotification(userId: string, message: string): Promise<void> {
  try {
    // Primary: WhatsApp
    await sendWhatsAppMessage({
      to: user.whatsappNumber,
      body: message
    });
  } catch (error) {
    // Fallback: SMS
    await sendSMS({
      to: user.phoneNumber,
      body: message
    });
  }
}
```

### 8.5 AI Integration (Claude API)

#### Configuration
```javascript
{
  provider: 'anthropic',
  config: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 4096,
    temperature: 0.3 // Lower for consistency
  }
}
```

#### Classification Request
```typescript
interface ClassificationRequest {
  emailContent: string;
  senderDomain: string;
  subject: string;
  attachments: string[];
}

async function classifyEmail(request: ClassificationRequest): Promise<Classification> {
  const prompt = buildClassificationPrompt(request);
  
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    temperature: 0.3,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });
  
  return parseClassificationResponse(response);
}
```

### 8.6 Push Notification Services

#### Overview
Push notifications serve as the primary alert mechanism for urgent school communications, with intelligent fallback to WhatsApp and SMS based on delivery confirmation and user preferences.

#### iOS Push Notifications (APNs)
```javascript
{
  provider: 'apns',
  config: {
    key: process.env.APNS_KEY,
    keyId: process.env.APNS_KEY_ID,
    teamId: process.env.APNS_TEAM_ID,
    bundleId: 'com.schoolcierge.app',
    production: process.env.NODE_ENV === 'production',
    // Enhanced configs
    maxConnections: 10,
    pushRetryLimit: 3,
    pushRetryDelay: 1000
  }
}
```

#### Android Push Notifications (FCM)
```javascript
{
  provider: 'fcm',
  config: {
    projectId: process.env.FCM_PROJECT_ID,
    privateKey: process.env.FCM_PRIVATE_KEY,
    clientEmail: process.env.FCM_CLIENT_EMAIL,
    // Enhanced configs
    messagingOptions: {
      priority: 'high',
      timeToLive: 60 * 60 * 24 // 24 hours
    }
  }
}
```

#### Push Notification Payload Structure
```typescript
interface PushNotificationPayload {
  // Common fields
  title: string;
  body: string;
  badge?: number;
  sound?: 'default' | 'urgent' | 'silent';
  
  // Data payload
  data: {
    notificationType: 'permission' | 'payment' | 'event' | 'urgent' | 'reminder';
    emailId?: string;
    actionId?: string;
    deepLink?: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    expiresAt?: string;
  };
  
  // iOS specific
  ios?: {
    interruption_level?: 'passive' | 'active' | 'time-sensitive' | 'critical';
    relevance_score?: number; // 0-1
    category?: string; // For action buttons
    thread_id?: string; // For grouping
  };
  
  // Android specific
  android?: {
    channel_id: string;
    notification_priority: 'max' | 'high' | 'default' | 'low' | 'min';
    visibility: 'public' | 'private' | 'secret';
    color?: string;
    icon?: string;
  };
}
```

#### Notification Channels & Priority Matrix
```typescript
const notificationChannels = {
  urgent: {
    name: 'Urgent School Alerts',
    importance: 'max',
    sound: 'urgent',
    vibrate: true,
    showBadge: true,
    bypassDnd: true // Critical notifications only
  },
  permissions: {
    name: 'Permission Requests',
    importance: 'high',
    sound: 'default',
    vibrate: true,
    showBadge: true
  },
  payments: {
    name: 'Payment Reminders',
    importance: 'high',
    sound: 'default',
    vibrate: false,
    showBadge: true
  },
  events: {
    name: 'School Events',
    importance: 'default',
    sound: 'default',
    vibrate: false,
    showBadge: false
  },
  general: {
    name: 'General Updates',
    importance: 'low',
    sound: null,
    vibrate: false,
    showBadge: false
  }
};
```

#### Delivery Confirmation & Fallback Logic
```typescript
interface DeliveryStrategy {
  async sendNotification(userId: string, payload: PushNotificationPayload): Promise<void> {
    try {
      // 1. Attempt push notification
      const pushResult = await sendPushNotification(userId, payload);
      
      // 2. Wait for delivery confirmation (max 30 seconds)
      const delivered = await waitForDeliveryConfirmation(pushResult.messageId, 30000);
      
      if (!delivered) {
        // 3. Fallback to WhatsApp
        const whatsappResult = await sendWhatsAppMessage(userId, {
          text: `${payload.title}\n${payload.body}`,
          priority: payload.data.priority
        });
        
        if (!whatsappResult.success) {
          // 4. Final fallback to SMS for critical messages
          if (payload.data.priority === 'critical') {
            await sendSMS(userId, `URGENT: ${payload.title} - ${payload.body}`);
          }
        }
      }
      
      // 5. Log delivery chain
      await logDeliveryAttempt({
        userId,
        channels: ['push', 'whatsapp', 'sms'],
        finalChannel: delivered ? 'push' : 'fallback',
        priority: payload.data.priority
      });
      
    } catch (error) {
      await handleDeliveryError(error, userId, payload);
    }
  }
}
```

#### Rich Notification Features
```typescript
// Interactive notification actions
const notificationActions = {
  permission: [
    { id: 'approve', title: 'Approve', authRequired: true },
    { id: 'decline', title: 'Decline', destructive: true },
    { id: 'later', title: 'Remind Later' }
  ],
  payment: [
    { id: 'view', title: 'View Details' },
    { id: 'remind', title: 'Remind Tomorrow' }
  ],
  event: [
    { id: 'calendar', title: 'Add to Calendar' },
    { id: 'details', title: 'View Details' }
  ]
};

// Handle notification actions
async function handleNotificationAction(action: NotificationAction): Promise<void> {
  switch(action.categoryId) {
    case 'permission':
      if (action.actionId === 'approve') {
        await approvePermission(action.data.actionId);
      }
      break;
    case 'payment':
      if (action.actionId === 'remind') {
        await scheduleReminder(action.data.actionId, '24h');
      }
      break;
    // ... other cases
  }
}
```

#### Push Notification Schema
```sql
CREATE TABLE push_tokens (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    platform VARCHAR(20), -- ios, android
    app_version VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(device_token),
    INDEX idx_push_user (user_id)
);

CREATE TABLE push_notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    badge_count INTEGER,
    sound VARCHAR(50),
    priority VARCHAR(20), -- high, normal
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_push_notif_user (user_id),
    INDEX idx_push_notif_status (status)
);
```

### 8.7 Integration Monitoring

#### Health Checks
```typescript
interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
}

async function checkIntegrationHealth(): Promise<ServiceHealth[]> {
  return Promise.all([
    checkMailgunHealth(),
    checkWhapiHealth(),
    checkTwilioHealth(),
    checkAnthropicHealth()
  ]);
}
```

#### Monitoring Schema
```sql
CREATE TABLE integration_health (
    health_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(50) NOT NULL,
    status VARCHAR(20),
    response_time_ms INTEGER,
    error_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    last_error TEXT,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_health_service (service_name),
    INDEX idx_health_checked (checked_at DESC)
);

```

### 8.8 Administration Interface

#### Integration Management Dashboard
- **Service Status**: Real-time health monitoring
- **API Key Management**: Secure rotation and storage
- **Webhook Configuration**: URL management and testing
- **Usage Tracking**: Service utilization monitoring
- **Error Logs**: Integration failure analysis

#### Configuration Management
```sql
CREATE TABLE integration_config (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(50) NOT NULL,
    environment VARCHAR(20), -- development, staging, production
    config_data JSONB NOT NULL, -- Encrypted sensitive data
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES admin_users(admin_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(service_name, environment)
);
```

---

## 9. Administration Systems

**Purpose:** Platform administration, monitoring, and management

```sql
-- Admin users (separate from family users)
CREATE TABLE admin_users (
    admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role VARCHAR(50) NOT NULL, -- super_admin, admin, support, analyst
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System configuration
CREATE TABLE system_configuration (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key TEXT UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    config_type VARCHAR(50), -- feature_flag, threshold, integration, display
    description TEXT,
    is_sensitive BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES admin_users(admin_id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_config_key (config_key),
    INDEX idx_config_type (config_type)
);

-- Platform metrics
CREATE TABLE platform_metrics (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL,
    metric_hour INTEGER, -- 0-23, null for daily metrics
    
    -- User metrics
    total_families INTEGER,
    active_families INTEGER,
    new_families INTEGER,
    churned_families INTEGER,
    
    -- Communication metrics
    emails_received INTEGER,
    emails_processed INTEGER,
    emails_failed INTEGER,
    avg_processing_time_ms INTEGER,
    
    -- AI metrics
    classifications_total INTEGER,
    classifications_high_confidence INTEGER,
    classifications_reviewed INTEGER,
    classification_accuracy DECIMAL(5,2),
    
    -- Notification metrics
    notifications_sent INTEGER,
    notifications_delivered INTEGER,
    notifications_failed INTEGER,
    whatsapp_sent INTEGER,
    sms_sent INTEGER,
    
    -- System metrics
    api_requests INTEGER,
    api_errors INTEGER,
    avg_response_time_ms INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_metrics_date (metric_date DESC),
    UNIQUE(metric_date, metric_hour)
);

-- Error tracking
CREATE TABLE system_errors (
    error_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_type VARCHAR(50), -- api, processing, integration, database
    error_code VARCHAR(50),
    error_message TEXT,
    stack_trace TEXT,
    context JSONB, -- Request data, user info, etc.
    severity VARCHAR(20), -- critical, high, medium, low
    affected_family_id UUID REFERENCES families(family_id),
    affected_user_id UUID REFERENCES users(user_id),
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES admin_users(admin_id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_errors_type (error_type),
    INDEX idx_errors_severity (severity),
    INDEX idx_errors_created (created_at DESC),
    INDEX idx_errors_resolved (resolved)
);

-- Admin activity log
CREATE TABLE admin_activity_log (
    activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin_users(admin_id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_admin_activity_admin (admin_id),
    INDEX idx_admin_activity_action (action),
    INDEX idx_admin_activity_created (created_at DESC)
);

-- Manual review queue
CREATE TABLE review_queue (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_type VARCHAR(50), -- classification, user_reported, anomaly
    entity_type VARCHAR(50), -- communication, action, notification
    entity_id UUID NOT NULL,
    reason TEXT,
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_to UUID REFERENCES admin_users(admin_id),
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_review, resolved, escalated
    resolution TEXT,
    resolved_by UUID REFERENCES admin_users(admin_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_review_status (status),
    INDEX idx_review_type (review_type),
    INDEX idx_review_assigned (assigned_to)
);
```

### 9.1 Queue Management Interface Schema

```sql
-- Queue monitoring and management
CREATE TABLE queue_metrics (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_name VARCHAR(50) NOT NULL, -- immediate, scheduled, retry, dead_letter
    metric_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Queue counts
    messages_waiting INTEGER DEFAULT 0,
    messages_active INTEGER DEFAULT 0,
    messages_completed INTEGER DEFAULT 0,
    messages_failed INTEGER DEFAULT 0,
    
    -- Performance metrics
    avg_wait_time_ms INTEGER,
    avg_process_time_ms INTEGER,
    throughput_per_minute INTEGER,
    
    -- Channel breakdown
    channel_counts JSONB DEFAULT '{}', -- {"whatsapp": 100, "sms": 20, "push": 5}
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_queue_metrics_name (queue_name),
    INDEX idx_queue_metrics_time (metric_timestamp DESC)
);

-- Dead letter queue management
CREATE TABLE dead_letter_messages (
    message_id UUID PRIMARY KEY,
    original_queue VARCHAR(50),
    message_content JSONB NOT NULL,
    failure_reason TEXT,
    failure_count INTEGER DEFAULT 1,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    family_id UUID REFERENCES families(family_id),
    
    -- Admin actions
    admin_action VARCHAR(50), -- retry, cancel, archive
    admin_notes TEXT,
    actioned_by UUID REFERENCES admin_users(admin_id),
    actioned_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_dead_letter_family (family_id),
    INDEX idx_dead_letter_created (created_at DESC)
);
```

### 9.2 TIMER Analytics Dashboard Schema

```sql
-- TIMER performance analytics
CREATE TABLE timer_analytics (
    analytics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analytics_date DATE NOT NULL,
    analytics_hour INTEGER, -- 0-23
    
    -- Delivery metrics by channel
    whatsapp_sent INTEGER DEFAULT 0,
    whatsapp_delivered INTEGER DEFAULT 0,
    whatsapp_failed INTEGER DEFAULT 0,
    whatsapp_avg_latency_ms INTEGER,
    
    sms_sent INTEGER DEFAULT 0,
    sms_delivered INTEGER DEFAULT 0,
    sms_failed INTEGER DEFAULT 0,
    sms_avg_latency_ms INTEGER,
    
    push_sent INTEGER DEFAULT 0,
    push_delivered INTEGER DEFAULT 0,
    push_failed INTEGER DEFAULT 0,
    push_avg_latency_ms INTEGER,
    
    -- User engagement
    messages_opened INTEGER DEFAULT 0,
    buttons_clicked INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    avg_time_to_complete_minutes INTEGER,
    
    -- Retry metrics
    retry_attempts INTEGER DEFAULT 0,
    retry_successes INTEGER DEFAULT 0,
    retry_failures INTEGER DEFAULT 0,
    channel_fallbacks INTEGER DEFAULT 0,
    
    -- Family coordination
    duplicate_preventions INTEGER DEFAULT 0,
    family_notifications INTEGER DEFAULT 0,
    coordination_conflicts INTEGER DEFAULT 0,
    
    -- Usage metrics
    whatsapp_messages_sent INTEGER DEFAULT 0,
    sms_messages_sent INTEGER DEFAULT 0,
    total_messages_sent INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_timer_analytics_date (analytics_date DESC),
    UNIQUE(analytics_date, analytics_hour)
);

-- Channel preference tracking
CREATE TABLE channel_preferences_analytics (
    preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(family_id),
    
    -- Channel success rates
    whatsapp_success_rate DECIMAL(5,2),
    sms_success_rate DECIMAL(5,2),
    push_success_rate DECIMAL(5,2),
    
    -- User preferences
    preferred_channel VARCHAR(20),
    channel_switch_count INTEGER DEFAULT 0,
    last_channel_switch_at TIMESTAMP WITH TIME ZONE,
    
    -- Engagement metrics
    avg_response_time_minutes INTEGER,
    total_interactions INTEGER DEFAULT 0,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_channel_pref_family (family_id)
);
```

### 9.3 AI Provider Configuration Schema

```sql
-- LLM Provider Configuration
CREATE TABLE llm_providers (
    provider_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name VARCHAR(50) NOT NULL, -- claude, openai, grok
    model_name VARCHAR(100) NOT NULL,
    api_endpoint TEXT,
    api_key_encrypted TEXT NOT NULL, -- Encrypted API key
    
    -- Configuration
    is_primary BOOLEAN DEFAULT false,
    is_fallback BOOLEAN DEFAULT false,
    timeout_ms INTEGER DEFAULT 5000,
    max_tokens INTEGER DEFAULT 2000,
    temperature DECIMAL(3,2) DEFAULT 0.2,
    
    -- Usage tracking
    tokens_per_1k_input INTEGER,
    tokens_per_1k_output INTEGER,
    daily_request_limit INTEGER,
    current_daily_requests INTEGER DEFAULT 0,
    
    -- Performance metrics
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    total_latency_ms BIGINT DEFAULT 0,
    last_error_at TIMESTAMP WITH TIME ZONE,
    last_error_message TEXT,
    
    -- Admin management
    is_active BOOLEAN DEFAULT true,
    configured_by UUID REFERENCES admin_users(admin_id),
    configured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_tested_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_llm_primary (is_primary),
    INDEX idx_llm_active (is_active)
);

-- LLM Usage Tracking
CREATE TABLE llm_usage_metrics (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES llm_providers(provider_id),
    metric_date DATE NOT NULL,
    metric_hour INTEGER, -- 0-23
    
    -- Usage metrics
    requests_count INTEGER DEFAULT 0,
    successful_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    fallback_count INTEGER DEFAULT 0,
    
    -- Performance metrics
    avg_latency_ms INTEGER,
    p95_latency_ms INTEGER,
    p99_latency_ms INTEGER,
    timeout_count INTEGER DEFAULT 0,
    
    -- Token usage
    input_tokens_used INTEGER DEFAULT 0,
    output_tokens_used INTEGER DEFAULT 0,
    
    -- Usage tracking
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    
    -- Classification metrics
    classifications_processed INTEGER DEFAULT 0,
    high_confidence_count INTEGER DEFAULT 0,
    low_confidence_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_llm_metrics_date (metric_date DESC),
    INDEX idx_llm_metrics_provider (provider_id, metric_date),
    UNIQUE(provider_id, metric_date, metric_hour)
);

-- Reminder Configuration Storage
CREATE TABLE reminder_configurations (
    category_id VARCHAR(50) PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    reminder_intervals JSONB NOT NULL, -- ["T-7d", "T-3d", "T-1d", "T-4h"]
    escalation_point VARCHAR(20), -- "50%" or "T-24h"
    message_templates JSONB, -- Template strings for each reminder stage
    
    -- Configuration flags
    is_active BOOLEAN DEFAULT true,
    bypass_quiet_hours BOOLEAN DEFAULT false,
    require_acknowledgment BOOLEAN DEFAULT false,
    
    -- Admin tracking
    updated_by UUID REFERENCES admin_users(admin_id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_reminder_active (is_active)
);

-- System-wide Configuration
CREATE TABLE system_quiet_hours (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_time TIME NOT NULL DEFAULT '21:00', -- 9 PM
    end_time TIME NOT NULL DEFAULT '07:00', -- 7 AM
    weekend_start_time TIME,
    weekend_end_time TIME,
    applies_to_timezone VARCHAR(50) DEFAULT 'local',
    emergency_bypass BOOLEAN DEFAULT true,
    
    updated_by UUID REFERENCES admin_users(admin_id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 10. AI System Architecture

**Purpose:** AI model management, training data, and performance tracking

```sql
-- AI models registry
CREATE TABLE ai_models (
    model_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    model_type VARCHAR(50), -- classification, extraction, generation
    provider VARCHAR(50), -- openai, anthropic, custom
    api_endpoint TEXT,
    configuration JSONB,
    performance_metrics JSONB,
    is_active BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    deployed_at TIMESTAMP WITH TIME ZONE,
    retired_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(model_name, model_version),
    INDEX idx_models_active (is_active),
    INDEX idx_models_type (model_type)
);

-- Training data management
CREATE TABLE training_data (
    training_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comm_id UUID REFERENCES communications(comm_id),
    classification_id UUID REFERENCES ai_classifications(classification_id),
    
    -- Training labels
    verified_scope VARCHAR(50),
    verified_category VARCHAR(50),
    verified_priority VARCHAR(20),
    verified_entities JSONB,
    
    -- Metadata
    verified_by UUID REFERENCES admin_users(admin_id),
    verification_method VARCHAR(50), -- manual, user_feedback, consensus
    confidence_level VARCHAR(20), -- high, medium, low
    is_test_data BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_training_verified (verified_by),
    INDEX idx_training_category (verified_category)
);

-- Model performance tracking
CREATE TABLE model_performance (
    performance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES ai_models(model_id),
    evaluation_date DATE NOT NULL,
    
    -- Accuracy metrics
    scope_accuracy DECIMAL(5,2),
    category_accuracy DECIMAL(5,2),
    priority_accuracy DECIMAL(5,2),
    overall_accuracy DECIMAL(5,2),
    
    -- Performance metrics
    avg_latency_ms INTEGER,
    p95_latency_ms INTEGER,
    p99_latency_ms INTEGER,
    total_requests INTEGER,
    failed_requests INTEGER,
    
    -- Usage metrics
    tokens_used BIGINT,
    api_requests INTEGER,
    
    -- Detailed metrics
    confusion_matrix JSONB,
    precision_recall JSONB,
    error_analysis JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_performance_model (model_id),
    INDEX idx_performance_date (evaluation_date DESC),
    UNIQUE(model_id, evaluation_date)
);

-- A/B testing for models
CREATE TABLE model_experiments (
    experiment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_name TEXT NOT NULL,
    control_model_id UUID REFERENCES ai_models(model_id),
    variant_model_id UUID REFERENCES ai_models(model_id),
    
    -- Experiment configuration
    traffic_percentage DECIMAL(5,2), -- Percentage to variant
    target_metric VARCHAR(50), -- accuracy, latency, reliability
    success_criteria JSONB,
    
    -- Status
    status VARCHAR(20) DEFAULT 'planned', -- planned, running, completed, cancelled
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    
    -- Results
    control_metrics JSONB,
    variant_metrics JSONB,
    statistical_significance DECIMAL(5,4),
    winner VARCHAR(20), -- control, variant, none
    
    created_by UUID REFERENCES admin_users(admin_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_experiments_status (status)
);

-- Classification rules engine
CREATE TABLE classification_rules (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name TEXT NOT NULL,
    rule_type VARCHAR(50), -- pre_processing, override, fallback
    
    -- Rule conditions
    conditions JSONB NOT NULL, -- Complex condition tree
    
    -- Rule actions
    actions JSONB NOT NULL, -- What to do when conditions match
    
    -- Metadata
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    school_id UUID REFERENCES schools(school_id), -- School-specific rules
    platform_id UUID REFERENCES educational_platforms(platform_id), -- Platform-specific
    
    -- Performance
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2),
    
    created_by UUID REFERENCES admin_users(admin_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_rules_active (is_active),
    INDEX idx_rules_school (school_id),
    INDEX idx_rules_platform (platform_id)
);
```

---

## 11. Service Specifications (continued from Section 3)

[Content from sections 4.4 through end remains unchanged from original document]

---

## 12. ADAPT Agent Technical Architecture

### 12.1 System Overview

The ADAPT Agent (Active Data Analysis for Product Tuning) is a system-wide intelligence layer that continuously observes operational data, detects patterns, and identifies optimization opportunities.

### 12.2 Entity Discovery Engine

```typescript
interface AdaptEvent {
  eventId: string;
  timestamp: Date;
  eventType: 'discovery' | 'anomaly' | 'pattern' | 'suggestion';
  source: 'user' | 'system' | 'ai' | 'external';
  category: string;
  
  context: {
    userId?: string;
    familyId?: string;
    schoolId?: string;
    emailId?: string;
    sessionId?: string;
  };
  
  payload: {
    entityType?: string;
    entityData?: any;
    confidence?: number;
    frequency?: number;
    impact?: 'critical' | 'high' | 'medium' | 'low';
  };
  
  actions: {
    immediate?: Action[];
    recommended?: Action[];
    completed?: Action[];
  };
  
  metadata: {
    processed: boolean;
    reviewStatus?: 'pending' | 'approved' | 'rejected';
    reviewedBy?: string;
    notes?: string;
  };
}

class EntityDiscoveryEngine {
  async processEvent(event: EmailProcessedEvent): Promise<AdaptEvent[]> {
    const discoveries: AdaptEvent[] = [];
    
    // Check for new email domain
    if (await this.isNewDomain(event.sender)) {
      discoveries.push({
        eventType: 'discovery',
        entityType: 'email_domain',
        entityData: event.sender,
        confidence: 0.95
      });
    }
    
    // Check for unknown apps
    const apps = await this.extractApps(event.content);
    for (const app of apps) {
      if (!await this.isKnownApp(app)) {
        discoveries.push({
          eventType: 'discovery',
          entityType: 'educational_app',
          entityData: app,
          confidence: this.calculateConfidence(app)
        });
      }
    }
    
    // Check for new categories
    if (!this.isKnownCategory(event.category)) {
      discoveries.push({
        eventType: 'discovery',
        entityType: 'category',
        entityData: event.category,
        confidence: event.classificationConfidence
      });
    }
    
    return discoveries;
  }
}
```

### 12.3 Quality Assurance & Monitoring System

```typescript
// Integrated Quality Assurance framework within ADAPT
class QualityAssuranceMonitor {
  private metrics: Map<string, MetricTracker>;
  private qualityGates: QualityGate[];
  private reviewQueue: ManualReviewQueue;
  
  // Automated Quality Gates
  async checkQualityGates(classification: ClassificationResult): Promise<QualityCheckResult> {
    // Confidence threshold check
    if (classification.confidence < 70) {
      return {
        action: 'manual_review',
        reason: 'Low confidence',
        priority: this.calculatePriority(classification)
      };
    }
    
    // Multi-category conflict detection
    if (classification.categories.length > 2) {
      return {
        action: 'manual_review',
        reason: 'Category ambiguity',
        priority: 'high'
      };
    }
    
    // New pattern detection
    if (!await this.matchesKnownPattern(classification)) {
      // Feed to ADAPT for learning
      await this.adaptAgent.captureNewPattern(classification);
      return {
        action: 'manual_review',
        reason: 'Unknown pattern detected',
        priority: 'medium'
      };
    }
    
    // Content validation
    if (await this.containsBlockedContent(classification)) {
      return {
        action: 'block',
        reason: 'Content violation',
        priority: 'critical'
      };
    }
    
    // Authority verification
    if (await this.senderAuthoritySuspicious(classification)) {
      return {
        action: 'manual_review',
        reason: 'Authority verification needed',
        priority: 'high'
      };
    }
    
    return {
      action: 'auto_process',
      reason: 'All quality checks passed',
      priority: 'normal'
    };
  }
  
  // Manual Review Queue Management
  async manageReviewQueue(): Promise<void> {
    const queue = await this.getReviewQueue();
    
    // Priority ordering: Urgent > Financial > Academic > General
    queue.sort((a, b) => {
      const priorityOrder = {
        'urgent': 0,
        'financial': 1,
        'academic': 2,
        'general': 3
      };
      return priorityOrder[a.category] - priorityOrder[b.category];
    });
    
    // Round-robin assignment to admins
    const admins = await this.getAvailableAdmins();
    let adminIndex = 0;
    
    for (const item of queue) {
      item.assignedTo = admins[adminIndex];
      item.slaTarget = this.calculateSLA(item.priority); // 2 hours for urgent
      adminIndex = (adminIndex + 1) % admins.length;
      
      // Capture corrections for ADAPT learning
      item.onCorrection = async (correction) => {
        await this.adaptAgent.learnFromCorrection(item, correction);
      };
    }
  }
  
  // Anomaly Detection
  async detectAnomalies(metrics: SystemMetrics): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // Email volume flood detection
    if (metrics.emailVolume > metrics.dailyAverage * 3) {
      anomalies.push({
        type: 'flood_protection',
        severity: 'high',
        action: 'throttle_processing'
      });
    }
    
    // New sender + financial category
    if (metrics.newSenderDomain && metrics.category === 'financial') {
      anomalies.push({
        type: 'security_check',
        severity: 'critical',
        action: 'manual_review'
      });
    }
    
    // Mass communication detection
    if (metrics.identicalContentCount > 10) {
      anomalies.push({
        type: 'mass_communication',
        severity: 'medium',
        action: 'verify_source'
      });
    }
    
    // Performance degradation
    if (metrics.processingTime > 10000) {
      anomalies.push({
        type: 'performance_alert',
        severity: 'medium',
        action: 'scale_resources'
      });
    }
    
    // Model accuracy degradation
    if (metrics.dailyAccuracy < 0.60 && metrics.volumeProcessed > 100) {
      anomalies.push({
        type: 'model_review_needed',
        severity: 'high',
        action: 'retrain_model'
      });
    }
    
    return anomalies;
  }
  
  // Performance Monitoring
  async monitorPerformance(): Promise<PerformanceReport> {
    const metrics = await this.prometheusClient.query({
      queries: [
        'clara_classification_accuracy_rate',
        'clara_processing_duration_seconds',
        'clara_confidence_score_distribution',
        'clara_manual_review_queue_depth',
        'clara_ai_api_errors_total',
        'adapt_learning_improvements',
        'adapt_pattern_discoveries'
      ]
    });
    
    return {
      timestamp: new Date(),
      classificationAccuracy: metrics.clara_classification_accuracy_rate,
      processingLatency: metrics.clara_processing_duration_seconds,
      confidenceDistribution: metrics.clara_confidence_score_distribution,
      reviewQueueDepth: metrics.clara_manual_review_queue_depth,
      apiErrors: metrics.clara_ai_api_errors_total,
      adaptImprovements: metrics.adapt_learning_improvements,
      newDiscoveries: metrics.adapt_pattern_discoveries,
      overallHealth: this.calculateHealth(metrics)
    };
  }
  
  // Quality Feedback Loop
  async processQualityFeedback(feedback: QualityFeedback): Promise<void> {
    // 1. Capture correction
    await this.captureCorrection(feedback);
    
    // 2. ADAPT analyzes patterns
    const patterns = await this.adaptAgent.analyzeCorrections(feedback.familyId);
    
    // 3. Update classification rules
    if (patterns.length > 0) {
      await this.updateClassificationRules(patterns);
    }
    
    // 4. Adjust confidence thresholds
    const newThresholds = await this.calculateOptimalThresholds(patterns);
    await this.updateConfidenceThresholds(newThresholds);
    
    // 5. Track improvement metrics
    await this.trackImprovements({
      baselineAccuracy: feedback.beforeAccuracy,
      currentAccuracy: feedback.afterAccuracy,
      improvementRate: (feedback.afterAccuracy - feedback.beforeAccuracy) / feedback.beforeAccuracy,
      patternsLearned: patterns.length
    });
  }
}
```

### 12.4 Strategic Intelligence Generator

```typescript
class StrategicIntelligence {
  async generateInsights(): Promise<StrategicInsight[]> {
    const insights: StrategicInsight[] = [];
    
    // Market expansion opportunities
    const geoAnalysis = await this.analyzeGeographicPatterns();
    if (geoAnalysis.newRegions.length > 0) {
      insights.push({
        type: 'market_opportunity',
        title: 'Geographic Expansion Opportunity',
        evidence: geoAnalysis,
        confidence: 0.85,
        potentialImpact: 'high',
        recommendations: [
          'Add region-specific configurations',
          'Recruit local language support',
          'Partner with regional schools'
        ]
      });
    }
    
    // Language requirements
    const langAnalysis = await this.analyzeLanguageNeeds();
    if (langAnalysis.unsupportedLanguages.length > 0) {
      insights.push({
        type: 'feature_requirement',
        title: 'Language Support Needed',
        evidence: langAnalysis,
        confidence: 0.92,
        potentialImpact: 'medium',
        recommendations: [
          'Add multilingual support to AI prompts',
          'Translate key message templates',
          'Recruit language-specific support staff'
        ]
      });
    }
    
    return insights;
  }
}
```

### 12.5 Data Storage Architecture

```sql
-- ADAPT event storage
CREATE TABLE adapt_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    source VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    
    -- Context
    user_id UUID REFERENCES users(user_id),
    family_id UUID REFERENCES families(family_id),
    school_id UUID REFERENCES schools(school_id),
    email_id UUID REFERENCES emails(email_id),
    session_id UUID,
    
    -- Payload
    entity_type VARCHAR(50),
    entity_data JSONB,
    confidence DECIMAL(3,2),
    frequency INTEGER,
    impact VARCHAR(20),
    
    -- Actions
    immediate_actions JSONB,
    recommended_actions JSONB,
    completed_actions JSONB,
    
    -- Metadata
    processed BOOLEAN DEFAULT false,
    review_status VARCHAR(20),
    reviewed_by UUID REFERENCES admin_users(admin_id),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_adapt_type (event_type),
    INDEX idx_adapt_status (review_status),
    INDEX idx_adapt_created (created_at DESC)
);

-- Discovery entities
CREATE TABLE discovered_entities (
    entity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_name TEXT NOT NULL,
    entity_data JSONB NOT NULL,
    
    -- Discovery metadata
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    occurrence_count INTEGER DEFAULT 1,
    confidence_score DECIMAL(3,2),
    
    -- Review status
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, auto_approved
    approved_by UUID REFERENCES admin_users(admin_id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- System integration
    integrated BOOLEAN DEFAULT false,
    integration_data JSONB,
    
    INDEX idx_discovered_type (entity_type),
    INDEX idx_discovered_status (status),
    INDEX idx_discovered_confidence (confidence_score DESC)
);

-- Strategic insights
CREATE TABLE strategic_insights (
    insight_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    
    -- Evidence and confidence
    evidence JSONB NOT NULL,
    confidence DECIMAL(3,2),
    potential_impact VARCHAR(20),
    
    -- Recommendations
    recommendations JSONB,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'new', -- new, reviewed, implemented, dismissed
    reviewed_by UUID REFERENCES admin_users(admin_id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_insights_type (insight_type),
    INDEX idx_insights_status (status),
    INDEX idx_insights_impact (potential_impact)
);
```

### 12.6 Integration Points

```typescript
// CLARA Integration
class ClaraAdaptIntegration {
  async onEmailClassified(event: ClassificationEvent): Promise<void> {
    // Send to ADAPT for analysis
    await adaptAgent.processEvent({
      eventType: 'classification',
      source: 'clara',
      context: {
        emailId: event.emailId,
        familyId: event.familyId
      },
      payload: {
        category: event.category,
        confidence: event.confidence,
        processingTime: event.processingTime
      }
    });
  }
}

// TIMER Integration
class TimerAdaptIntegration {
  async onMessageDelivered(event: DeliveryEvent): Promise<void> {
    // Track delivery metrics
    await adaptAgent.processEvent({
      eventType: 'delivery',
      source: 'timer',
      context: {
        familyId: event.familyId,
        messageId: event.messageId
      },
      payload: {
        channel: event.channel,
        success: event.success,
        latency: event.latency
      }
    });
  }
}

// Admin Integration
class AdminAdaptIntegration {
  async getDiscoveryQueue(): Promise<DiscoveryItem[]> {
    return await db.query(`
      SELECT * FROM discovered_entities 
      WHERE status = 'pending'
      ORDER BY confidence_score DESC, occurrence_count DESC
      LIMIT 50
    `);
  }
  
  async approveEntity(entityId: string, adminId: string): Promise<void> {
    await db.transaction(async (trx) => {
      // Update entity status
      await trx.update('discovered_entities', {
        status: 'approved',
        approved_by: adminId,
        approved_at: new Date()
      }).where({ entity_id: entityId });
      
      // Trigger system integration
      await this.integrateEntity(entityId);
    });
  }
}
```

---

## 13. Security Architecture

### 13.1 Authentication & Authorization

**Primary Auth Provider: Clerk**
```yaml
Provider: Clerk.dev
Tier: Free (<10,000 users)
Features:
  - JWT-based authentication
  - Social login (Google, Apple)
  - WhatsApp OTP (custom integration)
  - Multi-device sessions
  - MFA support
```

**Authorization Model:**
```typescript
interface AuthorizationRules {
  // Role-based access control
  roles: {
    family_admin: string[];      // Primary parent
    family_member: string[];     // Other parents/guardians
    platform_admin: string[];    // School'cierge staff
    school_admin: string[];      // School administrators
  };
  
  // Resource-based permissions
  resources: {
    family_data: 'own' | 'none';
    children_data: 'own' | 'none';
    communications: 'own' | 'none';
    admin_panel: 'full' | 'limited' | 'none';
  };
}

// Row-Level Security (RLS) implementation
const RLS_POLICIES = {
  families: 'auth.uid() = family_members.user_id',
  children: 'auth.uid() IN (SELECT user_id FROM family_members WHERE family_id = children.family_id)',
  communications: 'auth.uid() IN (SELECT user_id FROM family_members WHERE family_id = communications.family_id)'
};
```

### 13.2 Data Protection

**Encryption Standards:**
```yaml
At Rest:
  - Database: AES-256-GCM (PostgreSQL native)
  - File Storage: AES-256-CBC
  - Backups: AES-256 with key rotation
  
In Transit:
  - API: TLS 1.3 minimum
  - Internal Services: mTLS where possible
  - Webhooks: HTTPS only with signature verification
  
Sensitive Fields:
  - Phone numbers: Hashed with salt
  - Children DOB: Encrypted
  - Payment info: Never stored (redirect to provider)
```

**PII Handling:**
```typescript
class PIIHandler {
  // Automatic PII detection
  private piiPatterns = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    phone: /\+?[1-9]\d{1,14}/g,
    creditCard: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g
  };
  
  // Redaction for logs
  redactPII(text: string): string {
    let redacted = text;
    Object.entries(this.piiPatterns).forEach(([type, pattern]) => {
      redacted = redacted.replace(pattern, `[REDACTED_${type.toUpperCase()}]`);
    });
    return redacted;
  }
  
  // GDPR compliance
  async handleDataRequest(userId: string, type: 'export' | 'delete') {
    if (type === 'export') {
      return await this.exportUserData(userId);
    } else {
      return await this.deleteUserData(userId);
    }
  }
}
```

### 13.3 API Security

**Rate Limiting Implementation:**
```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

const rateLimiters = {
  // Standard API endpoints
  standard: rateLimit({
    store: new RedisStore({ client: redis }),
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: 'Too many requests',
    standardHeaders: true,
    legacyHeaders: false,
  }),
  
  // Webhook endpoints
  webhook: rateLimit({
    store: new RedisStore({ client: redis }),
    windowMs: 60 * 1000,
    max: 1000,
    skip: (req) => verifyWebhookSignature(req),
  }),
  
  // Auth endpoints
  auth: rateLimit({
    store: new RedisStore({ client: redis }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    skipSuccessfulRequests: true,
  })
};
```

**Input Validation:**
```typescript
import { z } from 'zod';

// Example validation schema
const OnboardFamilySchema = z.object({
  primary_parent: z.object({
    email: z.string().email(),
    phone: z.string().regex(/^\+[1-9]\d{1,14}$/),
    name: z.string().min(2).max(100),
    whatsapp_verified: z.boolean()
  }),
  children: z.array(z.object({
    name: z.string().min(2).max(100),
    grade: z.string(),
    school_id: z.string().uuid()
  })).min(1).max(10)
});

// Middleware
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
  };
};
```

### 13.4 Compliance

**GDPR Compliance:**
```yaml
Data Subject Rights:
  - Right to Access: GET /api/gdpr/export
  - Right to Rectification: PUT /api/profile/*
  - Right to Erasure: DELETE /api/gdpr/delete
  - Right to Portability: GET /api/gdpr/export?format=json
  
Data Retention:
  - Active accounts: Indefinite
  - Inactive accounts: 2 years
  - Deleted accounts: 30 days (soft delete)
  - Logs: 90 days
  - Backups: 1 year
  
Consent Management:
  - Explicit consent for data processing
  - Granular consent options
  - Consent withdrawal mechanism
  - Audit trail of consent changes
```

---

## 14. Performance Specifications

### 14.1 Service Level Objectives (SLOs)

```yaml
Availability:
  - API Uptime: 99.9% (43.8 min/month downtime)
  - WhatsApp Delivery: 99.5%
  - Email Processing: 99.9%
  
Response Times (P95):
  - API Endpoints: <100ms
  - Email Classification: <5 seconds
  - WhatsApp Delivery: <2 seconds
  - Mobile App Load: <3 seconds
  
Throughput:
  - Concurrent Families: 10,000
  - Emails/minute: 1,000
  - API requests/second: 100
  - WhatsApp messages/second: 50
```

### 14.2 Performance Optimization

**Database Optimization:**
```sql
-- Critical Indexes
CREATE INDEX idx_communications_family_created 
  ON communications(family_id, created_at DESC);
  
CREATE INDEX idx_actions_family_status_priority 
  ON actions(family_id, status, priority DESC);
  
CREATE INDEX idx_children_family 
  ON children(family_id);

-- Partitioning for large tables
CREATE TABLE communications_2025_q1 PARTITION OF communications
  FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
  
-- Query optimization
EXPLAIN ANALYZE
SELECT c.*, cl.category, cl.priority
FROM communications c
JOIN classifications cl ON c.id = cl.communication_id
WHERE c.family_id = $1
  AND c.created_at > NOW() - INTERVAL '30 days'
ORDER BY cl.priority DESC, c.created_at DESC
LIMIT 50;
```

**Caching Strategy:**
```typescript
class CacheManager {
  private strategies = {
    // User session cache
    session: {
      ttl: 3600, // 1 hour
      key: (userId: string) => `session:${userId}`
    },
    
    // Family data cache
    family: {
      ttl: 300, // 5 minutes
      key: (familyId: string) => `family:${familyId}`,
      invalidateOn: ['family.update', 'child.add', 'child.remove']
    },
    
    // School data cache (rarely changes)
    school: {
      ttl: 86400, // 24 hours
      key: (schoolId: string) => `school:${schoolId}`
    },
    
    // Classification results cache
    classification: {
      ttl: 604800, // 7 days
      key: (emailHash: string) => `classification:${emailHash}`
    }
  };
  
  async get<T>(type: string, id: string): Promise<T | null> {
    const strategy = this.strategies[type];
    const key = strategy.key(id);
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  async set<T>(type: string, id: string, data: T): Promise<void> {
    const strategy = this.strategies[type];
    const key = strategy.key(id);
    await redis.setex(key, strategy.ttl, JSON.stringify(data));
  }
}
```

### 14.3 Scalability Design

**Horizontal Scaling:**
```yaml
API Servers:
  - Auto-scaling: 2-10 instances
  - Trigger: CPU > 70% or Memory > 80%
  - Load Balancer: Railway built-in
  
Queue Workers:
  - Email Processing: 1-5 workers
  - Notification Delivery: 1-3 workers
  - TIMER Tasks: 1-2 workers
  - Scale based on queue depth
  
Database:
  - Primary: 1 instance (Railway managed)
  - Read Replicas: 0-2 (as needed)
  - Connection Pooling: 20-100 connections
```

**Performance Monitoring:**
```typescript
import { metrics } from '@opentelemetry/api-metrics';

class PerformanceMonitor {
  private meter = metrics.getMeter('schoolcierge', '1.0.0');
  
  // Request duration histogram
  private requestDuration = this.meter.createHistogram('http_request_duration', {
    description: 'HTTP request duration in milliseconds',
    unit: 'ms'
  });
  
  // Active connections gauge
  private activeConnections = this.meter.createUpDownCounter('active_connections', {
    description: 'Number of active connections'
  });
  
  // Queue depth gauge
  private queueDepth = this.meter.createObservableGauge('queue_depth', {
    description: 'Number of jobs in queue'
  });
  
  // Track API performance
  trackRequest(method: string, path: string, duration: number, status: number) {
    this.requestDuration.record(duration, {
      method,
      path,
      status: status.toString()
    });
  }
}
```

---

## 15. Error Handling & Recovery

### 15.1 Error Classification

```typescript
enum ErrorSeverity {
  CRITICAL = 'critical',  // System down, immediate action
  HIGH = 'high',         // Major feature broken
  MEDIUM = 'medium',     // Feature degraded
  LOW = 'low'           // Minor issue
}

interface SystemError {
  code: string;
  message: string;
  severity: ErrorSeverity;
  context: Record<string, any>;
  stack?: string;
  timestamp: Date;
  userId?: string;
  familyId?: string;
}
```

### 15.2 Error Recovery Strategies

```typescript
class ErrorRecovery {
  // Retry with exponential backoff
  async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts: number;
      baseDelay: number;
      maxDelay: number;
      factor: number;
    }
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === options.maxAttempts) {
          throw error;
        }
        
        const delay = Math.min(
          options.baseDelay * Math.pow(options.factor, attempt - 1),
          options.maxDelay
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
  
  // Circuit breaker pattern
  createCircuitBreaker(
    fn: Function,
    options: {
      threshold: number;
      timeout: number;
      resetTimeout: number;
    }
  ) {
    let failures = 0;
    let lastFailTime: number;
    let state: 'closed' | 'open' | 'half-open' = 'closed';
    
    return async (...args: any[]) => {
      if (state === 'open') {
        if (Date.now() - lastFailTime > options.resetTimeout) {
          state = 'half-open';
        } else {
          throw new Error('Circuit breaker is open');
        }
      }
      
      try {
        const result = await fn(...args);
        if (state === 'half-open') {
          state = 'closed';
          failures = 0;
        }
        return result;
      } catch (error) {
        failures++;
        lastFailTime = Date.now();
        
        if (failures >= options.threshold) {
          state = 'open';
        }
        
        throw error;
      }
    };
  }
}
```

### 15.3 Graceful Degradation

```typescript
class GracefulDegradation {
  // Fallback for AI classification
  async classifyWithFallback(email: Email): Promise<Classification> {
    try {
      // Primary: Claude 3.5 Sonnet
      return await this.claudeClassify(email);
    } catch (error) {
      console.error('Claude classification failed:', error);
      
      try {
        // Fallback: GPT-4
        return await this.gptClassify(email);
      } catch (fallbackError) {
        console.error('GPT classification failed:', fallbackError);
        
        // Final fallback: Rule-based classification
        return this.ruleBasedClassify(email);
      }
    }
  }
  
  // Fallback for WhatsApp delivery
  async deliverWithFallback(message: Message): Promise<DeliveryResult> {
    try {
      // Primary: Whapi.Cloud
      return await this.whapiDeliver(message);
    } catch (error) {
      console.error('Whapi delivery failed:', error);
      
      try {
        // Fallback: 2Chat.io
        return await this.twoChatDeliver(message);
      } catch (fallbackError) {
        console.error('2Chat delivery failed:', fallbackError);
        
        // Final fallback: SMS
        return await this.smsDeliver(message);
      }
    }
  }
}
```

---

## 16. Deployment Configuration

### 16.1 Environment Configuration

```yaml
# .env.production
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@postgres.railway.internal:5432/schoolcierge
REDIS_URL=redis://default:pass@redis.railway.internal:6379

# Authentication (Clerk)
CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
CLERK_PUBLISHABLE_KEY=${CLERK_PUBLISHABLE_KEY}
CLERK_WEBHOOK_SECRET=${CLERK_WEBHOOK_SECRET}

# WhatsApp (Whapi.Cloud)
WHAPI_TOKEN=${WHAPI_TOKEN}
WHAPI_INSTANCE_ID=${WHAPI_INSTANCE_ID}
WHAPI_WEBHOOK_URL=https://api.schoolcierge.app/webhooks/whapi

# AI Services
CLAUDE_API_KEY=${CLAUDE_API_KEY}
OPENAI_API_KEY=${OPENAI_API_KEY}  # Fallback

# Email (Mailgun)
MAILGUN_API_KEY=${MAILGUN_API_KEY}
MAILGUN_DOMAIN=fwd.schoolcierge.com
MAILGUN_WEBHOOK_SIGNING_KEY=${MAILGUN_WEBHOOK_SIGNING_KEY}

# Monitoring
SENTRY_DSN=${SENTRY_DSN}
DATADOG_API_KEY=${DATADOG_API_KEY}
```

### 16.2 Railway Deployment

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build",
    "watchPatterns": ["src/**", "package.json"]
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  },
  "services": [
    {
      "name": "api",
      "source": ".",
      "domains": ["api.schoolcierge.app"],
      "variables": {
        "PORT": 3000,
        "NODE_ENV": "production"
      }
    },
    {
      "name": "postgres",
      "image": "postgres:15",
      "volumes": ["/data/postgres"],
      "variables": {
        "POSTGRES_DB": "schoolcierge",
        "POSTGRES_USER": "schoolcierge"
      }
    },
    {
      "name": "redis",
      "image": "redis:7-alpine",
      "volumes": ["/data/redis"]
    }
  ]
}
```

### 16.3 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run test:e2e
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      - uses: berviantoleo/railway-deploy@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: api
```

### 16.4 Monitoring & Observability

```typescript
// Structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'schoolcierge-api',
    environment: process.env.NODE_ENV
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({
      filename: 'error.log',
      level: 'error'
    })
  ]
});

// Health checks
app.get('/health', async (req, res) => {
  const checks = {
    api: 'healthy',
    database: await checkDatabase(),
    redis: await checkRedis(),
    whatsapp: await checkWhatsApp(),
    ai: await checkAIService()
  };
  
  const allHealthy = Object.values(checks).every(s => s === 'healthy');
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  });
});
```

---

**Document End**

*This Technical Requirements Document provides the complete technical blueprint for School-cierge implementation and will be updated regularly as the architecture evolves.*