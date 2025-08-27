#!/usr/bin/env node

/**
 * Dependency Resolver
 * Automatically unblocks tasks when their dependencies are completed
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const boxen = require('boxen');
const gradient = require('gradient-string');
const { logEvent } = require('./event-ticker');

class DependencyResolver {
  constructor() {
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.tasks = [];
    this.creaiteGradient = gradient(['#40E0D0', '#FFD700', '#40E0D0']);
    this.loadTasks();
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
      process.exit(1);
    }
  }

  displayHeader() {
    console.log('\n' + boxen(
      chalk.bold.cyan('🔗 Dependency Resolution System\n') +
      chalk.gray('Automatically unblocking tasks with resolved dependencies'),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        align: 'center'
      }
    ));
  }

  getCompletedTaskIds() {
    return this.tasks
      .filter(task => task.status === 'completed')
      .map(task => task.id);
  }

  resolveDependencies() {
    const completedTaskIds = this.getCompletedTaskIds();
    const updates = [];
    let totalUnblocked = 0;

    console.log('\n' + chalk.bold.cyan('🔍 Scanning task dependencies...'));
    console.log(chalk.gray('─'.repeat(60)));

    this.tasks.forEach(task => {
      if (!task.dependencies?.blocked_by || task.dependencies.blocked_by.length === 0) {
        return;
      }

      const originalBlockers = [...task.dependencies.blocked_by];
      const remainingBlockers = task.dependencies.blocked_by.filter(
        blockerId => !completedTaskIds.includes(blockerId)
      );

      if (remainingBlockers.length < originalBlockers.length) {
        // Some blockers have been completed
        const removedBlockers = originalBlockers.filter(
          id => !remainingBlockers.includes(id)
        );

        updates.push({
          taskId: task.id,
          title: task.title,
          removedBlockers,
          remainingBlockers,
          wasFullyBlocked: originalBlockers.length > 0,
          nowUnblocked: remainingBlockers.length === 0
        });

        // Update the task
        task.dependencies.blocked_by = remainingBlockers;
        
        // If task is now completely unblocked and was not-started, make it ready
        if (remainingBlockers.length === 0) {
          if (task.status === 'not-started' || task.status === 'blocked') {
            task.status = 'ready';
            totalUnblocked++;
          }
        }
      }
    });

    return { updates, totalUnblocked };
  }

  displayUpdates(updates) {
    if (updates.length === 0) {
      console.log(chalk.green('✅ All dependencies are already resolved!'));
      return;
    }

    console.log('\n' + chalk.bold.yellow(`📦 Found ${updates.length} tasks with resolved dependencies:`));
    
    updates.forEach(update => {
      console.log('\n' + chalk.cyan(`  ${update.taskId}: ${update.title}`));
      
      // Show removed blockers
      update.removedBlockers.forEach(blocker => {
        console.log(chalk.green(`    ✓ ${blocker} completed`));
      });

      // Show remaining blockers if any
      if (update.remainingBlockers.length > 0) {
        console.log(chalk.yellow(`    ⚠️  Still blocked by: ${update.remainingBlockers.join(', ')}`));
      } else {
        console.log(chalk.bold.green(`    🚀 FULLY UNBLOCKED!`));
      }
    });
  }

  logUpdates(updates, totalUnblocked) {
    updates.forEach(update => {
      if (update.nowUnblocked) {
        logEvent('dependency_resolved', `${update.taskId} unblocked - all dependencies completed`, {
          taskId: update.taskId,
          removedBlockers: update.removedBlockers,
          autoUpdated: true
        });
      } else {
        logEvent('dependency_partial_resolved', `${update.taskId} partially unblocked`, {
          taskId: update.taskId,
          removedBlockers: update.removedBlockers,
          remainingBlockers: update.remainingBlockers
        });
      }
    });

    if (totalUnblocked > 0) {
      logEvent('system_event', `Dependency resolver unblocked ${totalUnblocked} tasks`, {
        totalUnblocked,
        updatedTasks: updates.map(u => u.taskId)
      });
    }
  }

  run() {
    this.displayHeader();
    
    const { updates, totalUnblocked } = this.resolveDependencies();
    
    if (updates.length > 0) {
      this.displayUpdates(updates);
      this.saveTasks();
      this.logUpdates(updates, totalUnblocked);
      
      console.log('\n' + boxen(
        chalk.bold.green(`✨ Updated ${updates.length} tasks\n`) +
        chalk.cyan(`${totalUnblocked} tasks fully unblocked`),
        {
          padding: 1,
          borderStyle: 'double',
          borderColor: 'green',
          align: 'center'
        }
      ));
    } else {
      console.log('\n' + chalk.gray('No dependency updates needed.'));
    }

    return { updates, totalUnblocked };
  }

  // Run automatically when status is checked
  autoRun() {
    const { updates } = this.resolveDependencies();
    if (updates.length > 0) {
      this.saveTasks();
      this.logUpdates(updates, 0);
    }
    return updates.length;
  }
}

// Export for use in other scripts
module.exports = DependencyResolver;

// Run if called directly
if (require.main === module) {
  const resolver = new DependencyResolver();
  resolver.run();
}