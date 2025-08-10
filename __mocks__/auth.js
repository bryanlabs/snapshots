// Mock for @/auth module
const mockAuth = jest.fn().mockResolvedValue(null);
const mockSignIn = jest.fn().mockResolvedValue(undefined);
const mockSignOut = jest.fn().mockResolvedValue(undefined);

const mockHandlers = {
  GET: jest.fn(),
  POST: jest.fn(),
};

module.exports = {
  auth: mockAuth,
  signIn: mockSignIn,
  signOut: mockSignOut,
  handlers: mockHandlers,
};