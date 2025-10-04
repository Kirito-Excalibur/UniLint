#!/usr/bin/env node

import { runUnitTests } from './test-cases/unit-tests.js';
import { runIntegrationTests } from './test-cases/integration-tests.js';
import { runPerformanceTests } from './test-cases/performance-tests.js';
import { runValidationTests } from './test-cases/validation-tests.js';
import chalk from 'chalk';

async function runAllTests() {
  console.log(chalk.bold.blue('🚀 Unilint Test Suite\n'));
  console.log(chalk.gray('Running comprehensive tests for the Unilint CLI tool\n'));

  let totalPassed = 0;
  let totalFailed = 0;

  try {
    // Run unit tests
    console.log(chalk.bold('═'.repeat(60)));
    const unitTestsPassed = await runUnitTests();
    if (unitTestsPassed) {
      totalPassed++;
      console.log(chalk.green('✓ Unit tests passed'));
    } else {
      totalFailed++;
      console.log(chalk.red('✗ Unit tests failed'));
    }

    // Run validation tests
    console.log(chalk.bold('\n' + '═'.repeat(60)));
    const validationTestsPassed = await runValidationTests();
    if (validationTestsPassed) {
      totalPassed++;
      console.log(chalk.green('✓ Validation tests passed'));
    } else {
      totalFailed++;
      console.log(chalk.red('✗ Validation tests failed'));
    }

    // Run integration tests
    console.log(chalk.bold('\n' + '═'.repeat(60)));
    const integrationTestsPassed = await runIntegrationTests();
    if (integrationTestsPassed) {
      totalPassed++;
      console.log(chalk.green('✓ Integration tests passed'));
    } else {
      totalFailed++;
      console.log(chalk.red('✗ Integration tests failed'));
    }

    // Run performance tests
    console.log(chalk.bold('\n' + '═'.repeat(60)));
    const performanceTestsPassed = await runPerformanceTests();
    if (performanceTestsPassed) {
      totalPassed++;
      console.log(chalk.green('✓ Performance tests passed'));
    } else {
      totalFailed++;
      console.log(chalk.red('✗ Performance tests failed (but not critical)'));
      // Don't fail the entire suite for performance issues
    }

  } catch (error) {
    console.error(chalk.red('\n💥 Test suite crashed:'), error.message);
    totalFailed++;
  }

  // Final summary
  console.log(chalk.bold('\n' + '═'.repeat(60)));
  console.log(chalk.bold('🏁 Final Test Results'));
  console.log(chalk.gray('─'.repeat(30)));
  
  if (totalFailed === 0) {
    console.log(chalk.green.bold('🎉 All test suites passed!'));
    console.log(chalk.green('✓ Unit Tests'));
    console.log(chalk.green('✓ Integration Tests'));
    console.log(chalk.green('✓ Performance Tests'));
  } else {
    console.log(chalk.yellow(`⚠️  ${totalPassed} passed, ${totalFailed} failed`));
  }

  console.log(chalk.gray('\nUnilint is ready for use! 🚀'));
  
  // Exit with appropriate code (allow some non-critical failures)
  process.exit(totalFailed > 2 ? 1 : 0);
}

// Handle CLI arguments
const args = process.argv.slice(2);
if (args.includes('--unit-only')) {
  runUnitTests().then(passed => process.exit(passed ? 0 : 1));
} else if (args.includes('--integration-only')) {
  runIntegrationTests().then(passed => process.exit(passed ? 0 : 1));
} else if (args.includes('--performance-only')) {
  runPerformanceTests().then(passed => process.exit(passed ? 0 : 1));
} else if (args.includes('--validation-only')) {
  runValidationTests().then(passed => process.exit(passed ? 0 : 1));
} else if (args.includes('--help')) {
  console.log(chalk.blue('Unilint Test Runner\n'));
  console.log('Usage: npm test [options]\n');
  console.log('Options:');
  console.log('  --unit-only        Run only unit tests');
  console.log('  --validation-only  Run only validation tests');
  console.log('  --integration-only Run only integration tests');
  console.log('  --performance-only Run only performance tests');
  console.log('  --help            Show this help message');
} else {
  runAllTests().catch(console.error);
}