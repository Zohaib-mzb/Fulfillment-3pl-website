/**
 * Progressive enhancement for site forms (forms work as plain HTML posts without this).
 * - inline validation with accessible error messages
 * - multi-step navigation for forms with [data-steps]
 * - fetch submission, success state and conversion events (analytics only after consent)
 */
declare global {
  interface Window { kinTrack?: (name: string, props?: Record<string, unknown>) => void }
}

const EVENTS: Record<string, string> = { quote: 'quote_submit', contact: 'contact_submit', careers: 'apply_submit', driver: 'apply_submit' };

function setError(form: HTMLFormElement, name: string, msg: string) {
  const el = form.querySelector<HTMLElement>(`[data-error-for="${name}"]`);
  if (el) el.textContent = msg;
  form.querySelectorAll<HTMLInputElement>(`[name="${name}"]`).forEach((i) => {
    if (i.type !== 'radio' && i.type !== 'checkbox') i.setAttribute('aria-invalid', msg ? 'true' : 'false');
  });
  const group = form.querySelector(`[data-group="${name}"]`);
  if (group) group.toggleAttribute('data-invalid', Boolean(msg));
}

function validateScope(form: HTMLFormElement, scope: ParentNode): boolean {
  let firstInvalid: HTMLElement | null = null;
  const seen = new Set<string>();
  scope.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input[name], select[name], textarea[name]').forEach((el) => {
    if (el.type === 'hidden' || el.name === 'company_website' || seen.has(el.name)) return;
    seen.add(el.name);
    let msg = '';
    if (el instanceof HTMLInputElement && el.type === 'radio') {
      const group = el.closest('[data-group]');
      if (group?.hasAttribute('data-required') && !form.querySelector(`[name="${el.name}"]:checked`)) msg = 'Please choose an option.';
    } else if (el instanceof HTMLInputElement && el.type === 'checkbox') {
      return;
    } else if (!el.checkValidity()) {
      msg = el.validity.valueMissing ? 'This field is required.' : el.validity.typeMismatch && el.type === 'email' ? 'Please enter a valid email address.' : el.validationMessage;
    } else if (el instanceof HTMLInputElement && el.type === 'file' && el.files?.[0] && el.files[0].size > 4 * 1024 * 1024) {
      msg = 'Please attach a file under 4 MB.';
    }
    setError(form, el.name, msg);
    if (msg && !firstInvalid) firstInvalid = el;
  });
  if (firstInvalid) (firstInvalid as HTMLElement).focus();
  return !firstInvalid;
}

