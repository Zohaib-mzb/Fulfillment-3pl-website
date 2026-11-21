#!/usr/bin/env node
/**
 * Generates brand assets into /public (runs automatically before `astro build`):
 *  - favicon.svg, favicon.ico (32), apple-touch-icon.png (180), icon-192.png, icon-512.png, icon-maskable-512.png
 *  - site.webmanifest
 *  - og/default.png (1200×630) and og/blog/<slug>.png for every blog post
 * Uses satori (layout + text) and resvg (rasterise). Fonts come from @fontsource.
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { SCENES, svgDoc } from '../src/components/illustrations/art.ts';

/** Blog cover art: on brand scene per post (also embedded in the post's OG image). */
const COVER_SCENES = {
  'how-to-choose-a-3pl-in-toronto': 'store',
  'next-day-delivery-in-the-gta': 'drive',
  'canada-post-alternatives-for-shopify-brands': 'sort',
  'returns-that-dont-hurt-margins': 'return',
  'ev-delivery-fleets-explained': 'hero',
  'shopify-fulfillment-in-canada': 'pack',
  'small-business-warehousing-toronto': 'store',
  'best-shopify-fulfillment-company-canada': 'deliver',
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = (...p) => path.join(root, 'public', ...p);
const font = (pkg, file) => readFile(path.join(root, 'node_modules', '@fontsource', pkg, 'files', file));

const NAVY = '#0E1B2C', TEAL = '#12B5A6', ORANGE = '#FF6A3D', WHITE = '#FFFFFF', CLOUD = '#F4F6F8';

const markInner = (rx = 14) => `
  <rect width="64" height="64" rx="${rx}" fill="${NAVY}"/>
  <line x1="6" y1="24" x2="15" y2="24" stroke="${TEAL}" stroke-width="3" stroke-linecap="round"/>
  <line x1="3" y1="32" x2="15" y2="32" stroke="${TEAL}" stroke-width="3" stroke-linecap="round"/>
  <line x1="8" y1="40" x2="15" y2="40" stroke="${TEAL}" stroke-width="3" stroke-linecap="round"/>
  <rect x="20" y="13" width="8" height="38" rx="2" fill="${WHITE}"/>
  <path d="M24 38 L44 18" stroke="${WHITE}" stroke-width="8"/>
  <path d="M37 14 L50 12 L48 25 Z" fill="${WHITE}"/>
  <path d="M31 27 L49 51" stroke="${WHITE}" stroke-width="8"/>`;

const markReversed = () => `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">${markInner(14).replace(/fill="#FFFFFF"/g,'fill="#0E1B2C"').replace(/stroke="#FFFFFF"/g,'stroke="#0E1B2C"').replace('rx="14" fill="#0E1B2C"','rx="14" fill="#FFFFFF"')}</svg>`;
const markSvg = (rx = 14) => `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kinematics">${markInner(rx)}</svg>`;
// Maskable icon: full-bleed navy with the mark inside the 80% safe zone.
const maskableSvg = `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" fill="${NAVY}"/><g transform="translate(8 8)">${markInner(0)}</g></svg>`;

const png = (svg, width) => new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();

/** Minimal ICO container wrapping a single PNG. */
function ico(pngBuf, size) {
  const header = Buffer.alloc(6); header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
  const dir = Buffer.alloc(16);
  dir.writeUInt8(size >= 256 ? 0 : size, 0); dir.writeUInt8(size >= 256 ? 0 : size, 1);
  dir.writeUInt8(0, 2); dir.writeUInt8(0, 3); dir.writeUInt16LE(1, 4); dir.writeUInt16LE(32, 6);
  dir.writeUInt32LE(pngBuf.length, 8); dir.writeUInt32LE(22, 12);
  return Buffer.concat([header, dir, pngBuf]);
}

const dataUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

/** Signature motif: dotted teal route from a parcel to a house with an orange delivered dot. */
const routeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 300">
  <path d="M70 230 C 170 230, 170 90, 270 110 S 380 210, 450 120" fill="none" stroke="${TEAL}" stroke-width="7" stroke-linecap="round" stroke-dasharray="0 20"/>
  <g transform="translate(26 196)"><rect width="78" height="64" rx="8" fill="${CLOUD}"/><rect width="78" height="18" rx="6" fill="#D9DEE4"/><rect x="33" width="12" height="64" fill="${TEAL}"/></g>
  <g transform="translate(405 40)"><path d="M10 50 L50 14 L90 50 V108 H10 Z" fill="${WHITE}"/><path d="M0 54 L50 8 L100 54" fill="none" stroke="${TEAL}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><rect x="40" y="70" width="22" height="38" rx="3" fill="${NAVY}" opacity=".85"/></g>
  <circle cx="450" cy="168" r="14" fill="${ORANGE}"/>
</svg>`;

async function ogCard({ title, kicker, fonts, art }) {
  const node = {
    type: 'div',
    props: {
      style: { width: 1200, height: 630, display: 'flex', background: NAVY, color: WHITE, fontFamily: 'Inter', position: 'relative' },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px', width: art ? 720 : 1200, height: 630 },
            children: [
              { type: 'div', props: { style: { display: 'flex', alignItems: 'center', gap: 18 }, children: [
                { type: 'img', props: { src: dataUri(markReversed()), width: 64, height: 64 } },
                { type: 'div', props: { style: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 40, letterSpacing: -1 }, children: 'Kinematics' } },
              ] } },
              { type: 'div', props: { style: { display: 'flex', flexDirection: 'column', gap: 18 }, children: [
                kicker ? { type: 'div', props: { style: { color: TEAL, fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 24, letterSpacing: 3, textTransform: 'uppercase' }, children: kicker } } : null,
                { type: 'div', props: { style: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: title.length > 48 ? 54 : 72, lineHeight: 1.05, letterSpacing: -2 }, children: title } },
              ].filter(Boolean) } },
              { type: 'div', props: { style: { display: 'flex', alignItems: 'center', gap: 14, fontSize: 24, color: '#C9D2DC' }, children: [
                { type: 'div', props: { style: { width: 14, height: 14, borderRadius: 7, background: ORANGE } } },
                'kinematicstech.ca · 3PL, fulfillment and same day delivery across the GTA',
              ] } },
            ],
          },
        },
        art ? { type: 'img', props: { src: dataUri(art), width: 520, height: 300, style: { position: 'absolute', right: 36, top: 44 } } } : null,
      ].filter(Boolean),
    },
  };
  const svg = await satori(node, { width: 1200, height: 630, fonts });
  return png(svg, 1200);
}

function frontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].replace(/^['"]|['"]$/g, '');
  }
  return out;
}

async function main() {
  await mkdir(pub('og', 'blog'), { recursive: true });
  const fonts = [
    { name: 'Space Grotesk', data: await font('space-grotesk', 'space-grotesk-latin-700-normal.woff'), weight: 700, style: 'normal' },
    { name: 'Space Grotesk', data: await font('space-grotesk', 'space-grotesk-latin-600-normal.woff'), weight: 600, style: 'normal' },
    { name: 'Inter', data: await font('inter', 'inter-latin-400-normal.woff'), weight: 400, style: 'normal' },
  ];

  await writeFile(pub('favicon.svg'), markSvg());
  const p32 = png(markSvg(), 32);
  await writeFile(pub('favicon.ico'), ico(p32, 32));
  await writeFile(pub('favicon-32.png'), p32);
  await writeFile(pub('apple-touch-icon.png'), png(markSvg(0), 180));
  await writeFile(pub('icon-192.png'), png(markSvg(), 192));
  await writeFile(pub('icon-512.png'), png(markSvg(), 512));
  await writeFile(pub('icon-maskable-512.png'), png(maskableSvg, 512));
  await writeFile(
    pub('site.webmanifest'),
    JSON.stringify({
      name: 'Kinematics', short_name: 'Kinematics', description: 'Commerce in motion. 3PL, fulfillment and same day final mile delivery across the GTA.',
      start_url: '/', display: 'standalone', background_color: CLOUD, theme_color: NAVY, lang: 'en-CA',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    }, null, 2),
  );

  await writeFile(pub('og', 'default.png'), await ogCard({ title: 'Commerce in motion.', kicker: '3PL + same day delivery', fonts, art: routeSvg }));

  const blogDir = path.join(root, 'src', 'content', 'blog');
  await mkdir(path.join(blogDir, 'covers'), { recursive: true });
  for (const [slug, scene] of Object.entries(COVER_SCENES)) {
    await writeFile(path.join(blogDir, 'covers', `${slug}.svg`), svgDoc(SCENES[scene]()));
  }
  if (existsSync(blogDir)) {
    for (const f of (await readdir(blogDir)).filter((f) => /\.mdx?$/.test(f))) {
      const fm = frontmatter(await readFile(path.join(blogDir, f), 'utf8'));
      if (!fm.title) continue;
      const slug = f.replace(/\.mdx?$/, '');
      await writeFile(pub('og', 'blog', `${slug}.png`), await ogCard({ title: fm.title, kicker: fm.category ? `Blog · ${fm.category}` : 'Kinematics blog', fonts }));
    }
  }
  console.log('[assets] favicons, manifest and OG images generated');
}

main().catch((e) => { console.error(e); process.exit(1); });
