import { glob } from 'glob';
import { statSync } from 'fs';
import path from 'path';

export async function resolveFiles(patterns, options = {}) {
  const { ignorePattern } = options;
  const resolvedFiles = new Set();

  for (const pattern of patterns) {
    try {
      // Check if it's a directory
      const stat = statSync(pattern);
      if (stat.isDirectory()) {
        // Add default patterns for directories
        const dirPatterns = [
          path.join(pattern, '**/*.{js,jsx,ts,tsx,mjs,cjs}'),
          path.join(pattern, '**/*.{css,scss,sass,less}')
        ];
        
        for (const dirPattern of dirPatterns) {
          const files = await glob(dirPattern, {
            ignore: getIgnorePatterns(ignorePattern)
          });
          files.forEach(file => resolvedFiles.add(file));
        }
      } else {
        // It's a file
        resolvedFiles.add(pattern);
      }
    } catch (error) {
      // Treat as glob pattern
      const files = await glob(pattern, {
        ignore: getIgnorePatterns(ignorePattern)
      });
      files.forEach(file => resolvedFiles.add(file));
    }
  }

  return Array.from(resolvedFiles).sort();
}

function getIgnorePatterns(customIgnore) {
  const defaultIgnores = [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    'coverage/**',
    '*.min.js',
    '*.min.css',
    '.next/**',
    '.nuxt/**',
    '.vscode/**',
    '.idea/**'
  ];

  if (customIgnore) {
    return [...defaultIgnores, customIgnore];
  }

  return defaultIgnores;
}