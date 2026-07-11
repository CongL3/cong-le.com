#!/usr/bin/env node
/**
 * generate-landing.mjs
 * Generates a search-indexable landing page at /apps/<slug>/ for every live app
 * that does not already have a hand-made page. The 13 hand-crafted pages are
 * sacred and never touched.
 *
 * One iTunes lookup call fetches metadata (description, genre, price, rating)
 * for all apps; a single template function renders each page. Re-running
 * regenerates the generated pages in place.
 *
 * Flags:
 *   --only <slug>   generate only the app whose target slug matches
 *   --force <slug>  regenerate the given slug (alias of --only for generated pages)
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { accentForApp, rgba } from './lib/accents.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const PUBLIC_APPS = path.join(PUBLIC, 'apps');
const MANIFEST_PATH = path.join(PUBLIC, 'images/apps/manifest.json');
const CONSTANTS_PATH = path.join(ROOT, 'constants.ts');

const SITE_URL = 'https://www.cong-le.com';
const COUNTRY = 'gb';

// trackId -> slug for the 13 hand-made pages. These are never regenerated and
// their trackIds are excluded from generation entirely.
const EXISTING = {
  '1570714816': 'anniversary-tracker',
  '6766366146': 'frankly-ai',
  '6769891596': 'ollama-connect',
  '6761378897': 'baby-screen-lock',
  '6775279715': 'hoop-quest',
  '6760960543': 'solunar-fishing',
  '6747147301': 'kids-timer',
  '6760255587': 'baby-names',
  '6759912464': 'coloring',
  '6759859294': 'bible-prayer',
  '6746223793': 'fish-finder',
  '6739454115': 'birthday-reminder',
  '6739187522': 'lullaby-pal',
};
const PROTECTED_SLUGS = new Set(Object.values(EXISTING));

// Map iTunes genre -> schema.org SoftwareApplication category.
const GENRE_SCHEMA = {
  'Utilities': 'UtilitiesApplication',
  'Productivity': 'BusinessApplication',
  'Lifestyle': 'LifestyleApplication',
  'Health & Fitness': 'HealthApplication',
  'Entertainment': 'EntertainmentApplication',
  'Games': 'GameApplication',
  'Photo & Video': 'MultimediaApplication',
  'Weather': 'UtilitiesApplication',
  'Education': 'EducationalApplication',
  'Sports': 'SportsApplication',
  'Music': 'MultimediaApplication',
  'Finance': 'FinanceApplication',
  'Travel': 'TravelApplication',
  'Reference': 'ReferenceApplication',
  'Books': 'ReferenceApplication',
  'Food & Drink': 'LifestyleApplication',
  'Navigation': 'NavigationApplication',
  'Business': 'BusinessApplication',
  'Social Networking': 'SocialNetworkingApplication',
};

// Short descriptor used in <title> when the app name has no subtitle segment.
const GENRE_PHRASE = {
  'Utilities': 'Handy Utility',
  'Productivity': 'Productivity App',
  'Lifestyle': 'Lifestyle App',
  'Health & Fitness': 'Health & Fitness App',
  'Entertainment': 'Entertainment App',
  'Games': 'Game',
  'Photo & Video': 'Photo & Video App',
  'Weather': 'Weather App',
  'Education': 'Education App',
  'Sports': 'Sports App',
  'Music': 'Music App',
  'Finance': 'Finance App',
  'Travel': 'Travel App',
  'Reference': 'Reference App',
  'Books': 'Reading App',
  'Food & Drink': 'Food & Drink App',
  'Navigation': 'Navigation App',
  'Business': 'Business App',
  'Social Networking': 'Social App',
};

const APP_STORE_SVG =
  '<svg class="w-6 h-6" viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>';

// ---------- helpers ----------

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** JSON-safe string (for JSON-LD literals). */
function jsonStr(s) {
  return JSON.stringify(String(s == null ? '' : s));
}

