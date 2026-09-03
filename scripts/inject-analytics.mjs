#!/usr/bin/env node
/**
 * Add the existing Cloudflare Web Analytics beacon to every deployed HTML
 * page. Static app and blog pages are copied into dist/ by Vite, so a
 * post-build pass keeps the production surface complete without hand-editing
 * generated HTML.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const MARKER = '<!-- Cloudflare Web Analytics -->';
const SNIPPET = [
  MARKER,
  '  <script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon=\'{"token": "1b5835e62a88411eb7576836db500dc6"}\'></script>',
  '  <!-- End Cloudflare Web Analytics -->',
].join('\n');

export function injectAnalytics(html) {
  if (html.includes(MARKER)) return html;
  const closingBody = html.lastIndexOf('</body>');
  if (closingBody === -1) throw new Error('HTML document has no closing body tag');
  return html.slice(0, closingBody) + SNIPPET + '\n' + html.slice(closingBody);
}

function filesUnder(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...filesUnder(full));
    else files.push(full);
  }
  return files;
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  if (!existsSync(DIST)) throw new Error('missing build output: ' + DIST);
  let updated = 0;
  const htmlFiles = filesUnder(DIST).filter((file) => file.endsWith('.html'));
  for (const file of htmlFiles) {
    const before = readFileSync(file, 'utf8');
    const after = injectAnalytics(before);
    if (after !== before) {
      writeFileSync(file, after);
      updated += 1;
    }
  }
  console.log(
    'Cloudflare Web Analytics: checked ' + htmlFiles.length + ' HTML file(s), updated ' + updated + '.',
  );
}

