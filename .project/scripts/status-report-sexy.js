#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Table = require('cli-table3');
const ora = require('ora');
const boxenLib = require('boxen');
const boxen = boxenLib.default || boxenLib;
const gradient = require('gradient-string');
const figlet = require('figlet');
const term = require('terminal-kit').terminal;

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
chalk.bold.red = (text) => chalk.bold(chalk.red(text));
chalk.bold.yellow = (text) => chalk.bold(chalk.yellow(text));
chalk.bold.blue = (text) => chalk.bold(chalk.blue(text));
chalk.bold.gray = (text) => chalk.bold(chalk.gray(text));
chalk.italic.gray = (text) => chalk.italic(chalk.gray(text));

class SexyStatusReporter {
  constructor() {
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.progressPath = path.join(__dirname, '../tasks/PROGRESS.md');
    this.dashboardPath = path.join(__dirname, '../tasks/dashboard.html');
    
    // Beautiful gradients
    this.brandGradient = gradient(['#667eea', '#764ba2', '#f093fb']);
    this.successGradient = gradient(['#11998e', '#38ef7d']);
    this.warningGradient = gradient(['#F2994A', '#F2C94C']);
    this.dangerGradient = gradient(['#ee0979', '#ff6a00']);
  }

  loadTasks() {
    if (!fs.existsSync(this.tasksPath)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(this.tasksPath, 'utf8'));
  }

  calculateMetrics() {
    const tasks = this.loadTasks();
    const metrics = {
      total: tasks.length,
      byStatus: {
        'not-started': 0,
        'in-progress': 0,
        'blocked': 0,
        'completed': 0
      },
      byPriority: { P0: 0, P1: 0, P2: 0, P3: 0 },
      byCategory: {},
      completionRate: 0,
      blockedTasks: [],
      inProgressTasks: [],
      averageProgress: 0,
      criticalPathHealth: 'on-track',
      velocity: {
        daily: 0,
        weekly: 0
      }
    };

    if (tasks.length === 0) {
      return metrics;
    }

    tasks.forEach(task => {
      metrics.byStatus[task.status] = (metrics.byStatus[task.status] || 0) + 1;
      metrics.byPriority[task.priority] = (metrics.byPriority[task.priority] || 0) + 1;
      metrics.byCategory[task.category] = (metrics.byCategory[task.category] || 0) + 1;
      
      if (task.status === 'blocked') {
        metrics.blockedTasks.push({
          id: task.id,
          title: task.title,
          blockedBy: task.dependencies.blocked_by
        });
      }
      
      if (task.status === 'in-progress') {
        metrics.inProgressTasks.push({
          id: task.id,
          title: task.title,
          progress: task.progress
        });
      }
      
      metrics.averageProgress += task.progress || 0;
    });

    metrics.averageProgress = Math.round(metrics.averageProgress / tasks.length);
    metrics.completionRate = tasks.length > 0 
      ? (metrics.byStatus.completed / tasks.length * 100).toFixed(1) 
      : 0;

    const completedTasks = tasks.filter(t => t.status === 'completed');
    if (completedTasks.length > 0) {
      const dates = completedTasks.map(t => new Date(t.completed_at));
      const daysSinceFirst = (Date.now() - Math.min(...dates)) / (1000 * 60 * 60 * 24);
      metrics.velocity.daily = daysSinceFirst > 0 ? (completedTasks.length / daysSinceFirst).toFixed(1) : 0;
      metrics.velocity.weekly = metrics.velocity.daily * 7;
    }

    return metrics;
  }

  generateSexyProgressBar(percentage, width = 30) {
    const filled = Math.round(width * percentage / 100);
    const empty = width - filled;
    
    let bar = '';
    for (let i = 0; i < filled; i++) {
      bar += '\x1b[42m \x1b[0m'; // Green background
    }
    for (let i = 0; i < empty; i++) {
      bar += '\x1b[100m \x1b[0m'; // Gray background
    }
    
    return bar + ' ' + chalk.bold(`${percentage}%`);
  }

