# Cong Le Personal Site v2

Simple, dark-first static personal site.

## Deploy model (GitHub Pages, free)

After one-time setup, deploy is automatic on every push to `main`.

## One-time setup

1. Create a new GitHub repo (for example: `cong-le.com`).
2. Put this project at the repo root.
3. Push to `main`.
4. In GitHub repo settings:
   - Open `Settings -> Pages`.
   - Under `Build and deployment`, choose `GitHub Actions`.
5. Keep `CNAME` file as:
   - `cong-le.com`
6. In Cloudflare DNS for `cong-le.com`, add:
   - `A  @  185.199.108.153`
   - `A  @  185.199.109.153`
   - `A  @  185.199.110.153`
   - `A  @  185.199.111.153`
   - `CNAME  www  <your-github-username>.github.io`

## Daily deploy command

```bash
git add . && git commit -m "update site" && git push
```

Push triggers `.github/workflows/deploy-pages.yml` and publishes automatically.

## Local preview

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Project files

- `index.html`
- `assets/styles.css`
- `assets/site.js`
- `CNAME`
- `.github/workflows/deploy-pages.yml`
# cong-le.com
