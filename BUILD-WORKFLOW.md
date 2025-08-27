# Build Command & Workflow Documentation

## Current Project Status
**⚠️ IMPORTANT: As of 2025-08-27, NO TASKS ARE IN PROGRESS**
- All previously "in-progress" tasks have been reset to "not-started"
- We are starting fresh with a clean slate
- No fake progress percentages - only real implementation counts

## Completed Tasks (7 total)
- TASK-002: Initialize Railway project with PostgreSQL and Redis
- TASK-005: Create Express API boilerplate with TypeScript  
- TASK-008: Initialize Expo mobile app project
- TASK-009: Configure GitHub CI/CD pipeline
- TASK-018: Set up BullMQ job queue for CLARA pipeline
- TASK-046: Install and configure Redis/BullMQ for job queue system
- TASK-047: Initialize Expo mobile app with Tamagui and complete setup

## The Build Command

### How to Use
```bash
# Start working on a specific task
./cx build TASK-XXX

# Manual mode (no AI assistance)
./cx build TASK-XXX --manual

# Auto mode (no confirmations)
./cx build TASK-XXX --auto

# Override agent selection
./cx build TASK-XXX --override-agent=backend-api-agent
```

### What It Actually Does

The `./cx build` command triggers the **Smart Task Starter** (`smart-task-starter.js`), which:

## Build Workflow Process

### 1. **Task Analysis Phase**
When you run `./cx build TASK-XXX`:

```
🤖 INTELLIGENT TASK BUILDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 TASK OVERVIEW
Task: TASK-XXX: [Task Title]
Status: not-started
Progress: ░░░░░░░░░░░░░░░░░░░░ 0%
Priority: P0
Category: backend/frontend/infrastructure
```

The system analyzes:
- Current task status and progress
- Dependencies (blocking/blocked by)
- Existing implementation (files created)
- Task complexity and domain

### 2. **Intelligence Gathering**
The TaskIntelligence module (`intelligence/TaskIntelligence.js`) determines:

- **Domain Analysis**: What type of task (backend, frontend, infrastructure, etc.)
- **Complexity Assessment**: simple, medium, complex, or epic
- **Dependency Mapping**: Critical path analysis
- **Resource Requirements**: What files need to be created/modified

### 3. **Agent Routing**
The AgentRouter (`intelligence/AgentRouter.js`) selects the best agent:

```
🤖 AI ANALYSIS
Domain: backend (api)
Complexity: complex
Confidence: 85%

📋 EXECUTION PLAN
Primary Agent: backend-api-agent
Support Agents: database-agent, auth-agent
Workflow: phased-implementation
```

Available Agents:
- `backend-api-agent`: Express.js and TypeScript REST API specialist
- `database-agent`: PostgreSQL, Prisma, and database optimization expert  
- `auth-agent`: Clerk integration and auth flow specialist
- `mobile-app-agent`: Expo and React Native specialist with Tamagui
- `infrastructure-devops-agent`: Railway platform and deployment specialist
- `security-agent`: Security, compliance, and threat modeling expert
- `test-automation-agent`: Jest, Supertest, and Maestro testing expert
- `pm-agent`: Project Manager orchestrating all development activities

### 4. **Workflow Orchestration**
The WorkflowOrchestrator (`intelligence/WorkflowOrchestrator.js`) manages:

1. **Workflow Selection**:
   - `quick-fix`: Simple changes < 1 hour
   - `feature-implementation`: Standard feature development
   - `phased-implementation`: Complex multi-step features
   - `debug-and-fix`: Troubleshooting and bug fixes
   - `research-and-design`: Investigation and planning

2. **Phase Execution**:
   ```
   Phase 1: Research & Analysis
   Phase 2: Implementation
   Phase 3: Testing & Validation
   Phase 4: Documentation & Cleanup
   ```

3. **Progress Tracking**:
   - Updates task progress in real-time
   - Logs all actions to `events.jsonl`
   - Creates workflow records with unique IDs

### 5. **Agent Execution**
Once confirmed, the selected agent:
1. Reads task requirements
2. Creates/modifies necessary files
3. Runs tests to verify implementation
4. Updates task status and progress
5. Logs completion in backlog.json

### 6. **Progress Updates**
The system automatically:
- Updates task status (`not-started` → `in-progress` → `completed`)
- Tracks progress percentage (0% → 100%)
- Records files created/modified
- Logs timestamps (started_at, completed_at)
- Creates audit trail in events.jsonl

## Manual vs Intelligent Mode

### Intelligent Mode (Default)
- AI analyzes the task
- Automatically selects best agent
- Proposes workflow strategy
- Requires confirmation before execution
- Tracks all changes

### Manual Mode (`--manual`)
- No AI assistance
- Direct file editing
- You specify what to build
- No agent routing
- Still tracks progress

## Task State Management

Tasks go through these states:
1. **not-started**: Initial state, 0% progress
2. **in-progress**: Active work, 1-99% progress  
3. **blocked**: Waiting on dependencies
4. **completed**: Done, 100% progress

## File Creation Tracking

The build system tracks:
```json
"implementation_notes": {
  "files_created": [
    ".github/workflows/ci.yml",
    "src/api/routes/families.ts"
  ],
  "files_to_modify": [],
  "workflow_id": "workflow-TASK-009-1756238716008",
  "agent_interactions": 3,
  "phases_completed": 4
}
```

## Error Handling

If a build fails:
1. Task remains in current state
2. Error logged to events.jsonl
3. Rollback plan available in implementation_notes
4. Can retry with `./cx build TASK-XXX`

## Important Notes

1. **No Fake Progress**: Tasks only show real implementation progress
2. **Dependency Checking**: Won't start blocked tasks
3. **File Safety**: Won't overwrite without confirmation
4. **Test Integration**: Runs tests after implementation
5. **Audit Trail**: All actions logged for accountability

## Common Issues

### "Task not found"
- Check task ID is correct (TASK-XXX format)
- Ensure task exists in backlog.json

### "Task is blocked"
- Check dependencies with `./cx task detail TASK-XXX`
- Complete blocking tasks first

### "No agent available"
- Task may require manual implementation
- Use `--manual` flag or `--override-agent`

### "Tests failing"
- Implementation incomplete
- Check test output with `./cx test TASK-XXX`
- Review generated code for issues

## Best Practices

1. **Always start with lowest dependencies first**
2. **Complete infrastructure tasks before features**
3. **Run tests after each build**
4. **Review generated code before committing**
5. **Update task notes if manual changes made**

---
*Last Updated: 2025-08-27*
*Status: All tasks reset to not-started, starting fresh*