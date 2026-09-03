#!/usr/bin/env node

/**
 * Remove download affordances from static pages for listings that are no
 * longer available. This is intentionally explicit and idempotent: it is a
 * maintenance migration, not a network probe or an automatic App Store
 * availability decision.
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = [
  'public/apps/docscanner-sign-documents',
  'public/apps/frankly-ai',
  'public/apps/run-run-run',
];

function htmlFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...htmlFiles(full));
    else if (entry.name === 'index.html') files.push(full);
  }
  return files;
}

for (const relativeDirectory of PAGES) {
  const directory = path.join(ROOT, relativeDirectory);
  for (const file of htmlFiles(directory)) {
    let html = readFileSync(file, 'utf8');
    const original = html;
    html = html.replace(/\n\s*<meta name="apple-itunes-app"[^>]*>/g, '');
    html = html.replace(
      /\n\s*<meta name="viewport"[^>]*>/,
      (match) => `${match}\n  <meta name="robots" content="noindex,follow">`,
    );
    html = html.replace(/\n\s*"downloadUrl":\s*"[^"]+",?/g, '');
    html = html.replace(/\n\s*"sameAs":\s*\[[^\]]*\],?/g, '');
    html = html.replace(/\n\s*"offers":\s*\{[\s\S]*?\n\s*\},/g, '');
    html = html.replace(
      /<a\s+href="https:\/\/apps\.apple\.com\/[^\"]+"[^>]*>([\s\S]*?)<\/a>/g,
      '<div class="inline-flex items-center gap-3 font-bold px-8 py-4 rounded-full text-lg bg-gray-200 text-gray-700" role="status">This app is not currently available on the App Store.</div>',
    );
    html = html.replace(/Download free on the App Store\./g, 'The App Store listing is currently unavailable.');
    html = html.replace(/Download on the App Store/g, 'App Store listing unavailable');
    html = html.replace(/Download Free on the App Store/g, 'App Store listing unavailable');
    if (!html.includes('data-retired-app-notice')) {
      html = html.replace(
        /<body([^>]*)>/,
        '<body$1>\n  <div data-retired-app-notice class="bg-amber-100 px-4 py-3 text-center text-sm text-amber-900" role="status">This app is not currently available for download from the App Store.</div>',
      );
    }
    if (html !== original) writeFileSync(file, html);
  }
}

console.log('retire-unavailable-pages: updated retired app pages');
