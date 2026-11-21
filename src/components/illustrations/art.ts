/**
 * On-brand SVG illustration kit (string builders, no dependencies).
 * Used by: <Art> (inline SVG), the scroll-story static fallback frames,
 * and scripts/generate-assets.mjs (blog covers). Plain TS only — Node runs
 * this file directly with type stripping, so no enums / namespaces / path aliases.
 * Palette is limited to the brand colours and their tints.
 */

export const C = {
  navy: '#0E1B2C',
  navy7: '#22344C',
  navy6: '#33465F',
  teal: '#12B5A6',
  tealInk: '#12806F',
  tealSoft: '#DDF4F1',
  teal50: '#EEF9F8',
  orange: '#FF6A3D',
  cloud: '#F4F6F8',
  line: '#D9DEE4',
  edge: '#C5CDD6',
  slate: '#5A6675',
  white: '#FFFFFF',
};

const W = 480;
const H = 360;
export const VIEWBOX = `0 0 ${W} ${H}`;

const r = (n: number) => Math.round(n * 10) / 10;

export function backdrop(tone: 'teal' | 'cloud' | 'none' = 'teal') {
  if (tone === 'none') return '';
  const bg = tone === 'teal' ? C.teal50 : C.cloud;
  return `<rect width="${W}" height="${H}" rx="28" fill="${bg}"/><circle cx="240" cy="190" r="150" fill="${C.white}" opacity=".75"/>`;
}

export function shadow(cx: number, cy: number, rx: number, ry = rx * 0.18, o = 0.12) {
  return `<ellipse cx="${r(cx)}" cy="${r(cy)}" rx="${r(rx)}" ry="${r(ry)}" fill="${C.navy}" opacity="${o}"/>`;
}

/** 2.5D parcel. (x, y) = top-left of the front face. */
export function parcel(x: number, y: number, w = 40, h = 32, opts: { label?: boolean; rotate?: number; shadow?: boolean } = {}) {
  const d = w * 0.24;
  const dy = d * 0.55;
  const tw = Math.max(4, w * 0.16);
  const tx = x + w / 2 - tw / 2;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const g = [
    opts.shadow === false ? '' : shadow(x + w / 2 + d / 2, y + h + 2, w * 0.62, w * 0.1, 0.1),
    `<polygon points="${r(x)},${r(y)} ${r(x + d)},${r(y - dy)} ${r(x + w + d)},${r(y - dy)} ${r(x + w)},${r(y)}" fill="${C.white}" stroke="${C.edge}" stroke-width="1" stroke-linejoin="round"/>`,
    `<polygon points="${r(x + w)},${r(y)} ${r(x + w + d)},${r(y - dy)} ${r(x + w + d)},${r(y + h - dy)} ${r(x + w)},${r(y + h)}" fill="${C.line}" stroke="${C.edge}" stroke-width="1" stroke-linejoin="round"/>`,
    `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" fill="${C.cloud}" stroke="${C.edge}" stroke-width="1"/>`,
    `<polygon points="${r(tx)},${r(y)} ${r(tx + d)},${r(y - dy)} ${r(tx + tw + d)},${r(y - dy)} ${r(tx + tw)},${r(y)}" fill="${C.teal}"/>`,
    `<rect x="${r(tx)}" y="${r(y)}" width="${r(tw)}" height="${r(h)}" fill="${C.teal}"/>`,
  ];
  if (opts.label) {
    const lw = w * 0.32;
    const lx = x + w * 0.08;
    const ly = y + h * 0.42;
    g.push(
      `<rect x="${r(lx)}" y="${r(ly)}" width="${r(lw)}" height="${r(h * 0.4)}" rx="1.5" fill="${C.white}" stroke="${C.edge}" stroke-width=".8"/>`,
      `<g fill="${C.navy}">${[0, 2, 3, 5, 7, 8].map((i) => `<rect x="${r(lx + 2 + i * (lw - 4) / 10)}" y="${r(ly + 2)}" width="${r((lw - 4) / 16)}" height="${r(h * 0.22)}"/>`).join('')}</g>`,
    );
  }
  const body = g.join('');
  return opts.rotate ? `<g transform="rotate(${opts.rotate} ${r(cx)} ${r(cy)})">${body}</g>` : `<g>${body}</g>`;
}

