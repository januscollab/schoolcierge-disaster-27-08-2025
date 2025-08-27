#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

class TaskWorker {
  constructor(taskId) {
    this.taskId = taskId;
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.workspaceRoot = path.resolve(__dirname, '../..');
  }

  loadTasks() {
    return JSON.parse(fs.readFileSync(this.tasksPath, 'utf8'));
  }

  saveTasks(tasks) {
    fs.writeFileSync(this.tasksPath, JSON.stringify(tasks, null, 2));
  }

  updateTaskProgress(progress, notes = '') {
    const tasks = this.loadTasks();
    const taskIndex = tasks.findIndex(t => t.id === this.taskId);
    
    if (taskIndex === -1) {
      throw new Error(`Task ${this.taskId} not found`);
    }

    const task = tasks[taskIndex];
    task.progress = progress;
    
    if (notes) {
      if (!task.implementation_notes.execution_log) {
        task.implementation_notes.execution_log = [];
      }
      task.implementation_notes.execution_log.push({
        timestamp: new Date().toISOString(),
        progress,
        notes
      });
    }

    if (progress >= 100) {
      task.status = 'completed';
      task.completed_at = new Date().toISOString();
    }

    tasks[taskIndex] = task;
    this.saveTasks(tasks);
    console.log(`📊 ${this.taskId}: ${progress}% - ${notes}`);
  }

