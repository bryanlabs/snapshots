// Setup global mocks for tests
import '@testing-library/jest-dom'

// Mock setImmediate if not available
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (fn, ...args) => {
    return setTimeout(fn, 0, ...args);
  };
}

// Mock performance API
if (typeof global.performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    clearResourceTimings: jest.fn(),
    setResourceTimingBufferSize: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(() => true),
    navigation: {
      type: 0,
      redirectCount: 0,
    },
    timing: {},
    timeOrigin: Date.now(),
    onresourcetimingbufferfull: null,
    toJSON: () => ({}),
  };
}

// Mock PerformanceObserver
if (typeof global.PerformanceObserver === 'undefined') {
  global.PerformanceObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
    takeRecords: jest.fn(() => []),
  }));
  
  global.PerformanceObserver.supportedEntryTypes = [
    'navigation',
    'resource',
    'paint',
    'first-input',
    'layout-shift',
    'largest-contentful-paint',
    'element',
  ];
}

// Ensure fetch is available
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn();
}

// Ensure navigator.sendBeacon is available
if (typeof navigator.sendBeacon === 'undefined') {
  Object.defineProperty(navigator, 'sendBeacon', {
    value: jest.fn(),
    writable: true,
  });
}