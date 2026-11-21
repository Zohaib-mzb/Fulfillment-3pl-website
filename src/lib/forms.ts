/**
 * Form definitions shared by the UI and the /api/submit handler.
 * Server-side validation is the source of truth; the browser only helps.
 */
export type FormId = 'quote' | 'contact' | 'careers' | 'driver';

export const MONTHLY_ORDERS = ['Under 300', '300 to 1,000', '1,000 to 3,000', '3,000 to 10,000', 'Over 10,000', 'Not sure yet'] as const;
export const SERVICES_NEEDED = ['Fulfillment (storage, pick and pack)', 'Next day delivery in the GTA', 'Same day delivery', 'Returns', 'B2B / wholesale orders', 'Kitting and bundles'] as const;
export const CURRENT_CARRIERS = ['Canada Post', 'Courier or national carrier', 'Local delivery company', 'Another 3PL', 'We deliver ourselves', 'Just getting started', 'Other'] as const;
export const CONTACT_TOPICS = ['Sales question', 'Existing account', 'A delivery or tracking question', 'Partnerships', 'Media', 'Something else'] as const;
export const DRIVER_TYPES = ['Independent driver (my own vehicle)', 'Fleet operator (multiple vehicles)'] as const;
export const VEHICLE_TYPES = ['Electric van', 'Cargo van', 'Car / SUV', 'Box truck', 'Other'] as const;

type Rule = { required?: boolean; max?: number; email?: boolean; url?: boolean; oneOf?: readonly string[]; many?: readonly string[] };
type Schema = Record<string, Rule>;

export const FORM_SCHEMAS: Record<FormId, Schema> = {
  quote: {
    company: { required: true, max: 120 },
    name: { required: true, max: 100 },
    email: { required: true, email: true, max: 200 },
    phone: { max: 40 },
    website: { max: 200 },
    monthly_orders: { required: true, oneOf: MONTHLY_ORDERS },
    services: { many: SERVICES_NEEDED },
    current_carrier: { oneOf: CURRENT_CARRIERS },
    notes: { max: 4000 },
  },
  contact: {
    name: { required: true, max: 100 },
    email: { required: true, email: true, max: 200 },
    company: { max: 120 },
    topic: { required: true, oneOf: CONTACT_TOPICS },
    message: { required: true, max: 5000 },
  },
  careers: {
    name: { required: true, max: 100 },
    email: { required: true, email: true, max: 200 },
    phone: { required: true, max: 40 },
    role: { required: true, max: 120 },
    licence: { max: 40 },
    location: { max: 120 },
    message: { max: 4000 },
  },
  driver: {
    name: { required: true, max: 100 },
    email: { required: true, email: true, max: 200 },
    phone: { required: true, max: 40 },
    driver_type: { required: true, oneOf: DRIVER_TYPES },
    company: { max: 120 },
    vehicles: { max: 10 },
    vehicle_type: { many: VEHICLE_TYPES },
    city: { max: 80 },
    notes: { max: 4000 },
  },
};

export const FORM_LABELS: Record<FormId, string> = {
  quote: 'Quote request',
  contact: 'Contact message',
  careers: 'Job application',
  driver: 'Driver / fleet partner application',
};

/** Conversion event names sent to analytics (only after cookie consent). */
export const CONVERSION_EVENTS: Record<FormId, string> = {
  quote: 'quote_submit',
  contact: 'contact_submit',
  careers: 'apply_submit',
  driver: 'apply_submit',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validate(form: FormId, data: Record<string, string | string[]>) {
  const errors: Record<string, string> = {};
  const clean: Record<string, string | string[]> = {};
  for (const [field, rule] of Object.entries(FORM_SCHEMAS[form])) {
    const raw = data[field];
    if (rule.many) {
      const arr = (Array.isArray(raw) ? raw : raw ? [raw] : []).filter((v) => rule.many!.includes(v));
      clean[field] = arr;
      continue;
    }
    const v = (Array.isArray(raw) ? raw[0] : raw ?? '').toString().trim();
    if (rule.required && !v) { errors[field] = 'This field is required.'; continue; }
    if (rule.max && v.length > rule.max) errors[field] = `Please keep this under ${rule.max} characters.`;
    if (v && rule.email && !EMAIL_RE.test(v)) errors[field] = 'Please enter a valid email address.';
    if (v && rule.oneOf && !rule.oneOf.includes(v)) errors[field] = 'Please choose one of the options.';
    clean[field] = v;
  }
  return { ok: Object.keys(errors).length === 0, errors, clean };
}
