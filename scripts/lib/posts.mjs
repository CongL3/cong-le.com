/**
 * posts.mjs
 * A tiny frontmatter parser for the blog post schema. No YAML dependency —
 * the schema is fixed and simple: strings, string arrays, and integers.
 *
 * Frontmatter shape:
 *   title: "..."          string
 *   description: "..."     string
 *   slug: post-slug        string
 *   app: solunar-fishing   string (app slug)
 *   keywords: ["a", "b"]   string array
 *   queue: 1               integer
 *   status: queued         string (queued | published)
 *   publishDate: 2026-01-01  string (may be empty)
 */

import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '../..');
export const POSTS_DIR = path.join(ROOT, 'content/posts');

/** Strip matching surrounding quotes from a scalar value. */
function unquote(raw) {
  const s = raw.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1);
  }
  return s;
}

/** Parse a `["a", "b"]` style inline array into a string array. */
function parseArray(raw) {
  const inner = raw.trim().replace(/^\[/, '').replace(/\]$/, '').trim();
  if (!inner) return [];
  // Split on commas that are not inside quotes. The schema uses simple
  // quoted strings, so a straightforward split + unquote is sufficient.
  const parts = [];
  let current = '';
  let inQuote = null;
  for (const ch of inner) {
    if (inQuote) {
      if (ch === inQuote) inQuote = null;
      else current += ch;
    } else if (ch === '"' || ch === "'") {
      inQuote = ch;
    } else if (ch === ',') {
      parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts.map((p) => unquote(p)).filter(Boolean);
}

/**
 * Split a raw markdown file into { frontmatter (raw lines), body }.
 * Returns null if the file has no leading `---` frontmatter block.
 */
export function splitFrontmatter(raw) {
  const normalized = raw.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) return null;
  const end = normalized.indexOf('\n---', 4);
  if (end === -1) return null;
  const fmBlock = normalized.slice(4, end);
  // Body begins after the closing `---` line.
  let bodyStart = normalized.indexOf('\n', end + 1);
  bodyStart = bodyStart === -1 ? normalized.length : bodyStart + 1;
  return {
    frontmatterLines: fmBlock.split('\n'),
    body: normalized.slice(bodyStart),
  };
}

/** Parse a single post file's raw contents into a structured object. */
export function parsePost(raw, filename) {
  const split = splitFrontmatter(raw);
  if (!split) {
    throw new Error(`${filename}: missing or malformed frontmatter block`);
  }
  const data = {
    title: '',
    description: '',
    slug: '',
    app: '',
    keywords: [],
    queue: 0,
    status: 'queued',
    publishDate: '',
  };
  for (const line of split.frontmatterLines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const rawVal = line.slice(idx + 1).trim();
    switch (key) {
      case 'keywords':
        data.keywords = parseArray(rawVal);
        break;
      case 'queue':
        data.queue = rawVal ? parseInt(rawVal, 10) || 0 : 0;
        break;
      case 'title':
      case 'description':
      case 'slug':
      case 'app':
      case 'status':
      case 'publishDate':
        data[key] = unquote(rawVal);
        break;
      default:
        break;
    }
  }
  return { data, body: split.body, filename };
}

/** Load and parse every content/posts/*.md file. */
export function loadPosts() {
  let files;
  try {
    files = readdirSync(POSTS_DIR).filter(
      (f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md'
    );
  } catch {
    return [];
  }
  const posts = [];
  for (const file of files) {
    const raw = readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const post = parsePost(raw, file);
    // Default slug to the filename if omitted.
    if (!post.data.slug) post.data.slug = file.replace(/\.md$/, '');
    posts.push(post);
  }
  return posts;
}

export const publishedPosts = (posts) =>
  posts
    .filter((p) => p.data.status === 'published')
    .sort((a, b) => (b.data.publishDate || '').localeCompare(a.data.publishDate || ''));
