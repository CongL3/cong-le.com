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
  test('shows the seven active acquisition candidates', async ({ page }) => {
    await page.goto('/');
    await page.locator('#download-spotlight').scrollIntoViewIfNeeded();
    await expect(page.locator('#download-spotlight')).toBeVisible();
    await expect(page.locator('#download-spotlight > div > div.grid > article')).toHaveCount(7);
    await expect(page.locator('#download-spotlight')).toContainText('Anniversary Tracker');
    await expect(page.locator('#download-spotlight')).toContainText('Football Career Quest');
    await expect(page.locator('#download-spotlight')).toContainText('Prime Minister Sim: Politics');
    await expect(page.locator('#download-spotlight')).toContainText('Ollama Connect');
    await expect(page.locator('#download-spotlight')).toContainText('Hoop Quest: Basketball Sim');
    await expect(page.locator('#download-spotlight')).toContainText('Baby Screen Lock: Kid Safe');
    await expect(page.locator('#download-spotlight')).toContainText('Solunar: Best Fishing Times');
    await expect(page.locator('#download-spotlight')).not.toContainText('DocScanner: Sign Documents');
    const spotlightNames = await page.locator('#download-spotlight > div > div.grid > article h3').allTextContents();
    expect(spotlightNames).toEqual([
      'Anniversary Tracker',
      'Football Career Quest',
      'Prime Minister Sim: Politics',
      'Hoop Quest: Basketball Sim',
      'Ollama Connect',
      'Baby Screen Lock: Kid Safe',
      'Solunar: Best Fishing Times',
    ]);
  });

  test('uses app-specific PocketGrove referral links', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('#download-spotlight > div > div.grid > article a').filter({ hasText: 'Learn more' });
    await expect(links.nth(0)).toHaveAttribute('href', /pocketgrove\.com\/anniversary-tracker\/\?utm_source=congle/);
    await expect(links.nth(1)).toHaveAttribute('href', /pocketgrove\.com\/football-career-quest\/\?utm_source=congle/);
    await expect(links.nth(2)).toHaveAttribute('href', /pocketgrove\.com\/prime-minister-sim\/\?utm_source=congle/);
    await expect(links.nth(3)).toHaveAttribute('href', /pocketgrove\.com\/hoop-quest\/\?utm_source=congle/);
    await expect(links.nth(4)).toHaveAttribute('href', /pocketgrove\.com\/ollama-connect\/\?utm_source=congle/);
    await expect(links.nth(5)).toHaveAttribute('href', /pocketgrove\.com\/baby-screen-lock\/\?utm_source=congle/);
    await expect(links.nth(6)).toHaveAttribute('href', /pocketgrove\.com\/solunar-fishing-times\/\?utm_source=congle/);
  });

  test('exposes direct attributed App Store download links', async ({ page }) => {
    await page.goto('/');
    const links = page.getByRole('link', { name: 'Download on the App Store' });
    await expect(links).toHaveCount(7);
    for (let i = 0; i < 7; i += 1) {
      await expect(links.nth(i)).toHaveAttribute('href', /https:\/\/apps\.apple\.com\/gb\/app\/.*\?(?=.*pt=19678800)(?=.*ct=congle-web-spotlight-)/);
      await expect(links.nth(i)).not.toHaveAttribute('target', '_blank');
    }
  });

  test('uses app-specific campaign links in the full app grid', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('#apps a[aria-label$="on the App Store"]');
    const hrefs = await links.evaluateAll((nodes) => nodes.map((node) => (node as HTMLAnchorElement).href));
    expect(hrefs.length).toBeGreaterThan(0);
    expect(hrefs.every((href) => href.includes('pt=19678800') && href.includes('ct=congle-web-grid-'))).toBe(true);
    expect(hrefs.find((href) => href.includes('id1570714816'))).toContain('ct=congle-web-grid-anniversary');
  });

  test('makes every full-grid store exit a clear download action', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('#apps a[aria-label$="on the App Store"]');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      await expect(links.nth(i)).toContainText('Download');
      await expect(links.nth(i)).toHaveClass(/bg-blue-600/);
    }
  });

  test('keeps every homepage App Store link in the current tab', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('a[href*="apps.apple.com"]');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      await expect(links.nth(i)).not.toHaveAttribute('target', '_blank');
    }
  });

  test('keeps full-card and portfolio App Store links in the current tab', async ({ page }) => {
    await page.goto('/');
    const cardLinks = page.locator('#apps a[aria-label$="— details"]');
    const cardCount = await cardLinks.count();
    expect(cardCount).toBeGreaterThan(0);
    for (let i = 0; i < cardCount; i += 1) {
      await expect(cardLinks.nth(i)).not.toHaveAttribute('target', '_blank');
    }
    await expect(page.getByRole('link', { name: 'App Store Portfolio' })).not.toHaveAttribute('target', '_blank');
  });
});

