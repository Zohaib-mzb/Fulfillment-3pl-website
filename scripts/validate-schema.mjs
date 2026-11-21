#!/usr/bin/env node
/**
 * Validates every JSON-LD node in the build against the official schema.org vocabulary:
 *  - every @type exists
 *  - every property exists and its domain includes the node's type (or a supertype)
 *  - nested objects are validated too
 *  - Google rich-result required fields for the types we use
 * Vocabulary: download once with
 *   curl -o .cache/schemaorg.jsonld https://schema.org/version/latest/schemaorg-current-https.jsonld
 * Usage: node scripts/validate-schema.mjs [path-to-vocab]   (exits 1 on errors)
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const vocabPath = process.argv[2] || '.cache/schemaorg.jsonld';
const vocab = JSON.parse(await readFile(vocabPath, 'utf8'))['@graph'];
const name = (id) => String(id).replace(/^schema:/, '');
const classes = new Map(); // class → Set(parents)
const props = new Map(); // prop → Set(domain classes)
for (const n of vocab) {
  const types = [].concat(n['@type']);
  if (types.includes('rdfs:Class')) classes.set(name(n['@id']), new Set([].concat(n['rdfs:subClassOf'] || []).map((x) => name(x['@id']))));
  if (types.includes('rdf:Property')) props.set(name(n['@id']), new Set([].concat(n['schema:domainIncludes'] || []).map((x) => name(x['@id']))));
}
const ancestors = (c, acc = new Set()) => { if (acc.has(c)) return acc; acc.add(c); for (const p of classes.get(c) || []) ancestors(p, acc); return acc; };

const REQUIRED = {
  Organization: ['name', 'url', 'logo'],
  LocalBusiness: ['name', 'address'],
  Service: ['name', 'provider'],
  FAQPage: ['mainEntity'],
  Question: ['name', 'acceptedAnswer'],
  Answer: ['text'],
  BlogPosting: ['headline', 'image', 'datePublished', 'author'],
  JobPosting: ['title', 'description', 'datePosted', 'hiringOrganization', 'jobLocation'],
  BreadcrumbList: ['itemListElement'],
  ListItem: ['position'],
};

const dist = existsSync('dist/client') ? 'dist/client' : 'dist';
async function walk(d) { const o = []; for (const e of await readdir(d)) { const p = path.join(d, e); if ((await stat(p)).isDirectory()) o.push(...await walk(p)); else if (p.endsWith('.html')) o.push(p); } return o; }

const errors = new Set();
const counts = {};
function check(node, where) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return;
  const t = node['@type'];
  if (!t) return; // plain value objects
  for (const type of [].concat(t)) {
    if (!classes.has(type)) { errors.add(`${where}: unknown type ${type}`); continue; }
    counts[type] = (counts[type] || 0) + 1;
    const anc = ancestors(type);
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('@')) continue;
      if (!props.has(k)) { errors.add(`${where}: ${type}.${k} is not a schema.org property`); continue; }
      const dom = props.get(k);
      if (![...dom].some((d) => anc.has(d))) errors.add(`${where}: ${k} is not valid on ${type}`);
      for (const child of [].concat(v)) check(child, where);
    }
    for (const r of REQUIRED[type] || []) if (node[r] === undefined || node[r] === '') errors.add(`${where}: ${type} missing required ${r}`);
  }
}

const files = await walk(dist);
for (const f of files) {
  const html = await readFile(f, 'utf8');
  const where = '/' + path.relative(dist, f).replace(/index\.html$/, '');
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const json = JSON.parse(m[1]);
    for (const n of json['@graph'] ?? [json]) check(n, where);
  }
}
console.log(`schema.org vocabulary: ${classes.size} types, ${props.size} properties. Validated nodes:`, Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}×${v}`).join(', '));
if (errors.size) { console.log(`\n${errors.size} error(s):\n  ` + [...errors].slice(0, 60).join('\n  ')); process.exit(1); }
console.log('\nNo errors: every type and property is valid schema.org and required fields are present.');
