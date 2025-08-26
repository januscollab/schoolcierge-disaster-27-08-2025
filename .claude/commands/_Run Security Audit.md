---
allowed-tools: Read, Write, Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(date:*)
description: Run security audit, display critical findings, and generate PM MEMO
---

## Context
- Current date: !`date "+%d%m%y"`
- Recent changes: !`git diff HEAD~1`
- Modified files: !`git status --porcelain`
- Current branch: !`git branch --show-current`
- Last commit: !`git log -1 --oneline`

## Task for Security Agent and Solution Architect

### 1. INVOKE SECURITY AGENT
Perform a thorough security analysis focusing on:
- **Authentication & Authorization**: Review access controls, token handling, session management
- **Input Validation**: Check all user inputs, API endpoints, form submissions
- **Data Protection**: Analyze encryption at rest/transit, PII handling, secrets management
- **Injection Vulnerabilities**: SQL, NoSQL, Command, XSS, XXE attacks
- **Dependencies**: Review third-party libraries for known CVEs
- **API Security**: Rate limiting, CORS policies, endpoint exposure
- **Error Handling**: Information disclosure through error messages
- **Logging & Monitoring**: Sensitive data in logs, audit trail completeness

### 2. INVOKE SOLUTION ARCHITECT
Review architectural security implications:
- **Network Security**: Firewall rules, network segmentation, TLS configuration
- **Infrastructure Security**: Container security, cloud permissions, IAM policies
- **Data Flow**: Identify trust boundaries and data validation points
- **Compliance**: GDPR, HIPAA, PCI-DSS, SOC2 requirements if applicable
- **Disaster Recovery**: Backup security, recovery procedures
- **Scalability Impact**: Security implications of scaling patterns
- **Integration Points**: Third-party service security, API gateway configuration

## Actions Required

1. DISPLAY ON SCREEN - Critical findings that need immediate attention:

### 🔴 CRITICAL FINDINGS & IMMEDIATE ACTIONS
[Display immediately actionable items]
- **Critical Vulnerabilities Found**: [Yes/No]
- **Immediate Actions Required**: [List]
- **Files Requiring Attention**: [List]
- **Commands to Run Now**: [If any]

### 🚨 HIGH-PRIORITY ITEMS
[Display items needing quick attention]
- **Security Issues**: [List]
- **Implementation Gaps**: [List]
- **Configuration Problems**: [List]

### ⚡️ QUICK WINS
[Display easy-to-implement improvements]
- **Simple Fixes**: [List with time estimates]
- **Configuration Updates**: [List]
- **Package Updates**: [List]

2. WRITE SECURITY AUDIT MEMO:
- Directory: `/Users/alanmahon/dev.env/projects/schoolcierge/project/agent-team/pm-agent/memos-to-pm/`
- Filename: `MEMO-[id]-SECURITY-AUDIT-[branch/taskid]-[DDMMYY].md`

### MEMO Format
```markdown
# MEMO-[id]: Security Audit Report - [branch/task]

**Date:** [DD/MM/YYYY]  
**Memo ID:** MEMO-[id]  
**Participants:** Security Agent & Solution Architect  
**Status:** Final  
**Priority:** High  

---

## Executive Summary
[2-3 paragraph overview of security status, critical findings, immediate needs]

## Discussion Context
### Background
[Current security posture, recent changes, scope of audit]

### Objectives
[What was reviewed, specific focus areas]

## Key Topics 

### Critical Security Findings
**Vulnerabilities:**
- [Details of each finding]
- [Impact assessment]
- [Exploitation risk]

**Architecture Concerns:**
- [Infrastructure issues]
- [Design weaknesses]
- [Configuration risks]

### Technical Analysis
```[language]
[Relevant code snippets, configs, or logs]
```

## Decisions Made

| Decision ID | Security Decision | Rationale | Impact |
|------------|----------|-----------|---------|
| D001 | [Required change] | [Why] | [Effect] |

## Action Items

| Action ID | Security Task | Owner | Due Date | Priority |
|-----------|-------------|--------|----------|----------|
| A001 | [Action needed] | [Who] | [When] | [H/M/L] |

## Risk Assessment

| Risk | Description | Likelihood | Impact | Mitigation |
|------|-------------|------------|---------|------------|
| R001 | [Risk name] | [H/M/L] | [H/M/L] | [Strategy] |

## Implementation Plan

### Immediate Actions (24-48 hours)
1. [Critical fix details]
2. [Urgent update needed]

### Short-term Improvements (1-2 weeks)
- [Security enhancement]
- [Configuration update]

### Long-term Security Strategy
- [Architectural improvements]
- [Process changes]
- [Tool adoption]

## References
- Changed files: [list]
- Security standards: [list]
- Best practices: [list]

---

## Metadata
**Prepared By:** Security Agent & Solution Architect  
**Review Status:** Ready for PM Review  
**Version:** 1.0  
**Classification:** Confidential  

## Sign-off
- [ ] Critical Findings Verified
- [ ] Solution Architect Review
- [ ] Security Team Approval
- [ ] PM Notification Required
```

3. DISPLAY CONFIRMATION
- Show: "Security audit complete. Critical findings displayed above."
- Show: "Full security audit MEMO written to: [path]"
- Show: "Review findings and request any needed updates to the MEMO."

## 4. UPDATE ACF WITH COMPLETION SUMMARY

After completing all security audit tasks, add this entry to the Agent Collaboration Feed:

**File:** `/Users/alanmahon/dev.env/projects/schoolcierge/project/agent-team/pm-agent/agents-collaboration-feed.md`

**Add this entry at the top of the feed:**

```markdown
## [YYYY-MM-DD HH:MM GST] - Security Audit Command - SEC-AUDIT-[DDMMYY]
- **Action:** Completing
- **Task:** Security audit and MEMO generation for [branch/taskid]
- **Progress:** 100%
- **Status:** Success
- **Details:** Comprehensive security analysis completed with both Security Agent and Solution Architect
- **Critical Findings:** [Yes/No - if Yes, list top 3]
- **Files Modified:** 
  - Security MEMO: `/project/agent-team/pm-agent/memos-to-pm/MEMO-[id]-SECURITY-AUDIT-[branch/taskid]-[DDMMYY].md`
  - [List any other files modified during audit]
- **Tests Run:** Security vulnerability scan, dependency check, configuration review
- **Next Steps:** 
  - PM review of critical findings
  - Implementation of immediate fixes if any
  - Schedule follow-up security actions
- **Dependencies:** [List any blocking issues found]
- **Time Spent:** [Actual time from start to finish]
- **Notes:** [Key insights, warnings, or recommendations for PM attention]
```

**Instructions for ACF Update:**
1. Replace [YYYY-MM-DD HH:MM GST] with current timestamp
2. Replace [DDMMYY] with today's date
3. Replace [branch/taskid] with actual branch name or task ID
4. Replace [id] with the actual MEMO ID used
5. Fill in actual critical findings status and details
6. List actual files modified during the audit process
7. Include actual time spent on the audit
8. Add specific notes about urgent items requiring immediate PM attention

$ARGUMENTS