test.describe('Developer notes', () => {
  test('links the published essays instead of showing placeholder copy', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('#developer-notes');
    await expect(section).toContainText('Read the essay');
    await expect(section).not.toContainText('Coming to the developer series');
    const links = section.getByRole('link', { name: 'Read the essay' });
    await expect(links).toHaveCount(3);
    await expect(links.nth(0)).toHaveAttribute('href', /pocketgrove\.com\/blog\/stop-putting-everything-in-claude-md\/\?utm_source=congle/);
    await expect(links.nth(1)).toHaveAttribute('href', /pocketgrove\.com\/blog\/how-to-build-huge-agent-knowledge-bases-without-huge-context-windows\/\?utm_source=congle/);
    await expect(links.nth(2)).toHaveAttribute('href', /pocketgrove\.com\/blog\/your-claude-md-needs-tests-too\/\?utm_source=congle/);
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
  test('advertises Anniversary Tracker to iOS Smart App Banner', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('meta[name="apple-itunes-app"]')).toHaveAttribute(
      'content',
      'app-id=1570714816',
    );
  });

  test('first screen exposes a direct Anniversary Tracker download', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    const downloadLink = page.getByRole('link', { name: 'Download Anniversary Tracker' });
    await expect(downloadLink).toHaveAttribute(
      'href',
      /https:\/\/apps\.apple\.com\/gb\/app\/anniversary-tracker\/.*\?(?=.*pt=19678800)(?=.*ct=congle-web-hero-anniversary)/,
    );
    await expect(downloadLink).not.toHaveAttribute('target', '_blank');
    await expect(downloadLink).toBeInViewport();
  });

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
  test('does not promote unavailable or retired apps', async ({ page }) => {
    await page.goto('/');
    const grid = page.locator('#apps');
    await expect(grid).not.toContainText('DocScanner: Sign Documents');
    await expect(grid).not.toContainText('Frankly AI: Uncensored Chat');
  });

  test('legacy app landing-page Store links keep attribution', async ({ page }) => {
    await page.goto('/apps/bible-prayer/');
    const links = page.locator('a[href*="apps.apple.com/gb/app/bible-prayer-companion"]');
    await expect(links).not.toHaveCount(0);
    const count = await links.count();
    for (let i = 0; i < count; i += 1) {
      await expect(links.nth(i)).toHaveAttribute('href', /pt=19678800/);
      await expect(links.nth(i)).toHaveAttribute('href', /ct=congle-web-bible-prayer/);
    }
  });

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

test.describe('New app canonical pages', () => {
  const apps = [
    { name: 'Oval Office President Sim', slug: 'oval-office-president-sim', id: '6790584903' },
    { name: 'Phrasal Verbs: English Trainer', slug: 'phrasal-verbs-english-trainer', id: '6797039310' },
    { name: 'CoastClock: Tide Times UK', slug: 'coastclock-tide-times-uk', id: '6796102052' },
  ];

  for (const app of apps) {
    test(`${app.name} has a working attributed landing page`, async ({ page }) => {
      const response = await page.goto(`/apps/${app.slug}/`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toContainText(app.name);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `https://www.cong-le.com/apps/${app.slug}/`,
      );
      await expect(page.locator('meta[name="description"]')).not.toHaveAttribute('content', '');
      await expect(page.locator('section[aria-labelledby="screenshots-heading"] img')).toHaveCount(5);

      const downloads = page.getByRole('link', { name: /Download.*App Store/ });
      await expect(downloads).toHaveCount(2);
      for (let i = 0; i < 2; i += 1) {
        await expect(downloads.nth(i)).toHaveAttribute(
          'href',
          new RegExp(`apps\\.apple\\.com/app/id${app.id}\\?ct=congle-web-[^&]+&pt=19678800`),
        );
      }
    });
  }
});

