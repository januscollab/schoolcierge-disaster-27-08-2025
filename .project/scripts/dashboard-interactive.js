#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const Table = require('cli-table3');
const ora = require('ora');
const boxen = require('boxen');
const gradient = require('gradient-string');
const figlet = require('figlet');
const term = require('terminal-kit').terminal;

class InteractiveDashboard {
  constructor() {
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.progressPath = path.join(__dirname, '../tasks/PROGRESS.md');
    
    // creaite brand colors - teal focused
    this.creaiteGradient = gradient(['#00C9A7', '#00B4D8', '#0077B6']);
    this.aiGradient = gradient(['#FFD60A', '#FFC300', '#FFB700']);
    this.successGradient = gradient(['#06FFA5', '#00C9A7']);
    this.warningGradient = gradient(['#FFB700', '#FF9500']);
    this.dangerGradient = gradient(['#FF006E', '#C1121F']);
    this.infoGradient = gradient(['#4361EE', '#7209B7']);
  }

  loadTasks() {
    if (!fs.existsSync(this.tasksPath)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(this.tasksPath, 'utf8'));
  }

  getNextTasks() {
    const tasks = this.loadTasks();
    const nextTasks = [];
    
    // Priority 1: Unblocked P0 tasks
    const p0Tasks = tasks.filter(t => 
      t.priority === 'P0' && 
      t.status !== 'completed' && 
      t.status !== 'blocked'
    );
    
    // Priority 2: In-progress tasks
    const inProgress = tasks.filter(t => t.status === 'in-progress');
    
    // Priority 3: Unblocked P1 tasks not started
    const p1Ready = tasks.filter(t => 
      t.priority === 'P1' && 
      t.status === 'not-started' &&
      this.canStart(t, tasks)
    );
    
    // Priority 4: Any other unblocked tasks
    const otherReady = tasks.filter(t => 
      t.status === 'not-started' &&
      t.priority !== 'P0' && 
      t.priority !== 'P1' &&
      this.canStart(t, tasks)
    );
    
    return {
      critical: p0Tasks,
      inProgress: inProgress,
      recommended: [...p1Ready.slice(0, 3), ...otherReady.slice(0, 2)],
      blocked: tasks.filter(t => t.status === 'blocked'),
      blockers: this.findBlockers(tasks)
    };
  }

  canStart(task, allTasks) {
    if (!task.dependencies || !task.dependencies.required_for) {
      return true;
    }
    
    const deps = task.dependencies.required_for || [];
    const completedIds = allTasks
      .filter(t => t.status === 'completed')
      .map(t => t.id);
    
    return deps.every(depId => completedIds.includes(depId));
  }

  findBlockers(tasks) {
    const blockers = [];
    const blocked = tasks.filter(t => t.status === 'blocked');
    
    blocked.forEach(blockedTask => {
      const blockingIds = blockedTask.dependencies?.blocked_by || [];
      blockingIds.forEach(blockerId => {
        const blocker = tasks.find(t => t.id === blockerId);
        if (blocker && blocker.status !== 'completed') {
          if (!blockers.find(b => b.id === blocker.id)) {
            blockers.push({
              ...blocker,
              blocking: [blockedTask.id]
            });
          } else {
            const existing = blockers.find(b => b.id === blocker.id);
            existing.blocking.push(blockedTask.id);
          }
        }
      });
    });
    
    return blockers.sort((a, b) => b.blocking.length - a.blocking.length);
  }

  getCriticalPath(tasks) {
    // Find tasks on critical path (simplified version)
    const critical = [];
    
    // Start with P0 tasks
    const p0s = tasks.filter(t => t.priority === 'P0' && t.status !== 'completed');
    critical.push(...p0s);
    
    // Add their dependencies
    p0s.forEach(task => {
      if (task.dependencies?.required_for) {
        task.dependencies.required_for.forEach(depId => {
          const dep = tasks.find(t => t.id === depId);
          if (dep && dep.status !== 'completed' && !critical.find(c => c.id === dep.id)) {
            critical.push(dep);
          }
        });
      }
    });
    
    return critical;
  }

  displayCreaiteHeader() {
    console.clear();
    
    // Display CreaAIte logo with special AI highlighting
    console.log();
    console.log(this.creaiteGradient(figlet.textSync('CreaAIte', {
      font: 'Big',
      horizontalLayout: 'default'
    })));
    console.log();
    
    console.log(
      boxen(
        chalk.bold.cyan('🚀 Intelligent Development Dashboard') + '\n' +
        chalk.gray('Powered by ') + this.aiGradient.multiline('AI-driven insights'),
        {
          padding: 1,
          margin: { top: 1, bottom: 1 },
          borderStyle: 'double',
          borderColor: 'cyan',
          align: 'center'
        }
      )
    );
  }

