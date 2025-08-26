#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class TaskManager {
  constructor() {
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.depsPath = path.join(__dirname, '../tasks/dependencies.json');
    this.ensureFiles();
  }

  ensureFiles() {
    if (!fs.existsSync(this.tasksPath)) {
      fs.writeFileSync(this.tasksPath, '[]');
    }
    if (!fs.existsSync(this.depsPath)) {
      fs.writeFileSync(this.depsPath, JSON.stringify({
        graph: {},
        milestones: [],
        critical_path: []
      }, null, 2));
    }
  }

  loadTasks() {
    return JSON.parse(fs.readFileSync(this.tasksPath, 'utf8'));
  }

  saveTasks(tasks) {
    fs.writeFileSync(this.tasksPath, JSON.stringify(tasks, null, 2));
  }

  generateId() {
    const tasks = this.loadTasks();
    const maxId = tasks.reduce((max, task) => {
      const num = parseInt(task.id.split('-')[1] || 0);
      return num > max ? num : max;
    }, 0);
    return `TASK-${String(maxId + 1).padStart(3, '0')}`;
  }

  add(title, options = {}) {
    const tasks = this.loadTasks();
    const newTask = {
      id: this.generateId(),
      title,
      category: options.category || 'general',
      priority: options.priority || 'P2',
      status: 'not-started',
      created_at: new Date().toISOString(),
      
      product_requirements: {
        description: options.description || '',
        acceptance_criteria: [],
        user_stories: [],
        prd_references: options.prd ? [options.prd] : []
      },
      
      technical_requirements: {
        description: options.tech || '',
        architecture_decisions: [],
        technology_stack: [],
        api_contracts: {},
        data_models: {},
        trd_references: options.trd ? [options.trd] : []
      },
      
      dependencies: {
        blocks: [],
        blocked_by: options.dependencies ? options.dependencies.split(',') : [],
        parallel_with: []
      },
      
      estimates: {
        effort_hours: options.estimate || 0,
        complexity: options.complexity || 'M',
        risk_level: options.risk || 'medium'
      },
      
      implementation_notes: {
        files_to_modify: [],
        files_to_create: [],
        testing_approach: '',
        rollback_plan: ''
      },
      
      progress: 0
    };

    tasks.push(newTask);
    this.saveTasks(tasks);
    console.log(`✅ Created task ${newTask.id}: ${title}`);
    return newTask.id;
  }

  update(taskId, updates) {
    const tasks = this.loadTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      console.error(`❌ Task ${taskId} not found`);
      return false;
    }

    const task = tasks[taskIndex];
    
    // Update status
    if (updates.status) {
      task.status = updates.status;
      if (updates.status === 'completed') {
        task.completed_at = new Date().toISOString();
        task.progress = 100;
      } else if (updates.status === 'in-progress' && task.progress === 0) {
        task.started_at = new Date().toISOString();
        task.progress = task.progress || 10;
      }
    }

    // Update progress
    if (updates.progress !== undefined) {
      task.progress = parseInt(updates.progress);
      if (task.progress >= 100) {
        task.status = 'completed';
        task.completed_at = new Date().toISOString();
      } else if (task.progress > 0 && task.status === 'not-started') {
        task.status = 'in-progress';
        task.started_at = new Date().toISOString();
      }
    }

    // Update other fields
    Object.keys(updates).forEach(key => {
      if (!['status', 'progress'].includes(key)) {
        task[key] = updates[key];
      }
    });

    tasks[taskIndex] = task;
    this.saveTasks(tasks);
    console.log(`✅ Updated task ${taskId}`);
    return true;
  }

  list(filter = {}) {
    const tasks = this.loadTasks();
    let filtered = tasks;

    if (filter.status) {
      filtered = filtered.filter(t => t.status === filter.status);
    }
    if (filter.priority) {
      filtered = filtered.filter(t => t.priority === filter.priority);
    }
    if (filter.category) {
      filtered = filtered.filter(t => t.category === filter.category);
    }

    console.log('\\n📋 Task List\\n' + '='.repeat(50));
    
    if (filtered.length === 0) {
      console.log('No tasks found');
      return;
    }

    filtered.forEach(task => {
      const statusIcon = {
        'not-started': '⭕',
        'in-progress': '🔄',
        'blocked': '🚫',
        'completed': '✅'
      }[task.status] || '❓';

      console.log(`${statusIcon} ${task.id}: ${task.title}`);
      console.log(`   Status: ${task.status} | Priority: ${task.priority} | Progress: ${task.progress}%`);
      if (task.dependencies.blocked_by.length > 0) {
        console.log(`   Blocked by: ${task.dependencies.blocked_by.join(', ')}`);
      }
      console.log('');
    });

    // Summary
    const summary = {
      total: filtered.length,
      'not-started': filtered.filter(t => t.status === 'not-started').length,
      'in-progress': filtered.filter(t => t.status === 'in-progress').length,
      blocked: filtered.filter(t => t.status === 'blocked').length,
      completed: filtered.filter(t => t.status === 'completed').length
    };

    console.log('='.repeat(50));
    console.log(`Total: ${summary.total} | Not Started: ${summary['not-started']} | In Progress: ${summary['in-progress']} | Blocked: ${summary.blocked} | Completed: ${summary.completed}`);
  }

  detail(taskId) {
    const tasks = this.loadTasks();
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
      console.error(`❌ Task ${taskId} not found`);
      return;
    }

    console.log('\\n' + '='.repeat(60));
    console.log(`Task Details: ${task.id}`);
    console.log('='.repeat(60));
    console.log(JSON.stringify(task, null, 2));
  }

  complete(taskId) {
    return this.update(taskId, { status: 'completed' });
  }

  start(taskId) {
    return this.update(taskId, { status: 'in-progress' });
  }
}