test.describe('Generated app screenshot galleries', () => {
  const apps = [
    { name: 'Age Calculator: How Old Am I', slug: 'age-calculator-how-old-am-i', screenshotCount: 5 },
    { name: 'Live Captions', slug: 'live-captions-hearbee', screenshotCount: 5 },
    { name: 'Link Saver', slug: 'link-saver-bookmark-manager', screenshotCount: 5 },
  ];

  for (const app of apps) {
    test(`${app.name} has a usable generated landing page`, async ({ page }) => {
      const response = await page.goto(`/apps/${app.slug}/`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toContainText(app.name);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `https://www.cong-le.com/apps/${app.slug}/`,
      );
      await expect(page.locator('img.hero-screenshot')).toHaveCount(1);
      await expect(page.locator('img.hero-screenshot')).toHaveAttribute('src', /\/screenshot-1\.jpg$/);
      await expect(page.locator('section[aria-labelledby="screenshots-heading"] img')).toHaveCount(app.screenshotCount);
    });
  }
});

test.describe('Hand-authored app screenshot galleries', () => {
  const apps = [
    { slug: 'birthday-reminder', screenshotCount: 5 },
    { slug: 'uv-index-widget-burn-time', screenshotCount: 3 },
  ];

  for (const app of apps) {
    test(`${app.slug} keeps its real App Store gallery`, async ({ page }) => {
      const response = await page.goto(`/apps/${app.slug}/`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('section[aria-labelledby="screenshots-heading"] img')).toHaveCount(app.screenshotCount);
    });
  }
});

test.describe('Canonical app aliases', () => {
  test('redirects a historical slug to the canonical page and preserves tracking parameters', async ({ page }) => {
    await page.goto('/apps/link-saver-fast-and-easy/?utm_source=legacy');
    await expect(page).toHaveURL(/\/apps\/link-saver-bookmark-manager\/\?utm_source=legacy$/);
    await expect(page.locator('h1')).toContainText('Link Saver');
  });

  test('keeps historical aliases out of the sitemap', async ({ page }) => {
    const response = await page.request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    const sitemap = await response.text();
    expect(sitemap).toContain('/apps/link-saver-bookmark-manager/');
    expect(sitemap).not.toContain('/apps/link-saver-fast-and-easy/');
    expect(sitemap).not.toContain('/apps/golden-hour-light-planner/');
  });
});

test.describe('Apple Smart App Banners', () => {
  const apps = [
    { slug: 'baby-names', id: '6760255587' },
    { slug: 'birthday-reminder', id: '6739454115' },
    { slug: 'bible-prayer', id: '6759859294' },
    { slug: 'fish-finder', id: '6746223793' },
    { slug: 'kids-timer', id: '6747147301' },
    { slug: 'lullaby-pal', id: '6739187522' },
  ];

  test('every repaired hand-authored page advertises its verified App Store ID', async ({ page }) => {
    for (const app of apps) {
      const response = await page.goto(`/apps/${app.slug}/`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('meta[name="apple-itunes-app"]')).toHaveAttribute('content', `app-id=${app.id}`);
    }
  });
});

test.describe('Hand-authored hero product proof', () => {
  const apps = [
    { slug: 'anniversary-tracker', id: '1570714816' },
    { slug: 'baby-names', id: '6760255587' },
    { slug: 'baby-screen-lock', id: '6761378897' },
    { slug: 'bible-prayer', id: '6759859294' },
    { slug: 'birthday-reminder', id: '6739454115' },
    { slug: 'coloring', id: '6759912464' },
    { slug: 'fish-finder', id: '6746223793' },
    { slug: 'football-career-quest', id: '6777125671' },
    { slug: 'hoop-quest', id: '6775279715' },
    { slug: 'kids-timer', id: '6747147301' },
    { slug: 'lullaby-pal', id: '6739187522' },
    { slug: 'ollama-connect', id: '6769891596' },
    { slug: 'prime-minister-sim-politics', id: '6787888847' },
    { slug: 'solunar-fishing', id: '6760960543' },
    { slug: 'uv-index-widget-burn-time', id: '6760960498' },
  ];

  test('surfaces the first verified App Store screenshot in each hand-authored hero', async ({ page }) => {
    for (const app of apps) {
      const response = await page.goto(`/apps/${app.slug}/`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('section').first().locator('img.hero-screenshot')).toHaveAttribute(
        'src',
        `/images/apps/${app.id}/screenshot-1.jpg`,
      );
    }
  });
});
