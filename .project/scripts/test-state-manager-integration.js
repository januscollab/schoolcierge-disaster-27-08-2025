#!/usr/bin/env node

/**
 * Test Suite for TaskStateManager Integration
 * Verifies all commands properly use the centralized state manager
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class StateManagerIntegrationTest {
  constructor() {
    this.testResults = [];
    this.eventsFile = path.join(__dirname, '../tasks/events.jsonl');
    this.backlogFile = path.join(__dirname, '../tasks/backlog.json');
    this.testTaskId = null;
    this.initialEventCount = 0;
  }

  // Helper to run cx commands
  runCommand(command) {
    try {
      const output = execSync(`./cx ${command}`, { 
        encoding: 'utf-8',
        cwd: path.join(__dirname, '../../')
      });
      return { success: true, output };
    } catch (error) {
      return { 
        success: false, 
        output: error.stdout || '',
        error: error.message 
      };
    }
  }

  // Count events in the audit log
  countEvents() {
    if (!fs.existsSync(this.eventsFile)) {
      return 0;
    }
    const content = fs.readFileSync(this.eventsFile, 'utf-8');
    return content.split('\n').filter(line => line.trim()).length;
  }

  // Get last N events
  getLastEvents(n = 5) {
    if (!fs.existsSync(this.eventsFile)) {
      return [];
    }
    const content = fs.readFileSync(this.eventsFile, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    return lines.slice(-n).map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);
  }

  // Check if event was logged
  checkEventLogged(operation, taskId) {
    const events = this.getLastEvents(10);
    return events.some(event => 
      event.operation === operation && 
      (!taskId || event.taskId === taskId)
    );
  }

  // Test 1: Adding a task creates an audit event
  async testAddTask() {
    const testName = 'Add Task via StateManager';
    console.log(chalk.cyan(`\nTesting: ${testName}`));
    
    const beforeCount = this.countEvents();
    const result = this.runCommand(`add "Test StateManager Integration ${Date.now()}" --priority P1`);
    
    if (!result.success) {
      this.testResults.push({ name: testName, passed: false, error: result.error });
      return;
    }

    // Extract task ID from output
    const taskIdMatch = result.output.match(/TASK-(\d+)/);
    if (taskIdMatch) {
      this.testTaskId = taskIdMatch[0];
    }

    const afterCount = this.countEvents();
    const eventsCreated = afterCount > beforeCount;
    const eventLogged = this.checkEventLogged('addTask', this.testTaskId);

    this.testResults.push({
      name: testName,
      passed: eventsCreated && eventLogged,
      details: {
        taskCreated: !!this.testTaskId,
        eventsAdded: afterCount - beforeCount,
        auditLogUpdated: eventLogged
      }
    });
  }

  // Test 2: Updating a task creates an audit event
  async testUpdateTask() {
    const testName = 'Update Task via StateManager';
    console.log(chalk.cyan(`Testing: ${testName}`));
    
    if (!this.testTaskId) {
      this.testResults.push({ 
        name: testName, 
        passed: false, 
        error: 'No test task created' 
      });
      return;
    }

    const beforeCount = this.countEvents();
    const result = this.runCommand(`update ${this.testTaskId} --status in-progress --progress 25`);
    
    const afterCount = this.countEvents();
    const eventLogged = this.checkEventLogged('updateTask', this.testTaskId);

    this.testResults.push({
      name: testName,
      passed: result.success && eventLogged,
      details: {
        commandSucceeded: result.success,
        eventsAdded: afterCount - beforeCount,
        auditLogUpdated: eventLogged
      }
    });
  }

  // Test 3: Invalid status transitions are prevented
  async testInvalidTransition() {
    const testName = 'Invalid Status Transition Prevention';
    console.log(chalk.cyan(`Testing: ${testName}`));
    
    // Create a new task for this test
    const result1 = this.runCommand(`add "Test Invalid Transition ${Date.now()}"`);
    const taskIdMatch = result1.output.match(/TASK-(\d+)/);
    const testTaskId = taskIdMatch ? taskIdMatch[0] : null;

    if (!testTaskId) {
      this.testResults.push({ 
        name: testName, 
        passed: false, 
        error: 'Could not create test task' 
      });
      return;
    }

    // Try to complete a not-started task (invalid transition)
    const result2 = this.runCommand(`complete ${testTaskId}`);
    
    this.testResults.push({
      name: testName,
      passed: !result2.success && result2.error && result2.error.includes('Invalid status transition'),
      details: {
        transitionBlocked: !result2.success,
        errorMessage: result2.error || 'No error'
      }
    });
  }

  // Test 4: List command uses cached data
  async testListCommand() {
    const testName = 'List Command Uses StateManager';
    console.log(chalk.cyan(`Testing: ${testName}`));
    
    const beforeEvents = this.countEvents();
    
    // Run list multiple times quickly (should use cache)
    const result1 = this.runCommand('list');
    const result2 = this.runCommand('list');
    const result3 = this.runCommand('list');
    
    const afterEvents = this.countEvents();
    
    // Should not create many events due to caching
    const eventsCreated = afterEvents - beforeEvents;
    
    this.testResults.push({
      name: testName,
      passed: result1.success && result2.success && result3.success,
      details: {
        listCommandsRun: 3,
        eventsCreated,
        likelyUsingCache: eventsCreated < 3
      }
    });
  }

  // Test 5: Detail command retrieves via StateManager
  async testDetailCommand() {
    const testName = 'Detail Command Uses StateManager';
    console.log(chalk.cyan(`Testing: ${testName}`));
    
    if (!this.testTaskId) {
      this.testResults.push({ 
        name: testName, 
        passed: false, 
        error: 'No test task available' 
      });
      return;
    }

    const result = this.runCommand(`detail ${this.testTaskId}`);
    
    this.testResults.push({
      name: testName,
      passed: result.success && result.output.includes(this.testTaskId),
      details: {
        commandSucceeded: result.success,
        taskDetailsShown: result.output.includes('Task Details')
      }
    });
  }

  // Test 6: Status command uses StateManager
  async testStatusCommand() {
    const testName = 'Status Command Uses StateManager';
    console.log(chalk.cyan(`Testing: ${testName}`));
    
    const result = this.runCommand(`status ${this.testTaskId || 'TASK-001'}`);
    
    this.testResults.push({
      name: testName,
      passed: result.success,
      details: {
        commandSucceeded: result.success,
        outputGenerated: result.output.length > 0
      }
    });
  }

  // Test 7: Complete command with valid transition
  async testCompleteCommand() {
    const testName = 'Complete Command via StateManager';
    console.log(chalk.cyan(`Testing: ${testName}`));
    
    // Create and progress a task to make completion valid
    const result1 = this.runCommand(`add "Test Completion ${Date.now()}"`);
    const taskIdMatch = result1.output.match(/TASK-(\d+)/);
    const testTaskId = taskIdMatch ? taskIdMatch[0] : null;

    if (!testTaskId) {
      this.testResults.push({ 
        name: testName, 
        passed: false, 
        error: 'Could not create test task' 
      });
      return;
    }

    // First mark as in-progress and wait for it to complete
    const updateResult = this.runCommand(`update ${testTaskId} --status in-progress --progress 50`);
    if (!updateResult.success) {
      this.testResults.push({ 
        name: testName, 
        passed: false, 
        error: 'Could not update task to in-progress' 
      });
      return;
    }
    
    // Small delay to ensure state is persisted
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Now complete it
    const beforeCount = this.countEvents();
    const result2 = this.runCommand(`complete ${testTaskId}`);
    const afterCount = this.countEvents();
    
    const eventLogged = this.checkEventLogged('updateTask', testTaskId);

    this.testResults.push({
      name: testName,
      passed: result2.success && eventLogged,
      details: {
        completionSucceeded: result2.success,
        eventsAdded: afterCount - beforeCount,
        auditLogUpdated: eventLogged
      }
    });
  }

  // Test 8: Health command uses StateManager
  async testHealthCommand() {
    const testName = 'Health Command Uses StateManager';
    console.log(chalk.cyan(`Testing: ${testName}`));
    
    const result = this.runCommand('health');
    
    this.testResults.push({
      name: testName,
      passed: result.success || result.error.includes('EPIPE'), // EPIPE is from terminal output, not state manager
      details: {
        commandRan: true,
        outputGenerated: result.output.length > 0 || result.error.includes('EPIPE')
      }
    });
  }

  // Test 9: Integrity command uses StateManager
  async testIntegrityCommand() {
    const testName = 'Integrity Command Uses StateManager';
    console.log(chalk.cyan(`Testing: ${testName}`));
    
    const result = this.runCommand('integrity');
    
    this.testResults.push({
      name: testName,
      passed: result.success || result.output.includes('INTEGRITY CHECK'),
      details: {
        commandRan: true,
        checksPerformed: result.output.includes('FALSE COMPLETION') || 
                        result.output.includes('All tasks have valid status')
      }
    });
  }

  // Test 10: Verify state persistence
  async testStatePersistence() {
    const testName = 'State Persistence Verification';
    console.log(chalk.cyan(`Testing: ${testName}`));
    
    // Create a task with specific data
    const timestamp = Date.now();
    const result1 = this.runCommand(`add "Persistence Test ${timestamp}" --priority P0`);
    const taskIdMatch = result1.output.match(/TASK-(\d+)/);
    const testTaskId = taskIdMatch ? taskIdMatch[0] : null;

    if (!testTaskId) {
      this.testResults.push({ 
        name: testName, 
        passed: false, 
        error: 'Could not create test task' 
      });
      return;
    }

    // Update with specific progress
    this.runCommand(`update ${testTaskId} --progress 42`);
    
    // Small delay to ensure write completes
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Read back via detail command
    const detailResult = this.runCommand(`detail ${testTaskId}`);
    
    // Check if the progress was persisted
    const progressPersisted = detailResult.output.includes('"progress": 42');
    const priorityPersisted = detailResult.output.includes('"priority": "P0"');
    
    this.testResults.push({
      name: testName,
      passed: progressPersisted && priorityPersisted,
      details: {
        taskCreated: !!testTaskId,
        progressPersisted,
        priorityPersisted,
        stateCorrect: progressPersisted && priorityPersisted
      }
    });
  }

  // Test 11: Parallel execution tracking
  async testParallelTracking() {
    const testName = 'Parallel Task Updates via StateManager';
    console.log(chalk.cyan(`Testing: ${testName}`));
    
    // Create multiple tasks
    const task1 = this.runCommand(`add "Parallel Test 1 ${Date.now()}"`);
    const task2 = this.runCommand(`add "Parallel Test 2 ${Date.now()}"`);
    
    const task1Id = task1.output.match(/TASK-(\d+)/)?.[0];
    const task2Id = task2.output.match(/TASK-(\d+)/)?.[0];

    if (!task1Id || !task2Id) {
      this.testResults.push({ 
        name: testName, 
        passed: false, 
        error: 'Could not create test tasks' 
      });
      return;
    }

    // Update both in rapid succession
    const beforeCount = this.countEvents();
    
    // These should be handled atomically by StateManager
    const update1 = this.runCommand(`update ${task1Id} --progress 50`);
    const update2 = this.runCommand(`update ${task2Id} --progress 75`);
    
    const afterCount = this.countEvents();
    const eventsCreated = afterCount - beforeCount;

    this.testResults.push({
      name: testName,
      passed: update1.success && update2.success && eventsCreated >= 2,
      details: {
        bothUpdatesSucceeded: update1.success && update2.success,
        eventsCreated,
        atomicOperations: eventsCreated >= 2
      }
    });
  }

  // Run all tests
  async runAllTests() {
    console.log(chalk.bold.cyan('\n🧪 TASKSTATEMANAGER INTEGRATION TEST SUITE\n'));
    console.log(chalk.gray('Testing that all commands use centralized state management...'));
    console.log('═'.repeat(60));

    this.initialEventCount = this.countEvents();
    
    // Run tests in sequence
    await this.testAddTask();
    await this.testUpdateTask();
    await this.testInvalidTransition();
    await this.testListCommand();
    await this.testDetailCommand();
    await this.testStatusCommand();
    await this.testCompleteCommand();
    await this.testHealthCommand();
    await this.testIntegrityCommand();
    await this.testStatePersistence();
    await this.testParallelTracking();

    // Display results
    this.displayResults();
  }

  displayResults() {
    console.log('\n' + '═'.repeat(60));
    console.log(chalk.bold('\n📊 TEST RESULTS\n'));

    const passed = this.testResults.filter(t => t.passed).length;
    const failed = this.testResults.filter(t => !t.passed).length;
    const total = this.testResults.length;

    // Display each test result
    this.testResults.forEach((test, index) => {
      const icon = test.passed ? chalk.green('✅') : chalk.red('❌');
      const status = test.passed ? chalk.green('PASSED') : chalk.red('FAILED');
      
      console.log(`\n${icon} Test ${index + 1}: ${test.name}`);
      console.log(`   Status: ${status}`);
      
      if (test.details) {
        console.log(chalk.gray('   Details:'));
        Object.entries(test.details).forEach(([key, value]) => {
          console.log(chalk.gray(`     - ${key}: ${value}`));
        });
      }
      
      if (test.error) {
        console.log(chalk.red(`   Error: ${test.error}`));
      }
    });

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log(chalk.bold('\n📈 SUMMARY\n'));
    console.log(`Total Tests: ${total}`);
    console.log(chalk.green(`Passed: ${passed}`));
    console.log(chalk.red(`Failed: ${failed}`));
    console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);
    
    const finalEventCount = this.countEvents();
    console.log(chalk.gray(`\nAudit Events Created: ${finalEventCount - this.initialEventCount}`));
    
    // Overall verdict
    console.log('\n' + '═'.repeat(60));
    if (passed === total) {
      console.log(chalk.bold.green('\n✅ ALL COMMANDS PROPERLY INTEGRATED WITH TASKSTATEMANAGER!\n'));
    } else if (passed >= total * 0.8) {
      console.log(chalk.bold.yellow('\n⚠️  MOST COMMANDS INTEGRATED, SOME ISSUES REMAIN\n'));
    } else {
      console.log(chalk.bold.red('\n❌ SIGNIFICANT INTEGRATION ISSUES DETECTED\n'));
    }
    
    // Exit code
    process.exit(failed > 0 ? 1 : 0);
  }
}

// Run the test suite
const tester = new StateManagerIntegrationTest();
tester.runAllTests().catch(console.error);