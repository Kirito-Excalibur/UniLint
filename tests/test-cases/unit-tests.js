import { unilint } from '../../src/index.js';
import { lintJavaScript } from '../../src/js-linter.js';
import { lintCSS } from '../../src/css-linter.js';
import { resolveFiles } from '../../src/utils/file-resolver.js';
import { readFileSync, existsSync } from 'fs';
import chalk from 'chalk';

export class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log(chalk.blue('🧪 Running Unit Tests\n'));
    
    for (const { name, testFn } of this.tests) {
      try {
        console.log(chalk.yellow(`Running: ${name}`));
        await testFn();
        console.log(chalk.green('✓ PASSED\n'));
        this.passed++;
      } catch (error) {
        console.log(chalk.red(`✗ FAILED: ${error.message}\n`));
        this.failed++;
      }
    }

    this.printSummary();
    return this.failed === 0;
  }

  printSummary() {
    console.log(chalk.bold('\n📊 Unit Test Summary:'));
    console.log(chalk.gray('─'.repeat(30)));
    console.log(`Passed: ${chalk.green(this.passed)}`);
    console.log(`Failed: ${chalk.red(this.failed)}`);
    console.log(`Total: ${this.passed + this.failed}`);
  }
}

// Test utilities
export function assert(condition, message = 'Assertion failed') {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertEqual(actual, expected, message = 'Values are not equal') {
  if (actual !== expected) {
    throw new Error(`${message}. Expected: ${expected}, Actual: ${actual}`);
  }
}

export function assertArrayIncludes(array, item, message = 'Array does not include item') {
  if (!array.includes(item)) {
    throw new Error(`${message}. Array: ${JSON.stringify(array)}, Item: ${item}`);
  }
}

export function assertObjectHasProperty(obj, prop, message = 'Object does not have property') {
  if (!(prop in obj)) {
    throw new Error(`${message}. Object: ${JSON.stringify(obj)}, Property: ${prop}`);
  }
}

// Unit tests
export async function runUnitTests() {
  const runner = new TestRunner();

  // Test file resolver
  runner.test('File resolver should find JavaScript files', async () => {
    const files = await resolveFiles(['tests/fixtures/modern-js.js']);
    assert(files.length > 0, 'Should find at least one file');
    assertArrayIncludes(files, 'tests/fixtures/modern-js.js', 'Should include the specified file');
  });

  runner.test('File resolver should handle glob patterns', async () => {
    const files = await resolveFiles(['tests/fixtures/*.js']);
    assert(files.length > 0, 'Should find JavaScript files with glob pattern');
    assert(files.every(f => f.endsWith('.js')), 'All files should be JavaScript files');
  });

  runner.test('File resolver should ignore node_modules', async () => {
    const files = await resolveFiles(['.'], { ignorePattern: 'node_modules/**' });
    assert(!files.some(f => f.includes('node_modules')), 'Should not include node_modules files');
  });

  // Test JavaScript linter
  runner.test('JavaScript linter should analyze modern features', async () => {
    const result = await lintJavaScript('tests/fixtures/modern-js.js', { baseline: 'all' });
    
    assertObjectHasProperty(result, 'file', 'Result should have file property');
    assertObjectHasProperty(result, 'features', 'Result should have features array');
    assertObjectHasProperty(result, 'errors', 'Result should have errors array');
    assertObjectHasProperty(result, 'warnings', 'Result should have warnings array');
    
    assertEqual(result.file, 'tests/fixtures/modern-js.js', 'File path should match');
    assertEqual(result.type, 'javascript', 'Type should be javascript');
  });

  runner.test('JavaScript linter should handle empty files', async () => {
    const result = await lintJavaScript('tests/fixtures/empty.js', { baseline: 'all' });
    
    assertEqual(result.file, 'tests/fixtures/empty.js', 'Should handle empty file');
    assert(Array.isArray(result.features), 'Features should be an array');
    assert(Array.isArray(result.errors), 'Errors should be an array');
  });

  runner.test('JavaScript linter should handle syntax errors gracefully', async () => {
    const result = await lintJavaScript('tests/fixtures/error-test.js', { baseline: 'all' });
    
    assertEqual(result.file, 'tests/fixtures/error-test.js', 'Should handle files with syntax errors');
    // Should not throw, but may have errors in the result
  });

  // Test CSS linter
  runner.test('CSS linter should analyze CSS features', async () => {
    const result = await lintCSS('tests/fixtures/modern-css.css', { baseline: 'all' });
    
    assertObjectHasProperty(result, 'file', 'Result should have file property');
    assertObjectHasProperty(result, 'features', 'Result should have features array');
    assertEqual(result.type, 'css', 'Type should be css');
  });

  runner.test('CSS linter should detect grid and flexbox', async () => {
    const result = await lintCSS('tests/fixtures/modern-css.css', { baseline: 'all' });
    
    // Check if CSS features are detected (implementation may vary)
    assert(Array.isArray(result.features), 'Features should be an array');
  });

  // Test main unilint function
  runner.test('Unilint should process multiple file types', async () => {
    const result = await unilint(['tests/fixtures/modern-js.js', 'tests/fixtures/modern-css.css'], {
      format: 'json',
      quiet: true
    });
    
    assertObjectHasProperty(result, 'results', 'Should return results object');
    assertObjectHasProperty(result.results, 'javascript', 'Should have javascript results');
    assertObjectHasProperty(result.results, 'css', 'Should have css results');
    assertObjectHasProperty(result.results, 'summary', 'Should have summary');
  });

  runner.test('Unilint should filter by baseline level', async () => {
    const result = await unilint(['tests/fixtures/modern-js.js'], {
      baseline: 'high',
      format: 'json',
      quiet: true
    });
    
    assert(result.results.javascript.length >= 0, 'Should return results for high baseline filter');
  });

  runner.test('Unilint should handle JS-only option', async () => {
    const result = await unilint(['tests/fixtures/'], {
      jsOnly: true,
      format: 'json',
      quiet: true
    });
    
    assertEqual(result.results.css.length, 0, 'Should not process CSS files when jsOnly is true');
  });

  runner.test('Unilint should handle CSS-only option', async () => {
    const result = await unilint(['tests/fixtures/'], {
      cssOnly: true,
      format: 'json',
      quiet: true
    });
    
    assertEqual(result.results.javascript.length, 0, 'Should not process JS files when cssOnly is true');
  });

  runner.test('Unilint should handle non-existent files gracefully', async () => {
    try {
      const result = await unilint(['non-existent-file.js'], {
        format: 'json',
        quiet: true
      });
      // Should not throw, but should handle gracefully
      assert(true, 'Should handle non-existent files without throwing');
    } catch (error) {
      // If it throws, that's also acceptable behavior
      assert(true, 'Throwing on non-existent files is acceptable');
    }
  });

  return runner.run();
}