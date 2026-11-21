#!/usr/bin/env node
/**
 * Lighthouse against the local production preview (or BASE).
 *   npm run build && npm run preview      (one terminal)
 *   npm run lighthouse                     (another)  — mobile
 *   PRESET=desktop npm run lighthouse      — desktop
 *   RUNS=3 OUT=reports/x.json npm run lighthouse -- / /about
 * HTML/JSON reports go to lighthouse-reports/. With OUT, a summary JSON is written/merged.
 */
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import * as chromeLauncher from 'chrome-launcher';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const base = process.env.BASE || 'http://localhost:4321';
const preset = process.env.PRESET === 'desktop' ? 'desktop' : 'mobile';
const paths = process.argv.slice(2).length ? process.argv.slice(2) : ['/', '/services/fulfillment', '/service-areas/mississauga', '/blog/next-day-delivery-in-the-gta'];
await mkdir('lighthouse-reports', { recursive: true });

const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox'] });
const rows = [];
try {
  for (const p of paths) {
    const runs = [];
    for (let i = 0; i < Number(process.env.RUNS || 1); i++) {
      const flags = { port: chrome.port, output: ['html', 'json'], logLevel: 'error' };
      const r = preset === 'desktop'
        ? await lighthouse(`${base}${p}`, flags, desktopConfig)
        : await lighthouse(`${base}${p}`, { ...flags, formFactor: 'mobile', screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false }, throttlingMethod: 'simulate' });
      runs.push(r);
    }
    runs.sort((a, b) => a.lhr.categories.performance.score - b.lhr.categories.performance.score);
    const { lhr, report } = runs[Math.floor(runs.length / 2)];
    const slug = `${p === '/' ? 'home' : p.replace(/^\//, '').replace(/\//g, '_')}.${preset}`;
    await writeFile(`lighthouse-reports/${slug}.html`, report[0]);
    await writeFile(`lighthouse-reports/${slug}.json`, report[1]);
    const c = lhr.categories, a = lhr.audits;
    const bytes = (type) => (a['resource-summary']?.details?.items ?? []).find((i) => i.resourceType === type)?.transferSize ?? 0;
    rows.push({
      page: p,
      preset,
      performance: Math.round(c.performance.score * 100),
      accessibility: Math.round(c.accessibility.score * 100),
      bestPractices: Math.round(c['best-practices'].score * 100),
      seo: Math.round(c.seo.score * 100),
      LCP_ms: Math.round(a['largest-contentful-paint'].numericValue),
      CLS: +a['cumulative-layout-shift'].numericValue.toFixed(3),
      TBT_ms: Math.round(a['total-blocking-time'].numericValue),
      FCP_ms: Math.round(a['first-contentful-paint'].numericValue),
      jsKB: +(bytes('script') / 1024).toFixed(1),
      cssKB: +(bytes('stylesheet') / 1024).toFixed(1),
      mediaKB: +((bytes('image') + bytes('media')) / 1024).toFixed(1),
      totalKB: +(bytes('total') / 1024).toFixed(1),
    });
  }
} finally {
  await chrome.kill();
}
console.table(rows.map(({ page, preset, performance, accessibility, bestPractices, seo, LCP_ms, CLS, TBT_ms, jsKB, totalKB }) => ({ page, preset, performance, accessibility, bestPractices, seo, LCP_ms, CLS, TBT_ms, jsKB, totalKB })));
if (process.env.OUT) {
  const out = process.env.OUT;
  await mkdir(path.dirname(out), { recursive: true });
  const prev = existsSync(out) ? JSON.parse(await readFile(out, 'utf8')) : { generated: null, results: [] };
  const results = prev.results.filter((r) => !rows.some((n) => n.page === r.page && n.preset === r.preset)).concat(rows);
  await writeFile(out, JSON.stringify({ generated: new Date().toISOString(), base, throttling: preset === 'mobile' ? 'simulated slow 4G, 4x CPU' : 'desktop preset', results }, null, 2));
  console.log(`wrote ${out}`);
}
