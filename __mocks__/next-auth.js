const mockAuth = jest.fn().mockResolvedValue(null);
const mockSignIn = jest.fn().mockResolvedValue(undefined);
const mockSignOut = jest.fn().mockResolvedValue(undefined);

const mockHandlers = {
  GET: jest.fn(),
  POST: jest.fn(),
};

// Default export for NextAuth
const NextAuth = jest.fn(() => ({
  handlers: mockHandlers,
  auth: mockAuth,
  signIn: mockSignIn,
  signOut: mockSignOut,
}));

// Named exports
module.exports = NextAuth;
module.exports.default = NextAuth;
module.exports.Auth = jest.fn();
module.exports.customFetch = jest.fn();