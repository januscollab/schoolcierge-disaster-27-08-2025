#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Table = require('cli-table3');
const ora = require('ora');
const boxenLib = require('boxen');
const boxen = boxenLib.default || boxenLib;
const gradient = require('gradient-string');
const figlet = require('figlet');
const { logEvent } = require('./event-ticker');
const TaskState = require('./task-state-manager');

// ANSI color codes as chalk replacement
const chalk = {
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
  italic: (text) => `\x1b[3m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  white: (text) => `\x1b[37m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`
};

// Compound styles
chalk.cyan.bold = (text) => chalk.bold(chalk.cyan(text));
chalk.green.bold = (text) => chalk.bold(chalk.green(text));
chalk.yellow.bold = (text) => chalk.bold(chalk.yellow(text));
chalk.red.bold = (text) => chalk.bold(chalk.red(text));
chalk.gray.bold = (text) => chalk.bold(chalk.gray(text));
chalk.blue.bold = (text) => chalk.bold(chalk.blue(text));
chalk.bold.cyan = (text) => chalk.bold(chalk.cyan(text));
chalk.bold.white = (text) => chalk.bold(chalk.white(text));
chalk.bold.green = (text) => chalk.bold(chalk.green(text));
chalk.bold.red = (text) => chalk.bold(chalk.red(text));
chalk.bold.yellow = (text) => chalk.bold(chalk.yellow(text));
chalk.bold.gray = (text) => chalk.bold(chalk.gray(text));
chalk.bold.blue = (text) => chalk.bold(chalk.blue(text));

class CleanStatusReporter {
  constructor() {
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.progressPath = path.join(__dirname, '../tasks/PROGRESS.md');
    this.brandGradient = gradient(['#667eea', '#764ba2', '#f093fb']);
  }

  async loadTasks() {
    try {
      return await TaskState.getTasks();
    } catch (error) {
      console.error('Failed to load tasks:', error.message);
      return [];
    }
  }

  async calculateMetrics() {
    const tasks = await this.loadTasks();
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
      stuckTasks: [],
      averageProgress: 0,
      velocity: {
        daily: 0,
        weekly: 0
      }
    };

    if (tasks.length === 0) {
      return metrics;
    }

    const now = Date.now();
    const dayMS = 86400000;

    tasks.forEach(task => {
      // Use ACTUAL status from task data - don't recalculate
      const status = task.status;
      metrics.byStatus[status] = (metrics.byStatus[status] || 0) + 1;
      metrics.byPriority[task.priority] = (metrics.byPriority[task.priority] || 0) + 1;

      // Track in-progress tasks
      if (status === 'in-progress') {
        metrics.inProgressTasks.push({
          id: task.id,
          title: task.title,
          progress: task.progress || 0,
          isStuck: false
        });

        // Check if genuinely stuck (no protected flags)
        if (!task.implementation_notes?.verified && 
            !task.implementation_notes?.do_not_revert) {
          const started = task.started_at ? new Date(task.started_at).getTime() : now;
          const updated = task.updated_at ? new Date(task.updated_at).getTime() : started;
          const ageInDays = (now - started) / dayMS;
          const staleDays = (now - updated) / dayMS;
          
          if ((task.progress < 20 && ageInDays > 2) || 
              (staleDays > 3 && task.progress < 50)) {
            metrics.stuckTasks.push({
              id: task.id,
              title: task.title,
              progress: task.progress,
              daysSinceStart: Math.round(ageInDays),
              daysSinceUpdate: Math.round(staleDays)
            });
            // Mark as stuck in inProgressTasks
            const inProgressItem = metrics.inProgressTasks.find(t => t.id === task.id);
            if (inProgressItem) inProgressItem.isStuck = true;
          }
        }
      }

      // Track blocked tasks (exclude completed tasks)
      if ((status === 'blocked' || (task.dependencies?.blocked_by?.length > 0)) && status !== 'completed') {
        metrics.blockedTasks.push({
          id: task.id,
          title: task.title,
          blockedBy: task.dependencies?.blocked_by || []
        });
      }
    });

    // Calculate completion rate - use ACTUAL completed count
    metrics.completionRate = ((metrics.byStatus.completed / metrics.total) * 100).toFixed(1);
    
    // Calculate average progress of in-progress tasks
    if (metrics.inProgressTasks.length > 0) {
      const totalProgress = metrics.inProgressTasks.reduce((sum, t) => sum + t.progress, 0);
      metrics.averageProgress = Math.round(totalProgress / metrics.inProgressTasks.length);
    }

    // Simple velocity calculation based on completed tasks
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.completed_at);
    if (completedTasks.length > 0) {
      const oldestCompletion = Math.min(...completedTasks.map(t => new Date(t.completed_at).getTime()));
      const daysActive = Math.max(1, (now - oldestCompletion) / dayMS);
      metrics.velocity.daily = (completedTasks.length / daysActive).toFixed(1);
      metrics.velocity.weekly = (metrics.velocity.daily * 7).toFixed(1);
    }

    return metrics;
  }

  displayFigletHeader() {
    try {
      const text = 'CREAITE';
      const figletText = figlet.textSync(text, {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default'
      });
      
      const lines = figletText.split('\n');
      const coloredLines = lines.map(line => {
        return line.split('').map((char, i) => {
          const pos = i / line.length;
          if (pos < 0.3 || pos > 0.7) return chalk.cyan(char);
          return chalk.yellow(char);
        }).join('');
      });
      
      console.log(coloredLines.join('\n'));
    } catch (error) {
      console.log(this.brandGradient('CREAITE'));
    }
  }

  async displayStatus() {
    console.clear();
    const metrics = await this.calculateMetrics();
    
    // Header
    this.displayFigletHeader();
    console.log(boxen(
      chalk.bold.white('🚀 Task Management System'),
      {
        padding: 1,
        borderStyle: 'double',
        borderColor: 'white',
        align: 'center'
      }
    ));

    // Overall Progress
    console.log('\n━━━ OVERALL PROGRESS ━━━\n');
    const progressBar = this.generateProgressBar(parseFloat(metrics.completionRate), 40);
    console.log(`${chalk.bold('  📊 Completion: ')}${progressBar} ${chalk.bold(`${metrics.completionRate}%`)}`);
    console.log(`${chalk.bold('  📈 Total Tasks: ')}${chalk.bold(chalk.green(`${metrics.byStatus.completed}/${metrics.total}`))}`);

    // Status Distribution
    console.log('\n━━━ STATUS DISTRIBUTION ━━━\n');
    const statusTable = new Table({
      head: [chalk.bold.cyan('Status'), chalk.bold.cyan('Count'), chalk.bold.cyan('Progress'), chalk.bold.cyan('Icon')],
      style: { head: [], border: ['cyan'] }
    });

    statusTable.push(
      [chalk.green('Completed'), chalk.bold.green(metrics.byStatus.completed), 
       this.generateProgressBar(metrics.byStatus.completed / Math.max(metrics.total, 1) * 100, 25), '✅'],
      [chalk.yellow('In Progress'), chalk.bold.yellow(metrics.byStatus['in-progress']), 
       this.generateProgressBar(metrics.byStatus['in-progress'] / Math.max(metrics.total, 1) * 100, 25), '🔄'],
      [chalk.red('Blocked'), chalk.bold.red(metrics.byStatus.blocked), 
       this.generateProgressBar(metrics.byStatus.blocked / Math.max(metrics.total, 1) * 100, 25), '🚫'],
      [chalk.gray('Not Started'), chalk.bold.gray(metrics.byStatus['not-started']), 
       this.generateProgressBar(metrics.byStatus['not-started'] / Math.max(metrics.total, 1) * 100, 25), '⭕']
    );
    console.log(statusTable.toString());

    // Priority Breakdown
    console.log('\n━━━ PRIORITY BREAKDOWN ━━━\n');
    const priorityTable = new Table({
      head: [], 
      style: { head: [], border: ['magenta'] }
    });
    priorityTable.push(
      [chalk.bold.red('🔴 P0 Critical'), chalk.bold(metrics.byPriority.P0)],
      [chalk.bold.yellow('🟡 P1 High'), chalk.bold(metrics.byPriority.P1)],
      [chalk.bold.blue('🔵 P2 Medium'), chalk.bold(metrics.byPriority.P2)],
      [chalk.bold.gray('⚪ P3 Low'), chalk.bold(metrics.byPriority.P3)]
    );
    console.log(priorityTable.toString());

    // Velocity Metrics
    console.log('\n━━━ VELOCITY METRICS ━━━\n');
    console.log(boxen(
      `${chalk.bold('📅 Daily: ')}${metrics.velocity.daily} tasks/day\n` +
      `${chalk.bold('📆 Weekly: ')}${metrics.velocity.weekly} tasks/week\n` +
      `${chalk.bold('📈 Average Progress: ')}${metrics.averageProgress}%`,
      { padding: { left: 2, right: 2 }, borderStyle: 'round' }
    ));

    // Currently In Progress
    if (metrics.inProgressTasks.length > 0) {
      console.log('\n━━━ CURRENTLY IN PROGRESS ━━━\n');
      metrics.inProgressTasks.forEach(task => {
        const icon = task.isStuck ? '⚠️' : '🔨';
        const color = task.isStuck ? chalk.yellow : chalk.cyan;
        console.log(
          `${chalk.bold.cyan(`  ${icon} ${task.id}: `)}${chalk.white(task.title.substring(0, 50))}${chalk.gray(` (${task.progress}%)`)}`
        );
      });
    }

    // Stuck Tasks (if any)
    if (metrics.stuckTasks.length > 0) {
      console.log('\n━━━ ⚠️ TASKS NEEDING ATTENTION ━━━\n');
      metrics.stuckTasks.forEach(task => {
        console.log(
          chalk.yellow(`  ⚠️ ${task.id}: ${task.title.substring(0, 50)}`)
        );
        console.log(
          chalk.gray(`     └─ ${task.progress}% progress | ${task.daysSinceStart} days old | ${task.daysSinceUpdate} days since update`)
        );
      });
    }

    // Blocked Tasks (if any)
    if (metrics.blockedTasks.length > 0) {
      console.log('\n━━━ BLOCKED TASKS ━━━\n');
      metrics.blockedTasks.slice(0, 5).forEach(task => {
        console.log(
          chalk.red(`  ⛔ ${task.id}: ${task.title.substring(0, 50)}`)
        );
        if (task.blockedBy.length > 0) {
          console.log(chalk.gray(`     └─ Blocked by: ${task.blockedBy.join(', ')}`));
        }
      });
    }

    // Footer
    console.log('\n' + chalk.gray('─'.repeat(80)));
    console.log(
      chalk.gray('Last updated: ') + 
      chalk.white(new Date().toLocaleString()) +
      chalk.gray(' | ') +
      chalk.cyan('cx status') +
      chalk.gray(' to refresh')
    );
  }

  generateProgressBar(percentage, width = 20) {
    const filled = Math.round(width * percentage / 100);
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

  generateMarkdownReport(metrics) {
    return `# 📊 SchoolCierge Development Progress

*Last Updated: ${new Date().toLocaleString()} | Auto-generated*

## 🎯 Overall Progress: ${metrics.completionRate}% Complete (${metrics.byStatus.completed}/${metrics.total} tasks)

\`\`\`
${this.generateProgressBar(parseFloat(metrics.completionRate), 20).replace(/\x1b\[[0-9;]*m/g, '')}
\`\`\`

## 📈 Progress by Status

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Completed | ${metrics.byStatus.completed} | ${((metrics.byStatus.completed / metrics.total) * 100).toFixed(1)}% |
| 🔄 In Progress | ${metrics.byStatus['in-progress']} | ${((metrics.byStatus['in-progress'] / metrics.total) * 100).toFixed(1)}% |
| 🚫 Blocked | ${metrics.byStatus.blocked} | ${((metrics.byStatus.blocked / metrics.total) * 100).toFixed(1)}% |
| ⭕ Not Started | ${metrics.byStatus['not-started']} | ${((metrics.byStatus['not-started'] / metrics.total) * 100).toFixed(1)}% |

## 📊 Priority Breakdown

- **P0 (Critical)**: ${metrics.byPriority.P0}
- **P1 (High)**: ${metrics.byPriority.P1}
- **P2 (Medium)**: ${metrics.byPriority.P2}
- **P3 (Low)**: ${metrics.byPriority.P3}

${metrics.inProgressTasks.length > 0 ? `
## 🔄 Currently In Progress

${metrics.inProgressTasks.map(t => 
  `- **${t.id}**: ${t.title} (${t.progress}% complete)${t.isStuck ? ' ⚠️' : ''}`
).join('\n')}
` : ''}

${metrics.stuckTasks.length > 0 ? `
## ⚠️ Tasks Needing Attention

${metrics.stuckTasks.map(t => 
  `- **${t.id}**: ${t.title}\n  - Progress: ${t.progress}% | ${t.daysSinceStart} days old | ${t.daysSinceUpdate} days since update`
).join('\n')}
` : ''}

${metrics.blockedTasks.length > 0 ? `
## 🚧 Blocked Tasks

${metrics.blockedTasks.map(t => 
  `- **${t.id}**: ${t.title}\n  - Blocked by: ${t.blockedBy.join(', ')}`
).join('\n')}
` : ''}

## 🎖️ Velocity Metrics

- **Daily Average**: ${metrics.velocity.daily} tasks/day
- **Weekly Rate**: ${metrics.velocity.weekly} tasks/week
- **Average Progress**: ${metrics.averageProgress}%
`;
  }

  async showTaskTimeline(taskId) {
    const eventsPath = path.join(__dirname, '../tasks/events.jsonl');
    
    if (!fs.existsSync(eventsPath)) {
      return;
    }
    
    try {
      const eventsData = fs.readFileSync(eventsPath, 'utf8');
      const events = eventsData.split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line))
        .filter(event => 
          event.data && 
          event.data.taskId === taskId || 
          event.message && event.message.includes(taskId)
        )
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      if (events.length > 0) {
        console.log(`\n${chalk.bold('📋 Timeline:')}`);
        
        events.forEach((event, index) => {
          const date = new Date(event.timestamp);
          const timeStr = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
          const isLast = index === events.length - 1;
          const connector = isLast ? '└─' : '├─';
          
          // Event type icons and colors
          let icon = '📝';
          let color = 'gray';
          
          switch (event.type) {
            case 'task_created':
            case 'created':
              icon = '🎯';
              color = 'green';
              // Check if created from PRD or creaite
              if (event.message.includes('PRD') || event.data?.source === 'prd') {
                icon = '📋';
              } else if (event.message.includes('creaite') || event.data?.source === 'creaite') {
                icon = '🤖';
              }
              break;
            case 'task_start':
            case 'task_started':
              icon = '🚀';
              color = 'cyan';
              break;
            case 'task_complete':
            case 'task_completed':
              icon = '✅';
              color = 'green';
              break;
            case 'task_build':
            case 'build_started':
              icon = '🔨';
              color = 'yellow';
              break;
            case 'task_test':
            case 'test_run':
              icon = '🧪';
              color = 'blue';
              break;
            case 'task_reset':
              icon = '🔄';
              color = 'yellow';
              break;
            case 'integrity_violation':
              icon = '⚠️';
              color = 'red';
              break;
            case 'task_blocked':
              icon = '🚫';
              color = 'red';
              break;
            case 'task_unblocked':
              icon = '🔓';
              color = 'green';
              break;
            case 'intelligent_analysis_start':
              icon = '🤖';
              color = 'magenta';
              break;
            case 'intelligent_analysis_failed':
              icon = '❌';
              color = 'red';
              break;
          }
          
          console.log(
            chalk.gray(connector) + ' ' +
            icon + ' ' +
            chalk[color](event.message.replace(`${taskId}`, '').replace(/^[:\s]+|[:\s]+$/g, '')) + 
            chalk.gray(` (${timeStr})`)
          );
        });
        
        console.log(); // Add spacing after timeline
      }
    } catch (error) {
      // Silently ignore timeline errors to not break status display
    }
  }

  async run(format = 'interactive') {
    // NO AUTO-HEALING - This is a read-only status display
    
    switch (format) {
      case 'json':
        const metrics = await this.calculateMetrics();
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          metrics: metrics,
          summary: {
            total_tasks: metrics.total,
            completion_percentage: parseFloat(metrics.completionRate),
            tasks_in_progress: metrics.byStatus['in-progress'],
            tasks_blocked: metrics.byStatus.blocked,
            tasks_stuck: metrics.stuckTasks.length,
            daily_velocity: metrics.velocity.daily
          }
        }, null, 2));
        break;
        
      case 'markdown':
        const mdMetrics = await this.calculateMetrics();
        const markdown = this.generateMarkdownReport(mdMetrics);
        console.log(markdown);
        fs.writeFileSync(this.progressPath, markdown);
        console.log(`\n✅ Progress report saved to: ${this.progressPath}`);
        break;
        
      default:
        await this.displayStatus();
        logEvent('command_executed', 'Status report displayed', { 
          command: 'cx status',
          mode: 'clean'
        });
    }
  }
}

