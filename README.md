<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1GzGCI6bShu3uuLy6ZThCs7fJJeIlCTBC

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## SEO Content Pipeline (blog + app landing pages)

Static SEO content lives alongside the React SPA and drives App Store downloads:

- `content/posts/*.md` — blog content bank; frontmatter spec in `content/posts/README.md`. Posts start `status: queued` with an integer `queue` order.
- `.github/workflows/publish-posts.yml` — cron (Mon + Thu 07:00 UTC) runs `scripts/publish-next.mjs`: publishes the lowest-queue post, regenerates `public/blog/` (pages, index, RSS) and `public/sitemap.xml`, commits → Pages redeploys.
- `scripts/build-blog.mjs` / `generate-sitemap.mjs` also run as `prebuild`, so every deploy is fresh.
- `public/apps/<slug>/index.html` — static SEO landing pages per app. All App Store links carry `?ct=congle-web-<slug>` campaign tokens for attribution.
- Strategy, keyword map, and how to write the next content batch: `/Users/congle/Dev/SEO/PLAYBOOK.md`.
