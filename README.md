# Unilint

A unified linting tool that checks JavaScript and CSS files for web feature baseline compatibility. Unilint helps you identify which web features you're using and their browser support status according to the [Web Platform Baseline](https://web.dev/baseline/).

## Features

- 🔍 **Unified Analysis**: Lint both JavaScript and CSS files in a single command
- 📊 **Baseline Compatibility**: Check web features against Baseline compatibility data
- 🎨 **Multiple Output Formats**: Table, JSON, and compact formats
- 🚀 **CLI Tool**: Easy to use command-line interface
- 📦 **Package Ready**: Can be used as a dependency in other projects
- ⚡ **Fast**: Leverages ESLint and CSSlint for efficient analysis

## Installation

### Global Installation
```bash
npm install -g unilint
```

### Local Installation
```bash
npm install unilint --save-dev
```

## Usage

### Basic Usage

```bash
# Lint current directory
unilint

# Lint specific files
unilint src/app.js styles/main.css

# Lint with glob patterns
unilint "src/**/*.js" "styles/**/*.css"
```

### Options

```bash
unilint [files...] [options]
```

#### Options:
- `-f, --format <type>` - Output format: `table` (default), `json`, `compact`
- `--js-only` - Only lint JavaScript files
- `--css-only` - Only lint CSS files  
- `--baseline <level>` - Filter by baseline level: `all` (default), `high`, `low`, `false`
- `--config <path>` - Path to configuration file
- `--ignore-pattern <pattern>` - Ignore files matching pattern
- `--quiet` - Only show errors, suppress warnings
- `--verbose` - Show detailed output
- `-V, --version` - Show version number
- `-h, --help` - Show help

### Examples

```bash
# Check only newly available features (baseline: low)
unilint --baseline low src/

# Output results as JSON
unilint --format json src/app.js

# Only check JavaScript files with verbose output
unilint --js-only --verbose src/

# Ignore test files
unilint --ignore-pattern "**/*.test.js" src/

# Quiet mode (errors only)
unilint --quiet src/
```

## Baseline Levels

Unilint categorizes web features based on their Baseline compatibility:

- **🟢 High (Widely Available)**: Features supported across all major browsers
- **🟡 Low (Newly Available)**: Features recently added to Baseline
- **🔴 False (Limited Availability)**: Features not yet in Baseline

## Output Formats

### Table Format (Default)
```
🔍 Unilint - Web Feature Baseline Compatibility Checker

📄 JavaScript Files:
════════════════════════════════════════════════════════════════════════════════

src/app.js
  ⚠ 12:5 'fetch' is baseline newly available
  ✗ 25:10 'Promise.any' is baseline limited availability

Summary:
──────────────────────────────────────────────────────
Files analyzed: 2
JavaScript files: 1
CSS files: 1
Warnings: 1
Errors: 1
```

### JSON Format
```bash
unilint --format json src/
```
```json
{
  "javascript": [...],
  "css": [...],
  "summary": {
    "totalFiles": 2,
    "jsFiles": 1,
    "cssFiles": 1,
    "errors": 1,
    "warnings": 1
  }
}
```

### Compact Format
```bash
unilint --format compact src/
```
```
src/app.js:12:5 warning: 'fetch' is baseline newly available
src/app.js:25:10 error: 'Promise.any' is baseline limited availability
```

## Configuration

### ESLint Configuration
Unilint uses a custom ESLint plugin. The default configuration is in `eslint.config.mjs`:

```javascript
import ids from "./eslint-plugin-identifiers.mjs";

export default [
  {
    files: ["**/*.{js,ts,tsx}"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module" },
    plugins: { ids },
    rules: {
      "ids/collect-identifiers": ["warn", "low"]
    }
  }
];
```

### Custom Configuration
You can provide a custom ESLint configuration:

```bash
unilint --config ./my-eslint.config.mjs src/
```

## Supported File Types

### JavaScript
- `.js`, `.jsx`
- `.ts`, `.tsx` 
- `.mjs`, `.cjs`

### CSS
- `.css`
- `.scss`, `.sass`
- `.less`

## Integration

### Package.json Scripts
```json
{
  "scripts": {
    "lint": "unilint src/",
    "lint:js": "unilint --js-only src/",
    "lint:css": "unilint --css-only styles/",
    "lint:baseline": "unilint --baseline false src/"
  }
}
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Run Unilint
  run: |
    npm install -g unilint
    unilint --format json src/ > baseline-report.json
```

## API Usage

You can also use Unilint programmatically:

```javascript
import { unilint } from 'unilint';

const results = await unilint(['src/'], {
  format: 'json',
  baseline: 'low',
  verbose: true
});

console.log(results);
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC License

## Authors

- (Dada) Nikhil Simon Toppo
- (Hecker) Abhishek Joshi

---

Built with ❤️ to help developers write more compatible web code.