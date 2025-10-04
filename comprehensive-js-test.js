// Comprehensive JavaScript Features Test File
// This file tests detection of JavaScript features from web-features package

// ===== BASIC JAVASCRIPT =====
// javascript (high)
console.log("Testing JavaScript features");

// ===== VARIABLES AND DECLARATIONS =====
// let-const (high)
let testLet = 'let variable';
const testConst = 'const variable';

// ===== FUNCTIONS =====
// functions (high)
function regularFunction() {
  return 'regular function';
}

// Arrow functions (part of functions)
const arrowFunction = () => 'arrow function';

// ===== CLASSES =====
// class-syntax (high)
class TestClass {
  constructor(name) {
    this.name = name;
  }

  method() {
    return `Hello ${this.name}`;
  }
}

// ===== DESTRUCTURING =====
// destructuring (high)
const obj = { a: 1, b: 2, c: 3 };
const { a, b, c } = obj;
const arr = [1, 2, 3];
const [x, y, z] = arr;

// ===== SPREAD SYNTAX =====
// spread (high)
const spreadArray = [...arr, 4, 5, 6];
const spreadObject = { ...obj, d: 4 };

// ===== TEMPLATE LITERALS =====
// template-literals (high)
const templateLiteral = `Hello ${testLet}, value is ${a}`;

// ===== SYMBOLS =====
// symbol (high)
const testSymbol = Symbol('test');
const symbolKey = Symbol.for('global');

// ===== PROMISES =====
// promise (high)
const basicPromise = Promise.resolve('resolved');
const rejectedPromise = Promise.reject(new Error('rejected'));

// promise-allsettled (high)
Promise.allSettled([basicPromise, rejectedPromise]).then(results => {
  console.log('AllSettled results:', results);
});

// promise-any (high)
Promise.any([basicPromise, rejectedPromise]).then(result => {
  console.log('Any result:', result);
});

// promise-finally (high)
basicPromise.finally(() => {
  console.log('Finally executed');
});

// promise-try (low) - newly available
Promise.try(() => {
  return 'Promise.try result';
}).then(result => {
  console.log('Promise.try:', result);
});

// promise-withresolvers (low) - newly available
const { promise, resolve, reject } = Promise.withResolvers();
resolve('withResolvers result');

// ===== ASYNC/AWAIT =====
// async-await (high)
async function asyncFunction() {
  try {
    const result = await basicPromise;
    return result;
  } catch (error) {
    console.error('Async error:', error);
  }
}

// ===== GENERATORS =====
// generators (high)
function* generatorFunction() {
  yield 1;
  yield 2;
  yield 3;
}

// async-generators (high)
async function* asyncGeneratorFunction() {
  yield await Promise.resolve(1);
  yield await Promise.resolve(2);
}

// ===== ITERATORS =====
// iterators (high)
const iterator = generatorFunction();
for (const value of iterator) {
  console.log('Iterator value:', value);
}

// async-iterators (high)
async function testAsyncIterator() {
  for await (const value of asyncGeneratorFunction()) {
    console.log('Async iterator value:', value);
  }
}

// iterator-methods (low) - newly available
const iteratorHelper = [1, 2, 3].values();

// ===== ARRAYS =====
// array (high)
const testArray = new Array(1, 2, 3);

// array-iterators (high)
const arrayIterator = testArray.values();

// array-fromasync (low) - newly available
// Array.fromAsync([Promise.resolve(1), Promise.resolve(2)]);

// ===== TYPED ARRAYS =====
// typed-arrays (high)
const int32Array = new Int32Array([1, 2, 3, 4]);

// bigint64array (high)
const bigInt64Array = new BigInt64Array([1n, 2n, 3n]);

// typed-array-iterators (high)
const typedArrayIterator = int32Array.values();

// ===== BIGINT =====
// bigint (high)
const bigIntValue = 123456789012345678901234567890n;
const bigIntFromNumber = BigInt(123);

// ===== OBJECTS =====
// object-object (high)
const testObject = Object.create(null);
Object.assign(testObject, { key: 'value' });

// ===== PROXY AND REFLECT =====
// proxy-reflect (high)
const proxyTarget = { name: 'target' };
const proxyHandler = {
  get(target, prop) {
    return Reflect.get(target, prop);
  }
};
const proxy = new Proxy(proxyTarget, proxyHandler);

// ===== JSON =====
// json (high)
const jsonString = JSON.stringify({ test: 'data' });
const jsonObject = JSON.parse(jsonString);

// ===== MATH AND NUMBERS =====
// number (high)
const mathResult = Math.max(1, 2, 3);
const numberValue = Number.parseFloat('3.14');

// ===== NULLISH COALESCING =====
// nullish-coalescing (high)
const nullishValue = null ?? 'default value';
const undefinedValue = undefined ?? 'default value';

// ===== OPTIONAL CATCH BINDING =====
// optional-catch-binding (high)
try {
  throw new Error('test error');
} catch {
  console.log('Caught error without binding');
}

// ===== HASHBANG COMMENTS =====
// hashbang-comments (high)
// #!/usr/bin/env node (would be at top of file)

// ===== SET METHODS =====
// set-methods (low) - newly available
const set1 = new Set([1, 2, 3]);
const set2 = new Set([2, 3, 4]);
// const intersection = set1.intersection(set2); // Not yet widely supported

// ===== MODULES (if this were a module) =====
// js-modules (high)
// import { someFunction } from './other-module.js';
// export { testFunction };

// ===== ESCAPE/UNESCAPE (deprecated) =====
// escape-unescape (false) - limited availability
// const escaped = escape('test string'); // Deprecated

// ===== WITH STATEMENT (deprecated) =====
// with (false) - limited availability
// with (obj) { console.log(a); } // Deprecated and not recommended

// ===== ATOMICS (for SharedArrayBuffer) =====
// atomics-wait-async (false) - limited availability
// Atomics.waitAsync would be used with SharedArrayBuffer

// Test function to run async code
async function runTests() {
  console.log('=== Running Comprehensive JavaScript Feature Tests ===');

  // Test class
  const instance = new TestClass('World');
  console.log(instance.method());

  // Test async function
  const asyncResult = await asyncFunction();
  console.log('Async result:', asyncResult);

  // Test async iterator
  await testAsyncIterator();

  console.log('=== All tests completed ===');
}

// Run the tests
runTests().catch(console.error);

// Export for module testing
// export { TestClass, asyncFunction, generatorFunction };