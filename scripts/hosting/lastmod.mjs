/**
 * Real last changed dates for sitemap <lastmod>.
 *  - Blog posts: `updated` (or `published`) from their frontmatter.
 *  - Blog index and categories: the newest post they list (or the page template, if newer).
 *  - Every other page: the git last commit date of its source file(s). Dynamic routes count both
 *    the route template and the data file that feeds it.
 *  - Falls back to the build date.
 *
 * Git history may be missing or shallow on the build server (Hostinger clones the repo), so local
 * builds also write lastmod.json: { file: { date, blob } } using each file's committed blob hash.
 * When git is not usable, a file whose content still matches its recorded blob gets the recorded
 * date; anything else gets the build date.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const MANIFEST = fileURLToPath(new URL('./lastmod.json', import.meta.url));
const BUILD_DATE = new Date();

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
let gitOk = false;
try { gitOk = git('rev-parse', '--is-shallow-repository') === 'false'; } catch { gitOk = false; }

const manifest = (() => { try { return JSON.parse(readFileSync(MANIFEST, 'utf8')); } catch { return {}; } })();
const blobHash = (buf) => createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');

const cache = new Map();
/** Last committed date of a repo relative file, or null. */
function fileDate(rel) {
  if (cache.has(rel)) return cache.get(rel);
  let d = null;
  if (existsSync(path.join(ROOT, rel))) {
    if (gitOk) {
      try { const iso = git('log', '-1', '--format=%cI', '--', rel); if (iso) d = new Date(iso); } catch {}
    } else {
      const m = manifest[rel];
      if (m && blobHash(readFileSync(path.join(ROOT, rel))) === m.blob) d = new Date(m.date);
    }
  }
  cache.set(rel, d);
  return d;
}

/** Track every file we look up, so local builds can refresh the manifest. */
const used = new Set();
const dateOf = (rel) => { used.add(rel); return fileDate(rel); };

function frontmatter(rel) {
  const src = readFileSync(path.join(ROOT, rel), 'utf8');
  const fm = src.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const get = (k) => fm.match(new RegExp(`^${k}:\\s*["']?([^"'\\n]+)`, 'm'))?.[1]?.trim();
  return { published: get('published'), updated: get('updated'), category: get('category'), draft: get('draft') === 'true' };
}

const BLOG_DIR = 'src/content/blog';
const posts = () =>
  readdirSync(path.join(ROOT, BLOG_DIR)).filter((f) => f.endsWith('.mdx')).map((f) => {
    const fm = frontmatter(`${BLOG_DIR}/${f}`);
    return { slug: f.replace(/\.mdx$/, ''), category: fm.category, draft: fm.draft, date: new Date(fm.updated ?? fm.published) };
  }).filter((p) => !p.draft && !Number.isNaN(p.date.getTime()));

const newest = (dates) => dates.filter(Boolean).reduce((a, b) => (b > a ? b : a), null);

const DYNAMIC = {
  services: ['src/pages/services/[slug].astro', 'src/data/services.ts'],
  industries: ['src/pages/industries/[slug].astro', 'src/data/industries.ts'],
  'service-areas': ['src/pages/service-areas/[city].astro', 'src/data/cities.ts'],
};

/** Last changed Date for a site path such as "/" or "/services/fulfillment". */
export function lastmodFor(pathname) {
  const p = pathname.replace(/\/+$/, '') || '/';
  const parts = p.split('/').filter(Boolean);
  let d = null;
  if (p === '/') d = dateOf('src/pages/index.astro');
  else if (parts[0] === 'blog' && parts[1] === 'category' && parts[2]) d = newest(posts().filter((x) => x.category === parts[2]).map((x) => x.date));
  else if (parts[0] === 'blog' && parts[1]) d = posts().find((x) => x.slug === parts[1])?.date ?? null;
  else if (p === '/blog') d = newest([...posts().map((x) => x.date), dateOf('src/pages/blog/index.astro')]);
  else if (parts[0] === 'careers' && parts[1]) d = newest([dateOf(`src/content/careers/${parts[1]}.mdx`), dateOf('src/pages/careers/[slug].astro')]);
  else if (parts.length === 2 && DYNAMIC[parts[0]]) d = newest(DYNAMIC[parts[0]].map(dateOf));
  else {
    const rel = `src/pages${p}`;
    d = dateOf(existsSync(path.join(ROOT, `${rel}.astro`)) ? `${rel}.astro` : `${rel}/index.astro`);
  }
  return (d ?? BUILD_DATE).toISOString();
}

/** After a build with full git history, record committed dates and blob hashes for the build server. */
export function writeManifest() {
  if (!gitOk) return false;
  const out = {};
  for (const rel of [...used].sort()) {
    try {
      const blob = git('rev-parse', `HEAD:${rel}`);
      const d = fileDate(rel);
      if (d) out[rel] = { date: d.toISOString(), blob };
    } catch {}
  }
  const next = JSON.stringify(out, null, 2) + '\n';
  if (!existsSync(MANIFEST) || readFileSync(MANIFEST, 'utf8') !== next) writeFileSync(MANIFEST, next);
  return true;
}
