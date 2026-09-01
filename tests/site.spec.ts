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

test.describe('Download spotlight', () => {
  test('shows the four measured acquisition candidates', async ({ page }) => {
    await page.goto('/');
    await page.locator('#download-spotlight').scrollIntoViewIfNeeded();
    await expect(page.locator('#download-spotlight')).toBeVisible();
    await expect(page.locator('#download-spotlight > div > div.grid > a')).toHaveCount(4);
    await expect(page.locator('#download-spotlight')).toContainText('Anniversary Tracker');
    await expect(page.locator('#download-spotlight')).toContainText('DocScanner: Sign Documents');
    await expect(page.locator('#download-spotlight')).toContainText('Prime Minister Sim: Politics');
    await expect(page.locator('#download-spotlight')).toContainText('Ollama Connect');
  });

  test('uses app-specific PocketGrove referral links', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('#download-spotlight > div > div.grid > a');
    await expect(links.nth(0)).toHaveAttribute('href', /pocketgrove\.com\/apps\/anniversary-tracker\/\?utm_source=congle/);
    await expect(links.nth(1)).toHaveAttribute('href', /pocketgrove\.com\/apps\/docscanner-sign-documents\/\?utm_source=congle/);
    await expect(links.nth(2)).toHaveAttribute('href', /pocketgrove\.com\/apps\/prime-minister-sim-politics\/\?utm_source=congle/);
    await expect(links.nth(3)).toHaveAttribute('href', /pocketgrove\.com\/apps\/ollama-connect\/\?utm_source=congle/);
  });
});

test.describe('Navbar', () => {
  test('Try an app link is present and scrolls to the spotlight', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Try an app' }).first().click();
    await expect(page.locator('#download-spotlight')).toBeInViewport({ timeout: 3000 });
  });

  test('Browse all apps link scrolls to the portfolio', async ({ page }) => {
    await page.goto('/');
    await page.locator('#download-spotlight').getByRole('link', { name: 'Browse all 50+ apps' }).click();
    await expect(page.locator('#apps')).toBeInViewport({ timeout: 3000 });
  });
});

test.describe('Hero conversion links', () => {
  test('first-screen Try an app CTA reaches the spotlight', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Try an app' }).first().click();
    await expect(page.locator('#download-spotlight')).toBeInViewport({ timeout: 3000 });
  });
});

test.describe('CV download', () => {
  test('CV.pdf returns 200', async ({ page }) => {
    const response = await page.request.get('/CV.pdf');
    expect(response.status()).toBe(200);
  });
});

test.describe('Pack Planner universal links', () => {
  test('apple app site association advertises PackPlanner invite paths', async ({ page }) => {
    const response = await page.request.get('/.well-known/apple-app-site-association');
    expect(response.status()).toBe(200);
    const body = await response.json();
    const details = body.applinks.details[0];
    expect(details.appID).toBe('9URT9YH7AX.com.congle.TEAMCONG.PackPlanner');
    expect(details.paths).toContain('/packplanner/join');
    expect(details.paths).toContain('/packplanner/join/');
    expect(details.paths).toContain('/packplanner/join/*');
  });

  test('invite fallback page exposes code and app link', async ({ page }) => {
    await page.goto('/packplanner/join/?code=ab12-cd34');
    await expect(page.getByRole('heading', { name: 'Join this Pack Planner trip' })).toBeVisible();
    await expect(page.locator('#inviteCode')).toHaveText('AB12CD34');
    await expect(page.locator('#openApp')).toHaveAttribute('href', 'packplanner://join?code=AB12CD34');
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
