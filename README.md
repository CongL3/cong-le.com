<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Cong Le — iOS app portfolio

This repository powers [cong-le.com](https://www.cong-le.com): a portfolio of
small iOS apps, developer notes, and the static acquisition pages that explain
each product before sending visitors to its store listing.

## Try the active apps

The portfolio's active app pages provide product context and the correct store
hand-off. Use the page for details, or go directly to a supported store:

- [Anniversary Tracker page](https://pocketgrove.com/anniversary-tracker/?utm_source=github&utm_medium=referral&utm_campaign=portfolio_readme&utm_content=anniversary) · [Download on the App Store](https://apps.apple.com/gb/app/anniversary-tracker/id1570714816?ct=congle-github-readme-anniversary&pt=19678800&mt=8) · [Get it on Google Play](https://play.google.com/store/apps/details?id=com.congle.TEAMCONG.AnniversaryTracker&utm_source=github&utm_medium=referral&utm_campaign=portfolio_readme&utm_content=anniversary-android)
- [Football Career Quest page](https://pocketgrove.com/football-career-quest/?utm_source=github&utm_medium=referral&utm_campaign=portfolio_readme&utm_content=football-career-quest) · [Download](https://apps.apple.com/gb/app/football-career-quest/id6777125671?ct=congle-github-readme-football&pt=19678800&mt=8)
- [Prime Minister Sim page](https://pocketgrove.com/prime-minister-sim/?utm_source=github&utm_medium=referral&utm_campaign=portfolio_readme&utm_content=prime-minister-sim-politics) · [Download](https://apps.apple.com/gb/app/prime-minister-sim-politics/id6787888847?ct=congle-github-readme-prime-minister&pt=19678800&mt=8)
- [Hoop Quest page](https://pocketgrove.com/hoop-quest/?utm_source=github&utm_medium=referral&utm_campaign=portfolio_readme&utm_content=hoop-quest) · [Download](https://apps.apple.com/gb/app/hoop-quest-basketball-sim/id6775279715?ct=congle-github-readme-hoop&pt=19678800&mt=8)
- [Ollama Connect page](https://pocketgrove.com/ollama-connect/?utm_source=github&utm_medium=referral&utm_campaign=portfolio_readme&utm_content=ollama-connect) · [Download on the App Store](https://apps.apple.com/gb/app/ollama-connect/id6769891596?ct=congle-github-readme-ollama&pt=19678800&mt=8) · [Get it on Google Play](https://play.google.com/store/apps/details?id=com.congle.TEAMCONG.OllamaConnect&utm_source=github&utm_medium=referral&utm_campaign=portfolio_readme&utm_content=ollama-connect-android)
- [Baby Screen Lock page](https://pocketgrove.com/baby-screen-lock/?utm_source=github&utm_medium=referral&utm_campaign=portfolio_readme&utm_content=baby-screen-lock) · [Download](https://apps.apple.com/gb/app/baby-screen-lock-kid-safe/id6761378897?ct=congle-github-readme-baby&pt=19678800&mt=8)
- [Solunar Fishing page](https://pocketgrove.com/solunar-fishing-times/?utm_source=github&utm_medium=referral&utm_campaign=portfolio_readme&utm_content=solunar) · [Download on the App Store](https://apps.apple.com/gb/app/solunar-best-fishing-times/id6760960543?ct=congle-github-readme-solunar&pt=19678800&mt=8) · [Get it on Google Play](https://play.google.com/store/apps/details?id=com.congle.TEAMCONG.SolunarFishing&utm_source=github&utm_medium=referral&utm_campaign=portfolio_readme&utm_content=solunar-android)

[Browse the full active app catalogue](https://www.cong-le.com/?utm_source=github&utm_medium=referral&utm_campaign=portfolio_readme&utm_content=full-catalogue#apps).

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
