#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const tasksPath = path.join(__dirname, '../tasks/backlog.json');

// Comprehensive task list from PRD/TRD decomposition
const tasks = [
  // Phase 1: Foundation & Infrastructure
  {
    title: "Initialize Railway project with PostgreSQL and Redis",
    category: "infrastructure",
    priority: "P0",
    estimate: 4,
    complexity: "M",
    description: "Set up Railway project with PostgreSQL database for primary data and Redis for BullMQ job queues",
    prd: ["Section 2.1", "PAD Infrastructure Stack"],
    trd: ["Section 2: Service Architecture", "Section 11: Service Specifications"],
    dependencies: []
  },
  {
    title: "Configure Clerk authentication with social logins",
    category: "authentication",
    priority: "P0",
    estimate: 8,
    complexity: "L",
    description: "Implement Clerk authentication with Google OAuth and Apple Sign-In as specified in REQ-002",
    prd: ["REQ-002: Email/password authentication with social login options"],
    trd: ["Section 13: Security Architecture"],
    dependencies: []
  },
  {
    title: "Implement WhatsApp OTP authentication layer",
    category: "authentication",
    priority: "P0",
    estimate: 12,
    complexity: "XL",
    description: "Custom WhatsApp OTP authentication on top of Clerk as primary auth method (REQ-003, REQ-004)",
    prd: ["REQ-003: Required email verification", "REQ-004: Required phone verification", "PRIMARY METHOD - WhatsApp OTP"],
    trd: ["Section 13: Security Architecture"],
    dependencies: ["TASK-002"]
  },
  {
    title: "Create Express API boilerplate with TypeScript",
    category: "backend",
    priority: "P0",
    estimate: 6,
    complexity: "M",
    description: "Set up Express server with TypeScript, middleware, error handling, and API structure",
    prd: ["Section 2: Parent HOME Core Features"],
    trd: ["Section 7: Complete API Specifications"],
    dependencies: ["TASK-001"]
  },
  {
    title: "Configure Mailgun email ingestion webhook",
    category: "integration",
    priority: "P0",
    estimate: 6,
    complexity: "M",
    description: "Set up Mailgun for receiving forwarded emails with webhook endpoint and verification",
    prd: ["Section 9.1: Mailgun Integration"],
    trd: ["Section 8.1: Mailgun Email Service"],
    dependencies: ["TASK-004"]
  },
  {
    title: "Set up 2Chat.io WhatsApp Business integration",
    category: "integration",
    priority: "P0",
    estimate: 8,
    complexity: "L",
    description: "Configure 2Chat.io for WhatsApp Business messaging with templates and webhooks",
    prd: ["Section 9.2: WhatsApp Business Integration via 2Chat.io"],
    trd: ["Section 8.2: 2Chat.io WhatsApp Service"],
    dependencies: ["TASK-004"]
  },
  {
    title: "Initialize Expo mobile app project",
    category: "mobile",
    priority: "P0",
    estimate: 4,
    complexity: "S",
    description: "Create Expo SDK 50+ project with TypeScript, navigation, and base structure",
    prd: ["Section 2: Parent HOME", "PAD Mobile Application"],
    trd: ["Mobile app requirements"],
    dependencies: []
  },
  {
    title: "Configure GitHub CI/CD pipeline",
    category: "devops",
    priority: "P1",
    estimate: 6,
    complexity: "M",
    description: "Set up GitHub Actions for testing, building, and deploying to Railway",
    prd: ["Section 2.5: Data Management & Compliance"],
    trd: ["Section 16: Deployment Configuration"],
    dependencies: ["TASK-001", "TASK-004"]
  },

  // Phase 2: CLARA Email Processing Pipeline
  {
    title: "Build email ingestion endpoint",
    category: "clara",
    priority: "P0",
    estimate: 6,
    complexity: "M",
    description: "Create Mailgun webhook endpoint for receiving and storing raw emails",
    prd: ["Section 3.2: CLARA Single-Service Architecture"],
    trd: ["Section 4.1: CLARA Service Overview"],
    dependencies: ["TASK-005"]
  },
  {
    title: "Implement CLARA Stage 1: Raw email storage",
    category: "clara",
    priority: "P0",
    estimate: 4,
    complexity: "S",
    description: "Store raw email data with metadata in PostgreSQL",
    prd: ["Section 3.4: Stage 1 - Raw Data Ingestion"],
    trd: ["Section 4.2: Processing Pipeline Stages"],
    dependencies: ["TASK-009"]
  },
  {
    title: "Implement CLARA Stage 2: Content extraction",
    category: "clara",
    priority: "P0",
    estimate: 8,
    complexity: "L",
    description: "Parse email HTML/text, extract body, headers, and attachments",
    prd: ["Section 3.4: Stage 2 - Content Extraction"],
    trd: ["Section 4.2: Processing Pipeline Stages"],
    dependencies: ["TASK-010"]
  },
  {
    title: "Implement CLARA Stage 3: Classification system",
    category: "clara",
    priority: "P0",
    estimate: 12,
    complexity: "XL",
    description: "Build AI classification for 11 email categories using OpenAI",
    prd: ["Section 3.4: Stage 3 - Classification", "Section 8.3: Classification System"],
    trd: ["Section 4.3: Classification Categories"],
    dependencies: ["TASK-011"]
  },
  {
    title: "Implement CLARA Stage 4: Entity extraction",
    category: "clara",
    priority: "P0",
    estimate: 10,
    complexity: "L",
    description: "Extract dates, names, amounts, locations from classified emails",
    prd: ["Section 3.4: Stage 4 - Entity Extraction"],
    trd: ["Section 4.4: Entity Extraction"],
    dependencies: ["TASK-012"]
  },
  {
    title: "Implement CLARA Stage 5: Action identification",
    category: "clara",
    priority: "P0",
    estimate: 8,
    complexity: "L",
    description: "Identify required actions from email content and entities",
    prd: ["Section 3.4: Stage 5 - Action Identification", "Section 3.8: Action Matrix"],
    trd: ["Section 4.5: Action Identification"],
    dependencies: ["TASK-013"]
  },
  {
    title: "Implement CLARA Stage 6: Smart summarization",
    category: "clara",
    priority: "P0",
    estimate: 8,
    complexity: "L",
    description: "Generate concise summaries optimized for WhatsApp delivery",
    prd: ["Section 3.4: Stage 6 - Smart Summarization"],
    trd: ["Section 4.6: Summarization"],
    dependencies: ["TASK-014"]
  },
  {
    title: "Implement CLARA Stage 7: Personalization",
    category: "clara",
    priority: "P2",
    estimate: 10,
    complexity: "L",
    description: "Apply family preferences and learning to message formatting",
    prd: ["Section 3.4: Stage 7 - Personalization"],
    trd: ["Section 4.7: Personalization"],
    dependencies: ["TASK-015"]
  },
  {
    title: "Set up BullMQ job queue for CLARA pipeline",
    category: "clara",
    priority: "P0",
    estimate: 6,
    complexity: "M",
    description: "Configure BullMQ with Redis for async pipeline processing",
    prd: ["Section 3.7: Technical Implementation Requirements"],
    trd: ["Section 4.8: Queue Management"],
    dependencies: ["TASK-001", "TASK-009"]
  },
  {
    title: "Implement CLARA error handling and retry logic",
    category: "clara",
    priority: "P1",
    estimate: 6,
    complexity: "M",
    description: "Add error handling, retries, and dead letter queue for failed emails",
    prd: ["Section 3.7: Technical Implementation Requirements"],
    trd: ["Section 15: Error Handling & Recovery"],
    dependencies: ["TASK-017"]
  },

  // Phase 3: TIMER Task & Delivery System
  {
    title: "Build task generation from CLARA output",
    category: "timer",
    priority: "P0",
    estimate: 8,
    complexity: "L",
    description: "Convert CLARA-processed emails into actionable tasks with metadata",
    prd: ["Section 4.3: Task Generation & Lifecycle"],
    trd: ["Section 5.1: TIMER Service Overview"],
    dependencies: ["TASK-015"]
  },
  {
    title: "Implement WhatsApp message formatting",
    category: "timer",
    priority: "P0",
    estimate: 6,
    complexity: "M",
    description: "Format tasks for WhatsApp with emojis, structure, and action buttons",
    prd: ["Section 4.2: Multi-Channel Task Interface"],
    trd: ["Section 5.2: Message Formatting"],
    dependencies: ["TASK-019"]
  },
  {
    title: "Build delivery scheduling system",
    category: "timer",
    priority: "P0",
    estimate: 8,
    complexity: "L",
    description: "Schedule message delivery based on urgency and preferences",
    prd: ["Section 4.6: Message Orchestration & Delivery"],
    trd: ["Section 5.3: Delivery Scheduling"],
    dependencies: ["TASK-020"]
  },
  {
    title: "Implement reminder engine",
    category: "timer",
    priority: "P1",
    estimate: 10,
    complexity: "L",
    description: "Build smart reminder system with escalation logic",
    prd: ["Section 4.5: Intelligent Reminder & Escalation"],
    trd: ["Section 5.4: Reminder System"],
    dependencies: ["TASK-021"]
  },
  {
    title: "Build task completion tracking",
    category: "timer",
    priority: "P1",
    estimate: 6,
    complexity: "M",
    description: "Track task completions via WhatsApp responses and app actions",
    prd: ["Section 4.4: Action Tracking & Completion"],
    trd: ["Section 5.5: Completion Tracking"],
    dependencies: ["TASK-019"]
  },
  {
    title: "Implement multi-parent coordination",
    category: "timer",
    priority: "P2",
    estimate: 8,
    complexity: "L",
    description: "Handle task assignment and visibility for multiple parents",
    prd: ["Section 4.8: Family Coordination Features"],
    trd: ["Section 5.6: Multi-Parent Logic"],
    dependencies: ["TASK-023"]
  },
  {
    title: "Build SMS fallback system",
    category: "timer",
    priority: "P2",
    estimate: 6,
    complexity: "M",
    description: "Implement Twilio SMS fallback when WhatsApp fails",
    prd: ["Section 9.3: SMS Fallback Integration"],
    trd: ["Section 8.3: Twilio SMS Service"],
    dependencies: ["TASK-021"]
  },
  {
    title: "Implement analytics event tracking",
    category: "timer",
    priority: "P2",
    estimate: 6,
    complexity: "M",
    description: "Track delivery, opens, actions for analytics",
    prd: ["Section 4.7: Performance Metrics & Analytics"],
    trd: ["Section 5.7: Analytics Events"],
    dependencies: ["TASK-023"]
  },

  // Phase 4: Mobile Application (HOME)
  {
    title: "Build authentication screens",
    category: "mobile",
    priority: "P0",
    estimate: 10,
    complexity: "L",
    description: "WhatsApp OTP, Google, Apple login screens with Clerk SDK",
    prd: ["REQ-002 to REQ-007: Authentication requirements"],
    trd: ["Mobile authentication flow"],
    dependencies: ["TASK-007", "TASK-003"]
  },
  {
    title: "Implement family onboarding flow",
    category: "mobile",
    priority: "P0",
    estimate: 12,
    complexity: "L",
    description: "Multi-step onboarding: family setup, students, preferences, email forwarding",
    prd: ["Section 2.1: Family Onboarding System"],
    trd: ["Onboarding data models"],
    dependencies: ["TASK-027"]
  },
  {
    title: "Build student management interface",
    category: "mobile",
    priority: "P0",
    estimate: 8,
    complexity: "M",
    description: "Add, edit, remove students with school associations",
    prd: ["Section 2.2: Family Management System"],
    trd: ["Section 3: Data Models - Student"],
    dependencies: ["TASK-028"]
  },
  {
    title: "Create dashboard with task cards",
    category: "mobile",
    priority: "P0",
    estimate: 10,
    complexity: "L",
    description: "Main dashboard showing tasks, urgency indicators, quick actions",
    prd: ["Section 2.4: Intelligent Task Dashboard"],
    trd: ["Dashboard API endpoints"],
    dependencies: ["TASK-029"]
  },
  {
    title: "Build task detail views",
    category: "mobile",
    priority: "P1",
    estimate: 8,
    complexity: "M",
    description: "Detailed task view with original email, actions, completion",
    prd: ["Section 2.4: Task Dashboard components"],
    trd: ["Task detail API"],
    dependencies: ["TASK-030"]
  },
  {
    title: "Implement settings and preferences",
    category: "mobile",
    priority: "P1",
    estimate: 6,
    complexity: "M",
    description: "User preferences, notification settings, communication channels",
    prd: ["Section 2.3: User Preferences & Settings"],
    trd: ["Preferences data model"],
    dependencies: ["TASK-028"]
  },
  {
    title: "Configure push notifications",
    category: "mobile",
    priority: "P1",
    estimate: 6,
    complexity: "M",
    description: "Set up Expo push notifications for iOS and Android",
    prd: ["Section 9.5: Push Notification Integration"],
    trd: ["Push notification service"],
    dependencies: ["TASK-030"]
  },
  {
    title: "Implement offline support with sync",
    category: "mobile",
    priority: "P2",
    estimate: 10,
    complexity: "L",
    description: "Offline task viewing with background sync when online",
    prd: ["Section 2.4: Dashboard offline capability"],
    trd: ["Offline sync strategy"],
    dependencies: ["TASK-030"]
  },

  // Phase 5: ADAPT Intelligence System
  {
    title: "Build entity discovery system",
    category: "adapt",
    priority: "P2",
    estimate: 10,
    complexity: "L",
    description: "Discover and learn new entities from email patterns",
    prd: ["Section 6.1: Entity Discovery & Management"],
    trd: ["Section 12.1: ADAPT Architecture"],
    dependencies: ["TASK-013"]
  },
  {
    title: "Implement pattern recognition",
    category: "adapt",
    priority: "P2",
    estimate: 12,
    complexity: "XL",
    description: "Recognize communication patterns and email structures",
    prd: ["Section 6.1: Pattern detection algorithms"],
    trd: ["Section 12.2: Learning Algorithms"],
    dependencies: ["TASK-035"]
  },
  {
    title: "Build preference learning system",
    category: "adapt",
    priority: "P2",
    estimate: 10,
    complexity: "L",
    description: "Learn family preferences from interactions",
    prd: ["Section 6.3: Strategic Evolution Insights"],
    trd: ["Section 12.3: Preference Learning"],
    dependencies: ["TASK-036"]
  },
  {
    title: "Implement quality monitoring",
    category: "adapt",
    priority: "P2",
    estimate: 8,
    complexity: "M",
    description: "Monitor classification accuracy and processing quality",
    prd: ["Section 6.2: Quality Assurance & Monitoring"],
    trd: ["Section 12.4: Quality Metrics"],
    dependencies: ["TASK-012"]
  },
  {
    title: "Build analytics dashboard for ADAPT",
    category: "adapt",
    priority: "P3",
    estimate: 10,
    complexity: "L",
    description: "Dashboard showing learning progress and system insights",
    prd: ["Section 6.5: Operations Dashboard"],
    trd: ["Section 12.5: ADAPT Dashboard"],
    dependencies: ["TASK-038"]
  },

  // Phase 6: Administration System
  {
    title: "Build school management CRUD",
    category: "admin",
    priority: "P1",
    estimate: 8,
    complexity: "M",
    description: "Admin interface for managing schools and configurations",
    prd: ["Section 7.2: School & App Database Management"],
    trd: ["Section 9.1: Admin API"],
    dependencies: ["TASK-004"]
  },
  {
    title: "Create queue monitoring interface",
    category: "admin",
    priority: "P1",
    estimate: 8,
    complexity: "M",
    description: "Monitor BullMQ queues, job status, and failures",
    prd: ["Section 7.5: Queue Management Interface"],
    trd: ["Section 9.2: Queue Monitoring"],
    dependencies: ["TASK-017"]
  },
  {
    title: "Build CLARA pipeline monitoring",
    category: "admin",
    priority: "P1",
    estimate: 10,
    complexity: "L",
    description: "Monitor each CLARA stage performance and errors",
    prd: ["Section 7.1: Admin Dashboard Components"],
    trd: ["Section 9.3: Pipeline Monitoring"],
    dependencies: ["TASK-018"]
  },
  {
    title: "Implement TIMER delivery tracking",
    category: "admin",
    priority: "P1",
    estimate: 8,
    complexity: "M",
    description: "Track message delivery status and failures",
    prd: ["Section 7.6: TIMER Analytics Dashboard"],
    trd: ["Section 9.4: Delivery Analytics"],
    dependencies: ["TASK-026"]
  },
  {
    title: "Build system configuration UI",
    category: "admin",
    priority: "P2",
    estimate: 10,
    complexity: "L",
    description: "Configure AI providers, thresholds, and system settings",
    prd: ["Section 7.7: AI Provider Configuration"],
    trd: ["Section 9.5: Configuration Management"],
    dependencies: ["TASK-040"]
  }
];

