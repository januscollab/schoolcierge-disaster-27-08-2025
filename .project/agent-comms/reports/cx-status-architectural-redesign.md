# CX Status Command - Complete Architectural Redesign

## Executive Summary
The current cx status implementation has fundamental flaws that cause incorrect task reporting, unwanted auto-remediation, and false health alerts. This redesign addresses all core issues.

## Critical Issues Identified

### 1. **Status Reporting Inaccuracy**
- Tasks marked `completed` with `verified: true` are showing as in-progress
- Tasks with `do_not_revert: true` are being incorrectly modified
- Progress tracking doesn't respect actual task state

### 2. **Auto-Remediation Overreach**
- `fixFalseCompletion()` doesn't check for verification flags
- Health scoring ignores protected task attributes
- Auto-healing runs on EVERY status check causing data corruption

### 3. **False Health Positives**
- Completed tasks trigger "stuck" warnings
- Health scorer doesn't understand task lifecycle
- No differentiation between truly problematic tasks and normal states

### 4. **UI Clutter**
- Categories section adds no value
- Too much visual noise distracts from critical information
- Stuck task warnings aren't integrated into main flow

## Architectural Redesign

### Core Principles
1. **Read-Only by Default** - Status command should NEVER modify data
2. **Respect Verification** - Tasks with `verified` or `do_not_revert` are immutable
3. **Accurate Reporting** - Show what's actually in backlog.json
4. **Focused Display** - Show only critical information
5. **Opt-in Healing** - Separate health checks from status display

## Implementation Changes Required

### 1. New Status Reporter Architecture

```javascript
// New StatusReporter class structure
class StatusReporter {
  constructor(options = {}) {
    this.readonly = options.readonly !== false; // Default true
    this.autoHeal = options.autoHeal === true; // Default false
    this.respectFlags = true; // ALWAYS respect verification flags
  }

  // Core method - NEVER modifies data
  async generateReport() {
    const tasks = this.loadTasks();
    const metrics = this.calculateMetrics(tasks);
    const health = this.assessHealth(tasks);
    
    return {
      metrics,
      health,
      display: this.formatDisplay(metrics, health)
    };
  }

  // Separate healing into explicit command
  async healTasks(options = {}) {
    if (!options.force) {
      console.log('Health check requires --fix flag');
      return;
    }
    
    const tasks = this.loadTasks();
    const issues = this.findHealableIssues(tasks);
    // Only heal tasks WITHOUT protection flags
    const healable = issues.filter(i => !i.task.verified && !i.task.do_not_revert);
    
    return this.applyHealing(healable, options);
  }
}
```

### 2. Accurate Metrics Calculation

```javascript
calculateMetrics(tasks) {
  const metrics = {
    total: tasks.length,
    byStatus: {},
    critical: {
      stuck: [],
      blocked: [],
      needsAttention: []
    }
  };

  tasks.forEach(task => {
    // Use ACTUAL status from backlog.json
    const status = task.status;
    metrics.byStatus[status] = (metrics.byStatus[status] || 0) + 1;
    
    // Identify truly problematic tasks
    if (this.isStuck(task)) {
      metrics.critical.stuck.push(task);
    }
    if (task.status === 'blocked' && !this.hasValidBlockers(task)) {
      metrics.critical.needsAttention.push(task);
    }
  });

  // Calculate REAL completion rate
  metrics.completionRate = (metrics.byStatus.completed / metrics.total * 100).toFixed(1);
  
  return metrics;
}

isStuck(task) {
  // ONLY consider in-progress tasks stuck if:
  // 1. They've been in progress > 7 days with no updates
  // 2. They have 0% progress after 3 days
  // 3. NOT if they're completed or verified
  
  if (task.status === 'completed') return false;
  if (task.verified || task.do_not_revert) return false;
  if (task.status !== 'in-progress') return false;
  
  const daysSinceUpdate = this.daysSince(task.updated_at);
  const daysSinceStart = this.daysSince(task.started_at);
  
  return (daysSinceUpdate > 7) || 
         (daysSinceStart > 3 && task.progress === 0);
}
```

### 3. Simplified Display Format

