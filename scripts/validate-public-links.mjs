#!/usr/bin/env node

/** Structural guard for public download links. Live HTTP checks stay outside
 * builds because Apple can rate-limit automated requests. */

import { readFileSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXCLUDED = [
  { slug: 'docscanner-sign-documents', id: '6769176993' },
  { slug: 'frankly-ai', id: '6766366146' },
  { slug: 'run-run-run', id: '1582701318' },
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
for (const app of EXCLUDED) {
  const directory = path.join(ROOT, 'public/apps', app.slug);
  for (const file of filesUnder(directory).filter((candidate) => candidate.endsWith('.html'))) {
    const html = readFileSync(file, 'utf8');
    if (html.includes(`apps.apple.com`) || html.includes(`app-id=${app.id}`)) {
      errors.push(`${path.relative(ROOT, file)} still contains a retired App Store destination`);
    }
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
