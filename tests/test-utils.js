import { writeFileSync, unlinkSync, mkdirSync, rmdirSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import chalk from 'chalk';

export class TestUtils {
  constructor() {
    this.tempFiles = [];
    this.tempDirs = [];
  }

  // File management utilities
  createTempFile(filename, content, dir = 'tests/temp') {
    const fullPath = path.join(dir, filename);
    
    // Ensure directory exists
    try {
      mkdirSync(path.dirname(fullPath), { recursive: true });
    } catch (e) {
      // Directory might already exist
    }
    
    writeFileSync(fullPath, content);
    this.tempFiles.push(fullPath);
    return fullPath;
  }

  createTempDir(dirname) {
    const fullPath = path.join('tests/temp', dirname);
    mkdirSync(fullPath, { recursive: true });
    this.tempDirs.push(fullPath);
    return fullPath;
  }

  cleanup() {
    // Clean up temp files
    for (const file of this.tempFiles) {
      try {
        unlinkSync(file);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    // Clean up temp directories
    for (const dir of this.tempDirs) {
      try {
        rmdirSync(dir, { recursive: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    // Try to remove main temp directory
    try {
      rmdirSync('tests/temp', { recursive: true });
    } catch (e) {
      // Ignore cleanup errors
    }

    this.tempFiles = [];
    this.tempDirs = [];
  }

  // Test data generators
  generateJavaScriptFile(features = [], size = 'small') {
    const featureMap = {
      fetch: 'fetch("/api/data").then(r => r.json());',
      promise: 'Promise.resolve(42).then(console.log);',
      console: 'console.log("Hello World");',
      async: 'async function test() { await fetch("/api"); }',
      arrow: 'const fn = () => console.log("arrow");',
      destructuring: 'const {a, b} = {a: 1, b: 2};',
      spread: 'const arr = [...[1, 2, 3]];',
      template: 'const str = `Hello ${name}`;',
      class: 'class Test { constructor() {} }',
      modules: 'import { test } from "./module.js";'
    };

    let content = '// Generated test file\n';
    
    // Add requested features
    for (const feature of features) {
      if (featureMap[feature]) {
        content += featureMap[feature] + '\n';
      }
    }

    // Add bulk content based on size
    if (size === 'large') {
      for (let i = 0; i < 100; i++) {
        content += `const var${i} = fetch('/api/endpoint${i}');\n`;
        content += `console.log('Line ${i}');\n`;
      }
    } else if (size === 'medium') {
      for (let i = 0; i < 20; i++) {
        content += `const var${i} = console.log('Test ${i}');\n`;
      }
    }

    return content;
  }

  generateCSSFile(features = [], size = 'small') {
    const featureMap = {
      grid: '.grid { display: grid; grid-template-columns: 1fr 1fr; }',
      flex: '.flex { display: flex; justify-content: center; }',
      transform: '.transform { transform: rotate(45deg); }',
      transition: '.transition { transition: all 0.3s ease; }',
      animation: '@keyframes fade { from {opacity: 0} to {opacity: 1} }',
      filter: '.filter { filter: blur(5px); backdrop-filter: blur(10px); }',
      container: '@container (min-width: 400px) { .card { flex-direction: row; } }',
      aspect: '.aspect { aspect-ratio: 16/9; }',
      gap: '.gap { gap: 1rem; }',
      logical: '.logical { margin-inline-start: 1rem; }'
    };

    let content = '/* Generated CSS test file */\n';
    
    // Add requested features
    for (const feature of features) {
      if (featureMap[feature]) {
        content += featureMap[feature] + '\n';
      }
    }

    // Add bulk content based on size
    if (size === 'large') {
      for (let i = 0; i < 100; i++) {
        content += `.class${i} { display: grid; gap: ${i}px; }\n`;
      }
    } else if (size === 'medium') {
      for (let i = 0; i < 20; i++) {
        content += `.class${i} { display: flex; }\n`;
      }
    }

    return content;
  }

  // CLI testing utilities
  runCLI(args, options = {}) {
    const command = `node bin/unilint.js ${args}`;
    try {
      const result = execSync(command, { 
        encoding: 'utf-8',
        cwd: process.cwd(),
        timeout: 30000, // 30 second timeout
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

  // Performance measurement
  async measurePerformance(fn, iterations = 1) {
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    return {
      min: Math.min(...times),
      max: Math.max(...times),
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      total: times.reduce((a, b) => a + b, 0),
      times
    };
  }

  // Memory measurement
  measureMemory() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage();
    }
    return { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 };
  }

  // Assertion utilities
  static assert(condition, message = 'Assertion failed') {
    if (!condition) {
      throw new Error(message);
    }
  }

  static assertEqual(actual, expected, message = 'Values are not equal') {
    if (actual !== expected) {
      throw new Error(`${message}. Expected: ${expected}, Actual: ${actual}`);
    }
  }

  static assertArrayIncludes(array, item, message = 'Array does not include item') {
    if (!Array.isArray(array) || !array.includes(item)) {
      throw new Error(`${message}. Array: ${JSON.stringify(array)}, Item: ${item}`);
    }
  }

  static assertObjectHasProperty(obj, prop, message = 'Object does not have property') {
    if (typeof obj !== 'object' || obj === null || !(prop in obj)) {
      throw new Error(`${message}. Object: ${JSON.stringify(obj)}, Property: ${prop}`);
    }
  }

  static assertThrows(fn, message = 'Function should throw') {
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

  static assertIncludes(text, substring, message = 'Text does not include substring') {
    if (typeof text !== 'string' || !text.includes(substring)) {
      throw new Error(`${message}. Text: "${text}", Substring: "${substring}"`);
    }
  }

  static assertExitCode(actual, expected, message = 'Exit code mismatch') {
    if (actual !== expected) {
      throw new Error(`${message}. Expected: ${expected}, Actual: ${actual}`);
    }
  }

  // JSON validation
  static validateJSON(jsonString) {
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      throw new Error(`Invalid JSON: ${e.message}`);
    }
  }

  // Result structure validation
  static validateResultStructure(result, expectedType) {
    TestUtils.assert(typeof result === 'object', 'Result should be an object');
    TestUtils.assertObjectHasProperty(result, 'file', 'Result should have file property');
    TestUtils.assertEqual(result.type, expectedType, `Result type should be ${expectedType}`);
    TestUtils.assert(Array.isArray(result.features), 'Result should have features array');
    TestUtils.assert(Array.isArray(result.errors), 'Result should have errors array');
    TestUtils.assert(Array.isArray(result.warnings), 'Result should have warnings array');
    TestUtils.assert(Array.isArray(result.info), 'Result should have info array');
  }

  static validateFeatureStructure(feature) {
    TestUtils.assert(typeof feature === 'object', 'Feature should be an object');
    TestUtils.assertObjectHasProperty(feature, 'name', 'Feature should have name');
    TestUtils.assert(typeof feature.name === 'string', 'Feature name should be string');
    TestUtils.assert(typeof feature.line === 'number', 'Feature should have line number');
    TestUtils.assert(typeof feature.column === 'number', 'Feature should have column number');
  }

  // Test reporting
  static formatTestResult(name, passed, duration, error = null) {
    const status = passed ? chalk.green('✓ PASSED') : chalk.red('✗ FAILED');
    const time = duration ? chalk.gray(`(${duration.toFixed(2)}ms)`) : '';
    const errorMsg = error ? chalk.red(`\n    Error: ${error.message}`) : '';
    
    return `  ${status} ${name} ${time}${errorMsg}`;
  }

  // Coverage tracking (basic)
  static trackCoverage() {
    // This is a simple coverage tracker
    // In a real project, you'd use a proper coverage tool like c8 or nyc
    return {
      files: new Set(),
      functions: new Set(),
      lines: new Set(),
      
      addFile(filename) {
        this.files.add(filename);
      },
      
      addFunction(functionName) {
        this.functions.add(functionName);
      },
      
      addLine(filename, lineNumber) {
        this.lines.add(`${filename}:${lineNumber}`);
      },
      
      getReport() {
        return {
          filesCount: this.files.size,
          functionsCount: this.functions.size,
          linesCount: this.lines.size,
          files: Array.from(this.files),
          functions: Array.from(this.functions),
          lines: Array.from(this.lines)
        };
      }
    };
  }
}

// Export singleton instance for convenience
export const testUtils = new TestUtils();

// Export assertion functions for direct use
export const {
  assert,
  assertEqual,
  assertArrayIncludes,
  assertObjectHasProperty,
  assertThrows,
  assertIncludes,
  assertExitCode,
  validateJSON,
  validateResultStructure,
  validateFeatureStructure,
  formatTestResult,
  trackCoverage
} = TestUtils;