  displayWhatsNext(nextTasks) {
    // What's Next Section
    console.log(this.creaiteGradient('\n━━━ 🎯 WHAT TO WORK ON NEXT ━━━\n'));
    
    // Critical Tasks
    if (nextTasks.critical.length > 0) {
      console.log(boxen(
        chalk.red.bold('⚠️  CRITICAL TASKS (P0)'),
        {
          borderColor: 'red',
          borderStyle: 'bold',
          padding: { left: 1, right: 1 }
        }
      ));
      
      nextTasks.critical.forEach(task => {
        console.log(
          chalk.red('  🔴 ') + 
          chalk.bold.white(task.id) + ': ' +
          chalk.yellow(task.title)
        );
        console.log(chalk.gray(`     Command: `) + chalk.cyan(`cx start ${task.id}`));
      });
      console.log();
    }
    
    // In Progress
    if (nextTasks.inProgress.length > 0) {
      console.log(chalk.yellow.bold('🔄 Continue In-Progress Tasks:\n'));
      
      const progressTable = new Table({
        head: [
          chalk.cyan('ID'),
          chalk.cyan('Title'),
          chalk.cyan('Progress'),
          chalk.cyan('Command')
        ],
        style: { border: ['cyan'] },
        colWidths: [12, 35, 15, 25]
      });
      
      nextTasks.inProgress.forEach(task => {
        progressTable.push([
          chalk.bold(task.id),
          task.title.substring(0, 33),
          this.generateMiniProgress(task.progress || 0),
          chalk.green(`cx update ${task.id}`)
        ]);
      });
      
      console.log(progressTable.toString());
    }
    
    // Recommended Next
    if (nextTasks.recommended.length > 0) {
      console.log(chalk.green.bold('\n✨ Recommended Next Tasks:\n'));
      
      const recTable = new Table({
        head: [
          chalk.cyan('Priority'),
          chalk.cyan('ID'),
          chalk.cyan('Title'),
          chalk.cyan('Quick Start')
        ],
        style: { border: ['green'] },
        colWidths: [10, 12, 35, 25]
      });
      
      nextTasks.recommended.forEach(task => {
        const priColor = task.priority === 'P1' ? chalk.yellow : 
                         task.priority === 'P2' ? chalk.blue : chalk.gray;
        recTable.push([
          priColor(task.priority),
          chalk.bold(task.id),
          task.title.substring(0, 33),
          chalk.green(`cx start ${task.id}`)
        ]);
      });
      
      console.log(recTable.toString());
    }
  }

  displayBlockers(nextTasks) {
    if (nextTasks.blockers.length > 0) {
      console.log(this.dangerGradient('\n━━━ 🚧 CRITICAL BLOCKERS ━━━\n'));
      
      console.log(chalk.red.bold('These tasks are blocking others - prioritize them!\n'));
      
      const blockerTable = new Table({
        head: [
          chalk.red('Blocker ID'),
          chalk.red('Status'),
          chalk.red('Blocking'),
          chalk.red('Action')
        ],
        style: { border: ['red'] },
        colWidths: [12, 12, 25, 30]
      });
      
      nextTasks.blockers.slice(0, 5).forEach(blocker => {
        blockerTable.push([
          chalk.bold.red(blocker.id),
          chalk.yellow(blocker.status),
          chalk.white(blocker.blocking.join(', ')),
          chalk.cyan(`cx start ${blocker.id}`)
        ]);
      });
      
      console.log(blockerTable.toString());
    }
  }

  displayCriticalPath(tasks) {
    const critical = this.getCriticalPath(tasks);
    
    if (critical.length > 0) {
      console.log(this.infoGradient('\n━━━ 🎯 CRITICAL PATH ━━━\n'));
      
      console.log(chalk.bold('Tasks that directly impact project completion:\n'));
      
      const pathTable = new Table({
        head: [
          chalk.magenta('Order'),
          chalk.magenta('ID'),
          chalk.magenta('Title'),
          chalk.magenta('Status'),
          chalk.magenta('Impact')
        ],
        style: { border: ['magenta'] },
        colWidths: [8, 12, 30, 12, 20]
      });
      
      critical.forEach((task, idx) => {
        const statusColor = task.status === 'completed' ? chalk.green :
                           task.status === 'in-progress' ? chalk.yellow :
                           task.status === 'blocked' ? chalk.red : chalk.gray;
        
        pathTable.push([
          chalk.bold(`#${idx + 1}`),
          chalk.bold(task.id),
          task.title.substring(0, 28),
          statusColor(task.status),
          chalk.magenta('High')
        ]);
      });
      
      console.log(pathTable.toString());
    }
  }

