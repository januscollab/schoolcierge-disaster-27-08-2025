# Task Health Monitoring Implementation Guide

## Quick Start Implementation

### 1. Enhanced Health Scorer (health-scorer.js)

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TaskHealthScorer {
  constructor() {
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.eventsPath = path.join(__dirname, '../tasks/events.jsonl');
    
    // Scoring weights (must sum to 1.0)
    this.weights = {
      progressVelocity: 0.20,
      implementation: 0.25,
      dependencies: 0.15,
      timeEfficiency: 0.15,
      blockageRisk: 0.10,
      communication: 0.10,
      quality: 0.05
    };
  }

  calculateHealthScore(task) {
    const scores = {
      progressVelocity: this.scoreProgressVelocity(task),
      implementation: this.scoreImplementation(task),
      dependencies: this.scoreDependencies(task),
      timeEfficiency: this.scoreTimeEfficiency(task),
      blockageRisk: this.scoreBlockageRisk(task),
      communication: this.scoreCommunication(task),
      quality: this.scoreQuality(task)
    };

    // Calculate weighted score
    let totalScore = 0;
    for (const [factor, score] of Object.entries(scores)) {
      totalScore += score * this.weights[factor];
    }

    return {
      overall: Math.round(totalScore),
      breakdown: scores,
      status: this.getHealthStatus(totalScore),
      trend: this.calculateTrend(task),
      recommendations: this.generateRecommendations(scores)
    };
  }

  scoreProgressVelocity(task) {
    if (task.status === 'not-started') return 100;
    if (task.status === 'completed') return 100;
    
    const age = this.getTaskAgeInHours(task);
    if (age === 0) return 100;
    
    const expectedProgress = Math.min(100, age * 2); // 2% per hour expected
    const actualProgress = task.progress || 0;
    
    const velocity = (actualProgress / expectedProgress) * 100;
    return Math.min(100, Math.max(0, velocity));
  }

  scoreImplementation(task) {
    if (task.status === 'not-started') return 100;
    
    const hasFiles = (task.implementation_notes?.files_created?.length || 0) +
                     (task.implementation_notes?.files_modified?.length || 0);
    
    const expectedFiles = (task.implementation_notes?.files_to_create?.length || 1) +
                         (task.implementation_notes?.files_to_modify?.length || 0);
    
    if (task.status === 'completed') {
      return hasFiles > 0 ? 100 : 0;
    }
    
    // For in-progress tasks
    const implementationRatio = hasFiles / Math.max(1, expectedFiles);
    const progressAlignment = Math.abs(implementationRatio - (task.progress / 100));
    
    return Math.max(0, 100 - (progressAlignment * 100));
  }

  scoreDependencies(task) {
    if (!task.dependencies?.blocked_by?.length) return 100;
    
    const tasks = this.loadAllTasks();
    const blockers = task.dependencies.blocked_by;
    
    let blockingScore = 100;
    for (const blockerId of blockers) {
      const blocker = tasks.find(t => t.id === blockerId);
      if (!blocker) continue;
      
      if (blocker.status === 'completed') {
        // Shouldn't be blocking
        blockingScore -= 20;
      } else if (blocker.status === 'not-started') {
        // High risk
        blockingScore -= 30;
      } else if (blocker.progress < 50) {
        // Medium risk
        blockingScore -= 15;
      }
    }
    
    return Math.max(0, blockingScore);
  }

  scoreTimeEfficiency(task) {
    if (task.status === 'not-started') return 100;
    if (!task.estimates?.effort_hours) return 75; // No estimate
    
    const actualHours = this.getTaskAgeInHours(task);
    const estimatedHours = parseFloat(task.estimates.effort_hours);
    
    if (task.status === 'completed') {
      const efficiency = estimatedHours / Math.max(1, actualHours);
      return Math.min(100, efficiency * 100);
    }
    
    // For in-progress
    const expectedProgress = Math.min(100, (actualHours / estimatedHours) * 100);
    const actualProgress = task.progress || 0;
    
    const efficiency = actualProgress / Math.max(1, expectedProgress);
    return Math.min(100, Math.max(0, efficiency * 100));
  }

  scoreBlockageRisk(task) {
    let riskScore = 100;
    
    // Check for stuck patterns
    const lastUpdate = this.getHoursSinceLastUpdate(task);
    if (lastUpdate > 24) riskScore -= 20;
    if (lastUpdate > 72) riskScore -= 30;
    
    // Check for no progress start
    if (task.status === 'in-progress' && task.progress === 0) {
      const age = this.getTaskAgeInHours(task);
      if (age > 4) riskScore -= 25;
    }
    
    // Check for stalled progress
    const progressHistory = this.getProgressHistory(task);
    if (progressHistory.stalled) riskScore -= 30;
    
    return Math.max(0, riskScore);
  }

  scoreCommunication(task) {
    const events = this.getTaskEvents(task);
    const age = Math.max(1, this.getTaskAgeInHours(task));
    
    // Expect at least 1 update per 24 hours
    const expectedUpdates = Math.floor(age / 24);
    const actualUpdates = events.length;
    
    const ratio = actualUpdates / Math.max(1, expectedUpdates);
    return Math.min(100, ratio * 100);
  }

  scoreQuality(task) {
    let qualityScore = 100;
    
    // Check for test files
    const hasTests = this.checkForTests(task);
    if (!hasTests && task.progress > 50) qualityScore -= 25;
    
    // Check for documentation
    const hasDocs = this.checkForDocs(task);
    if (!hasDocs && task.progress > 75) qualityScore -= 15;
    
    // Check for error patterns in events
    const events = this.getTaskEvents(task);
    const errorCount = events.filter(e => e.type?.includes('error')).length;
    qualityScore -= (errorCount * 10);
    
    return Math.max(0, qualityScore);
  }

  getHealthStatus(score) {
    if (score >= 95) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'critical';
  }

  // Helper methods
  getTaskAgeInHours(task) {
    if (!task.started_at) return 0;
    return (Date.now() - new Date(task.started_at).getTime()) / (1000 * 60 * 60);
  }

  getHoursSinceLastUpdate(task) {
    const lastUpdate = task.updated_at || task.started_at;
    if (!lastUpdate) return 0;
    return (Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60);
  }

  loadAllTasks() {
    try {
      return JSON.parse(fs.readFileSync(this.tasksPath, 'utf8'));
    } catch {
      return [];
    }
  }

  getTaskEvents(task) {
    try {
      const events = fs.readFileSync(this.eventsPath, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line))
        .filter(e => e.data?.taskId === task.id);
      return events;
    } catch {
      return [];
    }
  }

  getProgressHistory(task) {
    const events = this.getTaskEvents(task);
    const progressEvents = events.filter(e => e.type === 'progress_update');
    
    if (progressEvents.length < 2) {
      return { stalled: false, velocity: 0 };
    }
    
    // Check if progress has stalled
    const recentProgress = progressEvents.slice(-5);
    const uniqueProgress = [...new Set(recentProgress.map(e => e.data.progress))];
    
    return {
      stalled: uniqueProgress.length === 1 && progressEvents.length > 3,
      velocity: this.calculateVelocity(progressEvents)
    };
  }

  calculateVelocity(events) {
    if (events.length < 2) return 0;
    
    const first = events[0];
    const last = events[events.length - 1];
    
    const progressDiff = (last.data?.progress || 0) - (first.data?.progress || 0);
    const timeDiff = new Date(last.timestamp) - new Date(first.timestamp);
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    return hoursDiff > 0 ? progressDiff / hoursDiff : 0;
  }

  calculateTrend(task) {
    const events = this.getTaskEvents(task);
    const recentEvents = events.slice(-10);
    
    if (recentEvents.length < 3) return 'stable';
    
    // Analyze trend
    const scores = recentEvents.map(e => e.data?.healthScore || 0);
    const avgFirst = scores.slice(0, Math.floor(scores.length / 2))
      .reduce((a, b) => a + b, 0) / Math.floor(scores.length / 2);
    const avgSecond = scores.slice(Math.floor(scores.length / 2))
      .reduce((a, b) => a + b, 0) / (scores.length - Math.floor(scores.length / 2));
    
    if (avgSecond > avgFirst + 5) return 'improving';
    if (avgSecond < avgFirst - 5) return 'declining';
    return 'stable';
  }

  generateRecommendations(scores) {
    const recommendations = [];
    
    if (scores.progressVelocity < 50) {
      recommendations.push({
        type: 'velocity',
        priority: 'high',
        message: 'Task progress is slower than expected',
        action: 'Consider breaking down into smaller subtasks or getting help'
      });
    }
    
    if (scores.implementation < 30) {
      recommendations.push({
        type: 'implementation',
        priority: 'critical',
        message: 'No implementation evidence found',
        action: 'Start creating the required files or update implementation notes'
      });
    }
    
    if (scores.dependencies < 50) {
      recommendations.push({
        type: 'dependencies',
        priority: 'high',
        message: 'Blocked by incomplete dependencies',
        action: 'Review and prioritize blocking tasks'
      });
    }
    
    if (scores.communication < 50) {
      recommendations.push({
        type: 'communication',
        priority: 'medium',
        message: 'Insufficient status updates',
        action: 'Provide regular progress updates to maintain visibility'
      });
    }
    
    return recommendations;
  }

  checkForTests(task) {
    const testPatterns = ['test', 'spec', '__tests__'];
    const files = [
      ...(task.implementation_notes?.files_created || []),
      ...(task.implementation_notes?.files_modified || [])
    ];
    
    return files.some(file => 
      testPatterns.some(pattern => file.toLowerCase().includes(pattern))
    );
  }

  checkForDocs(task) {
    const docPatterns = ['readme', 'docs', '.md', 'documentation'];
    const files = [
      ...(task.implementation_notes?.files_created || []),
      ...(task.implementation_notes?.files_modified || [])
    ];
    
    return files.some(file => 
      docPatterns.some(pattern => file.toLowerCase().includes(pattern))
    );
  }
}

