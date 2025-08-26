#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class Visualizer {
  constructor() {
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.depsPath = path.join(__dirname, '../tasks/dependencies.json');
  }

  loadTasks() {
    if (!fs.existsSync(this.tasksPath)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(this.tasksPath, 'utf8'));
  }

  loadDependencies() {
    if (!fs.existsSync(this.depsPath)) {
      return { graph: {}, milestones: [], critical_path: [] };
    }
    return JSON.parse(fs.readFileSync(this.depsPath, 'utf8'));
  }

  generateGanttChart() {
    const tasks = this.loadTasks();
    
    if (tasks.length === 0) {
      console.log('No tasks to visualize');
      return;
    }

    console.log('\\n📊 Gantt Chart (Mermaid)\\n' + '='.repeat(60));
    console.log('```mermaid');
    console.log('gantt');
    console.log('    title SchoolCierge Development Timeline');
    console.log('    dateFormat YYYY-MM-DD');
    
    // Group tasks by category
    const categories = {};
    tasks.forEach(task => {
      if (!categories[task.category]) {
        categories[task.category] = [];
      }
      categories[task.category].push(task);
    });

    Object.entries(categories).forEach(([category, catTasks]) => {
      console.log(`    section ${category}`);
      catTasks.forEach(task => {
        const status = task.status === 'completed' ? 'done' : 
                      task.status === 'in-progress' ? 'active' : '';
        const duration = task.estimates.effort_hours || 8;
        console.log(`    ${task.title} :${status} ${task.id}, ${duration}h`);
      });
    });
    
    console.log('```');
    console.log('\\nCopy the above Mermaid code to visualize in any Mermaid-compatible viewer');
  }

  generateDependencyGraph() {
    const tasks = this.loadTasks();
    const deps = this.loadDependencies();
    
    if (tasks.length === 0) {
      console.log('No tasks to visualize');
      return;
    }

    console.log('\\n🔗 Dependency Graph (Mermaid)\\n' + '='.repeat(60));
    console.log('```mermaid');
    console.log('graph TD');
    
    // Add all tasks as nodes
    tasks.forEach(task => {
      const style = task.status === 'completed' ? 'fill:#90EE90' :
                   task.status === 'in-progress' ? 'fill:#FFD700' :
                   task.status === 'blocked' ? 'fill:#FF6B6B' : 'fill:#E0E0E0';
      console.log(`    ${task.id}["${task.title}"]`);
      console.log(`    style ${task.id} ${style}`);
    });
    
    // Add dependencies
    tasks.forEach(task => {
      if (task.dependencies.blocked_by && task.dependencies.blocked_by.length > 0) {
        task.dependencies.blocked_by.forEach(dep => {
          console.log(`    ${dep} --> ${task.id}`);
        });
      }
    });
    
    console.log('```');
    console.log('\\nLegend:');
    console.log('🟢 Green = Completed');
    console.log('🟡 Yellow = In Progress');
    console.log('🔴 Red = Blocked');
    console.log('⚪ Gray = Not Started');
  }

  generateBurndownChart() {
    const tasks = this.loadTasks();
    const totalPoints = tasks.reduce((sum, task) => sum + (task.estimates.effort_hours || 0), 0);
    const completedPoints = tasks
      .filter(t => t.status === 'completed')
      .reduce((sum, task) => sum + (task.estimates.effort_hours || 0), 0);
    
    console.log('\\n📉 Burndown Metrics\\n' + '='.repeat(60));
    console.log(`Total Effort: ${totalPoints} hours`);
    console.log(`Completed: ${completedPoints} hours`);
    console.log(`Remaining: ${totalPoints - completedPoints} hours`);
    console.log(`Progress: ${totalPoints > 0 ? (completedPoints / totalPoints * 100).toFixed(1) : 0}%`);
    
    // Simple ASCII burndown
    const width = 50;
    const height = 10;
    console.log('\\n' + '─'.repeat(width + 2));
    
    for (let i = height; i >= 0; i--) {
      let line = '│';
      for (let j = 0; j < width; j++) {
        if (j < (completedPoints / totalPoints * width)) {
          line += '█';
        } else {
          line += ' ';
        }
      }
      line += '│';
      if (i === height) line += ` ${totalPoints}h`;
      if (i === 0) line += ' 0h';
      console.log(line);
    }
    console.log('└' + '─'.repeat(width) + '┘');
    console.log(' Start' + ' '.repeat(width - 10) + 'End');
  }

  run(type = 'all') {
    console.log('\\n🎨 SchoolCierge Task Visualizations\\n');
    
    switch (type) {
      case 'gantt':
        this.generateGanttChart();
        break;
      case 'dependencies':
      case 'deps':
        this.generateDependencyGraph();
        break;
      case 'burndown':
        this.generateBurndownChart();
        break;
      default:
        this.generateGanttChart();
        console.log('\\n');
        this.generateDependencyGraph();
        console.log('\\n');
        this.generateBurndownChart();
    }
  }
}

// CLI
const visualizer = new Visualizer();
const type = process.argv[2] || 'all';
visualizer.run(type);