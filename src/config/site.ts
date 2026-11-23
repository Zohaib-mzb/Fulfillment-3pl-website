/**
 * Single source of truth for business details, feature flags and navigation.
 * Anything in [square brackets] is a placeholder; see LAUNCH_CHECKLIST.md.
 * Never hard-code these values elsewhere — import from here.
 */

/** Effective date shown on every legal page (privacy, terms, cookies, accessibility). Set to the deploy date. */
export const LEGAL_EFFECTIVE_DATE = '2026-11-21';

export const SITE = {
  url: 'https://kinematicstech.ca',
  domain: 'kinematicstech.ca',
  legalName: 'Kinematics Technologies Inc.',
  brand: 'Kinematics',
  tagline: 'Commerce in motion.',
  /** Main positioning line (hero, OG, footer, schema). */
  mainLine: '3PL, fulfillment and same day final mile delivery across the GTA.',
  valueProp:
    '3PL, fulfillment and same day final mile delivery across the GTA. Storage, pick and pack, same day and next day delivery, rush and scheduled runs, B2B drops and returns, from one Toronto team with no minimum volume.',
  email: 'info@kinematicstech.ca',
  /** Readable phone, shown on pages. Leave empty to hide the phone everywhere (pages + schema). */
  phone: '(437) 665 9457',
  /** Same number in E.164, used for tel: links and schema. */
  phoneE164: '+14376659457',
  /** Opening hours (Toronto time). Shown on Contact and in the footer; emitted as openingHoursSpecification. */
  hours: [
    { label: 'Monday to Friday', time: '9am to 6pm', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '18:00' },
    { label: 'Saturday', time: '9am to 2pm', days: ['Saturday'], opens: '09:00', closes: '14:00' },
    { label: 'Sunday', time: 'Closed', days: ['Sunday'], opens: null, closes: null },
  ],
  hoursNote: 'Toronto time',
  /**
   * Address: only the city is confirmed. Add the street address and postal code
   * when the facility address is public; schema and NAP pick it up automatically.
   */
  address: {
    streetAddress: null as string | null,
    postalCode: null as string | null,
    locality: 'Toronto',
    region: 'ON',
    regionName: 'Ontario',
    country: 'CA',
  },
  /**
   * Public profiles. Leave a value empty until the real URL exists: empty or [placeholder]
   * values are never output. Filled values appear in schema `sameAs` (Organization and
   * LocalBusiness); LinkedIn also shows in the footer.
   */
  socials: { linkedin: 'https://www.linkedin.com/company/kinematics-tech/' as string },
  /** Google Business Profile URL (for example the maps.app.goo.gl share link). */
  googleBusinessProfile: '' as string,
  locale: 'en-CA',
  defaultOgImage: '/og/default.png',
} as const;

/** True while a config value is still a [placeholder]. */
export const isPlaceholder = (v: string | null | undefined) => !v || /^\[.*\]$/.test(v.trim());

export const hasPhone = () => !isPlaceholder(SITE.phone);
/** Profile URLs for schema `sameAs`: only real https URLs that are set. */
export const sameAsUrls = (): string[] =>
  [SITE.socials.linkedin, SITE.googleBusinessProfile].filter((u) => !isPlaceholder(u) && /^https:\/\/[^\s]+$/.test(u.trim())).map((u) => u.trim());

export const phoneHref = () => (hasPhone() ? `tel:${SITE.phoneE164}` : null);

/**
 * Feature flags. Proof components (stats, logos, testimonials) are built but hidden
 * until real, verifiable content exists. Do not flip these on with invented content.
 */
export const FLAGS = {
  showTestimonials: false,
  showClientLogos: false,
  showStats: false,
  /** Set to true once a tracking backend URL is configured (PUBLIC_TRACKING_URL). */
  trackingLive: Boolean(import.meta.env.PUBLIC_TRACKING_URL),
  shopifyAppLive: false,
  emissionsReportingLive: false,
  /** WebSite SearchAction is only emitted if site search exists. */
  siteSearch: false,
} as const;

