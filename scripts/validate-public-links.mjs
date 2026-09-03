#!/usr/bin/env node

/** Structural guard for public download links. Live HTTP checks stay outside
 * builds because Apple can rate-limit automated requests. */

import { readFileSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RETIRED = [
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
for (const app of RETIRED) {
  const directory = path.join(ROOT, 'public/apps', app.slug);
  for (const file of filesUnder(directory).filter((candidate) => candidate.endsWith('.html'))) {
    const html = readFileSync(file, 'utf8');
    if (html.includes(`apps.apple.com`) || html.includes(`app-id=${app.id}`)) {
      errors.push(`${path.relative(ROOT, file)} still contains a retired App Store destination`);
    }
  }
}

const publicFiles = filesUnder(path.join(ROOT, 'public'));
for (const file of publicFiles.filter((candidate) => /\.(html|xml|txt)$/.test(candidate))) {
  const contents = readFileSync(file, 'utf8');
  for (const app of RETIRED) {
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
