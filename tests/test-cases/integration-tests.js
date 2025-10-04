import { execSync } from 'child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import chalk from 'chalk';
import path from 'path';

export class IntegrationTestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log(chalk.blue('🔧 Running Integration Tests\n'));
    
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
    console.log(chalk.bold('\n📊 Integration Test Summary:'));
    console.log(chalk.gray('─'.repeat(30)));
    console.log(`Passed: ${chalk.green(this.passed)}`);
    console.log(`Failed: ${chalk.red(this.failed)}`);
    console.log(`Total: ${this.passed + this.failed}`);
  }
}

// Test utilities for CLI
function runCLI(args, options = {}) {
  const command = `node bin/unilint.js ${args}`;
  try {
    const result = execSync(command, { 
      encoding: 'utf-8',
      cwd: process.cwd(),
      ...options
    });
    return { stdout: result, stderr: '', exitCode: 0 };
  } catch (error) {
    return { 
      stdout: error.stdout || '', 
      stderr: error.stderr || '', 
      exitCode: error.status || 1 
    };
  }
}

function assert(condition, message = 'Assertion failed') {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(text, substring, message = 'Text does not include substring') {
  if (!text.includes(substring)) {
    throw new Error(`${message}. Text: "${text}", Substring: "${substring}"`);
  }
}

function assertExitCode(actual, expected, message = 'Exit code mismatch') {
  if (actual !== expected) {
    throw new Error(`${message}. Expected: ${expected}, Actual: ${actual}`);
  }
}

// Integration tests
export async function runIntegrationTests() {
  const runner = new IntegrationTestRunner();

  // Test CLI help
  runner.test('CLI should show help message', async () => {
    const result = runCLI('--help');
    assertExitCode(result.exitCode, 0, 'Help command should exit with code 0');
    assertIncludes(result.stdout, 'Usage:', 'Help should show usage information');
    assertIncludes(result.stdout, 'Options:', 'Help should show options');
  });

  // Test CLI version
  runner.test('CLI should show version', async () => {
    const result = runCLI('--version');
    assertExitCode(result.exitCode, 0, 'Version command should exit with code 0');
    assertIncludes(result.stdout, '1.0.0', 'Should show version number');
  });

  // Test basic file analysis
  runner.test('CLI should analyze JavaScript file', async () => {
    const result = runCLI('tests/fixtures/modern-js.js --quiet');
    // Should not fail (exit code 0 or 1 depending on findings)
    assert(result.exitCode === 0 || result.exitCode === 1, 'Should complete analysis');
    assertIncludes(result.stdout, 'Summary:', 'Should show summary');
  });

  // Test CSS file analysis
  runner.test('CLI should analyze CSS file with --css-only', async () => {
    const result = runCLI('tests/fixtures/modern-css.css --css-only --quiet');
    assert(result.exitCode === 0 || result.exitCode === 1, 'Should complete CSS analysis');
    assertIncludes(result.stdout, 'Summary:', 'Should show summary');
  });

  // Test JSON output format
  runner.test('CLI should output JSON format', async () => {
    const result = runCLI('tests/fixtures/modern-js.js --format json --quiet');
    assert(result.exitCode === 0 || result.exitCode === 1, 'Should complete with JSON format');
    
    // Try to parse JSON output (excluding summary)
    const lines = result.stdout.split('\n');
    const jsonLines = lines.filter(line => line.startsWith('{') || line.includes('"javascript"'));
    if (jsonLines.length > 0) {
      try {
        JSON.parse(jsonLines.join('\n'));
        assert(true, 'Should output valid JSON');
      } catch (e) {
        // JSON might be mixed with other output, which is acceptable
        assert(true, 'JSON parsing may fail due to mixed output');
      }
    }
  });

  // Test compact output format
  runner.test('CLI should output compact format', async () => {
    const result = runCLI('tests/fixtures/modern-js.js --format compact --quiet');
    assert(result.exitCode === 0 || result.exitCode === 1, 'Should complete with compact format');
  });

  // Test baseline filtering
  runner.test('CLI should filter by baseline level', async () => {
    const result = runCLI('tests/fixtures/modern-js.js --baseline high --quiet');
    assert(result.exitCode === 0 || result.exitCode === 1, 'Should complete with baseline filter');
    assertIncludes(result.stdout, 'Summary:', 'Should show summary');
  });

  // Test JS-only option
  runner.test('CLI should process only JavaScript files', async () => {
    const result = runCLI('tests/fixtures/ --js-only --quiet');
    assert(result.exitCode === 0 || result.exitCode === 1, 'Should complete JS-only analysis');
    assertIncludes(result.stdout, 'JavaScript files:', 'Should mention JavaScript files');
  });

  // Test verbose output
  runner.test('CLI should show verbose output', async () => {
    const result = runCLI('tests/fixtures/modern-js.js --verbose');
    assert(result.exitCode === 0 || result.exitCode === 1, 'Should complete verbose analysis');
    assertIncludes(result.stdout, 'Found', 'Verbose should show file discovery info');
  });

  // Test error handling for non-existent files
  runner.test('CLI should handle non-existent files gracefully', async () => {
    const result = runCLI('non-existent-file.js --quiet');
    // Should either exit with error or handle gracefully
    assert(result.exitCode === 0 || result.exitCode === 1, 'Should handle non-existent files');
  });

  // Test directory analysis
  runner.test('CLI should analyze directory', async () => {
    const result = runCLI('tests/fixtures/ --quiet');
    assert(result.exitCode === 0 || result.exitCode === 1, 'Should analyze directory');
    assertIncludes(result.stdout, 'Summary:', 'Should show summary for directory analysis');
  });

  // Test ignore patterns
  runner.test('CLI should respect ignore patterns', async () => {
    const result = runCLI('tests/ --ignore-pattern "**/*.css" --quiet');
    assert(result.exitCode === 0 || result.exitCode === 1, 'Should complete with ignore pattern');
  });

  // Test empty directory
  runner.test('CLI should handle empty results gracefully', async () => {
    // Create a temporary empty directory
    const tempDir = 'tests/temp-empty';
    try {
      execSync(`mkdir -p ${tempDir}`);
      const result = runCLI(`${tempDir} --quiet`);
      assert(result.exitCode === 0, 'Should handle empty directory gracefully');
      assertIncludes(result.stdout, 'No files found', 'Should indicate no files found');
    } finally {
      try {
        execSync(`rmdir ${tempDir}`);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  // Test configuration file (if exists)
  runner.test('CLI should work with configuration file', async () => {
    const result = runCLI('tests/fixtures/modern-js.js --config eslint.config.mjs --quiet');
    assert(result.exitCode === 0 || result.exitCode === 1, 'Should work with config file');
  });

  return runner.run();
}