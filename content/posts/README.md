# Blog posts

Blog posts are plain Markdown files in this directory, one per file. The build
pipeline (`scripts/build-blog.mjs`) turns every **published** post into a static
HTML page under `public/blog/<slug>/index.html`, plus a blog index and RSS feed.
None of this touches the React SPA — the blog is pure static output.

## File format

Each post is `content/posts/<slug>.md` with YAML-style frontmatter followed by
GitHub-flavored Markdown. The frontmatter parser is hand-rolled (no YAML
dependency), so **stick to the exact shape below** — strings, inline string
arrays, and integers only.

```markdown
---
title: "Post Title"
description: "Meta description, 155 characters or fewer"
slug: post-slug            # must equal the filename without .md
app: solunar-fishing       # one of the app slugs below
keywords: ["kw one", "kw two"]
queue: 1                   # integer; drip-publish order (lowest goes first)
status: queued             # queued | published
publishDate:               # empty until published, then YYYY-MM-DD
---

## First heading

Body is GitHub-flavored Markdown: `##` / `###` headings, lists, links, code,
blockquotes. Most posts end with a `## FAQ` section of `###` questions.
```

### Field notes

| Field | Type | Notes |
|---|---|---|
| `title` | string | Page `<h1>` and `<title>` (suffixed with " \| Cong Le Apps"). |
| `description` | string | Meta description + card copy. Keep ≤ 155 chars. |
| `slug` | string | Must match the filename. Becomes `/blog/<slug>/`. |
| `app` | string | One of the app slugs below. Drives the download CTA + related posts. |
| `keywords` | string[] | Inline array, e.g. `["a", "b"]`. Used in JSON-LD. |
| `queue` | int | Drip order. `publish-next` picks the lowest `queue` among `queued`. |
| `status` | string | `queued` or `published`. Only `published` posts are rendered. |
| `publishDate` | string | Empty while queued; set to `YYYY-MM-DD` on publish. |

### Valid `app` slugs

`frankly-ai`, `ollama-connect`, `baby-screen-lock`, `hoop-quest`,
`solunar-fishing`, `anniversary-tracker`.

Each app resolves to an icon, an `/apps/<slug>/` landing page, and a campaign
App Store URL — see `scripts/lib/apps.mjs`.

## Lifecycle: queued → cron → published

1. **Write** a post with `status: queued`, an empty `publishDate`, and a `queue`
   number. Higher = later.
2. **Drip-publish.** The `Publish queued blog post` GitHub Action runs on a cron
   (Mon & Thu, 07:00 UTC) and calls `node scripts/publish-next.mjs`, which:
   - selects the `queued` post with the lowest `queue`,
   - flips it to `status: published` and stamps today's `publishDate`,
   - rebuilds `public/blog/` and `public/sitemap.xml`,
   - commits and pushes (which triggers the Pages deploy).
3. **Published** posts stay live. Re-running the build is deterministic —
   `public/blog/` is wiped and regenerated every time.

## Local commands

```bash
npm run blog:build              # regenerate public/blog/ from posts
node scripts/generate-sitemap.mjs   # regenerate public/sitemap.xml
npm run blog:publish -- --dry-run   # show which post would publish next
npm run blog:publish            # publish the next queued post locally
npm run build                   # prebuild regenerates blog + sitemap, then vite build
```
