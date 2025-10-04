// Test file with modern JavaScript features
import { promises as fs } from 'fs';

// Modern Promise features
const promise1 = Promise.resolve(42);
const promise2 = Promise.reject(new Error('test'));

// Promise.allSettled (baseline: high)
Promise.allSettled([promise1, promise2]).then(results => {
  console.log(results);
});

// Promise.any (baseline: high) 
Promise.any([promise1, promise2]).then(value => {
  console.log(value);
});

// Optional chaining (baseline: high)
const user = { profile: { name: 'John' } };
const name = user?.profile?.name;

// Nullish coalescing (baseline: high)
const defaultName = name ?? 'Anonymous';

// BigInt (baseline: high)
const bigNumber = 123n;

// Dynamic imports (baseline: high)
const module = await import('./other-module.js');

// Array methods
const numbers = [1, 2, 3, 4, 5];
const found = numbers.find(n => n > 3);
const includes = numbers.includes(3);

// Object methods
const obj = { a: 1, b: 2 };
const entries = Object.entries(obj);
const values = Object.values(obj);

// String methods
const text = 'Hello World';
const starts = text.startsWith('Hello');
const padded = text.padStart(20, '0');

// Fetch API
fetch('/api/data')
  .then(response => response.json())
  .then(data => console.log(data));

// Async/await
async function fetchData() {
  try {
    const response = await fetch('/api/users');
    const users = await response.json();
    return users;
  } catch (error) {
    console.error('Failed to fetch:', error);
  }
}