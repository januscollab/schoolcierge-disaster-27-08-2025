#!/usr/bin/env node

/**
 * Test Orchestrator - Complete Test Infrastructure
 * 
 * This orchestrator uses TaskStateManager to understand tasks and generate
 * REAL functional tests, not just file existence checks.
 * 
 * NO BULLSHIT - Tests that actually execute code and verify behavior.
 */

const path = require('path');
const chalk = require('chalk');
const taskStateManager = require('../../task-state-manager');

// Import all components
const TaskAnalyzer = require('../analyzers/task-analyzer');
const CodeAnalyzer = require('../analyzers/code-analyzer');
const TestPlanner = require('../planners/test-planner');
const CoveragePlanner = require('../planners/coverage-planner');

// Import generators
const APITestGenerator = require('../generators/api-test-generator');
const MobileTestGenerator = require('../generators/mobile-test-generator');
const InfrastructureTestGenerator = require('../generators/infrastructure-test-generator');
const IntegrationTestGenerator = require('../generators/integration-test-generator');
const SecurityTestGenerator = require('../generators/security-test-generator');

// Import executors
const TestRunner = require('../executors/test-runner');
const EnvironmentSetup = require('../executors/environment-setup');
const CoverageAnalyzer = require('../executors/coverage-analyzer');

// Import reporters
const HTMLReporter = require('../reporters/html-reporter');
const TerminalReporter = require('../reporters/terminal-reporter');

class TestOrchestrator {
  constructor() {
    this.taskAnalyzer = new TaskAnalyzer();
    this.codeAnalyzer = new CodeAnalyzer();
    this.testPlanner = new TestPlanner();
    this.coveragePlanner = new CoveragePlanner();
    
    this.generators = {
      api: new APITestGenerator(),
      mobile: new MobileTestGenerator(),
      infrastructure: new InfrastructureTestGenerator(),
      integration: new IntegrationTestGenerator(),
      security: new SecurityTestGenerator()
    };
    
    this.testRunner = new TestRunner();
    this.envSetup = new EnvironmentSetup();
    this.coverageAnalyzer = new CoverageAnalyzer();
    
    this.htmlReporter = new HTMLReporter();
    this.terminalReporter = new TerminalReporter();
  }