```javascript
displayStatus(metrics, health) {
  // Header
  console.log('SCHOOLCIERGE TASK STATUS');
  console.log('========================\n');
  
  // Overall Progress Bar (single line)
  console.log(`Progress: ${this.progressBar(metrics.completionRate)} ${metrics.byStatus.completed}/${metrics.total} tasks`);
  console.log();
  
  // Active Work (what matters NOW)
  if (metrics.byStatus['in-progress'] > 0) {
    console.log('ACTIVE TASKS:');
    metrics.inProgressTasks.forEach(task => {
      console.log(`  ${task.id}: ${task.title} [${task.progress}%]`);
    });
    console.log();
  }
  
  // Blocked Tasks (actionable items)
  if (metrics.critical.blocked.length > 0) {
    console.log('BLOCKED:');
    metrics.critical.blocked.forEach(task => {
      console.log(`  ${task.id}: Waiting on ${task.dependencies.blocked_by.join(', ')}`);
    });
    console.log();
  }
  
  // Critical Issues (integrated, not separate)
  if (health.criticalCount > 0) {
    console.log(`⚠️  ${health.criticalCount} tasks need attention:`);
    health.critical.forEach(issue => {
      console.log(`  ${issue.task.id}: ${issue.reason}`);
    });
    console.log();
  }
  
  // Summary Stats (one line)
  console.log(`Completed: ${metrics.byStatus.completed} | In Progress: ${metrics.byStatus['in-progress']} | Ready: ${metrics.byStatus.ready || 0} | Not Started: ${metrics.byStatus['not-started']}`);
}
```

### 4. Separate Health Command

```javascript
// cx health - read-only health check
// cx health --fix - apply remediation with safeguards

class HealthChecker {
  async check(options = {}) {
    const tasks = this.loadTasks();
    const issues = [];
    
    for (const task of tasks) {
      // SKIP protected tasks
      if (task.verified || task.do_not_revert) continue;
      
      const taskIssues = this.analyzeTask(task);
      issues.push(...taskIssues);
    }
    
    if (options.fix) {
      return this.applyFixes(issues, options);
    }
    
    return this.reportIssues(issues);
  }
  
  analyzeTask(task) {
    const issues = [];
    
    // Only flag REAL problems
    if (task.status === 'completed' && !this.hasImplementation(task)) {
      issues.push({
        type: 'no_implementation',
        task,
        severity: 'high',
        confidence: 0.9
      });
    }
    
    if (task.status === 'in-progress' && this.isStuck(task)) {
      issues.push({
        type: 'stuck',
        task,
        severity: 'medium',
        confidence: 0.7
      });
    }
    
    return issues;
  }
}
```

### 5. Command Separation

```bash
# Status - ALWAYS read-only, fast, accurate
cx status

# Health check - separate concern
cx health         # Check only
cx health --fix   # Apply fixes (with confirmation)

# Integrity - deep validation
cx integrity      # Check data integrity
cx integrity --fix # Fix data issues
```

## File Changes Required

### 1. `/Users/alanmahon/dev.env/projects/schoolcierge/.project/scripts/status-report-sexy.js`

**Major Changes:**
- Remove ALL auto-healing from `run()` method
- Fix metrics calculation to use actual status
- Remove categories section
- Integrate stuck task warnings into main display
- Add protection for verified/do_not_revert flags

### 2. `/Users/alanmahon/dev.env/projects/schoolcierge/.project/scripts/auto-remediation.js`

**Major Changes:**
- Add flag checking to EVERY fix method
- Never modify tasks with `verified: true` or `do_not_revert: true`
- Require explicit `--fix` flag for any modifications
- Add dry-run by default

### 3. `/Users/alanmahon/dev.env/projects/schoolcierge/.project/scripts/task-health-monitor.js`

**Major Changes:**
- Fix stuck task detection logic
- Respect completed status
- Add time-based thresholds
- Skip protected tasks

### 4. `/Users/alanmahon/dev.env/projects/schoolcierge/package.json`

**Add Scripts:**
```json
{
  "scripts": {
    "status": "node .project/scripts/status-report-sexy.js --readonly",
    "health": "node .project/scripts/health-check.js",
    "health:fix": "node .project/scripts/health-check.js --fix"
  }
}
```

## Immediate Actions

1. **DISABLE auto-healing in status command** - This is corrupting data
2. **Add flag protection** - Never modify verified tasks
3. **Fix status calculation** - Show actual task states
4. **Separate concerns** - Status vs Health vs Integrity

## Expected Outcomes

After implementation:
- `cx status` will show ACCURATE task states
- Completed tasks will stay completed
- Health checks won't corrupt data
- Display will be concise and focused
- No false positives for stuck tasks

## Risk Mitigation

1. **Backup before any healing** - Always create backlog.backup.json
2. **Confirmation prompts** - Require user confirmation for fixes
3. **Audit trail** - Log all modifications with reasons
4. **Rollback capability** - Keep last 5 backups

## Testing Requirements

1. Verify status shows correct counts
2. Confirm verified tasks are never modified
3. Test health check identifies only real issues
4. Validate stuck detection time thresholds
5. Ensure no data corruption on status display

## Rollout Plan

1. **Phase 1:** Fix status display (read-only)
2. **Phase 2:** Separate health command
3. **Phase 3:** Add protection flags throughout
4. **Phase 4:** Implement new stuck detection
5. **Phase 5:** Remove categories, simplify UI

---

**Priority:** CRITICAL
**Estimated Time:** 2-3 hours
**Risk:** HIGH (current system corrupting data)
**Impact:** Restores trust in task management system