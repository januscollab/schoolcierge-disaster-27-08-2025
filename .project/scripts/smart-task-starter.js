#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const ora = require('ora');
const chalk = require('chalk');
const boxen = require('boxen');
const gradient = require('gradient-string');
const TaskIntelligence = require('./intelligence/TaskIntelligence');
const AgentRouter = require('./intelligence/AgentRouter');
const WorkflowOrchestrator = require('./intelligence/WorkflowOrchestrator');
const { logEvent } = require('./event-ticker');

// Branding
const creaiteGradient = gradient(['#00C9A7', '#00B4D8', '#0077B6']);
const aiGradient = gradient(['#FFD60A', '#FFC300', '#FFB700']);
const successGradient = gradient(['#06FFA5', '#00C9A7']);
const dangerGradient = gradient(['#FF006E', '#C1121F']);

class SmartTaskStarter {
  constructor() {
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    let taskId = process.argv[2];
    // Remove quotes if present (npm can pass arguments with quotes)
    if (taskId) {
      taskId = taskId.replace(/^['"]|['"]$/g, '');
    }
    this.taskId = taskId;
    this.taskIntelligence = new TaskIntelligence();
    this.agentRouter = new AgentRouter();
    this.workflowOrchestrator = new WorkflowOrchestrator();
    this.manualMode = process.argv.includes('--manual');
    this.overrideAgent = process.argv.find(arg => arg.startsWith('--override-agent='))?.split('=')[1];
  }

  loadTasks() {
    return JSON.parse(fs.readFileSync(this.tasksPath, 'utf8'));
  }

  saveTasks(tasks) {
    fs.writeFileSync(this.tasksPath, JSON.stringify(tasks, null, 2));
  }

  async prompt(question) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  displayHeader() {
    console.clear();
    console.log();
    console.log(creaiteGradient('╔' + '═'.repeat(58) + '╗'));
    console.log(creaiteGradient('║') + chalk.bold.white('         🤖 INTELLIGENT TASK BUILDER         ') + creaiteGradient('║'));
    console.log(creaiteGradient('║') + chalk.gray('      AI-powered agent routing & workflow       ') + creaiteGradient('║'));
    console.log(creaiteGradient('╚' + '═'.repeat(58) + '╝'));
    console.log();
  }

  async analyzeTask(task) {
    logEvent('intelligent_analysis_start', `Starting intelligent analysis for ${task.id}`, { taskId: task.id });
    
    // Basic task state analysis
    const stateAnalysis = {
      isNew: task.status === 'not-started' && task.progress === 0,
      isInProgress: task.status === 'in-progress',
      isNearComplete: task.progress >= 80,
      hasWork: task.progress > 0,
      filesCreated: task.implementation_notes?.files_created?.length || 0,
      hasNotes: !!task.implementation_notes?.notes
    };

    // Get AI-powered intelligent analysis
    let intelligentAnalysis = null;
    if (!this.manualMode) {
      try {
        intelligentAnalysis = this.taskIntelligence.analyzeTask(task.id);
        logEvent('intelligent_analysis_complete', `Intelligent analysis complete for ${task.id}`, {
          domain: intelligentAnalysis.domain.primary,
          complexity: intelligentAnalysis.complexity,
          confidence: intelligentAnalysis.routing?.confidence || 0
        });
      } catch (error) {
        logEvent('intelligent_analysis_failed', `Intelligence analysis failed: ${error.message}`, { taskId: task.id });
        console.log(chalk.yellow('⚠️  AI analysis unavailable, falling back to manual mode'));
        this.manualMode = true;
      }
    }

    // Determine action based on analysis
    let action, message;
    
    // Check for actual implementation
    const hasImplementation = this.checkImplementation(task);
    
    if (stateAnalysis.isNew || !hasImplementation) {
      action = 'START';
      message = intelligentAnalysis ? 
        `🤖 AI will route to ${intelligentAnalysis.domain.primary} specialists` :
        '🚀 Building new task from scratch';
    } else if (stateAnalysis.isInProgress && stateAnalysis.isNearComplete) {
      action = 'COMPLETE';
      message = '✅ Task is near complete. Ready to finish?';
    } else if (stateAnalysis.isInProgress) {
      action = 'RESUME';
      message = intelligentAnalysis ?
        `🔄 Resuming with ${intelligentAnalysis.domain.primary} workflow` :
        '🔨 Continuing build in progress';
    } else if (task.status === 'completed') {
      action = 'ALREADY_DONE';
      message = '✨ Task is already completed';
    } else {
      action = 'RESUME';
      message = '📝 Continuing to build task';
    }

    return {
      ...stateAnalysis,
      action,
      message,
      intelligence: intelligentAnalysis
    };
  }

  displayTaskInfo(task, analysis) {
    console.log(boxen(
      chalk.bold.cyan(`Task: ${task.id}`) + '\n' +
      chalk.white(task.title) + '\n\n' +
      chalk.gray('Status: ') + chalk.yellow(task.status) + '\n' +
      chalk.gray('Progress: ') + this.generateProgressBar(task.progress) + '\n' +
      chalk.gray('Priority: ') + this.getPriorityColor(task.priority)(task.priority),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        align: 'left'
      }
    ));

    // Display AI intelligence insights
    if (analysis.intelligence && !this.manualMode) {
      const intel = analysis.intelligence;
      console.log('\n' + creaiteGradient('🤖 AI ANALYSIS'));
      console.log(chalk.gray(`Domain: `) + chalk.cyan.bold(intel.domain.primary) + 
                  (intel.domain.secondary ? chalk.gray(` (${intel.domain.secondary})`) : ''));
      console.log(chalk.gray(`Complexity: `) + this.getComplexityColor(intel.complexity)(intel.complexity));
      // Confidence will be shown in EXECUTION PLAN after proper routing calculation
      
      if (intel.dependencies.criticalPath) {
        console.log(chalk.red.bold('🚨 Critical Path Task'));
      }
      
      if (intel.dependencies.dependencyCount.upstream > 0) {
        console.log(chalk.yellow(`⚠️  ${intel.dependencies.dependencyCount.upstream} blocking dependencies`));
      }
    }

    if (analysis.filesCreated > 0) {
      console.log(chalk.green(`\n📁 Files already created: ${analysis.filesCreated}`));
      task.implementation_notes.files_created.forEach(file => {
        console.log(chalk.gray(`   • ${file}`));
      });
    }

    if (analysis.hasNotes) {
      console.log(chalk.blue('\n📝 Previous notes:'));
      console.log(chalk.gray(`   ${task.implementation_notes.notes}`));
    }
  }

  generateProgressBar(progress) {
    const width = 20;
    const filled = Math.round(width * progress / 100);
    const empty = width - filled;
    
    let bar = '';
    for (let i = 0; i < filled; i++) {
      bar += chalk.green('█');
    }
    for (let i = 0; i < empty; i++) {
      bar += chalk.gray('░');
    }
    
    return bar + ' ' + chalk.bold(`${progress}%`);
  }

  getPriorityColor(priority) {
    return {
      'P0': chalk.red.bold,
      'P1': chalk.yellow.bold,
      'P2': chalk.blue.bold,
      'P3': chalk.gray
    }[priority] || chalk.white;
  }

  getComplexityColor(complexity) {
    return {
      'simple': chalk.green,
      'medium': chalk.yellow,
      'complex': chalk.magenta,
      'epic': chalk.red.bold
    }[complexity] || chalk.white;
  }

  getConfidenceColor(confidence) {
    if (confidence >= 0.8) return chalk.green.bold;
    if (confidence >= 0.6) return chalk.yellow;
    return chalk.red;
  }

  async startTask(task, analysis) {
    if (!this.manualMode && analysis.intelligence) {
      await this.startIntelligentWorkflow(task, analysis.intelligence);
    } else {
      await this.startManualBuild(task);
    }
  }

  async startIntelligentWorkflow(task, intelligence) {
    console.log('\n' + aiGradient('🚀 INITIATING INTELLIGENT WORKFLOW'));
    console.log(creaiteGradient('━'.repeat(60)));
    
    try {
      // Get agent routing
      const routing = await this.agentRouter.routeTask(intelligence);
      
      // Apply user override if specified
      if (this.overrideAgent) {
        console.log(chalk.yellow(`👤 User override: Routing to ${this.overrideAgent}`));
        routing.primaryAgent.id = this.overrideAgent;
        routing.userOverride = true;
      }
      
      this.displayRoutingPlan(routing);
      
      // Confirm execution unless in auto mode
      if (!process.argv.includes('--auto')) {
        const proceed = await this.prompt(chalk.cyan('Proceed with intelligent workflow? (y/n): '));
        if (proceed.toLowerCase() !== 'y') {
          console.log(chalk.yellow('Switching to manual mode...'));
          await this.startManualBuild(task);
          return;
        }
      }
      
      // Update task status
      task.status = 'in-progress';
      task.started_at = new Date().toISOString();
      task.progress = 5;
      this.saveTask(task);
      
      // Execute workflow
      const workflow = await this.workflowOrchestrator.executeWorkflow(task.id, routing);
      
      // Update task based on workflow results
      this.updateTaskFromWorkflow(task, workflow);
      
      console.log('\n' + successGradient('✨ INTELLIGENT WORKFLOW COMPLETED'));
      this.displayWorkflowSummary(workflow);
      
    } catch (error) {
      console.log('\n' + dangerGradient('🚨 WORKFLOW FAILED'));
      console.log(chalk.red(`Error: ${error.message}`));
      
      // Offer fallback options
      const fallback = await this.prompt(
        chalk.cyan('Try manual mode instead? (y/n): ')
      );
      if (fallback.toLowerCase() === 'y') {
        await this.startManualBuild(task);
      }
    }
  }

  async startManualBuild(task) {
    const spinner = ora('Starting manual build...').start();
    
    task.status = 'in-progress';
    task.started_at = new Date().toISOString();
    task.progress = 10;
    
    this.saveTask(task);
    
    spinner.succeed(chalk.green('Manual build started successfully!'));
    
    console.log('\n' + chalk.bold('Next steps:'));
    console.log(chalk.cyan('  1. ') + 'Implement the required features');
    console.log(chalk.cyan('  2. ') + 'Run tests as you go');
    console.log(chalk.cyan('  3. ') + `Use ${chalk.bold('cx build ' + task.id)} again to update progress or complete`);
  }

  displayRoutingPlan(routing) {
    console.log('\n' + chalk.bold('🎯 EXECUTION PLAN'));
    console.log(chalk.gray('Primary Agent: ') + chalk.cyan.bold(routing.primaryAgent.name));
    console.log(chalk.gray('Supporting: ') + routing.supportingAgents.map(a => a.name).join(', '));
    console.log(chalk.gray('MCP Servers: ') + routing.mcpServers.map(m => m.id).join(', '));
    console.log(chalk.gray('Phases: ') + routing.workflow.length);
    console.log(chalk.gray('Estimated: ') + routing.workflow.reduce((acc, p) => acc + this.parseDuration(p.estimatedDuration || '30min'), 0) + ' minutes');
    
    if (routing.confidence) {
      console.log(chalk.gray('Confidence: ') + this.getConfidenceColor(routing.confidence)(`${Math.round(routing.confidence * 100)}%`));
    }
  }

  displayWorkflowSummary(workflow) {
    console.log('\n' + chalk.bold('📊 WORKFLOW SUMMARY'));
    console.log(chalk.gray('Duration: ') + chalk.white(`${Math.round(workflow.actualDuration / 1000 / 60)} minutes`));
    console.log(chalk.gray('Phases: ') + chalk.white(`${Object.keys(workflow.results).length}/${workflow.phases.length} completed`));
    console.log(chalk.gray('Agent Interactions: ') + chalk.white(workflow.agentConversations.length));
    
    // Show phase results
    Object.entries(workflow.results).forEach(([phase, result]) => {
      const status = result.status === 'completed' ? '✅' : 
                    result.status === 'completed-with-fallback' ? '⚠️' : '❌';
      console.log(chalk.gray(`  ${phase}: `) + status);
    });
  }

  updateTaskFromWorkflow(task, workflow) {
    // Calculate progress based on completed phases
    const completedPhases = Object.values(workflow.results).filter(r => 
      r.status === 'completed' || r.status === 'completed-with-fallback'
    ).length;
    const progress = Math.round((completedPhases / workflow.phases.length) * 90) + 10; // 10-100%
    
    task.progress = Math.min(100, progress);
    task.updated_at = new Date().toISOString();
    
    // Add workflow metadata
    if (!task.implementation_notes) task.implementation_notes = {};
    task.implementation_notes.workflow_id = workflow.id;
    task.implementation_notes.agent_interactions = workflow.agentConversations.length;
    task.implementation_notes.phases_completed = completedPhases;
    
    if (workflow.status === 'completed') {
      task.status = 'completed';
      task.completed_at = new Date().toISOString();
      task.progress = 100;
    }
    
    this.saveTask(task);
  }

  saveTask(task) {
    const tasks = this.loadTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    tasks[index] = task;
    this.saveTasks(tasks);
  }

  checkImplementation(task) {
    // Check if task has actual implementation based on task ID
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    try {
      // Check for task-specific implementation patterns
      if (task.id === 'TASK-011') {
        // Check for CLARA Stage 1 implementation
        const fs = require('fs');
        return fs.existsSync(path.join(__dirname, '../../src/clara')) || 
               fs.existsSync(path.join(__dirname, '../../src/api/routes/email-ingestion.ts'));
      }
      if (task.id === 'TASK-018') {
        // Check for BullMQ implementation
        const fs = require('fs');
        return fs.existsSync(path.join(__dirname, '../../src/queues')) ||
               fs.existsSync(path.join(__dirname, '../../src/lib/bullmq.ts'));
      }
      
      // Generic check: look for files created or modified for this task
      return (task.implementation_notes?.files_created?.length > 0) ||
             (task.implementation_notes?.files_to_modify?.length > 0) ||
             (task.progress > 50);
    } catch (error) {
      // If we can't determine, assume no implementation
      return false;
    }
  }

  parseDuration(durationString) {
    const minutes = durationString.match(/(\d+)min/)?.[1] || 0;
    const hours = durationString.match(/(\d+)hr/)?.[1] || 0;
    const days = durationString.match(/(\d+)day/)?.[1] || 0;
    
    return (parseInt(days) * 24 * 60) + (parseInt(hours) * 60) + parseInt(minutes);
  }

  async resumeTask(task) {
    // Check if task has actual implementation
    const hasImplementation = this.checkImplementation(task);
    
    if (!hasImplementation) {
      // Task marked in-progress but no real work done - start building
      console.log(chalk.yellow('\n⚠️  No implementation found, starting build...'));
      try {
        const intelligence = this.taskIntelligence.analyzeTask(task.id);
        await this.startIntelligentWorkflow(task, intelligence);
      } catch (error) {
        console.log(chalk.yellow('⚠️  Starting manual build...'));
        await this.startManualBuild(task);
      }
      return;
    }
    
    const spinner = ora('Analyzing progress...').start();
    
    // Auto-increment progress based on time spent
    const hoursSpent = task.started_at ? 
      (Date.now() - new Date(task.started_at).getTime()) / (1000 * 60 * 60) : 0;
    
    const suggestedProgress = Math.min(
      100,
      task.progress + Math.round(hoursSpent * 5) // 5% per hour worked
    );
    
    spinner.stop();
    
    console.log('\n' + chalk.bold('Progress Update:'));
    console.log(chalk.gray(`Current progress: ${task.progress}%`));
    console.log(chalk.gray(`Suggested progress: ${suggestedProgress}%`));
    
    const newProgress = await this.prompt(
      chalk.cyan(`Enter new progress (${task.progress}-100) or press Enter for ${suggestedProgress}: `)
    );
    
    const progress = parseInt(newProgress) || suggestedProgress;
    
    if (progress >= 100) {
      await this.completeTask(task);
    } else {
      task.progress = progress;
      task.updated_at = new Date().toISOString();
      
      const tasks = this.loadTasks();
      const index = tasks.findIndex(t => t.id === task.id);
      tasks[index] = task;
      this.saveTasks(tasks);
      
      console.log(successGradient('\n✅ Progress updated!'));
      console.log(chalk.gray(`Task is now ${progress}% complete`));
      
      if (progress >= 80) {
        console.log(chalk.yellow('\n📢 Task is nearly complete! Run again to finish it.'));
      }
    }
  }

  async completeTask(task) {
    console.log('\n' + chalk.bold.green('🎉 Completing task...'));
    
    // Ask for completion notes
    const notes = await this.prompt(
      chalk.cyan('Add completion notes (optional): ')
    );
    
    task.status = 'completed';
    task.progress = 100;
    task.completed_at = new Date().toISOString();
    
    if (notes) {
      if (!task.implementation_notes) task.implementation_notes = {};
      task.implementation_notes.completion_notes = notes;
    }
    
    const tasks = this.loadTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    tasks[index] = task;
    this.saveTasks(tasks);
    
    // Calculate time taken
    const timeSpent = task.started_at ? 
      ((Date.now() - new Date(task.started_at).getTime()) / (1000 * 60 * 60)).toFixed(1) : 0;
    
    console.log('\n' + successGradient('━'.repeat(60)));
    console.log(successGradient('✨ Task Completed Successfully!'));
    console.log(successGradient('━'.repeat(60)));
    
    console.log('\n' + chalk.bold('Summary:'));
    console.log(chalk.gray(`  Time spent: ${timeSpent} hours`));
    console.log(chalk.gray(`  Files created: ${task.implementation_notes?.files_created?.length || 0}`));
    
    // Suggest next task
    const nextTask = this.suggestNextTask(tasks);
    if (nextTask) {
      console.log('\n' + chalk.bold('💡 Suggested next task:'));
      console.log(chalk.cyan(`  cx build ${nextTask.id}`) + chalk.gray(` - ${nextTask.title}`));
    }
  }

  suggestNextTask(tasks) {
    // Find next priority task
    const candidates = tasks.filter(t => 
      t.status === 'not-started' || 
      (t.status === 'in-progress' && t.id !== this.taskId)
    );
    
    // Sort by priority and progress
    candidates.sort((a, b) => {
      // Priority order: P0 > P1 > P2 > P3
      const priOrder = {'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3};
      const priDiff = (priOrder[a.priority] || 4) - (priOrder[b.priority] || 4);
      if (priDiff !== 0) return priDiff;
      
      // Then by progress (prefer started tasks)
      return (b.progress || 0) - (a.progress || 0);
    });
    
    return candidates[0];
  }

  async run() {
    this.displayHeader();
    
    if (!this.taskId) {
      console.log(chalk.red('❌ Error: Task ID required'));
      console.log('\nUsage: ' + chalk.cyan('cx build TASK-001'));
      console.log('\nOptions:');
      console.log(chalk.gray('  --manual          ') + 'Skip AI analysis, use manual mode');
      console.log(chalk.gray('  --override-agent= ') + 'Override AI agent selection');
      console.log(chalk.gray('  --auto            ') + 'Skip confirmation prompts');
      console.log('\nThis intelligent command will:');
      console.log(chalk.gray('  🤖 Analyze task domain and complexity'));
      console.log(chalk.gray('  🎯 Route to optimal AI agents'));
      console.log(chalk.gray('  🔄 Execute multi-phase workflows'));
      console.log(chalk.gray('  ⚡ Handle failures with smart fallbacks'));
      console.log(chalk.gray('  📊 Provide detailed execution insights'));
      process.exit(1);
    }
    
    const tasks = this.loadTasks();
    const task = tasks.find(t => t.id.toUpperCase() === (this.taskId || '').toUpperCase());
    
    if (!task) {
      console.log(chalk.red(`❌ Task ${this.taskId} not found`));
      process.exit(1);
    }
    
    // Analyze task state
    const analysis = await this.analyzeTask(task);
    
    // Display task information
    this.displayTaskInfo(task, analysis);
    
    console.log('\n' + aiGradient(analysis.message));
    console.log();
    
    // Take action based on analysis
    switch (analysis.action) {
      case 'START':
        await this.startTask(task, analysis);
        break;
        
      case 'RESUME':
        await this.resumeTask(task);
        break;
        
      case 'COMPLETE':
        const shouldComplete = await this.prompt(
          chalk.cyan('Complete this task? (y/n): ')
        );
        if (shouldComplete.toLowerCase() === 'y') {
          await this.completeTask(task);
        } else {
          await this.resumeTask(task);
        }
        break;
        
      case 'ALREADY_DONE':
        console.log(chalk.green('This task is already completed!'));
        const nextTask = this.suggestNextTask(tasks);
        if (nextTask) {
          console.log('\n' + chalk.bold('💡 Try this next:'));
          console.log(chalk.cyan(`  cx build ${nextTask.id}`) + chalk.gray(` - ${nextTask.title}`));
        }
        break;
    }
    
    console.log('\n' + creaiteGradient('━'.repeat(60)));
  }
}

// Run the smart starter
const starter = new SmartTaskStarter();
starter.run().catch(err => {
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
});