export const ANALYTICS = {
  /** 'plausible' | 'ga4' | 'none' — nothing loads until the visitor accepts cookies. */
  provider: (import.meta.env.PUBLIC_ANALYTICS_PROVIDER ?? 'none') as 'plausible' | 'ga4' | 'none',
  plausibleDomain: import.meta.env.PUBLIC_PLAUSIBLE_DOMAIN ?? 'kinematicstech.ca',
  plausibleSrc: import.meta.env.PUBLIC_PLAUSIBLE_SRC ?? 'https://plausible.io/js/script.tagged-events.js',
  ga4Id: import.meta.env.PUBLIC_GA4_ID ?? '',
};

export const TRACKING_URL: string = import.meta.env.PUBLIC_TRACKING_URL ?? '';

export type NavItem = { label: string; href: string; description?: string };
export type NavGroup = { label: string; href?: string; items: NavItem[] };

export const SERVICES_NAV: NavItem[] = [
  { label: 'Same day delivery', href: '/services/same-day-delivery', description: 'Order by late morning, delivered the same day' },
  { label: 'Next day delivery', href: '/services/final-mile-delivery', description: 'Across the GTA, as standard' },
  { label: 'Rush and scheduled delivery', href: '/services/rush-scheduled-delivery', description: 'On demand pickups and delivery windows' },
  { label: 'B2B and retail delivery', href: '/services/b2b-retail-delivery', description: 'Store replenishment and business drops' },
  { label: 'Warehousing and fulfillment', href: '/services/fulfillment', description: 'Storage, pick and pack, kitting, FBA prep' },
  { label: 'Returns', href: '/services/returns', description: 'Pickup, inspection, restock or dispose' },
];

export const INDUSTRIES_NAV: NavItem[] = [
  { label: 'Apparel and footwear', href: '/industries/apparel-footwear' },
  { label: 'Beauty and wellness', href: '/industries/beauty-wellness' },
  { label: 'Home goods', href: '/industries/home-goods' },
  { label: 'Subscription boxes', href: '/industries/subscription-boxes' },
  { label: 'All industries', href: '/industries' },
];

export const RESOURCES_NAV: NavItem[] = [
  { label: 'Blog', href: '/blog' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Service areas', href: '/service-areas' },
  { label: 'Drive with us', href: '/drive-with-us' },
];

export const HEADER_NAV: (NavGroup | NavItem)[] = [
  { label: 'Services', items: SERVICES_NAV },
  { label: 'Industries', items: INDUSTRIES_NAV },
  { label: 'How it works', href: '/how-it-works' },
  { label: 'EV delivery', href: '/ev-delivery' },
  { label: 'Resources', items: RESOURCES_NAV },
];

export const FOOTER_NAV: NavGroup[] = [
  { label: 'Services', items: [...SERVICES_NAV.map(({ label, href }) => ({ label, href })), { label: 'EV delivery', href: '/ev-delivery' }] },
  {
    label: 'Company',
    items: [
      { label: 'About', href: '/about' },
      { label: 'How it works', href: '/how-it-works' },
      { label: 'Careers', href: '/careers' },
      { label: 'Drive with us', href: '/drive-with-us' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    label: 'Resources',
    items: [
      { label: 'Blog', href: '/blog' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'Industries', href: '/industries' },
      { label: 'Track a parcel', href: '/track' },
      { label: 'Get a quote', href: '/get-a-quote' },
    ],
  },
  {
    label: 'Legal',
    items: [
      { label: 'Privacy policy', href: '/privacy' },
      { label: 'Terms of use', href: '/terms' },
      { label: 'Accessibility', href: '/accessibility' },
      { label: 'Cookie notice', href: '/cookies' },
    ],
  },
];
