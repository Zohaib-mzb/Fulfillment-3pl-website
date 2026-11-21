#!/usr/bin/env node
/**
 * Subsets the brand fonts to the characters the site actually uses (Basic Latin, Latin-1,
 * typographic quotes, dashes, bullet, ellipsis, arrow). Kerning and other OpenType layout
 * features are kept, so rendering is identical. Anything outside this range falls back to
 * the full @fontsource latin files via unicode-range (see src/styles/fonts.css).
 * Run after changing font weights:  node scripts/subset-fonts.mjs
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import subsetFont from 'subset-font';

const ranges = [[0x20, 0x7e], [0xa0, 0xff], [0x2013, 0x2014], [0x2018, 0x201d], [0x2022, 0x2022], [0x2026, 0x2026], [0x2192, 0x2192]];
const text = ranges.flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => String.fromCodePoint(a + i))).join('');
const FONTS = [
  ['space-grotesk', 'space-grotesk-latin-600-normal'], ['space-grotesk', 'space-grotesk-latin-700-normal'],
  ['inter', 'inter-latin-400-normal'], ['inter', 'inter-latin-500-normal'], ['inter', 'inter-latin-600-normal'],
];
await mkdir('src/assets/fonts', { recursive: true });
for (const [pkg, name] of FONTS) {
  const src = await readFile(`node_modules/@fontsource/${pkg}/files/${name}.woff2`);
  const out = await subsetFont(src, text, { targetFormat: 'woff2' });
  await writeFile(`src/assets/fonts/${name}-core.woff2`, out);
  console.log(`${name}: ${src.length} → ${out.length} bytes`);
}
