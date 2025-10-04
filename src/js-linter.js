import { execSync } from 'child_process';
import { features } from 'web-features';
import { readFileSync } from 'fs';
import path from 'path';

export async function lintJavaScript(filePath, options = {}) {
  const { baseline = 'all', verbose = false } = options;

  const result = {
    file: filePath,
    type: 'javascript',
    features: [],
    errors: [],
    warnings: [],
    info: []
  };

  try {
    // Run ESLint with our custom plugin
    const eslintConfig = path.resolve('eslint.config.mjs');
    const command = `npx eslint --config ${eslintConfig} --format json "${filePath}"`;

    let eslintOutput;
    try {
      eslintOutput = execSync(command, { encoding: 'utf-8' });
    } catch (error) {
      // ESLint returns non-zero exit code when issues are found
      eslintOutput = error.stdout || '[]';
    }

    const eslintResults = JSON.parse(eslintOutput);

    if (eslintResults.length > 0) {
      const fileResult = eslintResults[0];

      // Process ESLint messages to extract baseline information
      for (const message of fileResult.messages || []) {
        if (message.ruleId === 'ids/collect-identifiers') {
          const displayName = extractFeatureName(message.message);

          // Skip common JavaScript variables that might be confused with HTML elements
          const skipIdentifiers = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
            'data', 'target', 'source', 'input', 'output', 'value', 'key', 'item', 'element', 'node', 'result', 'response'];

          if (skipIdentifiers.includes(displayName.toLowerCase())) {
            continue;
          }

          // Try to find the feature by display name or convert to feature key
          let featureData = null;
          let featureKey = displayName;

          // First try direct lookup
          featureData = features[displayName];

          // If not found, try converting display name to feature key
          if (!featureData) {
            // Handle syntax-based features
            const syntaxMappings = {
              'let declaration': 'let-const',
              'const declaration': 'let-const',
              'class declaration': 'class-syntax',
              'class expression': 'class-syntax',
              'function declaration': 'functions',
              'function expression': 'functions',
              'arrow function': 'functions',
              'async function': 'async-await',
              'async function expression': 'async-await',
              'async arrow function': 'async-await',
              'await expression': 'async-await',
              'generator function': 'generators',
              'generator expression': 'generators',
              'async generator function': 'async-generators',
              'async generator expression': 'async-generators',
              'yield expression': 'generators',
              'object destructuring': 'destructuring',
              'array destructuring': 'destructuring',
              'spread syntax': 'spread',
              'template literal': 'template-literals',
              'for...of loop': 'iterators',
              'for await...of loop': 'async-iterators',
              'BigInt literal': 'bigint',
              'nullish coalescing operator': 'nullish-coalescing',
              'optional chaining': 'optional-chaining',
              'optional catch binding': 'optional-catch-binding'
            };

            // Check syntax mappings
            if (syntaxMappings[displayName]) {
              featureKey = syntaxMappings[displayName];
              featureData = features[featureKey];
            }
            // Handle constructor patterns like 'new Array()' -> 'array'
            else if (displayName.startsWith('new ') && displayName.endsWith('()')) {
              const constructorName = displayName.slice(4, -2); // Remove 'new ' and '()'
              const constructorMappings = {
                'Array': 'array',
                'Set': 'set-methods',
                'Map': 'map',
                'WeakMap': 'weakmap',
                'WeakSet': 'weakset',
                'Promise': 'promise',
                'Proxy': 'proxy-reflect',
                'Symbol': 'symbol',
                'BigInt': 'bigint',
                'Int8Array': 'typed-arrays',
                'Uint8Array': 'typed-arrays',
                'Int16Array': 'typed-arrays',
                'Uint16Array': 'typed-arrays',
                'Int32Array': 'typed-arrays',
                'Uint32Array': 'typed-arrays',
                'Float32Array': 'typed-arrays',
                'Float64Array': 'typed-arrays',
                'BigInt64Array': 'bigint64array',
                'BigUint64Array': 'bigint64array'
              };

              if (constructorMappings[constructorName]) {
                featureKey = constructorMappings[constructorName];
                featureData = features[featureKey];
              }
            }
            // Handle Object methods like Object.create() -> object-object
            else if (displayName.startsWith('Object.')) {
              // Most Object methods map to the general 'object-object' feature
              featureKey = 'object-object';
              featureData = features[featureKey];

              // If not found, try specific method mappings
              if (!featureData) {
                const methodName = displayName.replace('Object.', '').replace('()', '');
                featureKey = `object-${methodName.toLowerCase()}`;
                featureData = features[featureKey];

                // If still not found, try without object prefix
                if (!featureData) {
                  featureKey = methodName.toLowerCase();
                  featureData = features[featureKey];
                }
              }
            }
            // Convert Promise.try() -> promise-try
            else if (displayName.includes('.') && displayName.includes('()')) {
              const cleanName = displayName.replace('()', '');
              featureKey = cleanName.toLowerCase().replace('.', '-');
              featureData = features[featureKey];
            }
            // Convert Promise.try -> promise-try
            else if (displayName.includes('.')) {
              featureKey = displayName.toLowerCase().replace('.', '-');
              featureData = features[featureKey];
            }
            // Handle global functions like escape, unescape
            else if (['escape', 'unescape'].includes(displayName)) {
              featureKey = 'escape-unescape';
              featureData = features[featureKey];
            }
            // Handle Symbol() constructor call
            else if (displayName === 'Symbol()') {
              featureKey = 'symbol';
              featureData = features[featureKey];
            }
          }

          if (featureData) {
            const baselineStatus = featureData.status?.baseline;
            const featureInfo = {
              name: featureKey,
              displayName: featureData.name || displayName,
              baseline: baselineStatus,
              line: message.line,
              column: message.column,
              description: featureData.description_html || featureData.description
            };

            result.features.push(featureInfo);

            // Categorize based on baseline status and filter
            if (shouldIncludeFeature(baselineStatus, baseline)) {
              const messageObj = {
                ...featureInfo,
                message: `'${displayName}' is baseline ${getBaselineDescription(baselineStatus)}`,
                severity: getBaselineSeverity(baselineStatus)
              };

              switch (messageObj.severity) {
                case 'error':
                  result.errors.push(messageObj);
                  break;
                case 'warning':
                  result.warnings.push(messageObj);
                  break;
                default:
                  result.info.push(messageObj);
              }
            }
          }
        }
      }
    }

  } catch (error) {
    result.errors.push({
      message: `Failed to analyze file: ${error.message}`,
      severity: 'error'
    });
  }

  return result;
}

function extractFeatureName(message) {
  const match = message.match(/'([^']+)'/);
  return match ? match[1] : '';
}

function getBaselineDescription(baseline) {
  switch (baseline) {
    case 'high': return 'widely available';
    case 'low': return 'newly available';
    case false: return 'limited availability';
    default: return 'unknown status';
  }
}

function getBaselineSeverity(baseline) {
  switch (baseline) {
    case false: return 'error';
    case 'low': return 'warning';
    case 'high': return 'info';
    default: return 'info';
  }
}

function shouldIncludeFeature(baseline, filter) {
  if (filter === 'all') return true;
  return baseline === filter || (filter === 'false' && baseline === false);
}