import { features } from 'web-features';

const jsFeatures = [];

Object.entries(features).forEach(([key, feature]) => {
  const name = (feature.name || '').toLowerCase();
  const desc = (feature.description || '').toLowerCase();
  
  // Check if it's a JavaScript feature
  if (key.includes('javascript') || 
      key.includes('promise') || 
      key.includes('async') ||
      key.includes('arrow') ||
      key.includes('class') ||
      key.includes('const') ||
      key.includes('let') ||
      key.includes('destructuring') ||
      key.includes('spread') ||
      key.includes('template') ||
      key.includes('symbol') ||
      key.includes('proxy') ||
      key.includes('reflect') ||
      key.includes('generator') ||
      key.includes('iterator') ||
      key.includes('bigint') ||
      key.includes('optional') ||
      key.includes('nullish') ||
      key.includes('import') ||
      key.includes('export') ||
      key.includes('module') ||
      name.includes('javascript') ||
      name.includes('promise') ||
      name.includes('async') ||
      desc.includes('javascript') ||
      desc.includes('ecmascript')) {
    
    jsFeatures.push([key, feature]);
  }
});

jsFeatures.sort();
console.log('JavaScript Features Found:');
console.log('========================');
jsFeatures.forEach(([key, feature]) => {
  const baseline = feature.status?.baseline;
  const baselineStr = baseline === false ? 'false' : baseline || 'unknown';
  console.log(`${key.padEnd(40)} | ${baselineStr.padEnd(10)} | ${feature.name || 'No name'}`);
});

console.log(`\nTotal JS Features: ${jsFeatures.length}`);