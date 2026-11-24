import type { APIRoute } from 'astro';
import { SITE, hasPhone } from '@/config/site';
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
    `> ${SITE.legalName} ("${SITE.brand}") is a Toronto, Ontario company providing 3PL, fulfillment and same day final mile delivery across the Greater Toronto Area: pallet and shelf storage, pick and pack, kitting, B2B orders and Amazon FBA prep, same day delivery (lead service), next day delivery, rush and scheduled delivery, B2B and retail deliveries and returns, with an EV first fleet and no minimum volume. Tagline: "${SITE.tagline}"`,
    '',
    'Key facts:',
    `- Headquarters: ${SITE.address.locality}, ${SITE.address.regionName}, Canada`,
    `- Areas served by our own delivery fleet: ${CITIES.map((c) => c.name).join(', ')}`,
    '- Delivery speeds: same day across the GTA (order by late morning, delivered the same day; exact cutoffs set per customer); next day as standard; rush on demand pickups and scheduled delivery windows within the GTA',
    '- Minimum volume: none; built for growing brands',
    '- Support: a named account contact and real people, not a ticket queue',
    '- Fleet: EV first (EVs run most routes and are assigned routes first), backed by cargo vans and box trucks for larger or bulk loads',
    '- Every delivery: live SMS and email tracking for the recipient, photo proof of delivery, signature on request',
    '- Labels and integrations: Kinematics shipping labels and a daily manifest; Shopify (primary; App Store app coming soon), WooCommerce, BigCommerce, CSV upload; API coming soon',
    '- Pricing: custom quotes only; no published rates',
    `- Contact: ${SITE.email}${hasPhone() ? `, ${SITE.phone} (${SITE.phoneE164})` : ''}`,
    `- Hours: ${SITE.hours.map((h) => `${h.label} ${h.time}`).join('; ')} (${SITE.hoursNote})`,
    '',
    '## Services',
    ...SERVICES.map((s) => `- [${s.name}](${u(s.href)}): ${s.answer}`),
    `- [EV delivery and sustainability](${u('/ev-delivery')}): How the EV first fleet and route planning work; emissions reporting coming soon.`,
    `- [How it works](${u('/how-it-works')}): Connect store → send stock → we pack → we deliver → you see everything.`,
    `- [Integrations](${u('/integrations')}): Shopify, WooCommerce, BigCommerce, CSV, our labels and daily manifest; API coming soon.`,
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
    '## For agents',
    `- [MCP server](${u('/mcp')}): read-only Streamable HTTP endpoint with tools get_services, get_service_areas, get_contact, start_quote (prefilled quote link, never submits) and track_parcel (tracking link). No auth.`,
    `- [MCP Server Card](${u('/.well-known/mcp/server-card.json')}): name, version, transport, capabilities and tools.`,
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
