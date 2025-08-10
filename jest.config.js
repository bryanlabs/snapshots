const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^next-auth$': '<rootDir>/__mocks__/next-auth.js',
    '^next-auth/react$': '<rootDir>/__mocks__/next-auth-react.js',
    '^next-auth/providers/(.*)$': '<rootDir>/__mocks__/next-auth-providers.js',
    '^@auth/prisma-adapter$': '<rootDir>/__mocks__/auth-prisma-adapter.js',
    '^@prisma/client$': '<rootDir>/__mocks__/@prisma/client.js',
    '^ioredis$': '<rootDir>/__mocks__/ioredis.js',
    '^@sentry/nextjs$': '<rootDir>/__mocks__/@sentry/nextjs.js',
    '^next/server$': '<rootDir>/__mocks__/next/server.js',
  },
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testMatch: [
    '<rootDir>/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/__tests__/**/*.spec.{ts,tsx}',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(next-auth|@auth|@keplr-wallet|@auth/core)/)',
  ],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    '!app/**/*.d.ts',
    '!**/*.stories.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/__tests__/integration/',
    '<rootDir>/e2e/',
  ],
}

module.exports = createJestConfig(customJestConfig)