  displayHeader() {
    console.clear();
    
    // Display CreaAIte branding
    console.log();
    console.log(
      this.brandGradient(
        figlet.textSync('CreaAIte', {
          font: 'Big',
          horizontalLayout: 'default'
        })
      )
    );
    
    console.log(
      boxen(
        chalk.bold.white('🚀 Task Management Superpower System'),
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

  displayMetrics(metrics) {
    // Overall Progress Section
    console.log(this.brandGradient('\n━━━ OVERALL PROGRESS ━━━\n'));
    
    const progressColor = metrics.completionRate > 75 ? chalk.green :
                         metrics.completionRate > 50 ? chalk.yellow :
                         metrics.completionRate > 25 ? chalk.magenta : chalk.red;
    
    console.log(chalk.bold('  📊 Completion: ') + this.generateSexyProgressBar(parseFloat(metrics.completionRate), 40));
    console.log(chalk.bold('  📈 Total Tasks: ') + progressColor.bold(`${metrics.byStatus.completed}/${metrics.total}`));
    
    // Status Distribution
    console.log(this.brandGradient('\n━━━ STATUS DISTRIBUTION ━━━\n'));
    
    const statusTable = new Table({
      head: [
        chalk.cyan.bold('Status'),
        chalk.cyan.bold('Count'),
        chalk.cyan.bold('Progress'),
        chalk.cyan.bold('Icon')
      ],
      style: {
        head: [],
        border: ['cyan']
      },
      colWidths: [15, 10, 35, 8]
    });

    statusTable.push(
      [
        chalk.green('Completed'),
        chalk.green.bold(metrics.byStatus.completed),
        this.generateSexyProgressBar(metrics.byStatus.completed / Math.max(metrics.total, 1) * 100, 25),
        '✅'
      ],
      [
        chalk.yellow('In Progress'),
        chalk.yellow.bold(metrics.byStatus['in-progress']),
        this.generateSexyProgressBar(metrics.byStatus['in-progress'] / Math.max(metrics.total, 1) * 100, 25),
        '🔄'
      ],
      [
        chalk.red('Blocked'),
        chalk.red.bold(metrics.byStatus.blocked),
        this.generateSexyProgressBar(metrics.byStatus.blocked / Math.max(metrics.total, 1) * 100, 25),
        '🚫'
      ],
      [
        chalk.gray('Not Started'),
        chalk.gray.bold(metrics.byStatus['not-started']),
        this.generateSexyProgressBar(metrics.byStatus['not-started'] / Math.max(metrics.total, 1) * 100, 25),
        '⭕'
      ]
    );

    console.log(statusTable.toString());

    // Priority Breakdown
    console.log(this.brandGradient('\n━━━ PRIORITY BREAKDOWN ━━━\n'));
    
    const priorityTable = new Table({
      style: {
        head: [],
        border: ['magenta']
      }
    });

    priorityTable.push(
      [
        chalk.red.bold('🔴 P0 Critical'),
        chalk.bold(metrics.byPriority.P0 || 0)
      ],
      [
        chalk.yellow.bold('🟡 P1 High'),
        chalk.bold(metrics.byPriority.P1 || 0)
      ],
      [
        chalk.blue.bold('🔵 P2 Medium'),
        chalk.bold(metrics.byPriority.P2 || 0)
      ],
      [
        chalk.gray.bold('⚪ P3 Low'),
        chalk.bold(metrics.byPriority.P3 || 0)
      ]
    );

    console.log(priorityTable.toString());

    // Categories
    if (Object.keys(metrics.byCategory).length > 0) {
      console.log(this.brandGradient('\n━━━ CATEGORIES ━━━\n'));
      
      const categoryTable = new Table({
        head: [chalk.cyan.bold('Category'), chalk.cyan.bold('Tasks')],
        style: {
          border: ['cyan']
        }
      });

      Object.entries(metrics.byCategory)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, count]) => {
          const icon = this.getCategoryIcon(cat);
          categoryTable.push([
            chalk.bold(`${icon} ${cat}`),
            chalk.bold(count)
          ]);
        });

      console.log(categoryTable.toString());
    }

    // Velocity Metrics
    console.log(this.brandGradient('\n━━━ VELOCITY METRICS ━━━\n'));
    
    console.log(boxen(
      chalk.bold('📅 Daily: ') + this.successGradient(metrics.velocity.daily + ' tasks/day') + '\n' +
      chalk.bold('📆 Weekly: ') + this.successGradient(metrics.velocity.weekly.toFixed(1) + ' tasks/week') + '\n' +
      chalk.bold('📈 Average Progress: ') + this.warningGradient(metrics.averageProgress + '%'),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'yellow'
      }
    ));

