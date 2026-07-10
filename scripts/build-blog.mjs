#!/usr/bin/env node
/**
 * build-blog.mjs
 * Renders content/posts/*.md into a static blog under public/blog/:
 *   - public/blog/<slug>/index.html   (one page per published post)
 *   - public/blog/index.html          (blog home, newest-first)
 *   - public/blog/rss.xml             (RSS 2.0 of published posts)
 *
 * public/blog/ is wiped and regenerated deterministically on every run.
 * Only public/blog/ is touched — other public/ content is left untouched.
 */

import { writeFileSync, mkdirSync, rmSync } from 'fs';
import path from 'path';
import { marked } from 'marked';
import { loadPosts, publishedPosts, ROOT } from './lib/posts.mjs';
import { getApp, SITE_URL } from './lib/apps.mjs';

const BLOG_DIR = path.join(ROOT, 'public/blog');

marked.setOptions({ mangle: false, headerIds: true });

/** Escape text for use in HTML element content. */
function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Escape text for use inside a double-quoted HTML attribute. */
function escAttr(str = '') {
  return esc(str).replace(/"/g, '&quot;');
}

/** Escape a string for embedding inside a JSON-LD <script> block. */
function jsonLd(obj) {
  // JSON.stringify handles quoting; guard against </script> breakout.
  return JSON.stringify(obj, null, 2).replace(/</g, '\\u003c');
}

/** Shared <head> block matching the app landing page visual style. */
function headBlock({ title, description, canonical, ogType, ogImage, jsonLdBlocks = [] }) {
  return `  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${esc(title)}</title>
  <meta name="description" content="${escAttr(description)}">
  <link rel="canonical" href="${escAttr(canonical)}">

  <!-- Open Graph -->
  <meta property="og:title" content="${escAttr(title)}">
  <meta property="og:description" content="${escAttr(description)}">
  <meta property="og:type" content="${escAttr(ogType)}">
  <meta property="og:url" content="${escAttr(canonical)}">
  <meta property="og:image" content="${escAttr(ogImage)}">
  <meta property="og:site_name" content="Cong Le Apps">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escAttr(title)}">
  <meta name="twitter:description" content="${escAttr(description)}">
  <meta name="twitter:image" content="${escAttr(ogImage)}">

${jsonLdBlocks
  .map((b) => `  <script type="application/ld+json">\n${b}\n  </script>`)
  .join('\n')}

  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: { sky: { cta: '#3B82F6' } },
          fontFamily: {
            display: ['"DM Serif Display"', 'Georgia', 'serif'],
            body: ['Inter', 'system-ui', 'sans-serif'],
          }
        }
      }
    }
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

  <style>
    .fade-up {
      opacity: 0;
      transform: translateY(30px);
      transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    }
    .fade-up.visible { opacity: 1; transform: translateY(0); }
    .navbar { transition: background-color 0.3s ease, box-shadow 0.3s ease; }
    .navbar.scrolled {
      background-color: rgba(230, 243, 255, 0.95) !important;
      backdrop-filter: blur(10px);
      box-shadow: 0 2px 20px rgba(46,61,92,0.1);
    }
    /* Readable article prose */
    .prose { color: #3A4A63; font-size: 1.075rem; line-height: 1.8; }
    .prose h2 {
      font-family: '"DM Serif Display"', Georgia, serif;
      font-size: 1.9rem; color: #2E3D5C;
      margin-top: 2.5rem; margin-bottom: 1rem; line-height: 1.25;
    }
    .prose h3 {
      font-family: Inter, system-ui, sans-serif; font-weight: 700;
      font-size: 1.3rem; color: #2E3D5C;
      margin-top: 1.75rem; margin-bottom: 0.6rem;
    }
    .prose p { margin-bottom: 1.25rem; }
    .prose ul, .prose ol { margin: 1rem 0 1.5rem 1.25rem; }
    .prose ul { list-style: disc; }
    .prose ol { list-style: decimal; }
    .prose li { margin-bottom: 0.5rem; padding-left: 0.25rem; }
    .prose a { color: #2563EB; text-decoration: underline; }
    .prose a:hover { opacity: 0.8; }
    .prose strong { color: #2E3D5C; }
    .prose blockquote {
      border-left: 4px solid #93C5FD; padding-left: 1.25rem;
      margin: 1.5rem 0; color: #557090; font-style: italic;
    }
    .prose code {
      background: rgba(46,61,92,0.08); padding: 0.15em 0.4em;
      border-radius: 6px; font-size: 0.9em;
    }
    .prose pre {
      background: #1E293B; color: #E2E8F0; padding: 1.1rem 1.25rem;
      border-radius: 12px; overflow-x: auto; margin: 1.5rem 0;
    }
    .prose pre code { background: none; padding: 0; color: inherit; }
    .prose img { max-width: 100%; border-radius: 12px; }
    .prose h2:first-child { margin-top: 0; }
  </style>`;
}

/** Site navbar (links back to portfolio home). */
function navbar() {
  return `  <nav class="navbar fixed top-0 left-0 right-0 z-50 bg-transparent">
    <div class="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
      <a href="/blog/" class="font-display text-lg" style="color: #2E3D5C;">Cong Le Apps &mdash; Blog</a>
      <a href="/" class="inline-flex items-center gap-2 font-semibold px-5 py-2.5 rounded-full text-sm hover:opacity-90 transition-colors" style="background: #3B82F6; color: white;">
        All Apps
      </a>
    </div>
  </nav>`;
}

/** Site footer. */
function footer() {
  const year = new Date().getUTCFullYear();
  return `  <footer class="py-12 mt-16" style="background-color: #D4E8F5;">
    <div class="max-w-4xl mx-auto px-6">
      <div class="flex flex-col md:flex-row items-center justify-between gap-6">
        <a href="/blog/" class="font-display text-lg" style="color: #2E3D5C;">Cong Le Apps &mdash; Blog</a>
        <div class="flex flex-wrap items-center gap-6 text-sm" style="color: #557090;">
          <a href="/blog/" class="hover:opacity-70 transition-colors">All posts</a>
          <a href="/privacy.html" class="hover:opacity-70 transition-colors">Privacy Policy</a>
          <a href="/terms.html" class="hover:opacity-70 transition-colors">Terms</a>
          <a href="/developer.html" class="hover:opacity-70 transition-colors">Support</a>
          <a href="/" class="hover:opacity-70 transition-colors">More apps by Cong Le</a>
        </div>
      </div>
      <div class="mt-8 text-center text-sm" style="color: #7A9AB5;">
        &copy; ${year} Cong Le. All rights reserved.
      </div>
    </div>
  </footer>`;
}

const APPLE_SVG = `<svg class="w-6 h-6" viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>`;

/** Download CTA box derived from an app's frontmatter. */
function ctaBox(app) {
  if (!app) return '';
  return `  <aside class="fade-up mt-12 rounded-3xl p-6 sm:p-8" style="background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.18);">
    <div class="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
      <img src="${escAttr(app.icon)}" alt="${escAttr(app.name)} icon" class="w-20 h-20 rounded-2xl shadow-md flex-shrink-0">
      <div class="flex-1">
        <h3 class="font-display text-2xl mb-1" style="color: #2E3D5C;"><a href="${escAttr(app.landingPage)}" style="color:#2E3D5C; text-decoration:none;">${esc(app.name)}</a></h3>
        <p class="mb-4" style="color: #557090;">${esc(app.oneLiner)}</p>
        <a href="${escAttr(app.storeUrl)}" target="_blank" rel="noopener"
           class="inline-flex items-center gap-3 font-bold px-6 py-3 rounded-full text-base hover:opacity-90 transition-colors shadow-lg" style="background: #3B82F6; color: white;">
          ${APPLE_SVG}
          Download on the App Store
        </a>
      </div>
    </div>
  </aside>`;
}

/** Related posts section: up to 3 other published posts, same app first. */
function relatedSection(current, allPublished) {
  const others = allPublished.filter((p) => p.data.slug !== current.data.slug);
  const sameApp = others.filter((p) => p.data.app === current.data.app);
  const rest = others.filter((p) => p.data.app !== current.data.app);
  const picks = [...sameApp, ...rest].slice(0, 3);
  if (picks.length === 0) return '';
  const items = picks
    .map(
      (p) => `      <li>
        <a href="/blog/${escAttr(p.data.slug)}/" class="block rounded-2xl p-5 hover:opacity-90 transition" style="background: rgba(46,61,92,0.05);">
          <span class="block font-semibold mb-1" style="color: #2E3D5C;">${esc(p.data.title)}</span>
          <span class="block text-sm" style="color: #557090;">${esc(p.data.description)}</span>
        </a>
      </li>`
    )
    .join('\n');
  return `  <section class="fade-up mt-14">
    <h2 class="font-display text-2xl mb-5" style="color: #2E3D5C;">Related posts</h2>
    <ul class="grid gap-4">
${items}
    </ul>
  </section>`;
}

const bodyOpen = `<body class="font-body" style="background: linear-gradient(180deg, #E6F3FF 0%, #E6FFF3 100%); background-attachment: fixed; color: #2E3D5C;">`;

const scrollScript = `  <script>
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
    });
  </script>`;

/** Human-friendly date, e.g. "10 July 2026". */
function prettyDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Render one published post to its own HTML page. */
function renderPost(post, allPublished) {
  const { data, body } = post;
  const app = getApp(data.app);
  const canonical = `${SITE_URL}/blog/${data.slug}/`;
  const ogImage = app ? `${SITE_URL}${app.icon}` : `${SITE_URL}/images/apps/manifest.json`;
  const articleTitle = `${data.title} | Cong Le Apps`;

  const blogPosting = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: data.title,
    description: data.description,
    datePublished: data.publishDate || undefined,
    dateModified: data.publishDate || undefined,
    keywords: data.keywords.length ? data.keywords.join(', ') : undefined,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    author: { '@type': 'Person', name: 'Cong Le', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'Cong Le Apps',
      url: SITE_URL,
    },
    image: ogImage,
  };

  const contentHtml = marked.parse(body);

  return `<!DOCTYPE html>
<html lang="en">
<head>
${headBlock({
    title: articleTitle,
    description: data.description,
    canonical,
    ogType: 'article',
    ogImage,
    jsonLdBlocks: [jsonLd(blogPosting)],
  })}
</head>
${bodyOpen}
${navbar()}

  <main class="max-w-2xl mx-auto px-6 pt-28 pb-4">
    <article>
      <header class="fade-up mb-10">
        <a href="/blog/" class="text-sm font-semibold" style="color: #2563EB;">&larr; All posts</a>
        <h1 class="font-display text-4xl md:text-5xl leading-tight mt-4 mb-4" style="color: #2E3D5C;">${esc(data.title)}</h1>
        <p class="text-sm" style="color: #7A9AB5;">${data.publishDate ? `Published ${esc(prettyDate(data.publishDate))}` : ''}${app ? ` &middot; <a href="${escAttr(app.landingPage)}" style="color:#557090;">${esc(app.name)}</a>` : ''}</p>
      </header>
      <div class="prose fade-up">
${contentHtml}
      </div>
${ctaBox(app)}
${relatedSection(post, allPublished)}
    </article>
  </main>

${footer()}
${scrollScript}
</body>
</html>
`;
}