/** Rounded low-poly EV van facing right. (x, y) = top-left, width ≈ 150·s. */
export function van(x: number, y: number, s = 1) {
  return `<g transform="translate(${r(x)} ${r(y)}) scale(${s})">
    ${shadow(76, 86, 70, 7, 0.14)}
    <path d="M6 18 Q6 6 18 6 H96 Q104 6 108 12 L128 38 Q132 42 140 44 Q148 46 148 56 V70 Q148 78 140 78 H14 Q6 78 6 70 Z" fill="${C.navy}"/>
    <path d="M100 14 H106 L124 40 H100 Z" fill="#BFE8E3"/>
    <rect x="6" y="50" width="142" height="9" fill="${C.teal}"/>
    <rect x="94" y="22" width="2" height="48" fill="${C.navy6}"/>
    <g transform="translate(38 22)" fill="none" stroke="${C.white}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="6" width="12" height="11" rx="3" fill="${C.white}" stroke="none"/>
      <path d="M7 6 V1 M13 6 V1 M10 17 V22 Q10 25 14 25 H22"/>
    </g>
    <rect x="140" y="58" width="8" height="6" rx="2" fill="${C.white}" opacity=".9"/>
    <g><circle cx="38" cy="78" r="13" fill="${C.navy}"/><circle cx="38" cy="78" r="6" fill="${C.cloud}"/></g>
    <g><circle cx="118" cy="78" r="13" fill="${C.navy}"/><circle cx="118" cy="78" r="6" fill="${C.cloud}"/></g>
  </g>`;
}

export function house(x: number, y: number, s = 1, opts: { door?: string } = {}) {
  return `<g transform="translate(${r(x)} ${r(y)}) scale(${s})">
    ${shadow(80, 150, 92, 9, 0.1)}
    <rect x="14" y="58" width="132" height="92" fill="${C.white}" stroke="${C.edge}" stroke-width="1.5"/>
    <path d="M2 64 L80 4 L158 64" fill="none" stroke="${C.navy}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="62" y="90" width="36" height="60" rx="3" fill="${opts.door ?? C.navy6}"/>
    <circle cx="90" cy="122" r="2.4" fill="${C.white}"/>
    <rect x="26" y="80" width="26" height="24" rx="3" fill="#BFE8E3"/>
    <rect x="108" y="80" width="26" height="24" rx="3" fill="#BFE8E3"/>
    <rect x="52" y="148" width="56" height="6" rx="2" fill="${C.line}"/>
  </g>`;
}

