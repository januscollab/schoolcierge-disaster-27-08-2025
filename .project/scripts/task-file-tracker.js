#!/usr/bin/env node

/**
 * Task File Tracker
 * Records what files are created/modified for each task
 * This allows us to know EXACTLY what to test for each task
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

class TaskFileTracker {
  constructor() {
    this.trackingFile = path.join(__dirname, '../tasks/task-files.json');
    this.loadTracking();
  }

  loadTracking() {
    if (fs.existsSync(this.trackingFile)) {
      this.tracking = JSON.parse(fs.readFileSync(this.trackingFile, 'utf-8'));
    } else {
      this.tracking = {};
    }
  }

  saveTracking() {
    fs.writeFileSync(this.trackingFile, JSON.stringify(this.tracking, null, 2));
  }

  // Record files for a task
  recordTask(taskId, files) {
    if (!this.tracking[taskId]) {
      this.tracking[taskId] = {
        createdAt: new Date().toISOString(),
        files: [],
        tests: [],
        coverage: []
      };
    }
    
    this.tracking[taskId].files = [...new Set([...this.tracking[taskId].files, ...files])];
    this.tracking[taskId].updatedAt = new Date().toISOString();
    
    this.saveTracking();
  }

  // Get files for a task
  getTaskFiles(taskId) {
    return this.tracking[taskId] || null;
  }

  // Scan git to find what was built for a task
  scanGitForTask(taskId) {
    console.log(chalk.yellow(`Scanning git history for ${taskId}...`));
    
    try {
      // Look for commits mentioning this task
      const commits = execSync(
        `git log --oneline --grep="${taskId}" --pretty=format:"%H"`,
        { encoding: 'utf-8' }
      ).trim().split('\n').filter(c => c);
      
      if (commits.length === 0) {
        console.log(chalk.red(`No commits found for ${taskId}`));
        return [];
      }
      
      console.log(chalk.green(`Found ${commits.length} commits for ${taskId}`));
      
      // Get files changed in these commits
      const files = new Set();
      for (const commit of commits) {
        try {
          const changedFiles = execSync(
            `git diff-tree --no-commit-id --name-only -r ${commit}`,
            { encoding: 'utf-8' }
          ).trim().split('\n').filter(f => f && !f.includes('node_modules'));
          
          changedFiles.forEach(f => files.add(f));
        } catch {}
      }
      
      const fileList = Array.from(files);
      console.log(chalk.green(`Found ${fileList.length} files modified for ${taskId}`));
      
      // Save to tracking
      this.recordTask(taskId, fileList);
      
      return fileList;
    } catch (error) {
      console.log(chalk.red(`Git scan failed: ${error.message}`));
      return [];
    }
  }

  // Analyze what was built for a task
  analyzeTask(taskId) {
    console.log(chalk.cyan(`\n📊 Analyzing ${taskId}`));
    console.log('━'.repeat(60));
    
    let taskData = this.getTaskFiles(taskId);
    
    // If no data, try scanning git
    if (!taskData || taskData.files.length === 0) {
      const files = this.scanGitForTask(taskId);
      taskData = this.getTaskFiles(taskId);
    }
    
    if (!taskData || taskData.files.length === 0) {
      console.log(chalk.red('No files found for this task'));
      return null;
    }
    
    // Categorize files
    const analysis = {
      taskId,
      sourceFiles: [],
      testFiles: [],
      configFiles: [],
      documentationFiles: [],
      coverage: []
    };
    
    for (const file of taskData.files) {
      if (file.includes('.test.') || file.includes('.spec.') || file.includes('__tests__')) {
        analysis.testFiles.push(file);
      } else if (file.endsWith('.md') || file.endsWith('.txt')) {
        analysis.documentationFiles.push(file);
      } else if (file.includes('config') || file.endsWith('.json') || file.endsWith('.yml')) {
        analysis.configFiles.push(file);
      } else if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.tsx')) {
        analysis.sourceFiles.push(file);
        // These are the files that need test coverage!
        analysis.coverage.push(file);
      }
    }
    
    // Display analysis
    console.log(chalk.green('\n📁 Files Built for Task:'));
    console.log(`  Source Files: ${analysis.sourceFiles.length}`);
    analysis.sourceFiles.forEach(f => console.log(`    ✓ ${f}`));
    
    if (analysis.testFiles.length > 0) {
      console.log(`\n  Test Files: ${analysis.testFiles.length}`);
      analysis.testFiles.forEach(f => console.log(`    🧪 ${f}`));
    }
    
    if (analysis.configFiles.length > 0) {
      console.log(`\n  Config Files: ${analysis.configFiles.length}`);
      analysis.configFiles.forEach(f => console.log(`    ⚙️  ${f}`));
    }
    
    // Save coverage targets
    taskData.coverage = analysis.coverage;
    this.tracking[taskId] = taskData;
    this.saveTracking();
    
    return analysis;
  }

  // Generate test configuration for a task
  generateTestConfig(taskId) {
    const analysis = this.analyzeTask(taskId);
    
    if (!analysis || analysis.coverage.length === 0) {
      console.log(chalk.red('\nNo source files to test'));
      return null;
    }
    
    console.log(chalk.cyan('\n🎯 Coverage Targets:'));
    analysis.coverage.forEach(f => console.log(`  📊 ${f}`));
    
    // Generate Jest config for this task
    const config = {
      testMatch: analysis.testFiles.length > 0 ? analysis.testFiles : [`**/*${taskId.toLowerCase()}*.test.[jt]s`],
      collectCoverageFrom: analysis.coverage,
      coverageThreshold: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60
        }
      }
    };
    
    console.log(chalk.green('\n✅ Test Configuration Generated:'));
    console.log(JSON.stringify(config, null, 2));
    
    return config;
  }
}

// CLI Usage
if (require.main === module) {
  const [command, taskId] = process.argv.slice(2);
  
  if (!command || !taskId) {
    console.log(chalk.yellow('Usage:'));
    console.log('  node task-file-tracker.js analyze TASK-XXX');
    console.log('  node task-file-tracker.js scan TASK-XXX');
    console.log('  node task-file-tracker.js config TASK-XXX');
    process.exit(1);
  }
  
  const tracker = new TaskFileTracker();
  
  switch(command) {
    case 'analyze':
      tracker.analyzeTask(taskId);
      break;
    case 'scan':
      tracker.scanGitForTask(taskId);
      break;
    case 'config':
      tracker.generateTestConfig(taskId);
      break;
    default:
      console.log(chalk.red(`Unknown command: ${command}`));
  }
}

module.exports = TaskFileTracker;