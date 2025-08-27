#!/usr/bin/env node

/**
 * Task Health Monitor
 * Detects stuck, stalled, and problematic tasks
 * Provides automatic escalation and remediation
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const boxen = require('boxen');
const gradient = require('gradient-string');
const ora = require('ora');
const { logEvent } = require('./event-ticker');
const IntegrityChecker = require('./integrity-checker');

class TaskHealthMonitor {
  constructor() {
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.eventsPath = path.join(__dirname, '../tasks/events.jsonl');
    this.tasks = [];
    this.creaiteGradient = gradient(['#40E0D0', '#FFD700', '#40E0D0']);
    this.checker = new IntegrityChecker();
    this.thresholds = {
      stuckHours: 2,           // Task stuck if no progress for 2 hours
      staleDays: 3,            // Task stale if no update for 3 days
      lowProgressDays: 7,      // Task problematic if <20% progress after 7 days
      noImplementationDays: 1, // Task needs attention if no files created after 1 day
    };
  }

  loadTasks() {
    try {
      this.tasks = JSON.parse(fs.readFileSync(this.tasksPath, 'utf8'));
    } catch (error) {
      console.error(chalk.red('Failed to load tasks:'), error.message);
      process.exit(1);
    }
  }

  saveTasks() {
    try {
      fs.writeFileSync(this.tasksPath, JSON.stringify(this.tasks, null, 2));
    } catch (error) {
      console.error(chalk.red('Failed to save tasks:'), error.message);
    }
  }

  getTaskAge(task) {
    if (!task.started_at) return 0;
    return (Date.now() - new Date(task.started_at).getTime()) / (1000 * 60 * 60); // hours
  }

  getTimeSinceUpdate(task) {
    const lastUpdate = task.updated_at || task.started_at;
    if (!lastUpdate) return 0;
    return (Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60); // hours
  }

  hasImplementation(task) {
    return (task.implementation_notes?.files_to_create?.length > 0) ||
           (task.implementation_notes?.files_to_modify?.length > 0);
  }
  
  checkIfRecentlyReverted(task) {
    // Check if this task was recently reverted from false completion
    // Look for recent remediation events in the last hour
    try {
      const events = fs.readFileSync(this.eventsPath, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line))
        .reverse(); // Most recent first
      
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      
      for (const event of events) {
        if (new Date(event.timestamp).getTime() < oneHourAgo) break;
        
        if (event.type === 'task_health_remediation' && 
            event.data?.taskId === task.id &&
            event.data?.action === 'revert_completion') {
          return true;
        }
      }
    } catch (error) {
      // Silent fail
    }
    
    return false;
  }

  detectHealthIssues(task) {
    const issues = [];
    const age = this.getTaskAge(task);
    const timeSinceUpdate = this.getTimeSinceUpdate(task);
    
    // Check if this was recently reverted from false completion
    const wasRecentlyReverted = this.checkIfRecentlyReverted(task);
    
    // Stuck detection (no progress for threshold hours)
    // Give grace period if recently reverted or just started
    if (task.status === 'in-progress' && !wasRecentlyReverted) {
      // Only flag as stuck if:
      // 1. Has been in progress for a while AND
      // 2. No recent updates AND
      // 3. Has some progress (otherwise it might be newly started)
      if (task.progress > 0 && timeSinceUpdate > this.thresholds.stuckHours) {
        issues.push({
          type: 'stuck',
          severity: 'high',
          message: `No progress for ${Math.round(timeSinceUpdate)} hours`,
          recommendation: 'Needs immediate attention or reassignment'
        });
      } else if (task.progress === 0 && age > 24) {
        // Task started over a day ago with 0 progress
        issues.push({
          type: 'no_progress',
          severity: 'medium',
          message: `No progress made since start (${Math.round(age)} hours ago)`,
          recommendation: 'Task may be blocked or need decomposition'
        });
      }
    }

    // Stale detection (no update for threshold days)
    if (task.status === 'in-progress' && timeSinceUpdate > (this.thresholds.staleDays * 24)) {
      issues.push({
        type: 'stale',
        severity: 'medium',
        message: `No updates for ${Math.round(timeSinceUpdate / 24)} days`,
        recommendation: 'Review and update progress or pause task'
      });
    }

    // Low progress detection
    if (task.status === 'in-progress' && age > (this.thresholds.lowProgressDays * 24)) {
      if (task.progress < 20) {
        issues.push({
          type: 'low_progress',
          severity: 'medium',
          message: `Only ${task.progress}% complete after ${Math.round(age / 24)} days`,
          recommendation: 'Break down into smaller subtasks or get help'
        });
      }
    }

    // No implementation detection
    if (task.status === 'in-progress' && age > (this.thresholds.noImplementationDays * 24)) {
      if (!this.hasImplementation(task)) {
        issues.push({
          type: 'no_implementation',
          severity: 'high',
          message: 'No code/files created yet',
          recommendation: 'Start implementation or mark as blocked'
        });
      }
    }

    // False completion detection - but respect verified/do_not_revert flags
    if (task.status === 'completed' && !this.hasImplementation(task)) {
      // Skip if task is verified or marked as do_not_revert
      if (task.implementation_notes?.verified || task.implementation_notes?.do_not_revert) {
        // Task has been manually verified, trust it
      } else if (task.progress === 100) {
        // Completed with 100% progress, likely legitimate
      } else {
        issues.push({
          type: 'false_completion',
          severity: 'critical',
          message: 'Marked complete without implementation',
          recommendation: 'Revert to in-progress and implement'
        });
      }
    }

    // Blocked without blockers
    if (task.status === 'blocked' && (!task.dependencies?.blocked_by || task.dependencies.blocked_by.length === 0)) {
      issues.push({
        type: 'invalid_blocked',
        severity: 'medium',
        message: 'Marked as blocked but has no blockers',
        recommendation: 'Update status or add blocking dependencies'
      });
    }

    return issues;
  }

  analyzeAllTasks() {
    this.loadTasks();
    const healthReport = {
      healthy: [],
      warning: [],
      critical: [],
      stats: {
        total: 0,
        healthy: 0,
        warning: 0,
        critical: 0
      }
    };

    this.tasks.forEach(task => {
      if (task.status === 'not-started') return;
      
      const issues = this.detectHealthIssues(task);
      healthReport.stats.total++;

      if (issues.length === 0) {
        healthReport.healthy.push(task);
        healthReport.stats.healthy++;
      } else {
        const maxSeverity = issues.reduce((max, issue) => {
          const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
          return severityOrder[issue.severity] > severityOrder[max] ? issue.severity : max;
        }, 'low');

        const taskHealth = {
          task,
          issues,
          maxSeverity
        };

        if (maxSeverity === 'critical' || maxSeverity === 'high') {
          healthReport.critical.push(taskHealth);
          healthReport.stats.critical++;
        } else {
          healthReport.warning.push(taskHealth);
          healthReport.stats.warning++;
        }
      }
    });

    return healthReport;
  }

  displayHealthReport(report) {
    console.log('\n' + boxen(
      chalk.bold.cyan('🏥 Task Health Report\n') +
      chalk.gray('Automated detection of stuck and problematic tasks'),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        align: 'center'
      }
    ));

    // Summary stats
    console.log('\n' + chalk.bold('📊 Health Summary:'));
    console.log(chalk.green(`  ✅ Healthy: ${report.stats.healthy} tasks`));
    console.log(chalk.yellow(`  ⚠️  Warning: ${report.stats.warning} tasks`));
    console.log(chalk.red(`  🚨 Critical: ${report.stats.critical} tasks`));

    // Critical issues
    if (report.critical.length > 0) {
      console.log('\n' + chalk.red.bold('🚨 CRITICAL ISSUES:'));
      report.critical.forEach(({ task, issues }) => {
        console.log('\n' + chalk.red(`  ${task.id}: ${task.title}`));
        issues.forEach(issue => {
          console.log(chalk.red(`    ❌ ${issue.message}`));
          console.log(chalk.gray(`       → ${issue.recommendation}`));
        });
      });
    }

    // Warning issues
    if (report.warning.length > 0) {
      console.log('\n' + chalk.yellow.bold('⚠️  WARNING ISSUES:'));
      report.warning.forEach(({ task, issues }) => {
        console.log('\n' + chalk.yellow(`  ${task.id}: ${task.title}`));
        issues.forEach(issue => {
          console.log(chalk.yellow(`    ⚠️  ${issue.message}`));
          console.log(chalk.gray(`       → ${issue.recommendation}`));
        });
      });
    }

    // Recommendations
    if (report.critical.length > 0 || report.warning.length > 0) {
      console.log('\n' + chalk.cyan.bold('💡 RECOMMENDED ACTIONS:'));
      
      const stuckTasks = [...report.critical, ...report.warning]
        .filter(t => t.issues.some(i => i.type === 'stuck'));
      
      if (stuckTasks.length > 0) {
        console.log(chalk.cyan('\n  For stuck tasks:'));
        stuckTasks.forEach(({ task }) => {
          console.log(chalk.white(`    cx build ${task.id}  # Resume progress`));
        });
      }

      const falseCompletions = report.critical
        .filter(t => t.issues.some(i => i.type === 'false_completion'));
      
      if (falseCompletions.length > 0) {
        console.log(chalk.cyan('\n  For false completions:'));
        console.log(chalk.white(`    cx integrity-fix  # Auto-fix completion issues`));
      }
    }
  }

  async autoRemediate(report) {
    const spinner = ora('Applying automatic remediations...').start();
    let remediatedCount = 0;
    const fixes = [];

    // Fix false completions
    report.critical.forEach(({ task, issues }) => {
      const falseCompletion = issues.find(i => i.type === 'false_completion');
      if (falseCompletion) {
        const taskToUpdate = this.tasks.find(t => t.id === task.id);
        if (taskToUpdate) {
          taskToUpdate.status = 'in-progress';
          taskToUpdate.progress = 0;
          delete taskToUpdate.completed_at;
          remediatedCount++;
          fixes.push(`${task.id}: reverted false completion`);
          
          logEvent('task_health_remediation', `Auto-fixed false completion: ${task.id}`, {
            taskId: task.id,
            action: 'revert_completion'
          });
        }
      }
    });
    
    // Auto-unblock tasks with invalid blocked status
    report.warning.forEach(({ task, issues }) => {
      const invalidBlocked = issues.find(i => i.type === 'invalid_blocked');
      if (invalidBlocked) {
        const taskToUpdate = this.tasks.find(t => t.id === task.id);
        if (taskToUpdate) {
          taskToUpdate.status = 'ready';
          remediatedCount++;
          fixes.push(`${task.id}: unblocked (no blockers)`);
          
          logEvent('task_health_remediation', `Auto-unblocked: ${task.id}`, {
            taskId: task.id,
            action: 'unblock'
          });
        }
      }
    });

    // Update stuck task timestamps to trigger attention
    report.critical.forEach(({ task, issues }) => {
      const stuck = issues.find(i => i.type === 'stuck' || i.type === 'no_implementation');
      if (stuck) {
        logEvent('task_stuck_detected', `${task.id} detected as stuck`, {
          taskId: task.id,
          issue: stuck.type,
          timeSinceUpdate: this.getTimeSinceUpdate(task)
        });
      }
    });

    if (remediatedCount > 0) {
      this.saveTasks();
      spinner.succeed(`Applied ${remediatedCount} automatic remediations`);
    } else {
      spinner.info('No automatic remediations needed');
    }

    return remediatedCount;
  }

  async run(options = {}) {
    const report = this.analyzeAllTasks();
    
    if (!options.silent) {
      this.displayHealthReport(report);
    }

    if (options.autoFix) {
      await this.autoRemediate(report);
    }

    // Log health check
    logEvent('task_health_check', 'Task health monitoring completed', {
      healthy: report.stats.healthy,
      warning: report.stats.warning,
      critical: report.stats.critical
    });

    return report;
  }

  // Quick check for integration with other commands
  quickCheck() {
    const report = this.analyzeAllTasks();
    
    // Add integrity check for false completions
    const falseCompletions = [];
    const stalledTasks = [];
    
    this.tasks.forEach(task => {
      if (task.status === 'completed') {
        const check = this.checker.checkTaskImplementation(task);
        if (check.status === 'missing') {
          falseCompletions.push(task.id);
        }
      }
      if (task.status === 'in-progress' && task.progress > 20) {
        const check = this.checker.checkTaskImplementation(task);
        if (check.status === 'missing') {
          stalledTasks.push(task.id);
        }
      }
    });
    
    return {
      hasIssues: report.stats.warning > 0 || report.stats.critical > 0 || falseCompletions.length > 0,
      critical: report.stats.critical + falseCompletions.length,
      warning: report.stats.warning,
      stuckTasks: [...report.critical, ...report.warning]
        .filter(t => t.issues.some(i => i.type === 'stuck' || i.type === 'no_implementation'))
        .map(t => t.task.id),
      falseCompletions,
      stalledTasks
    };
  }
}

module.exports = TaskHealthMonitor;

// Run if called directly
if (require.main === module) {
  const monitor = new TaskHealthMonitor();
  const args = process.argv.slice(2);
  const options = {
    autoFix: args.includes('--fix'),
    silent: args.includes('--silent')
  };
  
  monitor.run(options);
}