/** Render the blog home / index page. */
function renderIndex(allPublished) {
  const canonical = `${SITE_URL}/blog/`;
  const website = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Cong Le Apps Blog',
    url: canonical,
    author: { '@type': 'Person', name: 'Cong Le', url: SITE_URL },
  };

  let listing;
  if (allPublished.length === 0) {
    listing = `      <p class="text-lg text-center py-16" style="color: #557090;">
        No posts yet &mdash; check back soon for guides, tips, and updates.
      </p>`;
  } else {
    listing = allPublished
      .map((p) => {
        const app = getApp(p.data.app);
        return `      <li class="fade-up">
        <a href="/blog/${escAttr(p.data.slug)}/" class="block rounded-3xl p-6 sm:p-8 hover:opacity-95 transition" style="background: rgba(46,61,92,0.05);">
          <span class="block text-xs uppercase tracking-wide mb-2" style="color: #7A9AB5;">${p.data.publishDate ? esc(prettyDate(p.data.publishDate)) : ''}${app ? ` &middot; ${esc(app.name)}` : ''}</span>
          <span class="block font-display text-2xl mb-2" style="color: #2E3D5C;">${esc(p.data.title)}</span>
          <span class="block" style="color: #557090;">${esc(p.data.description)}</span>
        </a>
      </li>`;
      })
      .join('\n');
    listing = `    <ul class="grid gap-6">\n${listing}\n    </ul>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
${headBlock({
    title: 'Blog | Cong Le Apps',
    description:
      'Guides, tips, and updates for Cong Le apps — fishing, AI chat, parenting, and more.',
    canonical,
    ogType: 'website',
    ogImage: `${SITE_URL}/images/apps/${'1570714816'}/icon.jpg`,
    jsonLdBlocks: [jsonLd(website)],
  })}
</head>
${bodyOpen}
${navbar()}

  <header class="max-w-4xl mx-auto px-6 pt-32 pb-10 text-center fade-up">
    <h1 class="font-display text-5xl md:text-6xl leading-tight mb-4" style="color: #2E3D5C;">The Blog</h1>
    <p class="text-xl" style="color: #557090;">Guides, tips, and updates from the apps I build.</p>
  </header>

  <main class="max-w-4xl mx-auto px-6 pb-8">
${listing}
  </main>

${footer()}
${scrollScript}
</body>
</html>
`;
}