function slugify(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Slug from track name, falling back to the bundle id tail if it empties out. */
function slugFor(app) {
  let s = slugify(app.trackName);
  if (!s) {
    const tail = String(app.bundleId || '').split('.').pop() || '';
    s = slugify(tail);
  }
  if (!s) s = `app-${app.trackId}`;
  return s;
}

/** First sentence of a description, trimmed to <= max chars. */
function metaDescription(desc, max = 155) {
  const clean = String(desc || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const m = clean.match(/^(.*?[.!?])(\s|$)/);
  let out = m ? m[1] : clean;
  if (out.length > max) {
    out = out.slice(0, max - 1).replace(/\s+\S*$/, '').trim() + '…';
  }
  return out;
}

/** A subtitle-ish descriptor split from the app name, e.g. "Solunar: X" -> "X". */
function subtitleFromName(name) {
  const parts = String(name).split(/\s*[:·—–-]\s+|\s*:\s*/);
  if (parts.length >= 2) {
    const tail = parts.slice(1).join(' ').trim();
    if (tail && tail.length >= 3) return tail;
  }
  return '';
}

function baseName(name) {
  const parts = String(name).split(/\s*[:·—–]\s*|\s+-\s+/);
  return (parts[0] || name).trim();
}

function isHeadingLine(line) {
  const t = line.trim();
  if (t.length < 2 || t.length > 64) return false;
  if (!/[A-Za-z]/.test(t)) return false;
  if (/[a-z]/.test(t)) return false;
  // must be mostly letters, not a wall of symbols
  const letters = (t.match(/[A-Z]/g) || []).length;
  return letters >= 2;
}

function bulletContent(line) {
  const m = line.trim().match(/^[•\-–—*▪●◦·✓✔★☆»▪●]\s+(.*)$/);
  return m ? m[1].trim() : null;
}

/** Render the real App Store description into safe HTML blocks. */
function renderDescription(desc) {
  const lines = String(desc || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let para = [];
  let bullets = [];

  const flushPara = () => {
    if (para.length) {
      out.push(`<p class="text-lg mb-5">${esc(para.join(' '))}</p>`);
      para = [];
    }
  };
  const flushBullets = () => {
    if (bullets.length) {
      out.push(
        `<ul class="text-lg mb-5 space-y-2 list-disc pl-6">${bullets
          .map((b) => `<li>${esc(b)}</li>`)
          .join('')}</ul>`
      );
      bullets = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushBullets();
      flushPara();
      continue;
    }
    const bc = bulletContent(line);
    if (bc !== null) {
      flushPara();
      bullets.push(bc);
      continue;
    }
    if (isHeadingLine(line)) {
      flushBullets();
      flushPara();
      const h = line.replace(/[:：]\s*$/, '');
      out.push(`<h3 class="text-2xl mt-10 mb-4">${esc(titleCase(h))}</h3>`);
      continue;
    }
    flushBullets();
    para.push(line);
  }
  flushBullets();
  flushPara();
  return out.join('\n        ');
}

/** Turn an ALL-CAPS heading into Title Case for readability. */
function titleCase(s) {
  const small = new Set(['a', 'an', 'and', 'the', 'or', 'of', 'to', 'for', 'in', 'on', 'with', 'is', 'my']);
  const words = s.toLowerCase().split(/\s+/);
  return words
    .map((w, i) => {
      if (i !== 0 && small.has(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

// ---------- template ----------

function renderPage(data) {
  const {
    trackName, trackId, slug, icon, accent, genre,
    description, price, currency, rating, ratingCount,
  } = data;

  const storeUrl = `https://apps.apple.com/app/id${trackId}?ct=congle-web-${slug}&mt=8`;
  const canonical = `${SITE_URL}/apps/${slug}/`;
  const imageUrl = `${SITE_URL}${icon}`;
  const subtitle = subtitleFromName(trackName);
  const descriptor = subtitle || GENRE_PHRASE[genre] || 'iPhone App';
  const title = `${baseName(trackName)} — ${descriptor} for iPhone`;
  const metaDesc = metaDescription(description) || `${trackName} for iPhone. Download free on the App Store.`;
  const heroLead = metaDescription(description, 200) || descriptor;
  const schemaCategory = GENRE_SCHEMA[genre] || 'MobileApplication';
  const tintLight = rgba(accent, 0.10);
  const tintDark = rgba(accent, 0.16);
  const priceStr = String(price == null ? 0 : price);
  const currencyStr = currency || 'GBP';

  const ratingBlock =
    ratingCount >= 5
      ? `,\n    "aggregateRating": {\n      "@type": "AggregateRating",\n      "ratingValue": ${jsonStr(rating.toFixed(1))},\n      "ratingCount": ${ratingCount}\n    }`
      : '';

  const jsonLd = `{
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": ${jsonStr(trackName)},
    "operatingSystem": "iOS",
    "applicationCategory": ${jsonStr(schemaCategory)},
    "description": ${jsonStr(metaDescription(description, 300))},
    "url": ${jsonStr(canonical)},
    "image": ${jsonStr(imageUrl)},
    "offers": {
      "@type": "Offer",
      "price": ${jsonStr(priceStr)},
      "priceCurrency": ${jsonStr(currencyStr)}
    },
    "author": {
      "@type": "Person",
      "name": "Cong Le",
      "url": "https://www.cong-le.com"
    }${ratingBlock}
  }`;

  const descHtml = renderDescription(description);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="apple-itunes-app" content="app-id=${trackId}">

  <title>${esc(title)}</title>
  <meta name="description" content="${esc(metaDesc)}">
  <link rel="canonical" href="${canonical}">

  <!-- Open Graph -->
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(metaDesc)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:site_name" content="Cong Le Apps">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(metaDesc)}">
  <meta name="twitter:image" content="${imageUrl}">

  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
  ${jsonLd}
  </script>

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
      theme: { extend: { fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] } } }
    }
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    html { scroll-behavior: smooth; }
    :root { --tint: ${tintLight}; --accent: ${accent}; }
    .dark { --tint: ${tintDark}; }
    body::before {
      content: ""; position: fixed; top: 0; left: 0; right: 0; height: 560px;
      z-index: -1; pointer-events: none;
      background: linear-gradient(180deg, var(--tint), transparent);
    }
    .fade-up { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }
    .fade-up.visible { opacity: 1; transform: none; }
    section h1, section h2 { font-weight: 800; letter-spacing: -0.02em; line-height: 1.15; }
    section h3 { font-weight: 700; letter-spacing: -0.01em; }
    section p, section li { color: #4b5563; }
    .dark section p, .dark section li { color: #9ca3af; }
    .prose-desc a { color: var(--accent); }
    .hero-icon { width: 240px; height: 240px; border-radius: 54px; box-shadow: 0 30px 60px rgba(0,0,0,0.18); animation: float 5s ease-in-out infinite; }
    .dark .hero-icon { box-shadow: 0 30px 60px rgba(0,0,0,0.5); }
    @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }
    .accent-nav:hover { color: var(--accent); }
  </style>
</head>
<body class="bg-gray-50 dark:bg-black text-gray-900 dark:text-white antialiased transition-colors">

  <header class="fixed top-0 inset-x-0 z-50 bg-white/85 dark:bg-black/85 backdrop-blur-md border-b border-gray-200 dark:border-white/10 transition-colors">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <a href="/" class="font-bold text-xl tracking-tight text-gray-900 dark:text-white">Cong Le</a>
      <nav class="flex items-center gap-6 sm:gap-8">
        <a href="/#apps" class="accent-nav text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors">Apps</a>
        <a href="/blog/" class="accent-nav text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors">Blog</a>
        <button type="button" onclick="__toggleTheme()" aria-label="Toggle dark mode" class="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 dark:hidden"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 hidden dark:block"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
        </button>
      </nav>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
    <div class="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
      <div class="fade-up">
        <h1 class="text-5xl md:text-6xl lg:text-7xl leading-tight mb-6">
          ${esc(trackName)}
        </h1>
        <p class="text-xl md:text-2xl mb-8" style="color:#4b5563">
          ${esc(heroLead)}
        </p>
        <a href="${storeUrl}" target="_blank" rel="noopener"
           class="inline-flex items-center gap-3 font-bold px-8 py-4 rounded-full text-lg hover:opacity-90 transition-opacity shadow-lg" style="background: ${accent}; color: white;">
          ${APP_STORE_SVG}
          Download ${price === 0 || price == null ? 'Free ' : ''}on the App Store
        </a>
      </div>
      <div class="fade-up flex justify-center">
        <img src="${icon}" alt="${esc(trackName)} app icon" class="hero-icon" width="240" height="240">
      </div>
    </div>
  </section>

  <!-- What it does -->
  <section class="py-16 lg:py-24">
    <div class="max-w-3xl mx-auto px-6 fade-up prose-desc">
      <h2 class="text-4xl md:text-5xl mb-8">What ${esc(baseName(trackName))} does</h2>
      <div class="max-w-none">
        ${descHtml}
      </div>
    </div>
  </section>

  <!-- Guides & articles — kept in sync by update-landing-links.mjs from the
       published blog. Empty (invisible) until this app has published posts. -->
  <!-- BLOG-LINKS:${slug} --><!-- /BLOG-LINKS -->

  <!-- Final CTA -->
  <section class="py-24 lg:py-32 text-center">
    <div class="max-w-3xl mx-auto px-6 fade-up">
      <h2 class="text-5xl md:text-6xl mb-6">Get ${esc(baseName(trackName))} for iPhone</h2>
      <p class="text-xl mb-10" style="color:#4b5563">
        ${esc(metaDesc)}
      </p>
      <a href="${storeUrl}" target="_blank" rel="noopener"
         class="inline-flex items-center gap-3 font-bold px-10 py-5 rounded-full text-xl hover:opacity-90 transition-opacity shadow-xl" style="background: ${accent}; color: white;">
        ${APP_STORE_SVG.replace('w-6 h-6', 'w-7 h-7')}
        Download ${price === 0 || price == null ? 'Free ' : ''}on the App Store
      </a>
    </div>
  </section>

  <footer class="bg-gray-900 dark:bg-black text-white border-t border-gray-800 dark:border-gray-900">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
      <p class="mt-8 text-sm text-gray-500">&copy; 2026 Cong Le. All rights reserved.</p>
    </div>
  </footer>

  <script>
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
    function __toggleTheme() {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
  </script>
</body>
</html>
`;
}

// ---------- iTunes ----------

async function fetchMeta(trackIds) {
  const url = `https://itunes.apple.com/lookup?id=${trackIds.join(',')}&country=${COUNTRY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`iTunes lookup HTTP ${res.status}`);
  const data = await res.json();
  const byId = {};
  for (const r of data.results || []) {
    if (r.wrapperType === 'software' || r.kind === 'software') byId[String(r.trackId)] = r;
  }
  return byId;
}

// ---------- constants.ts codemod ----------

function updateConstants(slugByTrackId) {
  let src = readFileSync(CONSTANTS_PATH, 'utf8');
  const lines = src.split('\n');
  const out = [];
  let added = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    out.push(line);
    const m = line.match(/url:\s*"[^"]*id(\d+)\?/);
    if (m) {
      const trackId = m[1];
      const slug = slugByTrackId[trackId];
      const next = lines[i + 1] || '';
      if (slug && !/landingPage\s*:/.test(next)) {
        const indent = (line.match(/^(\s*)/) || ['', ''])[1];
        out.push(`${indent}landingPage: "/apps/${slug}/",`);
        added++;
      }
    }
  }
  writeFileSync(CONSTANTS_PATH, out.join('\n'));
  return added;
}

// ---------- main ----------

function parseArgs(argv) {
  const args = { only: null, force: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--only') args.only = argv[++i];
    else if (argv[i] === '--force') args.force = argv[++i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const filterSlug = args.only || args.force || null;

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  const apps = manifest.apps;

  const toGenerate = apps.filter((a) => !EXISTING[String(a.trackId)]);
  const trackIds = toGenerate.map((a) => a.trackId);

  console.log(`Fetching iTunes metadata for ${trackIds.length} apps in one call...`);
  const meta = await fetchMeta(trackIds);

  const slugByTrackId = { ...EXISTING };
  const seenSlugs = new Set(PROTECTED_SLUGS);
  const generated = [];
  const skipped = [];
  const collisions = [];

  for (const app of toGenerate) {
    const trackId = String(app.trackId);
    let slug = slugFor(app);

    // Guard against colliding with a hand-made page or a prior generated one.
    if (PROTECTED_SLUGS.has(slug)) {
      collisions.push({ slug, trackId, reason: 'collides with hand-made page' });
      slug = `${slug}-${trackId}`;
    }
    if (seenSlugs.has(slug)) {
      collisions.push({ slug, trackId, reason: 'duplicate generated slug' });
      slug = `${slug}-${trackId}`;
    }
    seenSlugs.add(slug);
    slugByTrackId[trackId] = slug;

    if (filterSlug && slug !== filterSlug) {
      skipped.push(slug);
      continue;
    }

    const m = meta[trackId] || {};
    const icon = app.icon || `/images/apps/${trackId}/icon.jpg`;
    if (!existsSync(path.join(PUBLIC, icon.replace(/^\//, '')))) {
      console.warn(`  ! missing icon on disk for ${app.trackName} (${trackId})`);
    }

    const accent = accentForApp({ trackId, genre: m.primaryGenreName });
    const html = renderPage({
      trackName: app.trackName,
      trackId,
      slug,
      icon,
      accent,
      genre: m.primaryGenreName,
      description: m.description || '',
      price: m.price,
      currency: m.currency,
      rating: typeof m.averageUserRating === 'number' ? m.averageUserRating : 0,
      ratingCount: m.userRatingCount || 0,
    });

    const dir = path.join(PUBLIC_APPS, slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'index.html'), html);
    generated.push(slug);
    console.log(`  ✓ ${slug}`);
  }

  console.log(`\nGenerated ${generated.length} page(s).`);
  if (collisions.length) {
    console.log(`Slug collisions handled (${collisions.length}):`);
    collisions.forEach((c) => console.log(`  - ${c.slug} (${c.trackId}): ${c.reason}`));
  }

  // Update constants.ts so every app has a landingPage (unless filtering to one).
  if (!filterSlug) {
    const added = updateConstants(slugByTrackId);
    console.log(`constants.ts: added landingPage to ${added} entr${added === 1 ? 'y' : 'ies'}.`);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
