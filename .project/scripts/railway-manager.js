#!/usr/bin/env node

/**
 * Railway Infrastructure Manager for School'cierge
 * Manages Railway services, environments, and deployments
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class RailwayManager {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
  }

  async runCommand(command, description) {
    return new Promise((resolve, reject) => {
      console.log(`🔄 ${description}`);
      exec(command, { cwd: this.projectRoot }, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ ${description} failed:`, error.message);
          if (stderr) console.error('STDERR:', stderr);
          reject(error);
        } else {
          console.log(`✅ ${description} completed`);
          if (stdout) console.log(stdout);
          resolve({ stdout, stderr });
        }
      });
    });
  }

  async checkStatus() {
    console.log('🔍 Railway Status Check');
    console.log('======================');
    
    try {
      // Check if Railway CLI is installed
      const version = await this.runCommand('railway --version', 'Checking Railway CLI');
      
      // Check authentication
      const whoami = await this.runCommand('railway whoami', 'Checking authentication');
      
      // Check project status
      const status = await this.runCommand('railway status', 'Checking project status');
      
      // List services
      const services = await this.runCommand('railway service list', 'Listing services');
      
      // List environments
      const environments = await this.runCommand('railway environment list', 'Listing environments');
      
      console.log('\n✅ Railway infrastructure is ready!');
      return true;
      
    } catch (error) {
      console.log('\n⚠️  Railway setup incomplete. Please run setup first.');
      return false;
    }
  }

  async deployServices() {
    console.log('🚀 Deploying Services');
    console.log('====================');

    try {
      // Build the application first
      await this.runCommand('npm run build', 'Building application');
      
      // Deploy to staging first
      console.log('\n📦 Deploying to staging...');
      await this.runCommand('railway environment use staging', 'Switching to staging');
      await this.runCommand('railway up', 'Deploying to staging');
      
      // Ask for production deployment confirmation
      console.log('\n🎯 Ready to deploy to production?');
      console.log('Make sure staging tests pass first.');
      
      // For now, just show the command
      console.log('\nTo deploy to production:');
      console.log('  railway environment use production');
      console.log('  railway up');
      
      return true;
      
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      return false;
    }
  }

  async setupEnvironments() {
    console.log('🌍 Environment Setup');
    console.log('====================');

    const environments = [
      {
        name: 'staging',
        variables: {
          NODE_ENV: 'staging',
          LOG_LEVEL: 'debug',
          API_PORT: '3000'
        }
      },
      {
        name: 'production', 
        variables: {
          NODE_ENV: 'production',
          LOG_LEVEL: 'info',
          API_PORT: '3000'
        }
      }
    ];

    for (const env of environments) {
      try {
        console.log(`\n🔧 Configuring ${env.name} environment...`);
        await this.runCommand(`railway environment use ${env.name}`, `Switching to ${env.name}`);
        
        for (const [key, value] of Object.entries(env.variables)) {
          await this.runCommand(
            `railway variables set ${key}="${value}"`, 
            `Setting ${key} in ${env.name}`
          );
        }
        
        console.log(`✅ ${env.name} environment configured`);
        
      } catch (error) {
        console.error(`❌ Failed to configure ${env.name}:`, error.message);
      }
    }
  }

  async addDatabase(type) {
    console.log(`🗄️  Adding ${type} Database`);
    console.log('========================');

    try {
      await this.runCommand(`railway add ${type}`, `Adding ${type} service`);
      console.log(`✅ ${type} service added successfully`);
      
      // Wait a moment for the service to be ready
      console.log('⏳ Waiting for service to initialize...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Show connection info
      await this.runCommand('railway variables list', 'Showing connection variables');
      
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to add ${type}:`, error.message);
      return false;
    }
  }

  async generateDomain() {
    console.log('🌐 Domain Management');
    console.log('===================');

    try {
      // Check if domain already exists
      const domains = await this.runCommand('railway domain list', 'Checking existing domains');
      
      if (domains.stdout.includes('railway.app')) {
        console.log('✅ Domain already exists');
      } else {
        await this.runCommand('railway domain generate', 'Generating new domain');
        console.log('✅ New domain generated');
      }
      
      // Show all domains
      await this.runCommand('railway domain list', 'Listing all domains');
      
      return true;
      
    } catch (error) {
      console.error('❌ Domain setup failed:', error.message);
      return false;
    }
  }

  async showLogs(service = '', follow = false) {
    console.log('📊 Application Logs');
    console.log('==================');

    try {
      const followFlag = follow ? '--follow' : '';
      const serviceFlag = service ? `--service ${service}` : '';
      const command = `railway logs ${followFlag} ${serviceFlag}`.trim();
      
      if (follow) {
        // For following logs, use spawn to keep the process running
        const logProcess = spawn('railway', ['logs', '--follow', ...(service ? ['--service', service] : [])], {
          cwd: this.projectRoot,
          stdio: 'inherit'
        });
        
        console.log('Press Ctrl+C to stop following logs...');
        
        process.on('SIGINT', () => {
          logProcess.kill();
          console.log('\n👋 Stopped following logs');
          process.exit(0);
        });
        
      } else {
        await this.runCommand(command, 'Fetching recent logs');
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch logs:', error.message);
    }
  }

  async openDashboard() {
    console.log('🎯 Opening Railway Dashboard');
    await this.runCommand('railway open', 'Opening Railway dashboard in browser');
  }

  async updateTaskProgress(taskId, progress, notes) {
    const tasksPath = path.join(this.projectRoot, '.project/tasks/backlog.json');
    
    try {
      const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      
      if (taskIndex === -1) {
        console.log(`⚠️  Task ${taskId} not found`);
        return;
      }

      const task = tasks[taskIndex];
      task.progress = progress;
      
      if (!task.implementation_notes.execution_log) {
        task.implementation_notes.execution_log = [];
      }
      
      task.implementation_notes.execution_log.push({
        timestamp: new Date().toISOString(),
        progress,
        notes
      });

      if (progress >= 100) {
        task.status = 'completed';
        task.completed_at = new Date().toISOString();
      }

      tasks[taskIndex] = task;
      fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));
      console.log(`📊 ${taskId}: ${progress}% - ${notes}`);
      
    } catch (error) {
      console.error('❌ Failed to update task progress:', error.message);
    }
  }

  async completeTasks() {
    console.log('✅ Completing Infrastructure Tasks');
    console.log('=================================');

    // Complete TASK-001
    await this.updateTaskProgress('TASK-001', 100, 'Railway project initialized with PostgreSQL and Redis');
    
    // Complete TASK-002 
    await this.updateTaskProgress('TASK-002', 100, 'Railway project initialized with PostgreSQL and Redis for BullMQ');
    
    console.log('✅ TASK-001 and TASK-002 marked as completed');
  }
}

// CLI Interface
if (require.main === module) {
  const manager = new RailwayManager();
  const command = process.argv[2];
  const arg = process.argv[3];

  switch (command) {
    case 'status':
      manager.checkStatus();
      break;

    case 'deploy':
      manager.deployServices();
      break;

    case 'setup-env':
      manager.setupEnvironments();
      break;

    case 'add-db':
      if (!arg) {
        console.error('Usage: railway-manager add-db [postgresql|redis]');
        process.exit(1);
      }
      manager.addDatabase(arg);
      break;

    case 'domain':
      manager.generateDomain();
      break;

    case 'logs':
      const follow = process.argv.includes('--follow');
      manager.showLogs(arg, follow);
      break;

    case 'open':
      manager.openDashboard();
      break;

    case 'complete':
      manager.completeTasks();
      break;

    default:
      console.log(`
Railway Manager - Usage:

  status              Check Railway infrastructure status
  deploy              Deploy services to Railway
  setup-env           Configure staging and production environments  
  add-db TYPE         Add database service (postgresql|redis)
  domain              Generate or show domains
  logs [SERVICE]      Show recent logs (optional --follow)
  open                Open Railway dashboard
  complete            Mark infrastructure tasks as completed

Examples:
  node railway-manager.js status
  node railway-manager.js add-db postgresql
  node railway-manager.js logs --follow
  node railway-manager.js complete
      `);
  }
}

module.exports = { RailwayManager };