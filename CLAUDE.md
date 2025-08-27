# 🚨 CRITICAL DIRECTIVES FOR ALL AGENTS AND PROCESSES

## FILE ORGANIZATION RULES - MANDATORY

### ❌ NEVER CREATE FILES IN PROJECT ROOT
**The project root folder is NOT a workspace. DO NOT create files here unless:**
- It's an essential project config file (package.json, tsconfig.json, etc.)
- It's a critical README or setup file explicitly requested by the user
- It's a Docker/deployment configuration file

### ✅ WHERE TO PUT FILES

#### Work-in-Progress / Agent Communication:
```
.project/agent-comms/      # ALL temporary files, notes, reports go here
├── reports/               # Audit reports, status updates
├── wip/                   # Work in progress files
├── analysis/              # Analysis documents
└── backups/              # Backup documentation
```

#### Task Management Files:
```
.project/tasks/           # Task-related data only
├── backlog.json
├── events.jsonl
└── dashboard.html
```

#### Scripts:
```
.project/scripts/         # All utility scripts
```

### 📝 FILE CREATION GUIDELINES

1. **BEFORE creating any file, ask yourself:**
   - Is this explicitly requested by the user?
   - Is this essential for the project to function?
   - If NO to both → USE `.project/agent-comms/` directory

2. **Report/Analysis Files:**
   - ALL go in `.project/agent-comms/reports/`
   - NEVER in project root

3. **Temporary Work:**
   - ALL go in `.project/agent-comms/wip/`
   - Clean up after completion

4. **Documentation:**
   - Only ESSENTIAL docs in root (README.md, TASK-MANAGEMENT.md, GIT-WORKFLOW.md)
   - Everything else → `.project/agent-comms/`

## ENFORCEMENT

**This is NOT optional. Any agent or process creating unnecessary files in the root will be considered malfunctioning.**

## Essential Root Files Only:
- README.md (main project readme)
- CLAUDE.md (this file)
- TASK-MANAGEMENT.md (user workflow guide)
- GIT-WORKFLOW.md (git strategy)
- cx (CLI executable)
- Configuration files (package.json, tsconfig.json, etc.)
- Docker/deployment files
- Setup scripts (setup-cx.sh, etc.)

**Everything else belongs in organized subdirectories.**

---
*Last Updated: 2025-08-26*
*Enforcement: IMMEDIATE*