---
command: _mem
description: "Search and recall conversation memories with structured summaries"
arguments: "[search-terms...]"
---

# _mem Command

Search and recall information from previous Claude Code conversations and project memory, returning comprehensive structured summaries rather than raw search results.

## Usage

```
_mem [search-terms...]
_mem database migration decisions
_mem security implementation
_mem authentication setup
_mem agent collaboration issues
```

## Functionality

### Memory Search
- Searches conversation memory files in `/project/memory/data/`
- Searches agent collaboration feeds in `/project/agent-team/pm-agent/`
- Searches project documentation and memos
- Returns comprehensive structured summary with context

### Search Scope
1. **Conversation Files**: `project/memory/data/*.md`
2. **Agent Communications**: `project/agent-team/pm-agent/memos-to-pm/*.md`
3. **Ways of Working**: `project/agent-team/pm-agent/ways-of-working/*.md`
4. **Project Memos**: `project/memos/*.md`
5. **Command Definitions**: `.claude/slash-commands/*.md`
6. **Agent Specifications**: `.claude/agents/*.md`

### Output Format - Structured Summary

The `_mem` command returns a comprehensive summary containing:

#### 1. Search Overview
- Search terms used
- Time range of relevant discussions
- Number of files analyzed
- Total references found
- Primary session information

#### 2. Comprehensive Topic Analysis
For each major topic found:
- **Initial Request**: Original user request or question
- **Key Discussion Points**: All main points discussed
- **Current Implementation State**: What's done vs pending
- **Technical Requirements**: Specific requirements identified

#### 3. Critical Issues & Resolutions
For each issue encountered:
- **What Happened**: Clear description of the issue
- **User Feedback**: Actual quotes from user
- **Root Cause**: Why the issue occurred
- **Resolution Applied**: How it was fixed
- **Lessons Learned**: What to remember

#### 4. Decisions Made
Table format showing:
- Decision description
- Rationale for decision
- Implementation status (✅/⚠️/❌)
- Next steps required

#### 5. Open Actions
Complete action items with:
- Action description
- Owner
- Priority (High/Medium/Low)
- Current blockers
- Estimated effort

#### 6. Risk Assessment
- **High Priority Risks**: Critical issues needing immediate attention
- **Medium Priority Risks**: Important but not urgent
- Each risk includes impact, likelihood, and mitigation strategy

#### 7. Key Source Documents
- Command definitions with paths
- Agent specifications with paths
- Conversation history references
- Brief description of relevance for each

#### 8. Critical Quotes
Actual quotes from conversations with:
- Full quote text
- Source file and line number
- Context of the quote

#### 9. Implementation Timeline
When applicable, shows:
- Weekly breakdown of tasks
- Specific deliverables
- Current progress status

### Interactive Prompt
After displaying the summary, users see:
```
---
## 📖 Would you like more detail?

Type 'yes' to see:
- Complete file contents with line numbers
- Full conversation transcripts
- Detailed technical specifications
- Step-by-step implementation guides
- All error messages and stack traces

Type 'no' to proceed with current summary
```

## Context Awareness
- Maintains search history
- Tracks frequently accessed memories
- Links findings to current task context
- Identifies patterns across conversations

## Integration Points
- Works with `:cx` commands for task-specific memory
- Integrates with agent collaboration feed
- References Ways of Working documents
- Connects to project memory system

## Benefits of Structured Summaries
- **No Information Overload**: Organized presentation instead of raw dumps
- **Decision Tracking**: See what was decided and why
- **Action Visibility**: Clear view of what needs to be done
- **Risk Awareness**: Understand potential problems
- **Context Preservation**: Maintain thread of discussions over time