import type { APIRoute } from 'astro';
import { SITE } from '@/config/site';
import { SERVICES } from '@/data/services';
import { INDUSTRIES } from '@/data/industries';
import { CITIES } from '@/data/cities';
import { ALL_FAQS } from '@/data/faqs';
import { getPosts } from '@/lib/blog';
import { stripMd } from '@/lib/schema';

/** /llms.txt — a plain-language summary for LLMs and answer engines (https://llmstxt.org). */
export const GET: APIRoute = async () => {
  const u = (p: string) => `${SITE.url}${p}`;
  const posts = await getPosts();
  const lines = [
    `# ${SITE.brand}`,
    '',
    `> ${SITE.legalName} ("${SITE.brand}") is a Toronto, Ontario company providing third party logistics (3PL) fulfillment: receiving, storage, pick and pack, kitting, B2B orders and returns, plus next day and same day final mile parcel delivery across the Greater Toronto Area with an EV first fleet. Tagline: "${SITE.tagline}"`,
    '',
    'Key facts:',
    `- Headquarters: ${SITE.address.locality}, ${SITE.address.regionName}, Canada`,
    `- Areas served by our own delivery fleet: ${CITIES.map((c) => c.name).join(', ')}`,
    '- Delivery speeds: next day across the GTA as standard; same day for orders placed by late morning (exact cutoffs set per customer)',
    '- Fleet: EV first (electric vans are assigned routes first)',
    '- Every delivery: live tracking link for the recipient and photo proof of delivery',
    '- Integrations: Shopify (primary; App Store app coming soon), WooCommerce, BigCommerce, CSV upload, API',
    '- Pricing: custom quotes only; no published rates',
    `- Contact: ${SITE.email}`,
    '',
    '## Services',
    ...SERVICES.map((s) => `- [${s.name}](${u(s.href)}): ${s.answer}`),
    `- [EV delivery and sustainability](${u('/ev-delivery')}): How the EV first fleet and route planning work; emissions reporting coming soon.`,
    `- [How it works](${u('/how-it-works')}): Connect store → send stock → we pack → we deliver → you see everything.`,
    `- [Integrations](${u('/integrations')}): Shopify, WooCommerce, BigCommerce, CSV and API.`,
    '',
    '## Service areas',
    ...CITIES.map((c) => `- [${c.name}](${u(`/service-areas/${c.slug}`)}): ${c.answer}`),
    '',
    '## Industries',
    ...INDUSTRIES.map((i) => `- [${i.name}](${u(`/industries/${i.slug}`)}): ${i.short}`),
    '',
    '## Guides',
    ...posts.map((p) => `- [${p.data.title}](${u(`/blog/${p.id}`)}): ${p.data.answer}`),
    '',
    '## FAQ',
    ...ALL_FAQS.map((f) => `- Q: ${f.q}\n  A: ${stripMd(f.a)}`),
    '',
    '## Company',
    `- [About](${u('/about')})`,
    `- [Careers](${u('/careers')})`,
    `- [Drive with us](${u('/drive-with-us')})`,
    `- [Contact](${u('/contact')})`,
    `- [Get a quote](${u('/get-a-quote')})`,
    `- [Track a parcel](${u('/track')})`,
    '',
    '## Optional',
    `- [Privacy policy](${u('/privacy')})`,
    `- [Accessibility](${u('/accessibility')})`,
    `- [Sitemap](${u('/sitemap-index.xml')})`,
    `- [RSS](${u('/rss.xml')})`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
