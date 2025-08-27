#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const ora = require('ora');
const gradient = require('gradient-string');
const boxenLib = require('boxen');
const ProgressTracker = require('./progress-tracker');
const boxen = boxenLib.default || boxenLib;
const Table = require('cli-table3');

// creaite branding
const creaiteGradient = gradient(['#0891b2', '#06b6d4', '#14b8a6']);
const aiGradient = gradient(['#fbbf24', '#f59e0b', '#fb923c']);
const successGradient = gradient(['#10b981', '#059669']);
const dangerGradient = gradient(['#ef4444', '#dc2626']);

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

class TaskStarter {
  constructor() {
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.qualityChecksPassed = true;
    this.taskId = process.argv[2];
  }

  displayHeader() {
    console.clear();
    console.log('\n' + creaiteGradient('━'.repeat(60)));
    console.log(
      '    ' +
        colors.bold +
        creaiteGradient('cre') +
        aiGradient('ai') +
        creaiteGradient('te') +
        colors.reset +
        ' ' +
        colors.bold +
        '🚀 Smart Task Starter' +
        colors.reset
    );
    console.log(creaiteGradient('━'.repeat(60)) + '\n');
  }

  async runQualityChecks() {
    console.log(colors.bold + '🔍 Running Quality Checks...\n' + colors.reset);

    const checks = [
      { name: 'Code Linting', command: 'npm run lint', autofix: 'npm run lint:fix' },
      { name: 'Code Formatting', command: 'npm run format:check', autofix: 'npm run format' },
      { name: 'Security Audit', command: 'npm run security:audit', autofix: null },
      { name: 'Unit Tests', command: 'npm test', autofix: null },
    ];

    const results = [];

    for (const check of checks) {
      const spinner = ora(check.name).start();

      try {
        execSync(check.command, { stdio: 'pipe', encoding: 'utf8' });
        spinner.succeed(colors.green + check.name + ' ✓' + colors.reset);
        results.push({ name: check.name, status: 'passed', fixable: false });
      } catch (error) {
        if (check.autofix) {
          spinner.warn(colors.yellow + check.name + ' - Attempting auto-fix...' + colors.reset);

          try {
            execSync(check.autofix, { stdio: 'pipe', encoding: 'utf8' });

            // Re-run check after fix
            try {
              execSync(check.command, { stdio: 'pipe', encoding: 'utf8' });
              spinner.succeed(colors.green + check.name + ' ✓ (auto-fixed)' + colors.reset);
              results.push({ name: check.name, status: 'fixed', fixable: true });
            } catch {
              spinner.fail(colors.red + check.name + ' ✗ (fix failed)' + colors.reset);
              results.push({ name: check.name, status: 'failed', fixable: true });
              this.qualityChecksPassed = false;
            }
          } catch {
            spinner.fail(colors.red + check.name + ' ✗' + colors.reset);
            results.push({ name: check.name, status: 'failed', fixable: true });
            this.qualityChecksPassed = false;
          }
        } else {
          spinner.fail(colors.red + check.name + ' ✗' + colors.reset);
          results.push({ name: check.name, status: 'failed', fixable: false });

          // Security and tests are warnings, not blockers
          if (check.name !== 'Security Audit' && check.name !== 'Unit Tests') {
            this.qualityChecksPassed = false;
          }
        }
      }
    }

    return results;
  }

  async checkGitStatus() {
    const spinner = ora('Checking Git status...').start();

    try {
      // Check for uncommitted changes
      const status = execSync('git status --porcelain', { encoding: 'utf8' });

      if (status.trim()) {
        spinner.warn(colors.yellow + 'Uncommitted changes detected' + colors.reset);

        console.log('\n' + colors.bold + 'Modified files:' + colors.reset);
        console.log(colors.gray + status + colors.reset);

        // Auto-stash changes
        console.log(colors.cyan + 'Stashing changes...' + colors.reset);
        execSync('git stash push -m "Auto-stash before starting ' + this.taskId + '"', {
          stdio: 'pipe',
        });

        return { hasChanges: true, stashed: true };
      }

      spinner.succeed(colors.green + 'Working directory clean' + colors.reset);
      return { hasChanges: false, stashed: false };
    } catch (error) {
      spinner.fail(colors.red + 'Git check failed' + colors.reset);
      return { hasChanges: false, stashed: false, error: true };
    }
  }

  async createTaskBranch() {
    const branchName = `task/${this.taskId.toLowerCase()}`;
    const spinner = ora(`Creating branch: ${branchName}`).start();

    try {
      // Ensure we're on main
      execSync('git checkout main', { stdio: 'pipe' });

      // Pull latest changes
      execSync('git pull origin main', { stdio: 'pipe' });

      // Create and checkout new branch
      execSync(`git checkout -b ${branchName}`, { stdio: 'pipe' });

      spinner.succeed(colors.green + `Created branch: ${branchName}` + colors.reset);
      return branchName;
    } catch (error) {
      // Branch might already exist
      try {
        execSync(`git checkout ${branchName}`, { stdio: 'pipe' });
        spinner.warn(colors.yellow + `Switched to existing branch: ${branchName}` + colors.reset);
        return branchName;
      } catch {
        spinner.fail(colors.red + 'Failed to create/switch branch' + colors.reset);
        return null;
      }
    }
  }

