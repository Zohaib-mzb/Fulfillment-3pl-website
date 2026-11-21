#!/usr/bin/env node
/**
 * Renders the hero film (the real R3F scene, deterministic via ?capture=1) to:
 *   public/media/hero-loop-<v>.mp4   H.264, 1280×720, 30 fps, muted, faststart
 *   public/media/hero-loop-<v>.webm  AV1 (SVT-AV1), same frames
 *   src/assets/hero/poster.png       1920×1080 frame at HERO_POSTER_T
 *   reports/media/hero-loop.gif      small preview for the report (optional, --gif)
 * Requires the production preview running:  npm run build && npm run preview
 * Usage: npm run capture:hero [-- --fps 30 --gif]
 */
import { createRequire } from 'node:module';
import { mkdir, rm, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');
const ffmpeg = process.env.FFMPEG || require('ffmpeg-static');
const { HERO_LOOP, HERO_POSTER_T } = await import('../src/data/hero.ts');

const args = process.argv.slice(2);
const FPS = Number(args[args.indexOf('--fps') + 1]) || 24;
const ENCODE_ONLY = args.includes('--encode-only');
const VERSION = 'v2';
const BASE = process.env.BASE || 'http://localhost:4321';
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const tmp = process.env.FRAMES_DIR || path.join(os.tmpdir(), 'kin-hero-frames');
await mkdir(tmp, { recursive: true });
await mkdir('public/media', { recursive: true });

const browser = ENCODE_ONLY ? null : await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars'] });
async function open(width, height) {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('kin-consent', 'denied'); } catch {} });
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/?capture=1`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__hero && document.querySelector('[data-hero]')?.dataset.mode === '3d', { timeout: 60000 });
  return page;
}
const frame = async (page, t, file, type = 'png') => {
  await page.evaluate((t) => window.__hero.seek(t), t);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.screenshot({ path: file, type, ...(type === 'jpeg' ? { quality: 95 } : {}) });
};

if (!ENCODE_ONLY) {
// poster (1920×1080)
const big = await open(1920, 1080);
await frame(big, HERO_POSTER_T, 'src/assets/hero/poster.png');
await big.close();
console.log('poster → src/assets/hero/poster.png');

// frames (1280×720)
const page = await open(1280, 720);
const total = Math.round(HERO_LOOP * FPS);
for (let i = 0; i < total; i++) {
  await frame(page, i / FPS, path.join(tmp, `f${String(i).padStart(4, '0')}.png`));
  if (i % 120 === 0) console.log(`frame ${i}/${total}`);
}
await browser.close();
}

const input = ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(tmp, 'f%04d.png')];
const mp4 = `public/media/hero-loop-${VERSION}.mp4`;
const webm = `public/media/hero-loop-${VERSION}.webm`;
execFileSync(ffmpeg, [...input, '-c:v', 'libx264', '-preset', 'veryslow', '-tune', 'animation', '-crf', '31', '-pix_fmt', 'yuv420p', '-g', String(FPS * 4), '-movflags', '+faststart', '-an', mp4], { stdio: 'inherit' });
execFileSync(ffmpeg, [...input, '-c:v', 'libsvtav1', '-preset', '5', '-crf', '46', '-pix_fmt', 'yuv420p', '-g', String(FPS * 4), '-svtav1-params', 'tune=0', '-an', webm], { stdio: 'inherit' });
if (args.includes('--gif')) {
  await mkdir('reports/media', { recursive: true });
  // short GIF excerpts (pack → sort, and the road at dusk) + a full low-res MP4 preview
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-ss', '13', '-t', '12', '-i', mp4, '-vf', 'fps=10,scale=480:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=64[p];[b][p]paletteuse=dither=bayer:bayer_scale=5', 'reports/media/hero-pack-to-sort.gif'], { stdio: 'inherit' });
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-ss', '29', '-t', '7', '-i', mp4, '-vf', 'fps=10,scale=480:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=64[p];[b][p]paletteuse=dither=bayer:bayer_scale=5', 'reports/media/hero-load-and-road.gif'], { stdio: 'inherit' });
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', mp4, '-vf', 'scale=640:-2', '-c:v', 'libx264', '-crf', '30', '-preset', 'slow', '-an', '-movflags', '+faststart', 'reports/media/hero-loop-preview.mp4'], { stdio: 'inherit' });
}
for (const f of [mp4, webm]) console.log(f, `${((await stat(f)).size / 1024 / 1024).toFixed(2)} MB`);
if (!process.env.FRAMES_DIR) await rm(tmp, { recursive: true, force: true });