module.exports = TaskHealthScorer;
```

### 2. Auto-Remediation Engine (auto-remediation.js)

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');

class AutoRemediationEngine {
  constructor() {
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.backupPath = path.join(__dirname, '../tasks/backlog.backup.json');
    this.logPath = path.join(__dirname, '../tasks/remediation.log');
    
    // Configuration
    this.config = {
      maxAutoFixes: 10,
      confidenceThreshold: 0.7,
      safeMode: true,
      dryRun: false
    };
    
    // Remediation strategies
    this.strategies = {
      falseCompletion: this.fixFalseCompletion.bind(this),
      stuck: this.fixStuckTask.bind(this),
      invalidBlocked: this.fixInvalidBlocked.bind(this),
      missingImplementation: this.fixMissingImplementation.bind(this),
      dependencyResolution: this.fixDependencies.bind(this),
      progressMismatch: this.fixProgressMismatch.bind(this)
    };
  }

  async remediate(task, issues, options = {}) {
    const config = { ...this.config, ...options };
    
    // Create backup
    if (config.safeMode) {
      this.createBackup();
    }
    
    const remediations = [];
    
    // Sort issues by priority
    const sortedIssues = this.prioritizeIssues(issues);
    
    for (const issue of sortedIssues) {
      if (remediations.length >= config.maxAutoFixes) {
        console.log(chalk.yellow('⚠️  Max auto-fixes reached'));
        break;
      }
      
      const strategy = this.strategies[issue.type];
      if (!strategy) {
        console.log(chalk.gray(`No strategy for: ${issue.type}`));
        continue;
      }
      
      if (issue.confidence < config.confidenceThreshold) {
        console.log(chalk.gray(`Low confidence for ${issue.type}: ${issue.confidence}`));
        continue;
      }
      
      try {
        const result = await strategy(task, issue, config);
        if (result.success) {
          remediations.push(result);
          this.logRemediation(task, issue, result);
        }
      } catch (error) {
        console.error(chalk.red(`Remediation failed: ${error.message}`));
        this.logError(task, issue, error);
      }
    }
    
    return {
      applied: remediations,
      remaining: sortedIssues.slice(remediations.length),
      success: remediations.length > 0
    };
  }

  async fixFalseCompletion(task, issue, config) {
    console.log(chalk.yellow(`🔧 Fixing false completion: ${task.id}`));
    
    if (config.dryRun) {
      return {
        success: true,
        type: 'falseCompletion',
        action: 'DRY_RUN: Would revert to in-progress',
        dryRun: true
      };
    }
    
    // Load tasks
    const tasks = this.loadTasks();
    const taskIndex = tasks.findIndex(t => t.id === task.id);
    
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }
    
    // Revert completion
    tasks[taskIndex].status = 'in-progress';
    tasks[taskIndex].progress = Math.min(75, task.progress || 50);
    delete tasks[taskIndex].completed_at;
    tasks[taskIndex].updated_at = new Date().toISOString();
    
    // Add remediation note
    if (!tasks[taskIndex].remediation_history) {
      tasks[taskIndex].remediation_history = [];
    }
    
    tasks[taskIndex].remediation_history.push({
      timestamp: new Date().toISOString(),
      type: 'false_completion_revert',
      previousStatus: 'completed',
      newStatus: 'in-progress',
      reason: issue.reason
    });
    
    // Save
    this.saveTasks(tasks);
    
    return {
      success: true,
      type: 'falseCompletion',
      action: 'Reverted to in-progress',
      details: {
        previousStatus: 'completed',
        newStatus: 'in-progress',
        newProgress: tasks[taskIndex].progress
      }
    };
  }

  async fixStuckTask(task, issue, config) {
    console.log(chalk.yellow(`🔧 Unsticking task: ${task.id}`));
    
    if (config.dryRun) {
      return {
        success: true,
        type: 'stuck',
        action: 'DRY_RUN: Would attempt to unstick',
        dryRun: true
      };
    }
    
    const actions = [];
    
    // Check for dependency issues
    if (task.dependencies?.blocked_by?.length > 0) {
      const resolved = await this.checkAndResolveDependencies(task);
      if (resolved.changed) {
        actions.push('Resolved dependencies');
      }
    }
    
    // Check for missing assignment
    if (!task.assignedAgent && task.status === 'in-progress') {
      const agent = await this.findBestAgent(task);
      if (agent) {
        task.assignedAgent = agent;
        actions.push(`Assigned to ${agent}`);
      }
    }
    
    // Add attention flag
    task.requiresAttention = true;
    task.stuckSince = issue.detectedAt;
    
    // Update task
    const tasks = this.loadTasks();
    const taskIndex = tasks.findIndex(t => t.id === task.id);
    if (taskIndex !== -1) {
      Object.assign(tasks[taskIndex], task);
      tasks[taskIndex].updated_at = new Date().toISOString();
      this.saveTasks(tasks);
    }
    
    return {
      success: actions.length > 0,
      type: 'stuck',
      action: actions.join(', '),
      details: { actions }
    };
  }

  async fixInvalidBlocked(task, issue, config) {
    console.log(chalk.yellow(`🔧 Fixing invalid blocked status: ${task.id}`));
    
    if (config.dryRun) {
      return {
        success: true,
        type: 'invalidBlocked',
        action: 'DRY_RUN: Would change to ready',
        dryRun: true
      };
    }
    
    const tasks = this.loadTasks();
    const taskIndex = tasks.findIndex(t => t.id === task.id);
    
    if (taskIndex !== -1) {
      tasks[taskIndex].status = 'ready';
      tasks[taskIndex].updated_at = new Date().toISOString();
      
      // Clear invalid dependencies
      if (tasks[taskIndex].dependencies) {
        tasks[taskIndex].dependencies.blocked_by = [];
      }
      
      this.saveTasks(tasks);
      
      return {
        success: true,
        type: 'invalidBlocked',
        action: 'Changed status to ready',
        details: {
          previousStatus: 'blocked',
          newStatus: 'ready'
        }
      };
    }
    
    return { success: false };
  }

  async fixProgressMismatch(task, issue, config) {
    console.log(chalk.yellow(`🔧 Fixing progress mismatch: ${task.id}`));
    
    const actualProgress = await this.calculateActualProgress(task);
    
    if (config.dryRun) {
      return {
        success: true,
        type: 'progressMismatch',
        action: `DRY_RUN: Would adjust progress from ${task.progress}% to ${actualProgress}%`,
        dryRun: true
      };
    }
    
    const tasks = this.loadTasks();
    const taskIndex = tasks.findIndex(t => t.id === task.id);
    
    if (taskIndex !== -1) {
      const oldProgress = tasks[taskIndex].progress;
      tasks[taskIndex].progress = actualProgress;
      tasks[taskIndex].updated_at = new Date().toISOString();
      
      // Add note about adjustment
      if (!tasks[taskIndex].progressAdjustments) {
        tasks[taskIndex].progressAdjustments = [];
      }
      
      tasks[taskIndex].progressAdjustments.push({
        timestamp: new Date().toISOString(),
        from: oldProgress,
        to: actualProgress,
        reason: 'Automatic progress alignment based on implementation'
      });
      
      this.saveTasks(tasks);
      
      return {
        success: true,
        type: 'progressMismatch',
        action: `Adjusted progress from ${oldProgress}% to ${actualProgress}%`,
        details: {
          oldProgress,
          newProgress: actualProgress,
          difference: actualProgress - oldProgress
        }
      };
    }
    
    return { success: false };
  }

  async calculateActualProgress(task) {
    let progress = 0;
    
    // Base progress on task status
    if (task.status === 'not-started') return 0;
    if (task.status === 'completed') return 100;
    
    // Calculate based on implementation
    const expectedFiles = (task.implementation_notes?.files_to_create?.length || 0) +
                         (task.implementation_notes?.files_to_modify?.length || 0);
    
    const actualFiles = (task.implementation_notes?.files_created?.length || 0) +
                       (task.implementation_notes?.files_modified?.length || 0);
    
    if (expectedFiles > 0) {
      progress = Math.min(90, (actualFiles / expectedFiles) * 80);
    }
    
    // Add progress for other factors
    if (task.implementation_notes?.notes) progress += 5;
    if (task.implementation_notes?.testing_approach) progress += 5;
    
    // Ensure minimum progress for in-progress tasks
    if (task.status === 'in-progress') {
      progress = Math.max(10, progress);
    }
    
    return Math.min(95, Math.round(progress));
  }

  prioritizeIssues(issues) {
    const priorityMap = {
      falseCompletion: 1,
      stuck: 2,
      invalidBlocked: 3,
      missingImplementation: 4,
      dependencyResolution: 5,
      progressMismatch: 6
    };
    
    return issues.sort((a, b) => {
      const aPriority = priorityMap[a.type] || 999;
      const bPriority = priorityMap[b.type] || 999;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Sort by confidence if same priority
      return (b.confidence || 0) - (a.confidence || 0);
    });
  }

  createBackup() {
    const tasks = this.loadTasks();
    fs.writeFileSync(this.backupPath, JSON.stringify(tasks, null, 2));
  }

  loadTasks() {
    return JSON.parse(fs.readFileSync(this.tasksPath, 'utf8'));
  }

  saveTasks(tasks) {
    fs.writeFileSync(this.tasksPath, JSON.stringify(tasks, null, 2));
  }

  logRemediation(task, issue, result) {
    const log = {
      timestamp: new Date().toISOString(),
      taskId: task.id,
      issueType: issue.type,
      confidence: issue.confidence,
      action: result.action,
      success: result.success,
      details: result.details
    };
    
    fs.appendFileSync(this.logPath, JSON.stringify(log) + '\n');
  }

  logError(task, issue, error) {
    const log = {
      timestamp: new Date().toISOString(),
      taskId: task.id,
      issueType: issue.type,
      error: error.message,
      stack: error.stack
    };
    
    fs.appendFileSync(this.logPath, JSON.stringify(log) + '\n');
  }
}

module.exports = AutoRemediationEngine;
```

