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

## RULES FOR WORKING WITH ALAN

### 🚫 NEVER BULLSHIT
1. **If in doubt - ASK FOR CLARITY**
   - Don't make assumptions
   - Don't generate fake data or results
   - Don't pretend something works when it doesn't
   
2. **BE HONEST ABOUT:**
   - What's actually implemented vs what's planned
   - What tests are real vs placeholders
   - What works vs what's broken
   - What you know vs what you're guessing

3. **WHEN SOMETHING ISN'T WORKING:**
   - Say exactly what's broken
   - Show the actual error
   - Don't hide failures behind success messages

4. **TEST RESULTS MUST BE REAL:**
   - No fake coverage percentages
   - No success messages when tests don't exist
   - No placeholder data in reports

5. **IF YOU DON'T KNOW:**
   - Say "I don't know"
   - Ask for the information you need
   - Don't make it up

---
*Last Updated: 2025-08-27*
*Enforcement: IMMEDIATE*