---
allowed-tools: Read, Write, Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(date:*)
description: Generate task completion MEMO for PM Agent
---

## Context
- Current date: !`date "+%d%m%y"`
- Git branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -3`
- Changed files: !`git status --porcelain`

## Generate Task Completion MEMO

You must create a task completion MEMO and save it to the PM memos directory:

### File Location
- Directory: `/Users/alanmahon/dev.env/projects/schoolcierge/project/agent-team/pm-agent/memos-to-pm/`
- Filename: `MEMO-[id]-TASK-[taskid]-COMPLETION-REPORT-[DDMMYY].md`
  - [id]: Next sequential MEMO ID
  - [taskid]: Task ID from branch name or context
  - [DDMMYY]: Today's date

### MEMO Format

```markdown
# MEMO-[id]: Task [taskid] Completion Report

**Date:** [DD/MM/YYYY]  
**Memo ID:** MEMO-[id]  
**Participants:** Claude Code Agent & PM Agent  
**Status:** Final  
**Priority:** High  

---

## Executive Summary
[2-3 paragraph overview of task completion, key decisions, critical outcomes]

## Discussion Context
### Background
[Task objectives, requirements, constraints]

### Objectives
[Specific goals achieved]

## Key Topics 

### Implementation Details
**Discussion Points:**
- [Major implementation decisions]
- [Technical approach used]
- [Key challenges overcome]
- [Design patterns applied]

**Technical Specifications:**
```[language]
[Relevant code snippets or configurations]
```

### Testing & Validation
**Completed Steps:**
- [Test coverage]
- [Manual testing]
- [Integration validation]
- [Performance checks]

## Decisions Made

| Decision ID | Decision | Rationale | Impact |
|------------|----------|-----------|---------|
| D001 | [Technical choice] | [Why] | [Result] |

## Action Items

| Action ID | Description | Owner | Due Date | Priority |
|-----------|-------------|--------|----------|----------|
| A001 | [Next step] | [Who] | [When] | [Priority] |

## Risk Assessment

| Risk | Description | Likelihood | Impact | Mitigation |
|------|-------------|------------|---------|------------|
| R001 | [Risk name] | [H/M/L] | [H/M/L] | [Strategy] |

## Follow-up Requirements

### Immediate Next Steps
1. [Critical next action]
2. [Important follow-up]

### Future Considerations
- [Technical debt]
- [Scalability needs]
- [Security reviews]

## Assumptions & Constraints
- [Technical assumptions]
- [Resource constraints]
- [Timeline factors]

## References
- Changed files: [list]
- Related MEMOs: [links]
- Documentation: [links]

---

## Metadata
**Prepared By:** Claude Code Agent  
**Review Status:** Ready for PM Review  
**Version:** 1.0  
**Distribution:** PM Agent Team  

## Sign-off
- [ ] Code Review Complete
- [ ] Tests Passing
- [ ] Documentation Updated
- [ ] No Breaking Changes
```

### Instructions

1. Use git context to fill in:
   - Task ID from branch name
   - Modified files
   - Implementation decisions
   - Technical details

2. Be specific about:
   - Actual work completed
   - Real test results
   - Concrete next steps
   - Known risks

3. After saving the MEMO:
   - Confirm successful save
   - Display: "Task completion MEMO saved to: [path]"
   - Highlight critical items for PM attention

## 4. UPDATE ACF WITH COMPLETION SUMMARY

After completing MEMO generation, add this entry to the Agent Collaboration Feed:

**File:** `/Users/alanmahon/dev.env/projects/schoolcierge/project/agent-team/pm-agent/agents-collaboration-feed.md`

**Add this entry at the top of the feed:**

```markdown
## [YYYY-MM-DD HH:MM GST] - Task Completion Command - [TASK-ID]
- **Action:** Completing
- **Task:** Task completion MEMO generation for [TASK-ID]
- **Progress:** 100%
- **Status:** Success
- **Details:** Generated comprehensive task completion documentation and PM MEMO
- **Task Outcome:** [Success/Partial/Blocked - brief description]
- **Files Modified:** 
  - Task Completion MEMO: `/project/agent-team/pm-agent/memos-to-pm/MEMO-[id]-TASK-[taskid]-COMPLETION-REPORT-[DDMMYY].md`
  - [List any other files modified during task]
- **Tests Run:** [Summary of tests executed during task completion]
- **Next Steps:** 
  - PM review and approval of task completion
  - [List immediate follow-up actions]
  - [Identify next tasks or handoffs needed]
- **Dependencies:** [What this unblocks or what still blocks progress]
- **Time Spent:** [Total time spent on task completion]
- **Notes:** [Critical items for PM attention, technical debt, risks identified]
```

**Instructions for ACF Update:**
1. Replace [YYYY-MM-DD HH:MM GST] with current timestamp
2. Replace [TASK-ID] with actual task ID from branch or context
3. Replace [id] with the actual MEMO ID used
4. Replace [taskid] and [DDMMYY] with actual values
5. Fill in actual task outcome status and description
6. List all files actually modified during task execution
7. Include summary of any tests that were run
8. Document actual next steps and dependencies
9. Include actual time spent on the complete task
10. Add specific notes about critical items requiring immediate PM attention

$ARGUMENTS