  /**
   * Main orchestration flow
   */
  async orchestrateTests(taskId, options = {}) {
    console.log(chalk.cyan(`\n🎯 TEST ORCHESTRATION - ${taskId}`));
    console.log('━'.repeat(60));
    
    try {
      // 1. Get task from TaskStateManager
      const task = await taskStateManager.getTask(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }
      
      console.log(chalk.green(`✓ Found task: ${task.title}`));
      console.log(`  Category: ${task.category}`);
      console.log(`  Status: ${task.status}`);
      console.log();
      
      // 2. Analyze what was built
      console.log(chalk.yellow('📊 Analyzing implementation...'));
      const analysis = await this.taskAnalyzer.analyzeTask(task);
      const codeStructure = await this.codeAnalyzer.analyzeCode(analysis.files);
      
      console.log(chalk.green(`  ✓ Found ${analysis.files.length} implementation files`));
      console.log(`  ✓ Detected ${analysis.components.length} components`));
      console.log(`  ✓ Found ${analysis.dependencies.length} external dependencies`);
      console.log();
      
      // 3. Create test plan
      console.log(chalk.yellow('📝 Creating test strategy...'));
      const testPlan = await this.testPlanner.createPlan(task, analysis, codeStructure);
      const coverageRequirements = await this.coveragePlanner.planCoverage(task, analysis);
      
      console.log(chalk.green(`  ✓ Generated ${testPlan.unitTests.length} unit tests`));
      console.log(`  ✓ Generated ${testPlan.integrationTests.length} integration tests`);
      console.log(`  ✓ Generated ${testPlan.securityTests.length} security tests`);
      console.log(`  ✓ Coverage target: ${coverageRequirements.target}%`);
      console.log();
      
      // 4. Generate test code
      console.log(chalk.yellow('🔧 Generating test code...'));
      const generatedTests = await this.generateTests(task, analysis, testPlan);
      
      // 5. Setup test environment
      console.log(chalk.yellow('🐳 Setting up test environment...'));
      await this.envSetup.setup(analysis.dependencies);
      
      // 6. Run tests
      console.log(chalk.yellow('🧪 Running tests...'));
      const results = await this.runTests(generatedTests, options);
      
      // 7. Analyze coverage
      console.log(chalk.yellow('📊 Analyzing coverage...'));
      const coverage = await this.coverageAnalyzer.analyze(results, coverageRequirements);
      
      // 8. Generate reports
      console.log(chalk.yellow('📈 Generating reports...'));
      const report = await this.generateReports(task, testPlan, results, coverage);
      
      // 9. Update task state with test results
      if (!options.dryRun) {
        await this.updateTaskWithResults(task, results, coverage);
      }
      
      // 10. Display results
      this.terminalReporter.display(report);
      
      return {
        success: results.failures === 0 && coverage.meetingRequirements,
        report,
        results,
        coverage
      };
      
    } catch (error) {
      console.error(chalk.red(`\n❌ Orchestration failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * Generate tests based on task category and analysis
   */
  async generateTests(task, analysis, testPlan) {
    const tests = {
      unit: [],
      integration: [],
      security: [],
      performance: [],
      e2e: []
    };
    
    // Generate based on task category
    switch(task.category) {
      case 'api':
      case 'backend':
        tests.unit = await this.generators.api.generateUnitTests(analysis, testPlan.unitTests);
        tests.integration = await this.generators.api.generateIntegrationTests(analysis, testPlan.integrationTests);
        tests.security = await this.generators.security.generateAPISecurityTests(analysis);
        break;
        
      case 'mobile':
        tests.unit = await this.generators.mobile.generateComponentTests(analysis, testPlan.unitTests);
        tests.integration = await this.generators.mobile.generateScreenTests(analysis, testPlan.integrationTests);
        tests.e2e = await this.generators.mobile.generateE2ETests(analysis, testPlan.e2eTests);
        break;
        
      case 'infrastructure':
        tests.integration = await this.generators.infrastructure.generateTests(analysis, testPlan);
        break;
        
      case 'integration':
        tests.integration = await this.generators.integration.generateTests(analysis, testPlan);
        break;
        
      case 'authentication':
        tests.unit = await this.generators.api.generateAuthTests(analysis, testPlan.unitTests);
        tests.security = await this.generators.security.generateAuthSecurityTests(analysis);
        tests.integration = await this.generators.integration.generateAuthFlowTests(analysis);
        break;
        
      default:
        // Generate generic tests based on file types
        tests.unit = await this.generateGenericTests(analysis, testPlan);
    }
    
    return tests;
  }

  /**
   * Run all generated tests
   */
  async runTests(generatedTests, options) {
    const results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      failures: [],
      duration: 0,
      coverage: {}
    };
    
    // Run tests in order: unit → integration → security → e2e
    for (const [type, tests] of Object.entries(generatedTests)) {
      if (tests.length === 0) continue;
      
      console.log(chalk.blue(`  Running ${type} tests...`));
      
      const typeResults = await this.testRunner.run(tests, {
        type,
        coverage: true,
        ...options
      });
      
      // Aggregate results
      results.total += typeResults.total;
      results.passed += typeResults.passed;
      results.failed += typeResults.failed;
      results.skipped += typeResults.skipped;
      results.failures.push(...typeResults.failures);
      results.duration += typeResults.duration;
      
      // Merge coverage
      Object.assign(results.coverage, typeResults.coverage);
    }
    
    return results;
  }

  /**
   * Generate reports
   */
  async generateReports(task, testPlan, results, coverage) {
    const report = {
      taskId: task.id,
      taskTitle: task.title,
      taskCategory: task.category,
      timestamp: new Date().toISOString(),
      testPlan,
      results,
      coverage,
      recommendations: this.generateRecommendations(results, coverage)
    };
    
    // Generate HTML report
    await this.htmlReporter.generate(report);
    
    return report;
  }

  /**
   * Update task in TaskStateManager with test results
   */
  async updateTaskWithResults(task, results, coverage) {
    const updates = {
      implementation_notes: {
        ...task.implementation_notes,
        last_test_run: new Date().toISOString(),
        test_results: {
          total: results.total,
          passed: results.passed,
          failed: results.failed,
          coverage: coverage.percentage
        },
        test_passing: results.failures === 0,
        coverage_meeting_requirements: coverage.meetingRequirements
      }
    };
    
    // Only mark as verified if tests pass and coverage is good
    if (results.failures === 0 && coverage.meetingRequirements) {
      updates.implementation_notes.test_verified = true;
    }
    
    await taskStateManager.updateTask(task.id, updates, 'test-orchestrator');
    
    console.log(chalk.green(`✓ Updated task ${task.id} with test results`));
  }

  /**
   * Generate recommendations based on results
   */
  generateRecommendations(results, coverage) {
    const recommendations = [];
    
    if (results.failed > 0) {
      recommendations.push({
        type: 'error',
        message: `Fix ${results.failed} failing test(s)`,
        priority: 'high'
      });
    }
    
    if (coverage.percentage < coverage.target) {
      recommendations.push({
        type: 'warning',
        message: `Increase coverage from ${coverage.percentage}% to ${coverage.target}%`,
        priority: 'medium'
      });
    }
    
    if (coverage.uncoveredLines.length > 0) {
      recommendations.push({
        type: 'info',
        message: `Add tests for ${coverage.uncoveredLines.length} uncovered lines`,
        files: coverage.uncoveredLines
      });
    }
    
    return recommendations;
  }

  /**
   * Generate generic tests for unknown task types
   */
  async generateGenericTests(analysis, testPlan) {
    const tests = [];
    
    // Generate tests based on file types
    for (const file of analysis.files) {
      if (file.endsWith('.ts') || file.endsWith('.js')) {
        // Generate basic unit tests
        const test = await this.generators.api.generateGenericUnitTest(file, analysis);
        tests.push(test);
      }
    }
    
    return tests;
  }
}

// CLI interface
if (require.main === module) {
  const taskId = process.argv[2];
  const options = {
    dryRun: process.argv.includes('--dry-run'),
    watch: process.argv.includes('--watch'),
    coverage: !process.argv.includes('--no-coverage'),
    verbose: process.argv.includes('--verbose')
  };
  
  if (!taskId || !taskId.match(/^TASK-\d+$/)) {
    console.error(chalk.red('Usage: node test-orchestrator.js TASK-XXX [options]'));
    console.error('Options:');
    console.error('  --dry-run      Generate tests without running');
    console.error('  --watch        Watch mode');
    console.error('  --no-coverage  Skip coverage');
    console.error('  --verbose      Verbose output');
    process.exit(1);
  }
  
  const orchestrator = new TestOrchestrator();
  
  orchestrator.orchestrateTests(taskId, options)
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error(chalk.red(error.message));
      process.exit(1);
    });
}

module.exports = TestOrchestrator;