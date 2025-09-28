// #!/usr/bin/env node
import process from"process";
import { execSync } from "child_process";
import { features } from "web-features";

// // 1. Run ESLint on target file
function runESLint(file) {
	try {
		const output = execSync(`npx eslint ${file}`, { encoding: "utf-8" });
		const objs = output.trim().split("\n").map(line => JSON.parse(line));
		return objs;
	} catch (err) {
		return err; // eslint exits non-zero when errors found
	}
}

// // 2. Check Baseline status for a feature
function checkBaseline(featureKey) {
	const feature = features[featureKey];
	if (!feature) return `${featureKey} → Not found in Baseline data`;
	return `${feature.name} → Baseline: ${feature.status.baseline}`;
}

// // 3. Example: detect `Promise.any` in results
// function detectFeatures(eslintResults) {
// 	// For now: fake detection → in real tool you'd scan AST
// 	return ["javascript.builtins.Promise.any"];
// }

// 4. Main
// const file = process.argv[2] || "example.js";
// const eslintResults = runESLint(file);

// console.log("Baseline Report");
// console.log("---------------");
// const detected = detectFeatures(eslintResults);
// for (const f of detected) {
// 	console.log(checkBaseline(f));
// }

const file=process.argv[2]||"example.js";
const eslintResults=runESLint(file);
console.log("Unified Baseline Report");
console.log("---------------");
// console.log(`File: ${file}`);


eslintResults.forEach(f=>{
	console.log("---------------")
	console.log(f.file)
	console.log("---------------")
	f.identifiers.forEach(m=>console.log(checkBaseline(m)))
}
);

// eslintResults.forEach(f=>console.log(checkBaseline(`${f}`)));

// console.log(execSync(`npx eslint example.js`,{ encoding: "utf-8" }));