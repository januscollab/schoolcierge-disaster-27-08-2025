# MANDATORY AGENT INSTRUCTIONS - ACF REQUIREMENTS
**CRITICAL: These instructions are MANDATORY for ALL agents. No exceptions.**

---

## =¨ COLLABORATION FEED REQUIREMENTS - NOT OPTIONAL

### MANDATORY - Agent Diary Updates
You MUST use the collaboration feed at `/project/agent-team/pm-agent/agents-collaboration-feed.md` as follows:

#### 1. **BEFORE starting any task:**
- **READ** the ENTIRE feed to understand current state
- **CHECK** for blockers, dependencies, or conflicting work
- **ADD** entry stating you're starting work with task ID

#### 2. **DURING task execution:**
- **READ** the feed BEFORE EVERY FILE WRITE to check for conflicts
- **UPDATE** immediately when ANY TODO item is marked complete
- **UPDATE** every 30-60 minutes with overall progress
- **LOG** blockers IMMEDIATELY when encountered
- **DOCUMENT** all decisions and approach changes
- **CHECK** feed for new entries that might affect your work

#### 3. **BEFORE making changes:**
- **READ** recent feed entries (last 10-15 entries minimum)
- **VERIFY** no other agent is modifying the same files
- **CHECK** for new blockers or dependencies added by others
- **CONFIRM** your changes won't break other agents' work

#### 4. **AFTER completing work:**
- **UPDATE** with final status (Success/Partial/Blocked)
- **DOCUMENT** exactly what was delivered
- **LIST** all files modified with paths
- **IDENTIFY** next steps or handoffs needed
- **NOTE** any new dependencies created

### CRITICAL RULES:
1. **NO SILENT WORK** - All work MUST be visible in feed
2. **CHECK BEFORE CHANGE** - ALWAYS read feed before file modifications
3. **TODO = UPDATE** - Every TODO completion requires immediate feed update
4. **CONFLICT PREVENTION** - Verify no file conflicts before writing
5. **REAL-TIME** - Updates must happen AS work progresses, not after

### Entry Format Requirements:
```markdown
## [YYYY-MM-DD HH:MM GST] - [Agent Name] - [Task ID]
- **Action:** [Starting/TODO-Complete/Updating/Completing/Blocked]
- **Task:** [Clear description]
- **TODO Status:** [If applicable: "Completed TODO: Setup database connection"]
- **Progress:** [25%/50%/75%/100%]
- **Status:** [In-Progress/Success/Blocked/Partial]
- **Conflicts Checked:** [Confirmed no conflicts with: API-002, DB-003]
- **Files Modified:** [Full paths]
- **Next Steps:** [What happens next]
- **Dependencies:** [What this blocks or depends on]
- **Time Spent:** [Actual time on task]
- **Notes:** [Important context, warnings, discoveries]
```

---

## <¯ KEY POINTS TO REMEMBER

### The ACF is the PROJECT'S HEARTBEAT
Without proper ACF updates:
- Other agents work blind
- Conflicts arise
- Work gets duplicated
- Progress is invisible
- Chaos ensues

### SPECIFIC UPDATE TRIGGERS
You MUST update the ACF when:
-  Starting any task
-  Completing ANY TODO item
-  Before making file changes
-  Every 30-60 minutes regardless
-  Finding any blocker
-  Making any decision
-  Completing any task

### CONFLICT PREVENTION
BEFORE writing to ANY file:
1. Check ACF for recent entries
2. Verify no one else is modifying it
3. Add your intent to ACF
4. Then make your changes
5. Update ACF with completion

---

##   CONSEQUENCES OF NON-COMPLIANCE

Failure to follow these ACF requirements:
- Breaks team coordination
- Causes merge conflicts
- Duplicates work effort
- Loses progress visibility
- Undermines project success

**These are not guidelines - they are MANDATORY REQUIREMENTS.**

---

## =Ý USAGE INSTRUCTIONS

To add these requirements to any agent configuration:

1. Add at the END of the agent file
2. Include this header:
   ```markdown
   ## =¨ MANDATORY ACF REQUIREMENTS
   ```
3. Copy the entire requirements section
4. Ensure it's clearly marked as mandatory

---

**Remember:** The ACF is how we prevent chaos. Use it religiously.