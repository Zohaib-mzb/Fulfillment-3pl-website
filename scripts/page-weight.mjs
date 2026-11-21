#!/usr/bin/env node
/**
 * Per-page asset weight from the build output (gzip -9 sizes).
 * - initial JS: <script src>, modulepreload, and astro-island component/renderer URLs, following static imports
 * - lazy JS: chunks reachable only through dynamic import() from those (e.g. the 3D scene)
 * - CSS, inline SVG, and media referenced (<img>, <video>/<source>, poster)
 * Usage: node scripts/page-weight.mjs [--json out.json] [/path ...]
 */
import { readFile, readdir, stat, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const root = existsSync(path.join(dist, 'client')) ? path.join(dist, 'client') : dist;
const args = process.argv.slice(2);
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const wanted = args.filter((a, i) => a.startsWith('/') && args[i - 1] !== '--json');

const gz = new Map();
async function size(url) {
  const f = path.join(root, url.replace(/^\//, '').split('?')[0]);
  if (!existsSync(f)) return { raw: 0, gz: 0 };
  if (!gz.has(f)) { const b = await readFile(f); gz.set(f, { raw: b.length, gz: /\.(mp4|webm|png|jpe?g|avif|webp|woff2?)$/.test(f) ? b.length : gzipSync(b, { level: 9 }).length }); }
  return gz.get(f);
}
async function graph(entry, seen, lazy) {
  if (seen.has(entry)) return;
  seen.add(entry);
  const f = path.join(root, entry.replace(/^\//, ''));
  if (!existsSync(f)) return;
  const src = await readFile(f, 'utf8');
  const dir = path.posix.dirname(entry);
  for (const m of src.matchAll(/(?:import|export)\s*(?:[^'"`;()]*?from\s*)?["'`](\.{1,2}\/[^"'`]+\.js)["'`]/g)) await graph(path.posix.join(dir, m[1]), seen, lazy);
  for (const m of src.matchAll(/import\(\s*["'`](\.{1,2}\/[^"'`]+\.js)["'`]\s*\)/g)) lazy.add(path.posix.join(dir, m[1]));
}

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir)) {
    const p = path.join(dir, e);
    if ((await stat(p)).isDirectory()) out.push(...(await walk(p)));
    else if (p.endsWith('.html')) out.push(p);
  }
  return out;
}

const files = await walk(root);
const rows = [];
for (const f of files) {
  const route = ('/' + path.relative(root, f).replace(/index\.html$/, '').replace(/\.html$/, '')).replace(/(.)\/$/, '$1');
  if (wanted.length && !wanted.includes(route)) continue;
  const html = await readFile(f, 'utf8');
  const entries = new Set();
  for (const m of html.matchAll(/<script[^>]*\bsrc="(\/_astro\/[^"]+\.js)"/g)) entries.add(m[1]);
  for (const m of html.matchAll(/<link[^>]*rel="modulepreload"[^>]*href="(\/_astro\/[^"]+\.js)"/g)) entries.add(m[1]);
  for (const m of html.matchAll(/(?:component-url|renderer-url)="(\/_astro\/[^"]+\.js)"/g)) entries.add(m[1]);
  for (const m of html.matchAll(/import\(["'](\/_astro\/[^"']+\.js)["']\)|from\s*["'](\/_astro\/[^"']+\.js)["']/g)) entries.add(m[1] || m[2]);
  const seen = new Set(), lazy = new Set();
  for (const e of entries) await graph(e, seen, lazy);
  const lazySeen = new Set(), lazy2 = new Set();
  for (const l of lazy) if (!seen.has(l)) await graph(l, lazySeen, lazy2);
  for (const s of seen) lazySeen.delete(s);
  let js = 0, lazyJs = 0, css = 0, media = 0;
  for (const s of seen) js += (await size(s)).gz;
  for (const s of lazySeen) lazyJs += (await size(s)).gz;
  for (const m of html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="(\/_astro\/[^"]+\.css)"/g)) css += (await size(m[1])).gz;
  const inlineCss = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].reduce((n, m) => n + gzipSync(m[1]).length, 0);
  const inlineJs = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].reduce((n, m) => n + gzipSync(m[1]).length, 0);
  const mediaUrls = new Set([...html.matchAll(/(?:<img[^>]*\bsrc|<source[^>]*\bsrc|<video[^>]*\bposter|<video[^>]*\bsrc)="(\/[^"]+)"/g)].map((m) => m[1]));
  for (const u of mediaUrls) media += (await size(u)).raw;
  rows.push({
    route,
    htmlKB: +(gzipSync(html).length / 1024).toFixed(1),
    initialJsKB: +((js + inlineJs) / 1024).toFixed(1),
    lazyJsKB: +(lazyJs / 1024).toFixed(1),
    cssKB: +((css + inlineCss) / 1024).toFixed(1),
    mediaKB: +(media / 1024).toFixed(1),
  });
}
rows.sort((a, b) => a.route.localeCompare(b.route));
console.table(rows);
if (jsonOut) { await mkdir(path.dirname(jsonOut), { recursive: true }); await writeFile(jsonOut, JSON.stringify(rows, null, 2)); }
