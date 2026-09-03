import test from 'node:test';
import assert from 'node:assert/strict';
import { eligiblePosts, indexNowUrls, rewriteFrontmatter } from '../scripts/publish-next.mjs';

test('publisher selects only approved due posts and prefers the oldest scheduled date', () => {
  const posts = [
    { filename: 'future.md', data: { slug: 'future', queue: 1, status: 'queued', approved: true, app: 'hoop-quest' } },
    { filename: 'due-late-queue.md', data: { slug: 'due-late-queue', queue: 99, status: 'queued', approved: true, app: 'hoop-quest' } },
    { filename: 'due-early-queue.md', data: { slug: 'due-early-queue', queue: 1, status: 'queued', approved: true, app: 'hoop-quest' } },
    { filename: 'draft.md', data: { slug: 'draft', queue: 0, status: 'queued', approved: false, app: 'hoop-quest' } },
  ];
  const calendar = { entries: [
    { slug: 'future', scheduledDate: '2026-09-12' },
    { slug: 'due-late-queue', scheduledDate: '2026-09-05' },
    { slug: 'due-early-queue', scheduledDate: '2026-09-08' },
    { slug: 'draft', scheduledDate: '2026-09-01' },
  ] };
  assert.deepEqual(eligiblePosts(posts, calendar, '2026-09-09').map((post) => post.data.slug), ['due-late-queue', 'due-early-queue']);
});

test('publisher rewrites only status and publish date', () => {
  const raw = '---\nstatus: queued\npublishDate:\n---\n\nBody stays here.\n';
  assert.equal(rewriteFrontmatter(raw, { status: 'published', publishDate: '2026-09-05' }), '---\nstatus: published\npublishDate: 2026-09-05\n---\n\nBody stays here.\n');
});

test('IndexNow batch includes the article, app page, sibling posts, and indexes', () => {
  const post = { data: { slug: 'new-post', app: 'hoop-quest' } };
  const posts = [post, { data: { slug: 'sibling', app: 'hoop-quest', status: 'published' } }];
  assert.deepEqual(indexNowUrls(post, posts), [
    'https://www.cong-le.com/blog/new-post/',
    'https://www.cong-le.com/apps/hoop-quest/',
    'https://www.cong-le.com/blog/sibling/',
    'https://www.cong-le.com/llms.txt',
    'https://www.cong-le.com/llms-full.txt',
  ]);
});
