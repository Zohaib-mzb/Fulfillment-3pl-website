/**
 * Build step for the Node server (Hostinger Node.js web app).
 * After `astro build`:
 *  0. writes a Markdown twin of every indexable page (markdown.mjs) and lists them in llms.txt
 *  1. writes Brotli (.br) and gzip (.gz) copies of static text files in dist/client
 *  2. copies server-hardening.mjs into dist/server and imports it first from entry.mjs,
 *     so `node ./dist/server/entry.mjs` serves compressed files with security and cache headers.
 */
import { readdir, readFile, writeFile, copyFile, stat } from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { generateMarkdown } from './markdown.mjs';

const TEXT = /\.(html|md|js|mjs|css|svg|xml|txt|json|webmanifest)$/;

async function walk(d) {
  const out = [];
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

/** @returns {import('astro').AstroIntegration} */
export default function hosting() {
  let serverDir, clientDir, site;
  return {
    name: 'kin:hosting',
    hooks: {
      'astro:config:done': ({ config }) => {
        serverDir = fileURLToPath(config.build.server);
        clientDir = fileURLToPath(config.build.client);
        site = config.site;
      },
      'astro:build:done': async ({ logger }) => {
        const pages = await generateMarkdown({ clientDir, site, logger });
        const llms = path.join(clientDir, 'llms.txt');
        const txt = await readFile(llms, 'utf8');
        const list = pages.map((p) => `- [${p.title}](${new URL(p.md, site).href})`).join('\n');
        const section = `## Markdown versions\nEvery page is also available as clean Markdown at the same path with .md (or send Accept: text/markdown).\n${list}\n\n`;
        await writeFile(llms, txt.includes('\n## Optional') ? txt.replace('\n## Optional', `\n${section}## Optional`) : `${txt.trimEnd()}\n\n${section}`);

        let n = 0, raw = 0, br = 0;
        for (const f of await walk(clientDir)) {
          if (!TEXT.test(f) || (await stat(f)).size < 1024) continue;
          const buf = await readFile(f);
          const b = zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buf.length } });
          await writeFile(f + '.br', b);
          await writeFile(f + '.gz', zlib.gzipSync(buf, { level: 9 }));
          n++; raw += buf.length; br += b.length;
        }
        logger.info(`precompressed ${n} files: ${(raw / 1024).toFixed(0)} KB → ${(br / 1024).toFixed(0)} KB brotli`);

        const entry = path.join(serverDir, 'entry.mjs');
        await copyFile(fileURLToPath(new URL('./server-hardening.mjs', import.meta.url)), path.join(serverDir, 'server-hardening.mjs'));
        const src = await readFile(entry, 'utf8');
        if (!src.startsWith("import './server-hardening.mjs';")) await writeFile(entry, `import './server-hardening.mjs';\n${src}`);
        logger.info('entry.mjs: compression, security and cache headers enabled');
      },
    },
  };
}
