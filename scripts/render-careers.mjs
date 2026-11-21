#!/usr/bin/env node
/**
 * Renders the careers hero still from the 3D scene (src/components/stills/CareersStill.tsx):
 *   src/assets/careers/warehouse.png   2400×1350 master (astro:assets makes AVIF/WebP ~1600w)
 *   public/og/careers.png              1200×630 Open Graph image
 * Usage: npm run render:careers
 * It builds the site with KIN_RENDER=1 (which adds the hidden /render/careers page), serves it,
 * captures the still, then rebuilds normally so the render page is not left in dist/.
 */
import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');
const sharp = require('sharp');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 4455;

execSync('npx astro build', { env: { ...process.env, KIN_RENDER: '1' }, stdio: 'ignore' });
const dev = spawn('node', ['scripts/serve-static.mjs'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'pipe' });
const url = `http://127.0.0.1:${PORT}/render/careers`;
for (let i = 0; i < 60; i++) { try { const r = await fetch(url); if (r.ok) break; } catch {} await new Promise((r) => setTimeout(r, 1000)); }
try {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('pageerror', e.message));
  await page.setViewport({ width: 2400, height: 1350, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__stillReady === true, { timeout: 60000 });
  const png = await page.screenshot({ type: 'png' });
  await browser.close();
  await sharp(png).png({ compressionLevel: 9 }).toFile('src/assets/careers/warehouse.png');
  await sharp(png).resize(1200, 630, { fit: 'cover', position: 'centre' }).png({ compressionLevel: 9 }).toFile('public/og/careers.png');
  console.log('wrote src/assets/careers/warehouse.png and public/og/careers.png');
} finally {
  dev.kill('SIGTERM');
  execSync('npx astro build', { stdio: 'ignore' });
}