function setupSteps(form: HTMLFormElement) {
  const steps = Array.from(form.querySelectorAll<HTMLElement>('[data-step]'));
  if (steps.length < 2) return null;
  const back = form.querySelector<HTMLButtonElement>('[data-step-back]')!;
  const next = form.querySelector<HTMLButtonElement>('[data-step-next]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const progress = form.querySelector<HTMLElement>('[data-step-progress]');
  let i = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const show = (n: number, focus = true) => {
    const dir = n > i ? 1 : -1;
    const prev = steps[i];
    i = n;
    steps.forEach((s, k) => (s.hidden = k !== n));
    // horizontal slide between steps (transform + opacity only)
    if (focus && !reduced && prev !== steps[n]) {
      steps[n].animate(
        [{ transform: `translateX(${dir * 48}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 450, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      );
    }
    back.classList.toggle('hidden', n === 0);
    next.classList.toggle('hidden', n === steps.length - 1);
    submit.classList.toggle('hidden', n !== steps.length - 1);
    if (progress) {
      progress.textContent = `Step ${n + 1} of ${steps.length}`;
      form.querySelectorAll<HTMLElement>('[data-step-dot]').forEach((d, k) => d.toggleAttribute('data-active', k <= n));
    }
    if (focus) steps[n].querySelector<HTMLElement>('[data-step-title]')?.focus();
  };
  next.addEventListener('click', () => { if (validateScope(form, steps[i])) show(i + 1); });
  back.addEventListener('click', () => show(i - 1));
  show(0, false);
  return {
    stepOf: (el: Element) => steps.findIndex((s) => s.contains(el)),
    show,
    /** Enter pressed before the last step: behave like "Next". Returns true if handled. */
    advance: () => {
      if (i >= steps.length - 1) return false;
      if (validateScope(form, steps[i])) show(i + 1);
      return true;
    },
  };
}

/** Visible label text for a field (or its group legend), without the required / optional markers. */
function fieldLabel(form: HTMLFormElement, el: Element & { name: string; id: string }) {
  const lab = (el.id && form.querySelector(`label[for="${el.id}"]`)) || form.querySelector(`[data-group="${el.name}"] legend`);
  const t = (lab?.textContent || el.name.replace(/_/g, ' ')).replace(/\s*\*\s*$/, '').replace(/\s*\(optional\)\s*$/, '').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** "Field: value" lines for every filled field, skipping hidden, honeypot and file inputs. */
function emailLines(form: HTMLFormElement) {
  const rows: [string, string][] = [];
  const seen = new Set<string>();
  form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input[name], select[name], textarea[name]').forEach((el) => {
    if (el.type === 'hidden' || el.type === 'file' || el.name === 'company_website' || seen.has(el.name)) return;
    seen.add(el.name);
    if (el.name === 'casl_consent') { rows.push(['Marketing email consent', (el as HTMLInputElement).checked ? 'Yes' : 'No']); return; }
    const vals = el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox')
      ? Array.from(form.querySelectorAll<HTMLInputElement>(`[name="${el.name}"]:checked`)).map((i) => i.value)
      : [el.value.trim()];
    const v = vals.filter(Boolean).join(', ');
    if (v) rows.push([fieldLabel(form, el), v]);
  });
  return rows;
}

const SUBJECTS: Record<string, (v: (k: string) => string) => string> = {
  quote: (v) => `Quote request: ${v('company') || v('name')}`,
  contact: (v) => `Contact: ${v('name')}`,
  careers: (v) => `Job application: ${v('name')}`,
  driver: (v) => `Driver application: ${v('name')}`,
};

/** Form could not be sent by the server: hand the person a ready email instead of an error. */
function showFallback(form: HTMLFormElement) {
  const to = form.dataset.mailTo || 'info@kinematicstech.ca';
  const fd = new FormData(form);
  const v = (k: string) => String(fd.get(k) || '').trim();
  const subject = (SUBJECTS[form.dataset.kinForm!] ?? (() => 'Website enquiry'))(v);
  const date = new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto', dateStyle: 'long', timeStyle: 'short' });
  const body = [...emailLines(form).map(([k, val]) => `${k}: ${val}`), '', `Page: ${location.href.split('#')[0]}`, `Date: ${date} (Toronto time)`].join('\n');
  const enc = encodeURIComponent;
  // Keep the mailto link under about 1,800 characters (some mail apps cut longer links).
  let short = body;
  const mailto = () => `mailto:${to}?subject=${enc(subject)}&body=${enc(short)}`;
  while (mailto().length > 1800 && short.length > 200) short = short.slice(0, Math.floor(short.length * 0.9));
  if (short !== body) short += '\n[Shortened. Use Copy details on the website for the full text.]';
  while (mailto().length > 1800) short = short.slice(0, -50);
  const panel = form.querySelector<HTMLElement>('[data-form-fallback]')!;
  const gmail = panel.querySelector<HTMLAnchorElement>('[data-fallback-gmail]')!;
  const app = panel.querySelector<HTMLAnchorElement>('[data-fallback-mailto]')!;
  gmail.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(to)}&su=${enc(subject)}&body=${enc(body.slice(0, 6000))}`;
  app.href = mailto();
  if (matchMedia('(pointer: coarse)').matches) app.parentElement!.prepend(app);
  if (form.querySelector('input[type="file"]')) panel.querySelector<HTMLElement>('[data-fallback-resume]')!.hidden = false;
  const copy = panel.querySelector<HTMLButtonElement>('[data-fallback-copy]')!;
  const st = panel.querySelector<HTMLElement>('[data-fallback-status]')!;
  copy.onclick = async () => {
    const text = `To: ${to}\nSubject: ${subject}\n\n${body}`;
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = Object.assign(document.createElement('textarea'), { value: text });
      panel.append(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    st.textContent = `Copied. Paste it into an email to ${to}.`;
  };
  Array.from(form.children).forEach((c) => { if (c !== panel) (c as HTMLElement).hidden = true; });
  panel.classList.remove('hidden');
  panel.focus();
  window.kinTrack?.('form_fallback', { form: form.dataset.kinForm });
}

/** Prefill from the URL (start_quote links): text fields, selects and choices by name. Never consent. */
function prefill(form: HTMLFormElement) {
  const q = new URLSearchParams(location.search);
  q.forEach((val, key) => {
    if (key.startsWith('_') || key === 'form' || key === 'company_website' || key === 'casl_consent') return;
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[name="${CSS.escape(key)}"]`).forEach((el) => {
      if (el.type === 'hidden' || el.type === 'file') return;
      if (el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox')) { if (el.value === val) el.checked = true; }
      else el.value = val.slice(0, 500);
    });
  });
}

export function enhanceForms() {
  document.querySelectorAll<HTMLFormElement>('form[data-kin-form]').forEach((form) => {
    if (form.dataset.enhanced) return;
    form.dataset.enhanced = 'true';
    const t = form.querySelector<HTMLInputElement>('input[name="_t"]');
    if (t) t.value = String(Date.now());
    prefill(form);
    const steps = form.hasAttribute('data-steps') ? setupSteps(form) : null;
    const status = form.querySelector<HTMLElement>('[data-form-status]')!;
    const formError = form.querySelector<HTMLElement>('[data-form-error]')!;
    const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;

    form.addEventListener('input', (e) => {
      const el = e.target as HTMLInputElement;
      if (el.name && el.getAttribute('aria-invalid') === 'true' && el.checkValidity()) setError(form, el.name, '');
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      formError.classList.add('hidden');
      if (steps?.advance()) return;
      if (!validateScope(form, form)) {
        const bad = form.querySelector('[aria-invalid="true"], [data-invalid]');
        if (steps && bad) { steps.show(Math.max(0, steps.stepOf(bad))); validateScope(form, form); }
        return;
      }
      submit.disabled = true;
      const original = submit.textContent;
      submit.textContent = 'Sending…';
      status.textContent = 'Sending your form.';
      try {
        const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        const json = (await res.json().catch(() => ({}))) as { ok?: boolean; errors?: Record<string, string>; message?: string };
        if (res.ok && json.ok) {
          window.kinTrack?.(EVENTS[form.dataset.kinForm!] ?? 'form_submit', { form: form.dataset.kinForm });
          Array.from(form.children).forEach((c) => { if (!(c as HTMLElement).hasAttribute('data-form-success')) (c as HTMLElement).hidden = true; });
          const ok = form.querySelector<HTMLElement>('[data-form-success]')!;
          ok.classList.remove('hidden');
          ok.focus();
          status.textContent = 'Sent. Thank you.';
          return;
        }
        if (res.status === 422 && json.errors) {
          Object.entries(json.errors).forEach(([k, v]) => setError(form, k, v));
          const first = form.querySelector<HTMLElement>('[aria-invalid="true"]');
          if (steps && first) steps.show(Math.max(0, steps.stepOf(first)));
          first?.focus();
          formError.textContent = json.message || 'Please check the highlighted fields and try again.';
          formError.classList.remove('hidden');
          return;
        }
        // Sending failed (email not configured, server error, rate limit): offer the email fallback.
        showFallback(form);
      } catch {
        showFallback(form);
      } finally {
        submit.disabled = false;
        submit.textContent = original;
      }
    });
  });
}
