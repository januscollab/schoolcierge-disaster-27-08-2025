---
allowed-tools: Read, Write, Bash(npm test:*), Task, Grep, mcp__context7__resolve-library-id, mcp__context7__get-library-docs
description: Engage test automation agent to build and run tests for current task
---

## Context
- Current date: !`date "+%d%m%y"`
- Git branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -3`
- Changed files: !`git status --porcelain`

## Task for Test Automation Agent

You must invoke the test automation agent to perform comprehensive test coverage for the current task:

### Test Planning & Research
1. Analyze current code and changes
2. Research best practices from Context7 libraries
3. Review existing test patterns in codebase
4. Identify critical test scenarios

### Test Implementation
1. Generate appropriate test cases:
   - Unit tests
   - Integration tests
   - End-to-end tests (if applicable)
   - Edge cases and error conditions

2. Follow testing best practices:
   - Descriptive test names
   - Proper assertions
   - Mocking/stubbing where needed
   - Error handling
   - Clean setup/teardown

3. Structure tests according to codebase conventions:
   - Test file organization
   - Naming patterns
   - Common utilities
   - Shared fixtures

### Test Execution
1. Run newly created tests
2. Verify test coverage
3. Address any failures
4. Document test results

## Required Output

Generate a test report memo:

### File Requirements
- Directory: `/project/agent-team/pm-agent/memos-to-pm/`
- Filename: `MEMO-[id]-TASK-[taskid]-TEST-REPORT-[DDMMYY].md`
  - [id]: Next sequential MEMO ID
  - [taskid]: Task ID from branch name
  - [DDMMYY]: Today's date

### MEMO Format
```markdown
# MEMO-[id]: Test Report for Task [taskid]

**Date:** [DD/MM/YYYY]  
**Memo ID:** MEMO-[id]  
**Participants:** Test Automation Agent & PM Agent  
**Status:** Final  
**Priority:** High  

---

## Executive Summary
[Overview of testing scope and results]

## Test Implementation
### Test Cases Added
- Unit tests: [count]
- Integration tests: [count]
- E2E tests: [count]

### Coverage Analysis
- Lines: [percentage]
- Functions: [percentage]
- Branches: [percentage]
- Statements: [percentage]

### Key Test Scenarios
1. [Scenario description]
   - Expected behavior
   - Edge cases covered
   - Error conditions

## Test Results
### Test Execution Summary
- Total tests: [count]
- Passed: [count]
- Failed: [count]
- Skipped: [count]

### Test Output
```[test output]```

## Issues & Recommendations
### Issues Found
- [List any bugs or issues discovered]

### Improvement Suggestions
- [Recommendations for code improvements]
- [Suggestions for additional test coverage]

## Follow-up Requirements
1. [Immediate fixes needed]
2. [Future test improvements]
3. [Technical debt items]

---

## Metadata
**Prepared By:** Test Automation Agent  
**Review Status:** Ready for PM Review  
**Version:** 1.0  
```

## Important Instructions

1. Research testing best practices:
   - Use Context7 to check current best practices
   - Review relevant library documentation
   - Identify appropriate testing patterns

2. Generate comprehensive tests:
   - Follow codebase conventions
   - Use appropriate testing frameworks
   - Include proper error handling
   - Add clear documentation

3. Execute tests and create report:
   - Run full test suite
   - Capture all results
   - Document any issues
   - Make clear recommendations

## 4. UPDATE ACF WITH COMPLETION SUMMARY

After completing all test automation tasks, add this entry to the Agent Collaboration Feed:

**File:** `/Users/alanmahon/dev.env/projects/schoolcierge/project/agent-team/pm-agent/agents-collaboration-feed.md`

**Add this entry at the top of the feed:**

```markdown
## [YYYY-MM-DD HH:MM GST] - Test Automation Command - [TASK-ID]
- **Action:** Completing
- **Task:** Test automation and coverage analysis for [TASK-ID]
- **Progress:** 100%
- **Status:** Success
- **Details:** Comprehensive test suite created and executed by Test Automation Agent
- **Test Results:** [Total: X, Passed: Y, Failed: Z] - [Success Rate: XX%]
- **Coverage:** Lines: XX%, Functions: XX%, Branches: XX%, Statements: XX%
- **Files Modified:** 
  - Test Report MEMO: `/project/agent-team/pm-agent/memos-to-pm/MEMO-[id]-TASK-[taskid]-TEST-REPORT-[DDMMYY].md`
  - Test files: [List all test files created or modified]
  - [Any other files modified during testing]
- **Tests Run:** Unit tests, Integration tests, E2E tests (if applicable)
- **Issues Found:** [Number of bugs/issues discovered during testing]
- **Next Steps:** 
  - PM review of test results and coverage
  - Address any test failures or issues found
  - [List specific follow-up actions needed]
- **Dependencies:** [Any blockers identified during testing]
- **Time Spent:** [Total time spent on test creation and execution]
- **Notes:** [Critical test failures, coverage gaps, recommendations for PM attention]
```

**Instructions for ACF Update:**
1. Replace [YYYY-MM-DD HH:MM GST] with current timestamp
2. Replace [TASK-ID] with actual task ID from branch or context
3. Replace [id] with the actual MEMO ID used
4. Replace [taskid] and [DDMMYY] with actual values
5. Fill in actual test results (totals, pass/fail counts, success rate)
6. Include actual coverage percentages from test execution
7. List all test files created or modified during the process
8. Document the number and nature of any issues discovered
9. Include actual time spent on complete test automation process
10. Add specific notes about critical test failures or coverage concerns requiring immediate PM attention

$ARGUMENTS