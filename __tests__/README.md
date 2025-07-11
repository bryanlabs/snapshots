# BryanLabs Snapshots Test Suite

This directory contains the comprehensive test suite for the BryanLabs Snapshots service.

## Test Structure

```
__tests__/
├── api/                    # API route tests
│   ├── auth.test.ts       # Authentication endpoints
│   ├── chains.test.ts     # Chain listing endpoint
│   ├── chainById.test.ts  # Individual chain endpoint
│   ├── download.test.ts   # Download URL generation
│   ├── health.test.ts     # Health check endpoint
│   └── snapshots.test.ts  # Snapshot listing
├── lib/                    # Utility function tests
│   ├── auth/
│   │   └── session.test.ts # Session management
│   ├── bandwidth/
│   │   └── manager.test.ts # Bandwidth tracking
│   └── middleware/
│       └── rateLimiter.test.ts # Rate limiting
├── components/             # React component tests
│   ├── ChainList.test.tsx # Chain listing component
│   ├── DownloadButton.test.tsx # Download functionality
│   └── LoginForm.test.tsx # Login form component
└── integration/            # Integration tests
    ├── auth-flow.test.ts  # Complete auth flow
    └── download-flow.test.ts # Complete download flow
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Integration Tests
```bash
# Run integration tests
npm run test:integration
```

### E2E Tests
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Run All Tests
```bash
# Run unit and integration tests
npm run test:all
```

## Test Coverage

The test suite aims for:
- 70% minimum code coverage across all metrics
- 100% coverage for critical paths (auth, downloads, bandwidth)
- All API endpoints tested
- All user-facing components tested
- Integration tests for complete workflows

## Mocking Strategy

### API Routes
- MinIO client is mocked to avoid external dependencies
- Session management is mocked using jest mocks
- Monitoring metrics are mocked to prevent side effects

### Components
- Next.js navigation is mocked
- Auth context is mocked for isolated component testing
- External API calls are mocked

### Integration Tests
- End-to-end flows are tested with minimal mocking
- Only external services (MinIO, metrics) are mocked

## Writing New Tests

### Unit Test Template
```typescript
import { functionToTest } from '@/path/to/module';

describe('Module Name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = functionToTest(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Component Test Template
```typescript
import { render, screen } from '@testing-library/react';
import { ComponentName } from '@/components/ComponentName';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName prop="value" />);
    
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## CI/CD Integration

Tests are automatically run in CI/CD pipeline:
1. Unit tests run on every push
2. Integration tests run on pull requests
3. E2E tests run before deployment
4. Coverage reports are generated and tracked

## Debugging Tests

### Debug Unit Tests
```bash
# Run specific test file
npm test -- __tests__/api/auth.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should login"

# Debug in VS Code
# Add breakpoint and run "Jest: Debug" from command palette
```

### Debug E2E Tests
```bash
# Run E2E tests with headed browser
npx playwright test --headed

# Debug specific test
npx playwright test auth.spec.ts --debug
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Clarity**: Test names should clearly describe what they test
3. **Completeness**: Test both happy paths and error cases
4. **Performance**: Mock external dependencies
5. **Maintenance**: Update tests when code changes

## Common Issues

### Test Fails with "Cannot find module"
- Check import paths use `@/` alias
- Ensure TypeScript paths are configured

### Component Test Fails with Router Error
- Ensure Next.js router is properly mocked
- Check jest.setup.js includes router mocks

### E2E Test Timeout
- Increase timeout in playwright.config.ts
- Check if dev server is running
- Verify selectors are correct

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing)