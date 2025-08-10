// Mock for @sentry/nextjs
const mockScope = {
  setContext: jest.fn(),
  setLevel: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setExtra: jest.fn(),
};

const mockTransaction = {
  setName: jest.fn(),
  setOp: jest.fn(),
  setData: jest.fn(),
  finish: jest.fn(),
};

module.exports = {
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: jest.fn((callback) => callback(mockScope)),
  setUser: jest.fn(),
  setContext: jest.fn(),
  addBreadcrumb: jest.fn(),
  startSpan: jest.fn((options, callback) => {
    if (callback) {
      return callback();
    }
    return Promise.resolve();
  }),
  startTransaction: jest.fn(() => mockTransaction),
  getCurrentHub: jest.fn(() => ({
    getScope: jest.fn(() => mockScope),
  })),
  configureScope: jest.fn((callback) => callback(mockScope)),
};