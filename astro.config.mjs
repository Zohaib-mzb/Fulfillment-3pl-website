// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';
import hosting from './scripts/hosting/integration.mjs';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

const THREE_SLIM = fileURLToPath(new URL('./src/lib/three/slim.ts', import.meta.url));

/** Point @react-three/fiber's `import * as THREE from 'three'` at a slim catalogue (see slim.ts). */
/** @returns {import('vite').Plugin} */
const slimThreeForFiber = () => ({
  name: 'kin:slim-three-for-fiber',
  enforce: 'pre',
  /** @param {string} source @param {string | undefined} importer */
  async resolveId(source, importer) {
    if (source === 'three' && importer && /@react-three[\\/]fiber/.test(importer)) return THREE_SLIM;
    return null;
  },
});

const SITE = 'https://kinematicstech.ca';

export default defineConfig({
  site: SITE,
  output: 'static',
  // Only /api/* routes opt out of prerendering (export const prerender = false).
  // Node standalone server (Hostinger Node.js web app). Every page is prerendered and served as a
  // static file; only /api/submit runs on the server. Reads PORT and HOST from the environment.
  adapter: node({ mode: 'standalone' }),
  // Bind to all interfaces by default so Hostinger's proxy can reach the app (HOST overrides).
  server: { host: true },
  // Behind Hostinger's proxy: trust X-Forwarded-Host/Proto for these hosts so Astro's origin check
  // and request URLs see https://kinematicstech.ca rather than the internal address.
  security: {
    checkOrigin: true,
    allowedDomains: [
      { hostname: 'kinematicstech.ca', protocol: 'https' },
      { hostname: 'www.kinematicstech.ca', protocol: 'https' },
    ],
  },
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'always' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  image: { responsiveStyles: true },
  integrations: [
    hosting(),
    react({ include: ['**/story/**', '**/three/**'] }),
    mdx(),
    sitemap({
      filter: (page) => !/\/(404|thanks|api)(\/|$)/.test(page),
      changefreq: 'weekly',
      i18n: { defaultLocale: 'en', locales: { en: 'en-CA' } },
    }),
  ],
  vite: {
    plugins: [slimThreeForFiber(), tailwindcss()],
    build: { assetsInlineLimit: 2048 },
  },
});
