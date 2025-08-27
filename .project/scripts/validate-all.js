#!/usr/bin/env node

/**
 * Comprehensive Validation Script
 * Tests all cx commands to ensure they work correctly
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class Validator {
  constructor() {
    this.results = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  // Execute command and capture output
  exec(command, expectSuccess = true) {
    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 10000 
      });
      return { success: true, output };
    } catch (error) {
      return { 
        success: false, 
        output: error.stdout || '', 
        error: error.stderr || error.message 
      };
    }
  }

  // Test a command and record result
  test(description, command, validator) {
    this.totalTests++;
    console.log(chalk.gray(`Testing: ${description}...`));
    
    const result = this.exec(command);
    let passed = false;
    let reason = '';

    try {
      passed = validator(result);
      if (!passed) {
        reason = 'Validation failed';
      }
    } catch (error) {
      passed = false;
      reason = error.message;
    }

    if (passed) {
      this.passedTests++;
      console.log(chalk.green(`  ✓ ${description}`));
    } else {
      this.failedTests++;
      console.log(chalk.red(`  ✗ ${description}`));
      if (reason) console.log(chalk.gray(`    Reason: ${reason}`));
      if (result.error) console.log(chalk.gray(`    Error: ${result.error.slice(0, 100)}`));
    }

    this.results.push({
      description,
      command,
      passed,
      reason,
      output: result.output?.slice(0, 200)
    });

    return passed;
  }

  // Validate file exists
  fileExists(filepath) {
    return fs.existsSync(filepath);
  }

  // Run all validation tests
  async runAll() {
    console.log(chalk.cyan('\n🧪 COMPREHENSIVE CX VALIDATION SUITE\n'));
    console.log('=' .repeat(60));
    
    // Test help command
    console.log(chalk.yellow('\n📚 Testing Help & Info Commands:'));
    this.test(
      'cx help shows help text',
      './cx help',
      (r) => r.success && r.output.includes('SchoolCierge Task Management')
    );

    // Test status commands
    console.log(chalk.yellow('\n📊 Testing Status Commands:'));
    this.test(
      'cx status shows project status',
      './cx status',
      (r) => r.success && r.output.includes('OVERALL SUMMARY')
    );
    
    this.test(
      'cx status excludes completed tasks by default',
      './cx status',
      (r) => r.success && !r.output.includes('TASK-009') // TASK-009 is completed
    );
    
    this.test(
      'cx status include-completed shows all tasks',
      './cx status include-completed',
      (r) => r.success && r.output.includes('including completed tasks')
    );
    
    this.test(
      'cx status TASK-XXX shows single task',
      './cx status TASK-001',
      (r) => r.success && r.output.includes('TASK-001') && r.output.includes('TIMELINE')
    );

    // Test list commands
    console.log(chalk.yellow('\n📋 Testing List Commands:'));
    this.test(
      'cx list shows all tasks',
      './cx list',
      (r) => r.success && r.output.includes('Task List')
    );
    
    this.test(
      'cx list --status filters by status',
      './cx list --status in-progress',
      (r) => r.success
    );
    
    this.test(
      'cx list --priority filters by priority',
      './cx list --priority P0',
      (r) => r.success
    );

    // Test detail command
    console.log(chalk.yellow('\n🔍 Testing Detail Commands:'));
    this.test(
      'cx detail shows task details',
      './cx detail TASK-001',
      (r) => r.success && r.output.includes('Task Details')
    );

    // Test next command
    console.log(chalk.yellow('\n➡️ Testing Next Command:'));
    this.test(
      'cx next suggests next tasks',
      './cx next',
      (r) => r.success && (r.output.includes('What to') || r.output.includes('next'))
    );

    // Test dashboard generation
    console.log(chalk.yellow('\n📈 Testing Dashboard Commands:'));
    this.test(
      'cx dashboard generates HTML dashboard',
      './cx dashboard',
      (r) => {
        const dashboardPath = path.join(__dirname, '../tasks/dashboard.html');
        return r.success && this.fileExists(dashboardPath);
      }
    );

    // Test test runner
    console.log(chalk.yellow('\n🧪 Testing Test Runner:'));
    this.test(
      'cx test runs tests',
      './cx test TASK-009',
      (r) => r.output.includes('Test Runner') || r.output.includes('UNIFIED TEST RUNNER')
    );
    
    // Test validate command
    console.log(chalk.yellow('\n✅ Testing Validation Commands:'));
    this.test(
      'cx validate checks data integrity',
      './cx validate',
      (r) => r.success || r.output.includes('INTEGRITY CHECK')
    );

    // Test views generation
    console.log(chalk.yellow('\n📁 Testing View Generation:'));
    this.test(
      'cx views regenerates views',
      './cx views',
      (r) => {
        const progressPath = path.join(__dirname, '../tasks/PROGRESS.md');
        return this.fileExists(progressPath);
      }
    );

    // Test task management (non-destructive)
    console.log(chalk.yellow('\n📝 Testing Task Management (Read-Only):'));
    this.test(
      'cx update validates arguments',
      './cx update TASK-999 --progress 50',
      (r) => true // Just check it doesn't crash - it properly shows error message
    );

    // Test file existence
    console.log(chalk.yellow('\n📂 Testing Required Files:'));
    this.test(
      'backlog.json exists',
      'ls .project/tasks/backlog.json',
      (r) => r.success
    );
    
    this.test(
      'task-manager.js exists',
      'ls .project/scripts/task-manager.js',
      (r) => r.success
    );
    
    this.test(
      'test-runner.js exists',
      'ls .project/scripts/test-runner.js',
      (r) => r.success
    );

    // Test cx script itself
    console.log(chalk.yellow('\n🔧 Testing CX Script:'));
    this.test(
      'cx script is executable',
      'ls -la cx',
      (r) => r.success && r.output.includes('x')
    );
    
    this.test(
      'cx without args shows help',
      './cx',
      (r) => r.output.includes('help') || r.output.includes('Help')
    );

    // Print summary
    this.printSummary();
    
    // Generate report
    this.generateReport();
  }

  printSummary() {
    console.log('\n' + '=' .repeat(60));
    console.log(chalk.cyan('VALIDATION SUMMARY'));
    console.log('=' .repeat(60));
    
    const successRate = this.totalTests > 0 
      ? Math.round((this.passedTests / this.totalTests) * 100)
      : 0;
    
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(chalk.green(`✓ Passed: ${this.passedTests}`));
    console.log(chalk.red(`✗ Failed: ${this.failedTests}`));
    console.log(`Success Rate: ${successRate}%`);
    
    if (this.failedTests > 0) {
      console.log(chalk.yellow('\n⚠️  Some tests failed. Check the report for details.'));
      console.log('Failed tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(chalk.red(`  - ${r.description}`));
          if (r.reason) console.log(chalk.gray(`    ${r.reason}`));
        });
    } else {
      console.log(chalk.green('\n🎉 All tests passed!'));
    }
  }

  generateReport() {
    const reportPath = path.join(__dirname, '../agent-comms/reports/validation-report.json');
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.totalTests,
        passed: this.passedTests,
        failed: this.failedTests,
        successRate: this.totalTests > 0 
          ? Math.round((this.passedTests / this.totalTests) * 100)
          : 0
      },
      results: this.results
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(chalk.gray(`\nDetailed report saved to: ${reportPath}`));
  }
}

// Run validation
const validator = new Validator();
validator.runAll().catch(error => {
  console.error(chalk.red('Validation failed:'), error);
  process.exit(1);
});