import { unilint } from '../../src/index.js';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { performance } from 'perf_hooks';

export class PerformanceTestRunner {
  constructor() {
    this.tests = [];
    this.results = [];
  }

  test(name, testFn, options = {}) {
    this.tests.push({ name, testFn, options });
  }

  async run() {
    console.log(chalk.blue('⚡ Running Performance Tests\n'));
    
    for (const { name, testFn, options } of this.tests) {
      try {
        console.log(chalk.yellow(`Running: ${name}`));
        
        const startTime = performance.now();
        await testFn();
        const endTime = performance.now();
        
        const duration = endTime - startTime;
        const threshold = options.threshold || 5000; // 5 seconds default
        
        if (duration > threshold) {
          console.log(chalk.red(`⚠ SLOW (${duration.toFixed(2)}ms > ${threshold}ms threshold)\n`));
        } else {
          console.log(chalk.green(`✓ FAST (${duration.toFixed(2)}ms)\n`));
        }
        
        this.results.push({ name, duration, threshold, passed: duration <= threshold });
        
      } catch (error) {
        console.log(chalk.red(`✗ FAILED: ${error.message}\n`));
        this.results.push({ name, duration: -1, threshold: -1, passed: false, error: error.message });
      }
    }

    this.printSummary();
    return this.results.every(r => r.passed);
  }

  printSummary() {
    console.log(chalk.bold('\n📊 Performance Test Summary:'));
    console.log(chalk.gray('─'.repeat(50)));
    
    for (const result of this.results) {
      if (result.error) {
        console.log(`${chalk.red('✗')} ${result.name}: ${chalk.red('ERROR')}`);
      } else if (result.passed) {
        console.log(`${chalk.green('✓')} ${result.name}: ${chalk.green(result.duration.toFixed(2) + 'ms')}`);
      } else {
        console.log(`${chalk.red('⚠')} ${result.name}: ${chalk.red(result.duration.toFixed(2) + 'ms')} (>${result.threshold}ms)`);
      }
    }
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    console.log(`\nPassed: ${chalk.green(passed)}/${total}`);
  }
}

// Performance test utilities
function createLargeJSFile(filename, size = 1000) {
  const content = `
// Large test file with ${size} lines
${Array.from({ length: size }, (_, i) => `
const variable${i} = fetch('/api/endpoint${i}');
const promise${i} = Promise.resolve(${i});
const result${i} = console.log('Line ${i}');
`).join('\n')}
`;
  
  return { filename, content, cleanup: () => {} };
}

function measureMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage();
  }
  return { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 };
}

// Performance tests
export async function runPerformanceTests() {
  const runner = new PerformanceTestRunner();

  // Test single file analysis speed
  runner.test('Single file analysis should be fast', async () => {
    await unilint(['tests/fixtures/modern-js.js'], { 
      format: 'json', 
      quiet: true 
    });
  }, { threshold: 3000 }); // 3 seconds

  // Test multiple files analysis
  runner.test('Multiple files analysis should be reasonable', async () => {
    await unilint(['tests/fixtures/'], { 
      format: 'json', 
      quiet: true 
    });
  }, { threshold: 5000 }); // 5 seconds

  // Test large file handling
  runner.test('Large file analysis should complete', async () => {
    const { filename, content } = createLargeJSFile('large-test.js', 500);
    
    // Write temporary large file
    const fs = await import('fs');
    fs.writeFileSync(filename, content);
    
    try {
      await unilint([filename], { 
        format: 'json', 
        quiet: true 
      });
    } finally {
      // Cleanup
      try {
        fs.unlinkSync(filename);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }, { threshold: 10000 }); // 10 seconds for large file

  // Test CLI startup time
  runner.test('CLI startup should be fast', async () => {
    execSync('node bin/unilint.js --version', { encoding: 'utf-8' });
  }, { threshold: 2000 }); // 2 seconds

  // Test memory usage during analysis
  runner.test('Memory usage should be reasonable', async () => {
    const beforeMemory = measureMemoryUsage();
    
    await unilint(['tests/fixtures/'], { 
      format: 'json', 
      quiet: true 
    });
    
    const afterMemory = measureMemoryUsage();
    const memoryIncrease = afterMemory.heapUsed - beforeMemory.heapUsed;
    
    // Memory increase should be less than 100MB
    if (memoryIncrease > 100 * 1024 * 1024) {
      throw new Error(`Memory usage too high: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB increase`);
    }
  }, { threshold: 5000 });

  // Test concurrent file processing
  runner.test('Concurrent analysis should be efficient', async () => {
    const files = [
      'tests/fixtures/modern-js.js',
      'tests/fixtures/legacy-js.js',
      'tests/fixtures/modern-css.css'
    ];
    
    // Run multiple analyses concurrently
    const promises = files.map(file => 
      unilint([file], { format: 'json', quiet: true })
    );
    
    await Promise.all(promises);
  }, { threshold: 8000 }); // 8 seconds for concurrent processing

  // Test baseline filtering performance
  runner.test('Baseline filtering should not significantly impact performance', async () => {
    const startTime = performance.now();
    
    await unilint(['tests/fixtures/modern-js.js'], { 
      baseline: 'all',
      format: 'json', 
      quiet: true 
    });
    
    const allTime = performance.now() - startTime;
    
    const startTimeFiltered = performance.now();
    
    await unilint(['tests/fixtures/modern-js.js'], { 
      baseline: 'high',
      format: 'json', 
      quiet: true 
    });
    
    const filteredTime = performance.now() - startTimeFiltered;
    
    // Filtered analysis should not be more than 50% slower
    if (filteredTime > allTime * 1.5) {
      throw new Error(`Filtering too slow: ${filteredTime.toFixed(2)}ms vs ${allTime.toFixed(2)}ms`);
    }
  }, { threshold: 6000 });

  // Test error handling performance
  runner.test('Error handling should not cause significant delays', async () => {
    await unilint(['tests/fixtures/error-test.js'], { 
      format: 'json', 
      quiet: true 
    });
  }, { threshold: 4000 }); // 4 seconds even with errors

  return runner.run();
}