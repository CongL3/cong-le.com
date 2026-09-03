#!/usr/bin/env node
/** Notify IndexNow about every URL in the built cong-le.com sitemap. */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  INDEXNOW_HOST,
  INDEXNOW_KEY,
  buildIndexNowPayload,
  pingIndexNow,
} from './lib/indexnow.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITEMAP_PATH = path.join(ROOT, 'public', 'sitemap.xml');
const KEY_PATH = path.join(ROOT, 'public', `${INDEXNOW_KEY}.txt`);
const DRY_RUN = process.argv.includes('--dry-run');

const keyFile = readFileSync(KEY_PATH, 'utf8').trim();
if (keyFile !== INDEXNOW_KEY) throw new Error('IndexNow key file does not match the configured key');

const sitemap = readFileSync(SITEMAP_PATH, 'utf8');
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(([, value]) => value.trim());
if (urlList.length === 0) throw new Error(`No URLs found in ${SITEMAP_PATH}`);

for (const rawUrl of urlList) {
  const url = new URL(rawUrl);
  if (url.protocol !== 'https:' || url.hostname !== INDEXNOW_HOST) {
    throw new Error(`Sitemap URL must be on https://${INDEXNOW_HOST}: ${rawUrl}`);
  }
}

if (DRY_RUN) {
  console.log(JSON.stringify(buildIndexNowPayload(urlList), null, 2));
} else {
  await pingIndexNow(urlList);
}
