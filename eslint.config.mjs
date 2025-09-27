import ids from "./eslint-plugin-identifiers.mjs";

export default [
  {
    files: ["**/*.{js,ts,tsx}"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module" },
    plugins: { ids },
    rules: {
      "ids/collect-identifiers": "error"
    }
  }
];
