#!/usr/bin/env node

import { program } from 'commander';
import { unilint } from '../src/index.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf8')
);

program
  .name('unilint')
  .description('A unified linting tool that checks JavaScript and CSS for web feature baseline compatibility')
  .version(packageJson.version);

program
  .argument('[files...]', 'Files or glob patterns to lint')
  .option('-f, --format <type>', 'Output format (json, table, compact)', 'table')
  .option('--js-only', 'Only lint JavaScript files')
  .option('--css-only', 'Only lint CSS files')
  .option('--baseline <level>', 'Filter by baseline level (high, low, false)', 'all')
  .option('--config <path>', 'Path to configuration file')
  .option('--ignore-pattern <pattern>', 'Ignore files matching pattern')
  .option('--quiet', 'Only show errors, suppress warnings')
  .option('--verbose', 'Show detailed output')
  .action(async (files, options) => {
    try {
      const results = await unilint(files, options);
      process.exit(results.hasErrors ? 1 : 0);
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program.parse();