  displayQuickCommands() {
    console.log(this.creaiteGradient('\n━━━ ⚡ QUICK COMMANDS ━━━\n'));
    
    const commands = [
      ['cx next', 'Show what to work on next'],
      ['cx list', 'List all tasks with filters'],
      ['cx detail [ID]', 'Show task details'],
      ['cx start [ID]', 'Start working on a task'],
      ['cx update [ID]', 'Update task progress'],
      ['cx complete [ID]', 'Mark task as complete'],
      ['cx add "[title]"', 'Add a new task'],
      ['cx dashboard', 'Show this dashboard'],
      ['cx status', 'Show progress overview'],
      ['cx sprint', 'View sprint status']
    ];
    
    const cmdTable = new Table({
      style: { border: ['cyan'] },
      colWidths: [25, 45]
    });
    
    commands.forEach(([cmd, desc]) => {
      cmdTable.push([
        chalk.cyan.bold(cmd),
        chalk.gray(desc)
      ]);
    });
    
    console.log(cmdTable.toString());
  }

  displayDevelopmentTips() {
    console.log(this.successGradient('\n━━━ 💡 AI INSIGHTS & TIPS ━━━\n'));
    
    const tasks = this.loadTasks();
    const metrics = this.calculateQuickMetrics(tasks);
    const tips = this.generateSmartTips(metrics, tasks);
    
    const tipBox = boxen(
      tips.map((tip, idx) => 
        chalk.bold.cyan(`${idx + 1}. `) + chalk.white(tip)
      ).join('\n\n'),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'cyan'
      }
    );
    
    console.log(tipBox);
  }

  calculateQuickMetrics(tasks) {
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      notStarted: tasks.filter(t => t.status === 'not-started').length,
      p0Count: tasks.filter(t => t.priority === 'P0').length,
      p0Incomplete: tasks.filter(t => t.priority === 'P0' && t.status !== 'completed').length
    };
  }

  generateSmartTips(metrics, tasks) {
    const tips = [];
    
    // Tip based on blocked tasks
    if (metrics.blocked > 2) {
      tips.push(`🚧 You have ${metrics.blocked} blocked tasks. Focus on unblocking them by completing their dependencies first.`);
    }
    
    // Tip based on in-progress tasks
    if (metrics.inProgress > 3) {
      tips.push(`📋 Consider finishing some of your ${metrics.inProgress} in-progress tasks before starting new ones to avoid context switching.`);
    } else if (metrics.inProgress === 0 && metrics.notStarted > 0) {
      tips.push(`🚀 No tasks in progress! Use 'cx next' to find the best task to start working on.`);
    }
    
    // Critical path tip
    if (metrics.p0Incomplete > 0) {
      tips.push(`🔴 You have ${metrics.p0Incomplete} critical (P0) tasks incomplete. These should be your top priority!`);
    }
    
    // Velocity tip
    const completionRate = (metrics.completed / metrics.total * 100).toFixed(0);
    if (completionRate > 75) {
      tips.push(`🎉 Excellent progress at ${completionRate}% complete! You're in the home stretch.`);
    } else if (completionRate < 25) {
      tips.push(`💪 Project is ${completionRate}% complete. Focus on quick wins to build momentum.`);
    }
    
    // Dependency tip
    const blockers = this.findBlockers(tasks);
    if (blockers.length > 0) {
      const topBlocker = blockers[0];
      tips.push(`🔓 Task ${topBlocker.id} is blocking ${topBlocker.blocking.length} other tasks. Completing it will unlock multiple work streams.`);
    }
    
    return tips.length > 0 ? tips : [
      '✨ Everything looks good! Use "cx next" to see recommended tasks.',
      '📊 Run "cx status" for a detailed progress report.'
    ];
  }

  generateMiniProgress(percentage) {
    const width = 10;
    const filled = Math.round(width * percentage / 100);
    const empty = width - filled;
    
    let bar = '';
    for (let i = 0; i < filled; i++) {
      bar += chalk.green('█');
    }
    for (let i = 0; i < empty; i++) {
      bar += chalk.gray('░');
    }
    
    return bar + ' ' + chalk.bold(`${percentage}%`);
  }

  async run() {
    const spinner = ora({
      text: 'Loading dashboard data...',
      spinner: {
        interval: 80,
        frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
      },
      color: 'cyan'
    }).start();

    await new Promise(resolve => setTimeout(resolve, 800));
    
    const tasks = this.loadTasks();
    const nextTasks = this.getNextTasks();
    
    spinner.succeed(chalk.green('Dashboard loaded successfully!'));
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Display dashboard
    this.displayCreaiteHeader();
    this.displayWhatsNext(nextTasks);
    this.displayBlockers(nextTasks);
    this.displayCriticalPath(tasks);
    this.displayDevelopmentTips();
    this.displayQuickCommands();
    
    // Footer
    console.log('\n' + chalk.gray('─'.repeat(80)));
    console.log(
      chalk.gray('Last updated: ') + 
      chalk.white(new Date().toLocaleString()) +
      chalk.gray(' | ') +
      this.creaiteGradient('Powered by creAIte') +
      chalk.gray(' | ') +
      chalk.cyan('cx dashboard') +
      chalk.gray(' to refresh')
    );
    
    // Exit cleanly
    term.processExit(0);
  }
}

// Run the dashboard
const dashboard = new InteractiveDashboard();
dashboard.run().catch(err => {
  console.error(chalk.red('Error:'), err);
  process.exit(1);
});