    // In Progress Tasks
    if (metrics.inProgressTasks.length > 0) {
      console.log(this.successGradient('\n━━━ CURRENTLY IN PROGRESS ━━━\n'));
      
      metrics.inProgressTasks.forEach(task => {
        console.log(
          chalk.bold.cyan(`  🔨 ${task.id}: `) +
          chalk.white(task.title.substring(0, 50)) +
          chalk.gray(` (${task.progress}%)`)
        );
      });
    }

    // Blocked Tasks
    if (metrics.blockedTasks.length > 0) {
      console.log(this.dangerGradient('\n━━━ BLOCKED TASKS ━━━\n'));
      
      metrics.blockedTasks.forEach(task => {
        console.log(
          chalk.bold.red(`  ⛔ ${task.id}: `) +
          chalk.white(task.title.substring(0, 50))
        );
        console.log(
          chalk.gray(`     └─ Blocked by: ${task.blockedBy.join(', ')}`)
        );
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

  getCategoryIcon(category) {
    const icons = {
      infrastructure: '🏗️',
      authentication: '🔐',
      backend: '⚙️',
      integration: '🔌',
      mobile: '📱',
      devops: '🚀',
      clara: '🤖',
      timer: '⏱️',
      adapt: '🎯',
      admin: '👤',
      frontend: '🎨',
      database: '💾',
      security: '🔒',
      testing: '🧪'
    };
    return icons[category.toLowerCase()] || '📦';
  }

  async runInteractive() {
    const spinner = ora({
      text: 'Loading task data...',
      spinner: 'dots12',
      color: 'magenta'
    }).start();

    await new Promise(resolve => setTimeout(resolve, 500));
    
    const metrics = this.calculateMetrics();
    
    spinner.succeed(chalk.green('Task data loaded successfully!'));
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    this.displayHeader();
    this.displayMetrics(metrics);

    // Save to markdown
    const markdown = this.generateMarkdownReport(metrics);
    fs.writeFileSync(this.progressPath, markdown);
    
    console.log(
      '\n' + 
      chalk.green('✅ Progress report saved to: ') + 
      chalk.cyan(this.progressPath)
    );
  }

  generateMarkdownReport(metrics) {
    const now = new Date().toISOString().split('T')[0];
    
    return `# 📊 SchoolCierge Development Progress

*Last Updated: ${now} | Auto-generated*

## 🎯 Overall Progress: ${metrics.completionRate}% Complete (${metrics.byStatus.completed}/${metrics.total} tasks)

\`\`\`
${this.generateProgressBar(parseFloat(metrics.completionRate))}
\`\`\`

## 📈 Progress by Status

| Status | Count | Visual |
|--------|-------|--------|
| ✅ Completed | ${metrics.byStatus.completed} | ${this.generateProgressBar(metrics.byStatus.completed / Math.max(metrics.total, 1) * 100, 10)} |
| 🔄 In Progress | ${metrics.byStatus['in-progress']} | ${this.generateProgressBar(metrics.byStatus['in-progress'] / Math.max(metrics.total, 1) * 100, 10)} |
| 🚫 Blocked | ${metrics.byStatus.blocked} | ${this.generateProgressBar(metrics.byStatus.blocked / Math.max(metrics.total, 1) * 100, 10)} |
| ⭕ Not Started | ${metrics.byStatus['not-started']} | ${this.generateProgressBar(metrics.byStatus['not-started'] / Math.max(metrics.total, 1) * 100, 10)} |

## 📊 Priority Breakdown

- **P0 (Critical)**: ${metrics.byPriority.P0}
- **P1 (High)**: ${metrics.byPriority.P1}
- **P2 (Medium)**: ${metrics.byPriority.P2}
- **P3 (Low)**: ${metrics.byPriority.P3}

${metrics.inProgressTasks.length > 0 ? `
## 🔄 Currently In Progress

${metrics.inProgressTasks.map(t => 
  `- **${t.id}**: ${t.title} (${t.progress}% complete)`
).join('\\n')}
` : ''}

${metrics.blockedTasks.length > 0 ? `
## 🚧 Blocked Tasks

${metrics.blockedTasks.map(t => 
  `- **${t.id}**: ${t.title}\\n  - Blocked by: ${t.blockedBy.join(', ')}`
).join('\\n')}
` : ''}

## 🎖️ Velocity Metrics

- **Daily Average**: ${metrics.velocity.daily} tasks/day
- **Weekly Rate**: ${metrics.velocity.weekly} tasks/week
- **Average Progress**: ${metrics.averageProgress}%

## 📂 Categories

${Object.entries(metrics.byCategory).map(([cat, count]) => 
  `- **${cat}**: ${count} tasks`
).join('\\n')}
`;
  }

  generateProgressBar(percentage, width = 20) {
    const filled = Math.round(width * percentage / 100);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percentage}%`;
  }

  async run(format = 'interactive') {
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
        console.log(`\\n✅ Progress report saved to: ${this.progressPath}`);
        break;
        
      default:
        await this.runInteractive();
    }
    
    // Ensure terminal is reset
    term.processExit(0);
  }

  generateHTMLDashboard(metrics) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SchoolCierge - Project Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container { 
            max-width: 1400px; 
            margin: 0 auto;
        }
        h1 {
            color: white;
            font-size: 2.5em;
            margin-bottom: 30px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            transition: transform 0.2s;
        }
        .stat-card:hover {
            transform: translateY(-5px);
        }
        .stat-card h3 {
            color: #4a5568;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
        }
        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #2d3748;
            margin-bottom: 10px;
        }
        .stat-label {
            color: #718096;
            font-size: 0.9em;
        }
        .progress-bar {
            width: 100%;
            height: 30px;
            background: #e2e8f0;
            border-radius: 15px;
            overflow: hidden;
            position: relative;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #48bb78, #38a169);
            border-radius: 15px;
            transition: width 0.5s ease;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 10px;
            color: white;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 SchoolCierge Project Dashboard</h1>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Overall Progress</h3>
                <div class="stat-value">${metrics.completionRate}%</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${metrics.completionRate}%">
                        ${metrics.byStatus.completed}/${metrics.total}
                    </div>
                </div>
            </div>
            
            <div class="stat-card">
                <h3>In Progress</h3>
                <div class="stat-value">${metrics.byStatus['in-progress']}</div>
                <div class="stat-label">Active tasks</div>
            </div>
            
            <div class="stat-card">
                <h3>Blocked</h3>
                <div class="stat-value">${metrics.byStatus.blocked}</div>
                <div class="stat-label">Tasks blocked</div>
            </div>
            
            <div class="stat-card">
                <h3>Velocity</h3>
                <div class="stat-value">${metrics.velocity.daily}</div>
                <div class="stat-label">Tasks per day</div>
            </div>
        </div>
    </div>
</body>
</html>`;
  }
}

// CLI handling
const reporter = new SexyStatusReporter();
const formatArg = process.argv.find(arg => arg.startsWith('--format'));
const format = formatArg ? formatArg.split('=')[1] || process.argv[process.argv.indexOf(formatArg) + 1] : 'interactive';

reporter.run(format).catch(err => {
  console.error(chalk.red('Error:'), err);
  process.exit(1);
});