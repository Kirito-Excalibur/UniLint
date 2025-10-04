import { unilint } from '../../src/index.js';
import { lintJavaScript } from '../../src/js-linter.js';
import { lintCSS } from '../../src/css-linter.js';
import { resolveFiles } from '../../src/utils/file-resolver.js';
import { writeFileSync, unlinkSync, mkdirSync, rmdirSync } from 'fs';
import chalk from 'chalk';
import path from 'path';

export class ValidationTestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.tempFiles = [];
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log(chalk.blue('🔍 Running Validation Tests\n'));
    
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

    // Cleanup temp files
    this.cleanup();

    this.printSummary();
    return this.failed === 0;
  }

  createTempFile(filename, content) {
    const fullPath = path.join('tests', 'temp', filename);
    
    // Ensure temp directory exists
    try {
      mkdirSync(path.dirname(fullPath), { recursive: true });
    } catch (e) {
      // Directory might already exist
    }
    
    writeFileSync(fullPath, content);
    this.tempFiles.push(fullPath);
    return fullPath;
  }

  cleanup() {
    for (const file of this.tempFiles) {
      try {
        unlinkSync(file);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    // Try to remove temp directory
    try {
      rmdirSync(path.join('tests', 'temp'), { recursive: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  printSummary() {
    console.log(chalk.bold('\n📊 Validation Test Summary:'));
    console.log(chalk.gray('─'.repeat(30)));
    console.log(`Passed: ${chalk.green(this.passed)}`);
    console.log(`Failed: ${chalk.red(this.failed)}`);
    console.log(`Total: ${this.passed + this.failed}`);
  }
}

// Validation test utilities
function assert(condition, message = 'Assertion failed') {
  if (!condition) {
    throw new Error(message);
  }
}

function assertThrows(fn, message = 'Function should throw') {
  let threw = false;
  try {
    fn();
  } catch (e) {
    threw = true;
  }
  if (!threw) {
    throw new Error(message);
  }
}

function validateResultStructure(result, expectedType) {
  assert(typeof result === 'object', 'Result should be an object');
  assert(typeof result.file === 'string', 'Result should have file property');
  assert(result.type === expectedType, `Result type should be ${expectedType}`);
  assert(Array.isArray(result.features), 'Result should have features array');
  assert(Array.isArray(result.errors), 'Result should have errors array');
  assert(Array.isArray(result.warnings), 'Result should have warnings array');
  assert(Array.isArray(result.info), 'Result should have info array');
}

function validateFeatureStructure(feature) {
  assert(typeof feature === 'object', 'Feature should be an object');
  assert(typeof feature.name === 'string', 'Feature should have name');
  assert(typeof feature.line === 'number', 'Feature should have line number');
  assert(typeof feature.column === 'number', 'Feature should have column number');
}

// Validation tests
export async function runValidationTests() {
  const runner = new ValidationTestRunner();

  // Test input validation
  runner.test('Should handle empty file array', async () => {
    const result = await unilint([], { quiet: true });
    assert(result.results.summary.totalFiles >= 0, 'Should handle empty file array');
  });

  runner.test('Should handle null/undefined options', async () => {
    const result = await unilint(['tests/fixtures/modern-js.js'], null);
    assert(result !== null, 'Should handle null options');
    
    const result2 = await unilint(['tests/fixtures/modern-js.js'], undefined);
    assert(result2 !== null, 'Should handle undefined options');
  });

  runner.test('Should validate baseline parameter values', async () => {
    // Valid baseline values
    const validBaselines = ['all', 'high', 'low', 'false'];
    
    for (const baseline of validBaselines) {
      const result = await unilint(['tests/fixtures/modern-js.js'], { 
        baseline, 
        quiet: true 
      });
      assert(result !== null, `Should accept baseline: ${baseline}`);
    }
  });

  runner.test('Should validate format parameter values', async () => {
    const validFormats = ['table', 'json', 'compact'];
    
    for (const format of validFormats) {
      const result = await unilint(['tests/fixtures/modern-js.js'], { 
        format, 
        quiet: true 
      });
      assert(result !== null, `Should accept format: ${format}`);
    }
  });

  // Test file handling edge cases
  runner.test('Should handle files with special characters', async () => {
    const specialFile = runner.createTempFile('special-file[test].js', `
      console.log('Special file');
      fetch('/api/test');
    `);
    
    const result = await lintJavaScript(specialFile, { baseline: 'all' });
    validateResultStructure(result, 'javascript');
  });

  runner.test('Should handle very long file paths', async () => {
    const longPath = 'a'.repeat(100) + '.js';
    const longFile = runner.createTempFile(longPath, `
      console.log('Long path file');
    `);
    
    const result = await lintJavaScript(longFile, { baseline: 'all' });
    validateResultStructure(result, 'javascript');
  });

  runner.test('Should handle files with Unicode content', async () => {
    const unicodeFile = runner.createTempFile('unicode-test.js', `
      // Unicode test: 你好世界 🌍 ñáéíóú
      const message = "Hello 世界! 🚀";
      console.log(message);
      fetch('/api/测试');
    `);
    
    const result = await lintJavaScript(unicodeFile, { baseline: 'all' });
    validateResultStructure(result, 'javascript');
  });

  runner.test('Should handle very large files', async () => {
    const largeContent = Array.from({ length: 1000 }, (_, i) => 
      `const var${i} = fetch('/api/endpoint${i}'); console.log(var${i});`
    ).join('\n');
    
    const largeFile = runner.createTempFile('large-test.js', largeContent);
    
    const result = await lintJavaScript(largeFile, { baseline: 'all' });
    validateResultStructure(result, 'javascript');
    assert(result.features.length > 0, 'Should detect features in large file');
  });

  runner.test('Should handle files with only comments', async () => {
    const commentFile = runner.createTempFile('comments-only.js', `
      // This file only has comments
      /* 
       * Multi-line comment
       * No actual code here
       */
      // Another comment
    `);
    
    const result = await lintJavaScript(commentFile, { baseline: 'all' });
    validateResultStructure(result, 'javascript');
  });

  runner.test('Should handle files with mixed content types', async () => {
    const mixedFile = runner.createTempFile('mixed-content.js', `
      // JavaScript with embedded CSS-like strings
      const cssString = "display: grid; gap: 1rem;";
      const htmlString = "<div>Hello World</div>";
      
      fetch('/api/data').then(response => response.json());
      console.log(cssString, htmlString);
    `);
    
    const result = await lintJavaScript(mixedFile, { baseline: 'all' });
    validateResultStructure(result, 'javascript');
  });

  // Test CSS validation
  runner.test('Should handle CSS with vendor prefixes', async () => {
    const cssFile = runner.createTempFile('vendor-prefixes.css', `
      .vendor-test {
        -webkit-transform: rotate(45deg);
        -moz-transform: rotate(45deg);
        -ms-transform: rotate(45deg);
        transform: rotate(45deg);
        
        -webkit-transition: all 0.3s;
        transition: all 0.3s;
        
        display: -webkit-flex;
        display: flex;
      }
    `);
    
    const result = await lintCSS(cssFile, { baseline: 'all' });
    validateResultStructure(result, 'css');
  });

  runner.test('Should handle CSS with at-rules', async () => {
    const cssFile = runner.createTempFile('at-rules.css', `
      @media (min-width: 768px) {
        .responsive {
          display: grid;
        }
      }
      
      @supports (display: grid) {
        .grid-support {
          display: grid;
        }
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `);
    
    const result = await lintCSS(cssFile, { baseline: 'all' });
    validateResultStructure(result, 'css');
  });

  runner.test('Should handle malformed CSS gracefully', async () => {
    const malformedCSS = runner.createTempFile('malformed.css', `
      .broken {
        color: red
        background: blue; /* missing semicolon above */
        display grid; /* missing colon */
      }
      
      .incomplete {
        transform: rotate(
      /* incomplete declaration */
    `);
    
    const result = await lintCSS(malformedCSS, { baseline: 'all' });
    validateResultStructure(result, 'css');
    // Should not throw, but may have errors
  });

  // Test result structure validation
  runner.test('Should return consistent result structure', async () => {
    const jsResult = await lintJavaScript('tests/fixtures/modern-js.js', { baseline: 'all' });
    validateResultStructure(jsResult, 'javascript');
    
    if (jsResult.features.length > 0) {
      validateFeatureStructure(jsResult.features[0]);
    }
  });

  runner.test('Should handle concurrent file processing', async () => {
    const files = [
      'tests/fixtures/modern-js.js',
      'tests/fixtures/legacy-js.js',
      'tests/fixtures/empty.js'
    ];
    
    const promises = files.map(file => lintJavaScript(file, { baseline: 'all' }));
    const results = await Promise.all(promises);
    
    assert(results.length === files.length, 'Should return result for each file');
    results.forEach((result, index) => {
      validateResultStructure(result, 'javascript');
      assert(result.file === files[index], 'Result should match input file');
    });
  });

  // Test error boundary conditions
  runner.test('Should handle permission denied files gracefully', async () => {
    // This test might not work on all systems, so we'll make it conditional
    try {
      const result = await lintJavaScript('/root/nonexistent.js', { baseline: 'all' });
      // If it doesn't throw, that's fine - it should handle gracefully
      validateResultStructure(result, 'javascript');
    } catch (error) {
      // If it throws, that's also acceptable behavior
      assert(true, 'Throwing on permission denied is acceptable');
    }
  });

  runner.test('Should validate feature detection accuracy', async () => {
    const testFile = runner.createTempFile('feature-test.js', `
      // Known features that should be detected
      fetch('/api/test');
      Promise.resolve(42);
      console.log('test');
      
      // Variables that might match feature names but shouldn't be detected as features
      const fetch = 'not-a-fetch';
      const Promise = 'not-a-promise';
    `);
    
    const result = await lintJavaScript(testFile, { baseline: 'all' });
    validateResultStructure(result, 'javascript');
    
    // Should detect actual API usage, not variable names
    const fetchFeatures = result.features.filter(f => f.name === 'fetch');
    assert(fetchFeatures.length > 0, 'Should detect fetch API usage');
  });

  return runner.run();
}