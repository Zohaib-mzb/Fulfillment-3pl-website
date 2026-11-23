#!/usr/bin/env node
/**
 * Post-build SEO / schema / link audit over every HTML page in the build output.
 * Checks: <title> ≤ 60, meta description ≤ 155, exactly one <h1>, heading order,
 * canonical + hreflang, img alt, broken internal links, JSON-LD parse + required fields.
 * Usage: npm run build && npm run audit   (exits 1 on errors)
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const root = existsSync(path.join(dist, 'client')) ? path.join(dist, 'client') : dist;

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir)) {
    const p = path.join(dir, e);
    if ((await stat(p)).isDirectory()) out.push(...(await walk(p)));
    else if (p.endsWith('.html')) out.push(p);
  }
  return out;
}
const route = (f) => '/' + path.relative(root, f).replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '');
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const REQUIRED = {
  Organization: ['name', 'url', 'logo'],
  WebSite: ['name', 'url'],
  WebPage: ['name', 'url'],
  LocalBusiness: ['name', 'address', 'url'],
  Service: ['name', 'provider', 'areaServed'],
  BreadcrumbList: ['itemListElement'],
  FAQPage: ['mainEntity'],
  BlogPosting: ['headline', 'datePublished', 'author', 'image', 'publisher'],
  JobPosting: ['title', 'description', 'datePosted', 'hiringOrganization', 'jobLocation', 'employmentType'],
  HowTo: ['name', 'step'],
  ItemList: ['itemListElement'],
};

const files = await walk(root);
const pages = new Set(files.map(route).map((r) => r || '/'));
const staticFiles = new Set(['/rss.xml', '/llms.txt', '/robots.txt', '/sitemap-index.xml', '/favicon.ico', '/favicon.svg']);
const errors = [];
const warns = [];
const titles = new Map();
let schemaCount = 0;
const types = {};

for (const f of files) {
  const r = route(f) || '/';
  const html = await readFile(f, 'utf8');
  const err = (m) => errors.push(`${r}: ${m}`);
  const warn = (m) => warns.push(`${r}: ${m}`);
  const noindex = /<meta name="robots" content="noindex/.test(html);

  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');
  if (!title) err('missing <title>');
  else if (title.length > 60) err(`title ${title.length} chars: "${title}"`);
  if (!noindex) {
    if (titles.has(title)) err(`duplicate title with ${titles.get(title)}`);
    titles.set(title, r);
  }
  const desc = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '');
  if (!desc) err('missing meta description');
  else if (desc.length > 155) err(`description ${desc.length} chars`);

  const h1s = html.match(/<h1[\s>]/g) ?? [];
  if (h1s.length !== 1) err(`${h1s.length} <h1> elements`);
  const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => +m[1]);
  levels.forEach((l, i) => { if (i && l > levels[i - 1] + 1) warn(`heading jumps h${levels[i - 1]} → h${l}`); });

  if (!/<link rel="canonical" href="https:\/\/kinematicstech\.ca[^"]*"/.test(html)) err('missing canonical');
  if (!/hreflang="en-CA"/.test(html)) err('missing hreflang en-CA');
  if (!/<html lang="en-CA"/.test(html)) err('html lang is not en-CA');

  for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\salt(="|[\s>])/.test(m[0])) err(`img without alt: ${m[0].slice(0, 80)}`);

  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const href = m[1].replace(/\/$/, '') || '/';
    if (href.startsWith('/_astro') || href.startsWith('/og/') || staticFiles.has(href) || /\.(png|svg|ico|xml|txt|webmanifest|woff2?)$/.test(href)) continue;
    if (href.endsWith(".md")) { if (!existsSync(path.join(root, href.slice(1)))) err(`missing markdown twin → ${href}`); continue; }
    if (!pages.has(href)) err(`broken internal link → ${href}`);
  }

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let json;
    try { json = JSON.parse(m[1]); } catch (e) { err(`invalid JSON-LD: ${e.message}`); continue; }
    if (json['@context'] !== 'https://schema.org') err('JSON-LD @context is not https://schema.org');
    for (const node of json['@graph'] ?? [json]) {
      schemaCount++;
      const t = node['@type'];
      types[t] = (types[t] ?? 0) + 1;
      for (const k of REQUIRED[t] ?? []) if (node[k] === undefined || node[k] === '' || (Array.isArray(node[k]) && !node[k].length)) err(`${t} missing "${k}"`);
      if (t === 'BreadcrumbList') node.itemListElement.forEach((li, i) => { if (li.position !== i + 1 || !/^https:\/\//.test(li.item)) err('BreadcrumbList item malformed'); });
      if (t === 'FAQPage') node.mainEntity.forEach((q) => { if (q['@type'] !== 'Question' || !q.name || !q.acceptedAnswer?.text) err('FAQPage question malformed'); });
      if (t === 'JobPosting' && !node.jobLocation?.address?.addressCountry) err('JobPosting jobLocation.address incomplete');
      if (JSON.stringify(node).match(/\[[^\]"]*XXX[^\]"]*\]/)) err(`${t} contains a placeholder value`);
    }
  }
  if (!noindex && !/"@type":"BreadcrumbList"/.test(html) && r !== '/') warn('no BreadcrumbList');
}

// Answer-first check (AEO): service and city pages must open with a 40–60 word answer.
for (const r of [...pages].filter((p) => /^\/(services|service-areas)\/[^/]+$/.test(p))) {
  const html = await readFile(path.join(root, r.slice(1), 'index.html'), 'utf8').catch(() => readFile(path.join(root, `${r.slice(1)}.html`), 'utf8'));
  const ans = decode(html.match(/<p[^>]*data-answer[^>]*>([^<]*)<\/p>/)?.[1] ?? '');
  const n = ans.split(/\s+/).filter(Boolean).length;
  if (n < 40 || n > 60) errors.push(`${r}: answer paragraph is ${n} words (want 40–60)`);
}

console.log(`Audited ${files.length} pages, ${schemaCount} JSON-LD nodes:`, Object.entries(types).map(([k, v]) => `${k}×${v}`).join(', '));
if (warns.length) console.log(`\n${warns.length} warning(s):\n  ` + warns.join('\n  '));
if (errors.length) { console.log(`\n${errors.length} error(s):\n  ` + errors.join('\n  ')); process.exit(1); }
console.log('\nNo errors.');
