#!/usr/bin/env node
/**
 * generate-sitemap.mjs
 * Writes public/sitemap.xml covering:
 *   - homepage
 *   - every directory under public/apps/  (as /apps/<dir>/)
 *   - /blog/ and every published blog post
 *   - /press/, /privacy.html, /terms.html, /developer.html
 * lastmod is the file mtime (YYYY-MM-DD, UTC).
 */

import { writeFileSync, readFileSync, readdirSync, statSync, existsSync } from 'fs';
import path from 'path';
import { loadPosts, publishedPosts, ROOT } from './lib/posts.mjs';
import { SITE_URL } from './lib/apps.mjs';
import { APP_ALIASES } from './lib/app-aliases.mjs';

const PUBLIC = path.join(ROOT, 'public');

// Hand-authored legacy landing pages predate their individual App Store IDs in
// the page markup. Keep this small bridge until those pages are regenerated;
// the IDs are the same canonical listings used by the app manifest.
const LEGACY_APP_IDS = {
  'baby-names': '6760255587',
  'birthday-reminder': '6739454115',
  'kids-timer': '6747147301',
  'fish-finder': '6746223793',
  'lullaby-pal': '6739187522',
  'bible-prayer': '6759859294',
  coloring: '6759912464',
};

// These pages are retained for old inbound links, but the corresponding apps
// are intentionally excluded from acquisition SEO. Do not advertise them in
// XML sitemaps or machine-readable catalogues.
const EXCLUDED_APP_SLUGS = new Set([
  'docscanner-sign-documents',
  'frankly-ai',
  'run-run-run',
]);
const EXCLUDED_APP_IDS = new Set(['6769176993', '6766366146', '1582701318']);

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

