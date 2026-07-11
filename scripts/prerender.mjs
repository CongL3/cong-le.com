// Prerender the homepage into static HTML.
//
// Runs after the client build (dist/) and the SSR build (dist-ssr/). It imports
// the server bundle, renders <App/> to an HTML string, and injects it into the
// root <div> of dist/index.html so crawlers get full content without executing
// JS. The client bundle referenced by dist/index.html then hydrates it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const ssrDir = path.join(root, 'dist-ssr');
const indexPath = path.join(distDir, 'index.html');
const ssrEntry = path.join(ssrDir, 'entry-server.js');

const ROOT_DIV = '<div id="root"></div>';

function fail(msg) {
  console.error(`[prerender] ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(indexPath)) fail(`missing ${indexPath} — run the client build first`);
if (!fs.existsSync(ssrEntry)) fail(`missing ${ssrEntry} — run the SSR build first`);

const { render } = await import(pathToFileURL(ssrEntry).href);
const appHtml = render();

let html = fs.readFileSync(indexPath, 'utf8');
if (!html.includes(ROOT_DIV)) fail(`could not find '${ROOT_DIV}' in dist/index.html`);

html = html.replace(ROOT_DIV, `<div id="root">${appHtml}</div>`);
fs.writeFileSync(indexPath, html);

// The SSR bundle is a build artifact only; keep it out of the deployed dist.
fs.rmSync(ssrDir, { recursive: true, force: true });

console.log(`[prerender] injected ${appHtml.length} bytes of static HTML into dist/index.html`);
