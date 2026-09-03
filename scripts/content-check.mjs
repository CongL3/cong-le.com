#!/usr/bin/env node

/** Validate the developer-blog content contract before a scheduled publish. */

import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getApp } from './lib/apps.mjs';
import { loadPosts, POSTS_DIR } from './lib/posts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CALENDAR_PATH = path.join(ROOT, 'data/content-calendar.json');

export function validateContent(posts, calendar) {
  const errors = [];
  const entries = calendar?.entries || [];
  const bySlug = new Map();
  const dates = new Set();

  if (JSON.stringify(calendar?.weekdaysUtc) !== JSON.stringify([2, 4, 6])) {
    errors.push('calendar weekdaysUtc must be [2, 4, 6]');
  }
  if (calendar?.timeUtc !== '08:00') errors.push('calendar timeUtc must be 08:00');

  for (const entry of entries) {
    if (bySlug.has(entry.slug)) errors.push(`calendar duplicate slug: ${entry.slug}`);
    if (dates.has(entry.scheduledDate)) errors.push(`calendar duplicate date: ${entry.scheduledDate}`);
    bySlug.set(entry.slug, entry);
    dates.add(entry.scheduledDate);
    const day = new Date(`${entry.scheduledDate}T00:00:00Z`).getUTCDay();
    if (![2, 4, 6].includes(day)) errors.push(`calendar date is not Tue/Thu/Sat: ${entry.scheduledDate}`);
  }

  const queuedSlugs = new Set();
  for (const post of posts) {
    const { data, body, filename } = post;
    const expectedSlug = filename.replace(/\.md$/, '');
    if (data.slug !== expectedSlug) errors.push(`${filename}: slug must match filename`);
    if (data.app && !getApp(data.app)) errors.push(`${filename}: unknown app ${data.app}`);
    if (!['queued', 'published'].includes(data.status)) errors.push(`${filename}: invalid status`);

    if (data.status === 'queued') {
      queuedSlugs.add(data.slug);
      if (!/^>\s+\*\*Quick answer:\*\*/.test(body.trim())) errors.push(`${filename}: missing opening Quick answer`);
      if (data.approved !== true) errors.push(`${filename}: queued post must declare approved: true`);
      if (!bySlug.has(data.slug)) errors.push(`${filename}: queued post missing from content calendar`);
    }
  }

  for (const entry of entries) {
    if (!queuedSlugs.has(entry.slug)) errors.push(`calendar entry is not a queued post: ${entry.slug}`);
  }
  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const calendar = JSON.parse(readFileSync(CALENDAR_PATH, 'utf8'));
  const errors = validateContent(loadPosts(), calendar);
  if (errors.length) {
    console.error(errors.map((error) => `content-check: ${error}`).join('\n'));
    process.exit(1);
  }
  console.log(`content-check: ${calendar.entries.length} scheduled queued posts and all content gates passed`);
}
