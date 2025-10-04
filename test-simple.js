// Simple test file
fetch('https://api.example.com')
  .then(response => response.json())
  .then(data => console.log(data));

// Test Symbol
const sym = Symbol('test');

// Test Object methods
Object.entries({ a: 1, b: 2 });

// Test Map
const map = new Map();

// Test WeakMap  
const weakMap = new WeakMap();

// Test escape (deprecated)
const escaped = escape('test string');

// Test with statement (deprecated) - commented out due to strict mode
// with (console) {
//   log('test');
// }