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
function headBlock({ title, description, canonical, ogType, ogImage, jsonLdBlocks = [], appId }) {
  return `  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
${appId ? `  <meta name="apple-itunes-app" content="app-id=${appId}">\n` : ''}
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

  <script>
    (function () {
      var saved = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (saved === 'dark' || (!saved && prefersDark)) {
        document.documentElement.classList.add('dark');
      }
    })();
  </script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
        }
      }
    }
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    html { scroll-behavior: smooth; }
    .fade-up {
      opacity: 0;
      transform: translateY(24px);
      transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    }
    .fade-up.visible { opacity: 1; transform: none; }
    /* Readable article prose — Inter, homepage palette, dark-mode aware */
    .prose { color: #374151; font-size: 1.075rem; line-height: 1.8; }
    .dark .prose { color: #d1d5db; }
    .prose h2 {
      font-weight: 800; font-size: 1.8rem; line-height: 1.25;
      letter-spacing: -0.02em; color: #111827;
      margin-top: 2.5rem; margin-bottom: 1rem;
    }
    .dark .prose h2 { color: #ffffff; }
    .prose h3 {
      font-weight: 700; font-size: 1.3rem; color: #111827;
      margin-top: 1.75rem; margin-bottom: 0.6rem;
    }
    .dark .prose h3 { color: #f3f4f6; }
    .prose p { margin-bottom: 1.25rem; }
    .prose ul, .prose ol { margin: 1rem 0 1.5rem 1.25rem; }
    .prose ul { list-style: disc; }
    .prose ol { list-style: decimal; }
    .prose li { margin-bottom: 0.5rem; padding-left: 0.25rem; }
    .prose a { color: #2563eb; text-decoration: underline; text-underline-offset: 2px; }
    .dark .prose a { color: #60a5fa; }
    .prose a:hover { opacity: 0.8; }
    .prose strong { color: #111827; font-weight: 700; }
    .dark .prose strong { color: #f3f4f6; }
    .prose blockquote {
      border-left: 4px solid #93c5fd; padding-left: 1.25rem;
      margin: 1.5rem 0; color: #6b7280; font-style: italic;
    }
    .dark .prose blockquote { border-left-color: #3b82f6; color: #9ca3af; }
    .prose code {
      background: rgba(17,24,39,0.08); padding: 0.15em 0.4em;
      border-radius: 6px; font-size: 0.9em;
    }
    .dark .prose code { background: rgba(255,255,255,0.1); }
    .prose pre {
      background: #1e293b; color: #e2e8f0; padding: 1.1rem 1.25rem;
      border-radius: 12px; overflow-x: auto; margin: 1.5rem 0;
    }
    .prose pre code { background: none; padding: 0; color: inherit; }
    .prose img { max-width: 100%; border-radius: 12px; }
    .prose h2:first-child { margin-top: 0; }
  </style>`;
}

/** Sun/moon theme-toggle icons (lucide-style), swapped via the `dark` class. */
const THEME_TOGGLE = `<button type="button" onclick="__toggleTheme()" aria-label="Toggle dark mode" class="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 dark:hidden"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 hidden dark:block"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
        </button>`;

/** Shared site header — matches the React homepage Navbar. */
function navbar() {
  return `  <header class="fixed top-0 inset-x-0 z-50 bg-white/85 dark:bg-black/85 backdrop-blur-md border-b border-gray-200 dark:border-white/10 transition-colors">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <a href="/" class="font-bold text-xl tracking-tight text-gray-900 dark:text-white">Cong Le</a>
      <nav class="flex items-center gap-6 sm:gap-8">
        <a href="/#apps" class="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Apps</a>
        <a href="/blog/" class="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Blog</a>
        ${THEME_TOGGLE}
      </nav>
    </div>
  </header>`;
}

