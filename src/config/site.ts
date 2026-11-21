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
  valueProp:
    'Storage, pick and pack, and EV first next day and same day delivery across the GTA, run by one Toronto team.',
  email: 'info@kinematicstech.ca',
  /** Leave empty until decided: the phone is hidden everywhere (pages + schema) while empty or a [placeholder]. */
  phone: '',
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
  /** Social profiles. Only LinkedIn; it stays hidden until `href` is filled in. */
  social: [{ label: 'LinkedIn', href: '' }],
  locale: 'en-CA',
  defaultOgImage: '/og/default.png',
} as const;

/** True while a config value is still a [placeholder]. */
export const isPlaceholder = (v: string | null | undefined) => !v || /^\[.*\]$/.test(v.trim());

export const hasPhone = () => !isPlaceholder(SITE.phone);
export const phoneHref = () => (hasPhone() ? `tel:${SITE.phone.replace(/[^\d+]/g, '')}` : null);

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
  { label: 'Fulfillment (3PL)', href: '/services/fulfillment', description: 'Receiving, storage, pick and pack' },
  { label: 'Final mile delivery', href: '/services/final-mile-delivery', description: 'Next day across the GTA' },
  { label: 'Same day delivery', href: '/services/same-day-delivery', description: 'Order by late morning, delivered today' },
  { label: 'Returns', href: '/services/returns', description: 'Pickup, inspection, restock' },
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
