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

export function enhanceForms() {
  document.querySelectorAll<HTMLFormElement>('form[data-kin-form]').forEach((form) => {
    if (form.dataset.enhanced) return;
    form.dataset.enhanced = 'true';
    const t = form.querySelector<HTMLInputElement>('input[name="_t"]');
    if (t) t.value = String(Date.now());
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
        if (json.errors) {
          Object.entries(json.errors).forEach(([k, v]) => setError(form, k, v));
          const first = form.querySelector<HTMLElement>('[aria-invalid="true"]');
          if (steps && first) steps.show(Math.max(0, steps.stepOf(first)));
          first?.focus();
        }
        formError.textContent = json.message || 'Please check the highlighted fields and try again.';
        formError.classList.remove('hidden');
      } catch {
        formError.textContent = 'Something went wrong sending your form. Please try again, or email info@kinematicstech.ca.';
        formError.classList.remove('hidden');
      } finally {
        submit.disabled = false;
        submit.textContent = original;
      }
    });
  });
}
