#!/usr/bin/env node
/**
 * Local static preview of the production build (dist/) with the same clean-URL
 * and cache-header behaviour as vercel.json. Used by `npm run preview` and Lighthouse.
 * The /api routes are serverless on Vercel; locally they return 501 here — use `npm run dev` for forms.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createGzip } from 'node:zlib';
import { Readable } from 'node:stream';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
// With a server route (/api), Astro writes static files to dist/client.
const root = existsSync(path.join(distDir, 'client')) ? path.join(distDir, 'client') : distDir;
const port = Number(process.env.PORT || 4321);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.avif': 'image/avif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.webp': 'image/webp', '.jpg': 'image/jpeg',
};

async function resolve(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]).replace(/\/+$/, '') || '/';
  const candidates = clean === '/' ? ['index.html'] : [clean.slice(1), `${clean.slice(1)}.html`, `${clean.slice(1)}/index.html`];
  for (const c of candidates) {
    const f = path.join(root, c);
    if (!f.startsWith(root)) return null;
    if (existsSync(f) && (await stat(f)).isFile()) return f;
  }
  return null;
}

createServer(async (req, res) => {
  if (req.url.startsWith('/api/')) { res.writeHead(501); return res.end('API runs on Vercel / astro dev'); }
  let file = await resolve(req.url);
  let status = 200;
  if (!file) { file = path.join(root, '404.html'); status = 404; }
  const ext = path.extname(file);
  const headers = { 'Content-Type': TYPES[ext] || 'application/octet-stream' };
  headers['Cache-Control'] = req.url.startsWith('/_astro/') ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate';
  let body = await readFile(file);
  // Byte ranges (video seeking), like Vercel's CDN
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (range && /\.(mp4|webm)$/.test(file)) {
    const size = body.length;
    const start = range[1] ? Number(range[1]) : size - Number(range[2]);
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    res.writeHead(206, { ...headers, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
    return res.end(body.subarray(start, end + 1));
  }
  if (/\.(mp4|webm)$/.test(file)) headers['Accept-Ranges'] = 'bytes';
  const gzip = /gzip/.test(req.headers['accept-encoding'] || '') && /html|css|javascript|svg|xml|json|plain/.test(headers['Content-Type']);
  if (gzip) {
    headers['Content-Encoding'] = 'gzip';
    res.writeHead(status, headers);
    Readable.from(body).pipe(createGzip()).pipe(res);
  } else {
    res.writeHead(status, headers);
    res.end(body);
  }
}).listen(port, () => console.log(`Preview: http://localhost:${port}`));
