/**
 * JSON-LD builders. Every builder returns a plain object; <SEO> serialises them
 * into one @graph. Values come only from src/config/site.ts — placeholders
 * (e.g. the phone number) are omitted rather than published.
 */
import { SITE, FLAGS, isPlaceholder, sameAsUrls } from '@/config/site';

export type JsonLd = Record<string, unknown>;

export const abs = (path: string) => new URL(path, SITE.url).href;

const ORG_ID = `${SITE.url}/#organization`;
const SITE_ID = `${SITE.url}/#website`;
const LB_ID = `${SITE.url}/#localbusiness`;

const sameAs = sameAsUrls;

const telephone = () => (isPlaceholder(SITE.phone) ? undefined : SITE.phoneE164);

export const postalAddress = () => ({
  '@type': 'PostalAddress',
  ...(SITE.address.streetAddress ? { streetAddress: SITE.address.streetAddress } : {}),
  ...(SITE.address.postalCode ? { postalCode: SITE.address.postalCode } : {}),
  addressLocality: SITE.address.locality,
  addressRegion: SITE.address.region,
  addressCountry: SITE.address.country,
});

export const GTA_AREAS = ['Toronto', 'Mississauga', 'Brampton', 'Vaughan', 'Markham'];

const areaServed = (cities: string[] = GTA_AREAS) =>
  cities.map((name) => ({ '@type': 'City', name, containedInPlace: { '@type': 'AdministrativeArea', name: 'Ontario' } }));

export function organization(): JsonLd {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE.brand,
    legalName: SITE.legalName,
    url: SITE.url,
    slogan: SITE.tagline,
    description: SITE.valueProp,
    logo: { '@type': 'ImageObject', url: abs('/icon-512.png'), width: 512, height: 512 },
    image: abs(SITE.defaultOgImage),
    email: SITE.email,
    ...(telephone() ? { telephone: telephone() } : {}),
    address: postalAddress(),
    areaServed: areaServed(),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: SITE.email,
      ...(telephone() ? { telephone: telephone() } : {}),
      areaServed: 'CA-ON',
      availableLanguage: ['en-CA'],
    },
    ...(sameAs().length ? { sameAs: sameAs() } : {}),
  };
}

export function website(): JsonLd {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: SITE.url,
    name: SITE.brand,
    inLanguage: SITE.locale,
    publisher: { '@id': ORG_ID },
    ...(FLAGS.siteSearch
      ? {
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: `${SITE.url}/search?q={search_term_string}` },
            'query-input': 'required name=search_term_string',
          },
        }
      : {}),
  };
}

/** Open days only; a day with no specification (Sunday) is read as closed. */
function openingHours(): JsonLd[] {
  return SITE.hours
    .filter((h) => h.opens && h.closes)
    .map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: h.days.map((d) => `https://schema.org/${d}`), opens: h.opens!, closes: h.closes! }));
}

export function localBusiness(opts: { city?: string; url?: string; description?: string } = {}): JsonLd {
  const id = opts.city ? `${abs(opts.url ?? '/')}#localbusiness` : LB_ID;
  return {
    '@type': 'LocalBusiness',
    '@id': id,
    name: opts.city ? `${SITE.brand} ${opts.city}` : SITE.brand,
    url: abs(opts.url ?? '/contact'),
    description: opts.description ?? SITE.valueProp,
    image: abs(SITE.defaultOgImage),
    logo: abs('/icon-512.png'),
    email: SITE.email,
    ...(telephone() ? { telephone: telephone() } : {}),
    address: postalAddress(),
    openingHoursSpecification: openingHours(),
    areaServed: opts.city ? areaServed([opts.city]) : areaServed(),
    ...(sameAs().length ? { sameAs: sameAs() } : {}),
    parentOrganization: { '@id': ORG_ID },
  };
}

export function service(opts: { name: string; description: string; url: string; serviceType: string; cities?: string[] }): JsonLd {
  return {
    '@type': 'Service',
    '@id': `${abs(opts.url)}#service`,
    name: opts.name,
    serviceType: opts.serviceType,
    description: opts.description,
    url: abs(opts.url),
    provider: { '@id': ORG_ID },
    areaServed: areaServed(opts.cities),
    offers: {
      '@type': 'Offer',
      // No published prices: quotes are custom.
      description: 'Get a custom quote',
      url: abs('/get-a-quote'),
      priceCurrency: 'CAD',
    },
  };
}

export type Crumb = { name: string; href: string };

export function breadcrumbs(crumbs: Crumb[]): JsonLd {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.href) })),
  };
}

export type QA = { q: string; a: string };

export function faqPage(items: QA[], url?: string): JsonLd {
  return {
    '@type': 'FAQPage',
    ...(url ? { '@id': `${abs(url)}#faq` } : {}),
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: stripMd(i.a) },
    })),
  };
}

export function blogPosting(p: {
  title: string; description: string; url: string; image: string; published: Date; updated?: Date; author: string; section?: string; wordCount?: number;
}): JsonLd {
  return {
    '@type': 'BlogPosting',
    '@id': `${abs(p.url)}#article`,
    headline: p.title,
    description: p.description,
    url: abs(p.url),
    mainEntityOfPage: abs(p.url),
    image: abs(p.image),
    datePublished: p.published.toISOString(),
    dateModified: (p.updated ?? p.published).toISOString(),
    author: { '@type': 'Organization', name: p.author, url: abs('/about'), logo: abs('/icon-512.png') },
    publisher: { '@id': ORG_ID },
    inLanguage: SITE.locale,
    ...(p.section ? { articleSection: p.section } : {}),
    ...(p.wordCount ? { wordCount: p.wordCount } : {}),
  };
}

export function jobPosting(j: {
  title: string; description: string; url: string; datePosted: Date; validThrough?: Date; employmentType: string[]; city: string;
}): JsonLd {
  return {
    '@type': 'JobPosting',
    title: j.title,
    description: j.description,
    url: abs(j.url),
    datePosted: j.datePosted.toISOString().slice(0, 10),
    ...(j.validThrough ? { validThrough: j.validThrough.toISOString() } : {}),
    employmentType: j.employmentType,
    directApply: true,
    hiringOrganization: { '@type': 'Organization', name: SITE.legalName, url: SITE.url, sameAs: SITE.url, logo: abs('/icon-512.png') },
    jobLocation: {
      '@type': 'Place',
      address: { ...postalAddress(), addressLocality: j.city },
    },
    applicantLocationRequirements: { '@type': 'State', name: 'Ontario' },
  };
}

export function webPage(p: { url: string; title: string; description: string; type?: string }): JsonLd {
  return {
    '@type': p.type ?? 'WebPage',
    '@id': `${abs(p.url)}#webpage`,
    url: abs(p.url),
    name: p.title,
    description: p.description,
    inLanguage: SITE.locale,
    isPartOf: { '@id': SITE_ID },
    about: { '@id': ORG_ID },
  };
}

/** Minimal markdown → plain text for schema answers. */
export function stripMd(s: string) {
  return s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_`]/g, '').trim();
}
