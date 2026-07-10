#!/usr/bin/env node
/**
 * publish-next.mjs
 * Drip-publishes the queued post with the lowest `queue` value:
 *   - flips status: queued -> published
 *   - sets publishDate to today (UTC, YYYY-MM-DD)
 * Only those two frontmatter lines are rewritten; the rest of the file is
 * left byte-for-byte intact. Then rebuilds the blog and sitemap.
 *
 * Flags:
 *   --dry-run   print the selected post and exit without writing.
 */

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { loadPosts, splitFrontmatter, POSTS_DIR } from './lib/posts.mjs';
import { buildBlog } from './build-blog.mjs';
import { generateSitemap } from './generate-sitemap.mjs';

const DRY_RUN = process.argv.includes('--dry-run');

/** Today's date in UTC as YYYY-MM-DD. */
function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Rewrite the `status` and `publishDate` frontmatter lines only.
 * Preserves indentation and the rest of the file exactly.
 */
export function rewriteFrontmatter(raw, { status, publishDate }) {
  const normalized = raw.replace(/\r\n/g, '\n');
  const split = splitFrontmatter(normalized);
  if (!split) throw new Error('malformed frontmatter');

  const lines = normalized.split('\n');
  // Frontmatter occupies lines[1..closingIndex-1]; find the closing `---`.
  let closingIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      closingIndex = i;
      break;
    }
  }
  if (closingIndex === -1) throw new Error('no closing frontmatter delimiter');

  let sawStatus = false;
  let sawPublishDate = false;
  for (let i = 1; i < closingIndex; i++) {
    if (/^\s*status\s*:/.test(lines[i])) {
      lines[i] = lines[i].replace(/^(\s*status\s*:).*$/, `$1 ${status}`);
      sawStatus = true;
    } else if (/^\s*publishDate\s*:/.test(lines[i])) {
      lines[i] = lines[i].replace(/^(\s*publishDate\s*:).*$/, `$1 ${publishDate}`);
      sawPublishDate = true;
    }
  }
  if (!sawStatus) throw new Error('no status line in frontmatter');
  if (!sawPublishDate) {
    // Insert a publishDate line just before the closing delimiter.
    lines.splice(closingIndex, 0, `publishDate: ${publishDate}`);
  }
  return lines.join('\n');
}

function main() {
  const posts = loadPosts();
  const queued = posts
    .filter((p) => p.data.status === 'queued')
    .sort((a, b) => a.data.queue - b.data.queue || a.filename.localeCompare(b.filename));

  if (queued.length === 0) {
    console.log('publish-next: queue is empty — nothing to publish.');
    if (!DRY_RUN) {
      // Still refresh derived output so committed state stays consistent.
      buildBlog();
      generateSitemap();
    }
    return;
  }

  const next = queued[0];
  const date = todayUTC();

  if (DRY_RUN) {
    console.log('publish-next --dry-run: would publish:');
    console.log(`  file:    ${next.filename}`);
    console.log(`  slug:    ${next.data.slug}`);
    console.log(`  title:   ${next.data.title}`);
    console.log(`  queue:   ${next.data.queue}`);
    console.log(`  app:     ${next.data.app}`);
    console.log(`  date ->  ${date}`);
    console.log(`  ${queued.length} post(s) remain in the queue.`);
    return;
  }

  const filePath = path.join(POSTS_DIR, next.filename);
  const raw = readFileSync(filePath, 'utf8');
  const updated = rewriteFrontmatter(raw, { status: 'published', publishDate: date });
  writeFileSync(filePath, updated);
  console.log(`publish-next: published "${next.data.title}" (${next.filename}) on ${date}`);

  buildBlog();
  generateSitemap();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