export function warehouse(x: number, y: number, s = 1) {
  return `<g transform="translate(${r(x)} ${r(y)}) scale(${s})">
    ${shadow(90, 128, 100, 9, 0.1)}
    <rect x="6" y="40" width="168" height="88" fill="${C.cloud}" stroke="${C.edge}" stroke-width="1.5"/>
    <path d="M0 44 L40 8 H140 L180 44 Z" fill="${C.navy}"/>
    <rect x="40" y="70" width="64" height="58" fill="${C.white}" stroke="${C.edge}"/>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="40" y="${74 + i * 11}" width="64" height="2" fill="${C.line}"/>`).join('')}
    <rect x="118" y="70" width="40" height="22" rx="3" fill="#BFE8E3"/>
    <rect x="118" y="100" width="40" height="6" rx="3" fill="${C.teal}"/>
  </g>`;
}

export function phone(x: number, y: number, s = 1) {
  return `<g transform="translate(${r(x)} ${r(y)}) scale(${s})">
    ${shadow(66, 254, 60, 6, 0.12)}
    <rect width="132" height="248" rx="22" fill="${C.navy}"/>
    <rect x="8" y="10" width="116" height="228" rx="15" fill="${C.white}"/>
    <rect x="48" y="16" width="36" height="6" rx="3" fill="${C.navy}"/>
    <circle cx="28" cy="44" r="10" fill="${C.navy}"/>
    <path d="M23 44 l3.5 3.5 l6 -7" fill="none" stroke="${C.teal}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="44" y="37" width="48" height="6" rx="3" fill="${C.navy}"/>
    <rect x="44" y="47" width="32" height="5" rx="2.5" fill="${C.line}"/>
    <rect x="16" y="68" width="100" height="112" rx="12" fill="${C.teal50}" stroke="${C.tealSoft}"/>
    <text x="26" y="88" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="700" fill="${C.navy}">Delivered</text>
    <rect x="26" y="96" width="76" height="5" rx="2.5" fill="${C.navy6}" opacity=".5"/>
    <rect x="26" y="105" width="58" height="5" rx="2.5" fill="${C.navy6}" opacity=".5"/>
    <rect x="26" y="118" width="80" height="52" rx="6" fill="${C.cloud}"/>
    <rect x="58" y="132" width="16" height="38" fill="${C.navy6}"/>
    <rect x="72" y="156" width="16" height="12" fill="${C.cloud}" stroke="${C.edge}" stroke-width=".8"/>
    <rect x="78" y="156" width="4" height="12" fill="${C.teal}"/>
    <circle cx="98" cy="126" r="5" fill="${C.orange}"/>
    <rect x="16" y="192" width="100" height="30" rx="15" fill="${C.teal}"/>
    <rect x="40" y="204" width="52" height="6" rx="3" fill="${C.navy}"/>
  </g>`;
}

export function route(d: string, opts: { color?: string; width?: number; gap?: number; dashed?: boolean } = {}) {
  const w = opts.width ?? 5;
  const dash = opts.dashed ? `${w * 2} ${w * 2}` : `0 ${opts.gap ?? w * 2.6}`;
  return `<path d="${d}" fill="none" stroke="${opts.color ?? C.teal}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${dash}"/>`;
}

export function stop(x: number, y: number, final = false) {
  return final
    ? `<circle cx="${x}" cy="${y}" r="9" fill="${C.orange}"/><circle cx="${x}" cy="${y}" r="15" fill="none" stroke="${C.orange}" stroke-width="2" opacity=".35"/>`
    : `<circle cx="${x}" cy="${y}" r="7" fill="${C.white}" stroke="${C.teal}" stroke-width="3"/>`;
}

const chip = (x: number, y: number, w: number, title: string, sub: string) => `
  <g>
    <rect x="${x}" y="${y + 3}" width="${w}" height="52" rx="14" fill="${C.navy}" opacity=".08"/>
    <rect x="${x}" y="${y}" width="${w}" height="52" rx="14" fill="${C.white}" stroke="${C.line}"/>
    <circle cx="${x + 20}" cy="${y + 26}" r="6" fill="${C.teal}"/>
    <text x="${x + 34}" y="${y + 22}" font-family="Inter, Arial, sans-serif" font-size="10.5" fill="${C.slate}">${sub}</text>
    <text x="${x + 34}" y="${y + 39}" font-family="'Space Grotesk', Arial, sans-serif" font-size="14" font-weight="700" fill="${C.navy}">${title}</text>
  </g>`;

/* ───────────────────────── Story chapters ───────────────────────── */

export function storeScene() {
  const shelves = [150, 220, 290];
  const rows: [number, number, number][][] = [
    [[128, 44, 36], [180, 34, 28], [222, 50, 40], [284, 36, 30]],
    [[128, 54, 44], [192, 40, 34], [240, 46, 38]],
    [[128, 36, 30], [172, 50, 40], [234, 44, 36], [288, 34, 28]],
  ];
  const back = `<rect x="128" y="74" width="9" height="214" fill="${C.navy6}"/><rect x="348" y="74" width="9" height="214" fill="${C.navy6}"/>`;
  const shelfTops = shelves.map((y) => `<polygon points="110,${y} 128,${y - 12} 357,${y - 12} 340,${y}" fill="${C.line}"/>`).join('');
  const boxes = rows.map((row, i) => row.map(([x, w, h]) => parcel(x, shelves[i] - h, w, h, { shadow: false })).join('')).join('');
  const front = shelves.map((y) => `<rect x="106" y="${y}" width="240" height="8" rx="2" fill="${C.navy}"/>`).join('') +
    `<rect x="106" y="86" width="10" height="214" rx="2" fill="${C.navy7}"/><rect x="336" y="86" width="10" height="214" rx="2" fill="${C.navy7}"/>`;
  return [
    backdrop(),
    shadow(230, 304, 150, 10, 0.1),
    back, shelfTops, boxes, front,
    `<g opacity=".9">${route('M233 22 V44', { width: 3, gap: 7 })}${route('M262 18 V40', { width: 3, gap: 7 })}</g>`,
    parcel(226, 44, 40, 32, { rotate: -8, shadow: false }),
    chip(338, 44, 128, 'In stock: 36', 'SKU 0142 · live'),
  ].join('');
}

export function packScene() {
  const flapL = `<polygon points="160,176 128,148 150,140 178,170" fill="${C.white}" stroke="${C.edge}"/>`;
  const flapR = `<polygon points="250,170 286,150 290,166 262,180" fill="${C.cloud}" stroke="${C.edge}"/>`;
  const flapBack = `<polygon points="182,160 194,128 256,128 250,160" fill="${C.line}" stroke="${C.edge}"/>`;
  return [
    backdrop(),
    `<polygon points="70,236 98,214 418,214 398,236" fill="${C.line}"/>`,
    `<rect x="66" y="234" width="336" height="14" rx="3" fill="${C.navy}"/>`,
    `<rect x="86" y="248" width="12" height="56" fill="${C.navy7}"/><rect x="372" y="248" width="12" height="56" fill="${C.navy7}"/>`,
    shadow(236, 306, 160, 8, 0.08),
    flapBack,
    `<rect x="160" y="170" width="92" height="64" fill="${C.cloud}" stroke="${C.edge}"/>`,
    `<polygon points="252,170 270,160 270,224 252,234" fill="${C.line}" stroke="${C.edge}"/>`,
    `<rect x="200" y="170" width="14" height="64" fill="${C.teal}"/>`,
    flapL, flapR,
    route('M122 132 Q 132 108 160 112', { width: 3, gap: 7 }),
    `<path d="M156 106 l7 6 l-8 4" fill="none" stroke="${C.teal}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
    `<rect x="300" y="152" width="88" height="62" rx="10" fill="${C.navy7}"/>`,
    `<rect x="312" y="164" width="36" height="8" rx="4" fill="${C.teal}"/><circle cx="370" cy="168" r="5" fill="${C.teal}"/>`,
    `<rect x="308" y="194" width="72" height="6" rx="3" fill="${C.navy}"/>`,
    `<g transform="rotate(6 344 214)"><rect x="314" y="196" width="60" height="40" rx="3" fill="${C.white}" stroke="${C.edge}"/>
      <g fill="${C.navy}">${[0, 1, 3, 4, 6, 8, 9, 11].map((i) => `<rect x="${320 + i * 4}" y="204" width="2.2" height="18"/>`).join('')}</g>
      <rect x="320" y="226" width="40" height="4" rx="2" fill="${C.teal}"/></g>`,
    parcel(80, 196, 46, 38, { label: true, shadow: false }),
  ].join('');
}

