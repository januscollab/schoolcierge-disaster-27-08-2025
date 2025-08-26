#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const term = require('terminal-kit').terminal;
const chalk = require('chalk');
const gradient = require('gradient-string');
const boxen = require('boxen');

class LiveDashboard {
  constructor() {
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.refreshInterval = 1000; // Refresh every second
    this.isRunning = true;
    this.selectedTaskIndex = 0;
    this.tasks = [];
    this.lastModified = null;
    this.sessionStartTime = Date.now();
    this.recentUpdates = [];
    this.maxRecentUpdates = 5;
    
    // Gradients
    this.creaiteGradient = gradient(['#00C9A7', '#00B4D8', '#0077B6']);
    this.successGradient = gradient(['#06FFA5', '#00C9A7']);
    this.warningGradient = gradient(['#FFB700', '#FF9500']);
    this.dangerGradient = gradient(['#FF006E', '#C1121F']);
    
    // Task timers
    this.taskTimers = new Map();
    
    // Screen regions
    this.regions = {
      header: { y: 1, height: 4 },
      stats: { y: 5, height: 6 },
      progress: { y: 11, height: 10 },
      recent: { y: 21, height: 8 },
      help: { y: 29, height: 3 }
    };
  }

  loadTasks() {
    try {
      if (fs.existsSync(this.tasksPath)) {
        const stats = fs.statSync(this.tasksPath);
        const data = fs.readFileSync(this.tasksPath, 'utf8');
        this.tasks = JSON.parse(data);
        
        // Check if file was modified
        if (this.lastModified && stats.mtime > this.lastModified) {
          this.detectChanges();
        }
        this.lastModified = stats.mtime;
        
        // Update task timers
        this.updateTaskTimers();
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }

  detectChanges() {
    // Track what changed for the recent updates feed
    const newTasks = this.tasks;
    const oldTaskMap = new Map(this.tasks.map(t => [t.id, t]));
    
    newTasks.forEach(task => {
      const oldTask = oldTaskMap.get(task.id);
      if (oldTask) {
        if (oldTask.status !== task.status) {
          this.addRecentUpdate(`📋 ${task.id}: Status changed ${oldTask.status} → ${task.status}`);
        }
        if (oldTask.progress !== task.progress) {
          this.addRecentUpdate(`📈 ${task.id}: Progress ${oldTask.progress}% → ${task.progress}%`);
        }
      } else {
        this.addRecentUpdate(`✨ ${task.id}: New task added`);
      }
    });
  }

  addRecentUpdate(message) {
    const timestamp = new Date().toLocaleTimeString();
    this.recentUpdates.unshift({ time: timestamp, message });
    if (this.recentUpdates.length > this.maxRecentUpdates) {
      this.recentUpdates.pop();
    }
  }

  updateTaskTimers() {
    const inProgressTasks = this.tasks.filter(t => t.status === 'in-progress');
    
    inProgressTasks.forEach(task => {
      if (!this.taskTimers.has(task.id)) {
        // Task just started
        this.taskTimers.set(task.id, Date.now());
      }
    });
    
    // Clean up completed tasks from timers
    for (const [taskId, startTime] of this.taskTimers.entries()) {
      const task = this.tasks.find(t => t.id === taskId);
      if (!task || task.status !== 'in-progress') {
        this.taskTimers.delete(taskId);
      }
    }
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  calculateMetrics() {
    const metrics = {
      total: this.tasks.length,
      completed: this.tasks.filter(t => t.status === 'completed').length,
      inProgress: this.tasks.filter(t => t.status === 'in-progress').length,
      blocked: this.tasks.filter(t => t.status === 'blocked').length,
      notStarted: this.tasks.filter(t => t.status === 'not-started').length,
      completionRate: 0,
      velocity: { hour: 0, session: 0 }
    };
    
    metrics.completionRate = metrics.total > 0 
      ? ((metrics.completed / metrics.total) * 100).toFixed(1)
      : 0;
    
    // Calculate session velocity
    const sessionDuration = Date.now() - this.sessionStartTime;
    const sessionHours = sessionDuration / (1000 * 60 * 60);
    if (sessionHours > 0 && metrics.completed > 0) {
      metrics.velocity.hour = (metrics.completed / sessionHours).toFixed(1);
      metrics.velocity.session = metrics.completed;
    }
    
    return metrics;
  }

  drawHeader() {
    term.moveTo(1, this.regions.header.y);
    term.eraseLine();
    
    const title = this.creaiteGradient('╔═══ LIVE DASHBOARD ═══╗');
    const sessionTime = this.formatDuration(Date.now() - this.sessionStartTime);
    
    term(title);
    term.moveTo(30, this.regions.header.y);
    term.cyan(` Session: ${sessionTime}`);
    
    term.moveTo(1, this.regions.header.y + 1);
    term.eraseLine();
    term.gray('Press ');
    term.yellow('↑/↓');
    term.gray(' to select, ');
    term.yellow('+/-');
    term.gray(' to update progress, ');
    term.yellow('Enter');
    term.gray(' to toggle status, ');
    term.yellow('q');
    term.gray(' to quit');
  }

  drawStats(metrics) {
    const y = this.regions.stats.y;
    
    // Clear the stats area
    for (let i = 0; i < this.regions.stats.height; i++) {
      term.moveTo(1, y + i);
      term.eraseLine();
    }
    
    // Draw stats box
    term.moveTo(1, y);
    term.bold.white('📊 METRICS\n');
    
    // Progress bar
    const progressBar = this.generateProgressBar(parseFloat(metrics.completionRate), 40);
    term.moveTo(1, y + 1);
    term(`Progress: ${progressBar}\n`);
    
    // Stats grid
    term.moveTo(1, y + 3);
    term.green(`✅ Completed: ${metrics.completed}  `);
    term.yellow(`🔄 In Progress: ${metrics.inProgress}  `);
    term.red(`🚫 Blocked: ${metrics.blocked}  `);
    term.gray(`⭕ Not Started: ${metrics.notStarted}`);
    
    term.moveTo(1, y + 4);
    term.cyan(`⚡ Velocity: ${metrics.velocity.hour}/hour  `);
    term.magenta(`📈 This Session: ${metrics.velocity.session} completed`);
  }

  generateProgressBar(percentage, width = 30) {
    const filled = Math.round(width * percentage / 100);
    const empty = width - filled;
    
    let bar = '';
    for (let i = 0; i < filled; i++) {
      bar += chalk.bgGreen(' ');
    }
    for (let i = 0; i < empty; i++) {
      bar += chalk.bgGray(' ');
    }
    
    return bar + ' ' + chalk.bold.green(`${percentage}%`);
  }

  drawInProgressTasks() {
    const y = this.regions.progress.y;
    const inProgressTasks = this.tasks.filter(t => t.status === 'in-progress');
    
    // Clear the area
    for (let i = 0; i < this.regions.progress.height; i++) {
      term.moveTo(1, y + i);
      term.eraseLine();
    }
    
    term.moveTo(1, y);
    term.bold.white('🚀 ACTIVE TASKS\n');
    
    if (inProgressTasks.length === 0) {
      term.moveTo(1, y + 1);
      term.gray('No tasks in progress. Press Enter on a task to start it.');
      return;
    }
    
    inProgressTasks.slice(0, 6).forEach((task, index) => {
      const isSelected = index === this.selectedTaskIndex;
      const elapsed = this.taskTimers.has(task.id) 
        ? this.formatDuration(Date.now() - this.taskTimers.get(task.id))
        : '0s';
      
      term.moveTo(1, y + 2 + index);
      
      if (isSelected) {
        term.bgBlue.white(` ▶ ${task.id} `);
      } else {
        term(`   ${task.id} `);
      }
      
      term(`: ${task.title.substring(0, 40).padEnd(40)} `);
      
      // Animated progress bar
      const progressBar = this.generateAnimatedProgress(task.progress || 0, 20);
      term(progressBar);
      
      term.cyan(` ⏱ ${elapsed}`);
    });
  }

  generateAnimatedProgress(percentage, width = 20) {
    const filled = Math.round(width * percentage / 100);
    const empty = width - filled;
    const animFrame = Math.floor(Date.now() / 100) % 4;
    const animChars = ['⠋', '⠙', '⠹', '⠸'];
    
    let bar = '[';
    for (let i = 0; i < filled; i++) {
      bar += chalk.green('█');
    }
    
    if (filled < width && percentage > 0 && percentage < 100) {
      bar += chalk.yellow(animChars[animFrame]);
      for (let i = 0; i < empty - 1; i++) {
        bar += chalk.gray('░');
      }
    } else {
      for (let i = 0; i < empty; i++) {
        bar += chalk.gray('░');
      }
    }
    
    bar += '] ' + chalk.bold(`${percentage}%`);
    return bar;
  }

  drawRecentUpdates() {
    const y = this.regions.recent.y;
    
    // Clear the area
    for (let i = 0; i < this.regions.recent.height; i++) {
      term.moveTo(1, y + i);
      term.eraseLine();
    }
    
    term.moveTo(1, y);
    term.bold.white('📝 RECENT UPDATES\n');
    
    if (this.recentUpdates.length === 0) {
      term.moveTo(1, y + 1);
      term.gray('No recent updates. Changes will appear here.');
      return;
    }
    
    this.recentUpdates.forEach((update, index) => {
      term.moveTo(1, y + 2 + index);
      term.gray(update.time);
      term(' ');
      
      // Color code based on update type
      if (update.message.includes('completed')) {
        term.green(update.message);
      } else if (update.message.includes('Progress')) {
        term.yellow(update.message);
      } else if (update.message.includes('New')) {
        term.cyan(update.message);
      } else {
        term(update.message);
      }
    });
  }

  drawHelp() {
    const y = this.regions.help.y;
    
    term.moveTo(1, y);
    term.eraseLine();
    term.gray('─'.repeat(80));
    
    term.moveTo(1, y + 1);
    term.eraseLine();
    term.gray('Shortcuts: ');
    term.yellow('[↑/↓]');
    term.gray(' Navigate  ');
    term.yellow('[+]');
    term.gray(' +10% progress  ');
    term.yellow('[-]');
    term.gray(' -10% progress  ');
    term.yellow('[Space]');
    term.gray(' +5%  ');
    term.yellow('[c]');
    term.gray(' Complete  ');
    term.yellow('[s]');
    term.gray(' Start  ');
    term.yellow('[q]');
    term.gray(' Quit');
  }

  updateProgress(taskId, delta) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      const newProgress = Math.max(0, Math.min(100, (task.progress || 0) + delta));
      task.progress = newProgress;
      
      if (newProgress === 100) {
        task.status = 'completed';
        task.completed_at = new Date().toISOString();
        this.addRecentUpdate(`✅ ${task.id}: Task completed!`);
      } else {
        this.addRecentUpdate(`📈 ${task.id}: Progress updated to ${newProgress}%`);
      }
      
      this.saveTasks();
    }
  }

  toggleTaskStatus(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      if (task.status === 'not-started') {
        task.status = 'in-progress';
        task.started_at = new Date().toISOString();
        this.addRecentUpdate(`🚀 ${task.id}: Task started`);
      } else if (task.status === 'in-progress') {
        task.status = 'completed';
        task.completed_at = new Date().toISOString();
        task.progress = 100;
        this.addRecentUpdate(`✅ ${task.id}: Task completed`);
      } else if (task.status === 'completed') {
        task.status = 'not-started';
        task.progress = 0;
        this.addRecentUpdate(`🔄 ${task.id}: Task reset`);
      }
      
      this.saveTasks();
    }
  }

