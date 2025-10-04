// File for testing error handling and edge cases
// This file contains valid JavaScript but tests edge cases

// Function that might cause issues in analysis
function potentiallyProblematicFunction() {
  console.log("This function tests error handling");
  if (true) {
    return "testing";
  }
}

// Object with complex structure
const complexObject = {
  prop1: "value1",
  prop2: "value2"
};

// Valid code that should still be analyzed
const validCode = "This should still be analyzed";
fetch('/api/test').then(response => response.json());

// Edge case: empty function
function empty() { }

// Edge case: complex nested structure with web features
const complex = {
  nested: {
    deep: {
      property: fetch('/deep/api'),
      promise: Promise.resolve('test'),
      console: console.log('nested')
    }
  }
};

// Test various web features for baseline detection
const webFeatures = {
  fetchAPI: fetch('/api/data'),
  promiseAPI: Promise.all([Promise.resolve(1), Promise.resolve(2)]),
  consoleAPI: console.log('test'),
  performanceAPI: typeof performance !== 'undefined' ? performance.now() : 0
};

// Arrow functions and modern syntax
const modernFeatures = () => {
  const destructured = { a: 1, b: 2 };
  const { a, b } = destructured;
  const spread = [...[1, 2, 3]];
  const template = `Hello ${a}`;
  return { a, b, spread, template };
};

// Async/await pattern
async function asyncFunction() {
  try {
    const response = await fetch('/api/async');
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error in async function:', error);
    throw error;
  }
}