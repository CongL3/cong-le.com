#!/usr/bin/env node
/**
 * update-landing-links.mjs
 * Keeps the "Guides & articles" blog-link section on each app landing page in
 * sync with the published blog. Reads public/blog/posts-index.json and the
 * small allowlisted set of already-published Pocket Grove guides, then, for
 * every public/apps/<slug>/index.html that contains a marker pair
 *
 *     <!-- BLOG-LINKS:<app-slug> -->  ...  <!-- /BLOG-LINKS -->
 *
 * replaces everything between the markers with a styled list of that app's
 * published posts and companion Pocket Grove guides (max 5). When the app has
 * no published posts or companion guides,
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

// Pocket Grove owns the companion app site and publishes the deeper, app-led
// guides there. Keep only already-published URLs here: a future article must
// not create a dead link from a high-traffic landing page. These entries are
// merged with the local blog posts below and are rendered by the same marker
// block, so the bridge survives every normal blog rebuild.
const POCKET_GROVE_GUIDES = {
  'anniversary-tracker': [
    {
      url: 'https://pocketgrove.com/blog/50-dates-worth-tracking-beyond-birthdays-anniversaries/',
      title: '50 Dates Worth Tracking: Beyond Birthdays and Anniversaries',
      description: 'Relationship, family, pet, career, and personal milestones worth recording so meaningful dates do not disappear.',
    },
    {
      url: 'https://pocketgrove.com/blog/anniversary-countdown-widget-iphone-setup-guide/',
      title: 'Anniversary Countdown Widget for iPhone: Setup Guide',
      description: 'How to keep the next anniversary visible on your iPhone home screen with a countdown widget and reminders.',
    },
  ],
  'ollama-connect': [
    {
      url: 'https://pocketgrove.com/blog/best-small-llms-to-run-on-home-mac-with-ollama/',
      title: 'Best Small Ollama Models for a Home Mac in 2026',
      description: 'A practical shortlist of small Ollama models for a home Mac, with current model tags, download sizes, and honest memory caveats.',
    },
    {
      url: 'https://pocketgrove.com/blog/ollama-setup-guide-serving-models-on-local-network/',
      title: 'Ollama Setup Guide: Serving Models on Your Local Network',
      description: 'Set up Ollama on a Mac or home server and make a local model reachable from your iPhone.',
    },
    {
      url: 'https://pocketgrove.com/blog/run-llm-locally-use-from-phone/',
      title: 'Run a Private LLM at Home and Use It From Your Phone',
      description: 'A practical path from a local Ollama install to private model access away from your desk.',
    },
  ],
  'solunar-fishing': [
    {
      url: 'https://pocketgrove.com/blog/best-fishing-times-by-season/',
      title: 'Best Fishing Times by Season: When to Go Out All Year',
      description: 'A seasonal guide to planning fishing trips around daylight, water conditions, and solunar feeding windows.',
    },
  ],
  'prime-minister-sim-politics': [
    {
      url: 'https://pocketgrove.com/blog/prime-minister-simulator-political-survival-game/',
      title: 'A Prime Minister Simulator Where Every Decision Costs You',
      description: 'How the fictional political survival game turns cabinet choices, PMQs, and public opinion into a short strategy loop.',
    },
  ],
};

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
          <a href="${esc(p.url || `/blog/${p.slug}/`)}" class="block rounded-2xl p-5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <span class="block font-semibold text-gray-900 dark:text-white mb-1">${esc(p.title)}</span>
            <span class="block text-sm text-gray-500 dark:text-gray-400">${esc(p.description)}</span>${p.url ? `
            <span class="block text-xs text-gray-400 dark:text-gray-500 mt-3">Read on Pocket Grove →</span>` : ''}
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
    const section = renderSection([...(POCKET_GROVE_GUIDES[appSlug] || []), ...(byApp.get(appSlug) || [])]);
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
