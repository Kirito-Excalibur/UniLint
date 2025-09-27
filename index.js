
import process from"process";

// #!/usr/bin/env node
// import { execSync } from "child_process";
// import { features } from "web-features";

// // 1. Run ESLint on target file
function runESLint(file) {
	try {
		const output = execSync(`npx eslint ${file} -f json`, { encoding: "utf-8" });
		return JSON.parse(output);
	} catch (err) {
		return JSON.parse(err.stdout); // eslint exits non-zero when errors found
	}
}

// // 2. Check Baseline status for a feature
// function checkBaseline(featureKey) {
// 	const feature = features[featureKey];
// 	if (!feature) return `${featureKey} → Not found in Baseline data`;
// 	return `${feature.name} → Baseline: ${feature.status.baseline}`;
// }

// // 3. Example: detect `Promise.any` in results
// function detectFeatures(eslintResults) {
// 	// For now: fake detection → in real tool you'd scan AST
// 	return ["javascript.builtins.Promise.any"];
// }

// 4. Main
const file = process.argv[2] || "example.js";
const eslintResults = runESLint(file);

console.log("Baseline Report");
console.log("---------------");
const detected = detectFeatures(eslintResults);
for (const f of detected) {
	console.log(checkBaseline(f));
}

// const file=process.argv[2]||"Lord Simon"

console.log(`Hello, ${file}!`);