// Function to generate task ID
function generateId(index) {
  return `TASK-${String(index + 1).padStart(3, '0')}`;
}

// Load existing tasks or start fresh
let existingTasks = [];
if (fs.existsSync(tasksPath)) {
  const content = fs.readFileSync(tasksPath, 'utf8');
  if (content && content !== '[]') {
    existingTasks = JSON.parse(content);
  }
}

// Find the starting ID
const startId = existingTasks.length > 0 
  ? parseInt(existingTasks[existingTasks.length - 1].id.split('-')[1]) 
  : 0;

// Convert to full task objects
const fullTasks = tasks.map((task, index) => ({
  id: generateId(startId + index),
  title: task.title,
  category: task.category,
  priority: task.priority,
  status: 'not-started',
  created_at: new Date().toISOString(),
  
  product_requirements: {
    description: task.description,
    acceptance_criteria: [],
    user_stories: [],
    prd_references: task.prd || []
  },
  
  technical_requirements: {
    description: '',
    architecture_decisions: [],
    technology_stack: [],
    api_contracts: {},
    data_models: {},
    trd_references: task.trd || []
  },
  
  dependencies: {
    blocks: [],
    blocked_by: task.dependencies || [],
    parallel_with: []
  },
  
  estimates: {
    effort_hours: task.estimate,
    complexity: task.complexity,
    risk_level: task.complexity === 'XL' ? 'high' : task.complexity === 'L' ? 'medium' : 'low'
  },
  
  implementation_notes: {
    files_to_modify: [],
    files_to_create: [],
    testing_approach: '',
    rollback_plan: ''
  },
  
  progress: 0
}));

// Combine with existing tasks (if any)
const allTasks = [...existingTasks, ...fullTasks];

// Save to file
fs.writeFileSync(tasksPath, JSON.stringify(allTasks, null, 2));

console.log(`✅ Successfully imported ${fullTasks.length} tasks`);
console.log(`📊 Total tasks in backlog: ${allTasks.length}`);

// Generate summary
const byCategory = {};
const byPriority = { P0: 0, P1: 0, P2: 0, P3: 0 };
const totalHours = fullTasks.reduce((sum, task) => {
  byCategory[task.category] = (byCategory[task.category] || 0) + 1;
  byPriority[task.priority]++;
  return sum + task.estimate;
}, 0);

console.log('\n📈 Summary:');
console.log('By Category:', byCategory);
console.log('By Priority:', byPriority);
console.log(`Total Effort: ${totalHours} hours (${Math.round(totalHours / 40)} weeks)`);