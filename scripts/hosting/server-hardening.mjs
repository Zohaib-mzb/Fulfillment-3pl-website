/**
 * Loaded first by dist/server/entry.mjs (see scripts/hosting/integration.mjs).
 * The @astrojs/node standalone server serves static files uncompressed and only sets
 * cache headers on /_astro. This wraps its HTTP listener to add, for every response:
 *  - security headers (the ones vercel.json used to set)
 *  - cache rules per path
 *  - a 301 from www.kinematicstech.ca to the apex
 *  - precompressed Brotli or gzip variants (*.br / *.gz written at build time) for static text files
 *  - Markdown for agents: /page.md, or the page URL itself when Accept prefers text/markdown over
 *    text/html (browsers always get HTML). Both representations send Vary: Accept.
 *  - Link header on every page: llms.txt (describedby) and the page's .md twin (alternate)
 * Anything it does not handle falls through to Astro unchanged (pages, /api/submit, 404, redirects, ranges).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CLIENT = fileURLToPath(new URL('../client/', import.meta.url));

const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

export function cacheControl(p) {
  if (p.startsWith('/_astro/') || p.startsWith('/media/')) return 'public, max-age=31536000, immutable';
  if (p.startsWith('/og/')) return 'public, max-age=86400, stale-while-revalidate=604800';
  if (/^\/(favicon\.ico|favicon\.svg|favicon-32\.png|apple-touch-icon\.png|icon-192\.png|icon-512\.png|icon-maskable-512\.png)$/.test(p)) return 'public, max-age=604800, stale-while-revalidate=86400';
  if (/^\/(llms\.txt|robots\.txt|rss\.xml|sitemap-index\.xml|sitemap-\d+\.xml)$/.test(p)) return 'public, max-age=3600, stale-while-revalidate=86400';
  if (p.startsWith('/api/')) return 'no-store';
  return 'public, max-age=0, must-revalidate';
}

/** Map a clean URL to a built file inside dist/client, or null. */
function fileFor(urlPath) {
  let p;
  try { p = decodeURIComponent(urlPath); } catch { return null; }
  if (p.includes('\0') || (p !== '/' && p.endsWith('/'))) return null;
  const rel = p === '/' ? 'index.html' : path.extname(p) ? p.slice(1) : `${p.slice(1)}.html`;
  const abs = path.resolve(CLIENT, rel);
  if (!abs.startsWith(CLIENT)) return null;
  return abs;
}

/** Quality the Accept header gives a media type (most specific match wins; absent means 1 for any). */
function quality(accept, type) {
  if (!accept) return type === 'text/html' ? 1 : 0;
  const [major] = type.split('/');
  let best = -1, q = 0;
  for (const part of accept.split(',')) {
    const [range, ...params] = part.trim().toLowerCase().split(';').map((x) => x.trim());
    const spec = range === type ? 3 : range === `${major}/*` ? 2 : range === '*/*' ? 1 : 0;
    if (!spec || spec < best) continue;
    const qp = params.find((x) => x.startsWith('q='));
    const v = qp ? Number(qp.slice(2)) : 1;
    if (spec > best || v > q) { best = spec; q = Number.isFinite(v) ? v : 0; }
  }
  return q;
}
/** True only when the client explicitly ranks Markdown above HTML. Ties go to HTML. */
export const prefersMarkdown = (accept) => quality(String(accept || ''), 'text/markdown') > quality(String(accept || ''), 'text/html');

const exists = (f) => { try { return fs.statSync(f).isFile(); } catch { return false; } };

/** Page URL (no extension) → its built .md twin, or null. */
function markdownFor(urlPath) {
  if (path.extname(urlPath)) return null;
  const html = fileFor(urlPath);
  if (!html) return null;
  const md = html.replace(/\.html$/, '.md');
  return exists(md) ? md : null;
}
const mdUrl = (urlPath) => (urlPath === '/' ? '/index.md' : `${urlPath}.md`);

/** Serve a built file: Brotli or gzip variant when accepted, else (for .md only) the file itself. */
function serveFile(req, res, file, { identity = false } = {}) {
  const accept = String(req.headers['accept-encoding'] || '');
  const type = TYPES[path.extname(file)];
  if (!type) return false;
  const tag = path.extname(file).slice(1);
  const variants = [['br', '.br'], ['gzip', '.gz']].filter(([enc]) => new RegExp(`\\b${enc}\\b`).test(accept));
  if (identity) variants.push([null, '']);
  for (const [enc, ext] of variants) {
    let st;
    try { st = fs.statSync(file + ext); } catch { continue; }
    if (!st.isFile()) continue;
    const etag = `W/"${st.size.toString(16)}-${st.mtimeMs.toString(16)}-${enc || 'id'}-${tag}"`;
    res.setHeader('Content-Type', type);
    if (enc) res.setHeader('Content-Encoding', enc);
    res.setHeader('ETag', etag);
    res.setHeader('Last-Modified', st.mtime.toUTCString());
    if (req.headers['if-none-match'] === etag) { res.statusCode = 304; res.end(); return true; }
    res.statusCode = 200;
    res.setHeader('Content-Length', st.size);
    if (req.method === 'HEAD') { res.end(); return true; }
    fs.createReadStream(file + ext).on('error', () => res.destroy()).pipe(res);
    return true;
  }
  return false;
}

function servePrecompressed(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  const urlPath = (req.url || '/').split('?')[0].split('#')[0];
  const file = fileFor(urlPath);
  if (!file) return false;
  const ext = path.extname(file);

  if (ext === '.md') {
    res.setHeader('Vary', 'Accept, Accept-Encoding');
    return serveFile(req, res, file, { identity: true });
  }
  if (ext === '.html' && !path.extname(urlPath)) {
    // A page: both representations vary on Accept; the HTML one links to the Markdown twin.
    const md = markdownFor(urlPath);
    res.setHeader('Vary', 'Accept, Accept-Encoding');
    res.setHeader('Link', [`</llms.txt>; rel="describedby"; type="text/plain"`, ...(md ? [`<${mdUrl(urlPath)}>; rel="alternate"; type="text/markdown"`] : [])].join(', '));
    if (md && prefersMarkdown(req.headers.accept)) {
      res.removeHeader('Link');
      res.setHeader('Content-Location', mdUrl(urlPath));
      return serveFile(req, res, md, { identity: true });
    }
  } else {
    res.setHeader('Vary', 'Accept-Encoding');
  }
  return serveFile(req, res, file);
}

const CANONICAL_HOST = 'kinematicstech.ca';

export function harden(listener) {
  return (req, res) => {
    // www → apex (canonical URLs use the apex)
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim().toLowerCase();
    if (host === `www.${CANONICAL_HOST}`) {
      res.writeHead(301, { Location: `https://${CANONICAL_HOST}${req.url || '/'}`, 'Cache-Control': 'public, max-age=86400' });
      return res.end();
    }
    for (const [k, v] of Object.entries(SECURITY)) res.setHeader(k, v);
    const urlPath = (req.url || '/').split('?')[0];
    res.setHeader('Cache-Control', cacheControl(urlPath));
    if (servePrecompressed(req, res)) return;
    return listener(req, res);
  };
}

const original = http.createServer;
http.createServer = function createServer(...args) {
  const i = args.findIndex((a) => typeof a === 'function');
  if (i !== -1) args[i] = harden(args[i]);
  return original.apply(this, args);
};
