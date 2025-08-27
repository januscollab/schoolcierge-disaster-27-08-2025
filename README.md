# 🎓 SchoolCierge

AI-powered school communication platform connecting schools, parents, and students.

## 🚀 Quick Start

```bash
# Setup the cx command (one-time)
./setup-cx.sh
source ~/.zshrc  # or ~/.bashrc

# Start using cx
cx help          # Show all commands
cx status        # Check project progress
cx live          # Live dashboard
```

## 📁 Project Structure

```
schoolcierge/
├── src/                  # Application source code
│   ├── api/             # Backend API
│   └── mobile/          # React Native app (coming soon)
├── prisma/              # Database schema
├── .project/            # Project management
│   ├── scripts/         # CLI tools and utilities
│   ├── tasks/          # Task tracking data
│   └── agent-comms/    # Agent work files (reports, WIP, etc.)
├── cx                   # Task management CLI
└── [config files]       # Essential configs only
```

## 🛠️ Technology Stack

- **Backend**: Node.js, Express, TypeScript, Prisma
- **Database**: PostgreSQL (via Railway)
- **Mobile**: React Native with Tamagui
- **Auth**: Clerk
- **Deployment**: Railway

## 📋 Task Management

Use the `cx` command for all task management:

```bash
cx build TASK-001   # Start working on a task
cx list            # View all tasks
cx next            # What to work on next
cx parallel        # Execute tasks in parallel
```

## 📚 Documentation

- [Task Management Guide](./TASK-MANAGEMENT.md)
- [Git Workflow](./GIT-WORKFLOW.md)
- [Agent Directives](./CLAUDE.md) - **IMPORTANT: File organization rules**

## ⚠️ Important Notes

1. **File Organization**: All work-in-progress and agent-generated files go in `.project/agent-comms/`
2. **Root Folder**: Keep clean - only essential project files
3. **Reports/Analysis**: Store in `.project/agent-comms/reports/`

## 🎯 Project Status

Run `cx status` for current progress and `cx dashboard` for visual overview.

---

Built with CREAITE 🚀