#!/usr/bin/env node

/** Structural guard for public download links. Live HTTP checks stay outside
 * builds because Apple can rate-limit automated requests. */

import { existsSync, readFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { APP_ALIASES } from './lib/app-aliases.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXCLUDED = [
  { slug: 'docscanner-sign-documents', id: '6769176993' },
  { slug: 'frankly-ai', id: '6766366146' },
  { slug: 'run-run-run', id: '1582701318' },
];

// Generated pages should expose the real screenshots already synced into the
// public catalogue. Hand-made pages have their own content contract and are
// checked separately through PRIORITY_GALLERIES where applicable.
const HANDMADE_APP_IDS = new Set([
  '1570714816',
  '6766366146',
  '6769891596',
  '6761378897',
  '6775279715',
  '6760960543',
  '6747147301',
  '6760255587',
  '6759912464',
  '6759859294',
  '6746223793',
  '6739454115',
  '6739187522',
  '6777125671',
  '6787888847',
  '6760960498',
]);

// These active apps have the strongest recent download signal. Keep their
// public landing pages honest about the product before a visitor reaches the
// tracked store CTA: the gallery must use the real synced App Store captures,
// and every referenced file must ship with the site.
const PRIORITY_GALLERIES = [
  { slug: 'anniversary-tracker', id: '1570714816', count: 4 },
  { slug: 'football-career-quest', id: '6777125671', count: 5 },
  { slug: 'prime-minister-sim-politics', id: '6787888847', count: 5 },
  { slug: 'hoop-quest', id: '6775279715', count: 5 },
  { slug: 'solunar-fishing', id: '6760960543', count: 5 },
  { slug: 'ollama-connect', id: '6769891596', count: 5 },
  { slug: 'baby-screen-lock', id: '6761378897', count: 5 },
  { slug: 'birthday-reminder', id: '6739454115', count: 5 },
  { slug: 'kids-timer', id: '6747147301', count: 3 },
  { slug: 'baby-names', id: '6760255587', count: 5 },
  { slug: 'coloring', id: '6759912464', count: 4 },
  { slug: 'bible-prayer', id: '6759859294', count: 4 },
  { slug: 'fish-finder', id: '6746223793', count: 3 },
  { slug: 'lullaby-pal', id: '6739187522', count: 5 },
  { slug: 'uv-index-widget-burn-time', id: '6760960498', count: 3 },
];

// Legacy pages that were previously too short to explain their product well
// in search. These sections are intentionally checked here because they are
// hand-authored and therefore outside the generated-page template.
const LEGACY_CONTENT_PAGES = [
  'baby-names',
  'bible-prayer',
  'birthday-reminder',
  'coloring',
  'fish-finder',
  'kids-timer',
  'lullaby-pal',
];

function filesUnder(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...filesUnder(full));
    else files.push(full);
  }
  return files;
}

const errors = [];

for (const [alias, destination] of Object.entries(APP_ALIASES)) {
  const file = path.join(ROOT, 'public/apps', alias, 'index.html');
  if (!existsSync(file)) {
    errors.push(`missing historical app alias ${path.relative(ROOT, file)}`);
    continue;
  }
  const html = readFileSync(file, 'utf8');
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1] || '';
  const expected = `https://www.cong-le.com/apps/${destination}/`;
  if (canonical !== expected) {
    errors.push(`${path.relative(ROOT, file)} must canonicalize to ${expected}`);
  }
  if (!/noindex/i.test(html) || !html.includes(`/apps/${destination}/`)) {
    errors.push(`${path.relative(ROOT, file)} must provide a noindex redirect to /apps/${destination}/`);
  }
}

