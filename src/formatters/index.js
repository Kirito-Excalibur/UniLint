import chalk from 'chalk';
import { formatTable } from './table-formatter.js';
import { formatJSON } from './json-formatter.js';
import { formatCompact } from './compact-formatter.js';

export function formatResults(results, options = {}) {
  const { format = 'table', quiet = false, verbose = false } = options;

  switch (format) {
    case 'json':
      formatJSON(results, options);
      break;
    case 'compact':
      formatCompact(results, options);
      break;
    case 'table':
    default:
      formatTable(results, options);
      break;
  }

  // Print summary
  if (!quiet) {
    printSummary(results.summary);
  }
}

function printSummary(summary) {
  console.log('\n' + chalk.bold('Summary:'));
  console.log(chalk.gray('─'.repeat(50)));
  
  console.log(`Files analyzed: ${chalk.blue(summary.totalFiles)}`);
  console.log(`JavaScript files: ${chalk.blue(summary.jsFiles)}`);
  console.log(`CSS files: ${chalk.blue(summary.cssFiles)}`);
  
  if (summary.errors > 0) {
    console.log(`Errors: ${chalk.red(summary.errors)}`);
  }
  
  if (summary.warnings > 0) {
    console.log(`Warnings: ${chalk.yellow(summary.warnings)}`);
  }
  
  if (summary.errors === 0 && summary.warnings === 0) {
    console.log(chalk.green('✓ No compatibility issues found!'));
  }
}