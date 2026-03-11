#!/usr/bin/env node
/**
 * sync-apps.mjs
 * Fetches all apps from the iTunes API for this developer,
 * downloads any new icons/screenshots, updates manifest.json,
 * and appends new apps to constants.ts automatically.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_IMAGES = path.join(ROOT, 'public/images/apps');
const SRC_IMAGES = path.join(ROOT, 'images/apps');
const MANIFEST_PATH = path.join(ROOT, 'public/images/apps/manifest.json');
const CONSTANTS_PATH = path.join(ROOT, 'constants.ts');

const DEVELOPER_ID = '954373766';
const COUNTRY = 'gb';

// Map iTunes genre names → our AppCategory enum values
const GENRE_MAP = {
  'Utilities': 'Utilities',
  'Lifestyle': 'Lifestyle',
  'Productivity': 'Productivity',
  'Entertainment': 'Entertainment',
  'Photo & Video': 'Photo & Video',
  'Weather': 'Weather',
  'Education': 'Education',
  'Games': 'Entertainment',
  'Health & Fitness': 'Lifestyle',
};

// Default icon colors by category
const COLOR_MAP = {
  'Utilities': 'bg-blue-500',
  'Lifestyle': 'bg-rose-400',
  'Productivity': 'bg-slate-500',
  'Entertainment': 'bg-purple-500',
  'Photo & Video': 'bg-indigo-500',
  'Weather': 'bg-amber-500',
  'Education': 'bg-red-400',
};

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function downloadFile(url, dest) {
  if (existsSync(dest)) return false; // already exists
  const dir = path.dirname(dest);
  mkdirSync(dir, { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`);
  await pipeline(res.body, createWriteStream(dest));
  return true; // newly downloaded
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function main() {
  console.log(`Fetching apps for developer ${DEVELOPER_ID}...`);
  const data = await fetchJSON(
    `https://itunes.apple.com/lookup?id=${DEVELOPER_ID}&entity=software&country=${COUNTRY}&limit=200`
  );

  const itunesApps = data.results.filter(r => r.wrapperType === 'software');
  console.log(`Found ${itunesApps.length} apps on App Store\n`);

  // Load existing manifest
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  const manifestById = Object.fromEntries(manifest.apps.map(a => [String(a.trackId), a]));

  // Load constants.ts to detect existing app IDs
  const constantsSource = readFileSync(CONSTANTS_PATH, 'utf8');
  const newApps = [];

  for (const app of itunesApps) {
    const id = String(app.trackId);
    console.log(`Processing: ${app.trackName} (${id})`);

    // Download icon
    const iconDest = path.join(PUBLIC_IMAGES, id, 'icon.jpg');
    const iconSrc = path.join(SRC_IMAGES, id, 'icon.jpg');
    const iconUrl = app.artworkUrl512 || app.artworkUrl100;
    let iconDownloaded = false;
    if (iconUrl) {
      iconDownloaded = await downloadFile(iconUrl, iconDest);
      if (iconDownloaded) {
        await downloadFile(iconUrl, iconSrc);
        console.log(`  ✓ Downloaded icon`);
      }
    }

    // Download screenshots
    const screenshotUrls = app.screenshotUrls || [];
    const screenshotPaths = [];
    for (let i = 0; i < screenshotUrls.length; i++) {
      const filename = `screenshot-${i + 1}.jpg`;
      const destPub = path.join(PUBLIC_IMAGES, id, filename);
      const destSrc = path.join(SRC_IMAGES, id, filename);
      const downloaded = await downloadFile(screenshotUrls[i], destPub);
      if (downloaded) {
        await downloadFile(screenshotUrls[i], destSrc);
        console.log(`  ✓ Downloaded ${filename}`);
      }
      screenshotPaths.push(`/images/apps/${id}/${filename}`);
    }

    // Update manifest entry
    manifestById[id] = {
      trackId: app.trackId,
      trackName: app.trackName,
      bundleId: app.bundleId,
      appStoreUrl: app.trackViewUrl,
      icon: `/images/apps/${id}/icon.jpg`,
      screenshots: screenshotPaths,
    };

    // Check if this app is already in constants.ts
    const isInConstants = constantsSource.includes(`"${id}"`) || constantsSource.includes(`'${id}'`);
    // Also check by a rough name match
    const idInConstants = constantsSource.includes(app.trackName.substring(0, 10));

    if (!isInConstants && !idInConstants) {
      const genre = GENRE_MAP[app.primaryGenreName] || 'Utilities';
      const color = COLOR_MAP[genre] || 'bg-gray-500';
      const slug = slugify(app.trackName);
      newApps.push({ app, id, genre, color, slug, screenshotPaths });
      console.log(`  🆕 NEW APP — will add to constants.ts`);
    }
  }

  // Rebuild manifest.apps array preserving order (existing first, then new)
  const existingIds = new Set(manifest.apps.map(a => String(a.trackId)));
  manifest.apps = [
    ...manifest.apps.map(a => manifestById[String(a.trackId)] || a),
    ...Object.values(manifestById).filter(a => !existingIds.has(String(a.trackId))),
  ];
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\n✓ manifest.json updated`);

  // Append new apps to constants.ts
  if (newApps.length > 0) {
    console.log(`\nAppending ${newApps.length} new app(s) to constants.ts...`);
    let additions = '';
    for (const { app, id, genre, color, slug, screenshotPaths } of newApps) {
      const desc = (app.description || '').split('\n')[0].substring(0, 120).replace(/"/g, '\\"');
      const screenshotsArr = screenshotPaths.length > 0
        ? `[\n      ${screenshotPaths.map(p => `"${p}"`).join(',\n      ')},\n    ]`
        : '[]';
      additions += `  ,{\n`;
      additions += `    id: "${slug}",\n`;
      additions += `    name: "${app.trackName.replace(/"/g, '\\"')}",\n`;
      additions += `    category: AppCategory.${genre.toUpperCase().replace(/ & /g, '_').replace(/ /g, '_')},\n`;
      additions += `    description: "${desc}",\n`;
      additions += `    iconColor: "${color}",\n`;
      additions += `    iconUrl: "/images/apps/${id}/icon.jpg",\n`;
      additions += `    url: "${app.trackViewUrl}",\n`;
      if (screenshotPaths.length > 0) {
        additions += `    screenshots: ${screenshotsArr}\n`;
      }
      additions += `  }\n`;
    }

    // Insert before the closing ]; of the APPS array
    const updatedConstants = constantsSource.replace(/\n\];(\s*)$/, `\n${additions}];\n`);
    writeFileSync(CONSTANTS_PATH, updatedConstants);
    console.log(`✓ constants.ts updated with ${newApps.length} new app(s)`);
    newApps.forEach(({ app }) => console.log(`  + ${app.trackName}`));
  } else {
    console.log(`\nNo new apps found.`);
  }

  console.log('\nSync complete.');
}

main().catch(err => { console.error(err); process.exit(1); });
