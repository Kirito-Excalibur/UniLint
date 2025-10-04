import chalk from 'chalk';

export function formatTable(results, options = {}) {
  const { quiet = false, baseline = 'all' } = options;

  // Format JavaScript results
  if (results.javascript.length > 0) {
    console.log(chalk.bold.blue('\n📄 JavaScript Files:'));
    console.log(chalk.gray('═'.repeat(80)));
    
    for (const fileResult of results.javascript) {
      formatFileResult(fileResult, { quiet, baseline });
    }
  }

  // Format CSS results
  if (results.css.length > 0) {
    console.log(chalk.bold.blue('\n🎨 CSS Files:'));
    console.log(chalk.gray('═'.repeat(80)));
    
    for (const fileResult of results.css) {
      formatFileResult(fileResult, { quiet, baseline });
    }
  }
}

function formatFileResult(fileResult, options = {}) {
  const { quiet = false } = options;
  
  console.log(`\n${chalk.bold(fileResult.file)}`);
  
  const allIssues = [
    ...fileResult.errors.map(e => ({ ...e, type: 'error' })),
    ...fileResult.warnings.map(w => ({ ...w, type: 'warning' })),
    ...(quiet ? [] : fileResult.info.map(i => ({ ...i, type: 'info' })))
  ];

  if (allIssues.length === 0) {
    console.log(chalk.green('  ✓ No compatibility issues found'));
    return;
  }

  // Sort by line number
  allIssues.sort((a, b) => (a.line || 0) - (b.line || 0));

  for (const issue of allIssues) {
    const icon = getIcon(issue.type);
    const color = getColor(issue.type);
    const location = issue.line ? `${issue.line}:${issue.column || 1}` : '';
    
    console.log(`  ${color(icon)} ${location ? `${chalk.gray(location)} ` : ''}${issue.message}`);
    
    if (issue.description && !quiet) {
      console.log(`    ${chalk.gray(truncateDescription(issue.description))}`);
    }
  }
}

function getIcon(type) {
  switch (type) {
    case 'error': return '✗';
    case 'warning': return '⚠';
    case 'info': return 'ℹ';
    default: return '•';
  }
}

function getColor(type) {
  switch (type) {
    case 'error': return chalk.red;
    case 'warning': return chalk.yellow;
    case 'info': return chalk.blue;
    default: return chalk.gray;
  }
}

function truncateDescription(description, maxLength = 100) {
  if (!description) return '';
  
  // Remove HTML tags
  const cleanDesc = description.replace(/<[^>]*>/g, '');
  
  if (cleanDesc.length <= maxLength) return cleanDesc;
  return cleanDesc.substring(0, maxLength) + '...';
}