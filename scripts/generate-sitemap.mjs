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

      // Locale subdirectories (e.g. /apps/<dir>/ja/) that contain their own index.html.
      for (const sub of readdirSync(full)) {
        const subFull = path.join(full, sub);
        if (!statSync(subFull).isDirectory()) continue;
        const subIndex = path.join(subFull, 'index.html');
        if (!existsSync(subIndex)) continue;
        entries.push({ loc: `${SITE_URL}/apps/${dir}/${sub}/`, mod: lastmod(subIndex) });
      }
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

  generateLlmsTxt();
  return entries.length;
}

/**
 * llms.txt — markdown site summary for LLM agents (llmstxt.org convention).
 * Regenerated alongside the sitemap so it stays fresh on every publish.
 */
function generateLlmsTxt() {
  const featured = [
    ['frankly-ai', 'Frankly AI: Uncensored Chat', 'Unfiltered AI companion & roleplay chat for iPhone'],
    ['ollama-connect', 'Ollama Connect', 'iOS client for chatting with local LLMs served by Ollama'],
    ['baby-screen-lock', 'Baby Screen Lock: Kid Safe', 'Lock the iPhone screen so babies and toddlers can watch safely'],
    ['hoop-quest', 'Hoop Quest: Basketball Sim', 'Basketball career simulator game for iPhone'],
    ['solunar-fishing', 'Solunar: Best Fishing Times', 'Solunar calendar predicting the best fishing times'],
    ['anniversary-tracker', 'Anniversary Tracker', 'Track anniversaries, countdowns, and meaningful dates'],
  ];
  const posts = publishedPosts(loadPosts());
  const lines = [
    '# Cong Le Apps',
    '',
    '> Indie iOS apps by Cong Le — utilities, family, fishing, AI chat, and games. Every app has a landing page under /apps/<slug>/; guides live on the blog.',
    '',
    '## Apps',
    '',
    ...featured.map(([slug, name, desc]) => `- [${name}](${SITE_URL}/apps/${slug}/): ${desc}`),
    `- [All apps](${SITE_URL}/#apps): full portfolio (53 apps on the App Store)`,
    '',
    '## Blog',
    '',
    `- [Blog index](${SITE_URL}/blog/)`,
    ...posts.map((p) => `- [${p.data.title}](${SITE_URL}/blog/${p.data.slug}/): ${p.data.description}`),
    '',
    '## Legal',
    '',
    `- [Privacy](${SITE_URL}/privacy.html)`,
    `- [Terms](${SITE_URL}/terms.html)`,
    '',
  ];
  writeFileSync(path.join(PUBLIC, 'llms.txt'), lines.join('\n'));
  console.log(`llms.txt: ${posts.length} posts listed -> public/llms.txt`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateSitemap();
}
