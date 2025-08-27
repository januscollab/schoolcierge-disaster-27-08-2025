#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const { spawn } = require('child_process');
const ParallelTaskAnalyzer = require('./parallel-analyzer');

class ParallelTaskExecutor {
  constructor() {
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.tasks = [];
    this.runningTasks = new Map();
    this.completedTasks = [];
    this.failedTasks = [];
    this.analyzer = new ParallelTaskAnalyzer();
  }

  loadTasks() {
    if (!fs.existsSync(this.tasksPath)) {
      console.error(chalk.red('Error: backlog.json not found'));
      process.exit(1);
    }
    this.tasks = JSON.parse(fs.readFileSync(this.tasksPath, 'utf8'));
  }

  saveTasks() {
    fs.writeFileSync(this.tasksPath, JSON.stringify(this.tasks, null, 2));
  }

  async startTasks(taskIds) {
    console.log(chalk.cyan.bold('\n🚀 Starting Parallel Task Execution\n'));

    // Validate all tasks exist and can start
    const validTasks = [];
    for (const taskId of taskIds) {
      const task = this.tasks.find((t) => t.id === taskId);

      if (!task) {
        console.log(chalk.red(`❌ Task ${taskId} not found`));
        continue;
      }

      if (task.status === 'completed') {
        console.log(chalk.gray(`✓ Task ${taskId} already completed`));
        continue;
      }

      if (task.status === 'in-progress') {
        console.log(chalk.yellow(`⚠ Task ${taskId} already in progress`));
        continue;
      }

      if (!this.canStart(task)) {
        console.log(chalk.red(`⛔ Task ${taskId} has unmet dependencies`));
        continue;
      }

      validTasks.push(task);
    }

    if (validTasks.length === 0) {
      console.log(chalk.red('\nNo valid tasks to start'));
      return;
    }

    // Start all valid tasks
    console.log(chalk.green(`\n✅ Starting ${validTasks.length} tasks in parallel:\n`));

    for (const task of validTasks) {
      this.startTask(task);
    }

    // Monitor progress
    await this.monitorProgress();
  }

  canStart(task) {
    const blockedBy = task.dependencies?.blocked_by || [];
    if (blockedBy.length === 0) return true;

    return blockedBy.every((blockerId) => {
      const blocker = this.tasks.find((t) => t.id === blockerId);
      return blocker && blocker.status === 'completed';
    });
  }

  startTask(task) {
    // Update task status
    task.status = 'in-progress';
    task.started_at = new Date().toISOString();
    task.progress = task.progress || 0;

    // Create a spinner for this task
    const spinner = ora({
      text: `${task.id}: ${task.title}`,
      prefixText: chalk.cyan(`[${task.category}]`),
      color: 'cyan',
    }).start();

    // Store task info
    this.runningTasks.set(task.id, {
      task,
      spinner,
      startTime: Date.now(),
    });

    // Save updated status
    this.saveTasks();

    // Simulate task execution (in real implementation, would run actual task scripts)
    this.simulateTaskExecution(task);
  }

