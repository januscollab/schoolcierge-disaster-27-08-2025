# School'cierge Product Requirements Document

*Comprehensive product specification for AI-powered family communication platform*

**Related Documents:**
- Technical Requirements Document (TRD) - All technical specifications and data structures
- API Documentation - Implementation details
- Feature Definition: CLARA - Virtual pipeline architecture details
- School'cierge Conversation Strategy Framework v2.0 - AI communication principles and WhatsApp interaction patterns



---

# 2. Parent HOME (**H**ub for **O**rganizing **M**essages & **E**vents) Core Features

## 2.1 Family Onboarding System

### Overview
**[REQ-001]** Streamlined onboarding that captures essential family information, configures communication preferences, and establishes email forwarding in under 10 minutes.

### Key Components

#### 1. Account Creation & Authentication

**What it does:** Establishes secure family access with multi-step verification to ensure reliable communication delivery and prevent unauthorized access.

**Key Features:**
- **[REQ-002]** Email/password authentication with social login options (Google, Apple)
- **[REQ-003]** Required email verification for forwarding setup
- **[REQ-004]** Required phone number verification for WhatsApp delivery
- **[REQ-005]** WhatsApp number confirmation (same as phone or different)
- **[REQ-006]** Communication preference selection (WhatsApp primary, SMS backup)
- **[REQ-007]** Optional 2FA for enhanced security

**Implementation Requirements:**
```
Authentication Options (Powered by Clerk):

PRIMARY METHOD - WhatsApp OTP:
1. Enter phone number → Send WhatsApp OTP
2. Enter 6-digit code from WhatsApp
3. Account created/accessed → Continue to family setup

ALTERNATIVE METHODS - Social Login:
- Continue with Google (one-click)
- Continue with Apple (Face ID/Touch ID)
- Email magic link (passwordless fallback)

Authentication Flow:
1. Parent chooses auth method:
   - "Continue with WhatsApp" (prominent green button)
   - "Sign in with Google" 
   - "Sign in with Apple"
   - "Use email instead" (small link)

2. WhatsApp OTP Process:
   - Enter phone → Receive WhatsApp: "School'cierge code: 483921"
   - Enter code → Instantly authenticated
   - No passwords ever required

3. Account linking:
   - All methods link to same account
   - Parent can add multiple login methods
   - Switch between methods anytime

Validation Rules:
- Phone: E.164 format with country code
- WhatsApp: Active WhatsApp account required
- OTP: 6 digits, 5-minute expiry
- Session: 30-day persistence on device
- No password requirements (passwordless system)
```

**User Experience:** Zero-friction authentication with familiar methods. WhatsApp OTP for primary audience, social login for tech-savvy parents. No passwords to remember or reset.

**Unique Forwarding Address Generation:**
```
After email verification:
1. Generate unique family email: {family-id}@fwd.schoolcierge.com
2. Display prominently: "Your School'cierge email address:"
   📧 chen-family-a47x@fwd.schoolcierge.com
3. Instructions: "Forward school emails to this address"
4. Setup options:
   - [Copy Address] 
   - [Email Instructions to Me]
   - [Setup Auto-Forwarding Guide]
   
Address Format:
- Pattern: {lastname}-{uniqueid}@fwd.schoolcierge.com
- Example: smith-fx3k@fwd.schoolcierge.com
- Guaranteed unique per family
- Never recycled or reassigned
```

**Error Handling:**
- Invalid email format: "Please enter a valid email address"
- Existing account: "This email is already registered. [Login] [Reset Password]"
- SMS delivery failure: "Unable to send SMS. [Try Again] [Use Different Number]"
- Verification timeout: Codes expire after 10 minutes

**Admin Capabilities:**
- **Account Monitoring Dashboard**:
  - Registration funnel metrics (started → email verified → phone verified → complete)
  - Verification failure rates by type (email bounce, SMS undelivered, code expired)
  - Average time to complete registration
  - Geographic distribution of signups

- **Support Tools**:
  - Manual verification override (with audit log)
  - Resend verification codes (max 3 per hour)
  - Account unlock after 5 failed login attempts
  - Password reset link generation
  - View verification history and timestamps

- **Account Recovery Process**:
  1. Verify identity (email + security question)
  2. Send recovery code to backup email/phone
  3. Allow password reset
  4. Log recovery action with admin ID

**Data Structure:** See TRD Section 4.1 - Account Profile Schema

#### 2. Dependent Profile Setup

**What it does:** Creates comprehensive profiles for each child, organizing their school information and determining communication routing.

**Key Features:**
- **[REQ-008]** Child profiles with avatar, nickname, and grade level
- **[REQ-009]** School and teacher associations
- **[REQ-010]** Care team definition (who receives what information)
- **[REQ-011]** Emergency contact management

**Implementation Requirements:**
```
Profile Creation Flow:
1. Add Child → Enter name, nickname, DOB
2. Upload Photo → Crop to square, max 5MB
3. Select School → Search from database or add new
4. Assign Grade → Dropdown (Pre-K through 12)
5. Define Care Team → Select family members
6. Set Routing → Configure who gets what

Validation Rules:
- Name: 2-50 characters, UTF-8 support
- Nickname: Optional, 2-20 characters
- DOB: Must be between 3-18 years old
- Photo: JPEG/PNG, max 5MB, auto-resize to 400x400
- Grade: Must match school's grade structure
```

**Care Team Configuration:**
- **Primary**: Gets all communications (required)
- **Secondary**: Gets urgent + selected categories
- **Emergency**: Only critical/safety alerts
- **Info Only**: Non-actionable updates

**User Experience:** Step-by-step wizard with progress bar. Each child gets a colorful profile card. Visual care team builder: "Drag family members to Emma's care team and set their notification level."

**Smart Defaults:**
- Parents → Primary caregivers
- Grandparents → Info only
- Nanny/Au pair → Operational updates
- Emergency contacts → Critical only 

**Dependencies:** Integrates with School Selection and Educational Apps Setup to build complete child profiles.

**Data Structure:** See TRD Section 4.2 - Dependent Profile Schema

#### 3. Family Structure Configuration

**What it does:** Captures complex modern family structures and establishes intelligent routing rules for family coordination.

**Key Features:**
- **[REQ-012]** Support for up to 10 family members (parents, guardians, grandparents, caregivers)
- **[REQ-013]** Role-based notification defaults (customizable per person)
- **[REQ-014]** Single primary account holder manages family settings
- **[REQ-015]** Visual family tree with routing preferences

**Supported Roles with Notification Defaults:**
```
Parent (Full Access):
  - All communication types enabled
  - Can complete actions/permissions
  - Can modify family settings
  - Default: Immediate delivery

Guardian (Configurable):
  - Preset templates: "Everything", "Urgent Only", "Daily Digest"
  - Customizable by category
  - Cannot modify family settings
  - Default: Important + Urgent

Caregiver/Nanny (Operational):
  - Daily schedules and pickups
  - Supply/uniform reminders
  - Activity updates
  - Default: Operational only

Grandparent (Information):
  - Events and celebrations
  - Academic achievements
  - Photos and updates
  - Default: Weekly digest

Child 13+ (Limited):
  - Own homework reminders
  - Personal permission slips
  - After-school activities
  - Default: Age-appropriate only

Emergency Contact (Critical):
  - School closures
  - Medical emergencies
  - Safety alerts only
  - Default: Critical only
```

**User Experience:** Interactive family tree builder with drag-and-drop interface:
1. **Add Member**: Click (+) → Enter name/relationship → Send invite
2. **Set Permissions**: Slider for notification level (All → Urgent → None)
3. **Quick Templates**: "Two Parents", "Au Pair Family", "Grandparent Care"
4. **Visual Indicators**: Green (active), Yellow (pending), Gray (inactive)

**Invitation Process:**
```
1. Enter family member details:
   - Name and relationship
   - Email address (required)
   - Phone number (required)
   - WhatsApp number (if different from phone)
2. Generate secure invite link (expires 7 days)
3. Send invitation via email AND WhatsApp
4. Recipient clicks → Verify phone → Create password
5. Set their communication preferences:
   - WhatsApp (default) / SMS / Both
   - Quiet hours preferences
6. Auto-assign default permissions by role
7. Primary account holder confirms activation
```

**Family Coordination:**
- Basic notification preferences per parent
- Simple duplicate prevention for action items
- Category-based routing (e.g., financial notifications)

**Note:** School selection, app configuration, and communication preferences are integrated into this flow, not separate features.

**Data Structure:** See TRD Section 4.3 - Family Profile Schema

#### 4. School Selection & Data Capture

**What it does:** Connects children to schools with automatic configuration of communication patterns and email domains.

**Key Features:**
- **[REQ-016]** Search interface with school logos and verification
- **[REQ-017]** Automatic email domain configuration  
- **[REQ-018]** Inherited communication patterns per school
- **[REQ-019]** Community contribution for missing schools

**Implementation Requirements:**

```
School Search Algorithm:
1. Geolocation → Show nearby schools first
2. Text search → Fuzzy match school names
3. Filter by → Country, curriculum, grade levels
4. Verification → Blue checkmark for verified schools

Auto-Configuration on Selection (information soruced from schools databas):
- Email domains: [@school.edu, @schoolname.ae]
- Sender patterns: [admin@, noreply@, newsletter@]
- Calendar format: Term dates, holidays
- Time zone: School's local timezone
- Communication templates: School-specific formats
```

**Missing School Workflow:**
```
1. "Can't find your school?" → Add New
2. Enter: Name, Website, City, Country
3. Upload: Logo (optional)
4. Submit → Creates DRAFT record
5. Admin notification → Review within 24h
6. Email user when approved
```

**Automatic Inheritance:**
- Principal emails → High priority
- finance@ → Payment category
- sports@ → Activities category
- nurse@ → Health category
- Standard working hours (7 AM - 5 PM)

**User Experience:** 
1. **Search Bar**: "Type your school name..." with live results
2. **School Cards**: Logo, name, location, "500 families connected"
3. **One-Click Setup**: Select → "✓ Email patterns configured"
4. **Verification Badge**: Blue check for admin-verified schools
5. **Quick Actions**: [Select] [Report Issue] [Missing? Add School]

**Search Results Display:**
```
🏫 Dubai International Academy ✓
   Al Barsha, Dubai • 523 families
   [Select School]

🏫 Dubai International School
   Academic City • 341 families
   [Select School]

   Can't find your school? [Add New]
```

**Integration:** Part of child profile setup, not a standalone feature.

**Data Structure:** See TRD Section 4.4 - School Selection Schema

#### 5. Educational Apps Selection

**What it does:** Identifies educational platforms used by the school and configures automatic email recognition.

**Key Features:**
- **[REQ-020]** Visual grid of popular apps (Toddle, SchoolsBuddy, Seesaw, etc.)
- **[REQ-021]** One-click enablement with logo recognition
- **[REQ-022]** Automatic email pattern configuration
- **[REQ-023]** Community contribution for missing apps

**Implementation Requirements:**
```
App Configuration per Platform:

Toddle:
  - Domains: [@toddle.com, @toddleapp.com]
  - Categories: Assignments, Announcements, Reports
  - Parse: Assignment due dates, grade updates

SchoolsBuddy:
  - Domains: [@schoolsbuddy.com, @schoolsbuddy.net]
  - Categories: Events, Trips, Clubs
  - Parse: RSVP deadlines, payment amounts

Seesaw:
  - Domains: [@seesaw.me, @app.seesaw.me]
  - Categories: Portfolio, Activities, Messages
  - Parse: New posts, parent comments needed

Google Classroom:
  - Domains: [@classroom.google.com]
  - Categories: Assignments, Grades, Announcements
  - Parse: Due dates, missing work alerts
```

**App Recognition Rules:**
- Email sender domain matching
- Subject line patterns per app
- Logo detection in email headers
- Confidence scoring for classification

**Missing App Workflow:**
```
1. "Don't see your app?" → Request Addition
2. Enter: App name, Website, Sample email
3. Upload: App logo (optional)
4. Submit → Admin review queue
5. Notification when approved
```

**User Experience:**
1. **Visual App Grid**: 4x3 grid of colorful app logos
2. **Quick Enable**: Tap logo → Checkmark appears → "✓ Toddle enabled"
3. **Smart Suggestions**: "Other parents at your school use: SchoolsBuddy"
4. **Setup Progress**: "3 of 5 common apps configured"
5. **Help Text**: "We'll automatically recognize emails from these apps"

**App Selection Interface:**
```
Select apps your school uses:

[Toddle]     [SchoolsBuddy]  [Seesaw]     [ClassDojo]
   ✓              ✓            ○             ○

[Classroom]  [Teams]         [Bloomz]      [Remind]
   ○             ○              ○             ○

                    [More Apps...]
        Don't see your app? [Add Request]
```

**Auto-Detection:**
After first week, suggest apps based on received emails:
"We noticed emails from ManageBac. Enable it? [Yes] [No]"

**Integration:** Embedded in child profile setup after school selection.

**Data Structure:** See TRD Section 4.5 - Educational Apps Configuration

#### 6. Communication Preferences

**What it does:** Account owner configures routing rules determining which family members receive which types of communications.

**Key Features:**
- **[REQ-024]** Checkbox grid: family members vs. communication types
- **[REQ-025]** Pre-configured templates (parents, primary only, emergency contacts)
- **[REQ-026]** Category-specific routing (financials to Dad, activities to Mom)

**Implementation Requirements:**
```
Communication Categories Matrix:

                Mom  Dad  Nanny  Grandma
Permissions      ✓    ✓     ○      ○
Payments         ○    ✓     ○      ○
Academics        ✓    ✓     ○      ○
Activities       ✓    ○     ✓      ✓
Medical          ✓    ✓     ○      ○
Emergency        ✓    ✓     ✓      ✓
Daily Updates    ✓    ○     ✓      ○
Newsletters      ✓    ○     ○      ○

Routing Rules Engine:
- IF category = "payment" AND dad.role = "financial" THEN route_to(dad)
- IF urgency = "critical" THEN route_to(all_parents)
- IF child = "Emma" AND day = "Tuesday" THEN primary = "Dad"
- IF duplicate_detected THEN send_to(primary_only)
```

**Quick Templates:**
```
"Both Parents": All categories to both
"Primary Only": Everything to account owner
"Extended Family": Parents get all, grandparents get activities
```

**Delivery Timing Preferences:**
- Immediate delivery for all notifications
- Respect quiet hours settings
- Weekly digest: Optional summary of low-priority items

**User Experience:** 
1. **Tab Interface**: "Notification Settings" within family member profile
2. **Visual Grid**: Family members as columns, categories as rows
3. **Bulk Actions**: "Apply to all children", "Copy settings from..."
4. **Preview Mode**: "Test these settings" shows sample routing
5. **Save Confirmation**: "Settings updated for 4 family members"

**Override Scenarios:**
- School closure → Overrides all preferences, notifies everyone
- Payment due today → Adds reminder to financial designee
- Permission deadline passed → Escalates to parents
- New sender → Routes to primary for initial review

**Integration:** Tab within family member profiles, not a separate feature.

**Data Structure:** See TRD Section 4.6 - Communication Preferences

## 2.2 Family Management System

### Overview
Post-onboarding control center for managing family structure, security, and preferences as circumstances change.

### Key Features

- **[REQ-027] Family Administration**: Add/remove members, update relationships, manage invitations
- **[REQ-028] Security Management**: Password changes, 2FA setup, account recovery
- **[REQ-029] Data Control**: Export data, privacy settings, deletion requests
- **[REQ-030] Profile Management**: Update avatars, contact info, preferences

**Implementation Requirements:**

**Family Administration Functions:**
```
Add Member Flow:
1. Select relationship type
2. Enter member details:
   - Full name
   - Email address (required)
   - Mobile phone with country code (required)
   - WhatsApp number (auto-filled from phone, editable)
3. Set initial permissions
4. Send secure invitation (email + WhatsApp)
5. Track acceptance status

Remove Member Flow:
1. Select member to remove
2. Confirm action (type "REMOVE")
3. Reassign any orphaned tasks
4. Archive historical data
5. Send notification to removed member

Permission Modification:
- Granular control by category
- Bulk update options
- Permission history log
- Revert to previous settings
```

**Security Management Features:**
```
Password Requirements:
- Minimum 12 characters (increased from onboarding)
- Password history (can't reuse last 5)
- Expiry reminder after 90 days
- Strength meter with suggestions

2FA Options:
- TOTP (Google Authenticator, Authy)
- SMS backup codes (10 single-use)
- Biometric on mobile devices
- Trusted device management

Account Recovery:
- Security questions (3 required)
- Backup email verification
- Identity verification via support
- 24-hour security delay for sensitive changes
```

### Visual Dashboard Elements

**Family Tree Visualization:**
```
Interactive Display:
- Hierarchical tree with photos/avatars
- Color coding: Green (active), Yellow (pending), Red (issues)
- Drag-and-drop to change relationships
- Click member for quick actions menu
- Connection lines show notification flow

Member Cards Show:
- Name and relationship
- Last active timestamp
- Notification statistics
- Quick permission toggle
```

**Pending Invitation Tracker:**
```
Invitation Management:
- Email: "Invitation sent 3 days ago" [Resend]
- WhatsApp: "Invitation expires in 4 days" [Extend]
- Status: Sent → Opened → Started → Completed
- Bulk actions: Resend all, Cancel expired
```

**Family Health Score (0-100):**
```
Scoring Algorithm:
- All children have schools assigned: +20
- All members verified: +20
- Communication preferences set: +20
- Emergency contacts added: +15
- Educational apps configured: +15
- Recent activity (30 days): +10

Recommendations:
- "Add emergency contacts for Emma" [Add Now]
- "Dad hasn't logged in for 60 days" [Send Reminder]
- "Enable 2FA for better security" [Enable]
```

**Activity Timeline:**
```
Recent Changes Log:
- "Mom updated notification settings" - 2 hours ago
- "Grandma joined the family" - Yesterday
- "School added for Lucas" - 3 days ago
- "Dad enabled 2FA" - 1 week ago

Filter by: All | Security | Members | Settings
Export: CSV | PDF
```

### Key Difference from Onboarding

**Enhanced Capabilities Beyond Initial Setup:**

1. **Historical Context**:
   - View 90-day activity history
   - Track permission changes over time
   - Audit log of all family modifications
   - Communication statistics per member

2. **Advanced Security**:
   - Suspicious login alerts
   - Device management and trusted locations
   - Session management across devices
   - Security audit recommendations

3. **Data Management**:
   - Export formats: JSON, CSV, PDF
   - Selective export by date range
   - Include/exclude attachments
   - GDPR-compliant data packages

4. **Relationship Evolution**:
   - Care schedule management
   - Temporary permission overrides
   - Seasonal adjustment templates
   - Family structure templates for common changes

**Data Structure:** See TRD Section 4.7 - Family Management Dashboard

## 2.3 User Preferences & Settings

### Overview
Simple, intuitive settings page where families configure notification preferences, quiet hours, and email forwarding setup with clear instructions for all major email providers.

### Core Settings

#### Notification Preferences
**[REQ-031] Default Quiet Hours:**
- **Setting**: Do not disturb window (default: 9 PM - 7 AM)
- **Override**: Only emergency/critical notifications bypass quiet hours
- **Weekend Mode**: Optional different quiet hours for weekends

**[REQ-032] Weekly Digest:**
- **Default**: First day of weekend at noon (Saturday 12:00 PM in UAE)
- **Options**: Any day of week, morning/noon/evening
- **Content**: Summary of upcoming week's events, deadlines, and tasks

**[REQ-033] Notification Delivery:**
- **Immediate**: All messages sent immediately when received
- **Quiet Hours Respected**: Messages wait until quiet hours end
- **Emergency Override**: Critical alerts bypass quiet hours

#### Specialist Role Assignments

**[REQ-034] Category-Based Routing:**
- **Default Recipient**: Admin user (family account creator) receives all notifications
- **Financial Specialist**: Designated parent(s) for payment-related communications (multiple assignable)
- **Medical Specialist**: Designated parent(s) for health/medical items (multiple assignable)
- **Academic Specialist**: Designated parent(s) for homework/grades (multiple assignable)
- **Activities Specialist**: Designated parent(s) for sports/clubs (multiple assignable)

**Escalation Chain Configuration:**
- **Primary Contact**: First to receive notifications (default: admin user)
- **Secondary Contact**: Receives escalated reminders
- **Emergency Contact**: For critical/safety communications
- **Priority Order**: Configurable 1-5 for non-response escalation