/** Decode the small set of entities that can occur in HTML metadata. */
function decodeHtml(value = '') {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/** Read canonical, human-facing app facts from a static landing page. */
function readAppEntry(slug, appDir) {
  const indexFile = path.join(appDir, 'index.html');
  if (!existsSync(indexFile)) return null;
  const html = readFileSync(indexFile, 'utf8');
  const jsonScripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  let software = null;
  for (const match of jsonScripts) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed && parsed['@type'] === 'SoftwareApplication') {
        software = parsed;
        break;
      }
    } catch {
      // A malformed optional schema block must not make the catalogue vanish.
    }
  }

  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || slug;
  const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)?.[1] || '';
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1]
    || `${SITE_URL}/apps/${slug}/`;
  const storeLink = html.match(/href=["'](https:\/\/apps\.apple\.com\/[^"']+\/id\d+[^"']*)["']/i)?.[1] || '';
  const appId = html.match(/apple-itunes-app["']\s+content=["']app-id=(\d+)/i)?.[1]
    || LEGACY_APP_IDS[slug]
    || '';
  const localeLinks = [...html.matchAll(/<link\s+rel=["']alternate["']\s+hreflang=["']([^"']+)["']\s+href=["']([^"']+)["']/gi)]
    .filter(([, lang]) => lang !== 'en' && lang !== 'x-default')
    .map(([, lang, url]) => ({ lang, url }));

  const name = software?.name || decodeHtml(title).split(' — ')[0].trim() || slug;
  const appDescription = software?.description || decodeHtml(description).trim();
  const schemaDownloadUrls = Array.isArray(software?.downloadUrl)
    ? software.downloadUrl
    : software?.downloadUrl
      ? [software.downloadUrl]
      : [];
  const downloadUrls = [...new Set(schemaDownloadUrls.filter(Boolean).map((url) => String(url)))];
  if (!downloadUrls.length) {
    const fallback = appId
      ? `https://apps.apple.com/app/id${appId}?ct=congle-web-${slug}&pt=19678800`
      : decodeHtml(storeLink).trim();
    if (fallback) downloadUrls.push(fallback);
  }

  return { slug, appId, name, description: appDescription, page: canonical, downloadUrls, localeLinks };
}

/** Return one entry for each live app in the manifest, excluding stale pages. */
function appEntries() {
  const appsDir = path.join(PUBLIC, 'apps');
  if (!existsSync(appsDir)) return [];
  const pages = readdirSync(appsDir)
    .filter((slug) => statSync(path.join(appsDir, slug)).isDirectory())
    .filter((slug) => !EXCLUDED_APP_SLUGS.has(slug))
    .filter((slug) => !APP_ALIASES[slug])
    .map((slug) => readAppEntry(slug, path.join(appsDir, slug)))
    .filter(Boolean);
  const byId = new Map(pages.filter((page) => page.appId).map((page) => [page.appId, page]));
  const manifestPath = path.join(PUBLIC, 'images/apps/manifest.json');
  if (!existsSync(manifestPath)) return pages.sort((a, b) => a.slug.localeCompare(b.slug));
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  return manifest.apps
    .filter((app) => !EXCLUDED_APP_IDS.has(String(app.trackId)))
    .map((app) => byId.get(String(app.trackId)))
    .filter(Boolean)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

function appMarkdownLine(app) {
  const description = app.description ? `: ${app.description}` : '';
  const stores = app.downloadUrls.map((url) => `[${storeLabel(url)}](${url})`);
  const store = stores.length ? ` (${stores.join(', ')})` : '';
  return `- [${app.name}](${app.page})${store}${description}`;
}

function storeLabel(url) {
  try {
    const hostname = new URL(url).hostname;
    if (hostname === 'play.google.com') return 'Google Play';
    if (hostname === 'apps.apple.com') return 'App Store';
  } catch {
    // Keep malformed optional URLs visible without making the catalogue build fail.
  }
  return 'Store';
}

export function generateSitemap() {
  const entries = [];

  // Homepage — use the built index.html mtime, or the public dir.
  const homeSource = existsSync(path.join(ROOT, 'index.html'))
    ? path.join(ROOT, 'index.html')
    : PUBLIC;
  entries.push({ loc: `${SITE_URL}/`, mod: lastmod(homeSource) });

  // The portfolio hub links to every active app landing page and is itself a
  // useful crawl and navigation entry point.
  const appsIndex = path.join(PUBLIC, 'apps', 'index.html');
  if (existsSync(appsIndex)) {
    entries.push({ loc: `${SITE_URL}/apps/`, mod: lastmod(appsIndex) });
  }

  // App landing pages: every directory under public/apps/.
  const appsDir = path.join(PUBLIC, 'apps');
  if (existsSync(appsDir)) {
    for (const dir of readdirSync(appsDir)) {
      const full = path.join(appsDir, dir);
      if (!statSync(full).isDirectory()) continue;
      if (EXCLUDED_APP_SLUGS.has(dir)) continue;
      if (APP_ALIASES[dir]) continue;
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

  // Share/creator media kit. This is a permanent owned discovery surface for
  // legitimate community, directory, and editorial references.
  const pressIndex = path.join(PUBLIC, 'press', 'index.html');
  entries.push({
    loc: `${SITE_URL}/press/`,
    mod: lastmod(existsSync(pressIndex) ? pressIndex : PUBLIC),
  });

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
export function generateLlmsTxt() {
  const featured = [
    ['frankly-ai', 'Frankly AI: Uncensored Chat', 'Unfiltered AI companion & roleplay chat for iPhone'],
    ['ollama-connect', 'Ollama Connect', 'iOS client for chatting with local LLMs served by Ollama'],
    ['baby-screen-lock', 'Baby Screen Lock: Kid Safe', 'Lock the iPhone screen so babies and toddlers can watch safely'],
    ['hoop-quest', 'Hoop Quest: Basketball Sim', 'Basketball career simulator game for iPhone'],
    ['solunar-fishing', 'Solunar: Best Fishing Times', 'Solunar calendar predicting the best fishing times'],
    ['anniversary-tracker', 'Anniversary Tracker', 'Track anniversaries, countdowns, and meaningful dates'],
  ];
  const posts = publishedPosts(loadPosts());
  const apps = appEntries();
  const bySlug = new Map(apps.map((app) => [app.slug, app]));
  const activeFeatured = featured.filter(([slug]) => !EXCLUDED_APP_SLUGS.has(slug));
  const featuredSlugs = new Set(activeFeatured.map(([slug]) => slug));
  const remainingApps = apps.filter((app) => !featuredSlugs.has(app.slug));
  const lines = [
    '# Cong Le Apps',
    '',
    '> Indie iOS apps by Cong Le — utilities, family, fishing, AI chat, and games. The canonical app catalogue and download links are below; practical guides live on the blog.',
    '',
    `The [full machine-readable catalogue](${SITE_URL}/llms-full.txt) includes every app landing page, available App Store and Google Play links, available language page, and published article.`,
    `For sharing product visuals and direct store destinations, see the [press & media kit](${SITE_URL}/press/).`,
    '',
    '## Apps',
    '',
    ...activeFeatured.map(([slug, name, desc]) => {
      const app = bySlug.get(slug);
      return app ? appMarkdownLine(app) : `- [${name}](${SITE_URL}/apps/${slug}/): ${desc}`;
    }),
    ...remainingApps.map(appMarkdownLine),
    `- [All apps](${SITE_URL}/apps/): full portfolio (${apps.length} apps on the App Store)`,
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
  const fullLines = [
    '# Cong Le Apps — Full catalogue',
    '',
    '> Canonical facts for AI assistants and search systems. This file is generated from the published static app landing pages and blog metadata; descriptions are not expanded beyond what those pages state.',
    '',
    '## Publisher',
    '',
    `- [Cong Le Apps](${SITE_URL}/): independent iOS apps by Cong Le, including utilities, family tools, fishing tools, AI clients, and games.`,
    `- [Developer support](${SITE_URL}/developer.html)`,
    `- [Press & media kit](${SITE_URL}/press/)`,
    `- [Privacy policy](${SITE_URL}/privacy.html)`,
    `- [Terms](${SITE_URL}/terms.html)`,
    '',
    '## Apps',
    '',
    ...apps.flatMap((app) => {
      const localeLines = app.localeLinks.length
        ? [`  - Language pages: ${app.localeLinks.map(({ lang, url }) => `[${lang}](${url})`).join(', ')}`]
        : [];
      return [
        `### ${app.name}`,
        `- Landing page: ${app.page}`,
        ...app.downloadUrls.map((url) => `- ${storeLabel(url)}: ${url}`),
        ...(app.description ? [`- Description: ${app.description}`] : []),
        ...localeLines,
        '',
      ];
    }),
    '## Blog',
    '',
    `- [Blog index](${SITE_URL}/blog/)`,
    ...posts.map((p) => `- [${p.data.title}](${SITE_URL}/blog/${p.data.slug}/)${p.data.publishDate ? ` (${p.data.publishDate})` : ''}: ${p.data.description}`),
    '',
  ];
  writeFileSync(path.join(PUBLIC, 'llms-full.txt'), fullLines.join('\n'));
  console.log(`llms.txt: ${apps.length} apps + ${posts.length} posts; llms-full.txt: full catalogue generated`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateSitemap();
}
