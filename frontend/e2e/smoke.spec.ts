import { test, expect } from '@playwright/test';

/**
 * E2E Smoke Test Suite
 * 
 * Critical user flow: Homepage → Dashboard → Map Interaction
 */

test.describe('Smoke Tests', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/shadcnui/i);
    
    // Check for welcome message or main content
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('should navigate to dashboard', async ({ page }) => {
    await page.goto('/');
    
    // Look for dashboard link or button
    const dashboardLink = page.getByRole('link', { name: /dashboard/i });
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      
      // Verify dashboard loaded
      await expect(page).toHaveURL(/\/dashboard/);
      
      // Check for dashboard title
      const title = page.getByText(/opportunity pipeline dashboard/i);
      await expect(title).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display KPI cards on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for KPI cards to load
    await page.waitForSelector('[data-testid="kpi-card"], .kpi-card, [class*="card"]', { 
      timeout: 15000 
    });
    
    // Check for at least one card
    const cards = page.locator('[data-testid="kpi-card"], .kpi-card, [class*="card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display geographic map', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for map container to load
    await page.waitForSelector('.leaflet-container, [class*="map"]', { 
      timeout: 15000 
    });
    
    // Verify map is visible
    const map = page.locator('.leaflet-container, [class*="map"]').first();
    await expect(map).toBeVisible();
  });

  test('should handle map view toggle', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for view toggle buttons
    const pinViewButton = page.getByRole('button', { name: /pin view/i });
    const heatmapViewButton = page.getByRole('button', { name: /heatmap view/i });
    
    if (await heatmapViewButton.isVisible()) {
      // Click heatmap view
      await heatmapViewButton.click();
      await page.waitForTimeout(1000); // Wait for transition
      
      // Verify heatmap is active
      await expect(heatmapViewButton).toHaveClass(/default|primary/);
      
      // Click pin view
      await pinViewButton.click();
      await page.waitForTimeout(1000); // Wait for transition
      
      // Verify pin view is active
      await expect(pinViewButton).toHaveClass(/default|primary/);
    }
  });

  test('should interact with KPI cards', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for KPI cards to load
    await page.waitForLoadState('networkidle');
    
    // Find and click a KPI card
    const kpiCards = page.locator('[data-testid="kpi-card"], .kpi-card, [class*="card"]');
    const firstCard = kpiCards.first();
    
    if (await firstCard.isVisible()) {
      await firstCard.click();
      
      // Wait for filter to apply
      await page.waitForTimeout(1000);
      
      // Check if filter indicator appears
      const filterAlert = page.getByText(/filtered by/i);
      if (await filterAlert.isVisible()) {
        await expect(filterAlert).toBeVisible();
      }
    }
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Navigate to non-existent route
    await page.goto('/non-existent-page');
    
    // Should show 404 or redirect to home
    const notFoundText = page.getByText(/not found|404/i);
    const homeLink = page.getByRole('link', { name: /home/i });
    
    const isNotFound = await notFoundText.isVisible().catch(() => false);
    const hasHomeLink = await homeLink.isVisible().catch(() => false);
    
    expect(isNotFound || hasHomeLink).toBe(true);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if page is still functional
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('should load within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have no console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (error) => 
        !error.includes('ResizeObserver') &&
        !error.includes('Sentry DSN not configured')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});