#### Email Configuration & Setup

**Feature Description:**
Step-by-step instructions for setting up email forwarding to School'cierge, with specific guides for major email providers.

**Your Unique School'cierge Email:**
```
{family-id}@fwd.schoolcierge.com
Example: chen-a47x@fwd.schoolcierge.com
```

**Setup Instructions by Provider:**

**Gmail:**
1. Go to Settings → Forwarding and POP/IMAP
2. Click "Add a forwarding address"
3. Enter your unique School'cierge address
4. Verify via confirmation email
5. Create filter: From → contains → "school"
6. Action: Forward to School'cierge address

**Outlook/Hotmail:**
1. Settings → Mail → Forwarding
2. Enable forwarding
3. Enter School'cierge address
4. Save settings
5. Optional: Create rules for specific senders

**Apple Mail (iCloud):**
1. Preferences → Rules
2. Add Rule → "School Emails"
3. If from contains "school"
4. Forward to School'cierge address

**Yahoo Mail:**
1. Settings → More Settings → Mailboxes
2. Add forwarding address
3. Verify address
4. Set up filters for school domains

**Other Providers:**
- Generic IMAP instructions
- Manual forwarding guide
- Contact support for help

**Admin View:**
Administrators can see aggregate preference patterns to optimize default settings and identify common configuration issues.

**Dependencies:**
- Email provider compatibility verification
- Forwarding address generation system
- Help documentation system

**Data Structure:** See TRD Section 4.8 - User Preferences Schema



## 2.4 Intelligent Task Dashboard

### Overview
Central hub where families view and manage all school-related tasks, seamlessly synchronized between WhatsApp conversations and the mobile app dashboard.

### Feature Description
The dashboard transforms school emails into organized, actionable tasks that families can complete through any channel - WhatsApp buttons, voice commands, or direct dashboard interaction.

### User Experience

**Dashboard Organization:**
- **[REQ-035] Upcoming Tasks**: Combined view of all pending tasks sorted by due date, with visual indicators for today (red dot) and this week (yellow dot)
- **[REQ-036] Calendar View**: Monthly calendar interface showing tasks as visual blocks on their due dates
- **[REQ-037] By Child**: Filtered view showing tasks specific to each dependent
- **[REQ-038] Completed**: Recent accomplishments with completion timestamps

**Visual Task Cards:**
```
┌─────────────────────────────────────┐
│ 🔴 Permission Slip - Science Museum  │
│ Due: Tomorrow 3:00 PM                │
│ Child: Emma                          │
│ Status: 1 reminder sent              │
│                                      │
│ [Complete] [Snooze] [View Detail]    │
└─────────────────────────────────────┘
```

**Priority Indicators:**
- 🔴 **Critical**: Due < 24 hours or safety-related
- 🟡 **High**: Due 2-3 days or requires action
- 🟢 **Medium**: Due this week
- ⚪ **Low**: FYI or due > 1 week

**Multi-Channel Actions:**
- **Via Dashboard**: Tap buttons to complete, snooze, or view details
- **Via WhatsApp**: Reply "Done" to mark complete, "Later" to snooze
- **Via Voice**: "Hey Siri/Google, mark Emma's permission slip complete"
- **Automatic**: Calendar additions auto-complete related tasks

### Core Functionality

**[REQ-039] Smart Task Generation:**
- Automatic creation from school emails via CLARA processing
- Extracted deadlines, amounts, and requirements
- Linked to original email for reference
- Confidence-based review triggers

**[REQ-040] Intelligent Reminders:**
Tasks follow escalating reminder patterns based on priority:
- First reminder at 50% time to deadline
- Standard reminder 24 hours before
- Urgent reminder 4 hours before
- Final escalation 1 hour before (adds second parent + SMS)

**[REQ-041] Family Coordination Features:**
- **Completion Tracking**: See who completed what and when
- **Duplicate Prevention**: System prevents redundant actions
- **Activity Timeline**: View all interactions with a task
- **Parent Assignment**: Route specific tasks to designated parents

**Search & Filtering:**
- Full-text search across all tasks
- Filter by status (pending, completed, snoozed)
- Filter by category (permission, payment, event, academic)
- Sort by due date, priority, or child

### Admin View

**Task Management Capabilities:**
- Monitor task generation rates and patterns
- Review low-confidence task classifications
- Track family engagement metrics
- Manage task routing rules
- Override or reassign tasks when needed

**Analytics Dashboard Shows:**

- Task completion rates by category (permissions: 92%, payments: 87%, events: 95%)
- Average time-to-completion (4.2 hours average)
- Channel preference breakdown (WhatsApp: 73%, Dashboard: 27%)
- Reminder effectiveness metrics

### Dependencies

**Upstream Systems:**
- CLARA email processing (Section 3) generates initial tasks
- Family structure (Section 2.1) determines task routing
- User preferences (Section 2.3) control notification timing

**Downstream Impact:**
- Tasks flow to WhatsApp delivery (Section 7.2)
- Completion data feeds analytics (Section 8)
- Calendar events sync to mobile devices

**Data Structure:** See TRD Section 4.5 - Action Items & Tasks

**Technical Orchestration:** Task lifecycle management, reminder scheduling, and multi-channel delivery handled by TIMER Agent (see separate TIMER Feature Definition document)

## 2.5 Data Management & Compliance

### Overview
Comprehensive privacy controls ensuring GDPR, CCPA, and FERPA compliance while giving families full control over their data.

### Key Features

- **[REQ-042] Privacy Dashboard**: Visual overview of stored data and retention periods
- **[REQ-043] Data Export**: One-click download in JSON, CSV, or PDF formats
- **[REQ-044] Deletion Rights**: Complete or partial data deletion with verification
- **[REQ-045] Consent Management**: Granular control over data usage

**Implementation Requirements:**

**Privacy Dashboard Display:**
```
Data Categories Stored:
👤 Personal Information
   - Family profiles: 5 members, 847 KB
   - Children profiles: 2 children, 234 KB
   - Retention: Until account deletion

📧 Communications
   - Processed emails: 1,247 emails, 45.3 MB
   - WhatsApp messages: 3,891 messages, 12.1 MB
   - Retention: 12 months rolling

📅 Calendar & Tasks
   - Events created: 89 events
   - Tasks completed: 234 tasks
   - Retention: 24 months

🔒 Security Data
   - Login history: 90 days
   - Device fingerprints: Active devices only
   - Retention: 90 days rolling
```

**Data Export Process:**
```
1. Select Export Scope:
   ○ All data (everything)
   ○ Date range: [Start] to [End]
   ○ Specific categories: ☑ Emails ☑ Messages ☐ Tasks
   ○ Specific children: ☑ Emma ☐ Lucas

2. Choose Format:
   ○ JSON (technical)
   ● CSV (spreadsheet)
   ○ PDF (readable)

3. Privacy Options:
   ☑ Redact other family member names
   ☑ Exclude email content bodies
   ☐ Include attachments

4. Generate Export:
   Processing... 🔄
   Export ready! (Valid for 7 days)
   [Download Export] [Email Link]
```

**Deletion Request Flow:**
```
Partial Deletion:
1. Select data to delete:
   ☑ Emails older than 1 year
   ☑ All data for child "Lucas"
   ☐ Login history

2. Confirmation:
   "This will permanently delete 523 emails and 
   all data for Lucas. This cannot be undone."
   Type DELETE to confirm: [________]

3. Processing:
   - Immediate: Remove from active systems
   - 24 hours: Remove from backups
   - 30 days: Remove from archives
   - Confirmation email sent

Complete Account Deletion:
1. Export your data first? [Yes, Export]
2. Confirm deletion request
3. 14-day cooling period
4. Final confirmation email
5. Account permanently deleted
```

### Compliance Coverage

**GDPR (EU) Implementation:**
```
Rights Supported:
✓ Access: Download all data within 30 days
✓ Rectification: Edit any stored information
✓ Erasure: Delete specific or all data
✓ Portability: Export in machine-readable format
✓ Restriction: Pause processing temporarily
✓ Objection: Opt-out of specific uses

Consent Management:
- Explicit consent for each data category
- Withdrawal at any time
- Consent version tracking
- Re-consent on material changes
```

**CCPA (California) Implementation:**
```
Disclosure Requirements:
- Categories of data collected ✓
- Sources of data ✓
- Business purposes ✓
- Third parties shared with ✓

Consumer Rights:
- Know what data is collected
- Delete personal information
- Opt-out of data sales (N/A - we don't sell)
- Non-discrimination guarantee
```

**FERPA (US Education) Compliance:**
```
Educational Records Access:
- Parents can view all school communications
- Export child's educational data
- Correct inaccuracies
- Control disclosure to third parties

Restrictions:
- No sharing without parental consent
- Audit trail of all access
- Annual privacy notice requirement
```

**Children's Privacy Protection:**
```
Enhanced Safeguards:
- No direct marketing to children
- Parental consent for under-13 data
- Limited data retention for minors
- No behavioral profiling
- Educational purpose limitation
- Age-appropriate privacy notices
```

**Data Structure:** See TRD Section 4.8 - Compliance Management



---



# 3. CLARA - Messaging Intelligence Agent

## 3.1 CLARA Overview

**Feature Description**

**[REQ-046]** CLARA (Communication Logic & Action Routing Agent) is School'cierge's core AI processing engine that transforms chaotic school emails into organized, actionable WhatsApp messages for families. It operates as a single, unified service that executes a sophisticated 7-stage processing pipeline, then hands off to TIMER for delivery.

**User Experience**

**[REQ-047]** Parents forward school emails to their unique School'cierge address. Within seconds, they receive a clear, concise WhatsApp message with essential information, action buttons, and smart reminders. What was once a 500+ word email becomes a 50-word actionable message.

**Admin View**

CLARA is the heart of School'cierge, requiring comprehensive administrative oversight to ensure optimal performance, accuracy, and family satisfaction. Administrators access a sophisticated operations center providing deep visibility into every aspect of the AI pipeline.

**CLARA Operations Dashboard:**

**Real-Time Pipeline Monitoring:**
```
Pipeline Health Overview:
┌─────────────────────────────────────────────────────┐
│ CLARA Pipeline Status              [Live] 🟢         │
├─────────────────────────────────────────────────────┤
│ Module 1: CAPTURE    ▓▓▓▓▓▓░░░░ 127/min  [98.5%]   │
│ Module 2: CLASSIFY   ▓▓▓▓▓▓▓░░░ 124/min  [96.2%]   │
│ Module 3: DELIVER    ▓▓▓▓▓▓▓▓░░ 122/min  [99.1%]   │
├─────────────────────────────────────────────────────┤
│ Queue Depth: 23 | Avg Latency: 3.2s | Errors: 2    │
└─────────────────────────────────────────────────────┘

Alert Thresholds:
- Queue > 100: Yellow alert
- Latency > 5s: Performance warning  
- Accuracy < 90%: Quality alert
- Errors > 5/min: System alert
```

**Classification Performance Center:**
```
Accuracy Metrics (Last 24h):
- Overall Accuracy: 95.3% ↑0.2%
- Permission Slips: 97.1% ✓
- Payment Requests: 95.8% ✓
- Event Notices: 94.2% ✓
- General Info: 92.9% ⚠

Confidence Distribution:
90-100%: ████████████ 78% (Auto-process)
70-89%:  ████░░░░░░░░ 17% (Process + flag)
<70%:    █░░░░░░░░░░░  5% (Manual review)

Top Classification Errors (Action Required):
1. "Swimming gala" → Misclassified as permission (12x)
2. "Voluntary contribution" → Unclear if payment (8x)
3. Arabic mixed content → Low confidence (23x)
```

**Manual Review Queue Management:**
```
Review Queue Status:
┌──────────────────────────────────────────────┐
│ Pending Reviews: 47                          │
├──────────────────────────────────────────────┤
│ 🔴 Urgent (SLA <2h):        8 items         │
│ 🟡 Financial (SLA <4h):    12 items         │
│ 🔵 Standard (SLA <24h):    27 items         │
├──────────────────────────────────────────────┤
│ Avg Review Time: 3.2 min                     │
│ Reviewer Performance: Sarah K. - 98.2%       │
└──────────────────────────────────────────────┘

Quick Actions per Item:
[View Email] [Edit Classification] [Add Rule] [Approve]
```

**AI Model Performance & Tuning:**
```
AI Provider Performance (Example - Claude):
- API Latency: 1.8s avg (target <2s) ✓
- Token Usage: 1,247 avg/email
- Cost/Email: $0.0008
- Error Rate: 0.3%

Model Confidence Tracking:
- Trending up: School trip permissions (+5%)
- Trending down: Mixed language emails (-3%)
- New patterns: QR code payments (needs rule)

Fine-tuning Recommendations:
1. Add Arabic email samples (47 low-confidence)
2. Update payment patterns for digital wallets
3. Create rules for school app QR codes
```

**Family Engagement Analytics:**
```
Message Effectiveness:
- Delivery Success: 99.2% (98.1% WhatsApp, 1.1% SMS)
- Read Rate: 94.3% within 2 hours
- Action Completion: 87.2% (target 85%+)
- Response Time: 4.3 min average

Top Performing Message Types:
1. Permission slips: 91% completion ✓
2. Payment reminders: 89% completion ✓
3. Event RSVPs: 83% completion

Improvement Opportunities:
- General newsletters: 42% read rate
- Suggestion: Implement digest format
```

**Rule Engine & Configuration:**
```
Active Classification Rules: 127

Recent Rule Performance:
- "Principal emails → High priority": 98% accurate
- "finance@ → Payment category": 96% accurate
- "Arabic subject → Bilingual processing": 94% accurate

Rule Builder Interface:
IF sender_domain = "khda.gov.ae"
THEN priority = "CRITICAL"
AND notification = "IMMEDIATE_ALL_PARENTS"

Test Rule: [Run on Sample] [Deploy to Staging]
```

**Cost & Resource Management:**
```
Daily Operations Cost:
- AI API Calls: $127.43 (15,929 emails)
- WhatsApp Messages: $89.21 (31,858 messages)
- SMS Fallback: $12.30 (410 messages)
- Infrastructure: $45.00
- Total: $273.94 (Well within budget)

Resource Utilization:
- CPU: 43% average, 78% peak
- Memory: 2.1GB / 4GB allocated
- API Rate: 267/min (limit 1000/min)
- Database: 127 queries/sec
```

**Quality Assurance Tools:**
```
A/B Testing Framework:
Test: Shorter message format
- Control: 156 chars avg
- Variant: 89 chars avg
- Result: +12% action completion

Feedback Loop Integration:
- User corrections tracked: 47 today
- Auto-applied improvements: 12
- Pending pattern reviews: 8
- Model retrain scheduled: Sunday 2 AM
```

**Administrative Actions Panel:**
```
Quick Admin Actions:
[Pause Pipeline] [Force Retry Queue] [Clear Cache]
[Export Metrics] [Generate Report] [Alert Team]

Bulk Operations:
- Reprocess emails from date range
- Apply new rule to historical data
- Export classification audit trail
- Update school email patterns
```

**Integration with Section 5 (Administration System):**
- Links to School Database for pattern updates
- Connects to App Registry for email domains
- Feeds Platform Metrics for executive dashboards
- Provides data for AI Model Management

**Critical Monitoring Alerts:**
- Classification accuracy drops below 90%
- Queue depth exceeds 100 emails
- API errors exceed 1% threshold
- Family complaints about missed messages
- New unrecognized sender domain
- Processing cost exceeds daily budget

**Dependencies**

Email reception service, AI processing engine, WhatsApp messaging provider, queue management system.

**Data Structure**

See TRD Section 5 - CLARA Technical Architecture for:
- Detailed module interfaces and JSON schemas
- Complete data flow between processing stages
- Technical implementation specifications
- Performance benchmarks and SLAs

## 3.2 CLARA Single-Service Architecture

CLARA operates as a unified service that processes emails through three logical modules, maintaining all sophisticated functionality while simplifying operational complexity:

### Module 1: Communications Routing & Capture - "CAPTURE"
**Purpose**: Ensure clean, validated emails enter the pipeline with proper family context

**Core Responsibilities**:
- **[REQ-048]** Email ingestion and validation
- **[REQ-049]** Sender verification and trust scoring
- **[REQ-050]** Family account matching
- **[REQ-051]** Duplicate detection and threading
- **[REQ-052]** Attachment processing

**Technical Capabilities**:
- **[REQ-053]** Process 1000+ emails per minute at peak
- **[REQ-054]** Validate sender authenticity using SPF/DKIM
- **[REQ-055]** Match emails to family accounts with 98%+ accuracy
- **[REQ-056]** Handle attachments up to 25MB (PDFs, images, documents)
- **[REQ-057]** Thread related emails for context preservation
- **[REQ-058]** 99.9% validation accuracy with automatic retry

