// Test file with potentially limited baseline features
var XMLHttpRequest = new XMLHttpRequest();

// Some features that might have limited baseline support
if (typeof IntersectionObserver !== 'undefined') {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        console.log('Element is visible');
      }
    });
  });
}

// ResizeObserver (check baseline status)
if (typeof ResizeObserver !== 'undefined') {
  const resizeObserver = new ResizeObserver(entries => {
    console.log('Element resized');
  });
}

// MutationObserver (baseline: high)
const mutationObserver = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    console.log('DOM changed:', mutation.type);
  });
});

// Performance API
if (typeof performance !== 'undefined') {
  const timing = performance.timing;
  const navigation = performance.navigation;
  performance.mark('test-start');
  performance.measure('test-duration', 'test-start');
}

// Web Workers
if (typeof Worker !== 'undefined') {
  const worker = new Worker('worker.js');
  worker.postMessage('Hello Worker');
}

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// Geolocation
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(position => {
    console.log(position.coords.latitude, position.coords.longitude);
  });
}

// Local Storage
if (typeof localStorage !== 'undefined') {
  localStorage.setItem('key', 'value');
  const value = localStorage.getItem('key');
}

// IndexedDB
if (typeof indexedDB !== 'undefined') {
  const request = indexedDB.open('TestDB', 1);
}