function appIdFromHtml(html) {
  return html.match(/apple-itunes-app["']\s+content=["']app-id=(\d+)/i)?.[1] || null;
}

const appPageById = new Map();
for (const file of filesUnder(path.join(ROOT, 'public/apps')).filter((candidate) => candidate.endsWith('/index.html'))) {
  const id = appIdFromHtml(readFileSync(file, 'utf8'));
  if (id) appPageById.set(id, file);
}

function slugify(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const manifestPath = path.join(ROOT, 'public/images/apps/manifest.json');
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  for (const app of manifest.apps || []) {
    const id = String(app.trackId);
    if (EXCLUDED.some((excluded) => excluded.id === id) || HANDMADE_APP_IDS.has(id)) continue;

    const canonicalFile = path.join(ROOT, 'public/apps', slugify(app.trackName), 'index.html');
    const file = existsSync(canonicalFile) ? canonicalFile : appPageById.get(id);
    const screenshots = Array.isArray(app.screenshots) ? app.screenshots.filter(Boolean).slice(0, 5) : [];
    if (!file) {
      errors.push(`missing generated app landing page for ${app.trackName} (${id})`);
      continue;
    }

    const html = readFileSync(file, 'utf8');
    const refs = [...html.matchAll(/<img\b[^>]*src=["'](\/images\/apps\/\d+\/screenshot-\d+\.jpg)["'][^>]*>/gi)].map(
      (match) => match[1],
    );
    const uniqueRefs = [...new Set(refs)];
    if (uniqueRefs.length !== screenshots.length) {
      errors.push(
        `${path.relative(ROOT, file)} must expose ${screenshots.length} unique synced App Store screenshots (found ${uniqueRefs.length})`,
      );
    }
    for (const screenshot of screenshots) {
      if (!refs.includes(screenshot)) {
        errors.push(`${path.relative(ROOT, file)} does not render synced screenshot ${screenshot}`);
      } else if (!existsSync(path.join(ROOT, 'public', screenshot.slice(1)))) {
        errors.push(`${path.relative(ROOT, file)} references missing screenshot asset ${screenshot}`);
      }
    }
    for (const ref of uniqueRefs) {
      if (!ref.startsWith(`/images/apps/${id}/`)) {
        errors.push(`${path.relative(ROOT, file)} references the wrong screenshot app id: ${ref}`);
      }
    }
  }
}

for (const app of EXCLUDED) {
  const directory = path.join(ROOT, 'public/apps', app.slug);
  for (const file of filesUnder(directory).filter((candidate) => candidate.endsWith('.html'))) {
    const html = readFileSync(file, 'utf8');
    if (html.includes(`apps.apple.com`) || html.includes(`app-id=${app.id}`)) {
      errors.push(`${path.relative(ROOT, file)} still contains a retired App Store destination`);
    }
  }
}

for (const gallery of PRIORITY_GALLERIES) {
  const file = path.join(ROOT, 'public/apps', gallery.slug, 'index.html');
  if (!existsSync(file)) {
    errors.push(`missing priority app landing page ${path.relative(ROOT, file)}`);
    continue;
  }
  const html = readFileSync(file, 'utf8');
  const refs = [...html.matchAll(/<img\b[^>]*src=["'](\/images\/apps\/\d+\/screenshot-\d+\.jpg)["'][^>]*>/gi)].map(
    (match) => match[1],
  );
  const uniqueRefs = [...new Set(refs)];
  if (uniqueRefs.length !== gallery.count) {
    errors.push(
      `${path.relative(ROOT, file)} must expose ${gallery.count} unique real App Store screenshots (found ${uniqueRefs.length})`,
    );
  }
  const expectedPrefix = `/images/apps/${gallery.id}/screenshot-`;
  for (const ref of uniqueRefs) {
    if (!ref.startsWith(expectedPrefix)) {
      errors.push(`${path.relative(ROOT, file)} references the wrong screenshot app id: ${ref}`);
    }
    if (!existsSync(path.join(ROOT, 'public', ref.slice(1)))) {
      errors.push(`${path.relative(ROOT, file)} references missing screenshot asset ${ref}`);
    }
  }
}

for (const slug of LEGACY_CONTENT_PAGES) {
  const file = path.join(ROOT, 'public/apps', slug, 'index.html');
  if (!existsSync(file)) {
    errors.push(`missing enriched legacy app page ${path.relative(ROOT, file)}`);
    continue;
  }
  const html = readFileSync(file, 'utf8');
  if (!html.includes('aria-labelledby="how-it-works-heading"') || !html.includes('Common questions')) {
    errors.push(`${path.relative(ROOT, file)} must include the verified how-it-works and FAQ content section`);
  }
}

// Every product CTA on an app landing page must point to a concrete listing,
// retain the free App Store Connect attribution, and stay in the current tab.
// A reader often arrives here from search on an iPhone; opening a second tab
// makes the download hand-off needlessly fragile on mobile browsers.
for (const file of filesUnder(path.join(ROOT, 'public/apps')).filter((candidate) => candidate.endsWith('.html'))) {
  const html = readFileSync(file, 'utf8');
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)) {
    const tag = match[0];
    const href = match[1].replace(/&amp;/g, '&');
    if (!href.includes('apps.apple.com')) continue;

    let url;
    try {
      url = new URL(href);
    } catch {
      errors.push(`${path.relative(ROOT, file)} contains an invalid App Store URL`);
      continue;
    }
    if (!/\/app\/(?:id\d+|[^/]+\/id\d+)/.test(url.pathname)) {
      errors.push(`${path.relative(ROOT, file)} points to an App Store directory instead of a product listing`);
    }
    if (url.searchParams.get('pt') !== '19678800') {
      errors.push(`${path.relative(ROOT, file)} is missing the App Store provider token`);
    }
    if (!String(url.searchParams.get('ct') || '').startsWith('congle-web-')) {
      errors.push(`${path.relative(ROOT, file)} is missing the Cong Le campaign token`);
    }
    if (/\btarget=["']_blank["']/i.test(tag)) {
      errors.push(`${path.relative(ROOT, file)} opens a product download in a new tab`);
    }
  }
}

const publicFiles = filesUnder(path.join(ROOT, 'public'));
for (const file of publicFiles.filter((candidate) => /\.(html|xml|txt)$/.test(candidate))) {
  const contents = readFileSync(file, 'utf8');
  for (const app of EXCLUDED) {
    if (contents.includes(`apps.apple.com`) && contents.includes(`id${app.id}`)) {
      errors.push(`${path.relative(ROOT, file)} advertises retired App Store id ${app.id}`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('validate-public-links: no retired App Store destinations are publicly advertised');
