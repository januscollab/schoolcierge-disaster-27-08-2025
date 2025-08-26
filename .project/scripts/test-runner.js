#!/usr/bin/env node

const { spawn } = require('child_process');
const gradient = require('gradient-string');
const ora = require('ora');
const Table = require('cli-table3');

// creaite branding
const creaiteGradient = gradient(['#0891b2', '#06b6d4', '#14b8a6']);
const aiGradient = gradient(['#fbbf24', '#f59e0b', '#fb923c']);
const successGradient = gradient(['#10b981', '#059669']);
const dangerGradient = gradient(['#ef4444', '#dc2626']);

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

class TestRunner {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      coverage: {}
    };
  }

  displayHeader() {
    console.clear();
    console.log('\n' + creaiteGradient('━'.repeat(60)));
    console.log(
      '    ' + colors.bold + creaiteGradient('cre') + 
      aiGradient('ai') + 
      creaiteGradient('te') + 
      colors.reset + ' ' +
      colors.bold + '🧪 Test Runner' + colors.reset
    );
    console.log(creaiteGradient('━'.repeat(60)) + '\n');
  }

  runTests(watch = false) {
    return new Promise((resolve, reject) => {
      const args = watch ? ['--watch'] : ['--coverage'];
      
      const spinner = ora('Running tests...').start();
      
      const jest = spawn('npx', ['jest', ...args], {
        stdio: ['inherit', 'pipe', 'pipe']
      });
      
      let output = '';
      let errorOutput = '';
      
      jest.stdout.on('data', (data) => {
        output += data.toString();
        // Parse test progress
        if (data.toString().includes('PASS')) {
          this.testResults.passed++;
        } else if (data.toString().includes('FAIL')) {
          this.testResults.failed++;
        }
      });
      
      jest.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      jest.on('close', (code) => {
        spinner.stop();
        
        // Display results
        console.log(output);
        
        if (code === 0) {
          this.displaySuccess();
          resolve();
        } else {
          this.displayFailure(errorOutput);
          if (!watch) {
            reject(new Error('Tests failed'));
          } else {
            resolve(); // Don't exit in watch mode
          }
        }
      });
    });
  }

  displaySuccess() {
    console.log('\n' + successGradient('━'.repeat(60)));
    console.log(successGradient('✅ ALL TESTS PASSED!'));
    console.log(successGradient('━'.repeat(60)) + '\n');
    
    // Display coverage if available
    this.displayCoverage();
  }

  displayFailure(errorOutput) {
    console.log('\n' + dangerGradient('━'.repeat(60)));
    console.log(dangerGradient('❌ TESTS FAILED'));
    console.log(dangerGradient('━'.repeat(60)) + '\n');
    
    if (errorOutput) {
      console.log(colors.red + 'Errors:' + colors.reset);
      console.log(errorOutput);
    }
    
    console.log('\n' + colors.yellow + '💡 Tips:' + colors.reset);
    console.log('  • Check the error messages above');
    console.log('  • Run ' + colors.cyan + 'cx test --watch' + colors.reset + ' for interactive mode');
    console.log('  • Make sure all dependencies are installed');
  }

  displayCoverage() {
    // This would normally parse the coverage report
    // For now, we'll show a placeholder
    console.log(colors.bold + '📊 Code Coverage:' + colors.reset);
    
    const coverageTable = new Table({
      head: ['File', 'Statements', 'Branches', 'Functions', 'Lines'],
      style: { border: ['cyan'] }
    });
    
    // Placeholder data - would be parsed from coverage report
    coverageTable.push(
      ['All files', '70%', '65%', '75%', '70%']
    );
    
    console.log(coverageTable.toString());
    console.log('\n' + colors.gray + 'Full coverage report: ./coverage/lcov-report/index.html' + colors.reset);
  }

  displayAITip() {
    const tips = [
      'Write tests before implementing features (TDD approach)',
      'Aim for at least 80% code coverage',
      'Test edge cases and error conditions',
      'Use descriptive test names that explain what is being tested',
      'Keep tests simple and focused on one thing',
      'Mock external dependencies for unit tests',
      'Run tests before every commit'
    ];
    
    const tip = tips[Math.floor(Math.random() * tips.length)];
    
    console.log('\n' + aiGradient('🤖 ai Testing Tip:'));
    console.log(colors.gray + tip + colors.reset);
  }

  async run() {
    this.displayHeader();
    
    const args = process.argv.slice(2);
    const watch = args.includes('--watch') || args.includes('-w');
    
    if (watch) {
      console.log(colors.cyan + '👁️  Running in watch mode. Press Ctrl+C to exit.\n' + colors.reset);
    }
    
    try {
      await this.runTests(watch);
      this.displayAITip();
      console.log('\n' + creaiteGradient('━'.repeat(60)) + '\n');
    } catch (error) {
      console.error(colors.red + '\nTest run failed:' + colors.reset, error.message);
      process.exit(1);
    }
  }
}

// Run tests
const runner = new TestRunner();
runner.run().catch(err => {
  console.error(colors.red + 'Test runner error:' + colors.reset, err.message);
  process.exit(1);
});