import chalk from 'chalk';

export function formatCompact(results, options = {}) {
  const { quiet = false } = options;

  const allFiles = [...results.javascript, ...results.css];
  
  for (const fileResult of allFiles) {
    const allIssues = [
      ...fileResult.errors.map(e => ({ ...e, type: 'error' })),
      ...fileResult.warnings.map(w => ({ ...w, type: 'warning' })),
      ...(quiet ? [] : fileResult.info.map(i => ({ ...i, type: 'info' })))
    ];

    if (allIssues.length === 0) continue;

    for (const issue of allIssues) {
      const color = getColor(issue.type);
      const location = issue.line ? `${issue.line}:${issue.column || 1}` : '';
      const prefix = `${fileResult.file}${location ? `:${location}` : ''}`;
      
      console.log(`${prefix} ${color(issue.type)}: ${issue.message}`);
    }
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