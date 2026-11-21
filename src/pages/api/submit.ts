/**
 * POST /api/submit — the single form handler, run on demand by the Node server (@astrojs/node).
 * Handles quote, contact, careers and driver forms. Works with plain HTML form posts
 * (redirects to /thanks) and with fetch (returns JSON).
 * Spam protection: honeypot field, minimum fill time, origin check, rate limiting.
 */
import type { APIRoute } from 'astro';
import { sendMail, type Attachment } from '@/lib/email/providers';
import { validate, FORM_LABELS, type FormId } from '@/lib/forms';
import { rateLimit } from '@/lib/rate-limit';

export const prerender = false;

const FORMS: FormId[] = ['quote', 'contact', 'careers', 'driver'];
const MAX_UPLOAD = 4 * 1024 * 1024; // keep uploads small; one CV per application
const UPLOAD_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const label = (k: string) => k.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

function getEnv() {
  const p = typeof process !== 'undefined' ? process.env : {};
  return { ...(import.meta.env as Record<string, string | undefined>), ...p } as Record<string, string | undefined>;
}

function respond(request: Request, status: number, body: Record<string, unknown>, form?: string) {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  if (wantsJson) return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  const target = status < 300 ? `/thanks?form=${form ?? ''}` : `/thanks?error=${encodeURIComponent(String(body.code ?? 'error'))}&form=${form ?? ''}`;
  return new Response(null, { status: 303, headers: { Location: target } });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const env = getEnv();

  // Same-origin check (CSRF-ish) — allow when Origin is absent (some privacy browsers strip it).
  const origin = request.headers.get('origin');
  const site = env.PUBLIC_SITE_URL || 'https://kinematicstech.ca';
  if (origin && ![site, new URL(request.url).origin].some((o) => o === origin)) {
    return respond(request, 403, { ok: false, code: 'origin' });
  }

  let fd: FormData;
  try {
    fd = await request.formData();
  } catch {
    return respond(request, 400, { ok: false, code: 'bad_request' });
  }

  const form = String(fd.get('form') || '') as FormId;
  if (!FORMS.includes(form)) return respond(request, 400, { ok: false, code: 'unknown_form' });

  // Honeypot + time trap: pretend success so bots learn nothing.
  const startedAt = Number(fd.get('_t') || 0);
  if (String(fd.get('company_website') || '') !== '' || (startedAt && Date.now() - startedAt < 2500)) {
    return respond(request, 200, { ok: true }, form);
  }

  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || clientAddress || 'unknown';
  const rl = await rateLimit(`${form}:${ip}`, env, Number(env.FORM_RATE_LIMIT || 5), Number(env.FORM_RATE_WINDOW_SEC || 600));
  if (!rl.ok) return respond(request, 429, { ok: false, code: 'rate_limited', message: 'Too many submissions. Please try again in a few minutes or email us.' }, form);

  const data: Record<string, string | string[]> = {};
  for (const key of new Set(fd.keys())) {
    if (key.startsWith('_') || key === 'company_website' || key === 'form' || key === 'resume') continue;
    const all = fd.getAll(key).filter((v): v is string => typeof v === 'string');
    data[key] = all.length > 1 ? all : all[0] ?? '';
  }
  const { ok, errors, clean } = validate(form, data);
  if (!ok) return respond(request, 422, { ok: false, code: 'invalid', errors }, form);

  const marketingConsent = fd.get('casl_consent') === 'yes';
  const attachments: Attachment[] = [];
  const resume = fd.get('resume');
  if (resume && typeof resume !== 'string' && resume.size > 0) {
    if (resume.size > MAX_UPLOAD || !UPLOAD_TYPES.includes(resume.type)) {
      return respond(request, 422, { ok: false, code: 'invalid', errors: { resume: 'Please attach a PDF or Word file under 4 MB.' } }, form);
    }
    attachments.push({ filename: resume.name.replace(/[^\w.\- ]/g, '_').slice(0, 100), content: Buffer.from(await resume.arrayBuffer()).toString('base64'), contentType: resume.type });
  }

  const rows = Object.entries(clean).filter(([, v]) => (Array.isArray(v) ? v.length : v));
  const text = [
    `${FORM_LABELS[form]} from kinematicstech.ca`,
    '',
    ...rows.map(([k, v]) => `${label(k)}: ${Array.isArray(v) ? v.join(', ') : v}`),
    ...(form === 'quote' || form === 'contact' ? [`Marketing email consent (CASL): ${marketingConsent ? 'YES: express consent given' : 'no'}`] : []),
    '',
    `Page: ${String(fd.get('_page') || '')}`,
    `Submitted: ${new Date().toISOString()}`,
  ].join('\n');
  const html = `<h2 style="font-family:sans-serif">${esc(FORM_LABELS[form])}</h2><table cellpadding="6" style="font-family:sans-serif;border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><th align="left" valign="top" style="border-bottom:1px solid #eee">${esc(label(k))}</th><td style="border-bottom:1px solid #eee;white-space:pre-wrap">${esc(Array.isArray(v) ? v.join(', ') : v)}</td></tr>`)
    .join('')}${form === 'quote' || form === 'contact' ? `<tr><th align="left">Marketing consent (CASL)</th><td>${marketingConsent ? 'Yes: express consent given' : 'No'}</td></tr>` : ''}</table><p style="font-family:sans-serif;color:#5A6675">Page: ${esc(String(fd.get('_page') || ''))}</p>`;

  const name = String(clean.name || '').slice(0, 60);
  const subjectBits: Record<FormId, string> = {
    quote: `Quote request: ${clean.company} (${clean.monthly_orders}/mo)`,
    contact: `Contact: ${clean.topic}, ${name}`,
    careers: `Application: ${clean.role}, ${name}`,
    driver: `Driver partner: ${clean.driver_type}, ${name}`,
  };

  try {
    await sendMail(
      {
        to: env.EMAIL_TO || 'info@kinematicstech.ca',
        from: env.EMAIL_FROM || 'Kinematics Website <forms@kinematicstech.ca>',
        replyTo: String(clean.email || ''),
        subject: subjectBits[form],
        text,
        html,
        attachments,
        meta: { form, consent: marketingConsent, fields: clean },
      },
      env,
    );
  } catch (err) {
    console.error('[forms] send failed', err);
    return respond(request, 502, { ok: false, code: 'send_failed', message: 'We couldn’t send your message. Please email info@kinematicstech.ca.' }, form);
  }

  return respond(request, 200, { ok: true }, form);
};

export const ALL: APIRoute = () => new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