export function sortScene() {
  const rollers = Array.from({ length: 10 }, (_, i) => `<circle cx="${44 + i * 30}" cy="250" r="6" fill="${C.slate}" stroke="${C.navy}" stroke-width="2"/>`).join('');
  return [
    backdrop(),
    shadow(190, 302, 170, 9, 0.08),
    `<rect x="60" y="254" width="10" height="46" fill="${C.navy7}"/><rect x="300" y="254" width="10" height="46" fill="${C.navy7}"/>`,
    `<polygon points="30,232 46,220 342,220 330,232" fill="${C.navy6}"/>`,
    `<rect x="28" y="232" width="304" height="14" rx="3" fill="${C.navy7}"/>`,
    rollers,
    `<polygon points="178,124 252,124 268,232 162,232" fill="${C.teal}" opacity=".14"/>`,
    parcel(56, 184, 46, 36, { label: true, shadow: false }),
    parcel(186, 186, 44, 34, { label: true, shadow: false }),
    `<rect x="160" y="112" width="16" height="122" rx="5" fill="${C.teal}"/><rect x="254" y="112" width="16" height="122" rx="5" fill="${C.teal}"/>`,
    `<rect x="154" y="100" width="122" height="22" rx="9" fill="${C.teal}"/>`,
    `<rect x="174" y="108" width="82" height="5" rx="2.5" fill="${C.white}" opacity=".85"/>`,
    route('M332 226 C 362 226, 362 130, 404 130', { width: 4, gap: 10 }),
    route('M332 226 C 368 226, 372 210, 404 210', { width: 4, gap: 10 }),
    route('M332 226 C 362 226, 362 288, 404 288', { width: 4, gap: 10 }),
    ...[
      [130, 'A', false],
      [210, 'B', true],
      [288, 'C', false],
    ].map(([y, l, on]) => `<rect x="404" y="${(y as number) - 22}" width="56" height="44" rx="10" fill="${on ? C.teal : C.white}" stroke="${on ? C.teal : C.line}" stroke-width="2"/><text x="432" y="${(y as number) + 6}" text-anchor="middle" font-family="'Space Grotesk', Arial, sans-serif" font-size="18" font-weight="700" fill="${C.navy}">${l}</text>`),
  ].join('');
}

