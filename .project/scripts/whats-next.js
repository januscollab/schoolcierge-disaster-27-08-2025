#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const gradient = require('gradient-string');
const Table = require('cli-table3');
const boxenLib = require('boxen');
const boxen = boxenLib.default || boxenLib;

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  white: '\x1b[37m'
};

class WhatsNextAnalyzer {
  constructor() {
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    
    // creaite branding
    this.creaiteGradient = gradient(['#0891b2', '#06b6d4', '#14b8a6']);
    this.aiGradient = gradient(['#fbbf24', '#f59e0b', '#fb923c']);
    this.dangerGradient = gradient(['#ef4444', '#dc2626']);
  }

  loadTasks() {
    if (!fs.existsSync(this.tasksPath)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(this.tasksPath, 'utf8'));
  }

  analyzeNextTasks(tasks) {
    const analysis = {
      critical: [],
      inProgress: [],
      blockers: [],
      recommended: [],
      quickWins: []
    };

    // Sort tasks for processing
    const notStarted = tasks.filter(t => t.status === 'not-started');
    const inProgress = tasks.filter(t => t.status === 'in-progress');
    const blocked = tasks.filter(t => t.status === 'blocked');

    // In Progress Tasks (continue these first)
    analysis.inProgress = inProgress.map(task => ({
      id: task.id,
      title: task.title,
      progress: task.progress || 0,
      priority: task.priority,
      category: task.category
    }));

    // Critical Tasks (P0 not started)
    analysis.critical = notStarted
      .filter(t => t.priority === 'P0')
      .slice(0, 5)
      .map(task => ({
        id: task.id,
        title: task.title,
        category: task.category,
        effort: task.effort_hours
      }));

    // Find blockers (tasks that are blocking others)
    const blockingMap = {};
    tasks.forEach(task => {
      if (task.dependencies.blocked_by && task.dependencies.blocked_by.length > 0) {
        task.dependencies.blocked_by.forEach(blockerId => {
          if (!blockingMap[blockerId]) {
            blockingMap[blockerId] = [];
          }
          blockingMap[blockerId].push(task.id);
        });
      }
    });

    // Identify critical blockers
    Object.entries(blockingMap).forEach(([blockerId, blockedTasks]) => {
      const blocker = tasks.find(t => t.id === blockerId);
      if (blocker && blocker.status !== 'completed') {
        analysis.blockers.push({
          id: blockerId,
          title: blocker.title,
          status: blocker.status,
          blocking: blockedTasks,
          priority: blocker.priority
        });
      }
    });

    // Sort blockers by number of blocked tasks
    analysis.blockers.sort((a, b) => b.blocking.length - a.blocking.length);

    // Quick Wins (low effort, no dependencies)
    analysis.quickWins = notStarted
      .filter(t => 
        t.effort_hours <= 2 &&
        (!t.dependencies.blocked_by || t.dependencies.blocked_by.length === 0)
      )
      .slice(0, 5)
      .map(task => ({
        id: task.id,
        title: task.title,
        effort: task.effort_hours,
        priority: task.priority
      }));

    // Recommended Next (P1 tasks with no blockers)
    analysis.recommended = notStarted
      .filter(t => 
        t.priority === 'P1' &&
        (!t.dependencies.blocked_by || t.dependencies.blocked_by.length === 0)
      )
      .slice(0, 5)
      .map(task => ({
        id: task.id,
        title: task.title,
        category: task.category,
        priority: task.priority
      }));

    return analysis;
  }

  displayHeader() {
    console.clear();
    
    // creaite branding
    console.log('\n' + this.creaiteGradient('━'.repeat(60)));
    console.log(
      '    ' + colors.bold + this.creaiteGradient('cre') + 
      this.aiGradient('ai') + 
      this.creaiteGradient('te') + 
      colors.reset + ' ' +
      colors.bold + colors.white + '🎯 What to Work on Next' + colors.reset
    );
    console.log(this.creaiteGradient('━'.repeat(60)) + '\n');
  }

