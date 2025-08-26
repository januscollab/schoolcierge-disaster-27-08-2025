#!/usr/bin/env python3
"""Update all agent files with MANDATORY ACF requirements"""

import os
import glob

# The MANDATORY ACF section to add
ACF_SECTION = """
---

## 🚨 MANDATORY ACF REQUIREMENTS

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

**The ACF is the PROJECT'S HEARTBEAT - without it, chaos ensues!**"""

# Get all agent files
agent_files = glob.glob('/Users/alanmahon/dev.env/projects/schoolcierge/.claude/agents/*agent*.md')

# Skip the auth-agent and admin-common-agent as they're already updated/special files
agent_files = [f for f in agent_files if 'auth-agent.md' not in f and 'admin-common-agent' not in f and 'AGENT-COLOR-LEGEND.md' not in f]

print(f"Found {len(agent_files)} agent files to update")
print("=" * 60)

updated_count = 0
skipped_count = 0

for agent_file in agent_files:
    filename = os.path.basename(agent_file)
    print(f"\n📝 Processing {filename}...")
    
    try:
        # Read the file
        with open(agent_file, 'r') as f:
            content = f.read()
        
        # Check if ACF requirements already exist
        if "MANDATORY ACF REQUIREMENTS" in content:
            print(f"   ⚠️  Already has ACF requirements - skipping")
            skipped_count += 1
            continue
        
        # Add ACF section at the end
        updated_content = content.rstrip() + ACF_SECTION
        
        # Write back
        with open(agent_file, 'w') as f:
            f.write(updated_content)
        
        print(f"   ✅ Updated with MANDATORY ACF requirements")
        updated_count += 1
        
    except Exception as e:
        print(f"   ❌ Error: {e}")

print("\n" + "=" * 60)
print(f"✅ Updated: {updated_count} agents")
print(f"⚠️  Skipped: {skipped_count} agents (already had ACF)")
print(f"📋 Total processed: {len(agent_files)} agents")
print("\nAll agents now have MANDATORY ACF requirements!")