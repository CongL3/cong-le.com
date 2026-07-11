#!/usr/bin/env node
/**
 * update-landing-links.mjs
 * Keeps the "Guides & articles" blog-link section on each app landing page in
 * sync with the published blog. Reads public/blog/posts-index.json and, for
 * every public/apps/<slug>/index.html that contains a marker pair
 *
 *     <!-- BLOG-LINKS:<app-slug> -->  ...  <!-- /BLOG-LINKS -->
 *
 * replaces everything between the markers with a styled list of that app's
 * published posts (max 5, newest first). When the app has no published posts,
 * the space between the markers is left empty so the whole section — which the
 * markers wrap in full — renders as nothing.
 *
 * The operation is idempotent: re-running with the same posts-index produces
 * byte-identical files. Files without the markers are skipped untouched.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_APPS = path.join(ROOT, 'public/apps');
const POSTS_INDEX = path.join(ROOT, 'public/blog/posts-index.json');

const MAX_LINKS = 5;

function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Load posts-index.json, grouped by app slug (already newest-first). */
function loadPostsByApp() {
  if (!existsSync(POSTS_INDEX)) return new Map();
  let entries;
  try {
    entries = JSON.parse(readFileSync(POSTS_INDEX, 'utf8'));
  } catch (err) {
    console.warn(`update-landing-links: cannot parse posts-index.json (${err.message}); treating as empty.`);
    return new Map();
  }
  const byApp = new Map();
  for (const e of Array.isArray(entries) ? entries : []) {
    if (!e || !e.app) continue;
    if (!byApp.has(e.app)) byApp.set(e.app, []);
    byApp.get(e.app).push(e);
  }
  return byApp;
}

/** Build the section HTML placed between the markers for a given app's posts. */
function renderSection(posts) {
  if (!posts || posts.length === 0) return '';
  const items = posts
    .slice(0, MAX_LINKS)
    .map(
      (p) => `        <li>
          <a href="/blog/${esc(p.slug)}/" class="block rounded-2xl p-5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <span class="block font-semibold text-gray-900 dark:text-white mb-1">${esc(p.title)}</span>
            <span class="block text-sm text-gray-500 dark:text-gray-400">${esc(p.description)}</span>
          </a>
        </li>`
    )
    .join('\n');
  return `
  <section class="py-16 lg:py-20">
    <div class="max-w-3xl mx-auto px-6 fade-up">
      <h2 class="text-3xl md:text-4xl mb-8">Guides &amp; articles</h2>
      <ul class="grid gap-4">
${items}
      </ul>
    </div>
  </section>
`;
}

/**
 * Replace the content between every BLOG-LINKS marker pair in `html`.
 * Returns { html, changed, matched }.
 */
function updateHtml(html, byApp) {
  const re = /<!--\s*BLOG-LINKS:([a-z0-9-]+)\s*-->([\s\S]*?)<!--\s*\/BLOG-LINKS\s*-->/g;
  let matched = false;
  const next = html.replace(re, (_full, appSlug, _inner) => {
    matched = true;
    const section = renderSection(byApp.get(appSlug));
    return `<!-- BLOG-LINKS:${appSlug} -->${section}<!-- /BLOG-LINKS -->`;
  });
  return { html: next, changed: next !== html, matched };
}

export function updateLandingLinks() {
  const byApp = loadPostsByApp();
  let dirs;
  try {
    dirs = readdirSync(PUBLIC_APPS, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return { scanned: 0, updated: 0, withMarkers: 0 };
  }

  let updated = 0;
  let withMarkers = 0;
  for (const slug of dirs) {
    const file = path.join(PUBLIC_APPS, slug, 'index.html');
    if (!existsSync(file)) continue;
    const html = readFileSync(file, 'utf8');
    const res = updateHtml(html, byApp);
    if (res.matched) withMarkers++;
    if (res.changed) {
      writeFileSync(file, res.html);
      updated++;
    }
  }

  console.log(
    `update-landing-links: ${withMarkers} page(s) with markers, ${updated} rewritten.`
  );
  return { scanned: dirs.length, updated, withMarkers };
}

// Run when invoked directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  updateLandingLinks();
}
