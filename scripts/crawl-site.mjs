#!/usr/bin/env node
/**
 * Link crawler + technical SEO checks against a running preview (npm run preview).
 *  - crawls from "/" following every internal <a href>, checks every page AND asset returns 200
 *  - orphan pages: built pages that no other page links to
 *  - sitemap: every indexable page listed, no noindex pages listed, every listed URL returns 200
 *  - robots.txt: allows crawling, lists the sitemap, AI crawlers allowed
 *  - 404: unknown URLs return HTTP 404 with the branded page
 *  - Node server: trailing slash redirect, compression, security and cache headers
 * Usage: npm start (or npm run preview), then BASE=http://localhost:4321 node scripts/crawl-site.mjs   (exits 1 on errors)
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE || 'http://localhost:4321';
const SITE = 'https://kinematicstech.ca';
const dist = existsSync('dist/client') ? 'dist/client' : 'dist';
const errors = [];
const notes = [];

async function walk(d) {
  const out = [];
  for (const e of await readdir(d)) {
    const p = path.join(d, e);
    if ((await stat(p)).isDirectory()) out.push(...(await walk(p)));
    else if (p.endsWith('.html')) out.push(p);
  }
  return out;
}
const routeOf = (f) => ('/' + path.relative(dist, f).replace(/index\.html$/, '').replace(/\.html$/, '')).replace(/(.)\/$/, '$1');
const built = (await walk(dist)).map(routeOf).filter((r) => r !== '/404');
const noindex = new Set();
for (const r of built) {
  const file = r === '/' ? 'index.html' : `${r.slice(1)}.html`;
  const html = await readFile(path.join(dist, file), 'utf8').catch(() => readFile(path.join(dist, `${r.slice(1)}/index.html`), 'utf8').catch(() => ''));
  if (/<meta name="robots" content="noindex/.test(html)) noindex.add(r);
}

// ── crawl ──
const seen = new Map(); // url → status
const linkedFrom = new Map(); // page → Set(sources)
const assets = new Set();
const queue = ['/'];
while (queue.length) {
  const u = queue.shift();
  if (seen.has(u)) continue;
  const res = await fetch(BASE + u, { redirect: 'manual' });
  seen.set(u, res.status);
  if (res.status !== 200) { errors.push(`page ${u} → HTTP ${res.status}`); continue; }
  if (!(res.headers.get('content-type') || '').includes('text/html')) continue;
  const html = await res.text();
  for (const m of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
    let h = m[1].replace(/&amp;/g, '&');
    if (/^(mailto:|tel:|https?:|#)/.test(h)) {
      if (h.startsWith(SITE)) h = h.slice(SITE.length) || '/';
      else continue;
    }
    h = h.split('#')[0].split('?')[0];
    if (!h) continue;
    const target = h.replace(/(.)\/$/, '$1');
    if (/\.(xml|txt|png|svg|ico|webmanifest)$/.test(target)) { assets.add(target); continue; }
    if (!linkedFrom.has(target)) linkedFrom.set(target, new Set());
    if (target !== u) linkedFrom.get(target).add(u);
    if (!seen.has(target)) queue.push(target);
  }
  for (const m of html.matchAll(/(?:src|href|srcset|imagesrcset|poster|data-src)="([^"]+)"/g)) {
    for (const part of m[1].split(',')) {
      const a = part.trim().split(/\s+/)[0];
      if (a.startsWith('/') && !a.startsWith('//') && /\.(js|css|woff2?|avif|webp|png|jpe?g|svg|ico|mp4|webm|webmanifest|xml|txt)$/.test(a)) assets.add(a);
    }
  }
}
for (const a of assets) {
  const res = await fetch(BASE + a, { method: 'GET', headers: { Range: 'bytes=0-0' } });
  if (![200, 206].includes(res.status)) errors.push(`asset ${a} → HTTP ${res.status}`);
}

// ── orphans ──
const reachable = new Set([...seen.keys()]);
for (const r of built) {
  if (r.startsWith('/render')) { errors.push(`render page leaked into build: ${r}`); continue; }
  if (!reachable.has(r) && !noindex.has(r)) errors.push(`orphan (not linked from any page): ${r}`);
  else if (r !== '/' && !noindex.has(r) && (linkedFrom.get(r)?.size ?? 0) < 2) notes.push(`weakly linked (${linkedFrom.get(r)?.size ?? 0} source): ${r}`);
}

// ── sitemap ──
const smIndex = await (await fetch(`${BASE}/sitemap-index.xml`)).text();
const smFiles = [...smIndex.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, ''));
const inSitemap = new Set();
for (const f of smFiles) {
  const xml = await (await fetch(BASE + f)).text();
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) inSitemap.add(m[1].replace(SITE, '').replace(/(.)\/$/, '$1') || '/');
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const lm = m[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
    if (!lm || Number.isNaN(Date.parse(lm)) || !/^\d{4}-\d{2}-\d{2}/.test(lm)) errors.push(`sitemap URL without ISO 8601 lastmod: ${m[1].match(/<loc>([^<]+)/)?.[1]}`);
  }
}
for (const r of built) {
  if (noindex.has(r) && inSitemap.has(r)) errors.push(`noindex page in sitemap: ${r}`);
  if (!noindex.has(r) && !inSitemap.has(r) && !r.startsWith('/render')) errors.push(`missing from sitemap: ${r}`);
}
for (const u of inSitemap) if (!built.includes(u)) errors.push(`sitemap URL has no page: ${u}`);

// ── robots.txt ──
const robots = await (await fetch(`${BASE}/robots.txt`)).text();
if (!/User-agent: \*\nAllow: \//.test(robots)) errors.push('robots.txt does not allow all crawlers');
if (!robots.includes(`Sitemap: ${SITE}/sitemap-index.xml`)) errors.push('robots.txt missing sitemap');
if (!/User-agent: \*\n(?:(?:Allow|Disallow): [^\n]*\n)*Content-Signal: search=yes, ai-input=yes, ai-train=yes\n/.test(robots)) errors.push('robots.txt: Content-Signal missing from the User-agent: * group');
for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) if (!new RegExp(`User-agent: ${bot}\\nAllow: /`).test(robots)) errors.push(`robots.txt does not allow ${bot}`);

// ── 404 ──
const nf = await fetch(`${BASE}/this-page-does-not-exist`);
const nfHtml = await nf.text();
if (nf.status !== 404) errors.push(`unknown URL returned ${nf.status}, expected 404`);
if (!nfHtml.includes('missed the door')) errors.push('404 response is not the branded page');

// ── Node server (production: npm start) ──
// Trailing slash → canonical redirect, compression, security and cache headers.
{
  const slash = await fetch(`${BASE}/about/`, { redirect: 'manual' });
  if (![301, 308].includes(slash.status) || !/\/about$/.test(slash.headers.get('location') || '')) errors.push(`trailing slash: /about/ → ${slash.status} ${slash.headers.get('location')}`);
  const home = await fetch(`${BASE}/`, { headers: { 'Accept-Encoding': 'br, gzip' } });
  if (!/br|gzip/.test(home.headers.get('content-encoding') || '')) notes.push('home page is not compressed (expected with npm start; the plain preview server only gzips)');
  for (const h of ['strict-transport-security', 'x-content-type-options', 'referrer-policy', 'x-frame-options', 'permissions-policy']) if (!home.headers.get(h)) notes.push(`missing ${h} header (set by npm start, not by npm run preview)`);
  // Markdown for agents: every sitemap page has a .md twin; Accept negotiation; Vary and Link headers.
  const BROWSER = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';
  const llms = await (await fetch(`${BASE}/llms.txt`)).text();
  for (const u of inSitemap) {
    const md = u === '/' ? '/index.md' : `${u}.md`;
    const r = await fetch(BASE + md);
    const body = await r.text();
    if (r.status !== 200 || !/text\/markdown/.test(r.headers.get('content-type') || '') || /<script|<svg|<nav/i.test(body)) errors.push(`markdown: ${md} → ${r.status} ${r.headers.get('content-type')}`);
    if (!llms.includes(`${SITE}${md})`)) errors.push(`llms.txt does not list ${md}`);
    const html = await fetch(BASE + u, { headers: { Accept: BROWSER } });
    const page = await html.text();
    if (!/text\/html/.test(html.headers.get('content-type') || '')) errors.push(`browser Accept on ${u} did not get HTML`);
    if (!/\bAccept\b/.test(html.headers.get('vary') || '')) errors.push(`${u}: HTML response missing Vary: Accept`);
    if (html.headers.get('link') !== `</llms.txt>; rel="describedby"; type="text/plain", <${md}>; rel="alternate"; type="text/markdown"`) errors.push(`${u}: Link header is ${html.headers.get('link')}`);
    if (!page.includes(`<link rel="alternate" type="text/markdown" href="${md}">`)) errors.push(`${u}: head is missing the text/markdown alternate link`);
    const neg = await fetch(BASE + u, { headers: { Accept: 'text/markdown' } });
    if (!/text\/markdown/.test(neg.headers.get('content-type') || '') || !/\bAccept\b/.test(neg.headers.get('vary') || '')) errors.push(`${u}: Accept: text/markdown → ${neg.headers.get('content-type')}, Vary ${neg.headers.get('vary')}`);
    await neg.arrayBuffer();
  }
  const js = [...assets].find((a) => a.startsWith('/_astro/') && a.endsWith('.js'));
  if (js) { const r = await fetch(BASE + js); if (!/immutable/.test(r.headers.get('cache-control') || '')) errors.push('/_astro assets not immutable'); }
}

console.log(`Crawled ${seen.size} pages from "/", checked ${assets.size} assets; ${built.length} built pages, ${inSitemap.size} sitemap URLs, ${noindex.size} noindex pages (${[...noindex].join(', ')}).`);
if (notes.length) console.log(`\n${notes.length} note(s):\n  ` + notes.join('\n  '));
if (errors.length) { console.log(`\n${errors.length} error(s):\n  ` + errors.join('\n  ')); process.exit(1); }
console.log('\nNo errors.');