/** Illustrative route through each city (stops = example neighbourhoods; not to scale). */
export const CITY_ROUTES: Record<string, { d: string; stops: [number, number][] }> = {
  toronto: { d: 'M214 252 C 240 232, 262 252, 290 240 S 340 226, 362 222 S 410 214, 428 200', stops: [[214, 252], [290, 240], [362, 222], [428, 200]] },
  mississauga: { d: 'M86 266 C 104 248, 118 238, 134 226 S 168 206, 192 196', stops: [[86, 266], [134, 226], [164, 210], [192, 196]] },
  brampton: { d: 'M82 172 C 98 150, 116 130, 140 120 S 172 100, 186 92', stops: [[82, 172], [118, 132], [156, 112], [186, 92]] },
  vaughan: { d: 'M206 166 C 222 146, 238 150, 254 132 S 284 104, 300 90', stops: [[206, 166], [240, 146], [268, 118], [300, 90]] },
  markham: { d: 'M322 154 C 340 136, 360 142, 378 124 S 412 96, 428 84', stops: [[322, 154], [356, 138], [392, 112], [428, 84]] },
};

export function cityRoute(city: string, names: string[] = []) {
  const r = CITY_ROUTES[city];
  if (!r) return '';
  const stops = r.stops.map(([x, y], i) => {
    const last = i === r.stops.length - 1;
    return `<g class="map-stop" style="transform-box:fill-box;transform-origin:center"><circle cx="${x}" cy="${y}" r="${last ? 7 : 5.5}" fill="${last ? C.orange : C.white}" stroke="${last ? C.orange : C.teal}" stroke-width="3"/>${names[i] ? `<title>${names[i]}</title>` : ''}</g>`;
  }).join('');
  return `<g data-route-draw><g class="map-route">${route(r.d, { width: 4.5, gap: 11 })}</g>${stops}</g>`;
}

export function mapBase(opts: { highlight?: string; labels?: boolean; tone?: 'teal' | 'cloud' | 'none' } = {}) {
  const areas: Record<string, { d: string; lx: number; ly: number; name: string }> = {
    brampton: { d: 'M60 90 L190 80 L200 180 L70 190 Z', lx: 130, ly: 140, name: 'Brampton' },
    vaughan: { d: 'M190 80 L310 75 L315 165 L200 180 Z', lx: 254, ly: 128, name: 'Vaughan' },
    markham: { d: 'M310 75 L430 70 L440 160 L315 165 Z', lx: 374, ly: 120, name: 'Markham' },
    mississauga: { d: 'M70 190 L200 180 L215 230 L170 288 L80 293 L50 240 Z', lx: 128, ly: 244, name: 'Mississauga' },
    toronto: { d: 'M200 180 L315 165 L440 160 L450 255 L380 268 L300 280 L200 285 L170 288 L215 230 Z', lx: 330, ly: 226, name: 'Toronto' },
  };
  const lake = `<path d="M0 300 L80 293 L170 288 L200 285 L300 280 L380 268 L450 255 L480 250 L480 336 Q480 360 452 360 L28 360 Q0 360 0 332 Z" fill="${C.tealSoft}"/>`;
  const shapes = Object.entries(areas).map(([k, a]) => {
    const on = opts.highlight === k;
    return `<path d="${a.d}" fill="${on ? C.teal50 : C.white}" stroke="${on ? C.teal : C.edge}" stroke-width="${on ? 3 : 1.5}" stroke-linejoin="round"/>`;
  }).join('');
  const labels = opts.labels === false ? '' : Object.entries(areas).map(([k, a]) =>
    `<text x="${a.lx}" y="${a.ly}" text-anchor="middle" font-family="'Space Grotesk', Arial, sans-serif" font-size="${opts.highlight === k ? 17 : 14}" font-weight="${opts.highlight === k ? 700 : 600}" fill="${opts.highlight === k ? C.tealInk : C.slate}">${a.name}</text>`).join('') +
    `<text x="330" y="330" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="13" font-style="italic" fill="${C.tealInk}">Lake Ontario</text>`;
  const tone = opts.tone ?? 'cloud';
  return `${tone === 'none' ? '' : `<rect width="480" height="360" rx="28" fill="${tone === 'teal' ? C.teal50 : C.cloud}"/>`}${lake}${shapes}${labels}`;
}