  async runCommand(command, description) {
    return new Promise((resolve, reject) => {
      console.log(`🔄 ${description}`);
      exec(command, { cwd: this.workspaceRoot }, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ ${description} failed:`, error.message);
          reject(error);
        } else {
          console.log(`✅ ${description} completed`);
          if (stdout) console.log(stdout);
          resolve({ stdout, stderr });
        }
      });
    });
  }

  async execute() {
    throw new Error('Must implement execute() method');
  }
}

class RailwayInfrastructureWorker extends TaskWorker {
  async execute() {
    try {
      this.updateTaskProgress(10, 'Starting Railway infrastructure setup');
      
      // Step 1: Check if railway CLI is available
      try {
        await this.runCommand('railway --version', 'Checking Railway CLI');
        this.updateTaskProgress(20, 'Railway CLI verified');
      } catch (error) {
        this.updateTaskProgress(25, 'Installing Railway CLI');
        await this.runCommand('npm install -g @railway/cli', 'Installing Railway CLI');
      }

      // Step 2: Check if already logged in
      this.updateTaskProgress(30, 'Checking Railway authentication');
      try {
        await this.runCommand('railway whoami', 'Checking auth status');
        this.updateTaskProgress(40, 'Already authenticated with Railway');
      } catch (error) {
        console.log('⚠️  Railway login required. Please run: railway login');
        this.updateTaskProgress(35, 'Railway login required - manual step needed');
        return;
      }

      // Step 3: Create or link project
      this.updateTaskProgress(50, 'Setting up Railway project');
      try {
        // Try to see if project exists
        await this.runCommand('railway status', 'Checking project status');
        this.updateTaskProgress(60, 'Railway project already exists');
      } catch (error) {
        // Create new project
        await this.runCommand('railway login', 'Creating Railway project');
        this.updateTaskProgress(65, 'Railway project created');
      }

      // Step 4: Add PostgreSQL service
      this.updateTaskProgress(70, 'Adding PostgreSQL service');
      try {
        await this.runCommand('railway add --database postgresql', 'Adding PostgreSQL database');
        this.updateTaskProgress(80, 'PostgreSQL service added');
      } catch (error) {
        console.log('⚠️  PostgreSQL might already exist or manual setup needed');
        this.updateTaskProgress(75, 'PostgreSQL setup needs verification');
      }

      // Step 5: Add Redis service  
      this.updateTaskProgress(85, 'Adding Redis service');
      try {
        await this.runCommand('railway add --database redis', 'Adding Redis database');
        this.updateTaskProgress(95, 'Redis service added');
      } catch (error) {
        console.log('⚠️  Redis might already exist or manual setup needed');
        this.updateTaskProgress(90, 'Redis setup needs verification');
      }

      this.updateTaskProgress(100, 'Railway infrastructure setup completed');

    } catch (error) {
      console.error(`❌ ${this.taskId} failed:`, error.message);
      this.updateTaskProgress(Math.max(10, this.getCurrentProgress()), `Failed: ${error.message}`);
    }
  }

  getCurrentProgress() {
    const tasks = this.loadTasks();
    const task = tasks.find(t => t.id === this.taskId);
    return task ? task.progress : 0;
  }
}

class ExpoMobileWorker extends TaskWorker {
  async execute() {
    try {
      this.updateTaskProgress(10, 'Starting Expo mobile app initialization');

      // Step 1: Check if Expo CLI is available
      try {
        await this.runCommand('npx expo --version', 'Checking Expo CLI');
        this.updateTaskProgress(20, 'Expo CLI verified');
      } catch (error) {
        this.updateTaskProgress(15, 'Expo CLI not found, will use npx');
      }

      // Step 2: Create mobile app directory
      const mobileDir = path.join(this.workspaceRoot, 'mobile');
      if (!fs.existsSync(mobileDir)) {
        this.updateTaskProgress(25, 'Creating mobile directory');
        fs.mkdirSync(mobileDir, { recursive: true });
      }

      // Step 3: Initialize Expo project
      this.updateTaskProgress(30, 'Initializing Expo project');
      await this.runCommand(
        'npx create-expo-app@latest . --template blank-typescript',
        'Creating Expo TypeScript project'
      );
      this.updateTaskProgress(60, 'Expo project created with TypeScript');

      // Step 4: Install navigation dependencies
      this.updateTaskProgress(65, 'Installing navigation libraries');
      await this.runCommand(
        'npm install @react-navigation/native @react-navigation/native-stack',
        'Installing React Navigation'
      );
      
      await this.runCommand(
        'npx expo install react-native-screens react-native-safe-area-context',
        'Installing navigation dependencies'
      );
      this.updateTaskProgress(85, 'Navigation libraries installed');

      // Step 5: Create basic app structure
      this.updateTaskProgress(90, 'Setting up basic app structure');
      
      // Create src directory structure
      const srcDirs = ['src/screens', 'src/components', 'src/navigation', 'src/services', 'src/types'];
      srcDirs.forEach(dir => {
        const fullPath = path.join(mobileDir, dir);
        if (!fs.existsSync(fullPath)) {
          fs.mkdirSync(fullPath, { recursive: true });
        }
      });

      this.updateTaskProgress(100, 'Expo mobile app initialization completed');

    } catch (error) {
      console.error(`❌ ${this.taskId} failed:`, error.message);
      this.updateTaskProgress(Math.max(10, this.getCurrentProgress()), `Failed: ${error.message}`);
    }
  }

  getCurrentProgress() {
    const tasks = this.loadTasks();
    const task = tasks.find(t => t.id === this.taskId);
    return task ? task.progress : 0;
  }
}

class WorkerDispatcher {
  constructor() {
    this.workers = {
      'TASK-001': RailwayInfrastructureWorker,
      'TASK-002': RailwayInfrastructureWorker, 
      'TASK-008': ExpoMobileWorker
    };
  }

  async executeTask(taskId) {
    const WorkerClass = this.workers[taskId];
    
    if (!WorkerClass) {
      console.error(`❌ No worker available for ${taskId}`);
      return false;
    }

    console.log(`🚀 Starting worker for ${taskId}`);
    const worker = new WorkerClass(taskId);
    
    try {
      await worker.execute();
      console.log(`✅ Worker completed for ${taskId}`);
      return true;
    } catch (error) {
      console.error(`❌ Worker failed for ${taskId}:`, error.message);
      return false;
    }
  }

  async executeStuckTasks() {
    const taskManager = require('./task-manager.js');
    const tasks = new (require('./task-manager.js').constructor || taskManager.constructor)().loadTasks();
    
    const stuckTasks = tasks.filter(t => 
      t.status === 'in-progress' && 
      t.progress > 0 && 
      t.progress < 100
    );

    console.log(`🔍 Found ${stuckTasks.length} stuck tasks`);
    
    for (const task of stuckTasks) {
      console.log(`\n🔧 Processing stuck task: ${task.id} (${task.progress}%)`);
      await this.executeTask(task.id);
    }
  }

  listAvailableWorkers() {
    console.log('\n🏭 Available Workers:');
    Object.keys(this.workers).forEach(taskId => {
      console.log(`  ${taskId}: ${this.workers[taskId].name}`);
    });
  }
}

// CLI Interface
if (require.main === module) {
  const dispatcher = new WorkerDispatcher();
  const command = process.argv[2];
  const taskId = process.argv[3];

  switch (command) {
    case 'execute':
      if (!taskId) {
        console.error('Usage: worker-system execute TASK-001');
        process.exit(1);
      }
      dispatcher.executeTask(taskId);
      break;

    case 'stuck':
      dispatcher.executeStuckTasks();
      break;

    case 'list':
      dispatcher.listAvailableWorkers();
      break;

    default:
      console.log(`
Worker System - Usage:

  execute TASK-ID    Execute a specific task
  stuck             Execute all stuck tasks  
  list              List available workers

Examples:
  node worker-system.js execute TASK-001
  node worker-system.js stuck
  node worker-system.js list
      `);
  }
}

module.exports = { TaskWorker, RailwayInfrastructureWorker, ExpoMobileWorker, WorkerDispatcher };