  displayAnalysis(analysis) {
    // Critical Tasks
    if (analysis.critical.length > 0) {
      console.log(
        boxen(
          colors.bold + colors.red + '⚠️  CRITICAL TASKS (P0)' + colors.reset,
          {
            borderColor: 'red',
            borderStyle: 'bold',
            padding: 1,
            align: 'center'
          }
        )
      );
      
      const criticalTable = new Table({
        head: ['ID', 'Title', 'Category', 'Command'],
        style: { border: ['red'] },
        colWidths: [12, 40, 15, 20]
      });
      
      analysis.critical.forEach(task => {
        criticalTable.push([
          colors.bold + task.id + colors.reset,
          task.title.substring(0, 38),
          task.category,
          colors.cyan + `cx build ${task.id}` + colors.reset
        ]);
      });
      
      console.log(criticalTable.toString());
      console.log();
    }

    // In Progress Tasks
    if (analysis.inProgress.length > 0) {
      console.log(colors.yellow + colors.bold + '🔄 Continue In-Progress Tasks:\n' + colors.reset);
      
      const progressTable = new Table({
        head: ['ID', 'Title', 'Progress', 'Command'],
        style: { border: ['yellow'] },
        colWidths: [12, 35, 12, 25]
      });
      
      analysis.inProgress.forEach(task => {
        const progressBar = this.generateMiniProgress(task.progress || 0);
        progressTable.push([
          colors.bold + task.id + colors.reset,
          task.title.substring(0, 33),
          progressBar,
          colors.green + `cx update ${task.id}` + colors.reset
        ]);
      });
      
      console.log(progressTable.toString());
      console.log();
    }

    // Blockers
    if (analysis.blockers.length > 0) {
      console.log(this.dangerGradient('🚧 CRITICAL BLOCKERS') + '\n');
      console.log(colors.gray + 'These tasks are blocking others - prioritize them!\n' + colors.reset);
      
      const blockerTable = new Table({
        head: ['Blocker ID', 'Status', 'Blocking', 'Action'],
        style: { border: ['red'] },
        colWidths: [12, 12, 25, 25]
      });
      
      analysis.blockers.slice(0, 3).forEach(blocker => {
        blockerTable.push([
          colors.bold + colors.red + blocker.id + colors.reset,
          blocker.status,
          blocker.blocking.slice(0, 3).join(', '),
          colors.cyan + `cx start ${blocker.id}` + colors.reset
        ]);
      });
      
      console.log(blockerTable.toString());
      console.log();
    }

    // Quick Wins
    if (analysis.quickWins.length > 0) {
      console.log(colors.green + colors.bold + '⚡ Quick Wins (Low Effort):\n' + colors.reset);
      
      const quickTable = new Table({
        head: ['ID', 'Title', 'Effort', 'Command'],
        style: { border: ['green'] },
        colWidths: [12, 40, 10, 25]
      });
      
      analysis.quickWins.forEach(task => {
        quickTable.push([
          colors.bold + task.id + colors.reset,
          task.title.substring(0, 38),
          `${task.effort}h`,
          colors.green + `cx build ${task.id}` + colors.reset
        ]);
      });
      
      console.log(quickTable.toString());
      console.log();
    }

    // Recommended Next
    if (analysis.recommended.length > 0) {
      console.log(colors.cyan + colors.bold + '✨ Recommended Next Tasks:\n' + colors.reset);
      
      const recTable = new Table({
        head: ['Priority', 'ID', 'Title', 'Quick Start'],
        style: { border: ['cyan'] },
        colWidths: [10, 12, 35, 25]
      });
      
      analysis.recommended.forEach(task => {
        recTable.push([
          colors.yellow + task.priority + colors.reset,
          colors.bold + task.id + colors.reset,
          task.title.substring(0, 33),
          colors.green + `cx build ${task.id}` + colors.reset
        ]);
      });
      
      console.log(recTable.toString());
    }

    // Footer with AI suggestion
    console.log('\n' + this.creaiteGradient('━'.repeat(60)));
    console.log(
      colors.bold + this.aiGradient('🤖 ai Suggestion: ') + colors.reset +
      this.getAISuggestion(analysis)
    );
    console.log(this.creaiteGradient('━'.repeat(60)) + '\n');
  }

  generateMiniProgress(percentage) {
    const width = 10;
    const filled = Math.round(width * percentage / 100);
    const empty = width - filled;
    
    let bar = '';
    for (let i = 0; i < filled; i++) {
      bar += '█';
    }
    for (let i = 0; i < empty; i++) {
      bar += '░';
    }
    
    return bar + ` ${percentage}%`;
  }

  getAISuggestion(analysis) {
    if (analysis.critical.length > 0) {
      return `Focus on critical P0 task: ${colors.bold}${analysis.critical[0].id}${colors.reset}`;
    } else if (analysis.blockers.length > 0) {
      const topBlocker = analysis.blockers[0];
      return `Unblock ${topBlocker.blocking.length} tasks by completing: ${colors.bold}${topBlocker.id}${colors.reset}`;
    } else if (analysis.inProgress.length > 0) {
      return `Continue your progress on: ${colors.bold}${analysis.inProgress[0].id}${colors.reset}`;
    } else if (analysis.quickWins.length > 0) {
      return `Build momentum with quick win: ${colors.bold}${analysis.quickWins[0].id}${colors.reset}`;
    } else if (analysis.recommended.length > 0) {
      return `Start with recommended task: ${colors.bold}${analysis.recommended[0].id}${colors.reset}`;
    }
    return 'All tasks completed! Time to celebrate! 🎉';
  }

  run() {
    const tasks = this.loadTasks();
    
    if (tasks.length === 0) {
      console.log(colors.yellow + '\n⚠️  No tasks found in backlog.' + colors.reset);
      console.log(colors.gray + 'Add tasks using: ' + colors.cyan + 'cx add "Task title"' + colors.reset);
      return;
    }

    const analysis = this.analyzeNextTasks(tasks);
    
    this.displayHeader();
    this.displayAnalysis(analysis);
  }
}

// Run the analyzer
const analyzer = new WhatsNextAnalyzer();
analyzer.run();