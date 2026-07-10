#!/usr/bin/env node
/**
 * generate-sitemap.mjs
 * Writes public/sitemap.xml covering:
 *   - homepage
 *   - every directory under public/apps/  (as /apps/<dir>/)
 *   - /blog/ and every published blog post
 *   - /privacy.html, /terms.html, /developer.html
 * lastmod is the file mtime (YYYY-MM-DD, UTC).
 */

import { writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import path from 'path';
import { loadPosts, publishedPosts, ROOT } from './lib/posts.mjs';
import { SITE_URL } from './lib/apps.mjs';

const PUBLIC = path.join(ROOT, 'public');

/** mtime of a file/dir as YYYY-MM-DD (UTC), or today if unavailable. */
function lastmod(fsPath) {
  try {
    return statSync(fsPath).mtime.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function urlEntry(loc, mod) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${mod}</lastmod>
  </url>`;
}

export function generateSitemap() {
  const entries = [];

  // Homepage — use the built index.html mtime, or the public dir.
  const homeSource = existsSync(path.join(ROOT, 'index.html'))
    ? path.join(ROOT, 'index.html')
    : PUBLIC;
  entries.push({ loc: `${SITE_URL}/`, mod: lastmod(homeSource) });

  // App landing pages: every directory under public/apps/.
  const appsDir = path.join(PUBLIC, 'apps');
  if (existsSync(appsDir)) {
    for (const dir of readdirSync(appsDir)) {
      const full = path.join(appsDir, dir);
      if (!statSync(full).isDirectory()) continue;
      const indexFile = path.join(full, 'index.html');
      const modSource = existsSync(indexFile) ? indexFile : full;
      entries.push({ loc: `${SITE_URL}/apps/${dir}/`, mod: lastmod(modSource) });
    }
  }

  // Blog home.
  const blogIndex = path.join(PUBLIC, 'blog', 'index.html');
  entries.push({
    loc: `${SITE_URL}/blog/`,
    mod: lastmod(existsSync(blogIndex) ? blogIndex : PUBLIC),
  });

  // Published blog posts.
  for (const post of publishedPosts(loadPosts())) {
    const postFile = path.join(PUBLIC, 'blog', post.data.slug, 'index.html');
    entries.push({
      loc: `${SITE_URL}/blog/${post.data.slug}/`,
      mod: post.data.publishDate || lastmod(postFile),
    });
  }

  // Legal / info pages.
  for (const page of ['privacy.html', 'terms.html', 'developer.html']) {
    const file = path.join(PUBLIC, page);
    entries.push({
      loc: `${SITE_URL}/${page}`,
      mod: lastmod(existsSync(file) ? file : path.join(ROOT, page)),
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((e) => urlEntry(e.loc, e.mod)).join('\n')}
</urlset>
`;

  writeFileSync(path.join(PUBLIC, 'sitemap.xml'), xml);
  console.log(`generate-sitemap: ${entries.length} URLs -> public/sitemap.xml`);
  return entries.length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateSitemap();
}
