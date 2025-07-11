import { test, expect } from '@playwright/test';

test.describe('Download Flow', () => {
  test('should complete download flow for anonymous user', async ({ page }) => {
    // Go to homepage
    await page.goto('/');
    
    // Wait for chains to load
    await page.waitForSelector('[data-testid="chain-card"]');
    
    // Click on Cosmos Hub
    await page.getByText('Cosmos Hub').click();
    
    // Should be on chain detail page
    await expect(page).toHaveURL(/\/chains\/cosmos-hub/);
    
    // Wait for snapshots to load
    await page.waitForSelector('[data-testid="snapshot-item"]', { timeout: 10000 });
    
    // Find download button for first snapshot
    const downloadButton = page.locator('[data-testid="snapshot-item"]').first().getByRole('button', { name: /download/i });
    await expect(downloadButton).toBeVisible();
    
    // Set up download promise before clicking
    const downloadPromise = page.waitForEvent('download');
    
    // Click download button
    await downloadButton.click();
    
    // Button should show loading state
    await expect(downloadButton).toBeDisabled();
    await expect(downloadButton).toContainText(/downloading/i);
    
    // Wait for download to start (or mock response)
    // In real scenario, this would trigger actual download
    await page.waitForTimeout(1000);
    
    // Progress bar should be visible
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();
  });

  test('should show bandwidth limit error when exceeded', async ({ page }) => {
    // Mock bandwidth limit exceeded response
    await page.route('**/api/v1/chains/*/download', route => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Bandwidth limit exceeded',
          message: 'You have exceeded your monthly bandwidth limit',
        }),
      });
    });
    
    // Navigate to chain detail page
    await page.goto('/chains/cosmos-hub');
    
    // Wait for snapshots to load
    await page.waitForSelector('[data-testid="snapshot-item"]');
    
    // Click download button
    const downloadButton = page.locator('[data-testid="snapshot-item"]').first().getByRole('button', { name: /download/i });
    await downloadButton.click();
    
    // Should show error message
    await expect(page.getByText(/bandwidth limit exceeded/i)).toBeVisible();
  });

  test('should handle download for authenticated user', async ({ page, context }) => {
    // Set authentication cookie (mock session)
    await context.addCookies([{
      name: 'bryanlabs-snapshots',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
    }]);
    
    // Mock authenticated user response
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
            tier: 'premium',
          },
        }),
      });
    });
    
    // Go to chain detail page
    await page.goto('/chains/cosmos-hub');
    
    // User info should be visible in header
    await expect(page.getByText('user@example.com')).toBeVisible();
    
    // Download should include user email
    await page.route('**/api/v1/chains/*/download', async route => {
      const postData = route.request().postDataJSON();
      expect(postData.email).toBe('user@example.com');
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            downloadUrl: 'https://example.com/download/test-file',
          },
        }),
      });
    });
    
    // Click download
    const downloadButton = page.locator('[data-testid="snapshot-item"]').first().getByRole('button', { name: /download/i });
    await downloadButton.click();
    
    // Should show success state
    await expect(downloadButton).toBeDisabled();
  });

  test('should filter snapshots by type', async ({ page }) => {
    // Go to chain detail page
    await page.goto('/chains/cosmos-hub');
    
    // Wait for snapshots to load
    await page.waitForSelector('[data-testid="snapshot-item"]');
    
    // Check if type filter exists
    const typeFilter = page.getByRole('combobox', { name: /type/i });
    if (await typeFilter.isVisible()) {
      // Select pruned snapshots only
      await typeFilter.selectOption('pruned');
      
      // Verify filtered results
      const snapshots = page.locator('[data-testid="snapshot-item"]');
      const count = await snapshots.count();
      
      for (let i = 0; i < count; i++) {
        const snapshot = snapshots.nth(i);
        await expect(snapshot).toContainText(/pruned/i);
      }
      
      // Select archive snapshots
      await typeFilter.selectOption('archive');
      
      // Verify archive snapshots are shown
      const archiveSnapshots = page.locator('[data-testid="snapshot-item"]');
      const archiveCount = await archiveSnapshots.count();
      
      for (let i = 0; i < archiveCount; i++) {
        const snapshot = archiveSnapshots.nth(i);
        await expect(snapshot).toContainText(/archive/i);
      }
    }
  });

  test('should show snapshot details', async ({ page }) => {
    // Go to chain detail page
    await page.goto('/chains/cosmos-hub');
    
    // Wait for snapshots to load
    await page.waitForSelector('[data-testid="snapshot-item"]');
    
    // Check snapshot information is displayed
    const firstSnapshot = page.locator('[data-testid="snapshot-item"]').first();
    
    // Should show height
    await expect(firstSnapshot).toContainText(/height.*\d+/i);
    
    // Should show size
    await expect(firstSnapshot).toContainText(/\d+\s*(GB|MB)/i);
    
    // Should show date
    await expect(firstSnapshot).toContainText(/\d{4}-\d{2}-\d{2}/);
    
    // Should show compression type
    await expect(firstSnapshot).toContainText(/(lz4|zst|gz)/i);
  });

  test('should handle download URL generation errors', async ({ page }) => {
    // Mock error response
    await page.route('**/api/v1/chains/*/download', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Failed to generate download URL',
          message: 'MinIO service unavailable',
        }),
      });
    });
    
    // Go to chain detail page
    await page.goto('/chains/cosmos-hub');
    
    // Wait for snapshots to load
    await page.waitForSelector('[data-testid="snapshot-item"]');
    
    // Click download button
    const downloadButton = page.locator('[data-testid="snapshot-item"]').first().getByRole('button', { name: /download/i });
    await downloadButton.click();
    
    // Should show error message
    await expect(page.getByText(/failed to generate download/i)).toBeVisible();
    
    // Button should be enabled again
    await expect(downloadButton).not.toBeDisabled();
  });

  test('should copy download command', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-write', 'clipboard-read']);
    
    // Go to chain detail page
    await page.goto('/chains/cosmos-hub');
    
    // Wait for snapshots to load
    await page.waitForSelector('[data-testid="snapshot-item"]');
    
    // Find copy button for download command
    const copyButton = page.locator('[data-testid="copy-download-command"]').first();
    
    if (await copyButton.isVisible()) {
      // Click copy button
      await copyButton.click();
      
      // Button should show success state
      await expect(copyButton).toContainText(/copied/i);
      
      // Verify clipboard content (if supported by browser)
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toContain('wget');
    }
  });

  test('should navigate between multiple snapshots', async ({ page }) => {
    // Go to chain detail page
    await page.goto('/chains/cosmos-hub');
    
    // Wait for snapshots to load
    await page.waitForSelector('[data-testid="snapshot-item"]');
    
    // Count snapshots
    const snapshots = page.locator('[data-testid="snapshot-item"]');
    const count = await snapshots.count();
    
    if (count > 1) {
      // Check that snapshots are sorted by height (newest first)
      const heights = [];
      for (let i = 0; i < Math.min(count, 3); i++) {
        const heightText = await snapshots.nth(i).locator('[data-testid="snapshot-height"]').textContent();
        const height = parseInt(heightText?.replace(/\D/g, '') || '0');
        heights.push(height);
      }
      
      // Verify descending order
      for (let i = 1; i < heights.length; i++) {
        expect(heights[i]).toBeLessThanOrEqual(heights[i - 1]);
      }
    }
  });
});