/** Shared site footer — matches the React homepage Footer tone. */
function footer() {
  const year = new Date().getUTCFullYear();
  return `  <footer class="bg-gray-900 dark:bg-black text-white border-t border-gray-800 dark:border-gray-900 mt-16">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <a href="/" class="font-bold text-xl">Cong Le</a>
        <nav class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-400">
          <a href="/" class="hover:text-white transition-colors">Home</a>
          <a href="/blog/" class="hover:text-white transition-colors">Blog</a>
          <a href="/developer.html" class="hover:text-white transition-colors">Developer Support</a>
          <a href="/privacy.html" class="hover:text-white transition-colors">Privacy Policy</a>
          <a href="/terms.html" class="hover:text-white transition-colors">Terms &amp; Conditions</a>
        </nav>
      </div>
      <p class="mt-8 text-sm text-gray-500">&copy; ${year} Cong Le. All rights reserved.</p>
    </div>
  </footer>`;
}

const APPLE_SVG = `<svg class="w-6 h-6" viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>`;

/** Download CTA box derived from an app's frontmatter. */
function ctaBox(app) {
  if (!app) return '';
  return `  <aside class="fade-up mt-12 rounded-2xl p-6 sm:p-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
    <div class="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
      <img src="${escAttr(app.icon)}" alt="${escAttr(app.name)} icon" class="w-20 h-20 rounded-2xl shadow-md flex-shrink-0">
      <div class="flex-1">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-1"><a href="${escAttr(app.landingPage)}" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">${esc(app.name)}</a></h3>
        <p class="text-gray-500 dark:text-gray-400 mb-4">${esc(app.oneLiner)}</p>
        <a href="${escAttr(app.storeUrl)}" target="_blank" rel="noopener"
           class="inline-flex items-center gap-2.5 font-semibold px-6 py-3 rounded-full text-base text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm">
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
        <a href="/blog/${escAttr(p.data.slug)}/" class="block rounded-2xl p-5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:-translate-y-0.5 transition-all">
          <span class="block font-semibold text-gray-900 dark:text-white mb-1">${esc(p.data.title)}</span>
          <span class="block text-sm text-gray-500 dark:text-gray-400">${esc(p.data.description)}</span>
        </a>
      </li>`
    )
    .join('\n');
  return `  <section class="fade-up mt-14">
    <h2 class="text-2xl font-extrabold text-gray-900 dark:text-white mb-5">Related posts</h2>
    <ul class="grid gap-4">
${items}
    </ul>
  </section>`;
}

const bodyOpen = `<body class="bg-gray-50 dark:bg-black text-gray-900 dark:text-white antialiased selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900 dark:selection:text-white transition-colors">`;

const scrollScript = `  <script>
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
    function __toggleTheme() {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
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
    appId: app?.trackId,
  })}
</head>
${bodyOpen}
${navbar()}

  <main class="max-w-2xl mx-auto px-6 pt-28 pb-4">
    <article>
      <header class="fade-up mb-10">
        <a href="/blog/" class="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity">&larr; All posts</a>
        <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mt-4 mb-4 text-gray-900 dark:text-white">${esc(data.title)}</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">${data.publishDate ? `Published ${esc(prettyDate(data.publishDate))}` : ''}${app ? ` &middot; <a href="${escAttr(app.landingPage)}" class="text-blue-600 dark:text-blue-400 hover:opacity-80">${esc(app.name)}</a>` : ''}</p>
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
    listing = `      <p class="text-lg text-center py-16 text-gray-500 dark:text-gray-400">
        No posts yet &mdash; check back soon for guides, tips, and updates.
      </p>`;
  } else {
    listing = allPublished
      .map((p) => {
        const app = getApp(p.data.app);
        return `      <li class="fade-up">
        <a href="/blog/${escAttr(p.data.slug)}/" class="block rounded-2xl p-6 sm:p-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <span class="block text-xs uppercase tracking-wide mb-2 text-gray-400 dark:text-gray-500">${p.data.publishDate ? esc(prettyDate(p.data.publishDate)) : ''}${app ? ` &middot; ${esc(app.name)}` : ''}</span>
          <span class="block text-2xl font-bold text-gray-900 dark:text-white mb-2">${esc(p.data.title)}</span>
          <span class="block text-gray-500 dark:text-gray-400">${esc(p.data.description)}</span>
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
    appId: '1570714816',
  })}
</head>
${bodyOpen}
${navbar()}

  <header class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-10 text-center fade-up">
    <h1 class="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-4 text-gray-900 dark:text-white">The Blog</h1>
    <p class="text-xl text-gray-500 dark:text-gray-400">Guides, tips, and updates from the apps I build.</p>
  </header>

  <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
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
