import ids from "./eslint-plugin-identifiers.mjs";

export default [
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    languageOptions: { 
      ecmaVersion: "latest", 
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        window: "readonly",
        document: "readonly",
        fetch: "readonly",
        Promise: "readonly"
      }
    },
    plugins: { ids },
    rules: {
      "ids/collect-identifiers": ["warn", "all"]
    }
  }
];
