#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');
const { logEvent } = require('./event-ticker');

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
      false_completion: this.fixFalseCompletion.bind(this), // Alias
      stuck: this.fixStuckTask.bind(this),
      invalidBlocked: this.fixInvalidBlocked.bind(this),
      invalid_blocked: this.fixInvalidBlocked.bind(this), // Alias
      missingImplementation: this.fixMissingImplementation.bind(this),
      missing_implementation: this.fixMissingImplementation.bind(this), // Alias
      dependencyResolution: this.fixDependencies.bind(this),
      progressMismatch: this.fixProgressMismatch.bind(this),
      no_progress: this.fixNoProgress.bind(this),
      no_implementation: this.fixMissingImplementation.bind(this),
      low_progress: this.fixLowProgress.bind(this),
      stale: this.fixStaleTask.bind(this)
    };
  }

  async remediate(task, issues, options = {}) {
    const config = { ...this.config, ...options };
    
    // Create backup
    if (config.safeMode && !config.dryRun) {
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
      
      const confidence = issue.confidence || 1.0;
      if (confidence < config.confidenceThreshold) {
        console.log(chalk.gray(`Low confidence for ${issue.type}: ${confidence}`));
        continue;
      }
      
      try {
        const result = await strategy(task, issue, config);
        if (result.success) {
          remediations.push(result);
          if (!config.dryRun) {
            this.logRemediation(task, issue, result);
          }
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
      reason: issue.message || 'No implementation found'
    });
    
    // Save
    this.saveTasks(tasks);
    
    // Log event
    logEvent('task_health_remediation', `${task.id}: Auto-fixed false completion`, {
      taskId: task.id,
      action: 'revert_completion'
    });
    
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
    const tasks = this.loadTasks();
    const taskIndex = tasks.findIndex(t => t.id === task.id);
    
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }
    
    // Check for dependency issues
    if (task.dependencies?.blocked_by?.length > 0) {
      const resolved = await this.checkAndResolveDependencies(task, tasks);
      if (resolved.changed) {
        actions.push('Resolved dependencies');
        tasks[taskIndex].dependencies = resolved.dependencies;
      }
    }
    
    // Add attention flag
    tasks[taskIndex].requiresAttention = true;
    tasks[taskIndex].stuckSince = issue.detectedAt || new Date().toISOString();
    tasks[taskIndex].updated_at = new Date().toISOString();
    
    // Save
    this.saveTasks(tasks);
    
    // Log event
    logEvent('task_stuck_detected', `${task.id}: Detected as stuck`, {
      taskId: task.id,
      issue: issue.type,
      actions: actions.join(', ')
    });
    
    return {
      success: actions.length > 0 || true,
      type: 'stuck',
      action: actions.length > 0 ? actions.join(', ') : 'Flagged for attention',
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
      
      // Log event
      logEvent('task_health_remediation', `${task.id}: Auto-unblocked`, {
        taskId: task.id,
        action: 'unblock'
      });
      
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

  async fixMissingImplementation(task, issue, config) {
    console.log(chalk.yellow(`🔧 Addressing missing implementation: ${task.id}`));
    
    if (config.dryRun) {
      return {
        success: true,
        type: 'missingImplementation',
        action: 'DRY_RUN: Would adjust progress and flag for attention',
        dryRun: true
      };
    }
    
    const tasks = this.loadTasks();
    const taskIndex = tasks.findIndex(t => t.id === task.id);
    
    if (taskIndex !== -1) {
      // Adjust progress to reflect reality
      if (tasks[taskIndex].progress > 20) {
        tasks[taskIndex].progress = 10;
      }
      
      // Flag for attention
      tasks[taskIndex].requiresImplementation = true;
      tasks[taskIndex].updated_at = new Date().toISOString();
      
      // Add note
      if (!tasks[taskIndex].implementation_notes) {
        tasks[taskIndex].implementation_notes = {};
      }
      tasks[taskIndex].implementation_notes.auto_flagged = new Date().toISOString();
      tasks[taskIndex].implementation_notes.reason = 'No implementation files detected';
      
      this.saveTasks(tasks);
      
      // Log event
      logEvent('task_implementation_missing', `${task.id}: No implementation found`, {
        taskId: task.id,
        progress: tasks[taskIndex].progress
      });
      
      return {
        success: true,
        type: 'missingImplementation',
        action: 'Adjusted progress and flagged for implementation',
        details: {
          newProgress: tasks[taskIndex].progress,
          flagged: true
        }
      };
    }
    
    return { success: false };
  }

  async fixDependencies(task, issue, config) {
    if (config.dryRun) {
      return {
        success: true,
        type: 'dependencyResolution',
        action: 'DRY_RUN: Would resolve dependencies',
        dryRun: true
      };
    }
    
    const tasks = this.loadTasks();
    const resolved = await this.checkAndResolveDependencies(task, tasks);
    
    if (resolved.changed) {
      const taskIndex = tasks.findIndex(t => t.id === task.id);
      if (taskIndex !== -1) {
        tasks[taskIndex].dependencies = resolved.dependencies;
        tasks[taskIndex].updated_at = new Date().toISOString();
        this.saveTasks(tasks);
        
        return {
          success: true,
          type: 'dependencyResolution',
          action: 'Resolved dependencies',
          details: resolved
        };
      }
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

  async fixNoProgress(task, issue, config) {
    return this.fixStuckTask(task, issue, config);
  }

  async fixLowProgress(task, issue, config) {
    console.log(chalk.yellow(`🔧 Addressing low progress: ${task.id}`));
    
    if (config.dryRun) {
      return {
        success: true,
        type: 'lowProgress',
        action: 'DRY_RUN: Would flag for decomposition',
        dryRun: true
      };
    }
    
    const tasks = this.loadTasks();
    const taskIndex = tasks.findIndex(t => t.id === task.id);
    
    if (taskIndex !== -1) {
      tasks[taskIndex].requiresDecomposition = true;
      tasks[taskIndex].updated_at = new Date().toISOString();
      
      if (!tasks[taskIndex].notes) {
        tasks[taskIndex].notes = {};
      }
      tasks[taskIndex].notes.lowProgressFlag = new Date().toISOString();
      tasks[taskIndex].notes.recommendation = 'Consider breaking down into smaller subtasks';
      
      this.saveTasks(tasks);
      
      return {
        success: true,
        type: 'lowProgress',
        action: 'Flagged for decomposition',
        details: {
          recommendation: 'Break down into smaller subtasks'
        }
      };
    }
    
    return { success: false };
  }

  async fixStaleTask(task, issue, config) {
    console.log(chalk.yellow(`🔧 Refreshing stale task: ${task.id}`));
    
    if (config.dryRun) {
      return {
        success: true,
        type: 'stale',
        action: 'DRY_RUN: Would refresh task status',
        dryRun: true
      };
    }
    
    const tasks = this.loadTasks();
    const taskIndex = tasks.findIndex(t => t.id === task.id);
    
    if (taskIndex !== -1) {
      tasks[taskIndex].requiresStatusUpdate = true;
      tasks[taskIndex].lastHealthCheck = new Date().toISOString();
      tasks[taskIndex].updated_at = new Date().toISOString();
      
      this.saveTasks(tasks);
      
      // Log event
      logEvent('task_stale_detected', `${task.id}: Marked as stale`, {
        taskId: task.id,
        lastUpdate: task.updated_at
      });
      
      return {
        success: true,
        type: 'stale',
        action: 'Flagged for status update',
        details: {
          lastUpdate: task.updated_at
        }
      };
    }
    
    return { success: false };
  }

  async checkAndResolveDependencies(task, allTasks) {
    if (!task.dependencies?.blocked_by) {
      return { changed: false, dependencies: task.dependencies };
    }
    
    const completedTaskIds = allTasks
      .filter(t => t.status === 'completed')
      .map(t => t.id);
    
    const originalBlockers = task.dependencies.blocked_by;
    const validBlockers = originalBlockers.filter(blockerId => 
      !completedTaskIds.includes(blockerId)
    );
    
    if (validBlockers.length < originalBlockers.length) {
      return {
        changed: true,
        dependencies: {
          ...task.dependencies,
          blocked_by: validBlockers
        },
        resolved: originalBlockers.filter(id => completedTaskIds.includes(id))
      };
    }
    
    return { changed: false, dependencies: task.dependencies };
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
      false_completion: 1,
      stuck: 2,
      invalidBlocked: 3,
      invalid_blocked: 3,
      missingImplementation: 4,
      missing_implementation: 4,
      no_implementation: 4,
      dependencyResolution: 5,
      progressMismatch: 6,
      no_progress: 7,
      low_progress: 8,
      stale: 9
    };
    
    return issues.sort((a, b) => {
      const aPriority = priorityMap[a.type] || 999;
      const bPriority = priorityMap[b.type] || 999;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Sort by severity if same priority
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aSeverity = severityOrder[a.severity] || 999;
      const bSeverity = severityOrder[b.severity] || 999;
      
      return aSeverity - bSeverity;
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
      confidence: issue.confidence || 1.0,
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