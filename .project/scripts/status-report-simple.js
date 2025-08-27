#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const TaskState = require('./task-state-manager');

function formatDate(dateString) {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Use TaskStateManager for centralized task access
async function loadTasks() {
  const taskState = new TaskState();
  return await taskState.getTasks();
}

// Legacy sync function for backward compatibility
function loadTasksSync() {
  const backlogPath = path.join(__dirname, '../tasks/backlog.json');
  if (!fs.existsSync(backlogPath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(backlogPath, 'utf8'));
}

function getTestResults() {
  // Try to find recent test results
  const coverageFile = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
  if (fs.existsSync(coverageFile)) {
    const stat = fs.statSync(coverageFile);
    return {
      lastRun: formatDate(stat.mtime),
      coverage: 'Available'
    };
  }
  return {
    lastRun: 'Never',
    coverage: 'None'
  };
}

function showSingleTaskStatus(taskId) {
  const tasks = loadTasksSync(); // Use sync version for backward compatibility
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) {
    console.log(`\n❌ Task ${taskId} not found`);
    return;
  }
  
  const status = task.status === 'completed' ? '✅' : 
                 task.status === 'in-progress' ? '🔄' : 
                 task.status === 'blocked' ? '🚫' : '⭕';
  
  console.log(`\n${status} ${task.id}: ${task.title}`);
  console.log('━'.repeat(60));
  console.log(`📊 Status: ${task.status.toUpperCase()}`);
  console.log(`🎯 Priority: ${task.priority}`);
  console.log(`📁 Category: ${task.category}`);
  
  console.log('\n📅 TIMELINE:');
  console.log(`   Created: ${formatDate(task.created_at)}`);
  
  if (task.started_at) {
    console.log(`   Started: ${formatDate(task.started_at)}`);
  }
  
  if (task.completed_at) {
    console.log(`   Completed: ${formatDate(task.completed_at)}`);
  } else if (task.updated_at && task.updated_at !== task.created_at) {
    console.log(`   Last Updated: ${formatDate(task.updated_at)}`);
  }
  
  if (task.progress > 0) {
    console.log(`\n📈 Progress: ${task.progress}%`);
  }
  
  if (task.integrity_check?.checked_at) {
    console.log('\n🧪 TEST INFO:');
    console.log(`   Last Tested: ${formatDate(task.integrity_check.checked_at)}`);
    console.log(`   Test Status: ${task.integrity_check.status}`);
    if (task.integrity_check.reason) {
      console.log(`   Details: ${task.integrity_check.reason}`);
    }
  }
  
  if (task.product_requirements?.description) {
    console.log('\n📋 DESCRIPTION:');
    console.log(`   ${task.product_requirements.description}`);
  }
  
  if (task.estimates?.effort_hours) {
    console.log('\n⏱️  ESTIMATES:');
    console.log(`   Effort: ${task.estimates.effort_hours} hours`);
    console.log(`   Complexity: ${task.estimates.complexity}`);
    console.log(`   Risk: ${task.estimates.risk_level}`);
  }
  
  console.log('\n' + '━'.repeat(60));
  console.log('💡 Run "cx detail TASK-XXX" for full technical details\n');
}

function main() {
  const args = process.argv.slice(2);
  
  // Strip quotes from arguments (cx script adds them)
  const cleanArgs = args.map(arg => arg.replace(/^['"](.*)['"]$/, '$1'));
  const includeCompleted = cleanArgs.includes('include-completed');
  
  // Check if a specific task ID is provided
  const taskIdArg = cleanArgs.find(arg => arg.startsWith('TASK-'));
  if (taskIdArg) {
    return showSingleTaskStatus(taskIdArg);
  }
  
  console.log('\n🚀 SchoolCierge Status Report');
  if (includeCompleted) {
    console.log('   (including completed tasks)');
  }
  console.log('━'.repeat(60));
  
  const tasks = loadTasksSync(); // Use sync version for backward compatibility
  const testResults = getTestResults();
  
  // Summary stats
  const stats = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    acc.total++;
    return acc;
  }, { total: 0 });
  
  console.log('\n📊 OVERALL SUMMARY');
  console.log(`   Total Tasks: ${stats.total}`);
  console.log(`   Completed: ${stats.completed || 0}`);
  console.log(`   In Progress: ${stats['in-progress'] || 0}`);
  console.log(`   Not Started: ${stats['not-started'] || 0}`);
  console.log(`   Blocked: ${stats.blocked || 0}`);
  
  const completionRate = stats.total > 0 ? Math.round(((stats.completed || 0) / stats.total) * 100) : 0;
  console.log(`   Completion Rate: ${completionRate}%`);
  
  console.log(`\n🧪 TEST STATUS`);
  console.log(`   Last Test Run: ${testResults.lastRun}`);
  console.log(`   Coverage: ${testResults.coverage}`);
  
  // Key tasks with dates - filter based on includeCompleted
  console.log('\n📋 KEY TASKS WITH DATES');
  console.log('━'.repeat(60));
  
  let keyTasks;
  if (includeCompleted) {
    keyTasks = tasks.filter(t => 
      t.priority === 'P0' || 
      t.status === 'in-progress' || 
      t.status === 'completed'
    );
  } else {
    keyTasks = tasks.filter(t => 
      (t.priority === 'P0' || t.status === 'in-progress') && 
      t.status !== 'completed'
    );
  }
  
  keyTasks = keyTasks.slice(0, 10);
  
  keyTasks.forEach(task => {
    const status = task.status === 'completed' ? '✅' : 
                   task.status === 'in-progress' ? '🔄' : 
                   task.status === 'blocked' ? '🚫' : '⭕';
    
    console.log(`\n${status} ${task.id}: ${task.title}`);
    console.log(`   Status: ${task.status} (${task.priority})`);
    console.log(`   Created: ${formatDate(task.created_at)}`);
    
    if (task.started_at) {
      console.log(`   Started: ${formatDate(task.started_at)}`);
    }
    
    if (task.completed_at) {
      console.log(`   Completed: ${formatDate(task.completed_at)}`);
    } else if (task.updated_at && task.updated_at !== task.created_at) {
      console.log(`   Last Updated: ${formatDate(task.updated_at)}`);
    }
    
    if (task.progress > 0) {
      console.log(`   Progress: ${task.progress}%`);
    }
    
    // Show test execution info if available
    if (task.integrity_check?.checked_at) {
      console.log(`   Last Tested: ${formatDate(task.integrity_check.checked_at)}`);
      console.log(`   Test Status: ${task.integrity_check.status}`);
    }
  });
  
  console.log('\n' + '━'.repeat(60));
  console.log('💡 Run "cx list" for full task list');
  console.log('💡 Run "cx test TASK-XXX" to test specific tasks');
  console.log('💡 Run "cx dashboard" for interactive view\n');
}

if (require.main === module) {
  main();
}

module.exports = { main, loadTasks, formatDate };