  updateTaskStatus() {
    const spinner = ora('Updating task status...').start();

    try {
      const tasks = JSON.parse(fs.readFileSync(this.tasksPath, 'utf8'));
      const task = tasks.find((t) => t.id === this.taskId);

      if (!task) {
        spinner.fail(colors.red + `Task ${this.taskId} not found` + colors.reset);
        return null;
      }

      task.status = 'in-progress';
      task.started_at = new Date().toISOString();
      task.progress = task.progress || 10;

      fs.writeFileSync(this.tasksPath, JSON.stringify(tasks, null, 2));

      // Start automatic progress tracking
      const tracker = new ProgressTracker();
      tracker.updateAllProgress();

      spinner.succeed(colors.green + `Task ${this.taskId} marked as in-progress` + colors.reset);
      return task;
    } catch (error) {
      spinner.fail(colors.red + 'Failed to update task status' + colors.reset);
      return null;
    }
  }

  displaySummary(results, gitStatus, branchName, task) {
    console.log('\n' + creaiteGradient('━'.repeat(60)));
    console.log(colors.bold + '📋 Task Start Summary' + colors.reset);
    console.log(creaiteGradient('━'.repeat(60)) + '\n');

    // Quality Checks Summary
    const qualityTable = new Table({
      head: ['Check', 'Status'],
      style: { border: ['cyan'] },
    });

    results.forEach((result) => {
      const statusText =
        result.status === 'passed'
          ? colors.green + '✅ Passed' + colors.reset
          : result.status === 'fixed'
            ? colors.yellow + '🔧 Auto-fixed' + colors.reset
            : colors.red + '❌ Failed' + colors.reset;
      qualityTable.push([result.name, statusText]);
    });

    console.log(qualityTable.toString());

    // Git Status
    console.log('\n' + colors.bold + '🌿 Git Workflow:' + colors.reset);
    console.log('  Branch: ' + colors.cyan + branchName + colors.reset);
    if (gitStatus.stashed) {
      console.log('  ' + colors.yellow + '📦 Changes stashed' + colors.reset);
    }

    // Task Info
    if (task) {
      console.log('\n' + colors.bold + '📝 Task Details:' + colors.reset);
      console.log('  ID: ' + colors.bold + task.id + colors.reset);
      console.log('  Title: ' + task.title);
      console.log('  Priority: ' + task.priority);
      console.log('  Status: ' + colors.green + 'in-progress' + colors.reset);
    }

    // Next Steps
    console.log('\n' + colors.bold + '👉 Next Steps:' + colors.reset);
    console.log('  1. Make your changes');
    console.log(
      '  2. Run ' + colors.cyan + `cx update ${this.taskId}` + colors.reset + ' to track progress'
    );
    console.log('  3. Commit frequently with ' + colors.cyan + 'git commit' + colors.reset);
    console.log(
      '  4. Run ' + colors.cyan + `cx complete ${this.taskId}` + colors.reset + ' when done'
    );
    console.log('  5. Create PR with ' + colors.cyan + 'gh pr create' + colors.reset);

    // AI Tip
    console.log('\n' + aiGradient('🤖 ai Tip:'));
    console.log(
      colors.gray +
        'Keep commits small and focused. Each commit should represent one logical change.' +
        colors.reset
    );
  }

  async run() {
    this.displayHeader();

    if (!this.taskId) {
      console.log(colors.red + 'Error: Task ID required' + colors.reset);
      console.log('Usage: ' + colors.cyan + 'cx build TASK-001' + colors.reset);
      process.exit(1);
    }

    // Step 1: Run quality checks
    console.log(
      boxen(colors.bold + '🏁 Starting Task: ' + this.taskId + colors.reset, {
        padding: 1,
        borderStyle: 'double',
        borderColor: 'cyan',
        align: 'center',
      })
    );
    console.log();

    const results = await this.runQualityChecks();

    // Step 2: Check git status
    console.log('\n' + colors.bold + '📂 Git Management...\n' + colors.reset);
    const gitStatus = await this.checkGitStatus();

    // Step 3: Create task branch
    const branchName = await this.createTaskBranch();

    // Step 4: Update task status
    const task = this.updateTaskStatus();

    // Step 5: Display summary
    this.displaySummary(results, gitStatus, branchName, task);

    if (!this.qualityChecksPassed) {
      console.log('\n' + dangerGradient('⚠️  Quality checks failed!'));
      console.log(colors.yellow + 'Fix the issues above before proceeding.' + colors.reset);
    } else {
      console.log('\n' + successGradient('✅ Ready to start coding!'));
    }

    console.log('\n' + creaiteGradient('━'.repeat(60)) + '\n');
  }
}

// Run the task starter
const starter = new TaskStarter();
starter.run().catch((err) => {
  console.error(colors.red + 'Task start failed:' + colors.reset, err.message);
  process.exit(1);
});
