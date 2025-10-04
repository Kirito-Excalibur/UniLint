// Unilint configuration file
export default {
  // File patterns to include
  include: [
    "src/**/*.{js,jsx,ts,tsx,mjs,cjs}",
    "src/**/*.{css,scss,sass,less}"
  ],
  
  // File patterns to exclude
  exclude: [
    "node_modules/**",
    "dist/**",
    "build/**",
    "*.min.{js,css}",
    "coverage/**"
  ],
  
  // Baseline filtering
  baseline: {
    // Show all features by default
    level: "all", // "all" | "high" | "low" | "false"
    
    // Treat limited availability features as errors
    treatLimitedAsError: true,
    
    // Treat newly available features as warnings  
    treatNewlyAsWarning: true
  },
  
  // Output configuration
  output: {
    format: "table", // "table" | "json" | "compact"
    quiet: false,
    verbose: false
  },
  
  // ESLint configuration override
  eslint: {
    configFile: "./eslint.config.mjs"
  },
  
  // CSS linting configuration
  css: {
    enabled: true,
    // Additional CSS feature patterns can be added here
    customPatterns: []
  }
};