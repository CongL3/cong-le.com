#!/usr/bin/env node

/**
 * Generate the public creator/press page from the canonical app landing pages.
 *
 * The landing pages are the source of truth for names, descriptions, screenshots,
 * and listing IDs. Keeping this page generated prevents the media kit from
 * drifting away from the public product catalogue.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SITE_URL } from './lib/apps.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const PRESS_DIR = path.join(PUBLIC, 'press');
const PRESS_URL = `${SITE_URL}/press/`;

// This is intentionally a small, useful starting set rather than a second
// catalogue. Add an app only when it has a current landing page, real visuals,
// and a store listing that has been verified by the website workflow.
const PRESS_APP_SLUGS = [
  'anniversary-tracker',
  'football-career-quest',
  'hoop-quest',
  'solunar-fishing',
  'ollama-connect',
  'baby-screen-lock',
  'moon-phases-lunar-tracker',
  'prime-minister-sim-politics',
];

const SUMMARY_OVERRIDES = {
  'anniversary-tracker': 'Count the days, reminders, and milestones that matter to you.',
  'football-career-quest': 'Build a full football career from first prospect to club legend.',
  'hoop-quest': 'A retro basketball career simulator where you create a player, chase the draft, and play live games.',
  'solunar-fishing': 'Plan fishing trips around major and minor feeding windows, daily fish ratings, and a seven-day calendar.',
  'ollama-connect': 'Connect to Ollama on your Mac, home server, or private endpoint and chat with your own models.',
  'baby-screen-lock': "Keep little ones entertained while locking the iPhone screen so they can't call, delete, or exit.",
  'moon-phases-lunar-tracker': "See tonight's moon phase, moonrise and moonset times, and the next full moon, including offline.",
  'prime-minister-sim-politics': 'A fictional political survival game where every choice changes who stays on your side.',
};

function decodeHtml(value = '') {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&ndash;|&#8211;/gi, '–')
    .replace(/&mdash;|&#8212;/gi, '—')
    .trim();
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value = '') {
  return escapeHtml(value);
}

function attribute(tag, name) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i');
  return tag.match(pattern)?.[2] || '';
}

function firstTag(html, tagName, predicate = () => true) {
  const tags = [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'gi'))].map((match) => match[0]);
  return tags.find(predicate) || '';
}

function readSoftwareSchema(html) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of scripts) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed && parsed['@type'] === 'SoftwareApplication') return parsed;
    } catch {
      // Optional structured data must not prevent the media kit from building.
    }
  }
  return null;
}

function readApp(slug) {
  const pagePath = path.join(PUBLIC, 'apps', slug, 'index.html');
  if (!existsSync(pagePath)) throw new Error(`missing landing page for press app: ${slug}`);
  const html = readFileSync(pagePath, 'utf8');
  const software = readSoftwareSchema(html);
  const title = decodeHtml(firstTag(html, 'title').replace(/^<title>|<\/title>$/gi, ''));
  const descriptionTag = firstTag(html, 'meta', (tag) => /\bname=["']description["']/i.test(tag));
  const description = decodeHtml(attribute(descriptionTag, 'content'));
  const appStoreTag = firstTag(html, 'meta', (tag) => /\bname=["']apple-itunes-app["']/i.test(tag));
  const appId = attribute(appStoreTag, 'content').match(/app-id=(\d+)/i)?.[1]
    || html.match(/apps\.apple\.com\/[^"'\s]*\/id(\d+)/i)?.[1]
    || '';
  if (!appId) throw new Error(`${slug}: cannot find App Store listing ID`);

  const imagePaths = [...html.matchAll(/<img\b[^>]*>/gi)]
    .map((match) => attribute(match[0], 'src'))
    .filter((src) => src.startsWith('/images/apps/') && /\/screenshot-\d+\.jpg$/i.test(src))
    .filter((src, index, all) => all.indexOf(src) === index)
    .slice(0, 3);
  if (imagePaths.length < 3) throw new Error(`${slug}: expected at least three real screenshots`);
  for (const imagePath of imagePaths) {
    if (!existsSync(path.join(PUBLIC, imagePath.slice(1)))) {
      throw new Error(`${slug}: missing screenshot ${imagePath}`);
    }
  }

  const playMatches = [...html.matchAll(/https:\/\/play\.google\.com\/store\/apps\/details\?[^"'<>\s]+/gi)]
    .map((match) => decodeHtml(match[0]));
  let packageName = '';
  for (const match of playMatches) {
    try {
      const url = new URL(match);
      packageName = url.searchParams.get('id') || '';
      if (packageName) break;
    } catch {
      // Ignore malformed optional links and keep looking for a valid listing.
    }
  }

  const name = String(software?.name || title.split(' — ')[0] || slug).trim();
  const page = `${SITE_URL}/apps/${slug}/`;
  const iosUrl = new URL(`https://apps.apple.com/app/id${appId}`);
  iosUrl.searchParams.set('ct', `congle-web-press-${slug}`);
  iosUrl.searchParams.set('pt', '19678800');
  iosUrl.searchParams.set('mt', '8');
  const androidUrl = packageName ? new URL('https://play.google.com/store/apps/details') : null;
  if (androidUrl) {
    androidUrl.searchParams.set('id', packageName);
    androidUrl.searchParams.set('utm_source', 'congle');
    androidUrl.searchParams.set('utm_medium', 'referral');
    androidUrl.searchParams.set('utm_campaign', 'press_kit');
    androidUrl.searchParams.set('utm_content', slug);
  }

  return {
    slug,
    name,
    description: SUMMARY_OVERRIDES[slug] || String(software?.description || description || '').trim(),
    page,
    appId,
    imagePaths,
    iosUrl: iosUrl.toString(),
    androidUrl: androidUrl?.toString() || '',
  };
}

function jsonLd(value) {
  return JSON.stringify(value, null, 2).replace(/</g, '\\u003c');
}

function renderAppCard(app, position) {
  const screenshots = app.imagePaths.map((imagePath, index) => `
          <figure>
            <img src="${escapeAttribute(imagePath)}" alt="${escapeAttribute(`${app.name} screenshot ${index + 1}`)}" width="220" height="477" loading="${index === 0 && position < 2 ? 'eager' : 'lazy'}" decoding="async">
          </figure>`).join('');
  const android = app.androidUrl
    ? `
              <a class="store-link secondary" data-platform="android" data-cta-position="press" href="${escapeAttribute(app.androidUrl)}">Get it on Google Play <span aria-hidden="true">↗</span></a>`
    : '';
  return `
      <article class="app-card" data-press-app="${escapeAttribute(app.slug)}">
        <div class="screenshot-strip" role="list" aria-label="${escapeAttribute(`${app.name} screenshots`)}">${screenshots}
        </div>
        <div class="app-card-body">
          <p class="eyebrow">${escapeHtml(app.androidUrl ? 'iPhone + Android' : 'iPhone')}</p>
          <h2>${escapeHtml(app.name)}</h2>
          <p>${escapeHtml(app.description)}</p>
          <div class="app-actions">
            <a class="store-link primary" data-platform="ios" data-cta-position="press" href="${escapeAttribute(app.iosUrl)}">Download on the App Store <span aria-hidden="true">↗</span></a>${android}
          </div>
          <a class="app-page-link" href="${escapeAttribute(app.page)}">View the app page <span aria-hidden="true">→</span></a>
        </div>
      </article>`;
}

export function generatePressPage() {
  const apps = PRESS_APP_SLUGS.map(readApp);
  const data = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Press & media kit — Cong Le Apps',
    url: PRESS_URL,
    description: 'Current app descriptions, real product screenshots, permanent app pages, and direct store links for sharing Cong Le Apps.',
    publisher: {
      '@type': 'Person',
      name: 'Cong Le',
      url: SITE_URL,
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: apps.map((app, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: app.name,
        url: app.page,
      })),
    },
  };
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Press &amp; media kit — Cong Le Apps</title>
    <meta name="description" content="Current app descriptions, real product screenshots, permanent app pages, and direct store links for sharing Cong Le Apps.">
    <link rel="canonical" href="${PRESS_URL}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="Press &amp; media kit — Cong Le Apps">
    <meta property="og:description" content="Current app descriptions, real product screenshots, permanent app pages, and direct store links for sharing Cong Le Apps.">
    <meta property="og:url" content="${PRESS_URL}">
    <meta property="og:image" content="${SITE_URL}${apps[0].imagePaths[0]}">
    <meta property="og:image:alt" content="${escapeAttribute(`${apps[0].name} product screenshot`)}">
    <meta property="og:site_name" content="Cong Le Apps">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Press &amp; media kit — Cong Le Apps">
    <meta name="twitter:description" content="Current app descriptions, real product screenshots, permanent app pages, and direct store links for sharing Cong Le Apps.">
    <meta name="twitter:image" content="${SITE_URL}${apps[0].imagePaths[0]}">
    <meta name="twitter:image:alt" content="${escapeAttribute(`${apps[0].name} product screenshot`)}">
    <script type="application/ld+json">
${jsonLd(data)}
    </script>
    <script>
      (function () {
        var saved = localStorage.getItem('theme');
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (saved === 'dark' || (!saved && prefersDark)) document.documentElement.classList.add('dark');
      })();
    </script>
    <style>
      :root { color-scheme: light; --bg: #f7f4ed; --surface: #fffdf8; --ink: #17212b; --muted: #5e6870; --line: #e6dfd2; --accent: #d85a38; --accent-ink: #fff; }
      .dark { color-scheme: dark; --bg: #11171b; --surface: #1a2328; --ink: #f6f0e4; --muted: #bdc4c7; --line: #334047; --accent: #ff8a65; --accent-ink: #1a1713; }
      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.6 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      a { color: inherit; }
      .skip-link { position: absolute; left: -9999px; }
      .skip-link:focus { left: 1rem; top: 1rem; z-index: 2; padding: .6rem .8rem; background: var(--surface); border: 2px solid var(--accent); }
      .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
      .shell { width: min(1120px, calc(100% - 2rem)); margin: 0 auto; }
      header { padding: 1.25rem 0; border-bottom: 1px solid var(--line); }
      nav { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
      nav a { text-decoration: none; font-weight: 700; }
      .back-link { color: var(--muted); font-weight: 500; }
      main { padding: 4rem 0 5rem; }
      .intro { max-width: 720px; margin-bottom: 3rem; }
      .eyebrow { color: var(--accent); font-size: .78rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; margin: 0 0 .6rem; }
      h1 { max-width: 760px; font-size: clamp(2.5rem, 7vw, 5.5rem); line-height: 1.02; letter-spacing: -.055em; margin: 0 0 1.25rem; }
      .intro > p { color: var(--muted); font-size: 1.15rem; max-width: 650px; margin: 0; }
      .note { margin-top: 1.25rem; color: var(--muted); font-size: .92rem; }
      .app-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem; }
      .app-card { overflow: hidden; background: var(--surface); border: 1px solid var(--line); border-radius: 1.25rem; box-shadow: 0 12px 35px rgba(31, 31, 26, .06); }
      .screenshot-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: .5rem; padding: .75rem; background: color-mix(in srgb, var(--accent) 10%, var(--surface)); }
      .screenshot-strip figure { margin: 0; overflow: hidden; border-radius: .7rem; background: var(--bg); }
      .screenshot-strip img { display: block; width: 100%; height: auto; aspect-ratio: 220 / 477; object-fit: cover; }
      .app-card-body { padding: 1.35rem 1.35rem 1.5rem; }
      .app-card h2 { margin: 0 0 .45rem; font-size: 1.45rem; line-height: 1.15; letter-spacing: -.025em; }
      .app-card-body > p:not(.eyebrow) { color: var(--muted); margin: 0; min-height: 3.2em; }
      .app-actions { display: flex; flex-wrap: wrap; gap: .6rem; margin-top: 1.15rem; }
      .store-link { display: inline-flex; align-items: center; gap: .35rem; border-radius: 999px; padding: .65rem .9rem; text-decoration: none; font-size: .86rem; font-weight: 800; }
      .store-link.primary { background: var(--ink); color: var(--bg); }
      .store-link.secondary { border: 1px solid var(--line); }
      .store-link:hover, .store-link:focus-visible, .app-page-link:hover, .app-page-link:focus-visible { outline: 3px solid color-mix(in srgb, var(--accent) 55%, transparent); outline-offset: 2px; }
      .app-page-link { display: inline-block; margin-top: 1rem; color: var(--muted); font-size: .9rem; font-weight: 700; text-decoration-thickness: .08em; text-underline-offset: .2em; }
      footer { border-top: 1px solid var(--line); padding: 1.5rem 0 3rem; color: var(--muted); font-size: .92rem; }
      footer p { margin: .35rem 0; }
      @media (max-width: 760px) { .app-grid { grid-template-columns: 1fr; } main { padding-top: 3rem; } }
      @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
    </style>
  </head>
  <body>
    <a class="skip-link" href="#apps">Skip to apps</a>
    <header>
      <div class="shell">
        <nav aria-label="Primary navigation">
          <a href="${SITE_URL}/">Cong Le Apps</a>
          <a class="back-link" href="${SITE_URL}/">Back to portfolio <span aria-hidden="true">→</span></a>
        </nav>
      </div>
    </header>
    <main class="shell">
      <section class="intro" aria-labelledby="page-title">
        <p class="eyebrow">Press &amp; media kit</p>
        <h1 id="page-title">Real apps worth sharing.</h1>
        <p>Current descriptions, real product screenshots, and direct store links for creators, writers, and communities sharing Cong Le Apps.</p>
        <p class="note">Please link to the permanent app page when you can. Store buttons below include free campaign attribution so we can understand which shares send people to a listing.</p>
      </section>
      <section id="apps" aria-labelledby="apps-heading">
        <h2 id="apps-heading" class="visually-hidden">Featured apps</h2>
        <div class="app-grid">${apps.map(renderAppCard).join('')}
        </div>
      </section>
    </main>
    <footer>
      <div class="shell">
        <p>Descriptions and screenshots are drawn from the current public app pages.</p>
        <p>Questions, review copies, or corrections: <a href="mailto:support@cong-le.com">support@cong-le.com</a>.</p>
        <p><a href="${SITE_URL}/privacy.html">Privacy</a> · <a href="${SITE_URL}/developer.html">Developer support</a></p>
      </div>
    </footer>
  </body>
</html>
`;
  writeFileSync(path.join(PRESS_DIR, 'index.html'), html);
  console.log(`generate-press-page: ${apps.length} apps -> public/press/index.html`);
  return apps.length;
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  mkdirSync(PRESS_DIR, { recursive: true });
  generatePressPage();
}
