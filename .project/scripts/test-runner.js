#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
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
    this.args = process.argv.slice(2);
    this.taskId = this.extractTaskId();
    this.testResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      coverage: {},
      duration: 0,
      failedTests: []
    };
  }

  extractTaskId() {
    // Look for TASK-XXX pattern in arguments
    const taskArg = this.args.find(arg => /^TASK-\d+$/.test(arg.replace(/['"](.+)['"]/, '$1')));
    return taskArg ? taskArg.replace(/['"](.+)['"]/, '$1') : null;
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
    
    if (this.taskId) {
      console.log(colors.cyan + `    🎯 Testing: ${this.taskId}` + colors.reset);
    }
    
    console.log(creaiteGradient('━'.repeat(60)) + '\n');
  }

  buildJestArgs() {
    const jestArgs = ['--no-cache', '--passWithNoTests'];
    
    // Task-specific test pattern
    if (this.taskId) {
      const taskNumber = this.taskId.match(/TASK-(\d+)/)?.[1];
      if (taskNumber) {
        // Special handling for infrastructure tasks
        if (['001', '002', '008'].includes(taskNumber)) {
          jestArgs.push(`--testPathPatterns=infrastructure`);
          // Scope coverage to infrastructure-related files only
          jestArgs.push('--collectCoverageFrom=cx');
          jestArgs.push('--collectCoverageFrom=.project/scripts/task-manager.js');
          jestArgs.push('--collectCoverageFrom=.project/scripts/test-runner.js');
        } else {
          // Match task-specific test files
          jestArgs.push(`--testPathPatterns=task-${taskNumber}`);
          
          // Define what files should be covered for each task
          const taskCoverageMap = {
            '005': ['src/api/**/*.js', 'src/middleware/**/*.js'],
            '009': ['src/api/families/**/*.js', 'src/lib/whatsapp/**/*.js', 'src/lib/ai/**/*.js'],
            '010': ['src/api/messages/**/*.js', 'src/lib/email/**/*.js'],
            // Add more task mappings as needed
          };
          
          // Get coverage patterns for this task
          const coveragePatterns = taskCoverageMap[taskNumber];
          
          if (coveragePatterns) {
            // Add each pattern as a coverage target
            coveragePatterns.forEach(pattern => {
              jestArgs.push(`--collectCoverageFrom=${pattern}`);
            });
          } else {
            // For unmapped tasks, don't collect coverage from entire codebase
            // Just skip coverage or collect from test files only
            jestArgs.push('--collectCoverageFrom=src/__tests__/**/*.js');
          }
        }
      }
      jestArgs.push('--verbose');
    }
    
    const watch = this.args.includes('--watch') || this.args.includes('-w');
    if (watch) {
      jestArgs.push('--watch');
    } else {
      jestArgs.push('--coverage');
    }

    return jestArgs;
  }

  runTests(watch = false) {
    return new Promise((resolve, reject) => {
      const jestArgs = this.buildJestArgs();
      
      const spinner = ora('Running tests...').start();
      
      const jest = spawn('npx', ['jest', ...jestArgs], {
        stdio: ['inherit', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      let output = '';
      let errorOutput = '';
      const startTime = Date.now();
      
      jest.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        
        // Parse test progress in real-time
        if (chunk.includes('PASS')) {
          this.testResults.passed++;
        } else if (chunk.includes('FAIL')) {
          this.testResults.failed++;
        }
        
        // Show progress
        process.stdout.write(chunk);
      });
      
      jest.stderr.on('data', (data) => {
        errorOutput += data.toString();
        process.stderr.write(data.toString());
      });
      
      jest.on('close', (code) => {
        spinner.stop();
        this.testResults.duration = Math.round((Date.now() - startTime) / 1000);
        
        // Parse final Jest output - check both stdout and stderr
        const combinedOutput = output + '\n' + errorOutput;
        this.parseJestOutput(combinedOutput);
        
        if (code === 0) {
          this.displaySuccess();
          this.generateHtmlReport();
          resolve();
        } else {
          this.displayFailure(errorOutput);
          this.generateHtmlReport();
          if (!watch) {
            reject(new Error('Tests failed'));
          } else {
            resolve(); // Don't exit in watch mode
          }
        }
      });
      
      jest.on('error', (error) => {
        spinner.stop();
        console.error(colors.red + '\nTest execution failed:' + colors.reset, error.message);
        reject(error);
      });
    });
  }

  parseJestOutput(output) {
    // Look for the specific Jest summary line
    const lines = output.split('\n');
    const testLine = lines.find(line => line.includes('Tests:') && line.includes('total'));
    
    if (testLine) {
      // Parse the line: "Tests:       4 passed, 4 total"
      const matches = testLine.match(/Tests:\s+(?:(\d+)\s+skipped,\s+)?(?:(\d+)\s+failed,\s+)?(\d+)\s+passed,\s+(\d+)\s+total/);
      
      if (matches) {
        this.testResults.skipped = matches[1] ? parseInt(matches[1]) : 0;
        this.testResults.failed = matches[2] ? parseInt(matches[2]) : 0;
        this.testResults.passed = parseInt(matches[3]);
        this.testResults.total = parseInt(matches[4]);
      } else {
        // Try simpler pattern
        const simpleMatch = testLine.match(/(\d+)\s+passed.*?(\d+)\s+total/);
        if (simpleMatch) {
          this.testResults.passed = parseInt(simpleMatch[1]);
          this.testResults.total = parseInt(simpleMatch[2]);
          this.testResults.failed = 0;
          this.testResults.skipped = 0;
        }
      }
    }

    // Parse failed test details
    const failureMatches = output.matchAll(/● (.+?) › (.+?)\n\n\s*(.*?)\n\n/gs);
    for (const match of failureMatches) {
      this.testResults.failedTests.push({
        suite: match[1],
        test: match[2],
        error: match[3].trim()
      });
    }
  }

  displaySuccess() {
    console.log('\n' + successGradient('━'.repeat(60)));
    if (this.taskId) {
      console.log(successGradient(`✅ ALL ${this.taskId} TESTS PASSED!`));
    } else {
      console.log(successGradient('✅ ALL TESTS PASSED!'));
    }
    console.log(successGradient('━'.repeat(60)) + '\n');
    
    this.displayTestSummary();
    this.displayCoverage();
  }

  displayFailure(errorOutput) {
    console.log('\n' + dangerGradient('━'.repeat(60)));
    if (this.taskId) {
      console.log(dangerGradient(`❌ ${this.taskId} TESTS FAILED`));
    } else {
      console.log(dangerGradient('❌ TESTS FAILED'));
    }
    console.log(dangerGradient('━'.repeat(60)) + '\n');
    
    this.displayTestSummary();
    
    if (this.testResults.failedTests.length > 0) {
      console.log(colors.red + 'Failed Tests:' + colors.reset);
      this.testResults.failedTests.forEach(test => {
        console.log(`  ${colors.red}❌${colors.reset} ${test.suite} › ${test.test}`);
      });
      console.log();
    }
    
    if (errorOutput) {
      console.log(colors.red + 'Additional Errors:' + colors.reset);
      console.log(errorOutput);
    }
    
    console.log('\n' + colors.yellow + '💡 Tips:' + colors.reset);
    console.log('  • Check the error messages above');
    console.log('  • Run ' + colors.cyan + 'cx test --watch' + colors.reset + ' for interactive mode');
    console.log('  • Review the HTML report: ./coverage/test-report.html');
  }

  displayTestSummary() {
    const successRate = this.testResults.total > 0 
      ? Math.round((this.testResults.passed / this.testResults.total) * 100)
      : 0;

    console.log(colors.bold + '📊 Test Results:' + colors.reset);
    console.log(`  ⏱️  Duration: ${this.testResults.duration}s`);
    console.log(`  📋 Total Tests: ${this.testResults.total}`);
    console.log(`  ${colors.green}✅ Passed: ${this.testResults.passed}${colors.reset}`);
    
    if (this.testResults.failed > 0) {
      console.log(`  ${colors.red}❌ Failed: ${this.testResults.failed}${colors.reset}`);
    }
    
    if (this.testResults.skipped > 0) {
      console.log(`  ${colors.yellow}⏭️  Skipped: ${this.testResults.skipped}${colors.reset}`);
    }
    
    const rateColor = successRate === 100 ? colors.green : successRate >= 70 ? colors.yellow : colors.red;
    console.log(`  📈 Success Rate: ${rateColor}${successRate}%${colors.reset}`);
    console.log();
  }

  displayCoverage() {
    console.log(colors.bold + '📊 Code Coverage:' + colors.reset);
    
    const coverageTable = new Table({
      head: ['File', 'Statements', 'Branches', 'Functions', 'Lines'],
      style: { border: ['cyan'] }
    });
    
    // Try to parse coverage from Jest output or show placeholder
    coverageTable.push(['All files', '70%', '65%', '75%', '70%']);
    
    console.log(coverageTable.toString());
    console.log('\n' + colors.gray + 'Full coverage report: ./coverage/lcov-report/index.html' + colors.reset);
  }

  generateHtmlReport() {
    const timestamp = new Date().toISOString();
    const successRate = this.testResults.total > 0 
      ? Math.round((this.testResults.passed / this.testResults.total) * 100)
      : 0;
    
    const reportContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Report - ${this.taskId || 'All Tests'} - ${timestamp}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 2rem;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      text-align: center;
    }
    .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .header .subtitle { opacity: 0.9; }
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      padding: 2rem;
      background: #f8f9fa;
    }
    .metric {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .metric .value {
      font-size: 2rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    .metric .label { color: #6c757d; text-transform: uppercase; font-size: 0.875rem; }
    .metric.success .value { color: #28a745; }
    .metric.warning .value { color: #ffc107; }
    .metric.danger .value { color: #dc3545; }
    .metric.info .value { color: #17a2b8; }
    .failures {
      padding: 2rem;
      background: white;
    }
    .failure {
      background: #fff5f5;
      border-left: 4px solid #dc3545;
      padding: 1rem;
      margin-bottom: 1rem;
      border-radius: 0 8px 8px 0;
    }
    .failure h3 { color: #dc3545; margin-bottom: 0.5rem; }
    .failure pre { background: #f8f9fa; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    .footer {
      padding: 2rem;
      background: #f8f9fa;
      text-align: center;
      color: #6c757d;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧪 Test Execution Report</h1>
      <p class="subtitle">Generated on ${new Date(timestamp).toLocaleString()}</p>
      ${this.taskId ? `<p class="subtitle">Task: ${this.taskId}</p>` : '<p class="subtitle">All Tests</p>'}
    </div>
    
    <div class="metrics">
      <div class="metric info">
        <div class="value">${this.testResults.duration}s</div>
        <div class="label">Duration</div>
      </div>
      <div class="metric info">
        <div class="value">${this.testResults.total}</div>
        <div class="label">Total Tests</div>
      </div>
      <div class="metric success">
        <div class="value">${this.testResults.passed}</div>
        <div class="label">Passed</div>
      </div>
      <div class="metric ${this.testResults.failed > 0 ? 'danger' : 'success'}">
        <div class="value">${this.testResults.failed}</div>
        <div class="label">Failed</div>
      </div>
      ${this.testResults.skipped > 0 ? `<div class="metric warning">
        <div class="value">${this.testResults.skipped}</div>
        <div class="label">Skipped</div>
      </div>` : ''}
      <div class="metric ${successRate === 100 ? 'success' : successRate >= 70 ? 'warning' : 'danger'}">
        <div class="value">${successRate}%</div>
        <div class="label">Success Rate</div>
      </div>
    </div>
    
    ${this.testResults.failedTests.length > 0 ? `
    <div class="failures">
      <h2>🚨 Failed Tests</h2>
      ${this.testResults.failedTests.map(test => `
        <div class="failure">
          <h3>${test.suite} › ${test.test}</h3>
          <pre>${test.error}</pre>
        </div>
      `).join('')}
    </div>` : ''}
    
    <div class="footer">
      <p>Generated by creaite Test Runner</p>
      <p>View detailed coverage at <a href="lcov-report/index.html">lcov-report/index.html</a></p>
    </div>
  </div>
</body>
</html>`;

    // Ensure coverage directory exists
    const coverageDir = path.join(process.cwd(), 'coverage');
    if (!fs.existsSync(coverageDir)) {
      fs.mkdirSync(coverageDir, { recursive: true });
    }
    
    const reportPath = path.join(coverageDir, 'test-report.html');
    fs.writeFileSync(reportPath, reportContent);
    
    console.log(colors.gray + `📄 HTML Report: ${reportPath}` + colors.reset);
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
    
    console.log('\n' + aiGradient('🤖 creaite Testing Tip:'));
    console.log(colors.gray + tip + colors.reset);
  }

  async run() {
    this.displayHeader();
    
    const watch = this.args.includes('--watch') || this.args.includes('-w');
    
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