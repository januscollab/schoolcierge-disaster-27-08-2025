# CX Status Command - Specific Implementation Fixes

## IMMEDIATE CODE CHANGES NEEDED

### Fix 1: Disable Auto-Healing in Status Command

**File:** `/Users/alanmahon/dev.env/projects/schoolcierge/.project/scripts/status-report-sexy.js`

**Lines to REMOVE (498-587):**
```javascript
// DELETE THIS ENTIRE BLOCK
async run(format = 'interactive') {
    // Comprehensive auto-healing system
    if (format === 'interactive') {
      console.log(chalk.cyan('\n🏥 Comprehensive Health Check & Auto-Healing...'));
      // ... ALL auto-healing code ...
    }
```

**REPLACE WITH:**
```javascript
async run(format = 'interactive') {
    // NO AUTO-HEALING - Status is read-only
    switch (format) {
      case 'json':
        const metrics = this.calculateMetrics();
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          metrics: metrics,
          summary: {
            total_tasks: metrics.total,
            completion_percentage: parseFloat(metrics.completionRate),
            tasks_in_progress: metrics.byStatus['in-progress'],
            tasks_blocked: metrics.byStatus.blocked,
            daily_velocity: metrics.velocity.daily
          }
        }, null, 2));
        break;
        
      case 'html':
        const htmlMetrics = this.calculateMetrics();
        const html = this.generateHTMLDashboard(htmlMetrics);
        fs.writeFileSync(this.dashboardPath, html);
        console.log(chalk.green(`✅ Dashboard generated: ${this.dashboardPath}`));
        console.log(chalk.cyan(`📊 Open in browser: file://${path.resolve(this.dashboardPath)}`));
        break;
        
      case 'markdown':
        const mdMetrics = this.calculateMetrics();
        const markdown = this.generateMarkdownReport(mdMetrics);
        console.log(markdown);
        fs.writeFileSync(this.progressPath, markdown);
        console.log(`\n✅ Progress report saved to: ${this.progressPath}`);
        break;
        
      default:
        await this.runInteractive();
    }
}
```

### Fix 2: Update calculateMetrics to Show Actual Status

**File:** `/Users/alanmahon/dev.env/projects/schoolcierge/.project/scripts/status-report-sexy.js`

**Lines 73-138 - REPLACE calculateMetrics():**
```javascript
calculateMetrics() {
    const tasks = this.loadTasks();
    const metrics = {
      total: tasks.length,
      byStatus: {
        'not-started': 0,
        'ready': 0,
        'in-progress': 0,
        'blocked': 0,
        'completed': 0
      },
      byPriority: { P0: 0, P1: 0, P2: 0, P3: 0 },
      completionRate: 0,
      blockedTasks: [],
      inProgressTasks: [],
      averageProgress: 0,
      velocity: {
        daily: 0,
        weekly: 0
      },
      stuckTasks: [] // New: properly identified stuck tasks
    };

    if (tasks.length === 0) {
      return metrics;
    }

    tasks.forEach(task => {
      // Use ACTUAL status from task, don't recalculate
      const status = task.status;
      metrics.byStatus[status] = (metrics.byStatus[status] || 0) + 1;
      
      metrics.byPriority[task.priority] = (metrics.byPriority[task.priority] || 0) + 1;
      
      if (status === 'blocked') {
        metrics.blockedTasks.push({
          id: task.id,
          title: task.title,
          blockedBy: task.dependencies?.blocked_by || []
        });
      }
      
      if (status === 'in-progress') {
        metrics.inProgressTasks.push({
          id: task.id,
          title: task.title,
          progress: task.progress || 0
        });
        
        // Check if truly stuck (not verified tasks)
        if (!task.verified && !task.do_not_revert) {
          const daysSinceUpdate = this.getDaysSince(task.updated_at);
          const daysSinceStart = this.getDaysSince(task.started_at);
          
          if (daysSinceUpdate > 7 || (daysSinceStart > 3 && task.progress === 0)) {
            metrics.stuckTasks.push({
              id: task.id,
              title: task.title,
              reason: daysSinceUpdate > 7 ? `No updates for ${daysSinceUpdate} days` : 'No progress after 3 days'
            });
          }
        }
      }
      
      // Only count progress for non-completed tasks
      if (status !== 'completed') {
        metrics.averageProgress += task.progress || 0;
      }
    });

    // Calculate ACTUAL completion rate
    metrics.completionRate = tasks.length > 0 
      ? (metrics.byStatus.completed / tasks.length * 100).toFixed(1) 
      : 0;
    
    // Calculate average progress only for in-progress tasks
    if (metrics.byStatus['in-progress'] > 0) {
      metrics.averageProgress = Math.round(metrics.averageProgress / metrics.byStatus['in-progress']);
    } else {
      metrics.averageProgress = 0;
    }

    // Velocity calculations remain the same
    const completedTasks = tasks.filter(t => t.status === 'completed');
    if (completedTasks.length > 0) {
      const dates = completedTasks.map(t => new Date(t.completed_at)).filter(d => !isNaN(d.getTime()));
      if (dates.length > 0) {
        const daysSinceFirst = (Date.now() - Math.min(...dates)) / (1000 * 60 * 60 * 24);
        metrics.velocity.daily = daysSinceFirst > 0 ? (completedTasks.length / daysSinceFirst).toFixed(1) : 0;
        metrics.velocity.weekly = (metrics.velocity.daily * 7).toFixed(1);
      }
    }

    return metrics;
}