### 3. Integrated Health Command (cx-health.js)

```javascript
#!/usr/bin/env node

const chalk = require('chalk');
const ora = require('ora');
const boxen = require('boxen');
const Table = require('cli-table3');
const TaskHealthMonitor = require('./task-health-monitor');
const TaskHealthScorer = require('./health-scorer');
const AutoRemediationEngine = require('./auto-remediation');

class IntegratedHealthSystem {
  constructor() {
    this.monitor = new TaskHealthMonitor();
    this.scorer = new TaskHealthScorer();
    this.remediation = new AutoRemediationEngine();
  }

  async run(options = {}) {
    console.clear();
    this.displayHeader();
    
    const spinner = ora('Analyzing task health...').start();
    
    try {
      // Load all tasks
      const tasks = this.monitor.loadTasks();
      
      // Analyze health for all active tasks
      const healthReports = [];
      for (const task of tasks) {
        if (task.status === 'not-started' && task.progress === 0) continue;
        
        const health = this.scorer.calculateHealthScore(task);
        const issues = this.monitor.detectHealthIssues(task);
        
        healthReports.push({
          task,
          health,
          issues
        });
      }
      
      spinner.succeed('Health analysis complete');
      
      // Display dashboard
      this.displayDashboard(healthReports);
      
      // Auto-remediate if requested
      if (options.autoFix || options.fix) {
        await this.performAutoRemediation(healthReports);
      }
      
      // Show recommendations
      if (!options.quiet) {
        this.displayRecommendations(healthReports);
      }
      
      // Return for programmatic use
      return {
        reports: healthReports,
        summary: this.generateSummary(healthReports)
      };
      
    } catch (error) {
      spinner.fail(`Health check failed: ${error.message}`);
      console.error(error);
      process.exit(1);
    }
  }

  displayHeader() {
    console.log(boxen(
      chalk.bold.cyan('🏥 Task Health Monitoring System') + '\n' +
      chalk.gray('Intelligent detection and auto-healing'),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        align: 'center'
      }
    ));
  }

  displayDashboard(reports) {
    // Summary stats
    const summary = this.generateSummary(reports);
    
    console.log('\n' + chalk.bold('📊 Health Summary'));
    console.log(chalk.green(`  ✅ Healthy: ${summary.healthy} tasks (${summary.healthyPercent}%)`));
    console.log(chalk.yellow(`  ⚠️  Warning: ${summary.warning} tasks`));
    console.log(chalk.red(`  🚨 Critical: ${summary.critical} tasks`));
    
    // Detailed table
    if (reports.length > 0) {
      const table = new Table({
        head: [
          chalk.cyan('Task'),
          chalk.cyan('Status'),
          chalk.cyan('Progress'),
          chalk.cyan('Health'),
          chalk.cyan('Issues'),
          chalk.cyan('Action')
        ],
        style: {
          head: [],
          border: ['gray']
        }
      });
      
      reports
        .sort((a, b) => a.health.overall - b.health.overall)
        .slice(0, 10) // Show top 10 problematic tasks
        .forEach(report => {
          const healthColor = this.getHealthColor(report.health.overall);
          const issueCount = report.issues.length;
          
          table.push([
            report.task.id,
            this.getStatusBadge(report.task.status),
            this.generateProgressBar(report.task.progress, 10),
            healthColor(`${report.health.overall}%`),
            issueCount > 0 ? chalk.red(issueCount) : chalk.green('0'),
            this.getRecommendedAction(report)
          ]);
        });
      
      console.log('\n' + table.toString());
    }
  }

  async performAutoRemediation(reports) {
    console.log('\n' + chalk.bold.yellow('🔧 Auto-Remediation'));
    
    const criticalReports = reports.filter(r => r.health.overall < 60);
    
    if (criticalReports.length === 0) {
      console.log(chalk.green('  ✅ No critical issues to auto-fix'));
      return;
    }
    
    const spinner = ora(`Applying auto-fixes to ${criticalReports.length} tasks...`).start();
    
    let fixCount = 0;
    for (const report of criticalReports) {
      const result = await this.remediation.remediate(report.task, report.issues);
      if (result.success) {
        fixCount += result.applied.length;
      }
    }
    
    if (fixCount > 0) {
      spinner.succeed(`Applied ${fixCount} automatic fixes`);
    } else {
      spinner.info('No automatic fixes could be applied');
    }
  }

  displayRecommendations(reports) {
    const recommendations = [];
    
    reports.forEach(report => {
      if (report.health.recommendations?.length > 0) {
        recommendations.push({
          task: report.task.id,
          items: report.health.recommendations
        });
      }
    });
    
    if (recommendations.length > 0) {
      console.log('\n' + chalk.bold.cyan('💡 Recommendations'));
      
      recommendations.slice(0, 5).forEach(rec => {
        console.log('\n' + chalk.yellow(`  ${rec.task}:`));
        rec.items.forEach(item => {
          const icon = {
            critical: '🚨',
            high: '⚠️',
            medium: '📝',
            low: '💭'
          }[item.priority] || '•';
          
          console.log(`    ${icon} ${item.message}`);
          console.log(chalk.gray(`       → ${item.action}`));
        });
      });
    }
  }

  generateSummary(reports) {
    const total = reports.length;
    const healthy = reports.filter(r => r.health.overall >= 80).length;
    const warning = reports.filter(r => r.health.overall >= 60 && r.health.overall < 80).length;
    const critical = reports.filter(r => r.health.overall < 60).length;
    
    return {
      total,
      healthy,
      warning,
      critical,
      healthyPercent: total > 0 ? Math.round((healthy / total) * 100) : 100,
      averageHealth: total > 0 ? 
        Math.round(reports.reduce((sum, r) => sum + r.health.overall, 0) / total) : 100
    };
  }

  getHealthColor(score) {
    if (score >= 80) return chalk.green;
    if (score >= 60) return chalk.yellow;
    if (score >= 40) return chalk.red;
    return chalk.red.bold;
  }

  getStatusBadge(status) {
    const badges = {
      'not-started': chalk.gray('○'),
      'ready': chalk.blue('◷'),
      'in-progress': chalk.yellow('◐'),
      'blocked': chalk.red('■'),
      'completed': chalk.green('●')
    };
    return badges[status] || status;
  }

  generateProgressBar(progress, width = 20) {
    const filled = Math.round(width * progress / 100);
    const empty = width - filled;
    
    let bar = '';
    for (let i = 0; i < filled; i++) {
      bar += chalk.green('█');
    }
    for (let i = 0; i < empty; i++) {
      bar += chalk.gray('░');
    }
    
    return bar;
  }

  getRecommendedAction(report) {
    if (report.health.overall >= 80) {
      return chalk.green('Continue');
    }
    
    if (report.issues.some(i => i.type === 'false_completion')) {
      return chalk.red('Revert');
    }
    
    if (report.issues.some(i => i.type === 'stuck')) {
      return chalk.yellow('Unstick');
    }
    
    if (report.health.overall < 40) {
      return chalk.red('Intervene');
    }
    
    return chalk.yellow('Review');
  }
}

// CLI execution
if (require.main === module) {
  const system = new IntegratedHealthSystem();
  const args = process.argv.slice(2);
  
  const options = {
    autoFix: args.includes('--fix') || args.includes('--auto-fix'),
    quiet: args.includes('--quiet') || args.includes('-q'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };
  
  system.run(options).then(result => {
    if (result.summary.critical > 0 && !options.autoFix) {
      console.log('\n' + chalk.yellow('Run with --fix to apply automatic remediations'));
    }
  });
}

module.exports = IntegratedHealthSystem;
```

## Implementation Timeline

### Week 1: Foundation
- [ ] Deploy enhanced health scorer
- [ ] Integrate with existing task-health-monitor
- [ ] Add health metrics to task events
- [ ] Create health dashboard

### Week 2: Auto-Remediation
- [ ] Deploy remediation engine
- [ ] Test with dry-run mode
- [ ] Add safety checks
- [ ] Enable for critical issues only

### Week 3: Learning & Optimization
- [ ] Deploy learning engine
- [ ] Collect metrics
- [ ] Tune thresholds
- [ ] Full production rollout

## Testing Strategy

```bash
# Test health scoring
node health-scorer.js --test

# Test remediation (dry run)
node auto-remediation.js --dry-run

# Full system test
node cx-health.js --verbose

# Auto-fix test (safe mode)
node cx-health.js --fix --safe

# Production mode
cx health --fix
```

## Monitoring & Metrics

Track these KPIs:
1. **Detection Accuracy**: False positive rate < 5%
2. **Auto-fix Success**: > 80% successful remediations
3. **Time to Detection**: < 2 hours for critical issues
4. **User Satisfaction**: Reduced manual interventions by 60%

---

*Implementation Guide v1.0*  
*Ready for deployment*