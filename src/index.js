import { lintJavaScript } from './js-linter.js';
import { lintCSS } from './css-linter.js';
import { formatResults } from './formatters/index.js';
import { resolveFiles } from './utils/file-resolver.js';
import chalk from 'chalk';

export async function unilint(files = [], options = {}) {
  const {
    format = 'table',
    jsOnly = false,
    cssOnly = false,
    baseline = 'all',
    quiet = false,
    verbose = false
  } = options;

  // Default to current directory if no files specified
  if (files.length === 0) {
    files = ['.'];
  }

  console.log(chalk.blue('🔍 Unilint - Web Feature Baseline Compatibility Checker\n'));

  try {
    // Resolve file patterns to actual files
    const resolvedFiles = await resolveFiles(files, options);
    
    if (resolvedFiles.length === 0) {
      console.log(chalk.yellow('No files found to lint.'));
      return { hasErrors: false, results: [] };
    }

    if (verbose) {
      console.log(chalk.gray(`Found ${resolvedFiles.length} files to analyze\n`));
    }

    const results = {
      javascript: [],
      css: [],
      summary: {
        totalFiles: resolvedFiles.length,
        jsFiles: 0,
        cssFiles: 0,
        errors: 0,
        warnings: 0
      }
    };

    // Separate JS and CSS files
    const jsFiles = resolvedFiles.filter(file => 
      /\.(js|jsx|ts|tsx|mjs|cjs)$/i.test(file) && !cssOnly
    );
    const cssFiles = resolvedFiles.filter(file => 
      /\.(css|scss|sass|less)$/i.test(file) && !jsOnly
    );

    results.summary.jsFiles = jsFiles.length;
    results.summary.cssFiles = cssFiles.length;

    // Lint JavaScript files
    if (jsFiles.length > 0) {
      if (verbose) console.log(chalk.blue('Analyzing JavaScript files...'));
      for (const file of jsFiles) {
        const jsResult = await lintJavaScript(file, { baseline, verbose });
        results.javascript.push(jsResult);
        results.summary.errors += jsResult.errors.length;
        results.summary.warnings += jsResult.warnings.length;
      }
    }

    // Lint CSS files
    if (cssFiles.length > 0) {
      if (verbose) console.log(chalk.blue('Analyzing CSS files...'));
      for (const file of cssFiles) {
        const cssResult = await lintCSS(file, { baseline, verbose });
        results.css.push(cssResult);
        results.summary.errors += cssResult.errors.length;
        results.summary.warnings += cssResult.warnings.length;
      }
    }

    // Format and display results
    formatResults(results, { format, quiet, verbose, baseline });

    return {
      hasErrors: results.summary.errors > 0,
      results
    };

  } catch (error) {
    console.error(chalk.red('Error during linting:'), error.message);
    throw error;
  }
}