/**
 * Markdown for agents. After the build, every indexable page (no noindex) gets a clean Markdown
 * twin next to its HTML file: index.html → index.md, services/fulfillment.html → services/fulfillment.md.
 * Only the <main> content is converted: headings, text, lists, tables, links and FAQs. Scripts,
 * nav chrome, decorative and aria-hidden markup, animation layers, SVG and form controls are dropped.
 * server-hardening.mjs serves the .md files and negotiates them on Accept: text/markdown.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import TurndownService from 'turndown';
import { tables, strikethrough } from 'turndown-plugin-gfm';

async function walk(d) {
  const out = [];
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;/g, ' ');
const meta = (html, re) => decode(html.match(re)?.[1] ?? '').trim();
const yaml = (s) => JSON.stringify(s);

/** Drop everything that is not readable content. */
const DROP = [
  'script', 'style', 'noscript', 'template', 'svg', 'canvas', 'video', 'audio', 'iframe', 'astro-island',
  'button', 'input', 'select', 'textarea', 'label', 'nav', '[aria-hidden="true"]', '[hidden]', '.hidden', '[data-form-success]', '[data-form-error]',
];

function makeTurndown(site) {
  const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced', emDelimiter: '*' });
  td.use([tables, strikethrough]);
  // FAQ accordions: the question becomes a heading, the answer follows.
  td.addRule('summary', { filter: 'summary', replacement: (c) => `\n\n### ${c.trim()}\n\n` });
  td.addRule('details', { filter: 'details', replacement: (c) => `\n\n${c.trim()}\n\n` });
  // A form becomes a pointer to the page, since agents cannot submit Markdown.
  td.addRule('form', {
    filter: 'form',
    replacement: (_c, node) => {
      const name = node.getAttribute('toolname');
      return `\n\n*This page has a form${name ? ` (\`${name}\`)` : ''}. Open the HTML page to use it.*\n\n`;
    },
  });
  // Images: keep meaningful ones (with alt text), drop decorative ones.
  td.addRule('img', {
    filter: 'img',
    replacement: (_c, node) => {
      const alt = (node.getAttribute('alt') || '').trim();
      const src = node.getAttribute('src');
      return alt && src ? `![${alt}](${new URL(src, site).href})` : '';
    },
  });
  // Links: absolute URLs. Card links that wrap headings and paragraphs keep their content and add a link line.
  td.addRule('link', {
    filter: (node) => node.nodeName === 'A' && node.getAttribute('href'),
    replacement: (content, node) => {
      const href = node.getAttribute('href');
      if (href.startsWith('#')) return content;
      const url = /^(mailto|tel):/.test(href) ? href : new URL(href, site).href;
      const text = content.replace(/\(opens in a new tab\)/g, '').trim();
      if (!text) return '';
      if (/\n/.test(text)) {
        const label = (node.querySelector('h2,h3,h4')?.textContent || 'Read more').replace(/\s+/g, ' ').trim();
        return `\n\n${text}\n\n[${label}](${url})\n\n`;
      }
      return `[${text.replace(/\s+/g, ' ')}](${url})`;
    },
  });
  return td;
}

function toMarkdown(html, td, site, urlPath) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
  if (!main) return null;
  const title = meta(html, /<title>([^<]*)<\/title>/);
  const description = meta(html, /<meta name="description" content="([^"]*)"/);
  const canonical = meta(html, /<link rel="canonical" href="([^"]*)"/) || new URL(urlPath, site).href;
  return { title, description, canonical, main };
}

/** Remove non content nodes from a DOM tree. */
function prune(root) {
  for (const sel of DROP) for (const el of Array.from(root.querySelectorAll(sel))) el.remove();
  for (const el of Array.from(root.querySelectorAll('.sr-only'))) if (/opens in a new tab/.test(el.textContent)) el.remove();
  // Sibling elements written with no whitespace between them (<span>01</span><span>Store</span>)
  // render apart in the browser through layout; give them a space so their words do not merge.
  for (const el of Array.from(root.querySelectorAll('*'))) {
    const next = el.nextSibling;
    if (next && next.nodeType === 1) el.parentNode.insertBefore(el.ownerDocument.createTextNode(' '), next);
  }
  return root;
}

export async function generateMarkdown({ clientDir, site, logger }) {
  const { parseHTML } = await loadDom();
  const td = makeTurndown(site);
  const pages = [];
  for (const file of await walk(clientDir)) {
    if (!file.endsWith('.html')) continue;
    const html = await readFile(file, 'utf8');
    if (/<meta name="robots" content="noindex/.test(html)) continue;
    const rel = path.relative(clientDir, file).split(path.sep).join('/');
    const urlPath = rel === 'index.html' ? '/' : `/${rel.replace(/\.html$/, '')}`;
    const info = toMarkdown(html, td, site, urlPath);
    if (!info) continue;
    const root = parseHTML(`<!doctype html><html><body><main>${info.main}</main></body></html>`).querySelector('main');
    prune(root);
    let body = td.turndown(root.innerHTML);
    body = body.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
    const md = `---\ntitle: ${yaml(info.title)}\ndescription: ${yaml(info.description)}\nurl: ${info.canonical}\n---\n\n${body}\n`;
    const mdRel = rel.replace(/\.html$/, '.md');
    await writeFile(path.join(clientDir, mdRel), md);
    pages.push({ urlPath, md: `/${mdRel}`, title: info.title });
  }
  pages.sort((a, b) => a.urlPath.localeCompare(b.urlPath));
  logger?.info(`markdown: wrote ${pages.length} .md pages`);
  return pages;
}

/** domino is the DOM implementation turndown uses in Node; parse with it so we can prune first. */
async function loadDom() {
  const domino = (await import('@mixmark-io/domino')).default;
  return { parseHTML: (html) => domino.createDocument(html) };
}
