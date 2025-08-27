#!/usr/bin/env node

/**
 * Automatic Progress Tracker
 * Calculates task progress based on:
 * - Files created/modified (from implementation_notes)
 * - Git commits mentioning the task
 * - Subtask completion
 * - Test coverage
 * - Dependencies resolved
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProgressTracker {
  constructor() {
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.tasks = this.loadTasks();
  }

  loadTasks() {
    try {
      const data = fs.readFileSync(this.tasksPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading tasks:', error.message);
      return [];
    }
  }

  saveTasks() {
    try {
      fs.writeFileSync(this.tasksPath, JSON.stringify(this.tasks, null, 2));
    } catch (error) {
      console.error('Error saving tasks:', error.message);
    }
  }

  /**
   * Calculate progress based on multiple factors
   */
  calculateProgress(task) {
    if (task.status === 'completed') return 100;
    if (task.status === 'not-started') return 0;

    let progress = 0;
    let weights = {
      filesCreated: 25,
      filesModified: 20,
      commits: 20,
      dependencies: 15,
      tests: 10,
      timeElapsed: 10
    };

    // 1. Check files created/modified
    const fileProgress = this.checkFileProgress(task);
    progress += fileProgress.created * weights.filesCreated;
    progress += fileProgress.modified * weights.filesModified;

    // 2. Check git commits
    const commitProgress = this.checkCommitProgress(task);
    progress += commitProgress * weights.commits;

    // 3. Check dependencies resolved
    const depProgress = this.checkDependencyProgress(task);
    progress += depProgress * weights.dependencies;

    // 4. Check test coverage (if applicable)
    const testProgress = this.checkTestProgress(task);
    progress += testProgress * weights.tests;

    // 5. Time-based progress (for long-running tasks)
    const timeProgress = this.checkTimeProgress(task);
    progress += timeProgress * weights.timeElapsed;

    // Ensure progress is between 10 and 95 for in-progress tasks
    return Math.min(95, Math.max(10, Math.round(progress)));
  }

  /**
   * Check how many expected files have been created/modified
   */
  checkFileProgress(task) {
    const result = { created: 0, modified: 0 };
    
    // Get expected files from implementation notes
    const filesToCreate = task.implementation_notes?.files_to_create || [];
    const filesToModify = task.implementation_notes?.files_to_modify || [];

    // Check created files
    if (filesToCreate.length > 0) {
      const created = filesToCreate.filter(file => {
        try {
          const fullPath = path.join(process.cwd(), file);
          return fs.existsSync(fullPath);
        } catch {
          return false;
        }
      });
      result.created = created.length / filesToCreate.length;
    }

    // Check modified files (using git)
    if (filesToModify.length > 0) {
      try {
        const modifiedFiles = execSync('git diff --name-only', { 
          encoding: 'utf8',
          timeout: 5000
        })
          .split('\n')
          .filter(f => f);
        
        const modified = filesToModify.filter(file => 
          modifiedFiles.some(mf => mf.includes(file))
        );
        result.modified = modified.length / filesToModify.length;
      } catch {
        // Git not available or no changes
      }
    }

    // If no specific files listed, check category-based heuristics
    if (filesToCreate.length === 0 && filesToModify.length === 0) {
      result.created = this.checkCategoryFiles(task);
    }

    return result;
  }

  /**
   * Check for category-specific files
   */
  checkCategoryFiles(task) {
    const categoryPatterns = {
      'infrastructure': [
        'railway.json', 'railway.toml', 'docker-compose.yml', '.env'
      ],
      'authentication': [
        'auth/', 'middleware/auth', 'clerk', 'services/auth'
      ],
      'backend': [
        'server.ts', 'app.ts', 'routes/', 'controllers/', 'api/'
      ],
      'mobile': [
        'App.tsx', 'app.json', 'screens/', 'components/', 'navigation/'
      ],
      'integration': [
        'webhooks/', 'services/mailgun', 'services/whatsapp', 'services/2chat'
      ],
      'clara': [
        'services/clara/', 'pipelines/', 'stages/', 'processors/'
      ],
      'timer': [
        'services/timer/', 'scheduler/', 'reminders/', 'delivery/'
      ],
      'admin': [
        'admin/', 'dashboard/', 'monitoring/', 'pages/admin'
      ]
    };

    const patterns = categoryPatterns[task.category] || [];
    if (patterns.length === 0) return 0;

    // Check if any category-specific files exist
    const found = patterns.filter(pattern => {
      try {
        if (pattern.endsWith('/')) {
          // Check for directory
          return fs.existsSync(path.join(process.cwd(), pattern));
        } else {
          // Check for file or use glob
          const files = execSync(`find . -name "*${pattern}*" -type f 2>/dev/null | head -5`, 
            { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
          return files.trim().length > 0;
        }
      } catch {
        return false;
      }
    });

    return found.length / patterns.length;
  }

  /**
   * Check git commits related to the task
   */
  checkCommitProgress(task) {
    if (!task.started_at) return 0;

    try {
      // Look for commits mentioning the task ID
      const commits = execSync(
        `git log --oneline --since="${task.started_at}" | grep -i "${task.id}" | wc -l`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], timeout: 5000 }
      ).trim();

      const commitCount = parseInt(commits) || 0;
      
      // Estimate based on task complexity
      const expectedCommits = {
        'S': 2,
        'M': 4,
        'L': 6,
        'XL': 10
      };

      const expected = expectedCommits[task.estimates?.complexity] || 4;
      return Math.min(1, commitCount / expected);
    } catch {
      return 0;
    }
  }

  /**
   * Check if dependencies are resolved
   */
  checkDependencyProgress(task) {
    const blockedBy = task.dependencies?.blocked_by || [];
    if (blockedBy.length === 0) return 1;

    const resolved = blockedBy.filter(depId => {
      const depTask = this.tasks.find(t => t.id === depId);
      return depTask && depTask.status === 'completed';
    });

    return resolved.length / blockedBy.length;
  }

  /**
   * Check test coverage/completion
   */
  checkTestProgress(task) {
    // Check if tests are passing
    try {
      const testResult = execSync('npm test -- --passWithNoTests 2>/dev/null', 
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], timeout: 10000 });
      
      // If tests pass, give full credit
      if (testResult.includes('PASS') || testResult.includes('passed')) {
        return 1;
      }
    } catch {
      // Tests failing or not available
    }

    // Check if test files exist for the task category
    const testPatterns = {
      'backend': ['__tests__/', '.test.ts', '.spec.ts'],
      'mobile': ['__tests__/', '.test.tsx', '.spec.tsx'],
      'clara': ['tests/clara', 'clara.test'],
      'timer': ['tests/timer', 'timer.test']
    };

    const patterns = testPatterns[task.category] || [];
    const found = patterns.some(pattern => {
      try {
        const files = execSync(`find . -name "*${pattern}*" -type f 2>/dev/null | head -1`,
          { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        return files.trim().length > 0;
      } catch {
        return false;
      }
    });

    return found ? 0.5 : 0;
  }

  /**
   * Calculate progress based on time elapsed
   */
  checkTimeProgress(task) {
    if (!task.started_at) return 0;

    const startTime = new Date(task.started_at);
    const now = new Date();
    const elapsed = now - startTime;
    
    // Get expected hours and convert to milliseconds
    const expectedHours = parseFloat(task.estimates?.effort_hours) || 4;
    const expectedMs = expectedHours * 60 * 60 * 1000;

    // Return percentage of expected time elapsed (max 1)
    return Math.min(1, elapsed / expectedMs);
  }

  /**
   * Update all in-progress task progress
   */
  updateAllProgress() {
    let updated = 0;
    
    this.tasks.forEach(task => {
      if (task.status === 'in-progress') {
        const oldProgress = task.progress || 0;
        const newProgress = this.calculateProgress(task);
        
        if (Math.abs(newProgress - oldProgress) > 1) {
          task.progress = newProgress;
          updated++;
          
          console.log(`📊 ${task.id}: ${oldProgress}% → ${newProgress}%`);
        }
      }
    });

    if (updated > 0) {
      this.saveTasks();
      console.log(`\n✅ Updated progress for ${updated} tasks`);
    } else {
      console.log('📊 No progress changes detected');
    }

    return updated;
  }

  /**
   * Get progress report for a specific task
   */
  getProgressReport(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) {
      console.error(`Task ${taskId} not found`);
      return;
    }

    console.log(`\n📊 Progress Report for ${task.id}: ${task.title}`);
    console.log('━'.repeat(60));
    
    const factors = {
      'Files': this.checkFileProgress(task),
      'Commits': this.checkCommitProgress(task),
      'Dependencies': this.checkDependencyProgress(task),
      'Tests': this.checkTestProgress(task),
      'Time': this.checkTimeProgress(task)
    };

    Object.entries(factors).forEach(([name, value]) => {
      const percent = typeof value === 'object' 
        ? `Created: ${Math.round(value.created * 100)}%, Modified: ${Math.round(value.modified * 100)}%`
        : `${Math.round(value * 100)}%`;
      console.log(`  ${name}: ${percent}`);
    });

    const totalProgress = this.calculateProgress(task);
    console.log('━'.repeat(60));
    console.log(`  Overall Progress: ${totalProgress}%`);
  }

  /**
   * Run continuous monitoring
   */
  monitor(interval = 30000) {
    console.log('🔄 Starting automatic progress tracking...');
    console.log(`   Updating every ${interval / 1000} seconds`);
    console.log('   Press Ctrl+C to stop\n');

    // Initial update
    this.updateAllProgress();

    // Set up interval
    setInterval(() => {
      console.log(`\n[${new Date().toLocaleTimeString()}] Checking progress...`);
      this.updateAllProgress();
    }, interval);
  }
}

// CLI interface
if (require.main === module) {
  const tracker = new ProgressTracker();
  const command = process.argv[2];
  const taskId = process.argv[3];

  switch(command) {
    case 'update':
      tracker.updateAllProgress();
      break;
    
    case 'report':
      if (!taskId) {
        console.error('Usage: progress-tracker report TASK-ID');
        process.exit(1);
      }
      tracker.getProgressReport(taskId);
      break;
    
    case 'monitor':
      const interval = parseInt(process.argv[3]) || 30;
      tracker.monitor(interval * 1000);
      break;
    
    default:
      console.log('Usage:');
      console.log('  progress-tracker update              - Update all task progress');
      console.log('  progress-tracker report TASK-ID      - Get detailed progress report');
      console.log('  progress-tracker monitor [seconds]   - Monitor continuously (default: 30s)');
  }
}

module.exports = ProgressTracker;