// CLI execution
async function main() {
  // Check if a specific task ID was provided
  let taskIdArg = process.argv[2];
  // Remove quotes if present (npm can pass arguments with quotes)
  if (taskIdArg) {
    taskIdArg = taskIdArg.replace(/^['"]|['"]$/g, '');
  }
  
  if (taskIdArg && taskIdArg.match(/^TASK-\d+$/i)) {
    // Show detailed status for specific task
    try {
      const task = await TaskState.getTask(taskIdArg.toUpperCase());
      
      if (!task) {
        console.error(chalk.red(`Task ${taskIdArg.toUpperCase()} not found`));
        process.exit(1);
      }

      console.log(`\n${chalk.bold.cyan('📊 Task Status Report')}`);
      console.log(chalk.gray('━'.repeat(60)));
      console.log(`${chalk.bold('Task ID:')} ${chalk.cyan(task.id)}`);
      console.log(`${chalk.bold('Title:')} ${task.title}`);
      console.log(`${chalk.bold('Status:')} ${chalk[task.status === 'completed' ? 'green' : task.status === 'in-progress' ? 'yellow' : 'gray'](task.status)}`);
      console.log(`${chalk.bold('Priority:')} ${chalk[task.priority === 'P0' ? 'red' : task.priority === 'P1' ? 'yellow' : 'blue'](task.priority)}`);
      console.log(`${chalk.bold('Category:')} ${task.category}`);
      console.log(`${chalk.bold('Progress:')} ${task.progress || 0}%`);
      
      if (task.started_at) {
        const started = new Date(task.started_at);
        console.log(`${chalk.bold('Started:')} ${started.toLocaleDateString()} ${started.toLocaleTimeString()}`);
      }
      
      if (task.completed_at) {
        const completed = new Date(task.completed_at);
        console.log(`${chalk.bold('Completed:')} ${completed.toLocaleDateString()} ${completed.toLocaleTimeString()}`);
      }
      
      if (task.estimates) {
        console.log(`${chalk.bold('Effort:')} ${task.estimates.effort_hours}h (${task.estimates.complexity})`);
      }
      
      if (task.dependencies && task.dependencies.blocked_by && task.dependencies.blocked_by.length > 0) {
        console.log(`${chalk.bold('Blocked by:')} ${task.dependencies.blocked_by.join(', ')}`);
      }
      
      // Show timeline of events for this task
      const reporter = new CleanStatusReporter();
      await reporter.showTaskTimeline(task.id);
      
      console.log(chalk.gray('━'.repeat(60)));
      console.log();
      process.exit(0);  // Exit successfully after showing task status
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  } else {
    // Show overall status
    const reporter = new CleanStatusReporter();
    const args = process.argv.slice(2);
    const format = args[0] || 'interactive';
    await reporter.run(format);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = CleanStatusReporter;