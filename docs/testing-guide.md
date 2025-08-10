# Testing Guide

## Overview

The application uses a comprehensive testing strategy with Jest, React Testing Library, and Playwright for different testing levels.

## Test Structure

```
__tests__/
├── api/                    # API route tests
├── components/            # Component unit tests
├── lib/                   # Library function tests
├── integration/           # Integration tests
└── e2e/                   # End-to-end tests (Playwright)
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- MobileMenu.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="mobile"

# Run E2E tests
npm run test:e2e
```

## Writing Tests

### Component Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from '@/components/ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    render(<ComponentName />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText('Updated Text')).toBeInTheDocument();
  });
});
```

### API Route Tests

```tsx
import { GET } from '@/app/api/v1/chains/route';
import { NextRequest } from 'next/server';

describe('/api/v1/chains', () => {
  it('returns chain list', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/chains');
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

### Hook Tests

```tsx
import { renderHook } from '@testing-library/react-hooks';
import { useMobileDetect } from '@/hooks/useMobileDetect';

describe('useMobileDetect', () => {
  it('detects mobile device', () => {
    // Mock user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true,
    });
    
    const { result } = renderHook(() => useMobileDetect());
    
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isIOS).toBe(true);
  });
});
```

## Mocking

### NextAuth Mocking

```tsx
import { useSession } from 'next-auth/react';

jest.mock('next-auth/react');

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

mockUseSession.mockReturnValue({
  data: {
    user: { id: '1', email: 'test@example.com' },
    expires: '2024-12-31',
  },
  status: 'authenticated',
  update: jest.fn(),
});
```

### API Mocking

```tsx
// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'mocked' }),
});

// Mock specific endpoints
jest.mock('@/lib/nginx/operations', () => ({
  listChains: jest.fn().mockResolvedValue([
    { chainId: 'test-chain', name: 'Test Chain' },
  ]),
}));
```

### Redis Mocking

```tsx
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    setex: jest.fn(),
  },
}));
```

## Testing Patterns

### 1. Arrange-Act-Assert

```tsx
it('calculates total correctly', () => {
  // Arrange
  const items = [{ price: 10 }, { price: 20 }];
  
  // Act
  const total = calculateTotal(items);
  
  // Assert
  expect(total).toBe(30);
});
```

### 2. Testing Async Code

```tsx
it('fetches data successfully', async () => {
  const data = await fetchData();
  
  expect(data).toEqual({ success: true });
});

// With error handling
it('handles fetch error', async () => {
  fetch.mockRejectedValueOnce(new Error('Network error'));
  
  await expect(fetchData()).rejects.toThrow('Network error');
});
```

### 3. Testing User Events

```tsx
import userEvent from '@testing-library/user-event';

it('submits form with user input', async () => {
  const user = userEvent.setup();
  render(<Form />);
  
  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.click(screen.getByRole('button', { name: 'Submit' }));
  
  expect(mockSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
  });
});
```

### 4. Testing Loading States

```tsx
it('shows loading state', () => {
  render(<ComponentWithLoading isLoading={true} />);
  
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  expect(screen.queryByText('Content')).not.toBeInTheDocument();
});
```

## Coverage Requirements

Configured in `jest.config.js`:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

View coverage report:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## E2E Testing with Playwright

### Setup

```bash
npx playwright install
```

### Writing E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test('user can download snapshot', async ({ page }) => {
  // Navigate to chains page
  await page.goto('/chains/noble-1');
  
  // Click download button
  await page.click('button:has-text("Download")');
  
  // Verify download modal
  await expect(page.locator('h2:has-text("Download Snapshot")')).toBeVisible();
  
  // Start download
  await page.click('button:has-text("Download Now")');
  
  // Verify download started
  await expect(page.locator('text=Download started')).toBeVisible();
});
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run in headed mode
npm run test:e2e -- --headed

# Run specific test
npm run test:e2e -- test-name

# Debug mode
npm run test:e2e -- --debug
```

## Best Practices

### 1. Test Behavior, Not Implementation

```tsx
// ❌ Bad - Testing implementation details
expect(component.state.isOpen).toBe(true);

// ✅ Good - Testing behavior
expect(screen.getByRole('dialog')).toBeInTheDocument();
```

### 2. Use Semantic Queries

```tsx
// Priority order:
screen.getByRole('button', { name: 'Submit' });
screen.getByLabelText('Email');
screen.getByPlaceholderText('Enter email');
screen.getByText('Welcome');
screen.getByTestId('custom-element'); // Last resort
```

### 3. Avoid Testing External Libraries

Don't test Next.js, React, or other library functionality. Focus on your code.

### 4. Keep Tests Simple

Each test should test one thing. Use descriptive names.

```tsx
// ✅ Good test names
it('displays error message when form submission fails')
it('redirects to dashboard after successful login')
it('disables submit button while processing')
```

### 5. Clean Up After Tests

```tsx
afterEach(() => {
  jest.clearAllMocks();
  cleanup(); // RTL cleanup
});
```

## Debugging Tests

### 1. Debug Output

```tsx
import { screen, debug } from '@testing-library/react';

// Debug entire document
debug();

// Debug specific element
debug(screen.getByRole('button'));
```

### 2. Pause Test Execution

```tsx
it('complex interaction', async () => {
  render(<Component />);
  
  // Pause here
  await new Promise(r => setTimeout(r, 100000));
  
  // Or use debugger
  debugger;
});
```

### 3. VS Code Debugging

Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache", "${file}"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Common Issues

### 1. Module Resolution

```
Cannot find module '@/components/...'
```
**Solution**: Check `moduleNameMapper` in jest.config.js

### 2. Next.js Features

```
ReferenceError: Request is not defined
```
**Solution**: Mock in jest.setup.js

### 3. Async Errors

```
Warning: An update to Component inside a test was not wrapped in act(...)
```
**Solution**: Use `waitFor` or `findBy` queries

### 4. Environment Variables

```
TypeError: Cannot read property 'NEXT_PUBLIC_API_URL' of undefined
```
**Solution**: Add to jest.setup.js

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run tests
  run: |
    npm ci
    npm run test:ci
    npm run test:e2e
    
- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)