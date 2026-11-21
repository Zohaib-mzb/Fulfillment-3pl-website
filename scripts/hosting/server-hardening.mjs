/**
 * Loaded first by dist/server/entry.mjs (see scripts/hosting/integration.mjs).
 * The @astrojs/node standalone server serves static files uncompressed and only sets
 * cache headers on /_astro. This wraps its HTTP listener to add, for every response:
 *  - security headers (the ones vercel.json used to set)
 *  - cache rules per path
 *  - a 301 from www.kinematicstech.ca to the apex
 *  - precompressed Brotli or gzip variants (*.br / *.gz written at build time) for static text files
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

function servePrecompressed(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  const accept = String(req.headers['accept-encoding'] || '');
  const urlPath = (req.url || '/').split('?')[0].split('#')[0];
  const file = fileFor(urlPath);
  if (!file) return false;
  const type = TYPES[path.extname(file)];
  if (!type) return false;
  for (const [enc, ext] of [['br', '.br'], ['gzip', '.gz']]) {
    if (!new RegExp(`\\b${enc}\\b`).test(accept)) continue;
    let st;
    try { st = fs.statSync(file + ext); } catch { continue; }
    if (!st.isFile()) continue;
    const etag = `W/"${st.size.toString(16)}-${st.mtimeMs.toString(16)}-${enc}"`;
    res.setHeader('Content-Type', type);
    res.setHeader('Content-Encoding', enc);
    res.setHeader('Vary', 'Accept-Encoding');
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
