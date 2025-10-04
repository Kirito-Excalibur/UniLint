# Unilint CLI Documentation

## Installation

```bash
# Global installation
npm install -g unilint

# Local installation  
npm install unilint --save-dev
```

## Basic Usage

```bash
# Lint current directory
unilint

# Lint specific files
unilint src/app.js styles/main.css

# Lint with patterns
unilint "src/**/*.js" "styles/**/*.css"
```

## Command Line Options

### Files and Patterns
- `[files...]` - Files or glob patterns to lint
- If no files specified, lints current directory

### Output Options
- `-f, --format <type>` - Output format
  - `table` (default) - Formatted table output
  - `json` - JSON format for programmatic use
  - `compact` - Compact one-line-per-issue format

### Filtering Options
- `--js-only` - Only analyze JavaScript files
- `--css-only` - Only analyze CSS files
- `--baseline <level>` - Filter by baseline compatibility level
  - `all` (default) - Show all features
  - `high` - Only widely available features
  - `low` - Only newly available features  
  - `false` - Only limited availability features

### Configuration Options
- `--config <path>` - Path to custom configuration file
- `--ignore-pattern <pattern>` - Ignore files matching glob pattern

### Output Control
- `--quiet` - Only show errors, suppress warnings and info
- `--verbose` - Show detailed output including descriptions

### Utility Options
- `-V, --version` - Show version number
- `-h, --help` - Show help information

## Examples

### Basic Linting
```bash
# Lint all files in src directory
unilint src/

# Lint specific file types
unilint "**/*.js" "**/*.css"
```

### Baseline Filtering
```bash
# Show only features with limited browser support
unilint --baseline false src/

# Show only newly available features
unilint --baseline low src/
```

### Output Formats
```bash
# JSON output for CI/CD integration
unilint --format json src/ > baseline-report.json

# Compact format for quick scanning
unilint --format compact src/

# Quiet mode for error-only output
unilint --quiet src/
```

### File Type Filtering
```bash
# Only check JavaScript files
unilint --js-only src/

# Only check CSS files  
unilint --css-only styles/

# Ignore test files
unilint --ignore-pattern "**/*.test.js" src/
```

### Configuration
```bash
# Use custom ESLint config
unilint --config ./my-eslint.config.mjs src/

# Verbose output with descriptions
unilint --verbose src/
```

## Exit Codes

- `0` - No errors found
- `1` - Errors found or execution failed

## Integration Examples

### Package.json Scripts
```json
{
  "scripts": {
    "lint:baseline": "unilint src/",
    "lint:baseline:errors": "unilint --baseline false src/",
    "lint:baseline:json": "unilint --format json src/ > reports/baseline.json"
  }
}
```

### GitHub Actions
```yaml
- name: Check Baseline Compatibility
  run: |
    npm install -g unilint
    unilint --format json src/ > baseline-report.json
    
- name: Upload Baseline Report
  uses: actions/upload-artifact@v3
  with:
    name: baseline-report
    path: baseline-report.json
```

### Pre-commit Hook
```bash
#!/bin/sh
# .git/hooks/pre-commit
unilint --baseline false --quiet $(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|jsx|ts|tsx|css)$')
```

## Configuration File

Create `unilint.config.js` in your project root:

```javascript
export default {
  include: ["src/**/*.{js,jsx,ts,tsx,css}"],
  exclude: ["node_modules/**", "dist/**"],
  baseline: {
    level: "all",
    treatLimitedAsError: true
  },
  output: {
    format: "table",
    verbose: false
  }
};
```