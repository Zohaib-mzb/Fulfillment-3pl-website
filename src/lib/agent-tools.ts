/**
 * The five read-only agent tools, shared by the in-page WebMCP script (BaseLayout), the /mcp
 * server (src/pages/mcp.ts) and the MCP Server Card. Data comes only from site config and content.
 * No tool submits anything: start_quote and track_parcel return URLs for a person to open.
 */
import { SITE, hasPhone, sameAsUrls } from '@/config/site';
import { SERVICES } from '@/data/services';
import { CITIES } from '@/data/cities';

const u = (p: string) => `${SITE.url}${p}`;

/** Quote form fields an agent may prefill (never consent, never the honeypot). */
export const QUOTE_FIELDS = ['company', 'website', 'name', 'email', 'phone', 'monthly_orders', 'current_carrier', 'notes'] as const;

export const TOOL_INFO = [
  { name: 'get_services', description: 'Kinematics services (3PL, fulfillment, same day and next day delivery) with links.' },
  { name: 'get_service_areas', description: 'GTA cities Kinematics delivers to.' },
  { name: 'get_contact', description: 'Kinematics email, phone and hours.' },
  { name: 'start_quote', description: 'Prefilled Kinematics quote form link. Never submits; a person sends it.' },
  { name: 'track_parcel', description: 'Kinematics tracking page link for a tracking number.' },
] as const;

export const services = () => SERVICES.map((s) => ({ name: s.name, url: u(s.href), summary: s.short }));
export const serviceAreas = () => CITIES.map((c) => ({ name: c.name, url: u(`/service-areas/${c.slug}`) }));
export const contact = () => ({
  company: SITE.legalName,
  email: SITE.email,
  ...(hasPhone() ? { phone: SITE.phoneE164 } : {}),
  hours: SITE.hours.map((h) => `${h.label}: ${h.time}`),
  timeZone: 'America/Toronto',
  city: `${SITE.address.locality}, ${SITE.address.regionName}`,
  contactPage: u('/contact'),
  quotePage: u('/get-a-quote'),
  ...(sameAsUrls().length ? { profiles: sameAsUrls() } : {}),
});

export function quoteUrl(input: Record<string, unknown> = {}) {
  const q = new URLSearchParams();
  for (const k of QUOTE_FIELDS) {
    const v = input[k];
    if (typeof v === 'string' && v.trim()) q.set(k, v.trim().slice(0, 500));
  }
  const s = q.toString();
  return u(`/get-a-quote${s ? `?${s}` : ''}`);
}

export function trackUrl(tracking: unknown) {
  const t = String(tracking ?? '').trim();
  if (!/^[A-Za-z0-9-]{6,40}$/.test(t)) return { error: 'Tracking numbers are 6 to 40 letters, numbers or dashes.' };
  return { url: u(`/track?tracking=${encodeURIComponent(t)}`) };
}
