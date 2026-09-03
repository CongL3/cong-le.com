<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This repository powers cong-le.com: Cong Le's portfolio, with an iOS Smart App
Banner and direct attributed downloads for Anniversary Tracker, plus prominent
attributed Download actions throughout the full app catalogue.

## Try the active apps

The portfolio's active app pages provide the product context and the correct
store hand-off:

- [Anniversary Tracker](https://pocketgrove.com/anniversary-tracker/?utm_source=github&utm_medium=referral&utm_campaign=portfolio_readme&utm_content=anniversary)
- [Football Career Quest](https://pocketgrove.com/football-career-quest/?utm_source=github&utm_medium=referral&utm_campaign=portfolio_readme&utm_content=football-career-quest)
- [Prime Minister Sim](https://pocketgrove.com/prime-minister-sim/?utm_source=github&utm_medium=referral&utm_campaign=portfolio_readme&utm_content=prime-minister-sim-politics)
- [Hoop Quest](https://pocketgrove.com/hoop-quest/?utm_source=github&utm_medium=referral&utm_campaign=portfolio_readme&utm_content=hoop-quest)
- [Ollama Connect](https://pocketgrove.com/ollama-connect/?utm_source=github&utm_medium=referral&utm_campaign=portfolio_readme&utm_content=ollama-connect)
- [Baby Screen Lock](https://pocketgrove.com/baby-screen-lock/?utm_source=github&utm_medium=referral&utm_campaign=portfolio_readme&utm_content=baby-screen-lock)
- [Solunar Fishing](https://pocketgrove.com/solunar-fishing-times/?utm_source=github&utm_medium=referral&utm_campaign=portfolio_readme&utm_content=solunar)

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
- `.github/workflows/publish-posts.yml` — cron (Tue + Thu + Sat 08:00 UTC) runs `scripts/publish-next.mjs`: publishes the lowest-queue post, regenerates `public/blog/` (pages, index, RSS) and `public/sitemap.xml`, commits → Pages redeploys.
- `scripts/build-blog.mjs` / `generate-sitemap.mjs` also run as `prebuild`, so every deploy is fresh.
- `public/apps/<slug>/index.html` — static SEO landing pages per app. All App Store links carry `?ct=congle-web-<slug>` campaign tokens for attribution.
- Strategy, keyword map, and how to write the next content batch: `/Users/congle/Dev/SEO/PLAYBOOK.md`.