getDaysSince(dateString) {
    if (!dateString) return 0;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 0;
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}
```

### Fix 3: Remove Categories Section from Display

**File:** `/Users/alanmahon/dev.env/projects/schoolcierge/.project/scripts/status-report-sexy.js`

**Lines 293-315 - DELETE entire Categories section:**
```javascript
// DELETE THIS ENTIRE BLOCK
if (Object.keys(metrics.byCategory).length > 0) {
    console.log(this.brandGradient('\n━━━ CATEGORIES ━━━\n'));
    // ... all category display code ...
}
```

### Fix 4: Add Stuck Tasks to Main Display

**File:** `/Users/alanmahon/dev.env/projects/schoolcierge/.project/scripts/status-report-sexy.js`

**After line 356 (blocked tasks), ADD:**
```javascript
// Display stuck tasks if any
if (metrics.stuckTasks && metrics.stuckTasks.length > 0) {
    console.log(this.warningGradient('\n━━━ TASKS NEEDING ATTENTION ━━━\n'));
    
    metrics.stuckTasks.forEach(task => {
      console.log(
        chalk.bold.yellow(`  ⚠️  ${task.id}: `) +
        chalk.white(task.title.substring(0, 50)) +
        chalk.gray(` - ${task.reason}`)
      );
    });
}
```

### Fix 5: Add Protection to Auto-Remediation

**File:** `/Users/alanmahon/dev.env/projects/schoolcierge/.project/scripts/auto-remediation.js`

**Line 94, in fixFalseCompletion(), ADD at beginning:**
```javascript
async fixFalseCompletion(task, issue, config) {
    // NEVER modify verified or protected tasks
    if (task.verified || task.do_not_revert) {
      console.log(chalk.gray(`⛔ Skipping protected task: ${task.id}`));
      return {
        success: false,
        type: 'falseCompletion',
        action: 'Skipped - task is protected',
        protected: true
      };
    }
    
    console.log(chalk.yellow(`🔧 Fixing false completion: ${task.id}`));
    // ... rest of method
```

**Apply same protection to ALL fix methods:**
- `fixStuckTask()` - line 154
- `fixInvalidBlocked()` - line 206
- `fixMissingImplementation()` - line 252
- `fixProgressMismatch()` - line 338
- `fixLowProgress()` - line 393
- `fixStaleTask()` - line 432

### Fix 6: Create Separate Health Command

**Create NEW file:** `/Users/alanmahon/dev.env/projects/schoolcierge/.project/scripts/health-check.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const AutoRemediationEngine = require('./auto-remediation');
const TaskHealthMonitor = require('./task-health-monitor');

class HealthChecker {
  constructor() {
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.monitor = new TaskHealthMonitor();
    this.remediation = new AutoRemediationEngine();
  }

  async run() {
    const args = process.argv.slice(2);
    const shouldFix = args.includes('--fix');
    
    if (shouldFix) {
      console.log(chalk.yellow('⚠️  Health check with auto-fix enabled'));
      console.log(chalk.yellow('This will modify your backlog.json file.'));
      console.log(chalk.yellow('Protected tasks (verified/do_not_revert) will be skipped.\n'));
      
      // Add confirmation prompt here if desired
    }
    
    const spinner = ora('Checking task health...').start();
    
    try {
      const tasks = JSON.parse(fs.readFileSync(this.tasksPath, 'utf8'));
      const issues = [];
      
      for (const task of tasks) {
        // SKIP protected tasks
        if (task.verified || task.do_not_revert) {
          continue;
        }
        
        const taskIssues = this.monitor.detectHealthIssues(task);
        issues.push(...taskIssues.map(i => ({ ...i, task })));
      }
      
      spinner.succeed(`Found ${issues.length} health issues`);
      
      if (issues.length === 0) {
        console.log(chalk.green('✅ All tasks are healthy!'));
        return;
      }
      
      // Display issues
      console.log('\nHealth Issues Found:');
      issues.forEach(issue => {
        const severity = issue.severity === 'critical' ? chalk.red('CRITICAL') :
                        issue.severity === 'high' ? chalk.yellow('HIGH') :
                        chalk.blue('MEDIUM');
        console.log(`  ${severity} - ${issue.task.id}: ${issue.message}`);
      });
      
      if (shouldFix) {
        console.log('\n' + chalk.cyan('Applying auto-remediation...'));
        
        let fixedCount = 0;
        for (const issue of issues) {
          const result = await this.remediation.remediate(
            issue.task,
            [issue],
            { dryRun: false, safeMode: true, maxAutoFixes: 1 }
          );
          
          if (result.success) {
            fixedCount += result.applied.length;
            console.log(chalk.green(`  ✅ Fixed: ${issue.task.id} - ${result.applied[0].action}`));
          }
        }
        
        console.log('\n' + chalk.green(`✨ Fixed ${fixedCount} issues`));
      } else {
        console.log('\n' + chalk.gray('Run "cx health --fix" to apply auto-remediation'));
      }
      
    } catch (error) {
      spinner.fail('Health check failed');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  }
}

const checker = new HealthChecker();
checker.run().catch(console.error);
```

### Fix 7: Update Package.json Scripts

**File:** `/Users/alanmahon/dev.env/projects/schoolcierge/package.json`

**In scripts section, UPDATE:**
```json
{
  "scripts": {
    "status": "node .project/scripts/status-report-sexy.js",
    "health": "node .project/scripts/health-check.js",
    "health:fix": "node .project/scripts/health-check.js --fix",
    // ... other scripts remain unchanged
  }
}
```

### Fix 8: Update cx Command Mappings

**File:** `/Users/alanmahon/dev.env/projects/schoolcierge/cx`

**Lines 42-44, REPLACE:**
```javascript
// Task health monitoring - SEPARATED
'health': 'npm run health',
'health-fix': 'npm run health:fix',
'health-check': 'npm run health',
```

## Testing Checklist

After implementing these fixes:

1. **Run `cx status`** - Should show:
   - Correct completion count (tasks marked completed in backlog.json)
   - No auto-healing messages
   - No categories section
   - Stuck tasks integrated in main display

2. **Check specific tasks:**
   ```bash
   cx status TASK-009  # Should show as completed if marked completed in backlog
   cx status TASK-010  # Should show actual status from backlog
   cx status TASK-047  # Should show as completed
   ```

3. **Run `cx health`** - Should:
   - Only analyze, not modify
   - Skip verified tasks
   - Show issues without fixing

4. **Run `cx health --fix`** - Should:
   - Ask for confirmation
   - Skip protected tasks
   - Only fix real issues

5. **Verify no data corruption:**
   - Tasks with `verified: true` remain unchanged
   - Tasks with `do_not_revert: true` remain unchanged
   - Completed tasks stay completed

## Emergency Rollback

If issues persist after fixes:

1. Restore backup:
   ```bash
   cp .project/tasks/backlog.backup.json .project/tasks/backlog.json
   ```

2. Disable all auto-healing:
   ```bash
   # Comment out all remediation code in status-report-sexy.js
   # Set all auto-remediation to dry-run mode
   ```

3. Use simple status:
   ```bash
   node .project/scripts/task-manager.js list
   ```

---

**Implementation Time:** 30-45 minutes
**Testing Time:** 15-20 minutes
**Risk Level:** LOW (with backups)
**Priority:** CRITICAL - Do this NOW before more data corruption