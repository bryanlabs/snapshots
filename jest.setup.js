import '@testing-library/jest-dom'

// Mock environment variables
process.env.MINIO_ENDPOINT = 'localhost'
process.env.MINIO_PORT = '9000'
process.env.MINIO_ACCESS_KEY = 'test-access-key'
process.env.MINIO_SECRET_KEY = 'test-secret-key'
process.env.MINIO_BUCKET = 'test-bucket'
process.env.MINIO_USE_SSL = 'false'
process.env.SESSION_SECRET = 'test-session-secret-32-characters-long'
process.env.ADMIN_PASSWORD_HASH = '$2a$10$test-hashed-password'
process.env.RATE_LIMIT_WINDOW = '60000'
process.env.RATE_LIMIT_MAX_REQUESTS = '100'
process.env.BANDWIDTH_LIMIT_MONTHLY_GB = '1000'
process.env.BANDWIDTH_LIMIT_DAILY_GB = '100'
process.env.BANDWIDTH_LIMIT_RATE_LIMIT_MB = '100'

// Mock fetch for tests
global.fetch = jest.fn()

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Silence console errors during tests unless explicitly needed
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOMTestUtils.act')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})