  saveTasks() {
    try {
      fs.writeFileSync(this.tasksPath, JSON.stringify(this.tasks, null, 2));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  }

  render() {
    if (!this.isRunning) return;
    
    this.loadTasks();
    const metrics = this.calculateMetrics();
    
    this.drawHeader();
    this.drawStats(metrics);
    this.drawInProgressTasks();
    this.drawRecentUpdates();
    this.drawHelp();
  }

  setupKeyboardHandlers() {
    term.on('key', (key) => {
      const inProgressTasks = this.tasks.filter(t => t.status === 'in-progress');
      
      switch(key) {
        case 'q':
        case 'CTRL_C':
          this.quit();
          break;
          
        case 'UP':
          if (this.selectedTaskIndex > 0) {
            this.selectedTaskIndex--;
          }
          break;
          
        case 'DOWN':
          if (this.selectedTaskIndex < inProgressTasks.length - 1) {
            this.selectedTaskIndex++;
          }
          break;
          
        case '+':
        case '=':
          if (inProgressTasks[this.selectedTaskIndex]) {
            this.updateProgress(inProgressTasks[this.selectedTaskIndex].id, 10);
          }
          break;
          
        case '-':
        case '_':
          if (inProgressTasks[this.selectedTaskIndex]) {
            this.updateProgress(inProgressTasks[this.selectedTaskIndex].id, -10);
          }
          break;
          
        case ' ':
          if (inProgressTasks[this.selectedTaskIndex]) {
            this.updateProgress(inProgressTasks[this.selectedTaskIndex].id, 5);
          }
          break;
          
        case 'ENTER':
          if (inProgressTasks[this.selectedTaskIndex]) {
            this.toggleTaskStatus(inProgressTasks[this.selectedTaskIndex].id);
          }
          break;
          
        case 'c':
          if (inProgressTasks[this.selectedTaskIndex]) {
            const task = inProgressTasks[this.selectedTaskIndex];
            task.status = 'completed';
            task.progress = 100;
            task.completed_at = new Date().toISOString();
            this.addRecentUpdate(`✅ ${task.id}: Marked as completed`);
            this.saveTasks();
          }
          break;
          
        case 's':
          // Find first not-started task and start it
          const notStarted = this.tasks.find(t => t.status === 'not-started' && t.priority === 'P0');
          if (notStarted) {
            notStarted.status = 'in-progress';
            notStarted.started_at = new Date().toISOString();
            this.addRecentUpdate(`🚀 ${notStarted.id}: Started new task`);
            this.saveTasks();
          }
          break;
          
        case 'r':
          // Force refresh
          this.render();
          break;
      }
    });
  }

  quit() {
    this.isRunning = false;
    term.clear();
    console.log(chalk.green('\n✨ Live dashboard closed. Session summary:'));
    
    const metrics = this.calculateMetrics();
    console.log(chalk.cyan(`  • Session duration: ${this.formatDuration(Date.now() - this.sessionStartTime)}`));
    console.log(chalk.green(`  • Tasks completed: ${metrics.velocity.session}`));
    console.log(chalk.yellow(`  • Tasks in progress: ${metrics.inProgress}`));
    console.log(chalk.magenta(`  • Overall progress: ${metrics.completionRate}%\n`));
    
    process.exit(0);
  }

  async run() {
    // Setup terminal
    term.fullscreen(true);
    term.hideCursor();
    term.clear();
    
    // Load initial data
    this.loadTasks();
    
    // Setup keyboard input
    this.setupKeyboardHandlers();
    
    // Initial render
    this.render();
    
    // Start refresh loop
    this.refreshTimer = setInterval(() => {
      this.render();
    }, this.refreshInterval);
    
    // Watch file for changes
    fs.watchFile(this.tasksPath, { interval: 500 }, () => {
      this.render();
    });
    
    // Handle process termination
    process.on('SIGINT', () => this.quit());
    process.on('SIGTERM', () => this.quit());
  }
}

// Run the live dashboard
const dashboard = new LiveDashboard();
dashboard.run().catch(err => {
  term.clear();
  console.error(chalk.red('Error:'), err);
  process.exit(1);
});