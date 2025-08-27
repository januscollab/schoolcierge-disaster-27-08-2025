#!/usr/bin/env node

const blessed = require('blessed');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

class TerminalGantt {
  constructor() {
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'SchoolCierge Gantt Chart'
    });

    // Set up colors
    this.statusColors = {
      'completed': 'green',
      'in-progress': 'yellow', 
      'blocked': 'red',
      'not-started': 'cyan'
    };
  }

  loadTasks() {
    if (!fs.existsSync(this.tasksPath)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(this.tasksPath, 'utf8'));
  }

  createSimpleGantt() {
    const tasks = this.loadTasks();
    
    // Title box
    const title = blessed.box({
      parent: this.screen,
      top: 0,
      left: 'center',
      width: '100%',
      height: 3,
      content: chalk.bold.cyan('🚀 SchoolCierge Development Timeline'),
      tags: true,
      align: 'center',
      border: {
        type: 'line',
        fg: 'cyan'
      }
    });

    // Stats box
    const stats = blessed.box({
      parent: this.screen,
      top: 3,
      left: 0,
      width: '25%',
      height: 10,
      label: ' Statistics ',
      tags: true,
      border: {
        type: 'line',
        fg: 'blue'
      },
      style: {
        fg: 'white'
      }
    });

    // Calculate stats
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const blocked = tasks.filter(t => t.status === 'blocked').length;
    const notStarted = tasks.filter(t => t.status === 'not-started').length;
    const totalHours = tasks.reduce((sum, t) => sum + (t.estimates?.effort_hours || 0), 0);
    const completedHours = tasks.filter(t => t.status === 'completed')
                                .reduce((sum, t) => sum + (t.estimates?.effort_hours || 0), 0);
    
    stats.setContent(
      `{bold}Total Tasks:{/bold} ${tasks.length}\n\n` +
      `{green-fg}✓ Completed:{/green-fg} ${completed}\n` +
      `{yellow-fg}⚡ Active:{/yellow-fg} ${inProgress}\n` +
      `{red-fg}⊗ Blocked:{/red-fg} ${blocked}\n` +
      `{cyan-fg}○ Pending:{/cyan-fg} ${notStarted}\n\n` +
      `{bold}Progress:{/bold} ${Math.round((completed / tasks.length) * 100)}%\n` +
      `{bold}Hours:{/bold} ${completedHours}/${totalHours}h`
    );

    // Main Gantt chart list
    const ganttList = blessed.list({
      parent: this.screen,
      top: 3,
      left: '25%',
      width: '75%',
      height: '75%',
      label: ' Task Timeline (↑↓ to navigate, Enter for details, Q to quit) ',
      border: {
        type: 'line',
        fg: 'cyan'
      },
      style: {
        selected: {
          bg: 'blue',
          fg: 'white',
          bold: true
        }
      },
      keys: true,
      vi: true,
      mouse: true,
      scrollbar: {
        style: {
          bg: 'blue'
        }
      }
    });

    // Prepare and add tasks to list
    const sortedTasks = this.sortTasks(tasks);
    const ganttLines = this.createGanttLines(sortedTasks.slice(0, 30)); // Show top 30 tasks
    
    ganttList.setItems(ganttLines);

    // Task detail box (initially hidden)
    const detailBox = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: '60%',
      height: '50%',
      label: ' Task Details ',
      content: '',
      tags: true,
      border: {
        type: 'line',
        fg: 'yellow'
      },
      hidden: true,
      style: {
        fg: 'white'
      }
    });

    // Legend box
    const legend = blessed.box({
      parent: this.screen,
      bottom: 3,
      left: 0,
      width: '100%',
      height: 3,
      content: `{green-fg}█ Completed{/green-fg}  {yellow-fg}▓ In Progress{/yellow-fg}  {red-fg}░ Blocked{/red-fg}  {cyan-fg}─ Not Started{/cyan-fg}  │  Use arrows to navigate, Enter for details, Q to quit`,
      tags: true,
      align: 'center',
      style: {
        fg: 'gray'
      }
    });

    // Event handlers
    ganttList.on('select', (item, index) => {
      const task = sortedTasks[index];
      if (task) {
        const details = this.formatTaskDetails(task);
        detailBox.setContent(details);
        detailBox.show();
        this.screen.render();
        
        // Hide detail box after 3 seconds
        setTimeout(() => {
          detailBox.hide();
          this.screen.render();
        }, 3000);
      }
    });

    // Key bindings
    this.screen.key(['escape', 'q', 'C-c'], () => {
      return process.exit(0);
    });

    this.screen.key(['?', 'h'], () => {
      detailBox.setContent(
        '{bold}Keyboard Shortcuts:{/bold}\n\n' +
        '↑/↓ or j/k : Navigate tasks\n' +
        'Enter      : Show task details\n' +
        'g          : Go to top\n' +
        'G          : Go to bottom\n' +
        '?/h        : Show this help\n' +
        'q/Esc      : Quit'
      );
      detailBox.show();
      this.screen.render();
      
      setTimeout(() => {
        detailBox.hide();
        this.screen.render();
      }, 3000);
    });

    // Focus on list
    ganttList.focus();
    
    // Render the screen
    this.screen.render();
  }

  sortTasks(tasks) {
    const priorityOrder = {'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3};
    const statusOrder = {'in-progress': 0, 'blocked': 1, 'not-started': 2, 'completed': 3};
    
    return tasks.sort((a, b) => {
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    });
  }

  createGanttLines(tasks) {
    return tasks.map(task => {
      const statusSymbol = {
        'completed': chalk.green('✓'),
        'in-progress': chalk.yellow('⚡'),
        'blocked': chalk.red('⊗'),
        'not-started': chalk.cyan('○')
      }[task.status];
      
      const priority = chalk.bold(task.priority);
      const id = chalk.gray(task.id);
      const title = task.title.substring(0, 30).padEnd(30);
      const bar = this.createProgressBar(task);
      
      return `${statusSymbol} ${id} ${priority} ${title} ${bar}`;
    });
  }

  createProgressBar(task) {
    const duration = Math.min(task.estimates?.effort_hours || 4, 20);
    const maxBar = 30;
    
    let bar = '';
    let color = this.statusColors[task.status];
    
    if (task.status === 'completed') {
      bar = chalk.green('█'.repeat(duration));
    } else if (task.status === 'in-progress') {
      const progress = Math.floor(duration / 2);
      bar = chalk.yellow('█'.repeat(progress) + '▓'.repeat(duration - progress));
    } else if (task.status === 'blocked') {
      bar = chalk.red('░'.repeat(duration));
    } else {
      bar = chalk.cyan('─'.repeat(duration));
    }
    
    // Add remaining space
    if (duration < maxBar) {
      bar += chalk.gray('·'.repeat(maxBar - duration));
    }
    
    return `[${bar}]`;
  }

  formatTaskDetails(task) {
    return `{bold}Task:{/bold} ${task.id}\n` +
           `{bold}Title:{/bold} ${task.title}\n` +
           `{bold}Status:{/bold} ${task.status}\n` +
           `{bold}Priority:{/bold} ${task.priority}\n` +
           `{bold}Category:{/bold} ${task.category}\n` +
           `{bold}Effort:{/bold} ${task.estimates?.effort_hours || 'N/A'} hours\n` +
           `{bold}Dependencies:{/bold} ${task.dependencies?.blocked_by?.join(', ') || 'None'}\n` +
           `{bold}Description:{/bold}\n${task.description || 'No description'}`;
  }

  run() {
    try {
      this.createSimpleGantt();
    } catch (error) {
      console.error('Error creating Gantt chart:', error);
      console.log('\nFalling back to HTML dashboard. Run: cx dashboard');
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const gantt = new TerminalGantt();
  gantt.run();
}