// CLI Interface
const manager = new TaskManager();
const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case 'add':
    const title = args[0];
    if (!title) {
      console.error('Usage: task-manager add "Task Title" [--priority P0] [--category backend]');
      process.exit(1);
    }
    
    const options = {};
    for (let i = 1; i < args.length; i += 2) {
      if (args[i].startsWith('--')) {
        const key = args[i].substring(2);
        options[key] = args[i + 1];
      }
    }
    
    manager.add(title, options);
    break;

  case 'update':
    const updateId = args[0];
    if (!updateId) {
      console.error('Usage: task-manager update TASK-001 --status in-progress --progress 50');
      process.exit(1);
    }
    
    const updates = {};
    for (let i = 1; i < args.length; i += 2) {
      if (args[i].startsWith('--')) {
        const key = args[i].substring(2);
        updates[key] = args[i + 1];
      }
    }
    
    manager.update(updateId, updates);
    break;

  case 'list':
    const listFilter = {};
    for (let i = 0; i < args.length; i += 2) {
      if (args[i].startsWith('--')) {
        const key = args[i].substring(2);
        listFilter[key] = args[i + 1];
      }
    }
    manager.list(listFilter);
    break;

  case 'detail':
    if (!args[0]) {
      console.error('Usage: task-manager detail TASK-001');
      process.exit(1);
    }
    manager.detail(args[0]);
    break;

  case 'complete':
    if (!args[0]) {
      console.error('Usage: task-manager complete TASK-001');
      process.exit(1);
    }
    manager.complete(args[0]);
    break;

  case 'start':
    if (!args[0]) {
      console.error('Usage: task-manager start TASK-001');
      process.exit(1);
    }
    manager.start(args[0]);
    break;

  default:
    console.log(`
Task Manager - Usage:
  
  add "title" [options]     Add a new task
  update ID [options]       Update an existing task  
  list [--status VALUE]     List tasks with optional filter
  detail ID                 Show detailed task information
  complete ID              Mark task as completed
  start ID                 Mark task as in-progress
  
Options:
  --priority P0|P1|P2|P3   Set priority level
  --category VALUE         Set category (backend, frontend, etc)
  --status VALUE           Set status
  --progress VALUE         Set progress percentage
  --description VALUE      Set description
  --estimate VALUE         Set effort estimate in hours
  --dependencies IDs       Comma-separated task IDs this depends on
    `);
}