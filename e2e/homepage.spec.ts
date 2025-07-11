import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the homepage', async ({ page }) => {
    // Check for main heading
    await expect(page.getByRole('heading', { name: /BryanLabs Snapshots/i })).toBeVisible();
    
    // Check for navigation
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should display chain list', async ({ page }) => {
    // Wait for chains to load
    await page.waitForSelector('[data-testid="chain-card"]', { timeout: 10000 });
    
    // Check that at least one chain is displayed
    const chains = page.locator('[data-testid="chain-card"]');
    await expect(chains).toHaveCount(3); // Based on mock data
    
    // Verify chain information is displayed
    await expect(page.getByText('Cosmos Hub')).toBeVisible();
    await expect(page.getByText('Osmosis')).toBeVisible();
    await expect(page.getByText('Juno')).toBeVisible();
  });

  test('should have working search functionality', async ({ page }) => {
    // Wait for chains to load
    await page.waitForSelector('[data-testid="chain-card"]');
    
    // Find and use search input
    const searchInput = page.getByPlaceholder('Search chains...');
    await searchInput.fill('cosmos');
    
    // Check filtered results
    await expect(page.getByText('Cosmos Hub')).toBeVisible();
    await expect(page.getByText('Osmosis')).not.toBeVisible();
    await expect(page.getByText('Juno')).not.toBeVisible();
    
    // Clear search
    await searchInput.clear();
    
    // All chains should be visible again
    await expect(page.getByText('Cosmos Hub')).toBeVisible();
    await expect(page.getByText('Osmosis')).toBeVisible();
    await expect(page.getByText('Juno')).toBeVisible();
  });

  test('should have working network filter', async ({ page }) => {
    // Wait for chains to load
    await page.waitForSelector('[data-testid="chain-card"]');
    
    // Find and use network selector
    const networkSelect = page.getByRole('combobox');
    await networkSelect.selectOption('osmosis-1');
    
    // Check filtered results
    await expect(page.getByText('Osmosis')).toBeVisible();
    await expect(page.getByText('Cosmos Hub')).not.toBeVisible();
    await expect(page.getByText('Juno')).not.toBeVisible();
    
    // Reset to all networks
    await networkSelect.selectOption('all');
    
    // All chains should be visible again
    await expect(page.getByText('Cosmos Hub')).toBeVisible();
    await expect(page.getByText('Osmosis')).toBeVisible();
    await expect(page.getByText('Juno')).toBeVisible();
  });

  test('should navigate to chain detail page', async ({ page }) => {
    // Wait for chains to load
    await page.waitForSelector('[data-testid="chain-card"]');
    
    // Click on a chain card
    await page.getByText('Cosmos Hub').click();
    
    // Should navigate to chain detail page
    await expect(page).toHaveURL(/\/chains\/cosmos-hub/);
    
    // Check for chain-specific content
    await expect(page.getByRole('heading', { name: 'Cosmos Hub' })).toBeVisible();
  });

  test('should display login link when not authenticated', async ({ page }) => {
    // Check for login link in navigation
    await expect(page.getByRole('link', { name: /Login/i })).toBeVisible();
  });

  test('should handle dark mode toggle', async ({ page }) => {
    // Check if dark mode toggle exists
    const darkModeToggle = page.getByRole('button', { name: /toggle.*dark.*mode/i });
    
    if (await darkModeToggle.isVisible()) {
      // Get initial theme
      const htmlElement = page.locator('html');
      const initialTheme = await htmlElement.getAttribute('class');
      
      // Toggle dark mode
      await darkModeToggle.click();
      
      // Check that theme changed
      const newTheme = await htmlElement.getAttribute('class');
      expect(newTheme).not.toBe(initialTheme);
    }
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigation should still be accessible (might be in hamburger menu)
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
    
    // Chains should stack vertically on mobile
    const chains = page.locator('[data-testid="chain-card"]');
    const firstChain = chains.first();
    const secondChain = chains.nth(1);
    
    if (await firstChain.isVisible() && await secondChain.isVisible()) {
      const firstBox = await firstChain.boundingBox();
      const secondBox = await secondChain.boundingBox();
      
      if (firstBox && secondBox) {
        // Second chain should be below first chain on mobile
        expect(secondBox.y).toBeGreaterThan(firstBox.y);
      }
    }
  });

  test('should have proper SEO meta tags', async ({ page }) => {
    // Check for title
    await expect(page).toHaveTitle(/BryanLabs Snapshots/);
    
    // Check for meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /blockchain.*snapshot/i);
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Intercept API calls and make them fail
    await page.route('**/api/v1/chains', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error',
        }),
      });
    });
    
    // Reload page
    await page.reload();
    
    // Should show error message
    await expect(page.getByText(/Failed to load chains/i)).toBeVisible();
    
    // Should show retry button
    const retryButton = page.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible();
  });
});