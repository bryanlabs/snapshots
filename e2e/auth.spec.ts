import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Click login link
    await page.getByRole('link', { name: /login/i }).click();
    
    // Should be on login page
    await expect(page).toHaveURL('/login');
    
    // Should show login form
    await expect(page.getByRole('heading', { name: /login to bryanlabs snapshots/i })).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // HTML5 validation should prevent submission
    const emailInput = page.getByLabel(/email address/i);
    await expect(emailInput).toHaveAttribute('required');
    
    // Fill invalid email
    await emailInput.fill('invalid-email');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show email validation error (HTML5)
    const emailValidity = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(emailValidity).toBe(false);
  });

  test('should handle login with invalid credentials', async ({ page }) => {
    // Mock login failure
    await page.route('**/api/v1/auth/login', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        }),
      });
    });
    
    await page.goto('/login');
    
    // Fill form
    await page.getByLabel(/email address/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    
    // Should stay on login page
    await expect(page).toHaveURL('/login');
  });

  test('should handle successful login', async ({ page, context }) => {
    // Mock successful login
    await page.route('**/api/v1/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: '1',
            email: 'user@example.com',
            name: 'Test User',
            role: 'user',
          },
          message: 'Login successful',
        }),
      });
    });
    
    // Mock session cookie being set
    await page.route('**/api/v1/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: '1',
            email: 'user@example.com',
            name: 'Test User',
            role: 'user',
          },
        }),
      });
    });
    
    await page.goto('/login');
    
    // Fill form
    await page.getByLabel(/email address/i).fill('user@example.com');
    await page.getByLabel(/password/i).fill('password123');
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should redirect to homepage
    await expect(page).toHaveURL('/');
    
    // Should show user info in header
    await expect(page.getByText('user@example.com')).toBeVisible();
    
    // Should show logout button
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
  });

  test('should handle logout', async ({ page }) => {
    // Set up authenticated state
    await page.route('**/api/v1/auth/me', route => {
      const isLoggedOut = route.request().url().includes('after-logout');
      
      if (isLoggedOut) {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Not authenticated',
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: '1',
              email: 'user@example.com',
              name: 'Test User',
              role: 'user',
            },
          }),
        });
      }
    });
    
    // Mock logout endpoint
    await page.route('**/api/v1/auth/logout', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Logout successful',
        }),
      });
    });
    
    await page.goto('/');
    
    // Should show logged in state
    await expect(page.getByText('user@example.com')).toBeVisible();
    
    // Click logout
    await page.getByRole('button', { name: /logout/i }).click();
    
    // Mock the post-logout state
    await page.route('**/api/v1/auth/me', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Not authenticated',
        }),
      });
    });
    
    // Should redirect or refresh
    await page.waitForTimeout(1000);
    
    // Should show login link again
    await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
    
    // Should not show user info
    await expect(page.getByText('user@example.com')).not.toBeVisible();
  });

  test('should show loading state during login', async ({ page }) => {
    let loginResolve: () => void;
    const loginPromise = new Promise<void>(resolve => {
      loginResolve = resolve;
    });
    
    // Mock slow login
    await page.route('**/api/v1/auth/login', async route => {
      await loginPromise;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: '1',
            email: 'user@example.com',
            name: 'Test User',
            role: 'user',
          },
        }),
      });
    });
    
    await page.goto('/login');
    
    // Fill form
    await page.getByLabel(/email address/i).fill('user@example.com');
    await page.getByLabel(/password/i).fill('password123');
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Button should be disabled and show loading
    const submitButton = page.getByRole('button', { name: /sign in/i });
    await expect(submitButton).toBeDisabled();
    
    // Should show loading spinner
    await expect(page.getByTestId('loading-spinner')).toBeVisible();
    
    // Resolve the login
    loginResolve!();
    
    // Should eventually redirect
    await expect(page).toHaveURL('/');
  });

  test('should persist authentication across page refreshes', async ({ page, context }) => {
    // Set authentication cookie
    await context.addCookies([{
      name: 'bryanlabs-snapshots',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    }]);
    
    // Mock authenticated user
    await page.route('**/api/v1/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: '1',
            email: 'user@example.com',
            name: 'Test User',
            role: 'user',
          },
        }),
      });
    });
    
    // Go to homepage
    await page.goto('/');
    
    // Should show authenticated state
    await expect(page.getByText('user@example.com')).toBeVisible();
    
    // Refresh page
    await page.reload();
    
    // Should still be authenticated
    await expect(page.getByText('user@example.com')).toBeVisible();
  });

  test('should redirect to login for protected routes', async ({ page }) => {
    // Mock unauthenticated state
    await page.route('**/api/v1/auth/me', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Not authenticated',
        }),
      });
    });
    
    // Try to access a protected route (if any exist)
    await page.goto('/admin');
    
    // Should redirect to login or show unauthorized message
    const url = page.url();
    expect(url).toMatch(/login|unauthorized|404/);
  });

  test('should handle session expiry', async ({ page }) => {
    let requestCount = 0;
    
    // Mock session that expires after first request
    await page.route('**/api/v1/auth/me', route => {
      requestCount++;
      
      if (requestCount === 1) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: '1',
              email: 'user@example.com',
              name: 'Test User',
              role: 'user',
            },
          }),
        });
      } else {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Session expired',
          }),
        });
      }
    });
    
    await page.goto('/');
    
    // Initially authenticated
    await expect(page.getByText('user@example.com')).toBeVisible();
    
    // Trigger another auth check (e.g., by navigating)
    await page.goto('/chains/cosmos-hub');
    await page.goto('/');
    
    // Should now show logged out state
    await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
  });
});