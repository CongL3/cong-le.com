#!/usr/bin/env node

/**
 * Generate the public app catalogue at /apps/.
 *
 * The individual landing pages remain the canonical product destinations. This
 * page is a lightweight, crawlable hub that makes the complete active
 * portfolio discoverable without duplicating app copy in a second data file.
 * It reads the title, description, icon, and verified store destinations from
 * those already-generated pages, so a new app is included automatically after
 * its landing page is synced.
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_ALIASES } from './lib/app-aliases.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const PUBLIC_APPS = path.join(PUBLIC, 'apps');
const OUTPUT = path.join(PUBLIC_APPS, 'index.html');
const SITE_URL = 'https://www.cong-le.com';

// Put the clearest current acquisition candidates first. The remainder is
// alphabetical, so the catalogue stays deterministic as apps are added.
const PRIORITY = [
  'anniversary-tracker',
  'football-career-quest',
  'hoop-quest',
  'solunar-fishing',
  'ollama-connect',
  'baby-screen-lock',
  'prime-minister-sim-politics',
];

const EXCLUDED_IDS = new Set(['6769176993', '6766366146', '1582701318']);

function decode(value = '') {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function esc(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripTags(value = '') {
  return decode(String(value).replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

function firstMatch(html, pattern) {
  return html.match(pattern)?.[1] || '';
}

function readSoftwareName(html) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const [, raw] of scripts) {
    try {
      const data = JSON.parse(raw.trim());
      if (data?.['@type'] === 'SoftwareApplication' && data.name) return String(data.name);
    } catch {
      // The app page itself remains valid even if an optional schema block is not.
    }
  }
  return stripTags(firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i));
}

function readAppPage(slug) {
  const directory = path.join(PUBLIC_APPS, slug);
  const file = path.join(directory, 'index.html');
  if (!statSync(directory).isDirectory() || !existsSync(file)) return null;

  const html = readFileSync(file, 'utf8');
  if (/name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)) return null;

  const canonical = firstMatch(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  if (canonical !== `${SITE_URL}/apps/${slug}/`) return null;

  const appId = firstMatch(html, /apple-itunes-app["']\s+content=["']app-id=(\d+)/i);
  if (!appId || EXCLUDED_IDS.has(appId)) return null;

  const storeUrls = [...html.matchAll(/https:\/\/apps\.apple\.com\/[^"'\s<]+/g)]
    .map(([url]) => decode(url));
  const storeUrl = storeUrls.find((url) => /\/app\/(?:[^/]+\/)?id\d+/.test(url));
  if (!storeUrl) return null;

  const playUrl = firstMatch(html, /<a\b[^>]*data-platform=["']android["'][^>]*href=["']([^"']+)["']/i);
  const icon = firstMatch(html, /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  const description = decode(firstMatch(html, /<meta\s+name=["']description["']\s+content="([^"]*)"/i));

  return {
    slug,
    appId,
    name: readSoftwareName(html) || slug,
    description: description || 'Explore the app and see how it works.',
    icon: icon || `${SITE_URL}/images/apps/${appId}/icon.jpg`,
    storeUrl,
    playUrl: playUrl ? decode(playUrl) : '',
    pageUrl: canonical,
  };
}

function attributedIosUrl(rawUrl, slug) {
  const url = new URL(rawUrl);
  url.searchParams.set('ct', `congle-web-apps-index-${slug}`);
  url.searchParams.set('pt', '19678800');
  return url.toString();
}

function attributedPlayUrl(rawUrl, slug) {
  if (!rawUrl) return '';
  const url = new URL(rawUrl);
  url.searchParams.set('utm_source', 'congle');
  url.searchParams.set('utm_medium', 'referral');
  url.searchParams.set('utm_campaign', 'apps_index');
  url.searchParams.set('utm_content', `${slug}-android`);
  return url.toString();
}

function sortApps(apps) {
  const priority = new Map(PRIORITY.map((slug, index) => [slug, index]));
  return [...apps].sort((a, b) => {
    const aPriority = priority.has(a.slug) ? priority.get(a.slug) : PRIORITY.length;
    const bPriority = priority.has(b.slug) ? priority.get(b.slug) : PRIORITY.length;
    return aPriority - bPriority || a.name.localeCompare(b.name);
  });
}

function render(apps) {
  const items = apps.map((app, index) => {
    const iosUrl = attributedIosUrl(app.storeUrl, app.slug);
    const playUrl = attributedPlayUrl(app.playUrl, app.slug);
    const storeButtons = [
      `<a class="store-link" href="${esc(iosUrl)}">Download on the App Store</a>`,
      playUrl ? `<a class="store-link store-link-secondary" href="${esc(playUrl)}">Get it on Google Play</a>` : '',
    ].filter(Boolean).join('\n            ');
    return `
      <article class="app-card" data-app-slug="${esc(app.slug)}">
        <img src="${esc(app.icon)}" alt="${esc(app.name)} app icon" width="76" height="76" loading="${index < 7 ? 'eager' : 'lazy'}" decoding="async">
        <div class="app-card-body">
          <h2><a href="${esc(app.pageUrl)}">${esc(app.name)}</a></h2>
          <p>${esc(app.description)}</p>
          <div class="app-actions">
            <a class="details-link" href="${esc(app.pageUrl)}">View app details <span aria-hidden="true">→</span></a>
            ${storeButtons}
          </div>
        </div>
      </article>`;
  }).join('');

  const itemList = apps.map((app, index) => `
        {
          "@type": "ListItem",
          "position": ${index + 1},
          "name": ${JSON.stringify(app.name)},
          "url": ${JSON.stringify(app.pageUrl)}
        }`).join(',');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>All iPhone Apps by Cong Le — App Catalogue</title>
    <meta name="description" content="Browse ${apps.length} iPhone apps by Cong Le, including relationship trackers, games, utilities, family tools, fishing apps, and private AI clients.">
    <meta name="robots" content="index,follow">
    <link rel="canonical" href="${SITE_URL}/apps/">
    <meta property="og:type" content="website">
    <meta property="og:title" content="All iPhone Apps by Cong Le — App Catalogue">
    <meta property="og:description" content="Browse the complete active catalogue of iPhone apps by Cong Le.">
    <meta property="og:url" content="${SITE_URL}/apps/">
    <meta property="og:image" content="${SITE_URL}/images/apps/1570714816/icon.jpg">
    <meta property="og:image:alt" content="Anniversary Tracker app icon">
    <meta property="og:site_name" content="Cong Le Apps">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="All iPhone Apps by Cong Le — App Catalogue">
    <meta name="twitter:description" content="Browse the complete active catalogue of iPhone apps by Cong Le.">
    <meta name="twitter:image" content="${SITE_URL}/images/apps/1570714816/icon.jpg">
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "All iPhone Apps by Cong Le",
      "description": "The active catalogue of iPhone apps by Cong Le.",
      "url": "${SITE_URL}/apps/",
      "isPartOf": { "@type": "WebSite", "url": "${SITE_URL}/" },
      "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": ${apps.length},
        "itemListElement": [${itemList}
        ]
      }
    }
    </script>
    <style>
      :root { color-scheme: light dark; --bg: #f7f7f8; --card: #fff; --text: #17181a; --muted: #5f6368; --line: #e4e5e7; --accent: #2563eb; }
      @media (prefers-color-scheme: dark) { :root { --bg: #0b0b0c; --card: #17181a; --text: #f5f5f6; --muted: #b5b7bc; --line: #2e3034; --accent: #78a9ff; } }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.55 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      a { color: inherit; }
      .shell { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
      header { border-bottom: 1px solid var(--line); background: color-mix(in srgb, var(--bg) 92%, transparent); }
      .nav { min-height: 68px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
      .brand { font-weight: 800; text-decoration: none; letter-spacing: -.02em; }
      nav a { margin-left: 18px; color: var(--muted); text-decoration: none; }
      nav a:hover, nav a:focus-visible { color: var(--accent); }
      main { padding: 64px 0 88px; }
      .breadcrumbs { color: var(--muted); font-size: .9rem; margin: 0 0 22px; }
      .breadcrumbs a { color: var(--muted); }
      h1 { max-width: 760px; font-size: clamp(2.5rem, 6vw, 4.8rem); line-height: 1.04; letter-spacing: -.055em; margin: 0 0 20px; }
      .intro { max-width: 720px; color: var(--muted); font-size: 1.2rem; margin: 0 0 42px; }
      .app-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 16px; }
      .app-card { display: flex; gap: 18px; padding: 22px; background: var(--card); border: 1px solid var(--line); border-radius: 22px; box-shadow: 0 8px 28px rgb(0 0 0 / .04); }
      .app-card > img { width: 76px; height: 76px; flex: 0 0 auto; border-radius: 18px; object-fit: cover; }
      .app-card-body { min-width: 0; flex: 1; }
      h2 { font-size: 1.18rem; line-height: 1.2; margin: 2px 0 8px; }
      h2 a { text-decoration: none; }
      h2 a:hover, h2 a:focus-visible { color: var(--accent); }
      .app-card p { color: var(--muted); margin: 0 0 15px; font-size: .94rem; }
      .app-actions { display: flex; flex-wrap: wrap; gap: 9px 14px; align-items: center; font-size: .86rem; }
      .details-link { color: var(--accent); font-weight: 700; text-decoration: none; }
      .store-link { color: var(--accent); text-decoration: none; }
      .store-link-secondary { color: var(--muted); }
      .store-link:hover, .store-link:focus-visible, .details-link:hover, .details-link:focus-visible { text-decoration: underline; }
      footer { border-top: 1px solid var(--line); color: var(--muted); padding: 28px 0 42px; }
      footer a { color: var(--muted); margin-right: 18px; }
      @media (max-width: 600px) { .nav { align-items: flex-start; flex-direction: column; padding: 18px 0; } nav a { margin: 0 14px 0 0; } main { padding-top: 42px; } .app-card { padding: 17px; gap: 13px; } }
    </style>
  </head>
  <body>
    <header>
      <div class="shell nav">
        <a class="brand" href="${SITE_URL}/">Cong Le</a>
        <nav aria-label="Primary"><a href="${SITE_URL}/">Home</a><a href="${SITE_URL}/blog/">Developer blog</a><a href="${SITE_URL}/press/">Press kit</a></nav>
      </div>
    </header>
    <main class="shell">
      <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${SITE_URL}/">Home</a> <span aria-hidden="true">/</span> Apps</nav>
      <h1>All iPhone apps by Cong Le</h1>
      <p class="intro">Browse ${apps.length} apps across relationship tracking, games, family tools, utilities, fishing, education, and private AI. Open an app page for the real screenshots and the correct store listing.</p>
      <section aria-labelledby="catalogue-heading">
        <h2 id="catalogue-heading" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">App catalogue</h2>
        <div class="app-grid">${items}
        </div>
      </section>
    </main>
    <footer><div class="shell"><a href="${SITE_URL}/privacy.html">Privacy</a><a href="${SITE_URL}/terms.html">Terms</a><a href="${SITE_URL}/developer.html">Support</a><p>© 2026 Cong Le. Independent iPhone apps.</p></div></footer>
    <!-- Cloudflare Web Analytics -->
    <script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "1b5835e62a88411eb7576836db500dc6"}'></script>
    <!-- End Cloudflare Web Analytics -->
  </body>
</html>
`;
}

export function generateAppsIndex() {
  const apps = sortApps(
    readdirSync(PUBLIC_APPS)
      .filter((slug) => slug !== 'index.html' && !APP_ALIASES[slug])
      .map((slug) => readAppPage(slug))
      .filter(Boolean),
  );
  writeFileSync(OUTPUT, render(apps));
  console.log(`generate-apps-index: ${apps.length} apps -> public/apps/index.html`);
  return apps.length;
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  generateAppsIndex();
}
