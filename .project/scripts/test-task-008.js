#!/usr/bin/env node

/**
 * TASK-008 Specific Test Runner
 * Runs ONLY the tests relevant to TASK-008
 */

const { execSync } = require('child_process');
const chalk = require('chalk');

console.log(chalk.cyan('\n🧪 TASK-008 TEST RUNNER'));
console.log('━'.repeat(60));

// Run the pragmatic test file that actually tests TASK-008
console.log(chalk.yellow('Running TASK-008 pragmatic tests...\n'));

try {
  execSync('npx jest src/tests/task-008-pragmatic.test.js --no-coverage --verbose', {
    stdio: 'inherit'
  });
  
  console.log(chalk.green('\n✅ TASK-008 tests completed successfully!'));
} catch (error) {
  console.log(chalk.red('\n❌ TASK-008 tests have failures'));
  console.log(chalk.yellow('\nWhat needs fixing:'));
  console.log('1. Missing app/index.tsx navigation file');
  console.log('2. Missing android/ios scripts in package.json');
  console.log('3. Missing metro.config.js bundler configuration');
  
  process.exit(1);
}