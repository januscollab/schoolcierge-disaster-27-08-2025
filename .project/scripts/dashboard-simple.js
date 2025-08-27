#!/usr/bin/env node

/**
 * Simple Anti-Flicker Dashboard
 * Uses readline for proper terminal control and fixed layouts
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const TaskState = require('./task-state-manager');

class SimpleDashboard {
  constructor() {
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.tasks = [];
    this.viewMode = 'overview';
    this.isRunning = true;
    
    // Setup readline interface
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.setupInput();
  }

  setupInput() {
    // Raw mode for immediate key response
    process.stdin.setRawMode(true);
    process.stdin.resume();
    
    process.stdin.on('data', (key) => {
      const char = key.toString();
      
      switch (char) {
        case 'q':
        case '\\u0003': // Ctrl+C
          this.quit();
          break;
        case '1':
          this.viewMode = 'overview';
          this.render();
          break;
        case '2':
          this.viewMode = 'critical';
          this.render();
          break;
        case '3':
          this.viewMode = 'in-progress';
          this.render();
          break;
        case '4':
          this.viewMode = 'all';
          this.render();
          break;
        case '5':
          this.viewMode = 'completed';
          this.render();
          break;
        case 'r':
          this.loadTasks();
          break;
      }
    });
  }

  clearScreen() {
    // Clear screen and move cursor to home
    process.stdout.write('\\x1b[2J\\x1b[H');
  }

  loadTasks() {
    try {
      if (fs.existsSync(this.tasksPath)) {
        const data = fs.readFileSync(this.tasksPath, 'utf8');
        this.tasks = JSON.parse(data);
        this.render();
      }
    } catch (error) {
      console.error(`Error loading tasks: ${error.message}`);
    }
  }

  render() {
    if (!this.isRunning) return;
    
    this.clearScreen();
    
    // Header
    console.log('\\x1b[36m\\x1b[1mCREAITE LIVE DASHBOARD\\x1b[0m\\x1b[36m | Session: 1s | ' + new Date().toLocaleTimeString() + '\\x1b[0m\\n');
    
    // Metrics
    this.renderMetrics();
    
    // Tasks
    this.renderTasks();
    
    // Help
    console.log('\\n\\x1b[30m\\x1b[47m [1] Overview  [2] Critical  [3] Active  [4] All  [5] Completed  [↑↓] Scroll  [R] Refresh  [Q] Quit \\x1b[0m');
  }

  renderMetrics() {
    const metrics = this.calculateMetrics();
    
    // Status Overview Box
    console.log('┌─ STATUS OVERVIEW ─────────────────────────┐ ┌─ PRIORITY & ALERTS ──────────────────────┐');
    console.log(`│ ✅ Completed: ${metrics.completed.toString().padEnd(3)} │ ⛔ Blocked: ${metrics.blocked.toString().padEnd(3)} │ │ 🔥 P0: ${metrics.byPriority.P0.toString().padEnd(10)} ⚡ P1: ${metrics.byPriority.P1.toString().padEnd(6)} │`);
    console.log(`│ 🔄 Active: ${metrics.inProgress.toString().padEnd(6)} │ ⭕ Pending: ${metrics.pending.toString().padEnd(2)} │ │ 💡 P2: ${metrics.byPriority.P2.toString().padEnd(10)} 📌 P3: ${metrics.byPriority.P3.toString().padEnd(6)} │`);
    console.log(`│                                            │ │                                           │`);
    console.log(`│ Overall: [${this.createProgressBar(metrics.completionRate, 20)}] ${metrics.completionRate}% │ │ 📅 Today: ${metrics.todayCompleted} completed               │`);
    console.log(`│ Avg Active: ${metrics.averageProgress}%                        │ │                                           │`);
    console.log('└────────────────────────────────────────────┘ └───────────────────────────────────────────┘\\n');
  }

  renderTasks() {
    const displayTasks = this.getFilteredTasks();
    const viewLabel = this.viewMode.toUpperCase();
    
    console.log(`┌─ TASKS (${viewLabel}) ${'─'.repeat(78 - viewLabel.length)}┐`);
    
    if (displayTasks.length === 0) {
      console.log('│ No tasks to display in this view' + ' '.repeat(49) + '│');
    } else {
      displayTasks.slice(0, 15).forEach(task => {
        const icon = this.getStatusIcon(task.status);
        const id = task.id.padEnd(10);
        const title = task.title.substring(0, 40).padEnd(40);
        const status = this.getStatusText(task);
        
        console.log(`│ ${icon} ${id} ${title} ${status} │`);
      });
    }
    
    // Fill remaining space if needed
    const remainingLines = Math.max(0, 15 - displayTasks.length);
    for (let i = 0; i < remainingLines; i++) {
      console.log('│' + ' '.repeat(78) + '│');
    }
    
    console.log('└' + '─'.repeat(78) + '┘');
  }

  calculateMetrics() {
    const metrics = {
      total: this.tasks.length,
      completed: this.tasks.filter(t => t.status === 'completed').length,
      inProgress: this.tasks.filter(t => t.status === 'in-progress').length,
      blocked: this.tasks.filter(t => t.status === 'blocked').length,
      pending: this.tasks.filter(t => t.status === 'not-started').length,
      byPriority: {
        P0: this.tasks.filter(t => t.priority === 'P0').length,
        P1: this.tasks.filter(t => t.priority === 'P1').length,
        P2: this.tasks.filter(t => t.priority === 'P2').length,
        P3: this.tasks.filter(t => t.priority === 'P3').length
      },
      completionRate: 0,
      averageProgress: 0,
      todayCompleted: 0
    };

    if (metrics.total > 0) {
      metrics.completionRate = Math.round((metrics.completed / metrics.total) * 100);
      
      const inProgressTasks = this.tasks.filter(t => t.status === 'in-progress');
      if (inProgressTasks.length > 0) {
        const totalProgress = inProgressTasks.reduce((sum, t) => sum + (t.progress || 0), 0);
        metrics.averageProgress = Math.round(totalProgress / inProgressTasks.length);
      }

      const today = new Date().toDateString();
      metrics.todayCompleted = this.tasks.filter(t => {
        return t.completed_at && new Date(t.completed_at).toDateString() === today;
      }).length;
    }

    return metrics;
  }

  getFilteredTasks() {
    switch (this.viewMode) {
      case 'critical':
        return this.tasks.filter(t => t.priority === 'P0');
      case 'in-progress':
        return this.tasks.filter(t => t.status === 'in-progress');
      case 'completed':
        return this.tasks.filter(t => t.status === 'completed')
          .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime());
      case 'all':
        return this.tasks;
      case 'overview':
      default:
        const inProgress = this.tasks.filter(t => t.status === 'in-progress');
        const critical = this.tasks.filter(t => t.priority === 'P0' && t.status === 'not-started');
        const blocked = this.tasks.filter(t => t.status === 'blocked');
        return [...inProgress, ...critical, ...blocked];
    }
  }

  getStatusIcon(status) {
    switch (status) {
      case 'completed': return '✅';
      case 'in-progress': return '🔄';
      case 'blocked': return '⛔';
      default: return '⭕';
    }
  }

  getStatusText(task) {
    if (task.status === 'in-progress') {
      return `${task.progress || 0}%`.padEnd(20);
    } else if (task.status === 'completed' && task.completed_at) {
      return `✅ ${new Date(task.completed_at).toLocaleDateString()}`.padEnd(20);
    } else {
      return task.status.padEnd(20);
    }
  }

  createProgressBar(percentage, width) {
    const filled = Math.round((width * percentage) / 100);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  run() {
    this.loadTasks();
    
    // Auto-refresh every 2 seconds
    setInterval(() => {
      if (this.isRunning) {
        this.loadTasks();
      }
    }, 2000);
  }

  quit() {
    this.isRunning = false;
    process.stdin.setRawMode(false);
    process.stdin.pause();
    this.rl.close();
    console.log('\\n\\x1b[32mDashboard closed.\\x1b[0m');
    process.exit(0);
  }
}

// Run the dashboard
const dashboard = new SimpleDashboard();
dashboard.run();