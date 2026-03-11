import { test, expect } from '@playwright/test';

test.describe('Dark mode', () => {
  test('persists after refresh', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toBeVisible();
    // Enable dark mode via the toggle button
    await page.locator('button[aria-label="Toggle Dark Mode"]').first().click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    // Reload and check dark class is applied by inline script before React loads
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('no flash of light mode when dark is saved', async ({ page, context }) => {
    await context.addInitScript(() => localStorage.setItem('theme', 'dark'));
    await page.goto('/');
    const cls = await page.locator('html').getAttribute('class');
    expect(cls).toContain('dark');
  });

  test('switches back to light and persists', async ({ page }) => {
    await page.goto('/');
    // Set dark mode via localStorage then reload to activate it
    await page.evaluate(() => localStorage.setItem('theme', 'dark'));
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
    // Toggle back to light
    await page.locator('button[aria-label="Toggle Dark Mode"]').first().click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    // Reload — should stay light
    await page.reload();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });
});

test.describe('Featured section', () => {
  test('Anniversary Tracker screenshots are visible', async ({ page }) => {
    await page.goto('/');
    await page.locator('#featured').scrollIntoViewIfNeeded();
    const screenshots = page.locator('#featured img[src*="1570714816"]');
    await expect(screenshots.first()).toBeVisible();
    const src = await screenshots.first().getAttribute('src');
    expect(src).toContain('screenshot-');
  });

  test('secondary cards show real screenshots, not placeholders', async ({ page }) => {
    await page.goto('/');
    await page.locator('#featured').scrollIntoViewIfNeeded();
    // Secondary grid cards should have screenshot images
    const secondaryImgs = page.locator('#featured .grid a img[src*="screenshot"]');
    await expect(secondaryImgs).toHaveCount(3);
  });
});

test.describe('Gallery section', () => {
  test('renders and has screenshot images', async ({ page }) => {
    await page.goto('/');
    await page.locator('#gallery').scrollIntoViewIfNeeded();
    await expect(page.locator('#gallery')).toBeVisible();
    const imgs = page.locator('#gallery img[src*="screenshot"]');
    const count = await imgs.count();
    expect(count).toBeGreaterThan(10);
  });

  test('lightbox opens on screenshot click', async ({ page }) => {
    await page.goto('/');
    await page.locator('#gallery').scrollIntoViewIfNeeded();
    await page.locator('#gallery button').first().click();
    await expect(page.locator('.fixed.inset-0')).toBeVisible();
  });

  test('lightbox closes on background click', async ({ page }) => {
    await page.goto('/');
    await page.locator('#gallery').scrollIntoViewIfNeeded();
    await page.locator('#gallery button').first().click();
    await expect(page.locator('.fixed.inset-0')).toBeVisible();
    await page.locator('.fixed.inset-0').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('.fixed.inset-0')).not.toBeVisible();
  });
});

test.describe('Navbar', () => {
  test('Gallery link is present and scrolls to section', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Gallery' }).click();
    await expect(page.locator('#gallery')).toBeInViewport({ timeout: 3000 });
  });

  test('View Flagship App scrolls to featured', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'View Flagship App' }).click();
    await expect(page.locator('#featured')).toBeInViewport({ timeout: 3000 });
  });
});

test.describe('CV download', () => {
  test('CV.pdf returns 200', async ({ page }) => {
    const response = await page.request.get('/CV.pdf');
    expect(response.status()).toBe(200);
  });
});

test.describe('App grid', () => {
  test('category filter buttons show counts', async ({ page }) => {
    await page.goto('/');
    await page.locator('#apps').scrollIntoViewIfNeeded();
    const allBtn = page.locator('#apps button', { hasText: 'All' });
    await expect(allBtn).toBeVisible();
    const text = await allBtn.textContent();
    expect(text).toMatch(/\d+/);
  });

  test('filtering by category reduces app count', async ({ page }) => {
    await page.goto('/');
    await page.locator('#apps').scrollIntoViewIfNeeded();
    const allCards = page.locator('#apps .grid > div');
    const totalCount = await allCards.count();
    await page.locator('#apps button', { hasText: 'Utilities' }).click();
    const filteredCount = await allCards.count();
    expect(filteredCount).toBeLessThan(totalCount);
  });
});