  simulateTaskExecution(task) {
    const estimatedHours = parseInt(task.estimates?.effort_hours || 8);
    const simulationTime = Math.random() * 5000 + 3000; // 3-8 seconds for demo

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      const taskInfo = this.runningTasks.get(task.id);
      if (taskInfo && task.progress < 90) {
        task.progress = Math.min(90, task.progress + Math.random() * 20);
        taskInfo.spinner.text = `${task.id}: ${task.title} (${Math.round(task.progress)}%)`;
        this.saveTasks();
      }
    }, simulationTime / 5);

    // Complete or fail the task
    setTimeout(() => {
      clearInterval(progressInterval);

      // 80% success rate for simulation
      const success = Math.random() > 0.2;

      if (success) {
        this.completeTask(task);
      } else {
        this.failTask(task, 'Simulated failure for demo');
      }
    }, simulationTime);
  }

  completeTask(task) {
    const taskInfo = this.runningTasks.get(task.id);

    if (taskInfo) {
      task.status = 'completed';
      task.progress = 100;
      task.completed_at = new Date().toISOString();

      const duration = ((Date.now() - taskInfo.startTime) / 1000).toFixed(1);
      taskInfo.spinner.succeed(
        chalk.green(`${task.id}: ${task.title} (completed in ${duration}s)`)
      );

      this.runningTasks.delete(task.id);
      this.completedTasks.push(task);

      // Check for newly unblocked tasks
      this.checkNewlyUnblocked(task);

      this.saveTasks();
    }
  }

  failTask(task, error) {
    const taskInfo = this.runningTasks.get(task.id);

    if (taskInfo) {
      task.status = 'blocked';
      task.error = error;

      taskInfo.spinner.fail(chalk.red(`${task.id}: ${task.title} (${error})`));

      this.runningTasks.delete(task.id);
      this.failedTasks.push(task);

      this.saveTasks();
    }
  }

  checkNewlyUnblocked(completedTask) {
    const unblocked = [];

    this.tasks.forEach((task) => {
      if (task.status === 'not-started' || task.status === 'blocked') {
        const blockedBy = task.dependencies?.blocked_by || [];
        if (blockedBy.includes(completedTask.id)) {
          // Check if all other dependencies are also met
          if (this.canStart(task)) {
            unblocked.push(task);
          }
        }
      }
    });

    if (unblocked.length > 0) {
      console.log(
        chalk.yellow(`\n🔓 Unblocked ${unblocked.length} task(s): `) +
          chalk.cyan(unblocked.map((t) => t.id).join(', '))
      );
    }

    return unblocked;
  }

  async monitorProgress() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.runningTasks.size === 0) {
          clearInterval(checkInterval);
          this.displaySummary();
          resolve();
        }
      }, 100);
    });
  }

  displaySummary() {
    console.log('\n' + chalk.cyan('═'.repeat(60)));
    console.log(chalk.bold.cyan('\n📊 Parallel Execution Summary\n'));

    if (this.completedTasks.length > 0) {
      console.log(chalk.green(`✅ Completed: ${this.completedTasks.length} tasks`));
      this.completedTasks.forEach((task) => {
        console.log(chalk.gray(`   • ${task.id}: ${task.title}`));
      });
    }

    if (this.failedTasks.length > 0) {
      console.log(chalk.red(`\n❌ Failed: ${this.failedTasks.length} tasks`));
      this.failedTasks.forEach((task) => {
        console.log(chalk.gray(`   • ${task.id}: ${task.error}`));
      });
    }

    // Show newly available parallel tasks
    const analysis = this.analyzer.run({ quiet: true });
    if (analysis.currentlyParallelizable.length > 0) {
      const nextCount = analysis.currentlyParallelizable.reduce(
        (sum, g) => sum + g.tasks.length,
        0
      );
      console.log(chalk.yellow(`\n💡 ${nextCount} new task(s) ready for parallel execution`));
    }

    console.log('\n' + chalk.cyan('═'.repeat(60)));
  }

  async autoSelectParallel() {
    // Auto-select best tasks to run in parallel
    const analysis = this.analyzer.run({ quiet: true });

    if (analysis.currentlyParallelizable.length === 0) {
      console.log(chalk.yellow('No tasks available for parallel execution'));
      return;
    }

    // Get highest priority group
    const topGroup = analysis.currentlyParallelizable[0];
    const taskIds = topGroup.tasks.map((t) => t.id);

    console.log(chalk.cyan.bold('\n🤖 AI-Selected Parallel Tasks:\n'));
    console.log(chalk.white(`Priority: ${topGroup.priority}`));
    console.log(chalk.white(`Category: ${topGroup.category}`));
    console.log(chalk.white(`Tasks: ${taskIds.join(', ')}\n`));

    await this.startTasks(taskIds);
  }
}

// CLI handling
if (require.main === module) {
  const executor = new ParallelTaskExecutor();
  executor.loadTasks();

  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--auto') {
    // Auto-select best parallel tasks
    executor.autoSelectParallel().catch(console.error);
  } else {
    // Start specified tasks
    executor.startTasks(args).catch(console.error);
  }
}

module.exports = ParallelTaskExecutor;