/** Build the RSS 2.0 feed. */
function renderRss(allPublished) {
  const now = new Date().toUTCString();
  const items = allPublished
    .map((p) => {
      const link = `${SITE_URL}/blog/${p.data.slug}/`;
      const pub = p.data.publishDate
        ? new Date(p.data.publishDate + 'T00:00:00Z').toUTCString()
        : now;
      return `    <item>
      <title>${esc(p.data.title)}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="true">${esc(link)}</guid>
      <description>${esc(p.data.description)}</description>
      <pubDate>${pub}</pubDate>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Cong Le Apps Blog</title>
    <link>${SITE_URL}/blog/</link>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml"/>
    <description>Guides, tips, and updates from the apps built by Cong Le.</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}

export function buildBlog() {
  const posts = loadPosts();
  const pub = publishedPosts(posts);

  // Wipe and recreate ONLY public/blog/.
  rmSync(BLOG_DIR, { recursive: true, force: true });
  mkdirSync(BLOG_DIR, { recursive: true });

  for (const post of pub) {
    const dir = path.join(BLOG_DIR, post.data.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'index.html'), renderPost(post, pub));
  }

  writeFileSync(path.join(BLOG_DIR, 'index.html'), renderIndex(pub));
  writeFileSync(path.join(BLOG_DIR, 'rss.xml'), renderRss(pub));

  console.log(
    `build-blog: ${pub.length} published post(s) of ${posts.length} total -> public/blog/`
  );
  return { published: pub.length, total: posts.length };
}

// Run when invoked directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  buildBlog();
}
