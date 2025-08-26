#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const gradient = require('gradient-string');
const Table = require('cli-table3');
const ora = require('ora');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  gray: '\x1b[90m'
};

class ViewsGenerator {
  constructor() {
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.viewsPath = path.join(__dirname, '../tasks/views');
    
    // creaite branding
    this.creaiteGradient = gradient(['#0891b2', '#06b6d4', '#14b8a6']);
    this.aiGradient = gradient(['#fbbf24', '#f59e0b', '#fb923c']);
  }

  loadTasks() {
    if (!fs.existsSync(this.tasksPath)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(this.tasksPath, 'utf8'));
  }

  ensureViewsDirectory() {
    if (!fs.existsSync(this.viewsPath)) {
      fs.mkdirSync(this.viewsPath, { recursive: true });
    }
  }

  generateCategoryView(tasks) {
    const categories = {};
    tasks.forEach(task => {
      if (!categories[task.category]) {
        categories[task.category] = {
          total: 0,
          byStatus: {},
          byPriority: {},
          tasks: []
        };
      }
      
      const cat = categories[task.category];
      cat.total++;
      cat.byStatus[task.status] = (cat.byStatus[task.status] || 0) + 1;
      cat.byPriority[task.priority] = (cat.byPriority[task.priority] || 0) + 1;
      cat.tasks.push({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority
      });
    });

    return categories;
  }

  generatePriorityView(tasks) {
    const priorities = { P0: [], P1: [], P2: [], P3: [] };
    
    tasks.forEach(task => {
      if (priorities[task.priority]) {
        priorities[task.priority].push({
          id: task.id,
          title: task.title,
          category: task.category,
          status: task.status
        });
      }
    });

    return priorities;
  }

  generateDependencyView(tasks) {
    const deps = {
      blockers: [],
      blocked: [],
      standalone: []
    };

    tasks.forEach(task => {
      if (task.dependencies.blocks && task.dependencies.blocks.length > 0) {
        deps.blockers.push({
          id: task.id,
          title: task.title,
          blocks: task.dependencies.blocks,
          status: task.status
        });
      }
      
      if (task.dependencies.blocked_by && task.dependencies.blocked_by.length > 0) {
        deps.blocked.push({
          id: task.id,
          title: task.title,
          blockedBy: task.dependencies.blocked_by,
          status: task.status
        });
      }
      
      if ((!task.dependencies.blocks || task.dependencies.blocks.length === 0) &&
          (!task.dependencies.blocked_by || task.dependencies.blocked_by.length === 0)) {
        deps.standalone.push({
          id: task.id,
          title: task.title,
          status: task.status
        });
      }
    });

    return deps;
  }

  saveViews(views) {
    this.ensureViewsDirectory();
    
    // Save each view as JSON
    Object.entries(views).forEach(([viewName, data]) => {
      const viewPath = path.join(this.viewsPath, `${viewName}.json`);
      fs.writeFileSync(viewPath, JSON.stringify(data, null, 2));
    });
  }

  displaySummary(views) {
    console.clear();
    
    // Display creaite branding
    console.log('\n' + this.creaiteGradient('━'.repeat(60)));
    console.log(
      colors.bold + this.creaiteGradient('cre') + 
      this.aiGradient('ai') + 
      this.creaiteGradient('te') + 
      colors.reset + ' ' +
      colors.bold + '📊 Views Generator' + colors.reset
    );
    console.log(this.creaiteGradient('━'.repeat(60)) + '\n');

    // Category Summary
    console.log(colors.cyan + colors.bold + '📂 Categories Overview:' + colors.reset);
    const catTable = new Table({
      head: ['Category', 'Total', 'Not Started', 'In Progress', 'Completed'],
      style: { border: ['cyan'] }
    });

    Object.entries(views.category).forEach(([cat, data]) => {
      catTable.push([
        cat,
        data.total,
        data.byStatus['not-started'] || 0,
        data.byStatus['in-progress'] || 0,
        data.byStatus['completed'] || 0
      ]);
    });
    console.log(catTable.toString());

    // Priority Summary
    console.log('\n' + colors.yellow + colors.bold + '⚡ Priority Distribution:' + colors.reset);
    const priTable = new Table({
      head: ['Priority', 'Count', 'Percentage'],
      style: { border: ['yellow'] }
    });

    const totalTasks = views.tasks.length;
    Object.entries(views.priority).forEach(([pri, tasks]) => {
      const percentage = totalTasks > 0 ? ((tasks.length / totalTasks) * 100).toFixed(1) : 0;
      priTable.push([
        pri,
        tasks.length,
        `${percentage}%`
      ]);
    });
    console.log(priTable.toString());

    // Dependency Summary
    console.log('\n' + colors.green + colors.bold + '🔗 Dependency Analysis:' + colors.reset);
    console.log(`  ${colors.bold}Blocker tasks:${colors.reset} ${views.dependency.blockers.length}`);
    console.log(`  ${colors.bold}Blocked tasks:${colors.reset} ${views.dependency.blocked.length}`);
    console.log(`  ${colors.bold}Standalone tasks:${colors.reset} ${views.dependency.standalone.length}`);

    console.log('\n' + colors.green + '✅ Views generated successfully!' + colors.reset);
    console.log(colors.gray + `Saved to: ${this.viewsPath}` + colors.reset);
  }

  async run() {
    const spinner = ora({
      text: 'Loading tasks...',
      spinner: 'dots12',
      color: 'cyan'
    }).start();

    const tasks = this.loadTasks();
    
    spinner.text = 'Generating views...';
    
    const views = {
      tasks: tasks,
      category: this.generateCategoryView(tasks),
      priority: this.generatePriorityView(tasks),
      dependency: this.generateDependencyView(tasks),
      generated: new Date().toISOString()
    };

    spinner.text = 'Saving views...';
    this.saveViews(views);
    
    spinner.succeed('Views generated successfully!');
    
    // Display summary
    this.displaySummary(views);
  }
}

// Run the generator
const generator = new ViewsGenerator();
generator.run().catch(err => {
  console.error(colors.bold + '\x1b[31mError:' + colors.reset, err.message);
  process.exit(1);
});