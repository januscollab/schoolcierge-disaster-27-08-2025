#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const Table = require('cli-table3');
const boxen = require('boxen');
const gradient = require('gradient-string');
const figlet = require('figlet');
const ora = require('ora');

class SprintPlanner {
  constructor() {
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.sprintPath = path.join(__dirname, '../tasks/sprint.json');
    
    // CREAITE branding - teal and gold
    this.tealGradient = gradient(['#008B8B', '#00CED1', '#40E0D0']);
    this.goldGradient = gradient(['#FFD700', '#FFA500']);
    this.successGradient = gradient(['#06FFA5', '#00C9A7']);
    this.warningGradient = gradient(['#FFB700', '#FF9500']);
    this.dangerGradient = gradient(['#FF006E', '#C1121F']);
  }

  loadTasks() {
    if (!fs.existsSync(this.tasksPath)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(this.tasksPath, 'utf8'));
  }

  loadSprint() {
    if (!fs.existsSync(this.sprintPath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(this.sprintPath, 'utf8'));
  }

  saveSprint(sprint) {
    fs.writeFileSync(this.sprintPath, JSON.stringify(sprint, null, 2));
  }

  displayHeader() {
    console.clear();
    console.log();
    
    // CREAITE branding with teal CRE/TE and gold AI
    const fullLogo = figlet.textSync('CREAITE', {
      font: 'Big',
      horizontalLayout: 'default',
    });
    
    // Split into lines and color each part
    const lines = fullLogo.split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        // For 'Big' font, approximate positions: CRE (0-29), AI (29-47), TE (47-end)
        const cre = line.substring(0, 29);
        const ai = line.substring(29, 47);
        const te = line.substring(47);
        
        // Apply colors directly to text
        console.log(
          this.tealGradient(cre) + 
          this.goldGradient(ai) + 
          this.tealGradient(te)
        );
      } else {
        console.log(line);
      }
    });
    
    console.log();
    console.log(this.tealGradient('Sprint Planning & Management'));
    console.log();
  }

  createSprint() {
    this.displayHeader();
    
    const tasks = this.loadTasks();
    const existingSprint = this.loadSprint();
    
    if (existingSprint && existingSprint.status === 'active') {
      console.log(chalk.yellow('⚠️  There is already an active sprint!'));
      console.log(chalk.gray(`Sprint ${existingSprint.number} - ${existingSprint.name}`));
      console.log(chalk.gray(`Started: ${new Date(existingSprint.startDate).toLocaleDateString()}`));
      return;
    }
    
    // Calculate sprint number
    const sprintNumber = existingSprint ? existingSprint.number + 1 : 1;
    
    // Select tasks for sprint (P0 and P1 priority, not completed)
    const sprintTasks = tasks.filter(t => 
      (t.priority === 'P0' || t.priority === 'P1') && 
      t.status !== 'completed' &&
      t.status !== 'blocked'
    ).slice(0, 10); // Limit to 10 tasks for a 2-week sprint
    
    const sprint = {
      number: sprintNumber,
      name: `Sprint ${sprintNumber}`,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks
      status: 'active',
      goals: [
        'Complete all P0 critical tasks',
        'Progress on P1 high-priority items',
        'Maintain code quality and testing'
      ],
      tasks: sprintTasks.map(t => t.id),
      velocity: {
        planned: sprintTasks.length,
        completed: 0
      }
    };
    
    this.saveSprint(sprint);
    
    console.log(boxen(
      chalk.green.bold('✅ Sprint Created Successfully!\n\n') +
      chalk.white(`Sprint Number: ${sprint.number}\n`) +
      chalk.white(`Duration: 2 weeks\n`) +
      chalk.white(`Tasks: ${sprint.tasks.length}\n`) +
      chalk.white(`Start: ${new Date(sprint.startDate).toLocaleDateString()}\n`) +
      chalk.white(`End: ${new Date(sprint.endDate).toLocaleDateString()}`),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    ));
    
    console.log(chalk.cyan('\nSprint Tasks:'));
    const table = new Table({
      head: [chalk.cyan('ID'), chalk.cyan('Priority'), chalk.cyan('Title')],
      style: { border: ['green'] }
    });
    
    sprintTasks.forEach(task => {
      table.push([
        task.id,
        task.priority === 'P0' ? chalk.red(task.priority) : chalk.yellow(task.priority),
        task.title.substring(0, 50)
      ]);
    });
    
    console.log(table.toString());
  }

  showStatus() {
    this.displayHeader();
    
    const sprint = this.loadSprint();
    const tasks = this.loadTasks();
    
    if (!sprint) {
      console.log(chalk.yellow('No sprint found. Create one with: cx sprint:new'));
      return;
    }
    
    // Calculate metrics
    const sprintTasks = tasks.filter(t => sprint.tasks.includes(t.id));
    const completed = sprintTasks.filter(t => t.status === 'completed').length;
    const inProgress = sprintTasks.filter(t => t.status === 'in-progress').length;
    const notStarted = sprintTasks.filter(t => t.status === 'not-started').length;
    const blocked = sprintTasks.filter(t => t.status === 'blocked').length;
    
    const daysElapsed = Math.floor((Date.now() - new Date(sprint.startDate)) / (24 * 60 * 60 * 1000));
    const totalDays = Math.floor((new Date(sprint.endDate) - new Date(sprint.startDate)) / (24 * 60 * 60 * 1000));
    const daysRemaining = totalDays - daysElapsed;
    
    const burndownRate = completed / Math.max(daysElapsed, 1);
    const requiredRate = (sprint.tasks.length - completed) / Math.max(daysRemaining, 1);
    
    const completionPercentage = (completed / sprint.tasks.length * 100).toFixed(1);
    
    // Sprint Header
    console.log(boxen(
      chalk.bold.cyan(`🏃 Sprint ${sprint.number}: ${sprint.name}\n\n`) +
      chalk.white(`Status: `) + (sprint.status === 'active' ? chalk.green('ACTIVE') : chalk.gray('CLOSED')) + '\n' +
      chalk.white(`Progress: ${this.generateProgressBar(parseFloat(completionPercentage))}\n`) +
      chalk.white(`Timeline: Day ${daysElapsed} of ${totalDays} (${daysRemaining} days remaining)`),
      {
        padding: 1,
        borderStyle: 'double',
        borderColor: 'cyan'
      }
    ));
    
    // Task Status
    console.log(this.successGradient('\n━━━ TASK STATUS ━━━\n'));
    
    const statusTable = new Table({
      head: [
        chalk.cyan('Status'),
        chalk.cyan('Count'),
        chalk.cyan('Percentage')
      ],
      style: { border: ['cyan'] }
    });
    
    statusTable.push(
      [chalk.green('✅ Completed'), completed, `${(completed/sprint.tasks.length*100).toFixed(0)}%`],
      [chalk.yellow('🔄 In Progress'), inProgress, `${(inProgress/sprint.tasks.length*100).toFixed(0)}%`],
      [chalk.gray('⭕ Not Started'), notStarted, `${(notStarted/sprint.tasks.length*100).toFixed(0)}%`],
      [chalk.red('🚫 Blocked'), blocked, `${(blocked/sprint.tasks.length*100).toFixed(0)}%`]
    );
    
    console.log(statusTable.toString());
    
    // Velocity Analysis
    console.log(this.warningGradient('\n━━━ VELOCITY ANALYSIS ━━━\n'));
    
    console.log(chalk.white('📊 Burn Rate:'));
    console.log(`   Current: ${chalk.cyan(burndownRate.toFixed(2))} tasks/day`);
    console.log(`   Required: ${requiredRate > burndownRate ? chalk.red(requiredRate.toFixed(2)) : chalk.green(requiredRate.toFixed(2))} tasks/day`);
    
    if (requiredRate > burndownRate) {
      console.log(chalk.yellow(`\n⚠️  Need to increase velocity by ${((requiredRate - burndownRate) * 100 / burndownRate).toFixed(0)}% to complete sprint on time`));
    } else {
      console.log(chalk.green('\n✅ On track to complete sprint on time'));
    }
    
    // Sprint Goals
    if (sprint.goals && sprint.goals.length > 0) {
      console.log(this.tealGradient('\n━━━ SPRINT GOALS ━━━\n'));
      sprint.goals.forEach((goal, idx) => {
        console.log(chalk.white(`${idx + 1}. ${goal}`));
      });
    }
    
    // Task Details
    console.log(this.tealGradient('\n━━━ SPRINT BACKLOG ━━━\n'));
    
    const taskTable = new Table({
      head: [
        chalk.cyan('ID'),
        chalk.cyan('Priority'),
        chalk.cyan('Status'),
        chalk.cyan('Title')
      ],
      style: { border: ['gray'] },
      colWidths: [12, 10, 15, 45]
    });
    
    sprintTasks.forEach(task => {
      const statusColor = task.status === 'completed' ? chalk.green :
                         task.status === 'in-progress' ? chalk.yellow :
                         task.status === 'blocked' ? chalk.red : chalk.gray;
      
      const priorityColor = task.priority === 'P0' ? chalk.red :
                           task.priority === 'P1' ? chalk.yellow : chalk.cyan;
      
      taskTable.push([
        task.id,
        priorityColor(task.priority),
        statusColor(task.status),
        task.title.substring(0, 43)
      ]);
    });
    
    console.log(taskTable.toString());
    
    // Recommendations
    if (blocked > 0) {
      console.log(boxen(
        chalk.red.bold('⚠️  Blocked Tasks Alert\n\n') +
        chalk.white(`${blocked} task(s) are currently blocked.\n`) +
        chalk.white('Resolve blockers to maintain sprint velocity.'),
        {
          padding: 1,
          borderStyle: 'round',
          borderColor: 'red'
        }
      ));
    }
  }

  generateProgressBar(percentage, width = 30) {
    const filled = Math.round(width * percentage / 100);
    const empty = width - filled;
    
    let bar = '';
    for (let i = 0; i < filled; i++) {
      if (percentage > 75) bar += chalk.green('█');
      else if (percentage > 50) bar += chalk.yellow('█');
      else if (percentage > 25) bar += chalk.magenta('█');
      else bar += chalk.red('█');
    }
    
    for (let i = 0; i < empty; i++) {
      bar += chalk.gray('░');
    }
    
    return bar + ' ' + chalk.bold(`${percentage}%`);
  }

  async run() {
    const command = process.argv[2];
    
    const spinner = ora({
      text: 'Loading sprint data...',
      spinner: 'dots12',
      color: 'cyan'
    }).start();
    
    await new Promise(resolve => setTimeout(resolve, 500));
    spinner.stop();
    
    switch (command) {
      case 'create':
      case 'new':
        this.createSprint();
        break;
      case 'status':
      default:
        this.showStatus();
        break;
    }
  }
}

// Run the sprint planner
const planner = new SprintPlanner();
planner.run().catch(err => {
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
});