**Module Output**:
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
  "attachments": [{
    "filename": "permission_slip.pdf",  
    "size": 245760,
    "type": "application/pdf",
    "url": "signed_download_url"
  }],
  "thread_id": "thread_swimming_carnival_2024",
  "related_emails": ["msg_abc122_2024031309"],
  "processing_flags": {
    "is_duplicate": false,
    "requires_review": false,
    "has_attachments": true
  }
}
```

### Module 2: Classification & Prioritisation - "UNDERSTAND"  
**Purpose**: Transform emails into structured, actionable intelligence using AI

**Core Responsibilities**:
- **[REQ-059]** Multi-dimensional email classification
- **[REQ-060]** Entity extraction (dates, amounts, children)
- **[REQ-061]** Priority scoring and urgency assessment
- **[REQ-062]** Action requirement identification
- **[REQ-063]** Message compression and generation

**Technical Capabilities**:
- **[REQ-064]** 95%+ classification accuracy across 12 categories
- **[REQ-065]** Extract dates with 98% accuracy (handles relative dates)
- **[REQ-066]** Extract monetary amounts in multiple currencies
- **[REQ-067]** Identify affected children with name variations
- **[REQ-068]** Determine required parent actions automatically
- **[REQ-069]** Generate WhatsApp messages in <3 seconds
- **[REQ-070]** Support confidence thresholds (70% minimum)

**Module Output**:
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
    "requirements": ["swimming costume", "towel", "goggles", "sunscreen"],
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

### Module 3: Smart Notification System - "DELIVER"
**Purpose**: Orchestrate intelligent delivery ensuring right message → right person → right time

**Core Responsibilities**:
- **[REQ-071]** Family-specific routing logic
- **[REQ-072]** Delivery timing optimization
- **[REQ-073]** Multi-channel orchestration
- **[REQ-074]** Action tracking and reminders
- **[REQ-075]** Completion monitoring

**Technical Capabilities**:
- **[REQ-076]** Apply complex family routing rules (multiple parents, guardians)
- **[REQ-077]** Immediate notifications with quiet hours respect
- **[REQ-078]** Track action completion with 85%+ success rate
- **[REQ-079]** Send progressive reminders (gentle → urgent → critical)
- **[REQ-080]** 99%+ WhatsApp delivery success (SMS fallback)
- **[REQ-081]** Respect timezone and quiet hours per family
- **[REQ-082]** Learn family response patterns over time

**Module Output**:
```json
{
  "email_id": "msg_abc123_2024031409",
  "delivery_plan": {
    "recipients": [{
      "family_member_id": "parent_mom_chen",
      "phone": "+971501234567",
      "role": "primary",
      "delivery_channel": "whatsapp",
      "message_variant": "full_detail",
      "scheduled_time": "2024-03-14T09:33:00Z",
      "timezone": "Asia/Dubai"
    }],
    "delivery_strategy": "immediate",
    "quiet_hours_respected": true
  },
  "tracking_setup": {
    "action_items": [{
      "action_id": "permission_completion",
      "type": "form_submission",
      "deadline": "2024-03-13T23:59:59Z",
      "tracking_method": "button_click",
      "completion_webhook": "api/actions/complete"
    }],
    "reminder_schedule": [{
      "reminder_id": "gentle_reminder",
      "scheduled_time": "2024-03-12T18:00:00Z",
      "message": "Reminder: Emma's permission slip due tomorrow",
      "condition": "if_not_completed"
    }]
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

## 3.3 CLARA Processing Flow Schema

**CLARA_PROCESSING_FLOW** defines the standardized data structure for email classification and processing:

```json
{
  "email_classification": {
    "scope": [
      "NATIONAL",          // Government/regulatory (3%)
      "DISTRICT",          // District-wide (12%)
      "SCHOOL",            // School-wide (25%)
      "GRADE_YEAR",        // Grade/year level (20%)
      "CLASS",             // Class/homeroom (18%)
      "INDIVIDUAL",        // Individual/family (15%)
      "ACTIVITY_CLUB"      // Activity/club specific (7%)
    ],
    "category": [
      "EVENT_ANNOUNCEMENT",     // 22% - performances, sports days
      "PERMISSION_REQUEST",     // 18% - forms requiring signature
      "SCHEDULE_CHANGE",        // 15% - time/date modifications
      "DEADLINE_REMINDER",      // 12% - payment/form deadlines
      "INFORMATION_UPDATE",     // 10% - newsletters, general info
      "ACADEMIC_REPORT",        // 8% - progress, grades
      "FINANCIAL_REQUEST",      // 8% - fee notices
      "MEDICAL_HEALTH",         // 4% - health updates
      "EMERGENCY_NOTICE"        // 3% - urgent safety alerts
    ],
    "priority": ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
    "interaction_level": [0, 1, 2, 3, 4, 5],
    "confidence_score": "0-100",
    "authority_multiplier": "0.6-1.8"
  },
  "processing_metadata": {
    "sender_trust_score": "0-100",
    "duplicate_check": "boolean",
    "language": ["en", "ar"],
    "attachments_count": "integer",
    "processing_time_ms": "integer"
  }
}
```

This schema ensures consistent data structure throughout the pipeline and enables accurate tracking of classification accuracy and performance metrics.

**Technical Implementation Note:** For complete JSON interfaces between modules, database schemas, and detailed API specifications, see TRD Section 5 - CLARA Technical Architecture.

## 3.4 Detailed Pipeline Architecture

### Eight-Stage Processing Pipeline

CLARA processes every email through eight distinct stages:

1. **[REQ-083] Email Capture & Validation** - Receive and validate incoming emails
2. **[REQ-084] Source Classification** - Identify sender authority and scope
3. **[REQ-085] Content Classification** - Categorize communication type
4. **[REQ-086] Priority Calculation** - Determine notification urgency
5. **[REQ-087] Interaction Level Assessment** - Gauge required parent effort
6. **[REQ-088] Message Generation** - Create actionable WhatsApp content
7. **[REQ-089] Family Routing Decision** - Select appropriate recipients
8. **[REQ-090] Action Tracking & Follow-up** - Ensure task completion

### 📥 MODULE 1: COMMUNICATIONS ROUTING & CAPTURE

### 3.4.1 Stage 1: Email Capture & Validation 📧

```
Purpose: "CAPTURE" - Ensure clean, validated emails enter the pipeline
├── 3.4.1 Stage 1: Email Capture & Validation
│   ├── Email Reception (webhook processing)
│   ├── Validation & Deduplication  
│   └── Family Account Matching
└── Stage Output: See detailed JSON below
```

**Email Reception:**

- Mailgun webhook endpoint: POST /api/webhooks/email
- Parse multipart MIME structure
- Extract headers, body (text/HTML), attachments
- Validate webhook signature for security
- Store raw email in PostgreSQL with 30-day retention

**Validation & Deduplication:**
- **Sender Validation**: SPF/DKIM verification for trust scoring
- **Domain Matching**: Match against schools.email_domains[] array
- **Duplicate Detection Algorithm**:
  ```
  Duplicate = Same sender + Same subject + Same family + Within 24 hours
  Cache Key: MD5(sender + subject + family_id)
  Redis TTL: 24 hours
  ```
- **Trust Score Calculation**:
  - Base score: 50
  - +20 for verified school domain
  - +15 for SPF pass
  - +15 for DKIM pass
  - -30 for blacklisted domain

**Family Identification:**
- Each family has unique forwarding address: {family-id}@fwd.schoolcierge.com
- Email received at unique address = automatic family assignment
- No matching required - 100% accurate family identification
- Mailgun routes based on recipient address
- Invalid addresses rejected at SMTP level

### 🧠 MODULE 2: CLASSIFICATION & PRIORITISATION  

### 3.4.2 Stage 2: Source Classification Processing

```
Purpose: "UNDERSTAND" - Transform emails into actionable intelligence
├── 3.4.2 Stage 2: Source Classification (WHO sent this?)
│   ├── Sender Authority Scoring
│   ├── Scope Determination
│   └── Stage Output: See detailed breakdown below
```

**Authority Scoring System:**

The authority score acts as a multiplier for priority calculations, ensuring critical senders get appropriate attention:

```
Government/Regulatory: 1.8x weight (KHDA, Ministry of Education)
Principal/Head: 1.5x weight (school leadership)
Admin/Finance: 1.3x weight (operational matters)
Teacher: 1.0x weight (standard classroom communications)
Educational App: 1.0x weight (automated notifications)
Parent Rep: 0.8x weight (community updates)
External/Unverified: 0.6x weight (non-school domains)
```

**Authority Calculation:**
- Base priority score × Authority multiplier = Final priority
- Example: Permission slip (base 70) from Principal (1.5x) = 105 priority
- Ensures government mandates and principal messages receive immediate attention

**Classification Levels & Distribution:**
- **National/Government** (3%) → Highest priority, official domains (KHDA, Ministry)
- **District/Regional** (12%) → District-wide communications
- **School-wide** (25%) → Principal/admin announcements
- **Grade/Year Level** (20%) → Year-specific information
- **Class/Homeroom** (18%) → Individual teacher emails
- **Individual/Family** (15%) → Personal communications
- **Activity/Club** (7%) → Extracurricular updates

**Scope Determination Logic:**
- **National/Government**: Official .gov domains, regulatory bodies
- **District/Regional**: District superintendent, area coordinators
- **School-wide**: Admin domain OR school-wide keywords
- **Grade/Year**: Contains grade-wide keywords ("all Year 5 parents")
- **Class/Homeroom**: Sender is class teacher OR contains class references
- **Individual/Family**: Email contains child's name in subject/body
- **Activity/Club**: From activity coordinators, contains club/sport names

**Pattern Recognition:**

```
- Analyze sender email structure: `role@school.edu`
- Check historical sender patterns in database
- Apply school-specific rules from classification_rules table
- Match senders address from schools and education app databases
```

**Initial Processing Functions:**

1. **Duplicate Detection Algorithm**
   ```
   Fingerprint = MD5(sender_email + subject_normalized + family_id)
   Cache Key: duplicate:{fingerprint}
   TTL: 24 hours
   
   IF cache_hit:
     - Return cached classification (saves AI processing)
     - Increment duplicate counter
     - Log for cost tracking
   ELSE:
     - Process through full pipeline
     - Cache results for 24 hours
   ```
   
   **Similarity Scoring:**
   - Fuzzy match on subject (>85% = potential duplicate)
   - Content hash comparison for body text
   - Attachment count and size matching
   - Same sender within 4-hour window = likely duplicate

2. **Quality Assessment Criteria**
   - **Email Completeness** (all must pass):
     - Has sender email ✓
     - Has subject line ✓
     - Has body content >20 chars ✓
     - Valid timestamp ✓
   
   - **Language Detection**:
     - Primary: English (en)
     - Secondary: Arabic (ar)
     - Mixed language support
     - Default to English if uncertain
   
   - **Attachment Validation**:
     - Max size: 25MB per attachment
     - Allowed types: PDF, DOC/DOCX, XLS/XLSX, PNG, JPG
     - Virus scan required
     - Extract text from PDFs for processing

3. **Smart Routing Decision Tree**
   ```
   IF duplicate_detected AND confidence > 90%:
     RETURN cached_result
   ELSE IF partial_duplicate AND confidence > 70%:
     PROCESS with_light_classification
   ELSE IF sender_blacklisted:
     REJECT with_logging
   ELSE IF language_unsupported:
     QUEUE for_manual_review
   ELSE:
     PROCESS full_pipeline
   ```

4. **Sender Role Detection Logic**
   - Parse email structure: `role@school.domain`
   - Common patterns:
     - principal@, head@, headmaster@ → Principal role
     - finance@, accounts@, fees@ → Finance role
     - nurse@, clinic@, medical@ → Medical role
     - teacher.name@, t.name@ → Teacher role
   - Check against known sender database
   - Apply school-specific overrides

**Enrichment Data Added:**
- Sender authority level (0.6 - 1.8 multiplier)
- Communication scope (individual to national)
- Historical sender patterns
- School/district metadata
- Verified sender status
- Duplicate detection results

**Quality Checks & Validation Rules:**

1. **Domain Verification**
   - Match against verified school domains (schools.email_domains[])
   - SPF/DKIM pass rate >95%
   - Alert on new unverified domains

2. **Authority Score Validation**
   - Must be within 0.6-1.8 range
   - Government domains must = 1.8
   - Unknown domains capped at 0.6
   - Log anomalies for review

3. **Duplicate Detection Accuracy**
   - Fingerprint match rate >99%
   - False positive rate <1%
   - Cache hit ratio >20% (cost savings)

4. **Processing Completeness**
   - Email parsing success >99%
   - Metadata extraction >95%
   - Language detection accuracy >98%
   - Reject rate <0.5% (only true spam)

**Stage 2 Quality Gate**: Must achieve 95%+ accuracy on sender classification before proceeding

### 3.4.3 Stage 3: Content Classification
```
├── 3.4.3 Stage 3: Content Classification (WHAT type?)
│   ├── Category Detection (95%+ accuracy)
│   ├── Entity Extraction
│   └── Stage Output: See comprehensive schema below

```

**Main Categories & Distribution:**
- **Event Announcement** (22%) → School performances, sports days, celebrations
- **Permission Request** (18%) → Forms requiring signature/approval
- **Schedule Change** (15%) → Time/date modifications, cancellations
- **Deadline Reminder** (12%) → Payment due dates, form submissions
- **Information Update** (10%) → Newsletters, general announcements
- **Academic Report** (8%) → Progress updates, grades, assessments
- **Financial Request** (8%) → Fee notices, payment requests
- **Medical/Health** (4%) → Health updates, vaccination drives, screenings
- **Emergency Notice** (3%) → Urgent safety alerts, immediate actions

**AI Classification Prompt Template:**
```
Analyze this school email and classify it:
- Primary Category: [event_announcement, permission_request, schedule_change, 
  deadline_reminder, information_update, academic_report, financial_request, 
  medical_health, emergency_notice]
- Confidence: 0-100
- Extract: children names, dates, amounts, locations, required actions
```

**Entity Extraction Patterns:**

- **Children**: Match against family's children[] names with fuzzy matching
- **Dates**: Parse absolute ("March 15") and relative ("next Friday") dates
- **Amounts**: Regex for currency patterns (AED, £, $, €) with normalization
- **Locations**: Match against known venues + Google Maps API validation
- **Actions**: Identify verbs ("complete", "return", "pay", "attend")

**Confidence Scoring & Action Thresholds:**

The confidence score determines the processing path for each email:

```
High Confidence (>85%): Automatic processing
- Direct to family delivery
- No manual intervention required
- Tracked for quality assurance

Medium Confidence (70-85%): Processing with flag
- Delivered with review indicator
- Admin notified for spot checks
- May trigger rule creation

Low Confidence (<70%): Manual review queue
- Held for admin classification
- SLA: 2 hours for urgent, 24 hours standard
- Learning opportunity for model improvement
```

**Confidence Distribution Targets:**
- High confidence: 75-80% of emails
- Medium confidence: 15-20% of emails  
- Low confidence: <5% of emails
- Alert if low confidence >10% (indicates model degradation)



### 3.4.4 Stage 4: Priority Calculation

```
├── 3.4.4 Stage 4: Priority Calculation (WHEN to notify?)
│   ├── Urgency Assessment (deadline proximity, sender authority)
│   ├── Impact Analysis (financial, safety, academic)
│   ├── Priority Scoring (0-100 with delivery timing)
│   └── Quality Checks (distribution monitoring, family overrides)
```

**Purpose**: Determine WHEN to notify families based on urgency and importance
**Processing Flow**:

```
Analyzed Email → Deadline Extraction → Impact Assessment → Urgency Scoring → Priority Assignment
```

**Priority Formula:**
```
Priority Score = (Urgency × 0.4) + (Impact × 0.3) + (Deadline × 0.3)

Detailed Calculation:
- Urgency = Base category weight × sender authority
  - Permission requests: 70 base weight
  - Payment requests: 80 base weight  
  - Urgent notices: 90 base weight
  - Emergency/Safety: 100 base weight
  
- Impact = Financial amount or safety criticality (0-100)
  - Payments >AED 1000: 80-100 impact
  - Payments AED 500-1000: 60-80 impact
  - Safety/Medical: 90-100 impact
  - Academic critical: 70-90 impact
  
- Deadline = 100 × (1 - (hours_remaining / 168))
  - <24 hours: 85-100 score
  - 1-3 days: 60-85 score
  - 3-7 days: 30-60 score
  - >7 days: 0-30 score
```

**Priority Levels & Delivery Rules:**
```
Critical (>80): Immediate + SMS backup
  - Same-day deadlines
  - Safety/emergency alerts
  - School closures
  - Principal urgent notices
  Example: "School closed tomorrow - flooding"
  
High (60-79): Within 1 hour
  - Next-day deadlines
  - Important permissions
  - Large payments (>AED 500)
  - Test/exam notices
  Example: "Permission slip due tomorrow"
  
Medium (30-59): Within 4 hours
  - 3-7 day deadlines
  - Regular activities
  - Standard fees
  - Event announcements
  Example: "Sports day next Friday"
  
Low (<30): Immediate delivery
  - General information
  - Future events (>7 days)
  - Newsletters
  - Menu updates
  Example: "Term 2 calendar attached"
```

**Enrichment Data Added:**
```json
{
  "priority_score": 75,
  "priority_level": "high",
  "delivery_timing": "immediate",
  "delivery_window": "2024-03-12T10:30:00Z",
  "escalation_triggers": {
    "no_response_hours": 4,
    "reminder_schedule": ["4h", "20h", "44h"],
    "escalate_to": ["secondary_parent", "sms"]
  },
  "override_quiet_hours": false,
  "requires_sms_backup": false
}
```

**Quality Checks:**
- Deadline extraction accuracy (must find 95%+ of dates)
- Priority distribution monitoring:
  - Critical: 3-5% (emergencies only)
  - High: 15-20% (important deadlines)
  - Medium: 40-50% (regular school business)
  - Low: 25-35% (information only)
- Escalation rule verification
- Family preference override validation
- Time zone adjustment accuracy
- 1-3 days: "X days" + urgency boost
- 4-7 days: "this week"
- 8+ days: "next week" or specific date



### 3.4.5 Stage 5: Interaction Level Assessment

```
├── 3.4.5 Stage 5: Interaction Level (HOW COMPLEX?)
│   ├── Action Complexity (0-5 levels)
│   ├── Time Estimation
│   └── Stage Output: See complexity matrix below
```

**Purpose**: Determine HOW COMPLEX the required response is to set parent expectations
**Processing Flow**:

```
Classified Email → Action Analysis → Step Counting → Time Estimation → Complexity Scoring
```

**Action Complexity Algorithm:**
```python
# Analyze required actions
actions = extract_required_actions(email)
complexity_score = 0

for action in actions:
    if action.type == "read_only":
        complexity_score += 0
    elif action.type == "single_click":
        complexity_score += 1
    elif action.type == "form_field":
        complexity_score += 2 * action.field_count
    elif action.type == "document_upload":
        complexity_score += 5
    elif action.type == "payment":
        complexity_score += 8
    elif action.type == "in_person":
        complexity_score += 15
        
# Map to interaction level
if complexity_score == 0: return LEVEL_0
elif complexity_score <= 2: return LEVEL_1
elif complexity_score <= 5: return LEVEL_2
elif complexity_score <= 10: return LEVEL_3
elif complexity_score <= 20: return LEVEL_4
else: return LEVEL_5
```

**Interaction Levels & Distribution:**

**Level 0: Passive**

- Action: None required
- Example: Newsletter
- Time: 0 seconds
- Indicator: 📋 INFO

**Level 1: Simple**

- Action: Single tap/click
- Example: "Got it" acknowledgment
- Time: 5-10 seconds
- Indicator: 🟢 QUICK

**Level 2: Basic**

- Action: 1-2 simple steps
- Example: Yes/No response
- Time: 30-60 seconds
- Indicator: 🔵 SIMPLE

**Level 3: Moderate**

- Action: 3-5 steps
- Example: Permission slip
- Time: 3-5 minutes
- Indicator: 🟡 MODERATE

**Level 4: Complex**

- Action: 6+ steps
- Example: Event volunteering
- Time: 10-15 minutes
- Indicator: 🔴 COMPLEX

**Level 5: Critical**

- Action: Immediate response
- Example: Emergency pickup
- Time: <2 minutes
- Indicator: 🚨 CRITICAL

**Enrichment Data Added:**

- Interaction level (0-5) with time estimate
- Required actions list
- User interface indicators
- Task dependencies

**Quality Checks:**

- Action feasibility validation

- Time estimate reasonableness

- Level assignment accuracy
- Historical pattern matching

**Time Estimation Algorithm:**
```
Base time = action_count * 30 seconds
+ signature_count * 30 seconds  
+ document_count * 2 minutes
+ form_field_count * 15 seconds
+ payment_steps * 5 minutes (MVP: viewing payment info only)
+ in_person_requirement * 10 minutes
+ travel_time (if applicable)
```

**Enrichment Data Added:**
```json
{
  "interaction_level": 3,
  "complexity_label": "moderate",
  "time_estimate_seconds": 180,
  "time_display": "3 minutes",
  "required_actions": [
    {"type": "form_completion", "fields": 5},
    {"type": "signature", "count": 1},
    {"type": "submission", "method": "email"}
  ],
  "ui_indicator": "🟡 MODERATE",
  "parent_expectation": "Set aside 3-5 minutes",
  "can_delegate": true,
  "requires_documents": false
}
```

**Quality Checks:**
- Action extraction completeness (95%+ accuracy)
- Time estimate validation against historical data
- Complexity distribution monitoring:
  - Level 0 (Passive): 20-25%
  - Level 1 (Simple): 15-20%
  - Level 2 (Basic): 25-30%
  - Level 3 (Moderate): 15-20%
  - Level 4 (Complex): 8-12%
  - Level 5 (Critical): 2-5%
- Parent feedback correlation
- Task completion time tracking

### 3.4.6 Stage 6: Message Generation Rules

```
└── 3.4.6 Stage 6: Message Generation (WHAT to say?)
    ├── Content Compression (500→50 words)
    ├── Action Button Creation
    └── Stage Output: See generation rules below
```

**Purpose**: Transform lengthy emails into concise, actionable WhatsApp messages
**Processing Flow**:

```
Classified Email → Content Extraction → Message Crafting → Action Button Generation → Quality Validation
```

**Compression Algorithm:**
```python
def compress_message(email_content, classification):
    # 1. Extract core components
    facts = extract_key_facts(email_content)
    # WHO: Child name, sender
    # WHAT: Action required, event type
    # WHEN: Dates, deadlines, times
    # WHERE: Locations, venues
    # HOW: Action steps, requirements
    
    # 2. Apply compression rules
    # - Remove: greetings, signatures, repetition
    # - Remove: background context, history
    # - Keep: critical dates, amounts, names
    # - Keep: specific requirements, deadlines
    
    # 3. Structure for scanning
    priority_emoji = get_priority_indicator(priority_score)
    action_verb = get_action_verb(classification)
    
    # 4. Build message (max 300 chars)
    message = f"{priority_emoji} {action_verb} - {facts.context}"
    message += format_key_details(facts)
    
    return message
```

**Message Component Structure:**
1. **Priority Indicator** (visual urgency)
   - 🚨 Critical (immediate action)
   - 🔴 High (today/tomorrow)
   - 🟡 Medium (this week)
   - 🔵 Low (next week+)
   - 📋 Info only (no action)

2. **Action Line** (what parent needs to do)
   - "Permission needed" / "Payment due"
   - "Event reminder" / "Action required"
   - Child name for context

3. **Key Details** (essential facts only)
   - Date/deadline with countdown
   - Amount (for payments)
   - Location (for events)
   - Requirements (what to bring/do)

4. **Action Buttons** (one-tap responses)
   - Primary action (most likely needed)
   - Alternative action (remind/defer)
   - Context action (calendar/details)

**Message Templates:**
```
Permission: 📎 Permission needed - {event}
           📅 {date} | 📍 {location}
           ⏰ Due: {deadline}
           
Payment:   💰 Payment due - {item}
           💵 {amount} | ⏰ Due: {date}
           🏦 {payment_method}
           
Event:     📅 Event reminder - {name}
           📍 {location} | 🕐 {time}
           👔 {dress_code/items}
```

**Action Button Rules:**
- Max 3 buttons per message
- Primary action first (most likely needed)
- Text length ≤ 20 chars
- Actions: open_form, set_reminder, add_calendar, view_details, acknowledge
- Dynamic based on classification and urgency

**Generated Assets & Output:**
```json
{
  "message_text": "🟡 Permission needed - Emma's swimming carnival\n📅 Friday, March 15\n📍 Dubai Aquatic Centre\n⏰ Permission slip due Wednesday",
  "action_buttons": [
    {"text": "Complete Permission", "action": "open_form", "primary": true},
    {"text": "Set Reminder", "action": "create_reminder", "data": {"when": "tomorrow_6pm"}},
    {"text": "Add to Calendar", "action": "create_event", "data": {"date": "2024-03-15"}}
  ],
  "metadata": {
    "original_length": 523,
    "compressed_length": 87,
    "compression_ratio": 0.83,
    "readability_score": 9.2,
    "action_clarity": "high"
  },
  "calendar_event": {
    "title": "Emma - Swimming Carnival",
    "date": "2024-03-15",
    "location": "Dubai Aquatic Centre",
    "reminder": "1_day_before"
  },
  "task_spec": {
    "title": "Complete swimming permission slip",
    "due": "2024-03-13",
    "assigned_to": "primary_parent",
    "child": "Emma"
  }
}
```

**Quality Checks:**
- Message length validation (<300 characters)
- Action button functionality verification
- Emoji appropriateness for priority level
- Information completeness score (>90%)
- Readability score (grade 6 level)
- Cultural sensitivity check
- No critical info omitted
- Parent action clarity validation

**Example Transformations:**

**500+ Word Email → 50 Word Message:**
```
Original: "Dear Parents, I hope this email finds you well. I am writing 
to inform you that we have scheduled our annual Year 5 swimming carnival 
for Friday, March 15th at the Dubai Aquatic Centre. This is always an 
exciting event for our students... [450 more words about history, past 
events, detailed schedule, parking information, volunteering opportunities, 
lunch arrangements, sun safety reminders, what to bring checklist]..."

Compressed: "🟡 Permission needed - Emma's swimming carnival
📅 Friday, March 15
📍 Dubai Aquatic Centre  
⏰ Permission slip due Wednesday
[Complete Permission] [Set Reminder] [Add to Calendar]"
```

**Compression Success Metrics:**

- Average compression: 85% reduction
- Key info retention: 100%
- Parent comprehension: <10 seconds
- Action completion rate: 87%+

### 📤 MODULE 3: SMART NOTIFICATION SYSTEM

Purpose: "DELIVER" - Right message to right person at right time
- 3.4.7 Stage 7: Family Routing (WHO needs this?)
  - Apply Family Rules
  - Family Coordination
  - Apply User Preferences (quiet hours)
  - Stage Output: See routing engine below

### 3.4.7 Stage 7: Family Routing & TIMER Handoff

**Routing Priority Hierarchy:**

1. **Explicit Rules**: User-defined preferences override all
2. **Specialist Assignments**: Financial→Financial Specialist(s), Medical→Medical Specialist(s)
3. **Child Specific**: Only parents linked to mentioned child
4. **Urgency Override**: Critical→All authorized contacts

**Basic Routing Logic:**
```
IF notification_preferences_set:
  route_to_parents_by_category

IF urgent_notification:
  send_to_all_parents

IF action_required:
  prepare_for_TIMER_tracking
  
IF multi_parent_family AND schedule_active:
  primary = current_caregiver
  secondary = other_caregivers_summary

IF financial_category AND financial_specialist_set:
  primary = financial_specialist(s)
  others = notification_only

IF permission_required AND multiple_signatures_needed:
  send_to_all_parents(track_separately=true)

// Hand off to TIMER Agent
TIMER.accept(message_package)
```

**TIMER Agent Handoff:**
After routing decisions are made, Stage 7 hands off to TIMER Agent for:
- Multi-channel delivery orchestration
- Reminder scheduling and management
- Retry logic and failure handling
- Real-time synchronization across channels
- Family coordination and duplicate prevention
**Standard Cases:**
- **Parents**: Full access to all notifications
- **Grandparents**: Activity notifications only
- **Caregivers**: Operational info (pickup, supplies)
- **Emergency Contacts**: Only for urgent/safety issues

**Simple Delivery Timing:**
- **Immediate**: Critical priority (>80) bypass all preferences
- **Respect Quiet Hours**: Non-critical messages wait until after quiet hours
- **Weekly Digest**: Low priority items collected for weekly summary
- **Default Behavior**: Send immediately if outside quiet hours


**Timezone & Quiet Hours:**
- Store family timezone in profile
- Default quiet hours: 9 PM - 7 AM
- Override for emergencies only
- Holiday calendar awareness

### 3.4.8 Stage 8: TIMER Integration Point

**Note**: Stage 8 functionality has been incorporated into the TIMER Agent (Section 4), which handles:
- Action tracking and completion monitoring
- Intelligent reminder scheduling with escalation
- Multi-channel delivery orchestration
- Retry logic and failure handling
- Family coordination and duplicate prevention
- Completion analytics and reporting

See Section 4 (TIMER Agent) for complete action tracking and follow-up capabilities.

## 3.5 CLARA Integration with ADAPT

- **Feature Description**: CLARA feeds all classification events to ADAPT Agent for continuous learning and system improvement
- **User Experience**: Classification accuracy improves automatically as ADAPT identifies patterns and anomalies
- **Admin View**: 
  - Real-time classification confidence trends
  - New category discovery alerts
  - Accuracy degradation warnings
  - Entity discovery notifications
- **Dependencies**: ADAPT Agent
- **Data Structure**: See TRD Section 3.5

### Quality Feedback Loop

**Confidence Scoring Integration:**
- Each CLARA stage reports confidence to ADAPT
- ADAPT analyzes patterns across all classifications
- Automatic flagging of degrading accuracy
- Proactive recommendations for improvement

**Discovery Pipeline:**
```
CLARA Detection → ADAPT Analysis → Admin Queue → System Update
```

**Automatic Triggers to ADAPT:**
- Confidence score < 70%
- New sender domain detected
- Unknown category identified
- Processing anomaly detected
- New entity discovered

**Duplicate Detection:**
- Check last 24 hours of emails
- Match on: sender + subject (fuzzy 85%) + family
- If duplicate found: return cached result
- Saves ~20% of AI processing costs
- A/B test new models before deployment

## 3.6 Real-World Transformation Examples

### Example 1: Permission Slip
**Original Email** (487 words):
> "Dear Parents, We are excited to announce that the Year 5 swimming carnival will be held on Friday, March 15th at the Dubai Aquatic Centre. Please ensure your child brings..."

**CLARA Output** (42 words):
> 🟡 **Permission needed** - Emma's swimming carnival
> 📅 Friday, March 15
> 📍 Dubai Aquatic Centre
> ⏰ Permission slip due Wednesday
> 
> [Complete Permission] [Set Reminder] [Add to Calendar]

### Proactive Assistance
- Suggests calendar events
- Creates automatic reminders
- Prompts for common actions

### Inter-Module Communication

**Data Flow Interfaces:**
```typescript
// Module 1 → Module 2
interface CaptureOutput {
  email_id: string;
  family_id: string;
  sender: string;
  sender_domain: string;
  trust_score: number;
  subject: string;
  content: string;
  content_type: 'text/html' | 'text/plain';
  timestamp: string;
  attachments: Attachment[];
  thread_id: string;
  related_emails: string[];
  processing_flags: ProcessingFlags;
}

// Module 2 → Module 3
interface ClassificationOutput {
  email_id: string;
  classification: Classification;
  extracted_entities: Entities;
  priority_scoring: PriorityScore;
  interaction_assessment: InteractionLevel;
  generated_message: GeneratedMessage;
  routing_recommendations: RoutingHints;
}

// Module 3 → Output
interface DeliveryOutput {
  email_id: string;
  delivery_plan: DeliveryPlan;
  tracking_setup: TrackingSetup;
  delivery_results: DeliveryResults;
  analytics_tracking: AnalyticsData;
}
```

### Data Guarantees

**ACID Compliance:**
- **Atomicity**: Each email fully processed or rolled back
- **Consistency**: Same input always produces same output
- **Isolation**: Family data never crosses boundaries
- **Durability**: All stages logged and recoverable

## 3.7 Technical Implementation Requirements

### API Endpoints Required

**Email Ingestion:**
```
POST /api/webhooks/email
Headers: X-Mailgun-Signature, X-Mailgun-Timestamp
Body: Multipart form data with email content
Response: 200 OK with processing_id
```

**Classification Status:**
```
GET /api/emails/{processing_id}/status
Response: {
  "status": "processing|completed|failed",
  "confidence": 0-100,
  "result": {classification_object}
}
```

**Manual Review:**
```
POST /api/admin/review/{email_id}
Body: {
  "corrected_category": "string",
  "corrected_entities": {},
  "admin_notes": "string"
}
```

### Database Transaction Patterns

**Email Processing Transaction:**
```sql
BEGIN;
  INSERT INTO emails (id, family_id, content...);
  INSERT INTO email_metadata (email_id, sender...);
  INSERT INTO processing_queue (email_id, status);
COMMIT;
```

**Notification Delivery Transaction:**
```sql
BEGIN;
  INSERT INTO notifications (id, family_id, content...);
  UPDATE action_items SET notification_id = ?;
  INSERT INTO delivery_tracking (notification_id...);
COMMIT;
```

### Caching Strategy

**Redis Cache Keys:**
```
email:duplicate:{hash} - TTL 24h
family:preferences:{family_id} - TTL 1h  
classification:cache:{email_hash} - TTL 7d
sender:trust:{domain} - TTL 30d
```

### Error Handling

**Retry Strategy:**
- AI API failures: 3 retries with exponential backoff
- WhatsApp failures: 5 retries over 2 hours
- Database failures: Circuit breaker after 3 fails
- Webhook failures: Store and retry for 24 hours

**Fallback Mechanisms:**
- AI unavailable: Rule-based classification
- WhatsApp down: SMS backup
- Database down: Queue in Redis
- All systems down: Email admin

### Performance Requirements

**Module SLAs:**
- Module 1 (Capture): <500ms processing
- Module 2 (Classify): <3s including AI call
- Module 3 (Deliver): <2s to WhatsApp
- End-to-end: <5s total (99th percentile)

**Capacity Planning:**
- Peak load: 1000 emails/minute
- Sustained load: 100 emails/minute
- Burst capacity: 5000 emails/5 minutes
- Scale trigger: 70% capacity



## 3.8 Action Matrix: Classification to Recommendation Mapping

**Status:** Core CLARA Component - Production Ready

### Overview

The Action Matrix serves as CLARA's intelligent routing engine, providing the definitive mapping between message characteristics and delivery actions. This configuration-driven component ensures consistent, predictable message routing while maintaining flexibility for future optimization.

### Integration with CLARA Pipeline

**How the Matrix Integrates:**
```
Stage 3 (Content Classification) → Stage 4 (Priority Calculation) → Stage 5 (Interaction Level) 
                                                                            ↓
                                                                    ACTION MATRIX LOOKUP
                                                                            ↓
                                            Stage 6 (Message Generation) → Stage 7 (Family Routing) → TIMER Agent
```

**Runtime Operation:**
1. **Stage 2** identifies Email Scope (School-wide, Class, Individual, etc.)
2. **Stage 3** classifies content into CLARA category 
3. **Stage 4** calculates priority level
4. **Stage 5** determines interaction requirements
5. **Matrix Lookup** using Email Scope × Content Category × Priority
6. **Stage 6** generates messages using matrix-defined actions
7. **Stage 7** routes via matrix-specified channels
8. **TIMER Agent** schedules reminders per matrix configuration

---

### CLARA to Action Matrix Category Mapping

**Category Translation Guide:**

| CLARA Category | Action Matrix Category | Notes |
|----------------|------------------------|-------|
| permission_request | PERMISSION_REQUEST | Direct mapping |
| payment_due | FINANCIAL_COMMUNICATION | Includes all payment-related items |
| event_announcement | EVENT_ANNOUNCEMENT | Direct mapping |
| general_info | INFORMATIONAL_UPDATE | General announcements, newsletters |
| urgent_notice | DEADLINE_REMINDER or EMERGENCY_COMMUNICATION | Based on urgency level |
| academic_update | ACADEMIC_REPORTING | Grades, progress reports |
| schedule_change | SCHEDULE_MODIFICATION | Direct mapping |
| health_safety | MEDICAL_CONCERN or EMERGENCY_COMMUNICATION | Based on severity |
| volunteer_request | EVENT_ANNOUNCEMENT | Treat as event participation |
| lost_found | INFORMATIONAL_UPDATE | Low priority notifications |
| administrative | POLICY_UPDATE or INFORMATIONAL_UPDATE | School policies and procedures |
| behavioral_disciplinary | BEHAVIORAL_DISCIPLINARY | Added for individual concerns |
| other | INFORMATIONAL_UPDATE | Default fallback |

### Comprehensive Action Decision Table

| Email Scope | Content Category | Priority | Primary Actions | Reminder Schedule | Escalation Actions | Delivery |
|:------------|------------------|----------|-----------------|-------------------|-------------------|----------|
| **NATIONAL/GOVERNMENT** | INFORMATIONAL_UPDATE | LOW | WhatsApp Message | None | None | Immediate |
| **NATIONAL/GOVERNMENT** | SCHEDULE_MODIFICATION | HIGH | WhatsApp + Calendar | -1 week, -1 day | SMS fallback | Immediate |
| **NATIONAL/GOVERNMENT** | EMERGENCY_COMMUNICATION | CRITICAL | WhatsApp + Emergency SMS | None | All family SMS | Immediate |
| **DISTRICT/REGIONAL** | POLICY_UPDATE | LOW | WhatsApp Message | None | None | Immediate |
| **DISTRICT/REGIONAL** | SCHEDULE_MODIFICATION | MEDIUM | WhatsApp + Calendar | -2 days, -1 day | Dashboard alert | Immediate |
| **DISTRICT/REGIONAL** | EMERGENCY_COMMUNICATION | CRITICAL | WhatsApp + Emergency SMS | None | All family SMS | Immediate |
| **SCHOOL-WIDE** | EVENT_ANNOUNCEMENT | MEDIUM | WhatsApp + Calendar | -1 week, -2 days | Partner notification | Immediate |
| **SCHOOL-WIDE** | PERMISSION_REQUEST | HIGH | WhatsApp + Task + Dashboard | -2 days, -1 day, -4 hours | SMS + Partner alert | Immediate |
| **SCHOOL-WIDE** | DEADLINE_REMINDER | HIGH | WhatsApp + Task | -1 day, -4 hours | SMS fallback | Immediate |
| **SCHOOL-WIDE** | EMERGENCY_COMMUNICATION | CRITICAL | WhatsApp + Emergency SMS | None | All contacts | Immediate |
| **GRADE/YEAR** | EVENT_ANNOUNCEMENT | LOW | WhatsApp Message | -1 week | None | Immediate |
| **GRADE/YEAR** | PERMISSION_REQUEST | MEDIUM | WhatsApp + Task | -2 days, -1 day | Partner notification | Immediate |
| **GRADE/YEAR** | SCHEDULE_MODIFICATION | HIGH | WhatsApp + Calendar | -1 day, -4 hours | SMS if same day | Immediate |
| **GRADE/YEAR** | ACADEMIC_REPORTING | MEDIUM | WhatsApp + Dashboard | None | School contact info | Immediate |
| **CLASS/HOMEROOM** | EVENT_ANNOUNCEMENT | LOW | WhatsApp Message | Optional -2 days | None | Immediate |
| **CLASS/HOMEROOM** | PERMISSION_REQUEST | MEDIUM | WhatsApp + Task | -2 days, -1 day, -4 hours | SMS + Teacher contact | Immediate |
| **CLASS/HOMEROOM** | DEADLINE_REMINDER | HIGH | WhatsApp + Task | -12 hours, -2 hours | Partner + SMS | Immediate |
| **CLASS/HOMEROOM** | BEHAVIORAL_DISCIPLINARY | HIGH | WhatsApp + Dashboard Alert | None | School contact provided | Immediate |
| **INDIVIDUAL/FAMILY** | ACADEMIC_REPORTING | MEDIUM | WhatsApp + Dashboard | None | Meeting booking link | Immediate |
| **INDIVIDUAL/FAMILY** | BEHAVIORAL_DISCIPLINARY | HIGH | WhatsApp + Dashboard Alert | None | Principal contact info | Immediate |
| **INDIVIDUAL/FAMILY** | MEDICAL_CONCERN | CRITICAL | WhatsApp + Emergency SMS | None | All emergency contacts | Immediate |
| **INDIVIDUAL/FAMILY** | PERMISSION_REQUEST | MEDIUM | WhatsApp + Task | -1 day, -4 hours | Teacher contact info | Immediate |
| **INDIVIDUAL/FAMILY** | FINANCIAL_COMMUNICATION | MEDIUM | WhatsApp + Task | -1 week, -2 days, -1 day | Partner notification | Immediate |
| **ACTIVITY/CLUB** | EVENT_ANNOUNCEMENT | LOW | WhatsApp (if enrolled) | -1 week | None | Immediate |
| **ACTIVITY/CLUB** | SCHEDULE_MODIFICATION | MEDIUM | WhatsApp + Calendar | -1 day | Coordinator contact | Immediate |
| **ACTIVITY/CLUB** | PERMISSION_REQUEST | MEDIUM | WhatsApp + Task | -2 days, -1 day | Activity lead contact | Immediate |
| **ACTIVITY/CLUB** | EMERGENCY_COMMUNICATION | CRITICAL | WhatsApp + Emergency SMS | None | All family contacts | Immediate |

**Configuration Status:** Default matrix for all schools (MVP)  
**Version:** 1.0  

**Technical Notes:**
- Stored as configuration data in database
- Cached in Redis for sub-10ms lookup performance
- Hot-reloadable without service restart
- Version controlled for rollback capability

### Action Type Definitions

#### Message Actions

- **WhatsApp Message**: Primary notification channel with action buttons and deep links to School'cierge dashboard
- **Push Notification**: iOS/Android OS notifications with rich content, action buttons, and deep links to app
- **SMS Fallback**: Automatic SMS delivery if WhatsApp fails or user prefers SMS-only
- **Emergency SMS**: Immediate SMS for critical/emergency communications alongside WhatsApp
- **Dashboard Alert**: In-app notification within School'cierge web dashboard

**Notification Hierarchy:**
1. WhatsApp (primary) + Push notification (complementary alert)
2. If WhatsApp fails → SMS fallback + Push notification
3. Emergency: All channels simultaneously (WhatsApp + SMS + Push)
4. Dashboard always shows for logged-in users

#### Calendar Actions  

- **Calendar (Auto)**: Automatically create calendar event with high confidence dates
- **Calendar (Optional)**: Offer calendar creation with user confirmation
- **Calendar + Reminder**: Create event with automated reminder notifications

#### Task Actions

- **Task (Simple)**: One-step action items (acknowledge, submit)
- **Task (Complex)**: Multi-step processes (forms, bookings, arrangements)
- **Task + Deadline**: Tasks with countdown timers and urgency indicators

#### Reminder Actions

- **Reminder Schedule**: Pre-event notifications (e.g., -1 week, -2 days, -1 day before deadline)
- **Smart Reminders**: Auto-cancelled when task marked complete, respects quiet hours
- **Escalating Reminders**: Increasing urgency as deadline approaches
- **Contextual Reminders**: Include specific action needed and direct link to complete

#### Escalation Actions

- **WhatsApp to SMS**: Automatic fallback if WhatsApp undelivered after 30 minutes
- **Partner Notification**: Alert other parent/guardian if primary doesn't respond
- **Dashboard Escalation**: Prominent alert in web dashboard for critical items
- **School Contact Info**: Provide relevant school contact details for manual follow-up
- **Emergency Protocol**: SMS to all family members for true emergencies

### Reminder Schedule Logic

**Automated Reminder System:**
- All reminders calculated backwards from event/deadline date
- Automatically cancelled when task marked complete
- Respects family quiet hours and timezone
- Delivered via WhatsApp (SMS fallback if needed)

**Standard Reminder Patterns:**
*Note: These are default patterns. Actual intervals are admin-configurable via Section 4.5.*

**Permission Slips & Forms:**
- First reminder: -2 days before deadline
- Second reminder: -1 day before deadline  
- Final reminder: -4 hours before deadline
- Escalation: SMS + partner notification if no response

**Events & Activities:**
- Initial notification: -1 week before event
- Reminder: -2 days before event
- Final reminder: Morning of event

**Financial Deadlines:**
- First reminder: -1 week before due date
- Second reminder: -2 days before due date
- Final reminder: -1 day before due date
- Partner always notified for financial items

**Academic/Behavioral Items:**
- No automated reminders (sensitive nature)
- Manual follow-up options provided
- School contact information included

**Emergency Communications:**
- No reminders (immediate action required)
- Simultaneous WhatsApp + SMS delivery
- All family members notified

### Action Matrix Key Principles

1. **WhatsApp First**: All non-emergency communications via WhatsApp
2. **SMS Fallback**: Automatic SMS if WhatsApp fails or user preference
3. **Smart Reminders**: Context-aware scheduling based on item type
4. **Partner Coordination**: Critical items notify all parents
5. **Dashboard Integration**: Important items appear in web dashboard
6. **Immediate Delivery**: All messages sent immediately (respecting quiet hours)
7. **No Phone Calls**: Contact information provided for manual follow-up
8. **Configuration-Driven**: Matrix stored as data, enabling runtime updates without code changes

### Administration Interface

**Matrix Management Dashboard:**
- **View Configuration**: Read-only grid display of active routing rules
- **Test Routing**: Preview how specific messages would be routed
- **Manual Override**: Route individual messages differently when needed
- **Analytics View**: 
  - Delivery success rates by action type
  - Parent engagement by channel
  - Escalation frequency by category

**Key Metrics:**
- Messages routed per category/priority
- Channel effectiveness rates
- Reminder-to-action conversion
- Escalation trigger frequency

### Technical Implementation

**Dependencies:**
- CLARA Stages 1-5 for message analysis
- TIMER Agent for reminder scheduling
- WhatsApp/SMS integrations for delivery
- Redis for performance caching

**Data Structure:**
See TRD Section 5.8 for:
- action_matrix_config table schema
- Matrix lookup API endpoints
- Caching strategy
- Integration points with CLARA pipeline


## 3.9 MVP Scope Clarification

**Current MVP Focus (Phase 1):**
The MVP implementation focuses exclusively on:

- **Information Extraction**: Identifying and extracting key information from school communications
- **Smart Reminders**: Creating intelligent reminders for important dates and deadlines
- **Task Management**: Converting emails into actionable tasks with tracking
- **Calendar Integration**: Adding events and deadlines to family calendars
- **Acknowledgements**: Simple "Got it" or "Noted" confirmations from parents

**NOT in MVP:**
- Direct payment processing or "Pay Now" buttons
- Third-party API integrations with educational platforms
- Automated form filling or submission
- Real-time grade or assignment syncing

All payment-related communications in MVP will:
- Extract payment amount and deadline information
- Create reminders for payment due dates
- Provide payment reference numbers
- Allow parents to mark payments as "noted" or "completed"
- Route payment information to designated financial parent

### WhatsApp User Interaction Methods

**Dual Interaction Approach:**
Users can interact with School'cierge messages in two ways:

#### 1. Button-Based Interaction (When Available)
- **Quick Action Buttons**: [Mark Complete], [Snooze], [View Details]
- **One-tap responses** for common actions
- **Available with Wapi provider** (supports interactive messages)
- **Preferred method** for speed and simplicity

#### 2. Natural Language Responses (Always Available)
- **NOT a fallback** - it's an alternative interaction method
- **Text-based replies** users can send anytime:
  - "done", "completed", "✓" → Mark task complete
  - "remind me tomorrow", "snooze" → Postpone reminder
  - "yes", "no", "confirm" → Quick confirmations
  - "more info", "details" → Get expanded information
- **Works with all WhatsApp providers** (Wapi and 2Chat.io)
- **AI-powered understanding** of intent and variations

**Provider Differences:**
- **Wapi**: Supports both buttons AND natural language
- **2Chat.io**: Natural language ONLY (no button support)
- Both are valid provider options, not primary/fallback

**Example WhatsApp Message:**
```
📋 Permission Slip - Emma Chen
Field trip to Science Museum
Due: Tomorrow 3 PM

[Mark Complete] [Remind Later] [View Form]

Or reply: "done", "remind me in 2 hours"
```



# 4. TIMER *(Tasks, Information, and Multi-channel Engagement & Reminder)* Agent

## 4.1 TIMER Overview

### Executive Summary

TIMER (Tasks, Information, and Multi-channel Engagement & Reminder) Agent is School'cierge's central orchestration engine for family coordination. This comprehensive multi-channel task and reminder management system seamlessly integrates CLARA's intelligence with both visual dashboard interfaces and conversational WhatsApp interactions, ensuring tasks can be created, managed, and completed through any channel while maintaining perfect synchronization across all family touchpoints.

### Core Value Proposition

**"Inform and Remind"** - Ensuring families never miss important school communications or deadlines through intelligent, multi-channel task orchestration.

### System Position

TIMER receives processed action items from CLARA's Stage 7 (Family Routing Decision Engine) and transforms them into actionable tasks, intelligent reminders, and coordinated multi-channel notifications. It serves as the bridge between email intelligence and family action.

### Key Capabilities

- **[REQ-091] Multi-Channel Task Management**: Complete tasks via WhatsApp, app dashboard, or voice commands
- **[REQ-092] Intelligent Reminder Orchestration**: Smart scheduling based on priority and deadlines
- **[REQ-093] Real-Time Synchronization**: Instant updates across all family member devices
- **[REQ-094] Completion Tracking**: Multiple methods to verify task completion
- **[REQ-095] Family Coordination**: Prevent duplicate actions and coordinate between parents
- **[REQ-096] Delivery Optimization**: Automatic provider failover and retry logic
- **[REQ-097] Performance Analytics**: Track engagement and optimize delivery

## 4.2 Multi-Channel Task Interface

### Channel Equality Principle

Both WhatsApp and School'cierge App Dashboard interfaces are **primary, co-equal channels** for task management:
- **[REQ-098] Task Creation**: Generated by CLARA, accessible via both channels
- **[REQ-099] Task Completion**: Achievable through either WhatsApp or Dashboard
- **[REQ-100] State Synchronization**: Real-time bidirectional sync across all interfaces
- **[REQ-101] Family Coordination**: Seamless handoffs between channels based on context and preference

### WhatsApp Conversational Interface

#### Interactive Button System (Primary - via Whapi.Cloud)

**Rich Interactive Messages with Quick Reply Buttons:**

```
📝 Field Trip Permission Required
Due: Friday, Oct 15 at 3:00 PM
Child: Emma Chen

Please acknowledge the permission slip:

[✓ Acknowledge] [🔔 Remind Tomorrow] [📅 Add to Calendar]
```

**Button Action Types:**
- **Selection Buttons**: Direct option selection (Yes/No, time slots)
- **Action Buttons**: Complete, Acknowledge, Defer, Snooze
- **Navigation Buttons**: View Dashboard, See Details, Get Help
- **Reminder Buttons**: Snooze 1 Day, Remind Friday, Remind Next Week

#### Natural Language Processing (Both Providers)

Both WhatsApp providers support natural language commands:
- **"Done"** = Mark task complete
- **"OK"** or **"Got it"** = Acknowledge/confirm
- **"Later"** = Snooze until tomorrow
- **"Next week"** = Defer 7 days
- **"Remind me Friday"** = Set specific reminder
- **"Complete"** = Mark as finished
- **"Help"** = Show available commands

#### Smart Context Switching

**Visual Handoff Rules:**
- **Complex scheduling** (>3 options) → "Check your dashboard for full calendar view"
- **Multi-step forms** → "Complete this in the app: [link]"
- **Document review** → "View full document in app"
- **Bulk actions** → "Manage multiple tasks in dashboard"

### Native App Dashboard Interface

#### Task Card Design

**Visual Task Components:**
```
┌─────────────────────────────────────┐
│ 🔴 Permission Slip - Swimming       │
│ Due: Tomorrow 3:00 PM               │
│ ────────────────────────────────    │
│ Child: Emma                         │
│ Status: ⏳ Pending (2 reminders)    │
│                                     │
│ Original: Year 5 Swimming Carnival  │
│ Confidence: 95% | Category: Action  │
│                                     │
│ [Complete] [Snooze] [View Detail]   │
└─────────────────────────────────────┘
```

#### Dashboard Layout Organization

**Task Views:**
- **Upcoming Tasks**: Combined view with visual indicators (red = today, yellow = this week)
- **Calendar View**: Monthly interface showing tasks as blocks on due dates
- **By Child**: Filtered view per dependent
- **Completed**: Recent accomplishments with timestamps

**Visual Priority Indicators:**
- 🔴 **Critical**: Due < 24 hours or safety-related
- 🟡 **High**: Due 2-3 days or requires action
- 🟢 **Medium**: Due this week
- ⚪ **Low**: FYI or due > 1 week

#### Native Mobile Features

- **[REQ-102] Swipe Gestures**: Quick complete/snooze actions
- **[REQ-103] Pull-to-Refresh**: Sync latest tasks
- **[REQ-104] Offline Management**: Queue actions for sync
- **[REQ-105] Push Notifications**: Rich notifications with actions
- **[REQ-106] Biometric Authentication**: Secure access
- **[REQ-107] Widget Support**: Home screen task summary

## 4.3 Task Generation & Lifecycle Management

### CLARA to TIMER Handoff Protocol

TIMER receives structured action items from CLARA's Stage 7 with complete context:

**Incoming Data Structure:**
- **Classification Context**: Category, priority, confidence score
- **Extracted Data**: Title, description, deadline, amounts, child names
- **Routing Decision**: Primary recipients, escalation paths, channel preferences
- **Action Items**: Specific tasks, reminders, and notifications to create

### Task Creation Pipeline

**Automatic Task Generation Process:**
1. **Receive CLARA Output**: Process action items from Stage 7
2. **Parse Requirements**: Extract deadlines, dependencies, completion methods
3. **Set Priority**: Calculate based on category, deadline, and impact
4. **Assign Family Members**: Use routing rules and preferences
5. **Schedule Reminders**: Create reminder timeline based on priority
6. **Enable Tracking**: Set up completion monitoring

### Universal Task State Management

**Task Lifecycle States:**
- **Created**: Initial state from CLARA
- **Scheduled**: Queued for future delivery
- **Active**: Currently actionable by family
- **In Progress**: Family member working on task
- **Pending Review**: Awaiting confirmation
- **Completed**: Successfully finished
- **Snoozed**: Temporarily postponed
- **Expired**: Past deadline without completion
- **Cancelled**: No longer relevant

### Multi-Channel State Synchronization

**Real-Time Sync Architecture:**
- **Change Detection**: Monitor task state changes from any channel
- **Conflict Resolution**: Last-write-wins with user confirmation for conflicts
- **Propagation**: Instant updates to all connected family member devices
- **Offline Handling**: Queue changes for sync when connectivity restored

## 4.4 Action Tracking & Completion System

### Completion Tracking Methods

**[REQ-108] URL Click Tracking:**
- Generate unique tracking URLs for each action
- Monitor click-through rates
- Auto-complete tasks on URL access
- Track completion source and timestamp

**[REQ-109] Button Response Monitoring:**
- WhatsApp button clicks
- Dashboard action buttons
- Push notification actions
- Widget interactions

**Natural Language Processing:**
- Parse "Done", "Complete", "Finished" commands
- Understand context from conversation
- Confirm completion with acknowledgment

**Dashboard Actions:**
- Direct task completion
- Bulk completion options
- Drag-and-drop to complete
- Swipe gestures

**Automatic Completion:**
- Calendar event creation
- Form submission detection
- Payment confirmation receipt
- Third-party integration callbacks

### Time-to-Action Metrics

**Performance Tracking:**
- Time from creation to first view
- Time from reminder to action
- Number of reminders before completion
- Channel preference for completion
- Peak action times by family

### Completion Analytics Dashboard

**Real-Time Metrics:**

**By Category Performance:**
- Permissions: 92% completion rate, 3.5 hour average
- Payments: 87% completion rate, 6.2 hour average
- Events: 95% completion rate, 2.1 hour average
- Academic: 89% completion rate, 4.8 hour average

**Family Engagement Scoring:**
- Completion rate trends
- Response time improvements
- Channel preference evolution
- Reminder effectiveness

**Channel Preference Analysis:**
- WhatsApp: 73% of completions
- Dashboard: 22% of completions
- Auto-complete: 5% of completions

## 4.5 Intelligent Reminder & Escalation System

### Admin-Configurable Reminder System

- **Feature Description**: Platform-wide reminder and escalation system configured through administration interface
- **User Experience**: Families receive timely reminders based on admin-configured intervals for each category type
- **Admin View**: 
  - Category-based reminder interval configuration
  - Escalation rule management
  - Message template customization
  - Platform-wide quiet hours settings
  - Reminder effectiveness analytics
- **Dependencies**: TIMER Agent, admin configuration system
- **Data Structure**: See TRD Section 6.8

### Category-Based Reminder Templates

**Admin-Configured Categories and Default Intervals:**

| Category | Reminder Schedule | Escalation Point |
|----------|------------------|------------------|
| Permission Slips | T-24h, T-4h, T-1h | 50% to deadline |
| Payment Due | T-7d, T-3d, T-1d, T-4h | T-24h |
| Events | T-1w, T-1d, T-2h | T-4h |
| Medical Forms | T-48h, T-24h, T-4h | T-12h |
| Academic (homework/projects) | T-24h, T-12h, T-2h | T-6h |
| Sports/Activities | T-1w, T-1d, morning-of | T-4h |
| Uniform/Special Dress | T-1d, morning-of | Morning-of |
| Field Trips | T-1w, T-2d, T-1d | T-24h |
| Parent-Teacher Meetings | T-1w, T-2d, T-2h | T-4h |
| School Supplies | T-2d, T-1d | T-12h |
| Emergency/Safety | Immediate, T-30min, T-10min | Immediate |
| General Announcements | Once only | N/A |
| Pickup/Dropoff Changes | T-2h, T-30min | T-1h |
| Exam/Test Reminders | T-1w, T-2d, T-1d | T-2d |
| Report Cards | T-1d | N/A |
| Vaccination/Health | T-1w, T-3d, T-1d | T-2d |
| Library Books Due | T-2d, T-1d, morning-of | T-1d |
| Photo Day | T-1w, T-2d, T-1d | T-1d |
| School Holidays | T-1w, T-2d | N/A |
| Custom/Other | Configurable (default: T-24h, T-4h) | T-6h |

**Note:** All intervals are configurable by platform administrators through the admin dashboard.

### Escalation Configuration

**System-Wide Escalation Rules (Admin-Configurable):**

- **Primary to Secondary Parent**: At 50% of deadline elapsed
- **Channel Escalation** (WhatsApp → SMS): At 25% time remaining
- **Emergency Protocol**: Immediate multi-channel for critical items
- **Family-Wide Broadcast**: For urgent/safety communications

### Message Templates

**Admin-Configurable Message Templates:**

```
Initial Notification:
"📋 {CATEGORY}: {TITLE} - Due {DATE}"

Gentle Reminder:
"Hi! Quick reminder: {CHILD_NAME}'s {ITEM} is due {RELATIVE_TIME}"

Standard Reminder:
"⏰ {URGENCY}: {CHILD_NAME}'s {ITEM} needed by {DEADLINE}"

Urgent Reminder:
"🚨 Due {TIME_REMAINING}: {CHILD_NAME}'s {ITEM}"

Final Escalation:
"❗ LAST CALL: {ITEM} closes in {TIME_REMAINING}"
```

### Quiet Hours & User Preferences

**Platform & User Settings:**
- **Platform Default**: 9 PM - 7 AM (admin-configurable)
- **User Override**: Can set personal quiet hours within platform limits
- **Emergency Override**: Critical/safety messages bypass all quiet hours
- **Timezone Aware**: All times in family's local timezone

**Note:** School-specific configurations are in backlog. MVP uses single platform-wide configuration.

## 4.6 Message Orchestration & Delivery Management

### Queue Architecture Overview

TIMER manages multiple queues for optimal delivery:

**Queue Types:**
- **Immediate Queue**: Critical messages (< 1 minute delivery)
- **Scheduled Queue**: Future messages respecting quiet hours
- **Retry Queue**: Failed messages with exponential backoff
- **Dead Letter Queue**: Permanently failed requiring admin review

### Delivery Scheduling Logic

**Intelligent Delivery Timing:**
1. Check task priority and deadline
2. Apply family timezone
3. Respect quiet hours (unless critical)
6. Queue for appropriate delivery time

### Provider Failover Strategy

**Cascading Delivery System:**
1. **Primary**: Whapi.Cloud (WhatsApp with buttons) and Push notification to app
2. **Secondary**: 2Chat.io (WhatsApp natural language) and Push notification to app
3. **Backup**: Twilio (SMS for critical messages) and Push notification to app

**Automatic Failover Triggers:**
- Provider timeout (3 x retries, 5 min intervals)
- Authentication failure
- Rate limit exceeded
- Network errors
- Invalid recipient

### Error Handling & Recovery

**Error Classification:**
- **Temporary**: Network issues, rate limits → Retry with backoff
- **Permanent**: Invalid number, blocked → Move to dead letter
- **Provider**: Service down → Immediate failover
- **Unknown**: Log and escalate → Admin review

**Retry Strategy:**
- Exponential backoff: 2s, 4s, 8s, 16s, 32s, 1m, 5m, 15m, 1h
- Maximum 10 attempts over 24 hours
- Different strategy per error type
- Automatic provider switching

### Weekly Digest Compilation

**Batch Processing for Family Summaries:**

**Digest Content:**
```
📅 Your Week Ahead (5 tasks, 3 events)

⚡ Urgent This Week:
• Emma's field trip permission - Due Wednesday
• School fee payment reminder - Due Friday

📚 School Events:
• Parent-Teacher Conference - Tuesday 3 PM
• Science Fair - Thursday

💰 Payment Reminders:
• Lunch fees - $45 due Friday
• Book fair - Optional

📝 Forms & Permissions:
• Photo consent form - Due Monday
• Swimming carnival permission - Due Wednesday
```

**Delivery Schedule:**
- Default: Sunday evening 6 PM
- Customizable per family
- Skip if no content
- Include completion summary

## 4.7 Performance Metrics & Analytics

### Real-Time Delivery Metrics

**System Performance Indicators:**
- Message delivery rate: >99%
- Average delivery latency: <2 seconds
- Provider availability: 99.9%
- Queue processing rate: 1000 msg/minute

### Family Engagement Analytics

**Engagement Metrics:**
- Average task completion: 87%
- Time to first action: 4.2 hours
- Reminder effectiveness: 73% complete after first
- Channel preference stability: 85%

### Queue Health Monitoring

**Queue Metrics:**
- Immediate queue depth: <100 target
- Scheduled queue distribution
- Retry queue trends
- Dead letter accumulation rate

### Alert Conditions

**Automatic Alerts:**
- Delivery rate <90%: Provider issue alert
- Queue depth >1000: Scale workers
- Dead letters >50: Admin review required
- Provider failures >10: Switch providers

## 4.8 Family Coordination Features

### Routing Decision Engine

**Smart Task Assignment:**
- Historical pattern analysis
- Category-based preferences
- Workload distribution
- Availability consideration
- Expertise routing (financial → designated parent)

### Duplicate Prevention

**Coordination Mechanisms:**
- Lock task during completion
- Broadcast completion to family
- Prevent double actions
- Show "Parent 1 is handling this"

### Activity Timeline

**Task History Tracking:**
- Creation timestamp and source
- All reminder sent times
- View/read receipts
- Completion method and time
- Family member interactions

### Family Visibility Controls

**Permission Levels:**
- **Full Access**: Parents see everything
- **Child Specific**: See only relevant child's tasks
- **Category Filter**: Financial, medical, academic
- **Read Only**: View but cannot complete

## 4.9 Dependencies & Integration Points

### Upstream Dependencies

**From CLARA (Section 3):**
- Classified emails with action items
- Routing decisions and preferences
- Extracted deadlines and requirements
- Confidence scores for review

**From Family Setup (Section 2.1):**
- Family structure and roles
- Communication preferences
- Child associations
- Contact information

**From User Preferences (Section 2.3):**
- Quiet hours settings
- Notification preferences
- Channel selection
- Digest scheduling

### Downstream Integration

**To WhatsApp Delivery (Section 7.2):**
- Formatted messages with buttons
- Natural language alternatives
- Media attachments
- Read receipt tracking

**To SMS Fallback (Section 7.3):**
- Critical message backup
- Emergency escalations
- Provider failure recovery

**To Analytics (Section 8):**
- Completion metrics
- Engagement data
- Performance indicators
- Family insights

**To Admin System (Section 5):**
- Queue management interface
- Dead letter review
- Performance dashboards
- Manual interventions

### Data References

**Technical Implementation:** See TRD Section 6 - TIMER Technical Architecture
**Queue Specifications:** See TRD Section 6.2 - Queue Infrastructure
**API Contracts:** See TRD Section 6.4 - Channel Orchestration



# 5. User Journeys

## 5.1 New Family Onboarding Journey
**Goal:** Get from zero to receiving first organized WhatsApp message in <10 minutes

### Journey Steps:
1. **Discovery** → Parent finds School'cierge through school recommendation or app store
2. **Sign Up** → Create account with email/phone verification + WhatsApp number confirmation
3. **Family Setup** → Add children and family members with roles and specialist assignments
   - Assign Financial Specialist (handles fees, payments)
   - Assign Medical Specialist (handles health forms, emergencies)
   - Assign Academic Specialist (handles reports, meetings)
   - Assign Activities Specialist (handles sports, clubs)
4. **School Connection** → Search and select schools (ADAPT auto-discovers new schools)
5. **Email Setup** → Configure forwarding with test verification
6. **Preference Configuration** → Set notification preferences and quiet hours
7. **First Success** → Receive first CLARA-classified message via TIMER delivery

### Behind the Scenes:
- CLARA processes the first email through 7-stage pipeline
- TIMER schedules and delivers based on preferences
- ADAPT begins learning family patterns
- Quality gates ensure accuracy

### Key Success Metrics:
- Completion rate: >80%
- Time to complete: <10 minutes
- First message received: <24 hours
- First action completed: <48 hours

## 5.2 Daily Parent Experience Journey
**Goal:** Transform morning chaos into organized family coordination

### Morning Routine (7:00 AM):
1. **Wake Up** → Check WhatsApp (not email)
2. **TIMER Daily Digest** → "Good morning! 3 school items for today"
   - Permission slip due by 3 PM (reminder at 2 PM)
   - Sports practice at 4 PM (reminder at 3:30 PM)
   - Tomorrow's field trip preparation
3. **Quick Actions** → TIMER-tracked interactive buttons
   - Tap "Complete Permission" → Opens form
   - Tap "Set Reminder" → Customizable timing
4. **Family Sync** → See Financial Specialist already handled payment
5. **ADAPT Learning** → System notes completion patterns for future optimization

### Afternoon Reminders (2:00 PM):
1. **TIMER Alert** → "⏰ Permission slip due in 1 hour"
2. **Smart Escalation** → If not completed, TIMER sends to backup parent
3. **Completion Tracking** → Action marked done, reminders cancelled

### Evening Check-in (6:00 PM):
1. **TIMER Summary** → "Tomorrow: Emma's PE kit, field trip form"
2. **Task Review** → Check TIMER's pending items for tomorrow
3. **Specialist Routing** → Academic items to designated parent
4. **ADAPT Insights** → "You usually complete forms at 8 PM, shall I remind you then?"


## 5.3 Multi-Parent Family Coordination Journey
**Goal:** Seamless coordination between parents with specialized responsibilities

### Family Configuration:
- **Parent 1 (Financial Specialist)**: Handles all fee-related communications
- **Parent 2 (Academic Specialist)**: Manages academic reports and meetings
- **Both Parents**: Receive critical/emergency notifications

### Coordination Flow:
1. **Email Arrives** → "School fees due next week"
2. **CLARA Classification** → Category: Financial, Priority: High
3. **TIMER Routing** → Sent to Financial Specialist
4. **Completion Sync** → Other parent sees "✓ Fees paid by Parent 1"
5. **ADAPT Learning** → Notes which parent typically handles what

### Smart Deduplication:
- TIMER prevents duplicate notifications to both parents
- Actions completed by one parent auto-update for the other
- Family dashboard shows unified view of all tasks

### Specialist Benefits:
- Reduced notification overload
- Clear ownership of responsibilities
- Automatic escalation if primary specialist unavailable
- ADAPT learns patterns and suggests optimizations

## 5.4 Emergency Communication Journey
**Goal:** Critical information reaches all stakeholders immediately with multi-channel fallback

### Emergency Detection & Processing:
1. **Email Received** → "School closed due to weather emergency"
2. **CLARA Stage 3** → Classification: EMERGENCY, Confidence: 98%
3. **Quality Gate** → Auto-approved (high confidence + emergency)
4. **CLARA Stage 4** → Priority: CRITICAL (score: 100)
5. **TIMER Override** → Bypasses quiet hours and preferences

### Multi-Channel Delivery (Parallel):
1. **Push Notification** → Instant delivery to all family members
2. **WhatsApp Primary** → Via Whapi.Cloud to all parents
3. **SMS Fallback** → If WhatsApp fails, immediate SMS
4. **Email Backup** → Original email also sent for reference

### Confirmation & Tracking:
- TIMER tracks delivery confirmation from each channel
- ADAPT monitors response patterns for future optimization
- Admin dashboard shows real-time delivery status
- Automatic escalation if no acknowledgment within 15 minutes

### System Resilience:
- Multi-provider failover (Claude → OpenAI → Grok)
- WhatsApp provider fallback (Whapi → 2Chat)
- All channels attempted simultaneously for critical messages

## 5.5 Admin Daily Operations Journey
**Goal:** Maintain 95%+ system accuracy with 30 minutes daily effort

### Morning Dashboard Review (15 minutes):
1. **System Health Check** → ADAPT-powered monitoring dashboard
   - Classification accuracy: 96.2% (↑0.3% from yesterday)
   - Delivery success rate: 99.1%
   - Queue depth: 8 items pending review
   - New entity discoveries: 3 schools, 2 apps

2. **Quality Assurance Queue** → ADAPT-prioritized review items
   - 3 low-confidence classifications (<70%)
   - 2 new pattern detections
   - 1 authority verification needed
   - 2 anomaly alerts (unusual volume from new domain)

3. **Quick Actions** → One-click resolutions
   - Approve/correct classifications → ADAPT learns immediately
   - Verify new sender authority → Updates trust scores
   - Approve discovered entities → Auto-populates database

### Configuration Management (10 minutes):
1. **Reminder Templates** → Review admin-configurable categories
   - Check performance of 20 reminder categories
   - Adjust intervals based on ADAPT recommendations
   - Review escalation effectiveness

2. **AI Provider Status** → Multi-LLM monitoring
   - Claude: 98% uptime, $0.23/1000 classifications
   - OpenAI: Standby (fallback ready)
   - Grok: Configured but unused
   - Cost optimization: ADAPT suggests switching 20% to OpenAI

### Community Contributions (5 minutes):
1. **Entity Approvals** → ADAPT pre-validated submissions
   - 3 new schools (auto-discovered, 95% confidence)
   - 2 educational apps (parent-submitted)
   - 1-click approval with ADAPT's recommendation

2. **Pattern Recognition** → New classification patterns
   - ADAPT identified "Virtual Parent Evening" as new category
   - Review sample, approve for auto-classification
   - System immediately applies to 47 pending emails

### End-of-Day Analytics:
- **ADAPT Performance Report**:
  - 342 emails processed
  - 12 manual corrections made → Fed back for learning
  - 3 new patterns discovered
  - Accuracy improved by 0.3%
  - Predicted tomorrow's volume: 380 emails

## 5.6 System Learning & Adaptation Journey
**Goal:** Continuous improvement through intelligent observation and learning

### Week 1 - Initial Learning:
1. **Family Onboards** → Basic preferences captured
2. **CLARA Processing** → Baseline classification accuracy: 92%
3. **TIMER Delivery** → Default reminder schedules active
4. **ADAPT Observing** → Collecting interaction patterns

### Week 2 - Pattern Recognition:
1. **ADAPT Discovers** → "Mom completes forms at 8 PM on weekdays"
2. **Timing Adjustment** → TIMER shifts reminders to 7:30 PM
3. **Completion Rate** → Increases from 73% to 91%
4. **Admin Notified** → "New pattern detected and optimized"

### Week 4 - Family Optimization:
1. **ADAPT Analysis** → "Dad responds better to morning notifications"
2. **Specialist Learning** → "Mom handles all medical, Dad handles sports"
3. **Auto-Configuration** → System suggests role reassignments
4. **Accuracy Boost** → Classification accuracy reaches 96%

### Month 2 - Platform Evolution:
1. **New School Detected** → ADAPT identifies "Green Valley Academy"
2. **New Category Found** → "Parent-Teacher Conference Scheduling"
3. **Admin Approval** → One-click addition to system
4. **Immediate Application** → 50 families benefit instantly

### Continuous Improvement Metrics:
- Classification accuracy: 92% → 96% (+4% in 2 months)
- Delivery success rate: 95% → 99% (+4%)
- Action completion time: 4 hours → 45 minutes (-82%)
- Manual review needs: 15% → 5% (-67%)
- New entities discovered: 23 schools, 14 apps, 8 categories

# 6. ADAPT Agent – (Active Data Analysis for Product Tuning)

## Overview
The ADAPT Agent (Active Data Analysis for Product Tuning) is a system-wide intelligence layer that continuously observes operational data, detects patterns, and identifies optimization opportunities. By leveraging advanced analytics and adaptive algorithms, ADAPT fine-tunes product performance, enhances user experience, and ensures the platform evolves in alignment with both operational demands and user-driven innovation.

## 6.1 Entity Discovery & Management

- **[REQ-110] Feature Description**: Automatic detection and cataloging of new entities across all platform interactions, including schools, apps, email domains, service providers, and communication categories
- **[REQ-111] User Experience**: Seamless platform expansion as new entities are automatically discovered and queued for administrative review
- **Admin View**:
  - Daily discovery dashboard showing new entities by type
  - Confidence scoring for each discovered entity
  - Bulk approval/rejection interface
  - Pre-populated entity profiles for review
  - Frequency and impact analysis
  - Geographic distribution of discoveries
- **Dependencies**: CLARA processing pipeline, admin review system
- **Data Structure**: See TRD Section 10.1

### Discovery Categories

**Automated Detection:**
- **[REQ-112]** New email domains from existing schools
- **[REQ-113]** Unknown educational apps in communications
- **[REQ-114]** New service providers (sports, tutoring, camps)
- **[REQ-115]** Unrecognized communication categories
- **[REQ-116]** New geographic regions and timezones
- **[REQ-117]** Language variations in content

**Processing Workflow:**
1. Detection during CLARA processing
2. Entity extraction and validation
3. Confidence scoring (threshold: 80%)
4. Admin queue placement
5. Review and approval/rejection
6. System update and propagation

## 6.2 Quality Assurance & Monitoring System

- **[REQ-118] Feature Description**: Comprehensive quality assurance framework with automated quality gates, anomaly detection, and real-time performance monitoring integrated into ADAPT's learning system
- **[REQ-119] User Experience**: Platform maintains consistent high-quality service through proactive monitoring and automatic quality enforcement
- **Admin View**:
  - Classification accuracy tracking by category with confidence thresholds
  - Manual review queue with priority ordering (Urgent > Financial > Academic > General)
  - Anomaly detection dashboard with configurable thresholds
  - Real-time performance metrics (Prometheus integration)
  - Quality gate violation alerts and auto-routing
- **Dependencies**: CLARA pipeline, monitoring infrastructure, admin review system
- **Data Structure**: See TRD Section 10.2

### Automated Quality Gates
```python
def quality_check(classification_result):
    # Confidence check
    if classification_result.confidence < 70:
        return "manual_review", "Low confidence"
    
    # Multi-category conflict
    if len(classification_result.categories) > 2:
        return "manual_review", "Category ambiguity"
    
    # New pattern detection
    if not matches_known_pattern(classification_result):
        return "manual_review", "Unknown pattern"
    
    # Profanity/spam check
    if contains_blocked_content(classification_result):
        return "block", "Content violation"
    
    # Authority mismatch
    if sender_authority_suspicious(classification_result):
        return "manual_review", "Authority verification needed"
    
    return "auto_process", "All checks passed"
```

### Manual Review Queue Logic
- **Priority ordering**: Urgent > Financial > Academic > General
- **Admin load balancing**: Round-robin assignment
- **SLA tracking**: 2-hour review target for urgent items
- **Learning capture**: All corrections feed back to ADAPT for model improvement
- **Queue depth monitoring**: Alert when >20 items pending

### Anomaly Detection Rules
```
IF email_volume > 3x daily average: trigger flood_protection
IF new_sender_domain AND financial_category: manual_review
IF identical_content to >10 families: verify mass_communication
IF processing_time > 10 seconds: performance_alert
IF classification_confidence < 60% for >10% daily volume: model_review
```

### AI Performance Monitoring
**Real-time Metrics (Prometheus)**:
```
clara_classification_accuracy_rate{category="permission"}
clara_processing_duration_seconds{stage="ai_call"}
clara_confidence_score_distribution{bucket="0-70,70-90,90-100"}
clara_manual_review_queue_depth
clara_ai_api_errors_total{provider="anthropic"}
adapt_learning_improvements{metric="accuracy_gain"}
adapt_pattern_discoveries{type="new_entity"}
```

### Quality Assurance Feedback Loop
1. **Capture**: Every manual review correction captured
2. **Analyze**: ADAPT analyzes patterns in corrections
3. **Learn**: Update classification rules and confidence thresholds
4. **Improve**: Automatic model retraining based on feedback
5. **Monitor**: Track improvement metrics over time

## 6.3 Strategic Evolution Insights

- **Feature Description**: AI-powered analysis of platform usage to identify growth opportunities, feature requirements, and market expansion indicators
- **User Experience**: Platform evolves based on actual user needs and usage patterns
- **Admin View**:
  - Growth opportunity dashboard
  - Feature adoption analytics
  - Market expansion indicators
  - Language requirement detection
  - Integration opportunity identification
  - Strategic recommendation queue
- **Dependencies**: Analytics infrastructure, AI processing
- **Data Structure**: See TRD Section 10.3

### Strategic Intelligence Categories

**Market Signals:**
- Geographic expansion opportunities
- Language support requirements
- School system patterns
- Regional feature preferences

**Feature Evolution:**
- Most requested capabilities
- Usage pattern insights
- Integration opportunities
- Workflow optimizations

**Platform Growth:**
- User acquisition patterns
- Retention indicators
- Engagement metrics
- Revenue optimization opportunities

## 6.4 ADAPT Data Architecture

- **Feature Description**: Centralized data collection and storage system for all ADAPT intelligence
- **User Experience**: Transparent system that continuously improves without user intervention
- **Admin View**:
  - Unified event stream viewer
  - Historical trend analysis
  - Custom query interface
  - Export capabilities for analysis
- **Dependencies**: Data warehouse, streaming infrastructure
- **Data Structure**: See TRD Section 10.4

### Data Collection Points
- CLARA classification events
- TIMER delivery events
- User interaction tracking
- System performance metrics
- Error and exception logs
- Admin actions and decisions

## 6.5 Operations Dashboard

- **Feature Description**: Daily operational view for managing discoveries, anomalies, and required actions
- **User Experience**: Operations team efficiently manages platform expansion and health
- **Admin View**:
  - Today's discoveries summary
  - Action queue with priorities
  - Anomaly alerts and resolutions
  - Entity approval interface
  - Bulk operations support
- **Dependencies**: Admin authentication, notification system
- **Data Structure**: See TRD Section 10.5

# 7. Administration System

## Overview
Simple, unified dashboard for platform administrators to maintain system accuracy and manage community contributions.

## 7.1 Admin Dashboard Components

### System Health Monitoring
- **[REQ-120]** Real-time classification accuracy (target: 95%+)
- **[REQ-121]** API performance and costs
- **[REQ-122]** User activity metrics
- **[REQ-123]** Error rates and alerts

### AI Review Queue
- **Low confidence classifications** (<70% confidence)
- **Source unclear** (can't identify sender authority)
- **Content ambiguous** (multiple possible categories)
- **Daily volume**: 5-10 items requiring review

### Community Contributions
- **New schools** submitted by parents (draft → review → approve)
- **New apps** submitted by parents (draft → review → approve)
- **Approval workflow**: Direct link to record → edit if needed → commit

### User Support
- Password resets
- Account verification assistance
- Family configuration help
- Data export requests

## 7.2 School & App Database Management

### School Database
- **[REQ-124]** 1000+ schools (starting with UAE/UK)
- **[REQ-125]** Parent can submit missing schools
- **[REQ-126]** Admin reviews and approves submissions
- **[REQ-127]** Required fields: Name, location, email domains, logo

### Educational Apps Database
- **[REQ-128]** 50+ apps (Toddle, SchoolsBuddy, Seesaw, etc.)
- **[REQ-129]** Parent can submit missing apps
- **[REQ-130]** Admin reviews and approves submissions
- **[REQ-131]** Required fields: Name, website, email domains, logo

## 7.3 Operational Workflows

### Daily Admin Tasks (30 mins/day)
1. Review overnight AI classifications
2. Process community submissions
3. Check system health metrics
4. Handle user support tickets

### Weekly Admin Tasks (2 hours/week)
1. Analyze classification patterns
2. Update school/app databases
3. Review user feedback
4. Plan system improvements

**Data Structure:** See TRD Section 7 - Administration Systems

## 7.4 System Organisation and UX

### Main Navigation Structure
The admin platform follows a logical information hierarchy optimized for CLARA's unified service architecture:

```
📊 DASHBOARD (Overview)
├── 🎯 CLARA Performance
├── 👥 Family Management  
├── 🏫 Content Management
├── 🔧 System Configuration
├── 📈 Analytics & Reports
└── 🚨 Alerts & Support
```

### Dashboard Overview Screen
**Purpose**: Single-pane view of system health and key metrics

**Key Components**:
- **Hero Metrics**: 4-card layout showing daily emails, CLARA uptime, accuracy percentage, daily cost
- **CLARA Pipeline Status**: Real-time monitoring of the unified CLARA service with queue depths, processing times, and success rates
- **Review Queue Summary**: Count of items needing attention with quick access links

**User Experience**: Admin lands here, gets immediate system health snapshot, can drill into any concern area

### CLARA Performance Screen
**Purpose**: Detailed monitoring of the unified CLARA service with 9 processing stages

**Key Components**:
- **Stage Performance Dashboard**: Individual cards for each processing stage showing throughput, accuracy, costs, and alerts
- **8-Stage Pipeline Flow**: Visual representation of email flow through stages with bottleneck identification
- **Historical Trends**: Charts showing performance over time

**User Experience**: Technical team can diagnose performance issues, identify bottlenecks, and optimize agent configurations

### Family Management Screen
**Purpose**: User administration and family account oversight

**Key Components**:
- **Family Statistics Overview**: Total families, activity rates, demographic breakdowns
- **Search & Filter Interface**: Find families by various criteria with export capabilities
- **Family Drill-down**: Individual family profiles showing processing history, costs, and configuration

**User Experience**: Support team can quickly locate and assist families, track engagement, and manage accounts

### Content Management Screen
**Purpose**: Maintain school and educational app databases

**Key Components**:
- **Schools Database**: Searchable table of all schools with family counts and status
- **Educational Apps Database**: Searchable table of integrated apps with usage statistics
- **Pending Approvals Queue**: Community-submitted schools/apps awaiting review

**User Experience**: Content team can approve new submissions, update existing records, and track database completeness

### System Configuration Screen
**Purpose**: Fine-tune CLARA agent settings and global platform configuration

**Key Components**:
- **CLARA Agent Settings**: Individual configuration panels for each agent with performance thresholds
- **Global System Settings**: Platform-wide configurations including cost limits, maintenance windows
- **Rule Engine**: Interface for adjusting classification rules and delivery optimization

**User Experience**: Technical admins can optimize system performance, set operational boundaries, and customize behavior

### Analytics & Reports Screen
**Purpose**: Business intelligence and performance insights

**Key Components**:
- **Executive Dashboard**: High-level business metrics with trend analysis
- **CLARA Performance Metrics**: Detailed technical performance against targets
- **Downloadable Reports**: Pre-built reports for various stakeholders

**User Experience**: Management can track business performance, identify trends, and generate reports for stakeholders

### Alerts & Support Screen
**Purpose**: Issue management and customer support

**Key Components**:
- **Active Alerts Dashboard**: Real-time system alerts with severity levels
- **Support Ticket Queue**: Customer support requests with priority and status tracking
- **Resolution Metrics**: Support team performance tracking

**User Experience**: Support team can efficiently manage alerts, prioritize tickets, and track resolution performance

### Design Principles

**Information Hierarchy**: Most critical information (system health) at the top level, detailed diagnostics in drill-down screens

**Progressive Disclosure**: Overview → Details → Actions, allowing admins to quickly assess and then act

**Role-Based Access**: Different user roles see appropriate information:
- Super Admin: Full access to all screens
- Technical Admin: Focus on CLARA Performance and System Configuration
- Support Admin: Focus on Family Management and Alerts & Support
- Content Admin: Focus on Content Management and community submissions

**Responsive Design**: Dashboard optimized for desktop use but essential functions accessible on tablet

**Real-time Updates**: Critical metrics update automatically without page refresh, with visual indicators for status changes

**Quick Actions**: Common tasks accessible with single clicks from overview screens

## 7.5 Queue Management Interface

- **Feature Description**: Direct access to TIMER Agent's BullMQ queue infrastructure for monitoring and managing message delivery operations
- **User Experience**: Technical administrators can view queue states, manage retries, inspect failed messages, and monitor throughput across all delivery channels
- **Admin View**:
  - Queue dashboard showing counts for: Immediate, Scheduled, Retry, Dead Letter
  - Individual message inspection with full context and history
  - Manual retry/cancel controls for stuck messages
  - Real-time throughput metrics per channel (WhatsApp, SMS, Native)
  - Queue health indicators and alert configuration
  - Bulk operations for queue management
- **Dependencies**: Redis, BullMQ, TIMER Agent infrastructure
- **Data Structure**: See TRD Section 9.5

## 7.6 TIMER Analytics Dashboard

- **Feature Description**: Comprehensive analytics for TIMER Agent performance and message delivery effectiveness
- **User Experience**: Administrators gain insights into message delivery success rates, user engagement patterns, and system performance through detailed analytics
- **Admin View**:
  - Delivery success rates by channel and message type
  - Average delivery times and latency metrics
  - User engagement metrics (opens, clicks, completions)
  - Retry patterns and failure analysis
  - Channel preference distribution
  - Peak usage times and capacity planning data
  - Family coordination effectiveness metrics
  - Cost analysis per channel (WhatsApp vs SMS)
- **Dependencies**: TIMER Agent, analytics infrastructure
- **Data Structure**: See TRD Section 9.6

## 7.7 AI Provider Configuration

- **Feature Description**: Multi-provider AI configuration system allowing administrators to select and configure different LLM providers for email classification and processing
- **User Experience**: Platform administrators can switch between AI providers, configure fallback options, and monitor provider performance
- **Admin View**:
  - Provider selection dropdown (Claude, OpenAI, Grok)
  - Model configuration per provider
  - API key management (encrypted storage)
  - Fallback provider configuration
  - Cost monitoring and limits
  - Performance metrics by provider
  - Manual provider switching
  - Error handling configuration
- **Dependencies**: LLM provider APIs, secure key storage
- **Data Structure**: See TRD Section 9.7

### Supported AI Providers

**Claude (Anthropic):**
- Models: claude-3.5-sonnet, claude-3-opus
- Best for: Complex reasoning, nuanced understanding
- Cost: Premium tier

**OpenAI:**
- Models: gpt-4-turbo, gpt-4o
- Best for: Structured data extraction, multilingual content
- Cost: Premium tier

**Grok (xAI):**
- Models: grok-2, grok-2-mini
- Best for: Cost-effective bulk processing
- Cost: Budget tier

### Provider Management

**Configuration Options:**
- **Primary Provider**: Active provider for all classifications
- **Fallback Provider**: Automatic switch on primary failure
- **Timeout Settings**: Max wait time before fallback (default: 5s)
- **Cost Limits**: Daily spending caps per provider
- **Manual Override**: Force specific provider for testing

**Monitoring & Analytics:**
- Real-time provider status
- Classification accuracy by provider
- Cost tracking and projections
- Response time analysis
- Error rate monitoring

---

# 8. AI Intelligence Framework

## Overview
The AI brain that transforms school emails into family actions with 95%+ accuracy using configurable AI providers (Claude, OpenAI, or Grok) as the classification engine.

## 8.1 AI Model Configuration

### Multi-Provider Architecture
The system supports multiple AI providers with admin-configurable selection and automatic fallback.

### Provider Configurations

**Claude (Anthropic):**
```json
{
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022",
  "temperature": 0.2,
  "max_tokens": 2000,
  "system_prompt": "You are School'cierge AI, expert at understanding school communications...",
  "timeout": 5000
}
```

**OpenAI:**
```json
{
  "provider": "openai",
  "model": "gpt-4-turbo-preview",
  "temperature": 0.2,
  "max_tokens": 2000,
  "system_prompt": "You are School'cierge AI, expert at understanding school communications...",
  "timeout": 5000
}
```

**Grok (xAI):**
```json
{
  "provider": "xai",
  "model": "grok-2",
  "temperature": 0.2,
  "max_tokens": 2000,
  "system_prompt": "You are School'cierge AI, expert at understanding school communications...",
  "timeout": 5000
}
```

### Provider Selection Strategy
- **Primary Provider**: Admin-selected via dashboard
- **Fallback Provider**: Admin-configured backup option
- **Immediate Fallback**: On timeout or error
- **Manual Override**: For testing and optimization

## 8.2 Processing Pipeline

### Email Flow with Technical Detail
1. **Receive** → Mailgun webhook to `/api/webhooks/email`
2. **Parse** → BeautifulSoup for HTML, regex for metadata
3. **Classify** → Claude API with structured prompt
4. **Generate** → Template engine with dynamic content
5. **Route** → Rule engine with family preferences
6. **Monitor** → Prometheus metrics + Sentry errors

### Performance Requirements
- Processing latency: <5 seconds (p99)
- Classification accuracy: 95%+ monthly average
- Confidence threshold: 70% (manual review trigger)
- System availability: 99.9% uptime SLA

## 8.3 Classification System

### Structured Classification Prompt
```
You are analyzing a school email. Extract and classify:

1. SENDER AUTHORITY:
   - principal/head (1.8x weight)
   - government/regulatory (1.5x weight)
   - admin/finance (1.3x weight)
   - teacher (1.0x weight)
   - parent_rep (0.8x weight)
   - automated/app (0.5x weight)

2. CONTENT CATEGORY (select one):
   - permission_request (forms requiring signature)
   - payment_due (fees, trips, supplies)
   - event_announcement (dates, times, locations)
   - urgent_notice (immediate action required)
   - academic_update (grades, progress, homework)
   - schedule_change (timetable, calendar updates)
   - general_info (newsletters, updates)
   - health_safety (medical, COVID, emergencies)
   - volunteer_request (help needed)
   - lost_found (missing items)
   - administrative (policy, procedures)

3. ENTITIES TO EXTRACT:
   - child_names[] (match against: {family.children})
   - dates{} (event_date, deadline, created)
   - amounts{} (value, currency, payment_method)
   - locations[] (venues, addresses)
   - required_actions[] (verbs: sign, pay, complete, attend)
   - urls[] (forms, payments, information)

4. PRIORITY SCORING:
   Calculate: (Base × Authority) + Deadline + Keywords
   Return: score (0-100), band (critical/high/medium/low)

5. CONFIDENCE ASSESSMENT:
   Your confidence in this classification (0-100)
   Explain any ambiguity or uncertainty
```

### Classification Logic
- **Multi-label support**: Email can have primary + secondary categories
- **Context awareness**: Previous emails in thread influence classification
- **School-specific rules**: Custom patterns per school (stored in DB)
- **Continuous learning**: Admin corrections improve future accuracy

### Accuracy Targets by Category
```
Permission slips: 97% (critical for compliance)
Payment requests: 95% (financial accuracy essential)
Urgent notices: 98% (safety paramount)
Events: 94% (coordination important)
Academic updates: 93% (parent engagement)
General info: 92% (lower stakes)

Overall target: 95%+ weighted average
Monthly improvement: 0.5% through learning
```

## 8.4 [INTEGRATED INTO ADAPT - Section 6.2]

*The Quality Assurance System has been fully integrated into the ADAPT Agent (Section 6.2: Quality Assurance & Monitoring System) as it naturally aligns with ADAPT's continuous learning and monitoring capabilities. Quality assurance is now part of ADAPT's comprehensive monitoring and improvement framework.*

**Key Integration Points:**
- **Automated Quality Gates**: Now part of ADAPT's real-time monitoring
- **Manual Review Queue**: Feeds directly into ADAPT's learning pipeline
- **Anomaly Detection**: Integrated with ADAPT's pattern discovery
- **Performance Monitoring**: Enhanced with ADAPT-specific metrics
- **Feedback Loop**: Powers ADAPT's continuous improvement

**See Section 6.2: Quality Assurance & Monitoring System for complete details**

**Daily Analytics**:
- Classification accuracy by category
- Average confidence scores
- Manual review outcomes
- Cost per classification
- API latency trends

**Data Structure:** See TRD Section 8 - AI System Architecture

---


# 9. External Integration Layer

**Feature Description**

The External Integration Layer manages all third-party service connections that power School'cierge's core functionality. This layer handles email ingestion, message delivery, AI processing, and future extensibility while maintaining reliability and security.

**User Experience**

From the family's perspective, integrations are invisible - they just see magic happening. Emails forwarded to their unique address instantly appear as WhatsApp messages. Behind the scenes, multiple services work in concert to deliver this seamless experience.

**Admin View**

Administrators monitor integration health, manage API keys, handle failures, and optimize costs through a unified integration dashboard showing real-time status and performance metrics.

## 9.1 Mailgun Integration (Email Ingestion)

**[REQ-132] Purpose**: Receive and process all forwarded school emails

**Integration Architecture:**
```
School Email → Parent Forwards → Mailgun → Webhook → School'cierge
                                    ↓
                            Unique Family Address
                            (chen-a47x@fwd.schoolcierge.com)
```

**Mailgun Configuration:**
```python
# Route Configuration
route = {
    "description": "School'cierge family email routing",
    "expression": "match_recipient('.*@fwd.schoolcierge.com')",
    "actions": [
        "forward('https://api.schoolcierge.app/webhooks/email')",
        "store(notify='https://api.schoolcierge.app/webhooks/stored')"
    ],
    "priority": 1
}

# Webhook Security
webhook_config = {
    "signing_key": "MAILGUN_WEBHOOK_SIGNING_KEY",
    "allowed_ips": ["209.61.151.0/24", "209.61.154.0/23"],
    "timestamp_tolerance": 300  # 5 minutes
}
```

**Webhook Processing:**
```javascript
// POST /api/webhooks/email
async function handleMailgunWebhook(req, res) {
    // 1. Verify webhook signature
    const timestamp = req.body.timestamp;
    const token = req.body.token;
    const signature = req.body.signature;
    
    if (!verifyWebhookSignature(timestamp, token, signature)) {
        return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // 2. Extract family from recipient
    const recipient = req.body.recipient;  // chen-a47x@fwd.schoolcierge.com
    const familyId = extractFamilyId(recipient);  // chen-a47x
    
    // 3. Parse email content
    const email = {
        from: req.body.sender,
        subject: req.body.subject,
        text: req.body['body-plain'],
        html: req.body['body-html'],
        attachments: req.body.attachments || [],
        headers: req.body['message-headers'],
        familyId: familyId
    };
    
    // 4. Queue for CLARA processing
    await emailQueue.add('process-email', email);
    
    res.status(200).send('OK');
}
```

**Attachment Handling:**
```javascript
// Mailgun stores attachments separately
async function retrieveAttachments(attachmentData) {
    const attachments = [];
    
    for (const attachment of attachmentData) {
        const file = await mailgun.get(attachment.url, {
            username: 'api',
            password: MAILGUN_API_KEY
        });
        
        attachments.push({
            filename: attachment.name,
            content: file.buffer,
            contentType: attachment['content-type'],
            size: attachment.size
        });
    }
    
    return attachments;
}
```

**Error Handling & Retries:**
- **[REQ-133]** Webhook timeout: 30 seconds
- **[REQ-134]** Auto-retry failed webhooks: 3 attempts over 8 hours
- **[REQ-135]** Dead letter queue for persistent failures
- **[REQ-136]** Email backup storage: 30 days in Mailgun

**Cost Optimization:**
- **[REQ-137]** Route only to verified family addresses
- **[REQ-138]** Reject spam at SMTP level
- **[REQ-139]** Efficient attachment retrieval
- **[REQ-140]** Clean up stored messages after processing

## 9.2 WhatsApp Business Integration (via 2Chat.io)

**[REQ-141] Purpose**: Deliver processed messages to families via WhatsApp

**Why 2Chat.io:**
- Simplified WhatsApp Business API access
- No Facebook Business verification required
- Built-in message templates
- Reliable delivery infrastructure
- Cost-effective for startup phase

**Integration Architecture:**
```
CLARA → TIMER Agent → 2Chat.io API → WhatsApp Business → Family Phone
            ↓
    Queue Management
    Retry Orchestration
    Session Management
    Template Compliance
    Media Handling
```

**2Chat.io Configuration:**
```javascript
const TwoChatConfig = {
    apiUrl: 'https://api.p.2chat.io/open/whatsapp',
    apiKey: process.env.TWOCHAT_API_KEY,
    phoneNumberId: process.env.TWOCHAT_PHONE_ID,
    
    // Message templates for different scenarios
    templates: {
        permission_request: {
            name: 'school_permission',
            language: 'en',
            components: [{
                type: 'body',
                parameters: [
                    {type: 'text', text: '{{child_name}}'},
                    {type: 'text', text: '{{event_name}}'},
                    {type: 'text', text: '{{deadline}}'}
                ]
            }]
        },
        payment_reminder: {
            name: 'payment_due',
            language: 'en',
            components: [{
                type: 'body',
                parameters: [
                    {type: 'text', text: '{{amount}}'},
                    {type: 'text', text: '{{item}}'},
                    {type: 'text', text: '{{due_date}}'}
                ]
            }]
        }
    }
};
```

**Message Sending Implementation:**
```javascript
async function sendWhatsAppMessage(recipient, message, buttons) {
    try {
        // 1. Check session status
        const session = await checkWhatsAppSession(recipient.phone);
        
        // 2. Determine message type
        const messageType = session.active ? 'regular' : 'template';
        
        // 3. Format message
        const payload = {
            to: recipient.phone,
            type: messageType,
            ...(messageType === 'regular' ? {
                // Regular message with buttons
                body: {
                    text: message.text
                },
                ...(buttons && {
                    footer: { text: 'School\'cierge' },
                    action: {
                        buttons: buttons.map(btn => ({
                            type: 'reply',
                            reply: {
                                id: btn.id,
                                title: btn.text
                            }
                        }))
                    }
                })
            } : {
                // Template message for new conversations
                template: {
                    name: message.templateName,
                    language: { code: 'en' },
                    components: message.templateParams
                }
            })
        };
        
        // 4. Send via 2Chat.io
        const response = await axios.post(
            `${TwoChatConfig.apiUrl}/messages`,
            payload,
            {
                headers: {
                    'X-User-API-Key': TwoChatConfig.apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        // 5. Track delivery
        await trackMessageDelivery({
            messageId: response.data.messages[0].id,
            recipient: recipient.userId,
            channel: 'whatsapp',
            status: 'sent'
        });
        
        return response.data;
        
    } catch (error) {
        // Fallback to SMS
        if (error.response?.status === 470) { // No WhatsApp account
            return await sendSMSFallback(recipient, message);
        }
        throw error;
    }
}
```

**Interactive Response Handling:**
```javascript
// POST /api/webhooks/whatsapp
async function handleWhatsAppWebhook(req, res) {
    const { messages, statuses } = req.body;
    
    // Handle incoming messages
    if (messages) {
        for (const msg of messages) {
            if (msg.type === 'button') {
                // Handle button responses
                await handleButtonResponse({
                    from: msg.from,
                    buttonId: msg.button.payload,
                    messageId: msg.context.id
                });
            } else if (msg.type === 'text') {
                // Handle text responses
                await handleTextResponse({
                    from: msg.from,
                    text: msg.text.body
                });
            }
        }
    }
    
    // Handle delivery status updates
    if (statuses) {
        for (const status of statuses) {
            await updateMessageStatus({
                messageId: status.id,
                status: status.status,
                timestamp: status.timestamp
            });
        }
    }
    
    res.status(200).send('OK');
}
```

**Session Management:**
```javascript
// WhatsApp requires template messages for new conversations
class WhatsAppSessionManager {
    constructor() {
        this.sessions = new Map(); // In production: Redis
    }
    
    async checkSession(phoneNumber) {
        const session = this.sessions.get(phoneNumber);
        
        if (!session) {
            return { active: false };
        }
        
        // Sessions expire after 24 hours of inactivity
        const hoursSinceLastMessage = 
            (Date.now() - session.lastMessageTime) / (1000 * 60 * 60);
            
        if (hoursSinceLastMessage > 24) {
            this.sessions.delete(phoneNumber);
            return { active: false };
        }
        
        return { 
            active: true,
            sessionId: session.id
        };
    }
    
    async updateSession(phoneNumber, messageId) {
        this.sessions.set(phoneNumber, {
            id: messageId,
            lastMessageTime: Date.now()
        });
    }
}
```

**Media Handling:**
```javascript
async function sendMediaMessage(recipient, media) {
    // Upload media to 2Chat.io
    const uploadResponse = await axios.post(
        `${TwoChatConfig.apiUrl}/media`,
        media.buffer,
        {
            headers: {
                'X-User-API-Key': TwoChatConfig.apiKey,
                'Content-Type': media.mimeType
            }
        }
    );
    
    // Send media message
    const message = {
        to: recipient.phone,
        type: media.type, // image, document, audio
        [media.type]: {
            id: uploadResponse.data.media[0].id,
            caption: media.caption
        }
    };
    
    return await sendWhatsAppMessage(recipient, message);
}
```

**Cost Management:**
- Template messages: $0.005 per message
- Session messages: $0.003 per message
- Media messages: $0.005 per message
- Optimize message delivery timing
- Use templates strategically

## 9.3 SMS Fallback Integration (Twilio)

**Purpose**: Ensure critical messages reach families when WhatsApp unavailable

**TIMER Orchestration**: TIMER Agent manages SMS fallback through its retry queues and channel selection logic

**Integration Configuration:**
```javascript
const twilioClient = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const SMSConfig = {
    fromNumber: process.env.TWILIO_PHONE_NUMBER,
    maxLength: 160,
    criticalOnly: true, // MVP: Only critical messages
    
    triggers: {
        whatsappFailure: true,
        noWhatsApp: true,
        userPreference: true,
        criticalPriority: true
    }
};
```

**SMS Sending Logic:**
```javascript
async function sendSMSFallback(recipient, message, reason) {
    // 1. Check if SMS warranted
    if (!shouldSendSMS(message.priority, reason)) {
        return null;
    }
    
    // 2. Compress message for SMS
    const smsText = compressForSMS(message);
    
    // 3. Send via Twilio
    try {
        const sms = await twilioClient.messages.create({
            body: smsText,
            to: recipient.phone,
            from: SMSConfig.fromNumber,
            statusCallback: 'https://api.schoolcierge.app/webhooks/sms-status'
        });
        
        // 4. Track delivery
        await trackSMSDelivery({
            messageId: sms.sid,
            recipient: recipient.userId,
            reason: reason,
            cost: sms.price
        });
        
        return sms;
        
    } catch (error) {
        await logSMSFailure(error, recipient);
        throw error;
    }
}

function compressForSMS(message) {
    // Extreme compression for 160 char limit
    const parts = [
        message.priority > 80 ? '🚨' : '📌',
        message.actionVerb,
        '-',
        message.childName,
        message.deadline ? `Due ${message.deadline}` : '',
        'Reply STOP to opt out'
    ];
    
    return parts.filter(Boolean).join(' ').substring(0, 160);
}
```

## 9.4 AI Integration (Multi-Provider Support)

**Purpose**: Power CLARA's intelligent classification and message generation via configurable AI providers

**Integration Configuration:**
```javascript
// Configuration based on admin-selected provider
const AIConfig = {
    apiKey: process.env[`${provider.toUpperCase()}_API_KEY`],
    model: getModelForProvider(provider), // Admin-configured model
    maxTokens: 4096,
    temperature: 0.3, // Lower for consistency
    
    systemPrompt: `You are CLARA, School'cierge's AI assistant.
    Your job is to classify school emails and generate WhatsApp messages.
    Be concise, accurate, and parent-friendly.
    Always extract: dates, amounts, deadlines, required actions.
    Output valid JSON matching the specified schema.`
};
```

**Classification Implementation:**
```javascript
async function classifyEmail(email, familyContext) {
    const prompt = buildClassificationPrompt(email, familyContext);
    
    try {
        const response = await anthropic.messages.create({
            model: AnthropicConfig.model,
            max_tokens: AnthropicConfig.maxTokens,
            temperature: AnthropicConfig.temperature,
            system: AnthropicConfig.systemPrompt,
            messages: [{
                role: 'user',
                content: prompt
            }]
        });
        
        // Parse and validate response
        const classification = JSON.parse(response.content[0].text);
        
        // Validate against schema
        if (!validateClassification(classification)) {
            throw new Error('Invalid classification format');
        }
        
        return {
            ...classification,
            confidence: classification.confidence || 0.95,
            processingTime: response.usage.total_time
        };
        
    } catch (error) {
        // Fallback to rule-based classification
        return await fallbackClassification(email);
    }
}

function buildClassificationPrompt(email, context) {
    return `
    Classify this school email and extract key information:
    
    From: ${email.from}
    Subject: ${email.subject}
    Body: ${email.text}
    
    Family Context:
    - Children: ${context.children.map(c => c.name).join(', ')}
    - Schools: ${context.schools.map(s => s.name).join(', ')}
    - Preferences: ${JSON.stringify(context.preferences)}
    
    Return JSON with:
    {
        "category": "permission_request|payment_due|event_announcement|...",
        "confidence": 0.0-1.0,
        "priority": 0-100,
        "entities": {
            "dates": [],
            "amounts": [],
            "locations": [],
            "deadlines": [],
            "children": []
        },
        "requiredActions": [],
        "suggestedMessage": "WhatsApp message text",
        "suggestedButtons": []
    }`;
}
```

**Cost Optimization:**
```javascript
class AIUsageOptimizer {
    constructor() {
        this.cache = new LRUCache({ max: 10000 });
        this.costTracker = new CostTracker();
    }
    
    async classifyWithCache(email) {
        // 1. Generate cache key
        const cacheKey = this.generateCacheKey(email);
        
        // 2. Check cache
        const cached = this.cache.get(cacheKey);
        if (cached && cached.confidence > 0.9) {
            return { ...cached, fromCache: true };
        }
        
        // 3. Check for similar emails
        const similar = await this.findSimilarClassification(email);
        if (similar && similar.similarity > 0.95) {
            return { ...similar.classification, fromSimilar: true };
        }
        
        // 4. Make API call
        const classification = await classifyEmail(email);
        
        // 5. Track cost
        this.costTracker.track({
            tokens: classification.usage.total_tokens,
            cost: classification.usage.total_tokens * 0.00003 // $3/1M tokens
        });
        
        // 6. Cache if high confidence
        if (classification.confidence > 0.9) {
            this.cache.set(cacheKey, classification);
        }
        
        return classification;
    }
}
```

## 9.5 Push Notification Integration (FCM & APNs)

**Purpose**: Deliver OS-native push notifications to complement WhatsApp messages

**Integration Architecture:**
```
CLARA Output → Notification Service → FCM/APNs → Device
                        ↓
                Platform Router
                Token Management
                Rich Content Formatting
```

**Firebase Cloud Messaging (Android) & Apple Push Notification Service (iOS):**
```javascript
const PushNotificationService = {
    // Initialize services
    fcm: admin.initializeApp({
        credential: admin.credential.cert(process.env.FCM_SERVICE_ACCOUNT)
    }),
    
    // Send unified notification
    async sendPushNotification(userId, notification) {
        const tokens = await getUserDeviceTokens(userId);
        
        const message = {
            notification: {
                title: notification.title,
                body: notification.body,
                badge: notification.pendingCount
            },
            data: {
                type: notification.type,
                taskId: notification.taskId,
                childId: notification.childId,
                deepLink: notification.deepLink
            },
            // iOS specific
            apns: {
                payload: {
                    aps: {
                        'mutable-content': 1,
                        sound: 'schoolcierge.caf',
                        category: notification.actionCategory
                    }
                },
                headers: {
                    'apns-priority': notification.priority === 'CRITICAL' ? '10' : '5'
                }
            },
            // Android specific
            android: {
                priority: notification.priority === 'CRITICAL' ? 'high' : 'normal',
                notification: {
                    channelId: 'school_notifications',
                    actions: notification.actions?.map(action => ({
                        title: action.title,
                        pressAction: { id: action.id }
                    }))
                }
            }
        };
        
        // Send to all user devices
        const results = await Promise.allSettled(
            tokens.map(token => 
                token.platform === 'ios' 
                    ? admin.messaging().send({ ...message, token: token.value })
                    : admin.messaging().send({ ...message, token: token.value })
            )
        );
        
        // Handle failures and token cleanup
        await cleanupFailedTokens(results, tokens);
        
        return results;
    }
};
```

**Rich Notification Features:**
```javascript
// iOS Notification Service Extension
const iOSRichNotification = {
    // Attachment support
    attachments: [{
        identifier: 'school-logo',
        url: 'https://cdn.schoolcierge.com/schools/logo.png'
    }],
    
    // Action buttons
    categoryActions: {
        'PERMISSION_REQUEST': [
            { id: 'COMPLETE', title: 'Mark Complete', foreground: true },
            { id: 'SNOOZE', title: 'Remind Later', destructive: false },
            { id: 'VIEW', title: 'View Details', foreground: true }
        ]
    }
};

// Android Notification Channels
const androidChannels = {
    'urgent': {
        id: 'urgent_school',
        name: 'Urgent School Notifications',
        importance: 5, // MAX
        sound: 'urgent_notification.mp3',
        vibration: [0, 250, 250, 250]
    },
    'reminders': {
        id: 'school_reminders',
        name: 'School Reminders',
        importance: 4, // HIGH
        sound: 'reminder.mp3'
    },
    'info': {
        id: 'school_info',
        name: 'School Information',
        importance: 3, // DEFAULT
        sound: 'default'
    }
};
```

**Token Management:**
```javascript
// Device registration and token refresh
async function registerDevice(userId, deviceInfo) {
    const { token, platform, deviceId } = deviceInfo;
    
    await db.deviceTokens.upsert({
        where: { userId_deviceId: { userId, deviceId } },
        update: { 
            token, 
            platform,
            updatedAt: new Date(),
            active: true
        },
        create: {
            userId,
            deviceId,
            token,
            platform,
            appVersion: deviceInfo.appVersion,
            osVersion: deviceInfo.osVersion
        }
    });
}
```

## 9.6 Future Integration Preparations

**Integration Framework:**
```javascript
// Base integration class for future services
class ExternalIntegration {
    constructor(name, config) {
        this.name = name;
        this.config = config;
        this.healthCheck = null;
        this.metrics = new IntegrationMetrics(name);
    }
    
    async connect() {
        // Standard connection logic
    }
    
    async disconnect() {
        // Cleanup logic
    }
    
    async executeWithRetry(operation, maxRetries = 3) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                const result = await operation();
                this.metrics.recordSuccess();
                return result;
            } catch (error) {
                lastError = error;
                this.metrics.recordError(error);
                
                if (!this.isRetryable(error)) {
                    throw error;
                }
                
                await this.backoff(i);
            }
        }
        
        throw lastError;
    }
    
    async healthCheck() {
        // Standard health check
    }
}
```

**Prepared Integrations (Post-MVP):**
```javascript
// Google Calendar
class GoogleCalendarIntegration extends ExternalIntegration {
    async createEvent(eventData) {
        // Implementation ready for Phase 2
    }
}

// SchoolsBuddy
class SchoolsBuddyIntegration extends ExternalIntegration {
    async syncEvents(schoolId) {
        // Implementation ready when API available
    }
}

// Payment Gateways
class StripeIntegration extends ExternalIntegration {
    async createPaymentIntent(amount, metadata) {
        // Implementation ready for payment phase
    }
}
```

## 9.7 Integration Monitoring & Management

**Unified Integration Dashboard:**
```
Integration Health Overview:
┌─────────────────────────────────────────────────────┐
│ Service         Status    Latency   Success   Cost  │
├─────────────────────────────────────────────────────┤
│ Mailgun         🟢 OK     124ms     99.8%     $0.02 │
│ 2Chat.io        🟢 OK     856ms     98.9%     $0.15 │
│ Twilio SMS      🟢 OK     445ms     99.9%     $0.08 │
│ Claude AI       🟡 SLOW   2.1s      97.2%     $0.89 │
│ Redis Cache     🟢 OK     12ms      100%      $0.00 │
├─────────────────────────────────────────────────────┤
│ Total API Costs Today: $47.82 (15,234 operations)  │
└─────────────────────────────────────────────────────┘

Recent Failures:
- WhatsApp: Session timeout for +971501234567 (2m ago)
- Claude: Rate limit warning - 450/500 requests (5m ago)
- Mailgun: Webhook timeout - retrying (8m ago)

[View Details] [Cost Analysis] [Configure Alerts]
```

**Error Handling Strategy:**
```javascript
class IntegrationErrorHandler {
    async handle(error, integration, context) {
        // 1. Categorize error
        const errorType = this.categorizeError(error);
        
        // 2. Determine action
        switch (errorType) {
            case 'RATE_LIMIT':
                await this.handleRateLimit(integration, context);
                break;
                
            case 'AUTH_FAILURE':
                await this.handleAuthFailure(integration);
                break;
                
            case 'TIMEOUT':
                await this.scheduleRetry(integration, context);
                break;
                
            case 'SERVICE_DOWN':
                await this.activateFallback(integration, context);
                break;
                
            default:
                await this.logAndAlert(error, integration, context);
        }
    }
}
```

**Dependencies**

All major service integrations: Mailgun for email, 2Chat.io for WhatsApp, Twilio for SMS, Anthropic for AI.

**Data Structure**

See TRD Section 7 - External Services Architecture

## 9.8 Integration Administration Interface

**Feature Description**

The Integration Administration Interface provides comprehensive tools for configuring, monitoring, and managing all external service integrations. This interface is accessible through the main Administration System and provides both real-time monitoring and configuration capabilities.

**Admin Experience**

Administrators access a dedicated Integration Management section within the admin panel, providing centralized control over all external services, API configurations, cost monitoring, and health checks.

**Integration Configuration Center:**
```
External Service Configuration:
┌─────────────────────────────────────────────────────────────┐
│ Service: Mailgun                          Status: Active ✓  │
├─────────────────────────────────────────────────────────────┤
│ API Configuration:                                          │
│ ├─ API Key: ****************************3f2a [Edit]        │
│ ├─ Domain: fwd.schoolcierge.com           [Verify DNS]     │
│ ├─ Webhook URL: Configured ✓              [Test]           │
│ └─ Region: US                             [Change]         │
├─────────────────────────────────────────────────────────────┤
│ Route Configuration:                                        │
│ ├─ Active Routes: 1,247                                     │
│ ├─ Route Pattern: .*@fwd.schoolcierge.com                 │
│ └─ Actions: Forward & Store               [Edit Rules]     │
├─────────────────────────────────────────────────────────────┤
│ Cost & Usage:                                               │
│ ├─ Monthly Cost: $127.45 / $150 budget                     │
│ ├─ Emails Today: 15,234                                     │
│ └─ Storage Used: 2.3 GB / 10 GB           [View Details]   │
└─────────────────────────────────────────────────────────────┘

[Configure Webhooks] [View Logs] [Download Report] [Set Alerts]
```

**WhatsApp/2Chat.io Management:**
```
WhatsApp Business Configuration:
┌─────────────────────────────────────────────────────────────┐
│ Service: 2Chat.io                         Status: Active ✓  │
├─────────────────────────────────────────────────────────────┤
│ Account Details:                                            │
│ ├─ Phone Number: +971 50 123 4567         [Change]         │
│ ├─ Display Name: School'cierge            [Edit]           │
│ ├─ Business Profile: Verified ✓           [View]           │
│ └─ Session Status: Active (23h remaining) [Refresh]        │
├─────────────────────────────────────────────────────────────┤
│ Message Templates:                         [Add Template]    │
│ ├─ school_permission (EN) - Approved ✓                      │
│ ├─ payment_reminder (EN) - Approved ✓                       │
│ ├─ event_notification (EN) - Pending Review                 │
│ └─ general_update (EN) - Draft            [Submit]         │
├─────────────────────────────────────────────────────────────┤
│ Messaging Stats (Today):                                    │
│ ├─ Messages Sent: 3,847 (98.2% delivered)                  │
│ ├─ Template Messages: 847                                   │
│ ├─ Session Messages: 3,000                                  │
│ └─ Failed Deliveries: 71                  [View Failures]   │
└─────────────────────────────────────────────────────────────┘

[Template Manager] [Session Monitor] [Cost Analysis] [QR Code]
```

**API Key Management:**
```
API Credentials Vault:
┌─────────────────────────────────────────────────────────────┐
│ Service          Key Status    Last Used    Actions          │
├─────────────────────────────────────────────────────────────┤
│ Mailgun          Active ✓      2 min ago    [Rotate] [Test] │
│ 2Chat.io         Active ✓      1 min ago    [Rotate] [Test] │
│ Twilio           Active ✓      15 min ago   [Rotate] [Test] │
│ Anthropic        Active ✓      3 min ago    [Rotate] [Test] │
│ Redis            Active ✓      Just now     [Rotate] [Test] │
├─────────────────────────────────────────────────────────────┤
│ Security Status: All keys encrypted with AES-256           │
│ Last Security Audit: 2 days ago              [Run Audit]    │
│ Key Rotation Policy: 90 days                 [Configure]    │
└─────────────────────────────────────────────────────────────┘

[Add Service] [Backup Keys] [Security Settings] [Audit Log]
```

**Cost Management Dashboard:**
```
Integration Cost Analysis:
┌─────────────────────────────────────────────────────────────┐
│ Daily Cost Breakdown (Today)              Budget: $150/day  │
├─────────────────────────────────────────────────────────────┤
│ Mailgun        ████░░░░░░ $12.45 (8.3%)   15,234 emails   │
│ 2Chat.io       ████████░░ $45.67 (30.4%)  3,847 messages  │
│ Twilio SMS     ██░░░░░░░░ $8.92 (5.9%)    297 messages    │
│ Anthropic AI   ████████████ $89.23 (59.5%) 14,923 requests│
│ ─────────────────────────────────────────────────────────  │
│ Total          $156.27 (104.2% of budget) ⚠️               │
├─────────────────────────────────────────────────────────────┤
│ Cost Optimization Suggestions:                              │
│ • Optimize SMS delivery to reduce Twilio costs by ~20%     │
│ • Increase AI cache hit rate (currently 67%)               │
│ • 234 duplicate emails processed today     [View Details]  │
└─────────────────────────────────────────────────────────────┘

[Set Budget Alerts] [Download Invoice] [Cost Forecast] [Optimize]
```

**Integration Health Monitor:**
```
Service Health & Performance:
┌─────────────────────────────────────────────────────────────┐
│ Real-time System Status               Last Update: Just now │
├─────────────────────────────────────────────────────────────┤
│ Service      Status  Uptime   Latency  Errors  Rate Limit  │
├─────────────────────────────────────────────────────────────┤
│ Mailgun      🟢 OK   99.99%   124ms    0.1%    45% used    │
│ 2Chat.io     🟢 OK   99.87%   856ms    1.2%    No limit    │
│ Twilio       🟢 OK   100%     445ms    0.0%    12% used    │
│ Anthropic    🟡 SLOW 99.92%   2.1s     0.3%    87% used ⚠️ │
│ Redis        🟢 OK   100%     12ms     0.0%    No limit    │
├─────────────────────────────────────────────────────────────┤
│ Active Incidents: 0                    [Incident History]   │
│ Scheduled Maintenance: None            [Calendar]           │
└─────────────────────────────────────────────────────────────┘

[Performance Graphs] [Set Thresholds] [Export Report] [Alerts]
```

**Webhook Management Interface:**
```
Webhook Configuration & Testing:
┌─────────────────────────────────────────────────────────────┐
│ Endpoint Management                                         │
├─────────────────────────────────────────────────────────────┤
│ Mailgun Email Webhook:                                      │
│ URL: https://api.schoolcierge.app/webhooks/email          │
│ Status: Active ✓   Last Call: 2 min ago   [Test] [Logs]   │
│                                                             │
│ WhatsApp Response Webhook:                                  │
│ URL: https://api.schoolcierge.app/webhooks/whatsapp       │
│ Status: Active ✓   Last Call: 1 min ago   [Test] [Logs]   │
│                                                             │
│ SMS Status Webhook:                                         │
│ URL: https://api.schoolcierge.app/webhooks/sms-status     │
│ Status: Active ✓   Last Call: 15 min ago  [Test] [Logs]   │
├─────────────────────────────────────────────────────────────┤
│ Security Settings:                                          │
│ ├─ IP Whitelist: Enabled ✓                [Configure]      │
│ ├─ Signature Verification: Active ✓       [View Keys]      │
│ └─ Rate Limiting: 1000/min               [Adjust]         │
└─────────────────────────────────────────────────────────────┘

[Add Webhook] [Bulk Test] [Security Audit] [Documentation]
```

**Batch Operations & Bulk Management:**
```
Bulk Integration Operations:
┌─────────────────────────────────────────────────────────────┐
│ Quick Actions                                               │
├─────────────────────────────────────────────────────────────┤
│ Message Operations:                                         │
│ • Resend failed WhatsApp messages (71)    [Execute]        │
│ • Clear message queue (0 pending)         [Clear]          │
│ • Bulk template update                    [Configure]      │
│                                                             │
│ Configuration Sync:                                         │
│ • Export all integration settings         [Download]       │
│ • Import configuration from backup        [Upload]         │
│ • Sync settings to staging environment    [Sync Now]       │
│                                                             │
│ Maintenance Tasks:                                          │
│ • Rotate all API keys                     [Rotate All]     │
│ • Clear integration caches                [Clear Cache]    │
│ • Run full system health check            [Run Check]      │
└─────────────────────────────────────────────────────────────┘
```

**Integration Testing Suite:**
```
Integration Test Center:
┌─────────────────────────────────────────────────────────────┐
│ Test Scenarios                          Last Run: 2h ago   │
├─────────────────────────────────────────────────────────────┤
│ ✓ Email Reception (Mailgun)             Passed    [Rerun]  │
│ ✓ WhatsApp Delivery (2Chat.io)          Passed    [Rerun]  │
│ ✓ SMS Fallback (Twilio)                 Passed    [Rerun]  │
│ ✓ AI Classification (Anthropic)         Passed    [Rerun]  │
│ ✓ End-to-End Flow                       Passed    [Rerun]  │
├─────────────────────────────────────────────────────────────┤
│ Test Configuration:                                         │
│ • Test Family: test-family-admin@fwd.schoolcierge.com     │
│ • Test Phone: +971 50 TEST 0000                           │
│ • Auto-run: Every 6 hours               [Configure]       │
└─────────────────────────────────────────────────────────────┘

[Run All Tests] [Create Test] [View History] [Export Results]
```

**Dependencies**

Integration with Administration System (Section 5), monitoring infrastructure, secure credential storage.

**Data Structure**

See TRD Section 10 - Administration Integration Interfaces


---

**End of Document**