export function driveScene() {
  const path = 'M70 250 C 120 200, 140 150, 200 140 S 300 190, 340 140 S 400 100, 420 96';
  return [
    mapBase({ labels: false, tone: 'teal' }),
    route(path, { width: 5, gap: 13 }),
    stop(70, 250), stop(200, 140), stop(340, 140), stop(420, 96, true),
    van(214, 110, 0.66),
  ].join('');
}

export function deliverScene() {
  return [
    backdrop(),
    route('M20 326 C 90 326, 150 320, 196 310', { width: 5, gap: 13 }),
    house(40, 136, 1),
    `<circle cx="152" cy="282" r="30" fill="none" stroke="${C.teal}" stroke-width="3" opacity=".7"/>`,
    `<circle cx="152" cy="282" r="48" fill="none" stroke="${C.teal}" stroke-width="2" opacity=".35"/>`,
    parcel(132, 266, 36, 26, { label: false }),
    `<path d="M196 238 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 l9 -3 z" fill="${C.teal}"/>`,
    stop(204, 308, true),
    phone(306, 56, 1),
  ].join('');
}

export function returnScene() {
  return [
    backdrop(),
    warehouse(28, 168, 0.9),
    house(328, 200, 0.68),
    route('M372 196 C 340 40, 170 40, 132 162', { width: 4, dashed: true, color: C.navy6 }),
    `<path d="M122 150 l10 14 l12 -12" fill="none" stroke="${C.navy6}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    parcel(236, 52, 40, 30, { label: true, rotate: -12, shadow: false }),
    `<g transform="translate(64 112)"><circle r="22" fill="${C.white}" stroke="${C.line}"/><path d="M-9 -3 A10 10 0 1 1 -6 8" fill="none" stroke="${C.teal}" stroke-width="3.4" stroke-linecap="round"/><path d="M-14 -6 l5 4 l4 -6" fill="none" stroke="${C.teal}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  ].join('');
}

/** Hero: parcel → dotted route → van → house with the orange delivered dot. */
export function heroScene() {
  return [
    `<rect width="480" height="360" rx="28" fill="${C.teal50}"/>`,
    `<circle cx="360" cy="120" r="120" fill="${C.white}" opacity=".8"/>`,
    route('M64 262 C 140 262, 150 186, 230 196 S 330 250, 372 214', { width: 5, gap: 13 }),
    parcel(28, 232, 50, 40, { label: true }),
    van(150, 228, 0.6),
    house(300, 56, 0.86),
    stop(378, 196, true),
  ].join('');
}

export const SCENES = {
  store: storeScene,
  pack: packScene,
  sort: sortScene,
  drive: driveScene,
  deliver: deliverScene,
  return: returnScene,
  hero: heroScene,
};
export type SceneName = keyof typeof SCENES;

export function svgDoc(inner: string, title?: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}" width="${W}" height="${H}"${title ? ' role="img"' : ''}>${title ? `<title>${title}</title>` : ''}${inner}</svg>`;
}
