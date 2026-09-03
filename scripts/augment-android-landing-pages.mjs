#!/usr/bin/env node

/**
 * Keep the hand-authored app pages aligned with the verified Android listings.
 *
 * The pages in this file are intentionally explicit: a Google Play CTA is
 * added only after the package has been verified in the live catalogue. Run
 * with --apply when a page is intentionally updated; the default --check
 * mode is safe for CI and links:check.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const ANDROID_LANDING_PAGES = [
  {
    slug: 'anniversary-tracker',
    appName: 'Anniversary Tracker',
    iosUrl: 'https://apps.apple.com/app/id1570714816?ct=congle-web-anniversary-tracker&pt=19678800',
    packageName: 'com.congle.TEAMCONG.AnniversaryTracker',
  },
  {
    slug: 'ollama-connect',
    appName: 'Ollama Connect',
    iosUrl: 'https://apps.apple.com/app/id6769891596?ct=congle-web-ollama-connect&pt=19678800',
    packageName: 'com.congle.TEAMCONG.OllamaConnect',
  },
  {
    slug: 'moon-phases-lunar-tracker',
    appName: 'Moon Phases: Lunar Tracker',
    iosUrl: 'https://apps.apple.com/app/id6760960352?ct=congle-web-moon-phases-lunar-tracker&pt=19678800',
    packageName: 'com.congle.TEAMCONG.MoonPhases',
  },
  {
    slug: 'solunar-fishing',
    appName: 'Solunar: Best Fishing Times',
    iosUrl: 'https://apps.apple.com/app/id6760960543?ct=congle-web-solunar-fishing&pt=19678800',
    packageName: 'com.congle.TEAMCONG.SolunarFishing',
  },
];

function escapeAttribute(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function googlePlayUrl(slug, packageName, position) {
  const url = new URL('https://play.google.com/store/apps/details');
  url.searchParams.set('id', packageName);
  url.searchParams.set('utm_source', 'congle');
  url.searchParams.set('utm_medium', 'referral');
  url.searchParams.set('utm_campaign', 'portfolio_downloads');
  url.searchParams.set('utm_content', `${slug}-android-${position}`);
  return url.toString();
}

function androidButton(app, position) {
  const url = escapeAttribute(googlePlayUrl(app.slug, app.packageName, position));
  return `      <!-- ANDROID-STORE-LINK:${app.slug}:${position} -->
      <a data-platform="android" data-cta-position="${position}" href="${url}"
         aria-label="Get ${app.appName} on Google Play"
         class="inline-flex items-center gap-3 font-bold px-7 py-4 rounded-full text-lg border-2 border-gray-900 dark:border-white hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 transition-colors">
        Get it on Google Play ↗
      </a>`;
}

function replaceOnceOrFail(input, pattern, replacement, description) {
  const matches = input.match(pattern);
  if (!matches || matches.length !== 1) {
    throw new Error(`${description}: expected one match, found ${matches?.length ?? 0}`);
  }
  return input.replace(pattern, replacement);
}

function applyPage(html, app) {
  const escapedIosUrl = escapeRegex(app.iosUrl).replaceAll('&', '&(?:amp;)?');
  const iosAnchor = new RegExp(`(<a\\s+href="${escapedIosUrl}"[\\s\\S]*?<\\/a>)`, 'g');
  const matches = html.match(iosAnchor);
  if (!matches || matches.length !== 2) {
    throw new Error(`${app.slug}: expected two tracked App Store CTAs, found ${matches?.length ?? 0}`);
  }

  let positionIndex = 0;
  const output = html.replace(iosAnchor, (anchor) => {
    const position = ['hero', 'final'][positionIndex++];
    return `<div class="flex flex-wrap items-center gap-3">${anchor}\n${androidButton(app, position)}\n      </div>`;
  });
  if (positionIndex !== 2) {
    throw new Error(`${app.slug}: expected two App Store CTAs during replacement`);
  }

  let enriched = replaceOnceOrFail(
    output,
    /"operatingSystem": "iOS"/,
    '"operatingSystem": "iOS, Android"',
    `${app.slug}: structured-data operating system`,
  );
  enriched = replaceOnceOrFail(
    enriched,
    new RegExp(`"downloadUrl": "${escapeRegex(app.iosUrl)}",`),
    `"downloadUrl": ["${app.iosUrl}", "${googlePlayUrl(app.slug, app.packageName, 'structured-data')}"],`,
    `${app.slug}: structured-data download URLs`,
  );
  enriched = replaceOnceOrFail(
    enriched,
    new RegExp(`"sameAs": \\["${escapeRegex(app.iosUrl)}"\\],`),
    `"sameAs": ["${app.iosUrl}", "${googlePlayUrl(app.slug, app.packageName, 'structured-data')}"],`,
    `${app.slug}: structured-data sameAs URLs`,
  );
  return enriched;
}

function checkPage(html, app) {
  const expectedLinks = ['hero', 'final'].map((position) => googlePlayUrl(app.slug, app.packageName, position));
  const links = [...html.matchAll(/<a\b[^>]*data-platform="android"[^>]*href="([^"]+)"[^>]*>/g)].map(
    (match) => match[1].replaceAll('&amp;', '&'),
  );
  if (links.length !== expectedLinks.length || links.some((link, index) => link !== expectedLinks[index])) {
    throw new Error(`${app.slug}: Android CTAs do not match the verified links`);
  }
  if (html.match(/"operatingSystem": "iOS, Android"/g)?.length !== 1) {
    throw new Error(`${app.slug}: structured data must advertise both supported platforms`);
  }
  const structuredDataUrl = googlePlayUrl(app.slug, app.packageName, 'structured-data');
  if (!html.includes(structuredDataUrl)) {
    throw new Error(`${app.slug}: structured data is missing the Android listing`);
  }
}

const apply = process.argv.includes('--apply');
for (const app of ANDROID_LANDING_PAGES) {
  const file = path.join(ROOT, 'public/apps', app.slug, 'index.html');
  let html = readFileSync(file, 'utf8');
  if (apply && !html.includes(`ANDROID-STORE-LINK:${app.slug}:hero`)) {
    html = applyPage(html, app);
    writeFileSync(file, html);
    console.log(`updated ${path.relative(ROOT, file)}`);
  }
  checkPage(html, app);
  console.log(`checked ${path.relative(ROOT, file)}`);
}

console.log(`Android landing pages: ${apply ? 'updated and checked' : 'checked'}`);
