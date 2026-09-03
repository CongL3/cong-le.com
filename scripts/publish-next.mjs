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

import { appendFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import path from 'path';
import { loadPosts, splitFrontmatter, POSTS_DIR } from './lib/posts.mjs';
import { buildBlog } from './build-blog.mjs';
import { generateSitemap } from './generate-sitemap.mjs';
import { updateLandingLinks } from './update-landing-links.mjs';
import { pingIndexNow } from './lib/indexnow.mjs';
import { getApp } from './lib/apps.mjs';

const SITE_URL = 'https://www.cong-le.com';
const CALENDAR_PATH = path.join(path.dirname(POSTS_DIR), '..', 'data/content-calendar.json');

const DRY_RUN = process.argv.includes('--dry-run');

function setActionOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

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

/** Return approved queued posts whose checked-in calendar date has arrived. */
export function eligiblePosts(posts, calendar, today) {
  const dates = new Map((calendar.entries || []).map((entry) => [String(entry.slug), entry.scheduledDate]));
  return posts
    .filter((post) => {
      const scheduledDate = dates.get(String(post.data.slug));
      return post.data.status === 'queued' && post.data.approved === true && scheduledDate && scheduledDate <= today;
    })
    .sort((a, b) => {
      const aDate = dates.get(String(a.data.slug));
      const bDate = dates.get(String(b.data.slug));
      return aDate.localeCompare(bDate) || a.data.queue - b.data.queue || a.filename.localeCompare(b.filename);
    });
}

/** Build the complete free discovery batch for a newly published post. */
export function indexNowUrls(post, posts) {
  const urls = [`${SITE_URL}/blog/${post.data.slug}/`];
  const app = getApp(post.data.app);
  if (app?.available) urls.push(`${SITE_URL}${app.landingPage}`);

  posts
    .filter((candidate) => (
      candidate.data.status === 'published' &&
      candidate.data.slug !== post.data.slug &&
      post.data.app && candidate.data.app === post.data.app
    ))
    .sort((a, b) => a.data.slug.localeCompare(b.data.slug))
    .forEach((candidate) => urls.push(`${SITE_URL}/blog/${candidate.data.slug}/`));

  urls.push(`${SITE_URL}/llms.txt`, `${SITE_URL}/llms-full.txt`);
  return [...new Set(urls)];
}

async function main() {
  const posts = loadPosts();
  if (!existsSync(CALENDAR_PATH)) {
    console.error(`publish-next: missing approved content calendar at ${CALENDAR_PATH}`);
    process.exit(1);
  }

  const calendar = JSON.parse(readFileSync(CALENDAR_PATH, 'utf8'));
  const today = process.env.CONTENT_TODAY || todayUTC();
  const queued = eligiblePosts(posts, calendar, today);
  const published = posts.filter((p) => p.data.status === 'published').length;
  const blocked = posts.filter((p) => p.data.status === 'queued' && p.data.approved !== true);

  if (queued.length === 0) {
    console.log(`publish-next: nothing approved and due on ${today}. ${published} published.`);
    setActionOutput('changed', 'false');
    if (blocked.length) {
      console.log(`${blocked.length} queued post(s) held without approved: true.`);
    }
    const nextScheduled = (calendar.entries || []).find((entry) => {
      const post = posts.find((candidate) => String(candidate.data.slug) === String(entry.slug));
      return post?.data.status === 'queued' && entry.scheduledDate > today;
    });
    if (nextScheduled) console.log(`publish-next: next scheduled slot is ${nextScheduled.scheduledDate}.`);
    return;
  }

  const next = queued[0];
  const date = today;

  if (DRY_RUN) {
    console.log('publish-next --dry-run: would publish:');
    console.log(`  file:    ${next.filename}`);
    console.log(`  slug:    ${next.data.slug}`);
    console.log(`  title:   ${next.data.title}`);
    console.log(`  queue:   ${next.data.queue}`);
    console.log(`  app:     ${next.data.app}`);
    console.log(`  date ->  ${date}`);
    console.log(`  ${queued.length} approved and due post(s) are eligible.`);
    setActionOutput('changed', 'false');
    return;
  }

  const filePath = path.join(POSTS_DIR, next.filename);
  const raw = readFileSync(filePath, 'utf8');
  const updated = rewriteFrontmatter(raw, { status: 'published', publishDate: date });
  writeFileSync(filePath, updated);
  console.log(`publish-next: published "${next.data.title}" (${next.filename}) on ${date}`);

  const indexNowBatch = indexNowUrls(next, posts);
  setActionOutput('changed', 'true');
  setActionOutput('published_file', `content/posts/${next.filename}`);
  setActionOutput('published_url', `${SITE_URL}/blog/${next.data.slug}/`);
  setActionOutput('indexnow_urls', indexNowBatch.join(' '));

  buildBlog();
  updateLandingLinks();
  generateSitemap();

  // Fire-and-forget IndexNow ping so answer engines pick up the new post fast.
  // Never allowed to fail the run (cron-safe): pingIndexNow swallows errors.
  await pingIndexNow(indexNowBatch);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
