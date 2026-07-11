# cong-le.com — Portfolio Site + SEO Content Machine

Vite + React 19 SPA deployed to GitHub Pages (Cloudflare DNS, CNAME www.cong-le.com).
Push to `main` auto-deploys via `.github/workflows/deploy-pages.yml`.

## ⏰ Session-start ritual (IMPORTANT)

Read `/Users/congle/Dev/SEO/TASKS.md` and compare its **Due** dates against today's date.
If anything is due within 7 days or overdue, surface it to Cong immediately and offer to
do it. He will forget these otherwise.

## SEO content pipeline
- `content/posts/*.md` — blog bank; frontmatter spec in `content/posts/README.md`
  (`status: queued|published`, integer `queue` = publish order).
- `.github/workflows/publish-posts.yml` — cron Mon + Thu 07:00 UTC runs
  `scripts/publish-next.mjs`: publishes lowest-queue post, regenerates `public/blog/`
  (pages, index, RSS) + `public/sitemap.xml`, commits → Pages redeploys.
- `scripts/build-blog.mjs` + `generate-sitemap.mjs` also run as `prebuild`.
- `scripts/lib/apps.mjs` — app registry used by the blog CTA (slug → trackId/store URL).
- `public/apps/<slug>/index.html` — static SEO landing pages. All App Store links carry
  `?ct=congle-web-<slug>&mt=8` campaign tokens (`ct=congle-web-home` from the homepage).
- Strategy/keyword map/batch recipe: `/Users/congle/Dev/SEO/PLAYBOOK.md`.

## Conventions
- `public/images/apps/manifest.json` is the source of truth for live apps (41), synced
  weekly from the iTunes API by `sync-apps.yml`. Homepage `constants.ts` APPS must map
  1:1 onto it — no delisted apps, no duplicates, links to the app (never the dev page).
- Homepage app order = revenue/downloads ranking (best first).
- `dist/` is committed (historical); CI rebuilds it anyway — run `npm run build` before
  committing so dist matches source.
- Keep the blog queue ≥8 posts deep.
