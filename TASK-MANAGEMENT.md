# SchoolCierge Task Management System

## Quick Setup

1. **Set up the `cx` command** (one-time setup):
```bash
./setup-cx.sh
source ~/.zshrc  # or ~/.bashrc
```

2. **Test it works**:
```bash
cx help
```

## Daily Workflow

### Start Your Day
```bash
cx status          # Check overall progress
cx list            # See all tasks
cx next            # What should I work on?
```

### Working on Tasks
```bash
cx start TASK-001          # Begin working on a task
cx update TASK-001 --progress 50   # Update progress
cx complete TASK-001       # Mark as done
```

### Visualization
```bash
cx dashboard       # Generate HTML dashboard
cx deps            # View dependency graph
cx gantt           # Timeline view
```

## Command Reference

### Basic Commands
- `cx help` - Show all available commands
- `cx status` or `cx s` - Project progress report
- `cx list` or `cx ls` - List all tasks
- `cx next` - Show what to work on next

### Task Management
- `cx add "Task title"` - Create new task
- `cx start TASK-001` - Mark task as in-progress
- `cx update TASK-001 --progress 75` - Update progress
- `cx complete TASK-001` - Mark as completed
- `cx detail TASK-001` - Show full task details

### Filtering
- `cx list --status in-progress` - Filter by status
- `cx list --priority P0` - Filter by priority
- `cx list --category mobile` - Filter by category

### Visualization
- `cx dashboard` - HTML dashboard
- `cx gantt` - Gantt chart
- `cx deps` - Dependency graph
- `cx burndown` - Progress metrics

## Task Structure

Each task contains:
- **ID**: Unique identifier (TASK-001)
- **Priority**: P0 (Critical), P1 (High), P2 (Medium), P3 (Low)
- **Status**: not-started, in-progress, blocked, completed
- **Category**: infrastructure, auth, mobile, clara, timer, etc.
- **Dependencies**: Links to other tasks
- **PRD/TRD References**: Links to requirements
- **Estimates**: Hours and complexity

## Project Phases

1. **Phase 1: Foundation** (8 tasks) - Infrastructure & Auth
2. **Phase 2: CLARA** (10 tasks) - Email processing pipeline
3. **Phase 3: TIMER** (8 tasks) - Task delivery system
4. **Phase 4: Mobile** (9 tasks) - Parent app
5. **Phase 5: ADAPT** (5 tasks) - Learning system
6. **Phase 6: Admin** (5 tasks) - Management dashboard

## File Locations

- **Tasks**: `.project/tasks/backlog.json`
- **Progress**: `.project/tasks/PROGRESS.md`
- **What's Next**: `.project/tasks/WHATS-NEXT.md`
- **Dashboard**: `.project/tasks/dashboard.html`
- **Scripts**: `.project/scripts/`
- **PRD**: `.project/product/PRD-DEV.md`
- **TRD**: `.project/product/TRD-DEV.md`

## Tips

1. **Start with P0 tasks** - These are critical path
2. **Check dependencies** - Some tasks block others
3. **Update progress regularly** - Helps track velocity
4. **Use `cx next`** - Shows unblocked tasks ready to start
5. **Generate dashboard weekly** - Good for stakeholder updates

## Working with Claude Code

When ready to implement a task:
1. Check task details: `cx detail TASK-001`
2. Tell Claude: "Work on TASK-001"
3. Claude will read requirements from PRD/TRD
4. Implementation follows task specifications
5. Task auto-updates when complete

## Troubleshooting

If `cx` command not found:
```bash
# Option 1: Use full path
./cx status

# Option 2: Re-run setup
./setup-cx.sh
source ~/.zshrc

# Option 3: Use npm directly
npm run status
```

## Current Stats

Run `cx status` to see current progress.
45 total tasks across 6 phases.