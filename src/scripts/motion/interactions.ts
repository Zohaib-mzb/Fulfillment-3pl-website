/**
 * Pointer micro-interactions (no GSAP, ~2 KB): magnetic primary buttons, click ripple,
 * 3D card tilt, "selected" flash on card click, optional cursor dot.
 * Tilt / magnet / cursor only run on fine pointers and never under reduced motion.
 * All effects write CSS custom properties → the browser animates transform only.
 */
import { MAGNET, TILT, finePointer, prefersReducedMotion } from '@/lib/motion';

export function initInteractions(): () => void {
  const reduced = prefersReducedMotion();
  const fine = finePointer();
  const off: (() => void)[] = [];
  const on = <K extends keyof DocumentEventMap>(type: K, fn: (e: DocumentEventMap[K]) => void, opts?: AddEventListenerOptions) => {
    document.addEventListener(type, fn as EventListener, opts);
    off.push(() => document.removeEventListener(type, fn as EventListener, opts));
  };

  /* ripple from the click point (buttons) */
  on('pointerdown', (e) => {
    if (reduced) return;
    const btn = (e.target as Element).closest<HTMLElement>('.btn');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const dot = document.createElement('span');
    dot.className = 'ripple';
    dot.style.left = `${e.clientX - r.left}px`;
    dot.style.top = `${e.clientY - r.top}px`;
    dot.style.setProperty('--r', String(Math.ceil(Math.hypot(r.width, r.height) / 6)));
    btn.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove(), { once: true });
  });

  /* "selected" state on card click, just before navigating */
  on('click', (e) => {
    const card = (e.target as Element).closest<HTMLElement>('.card-motion');
    if (!card || !(e.target as Element).closest('a')) return;
    card.classList.add('is-selected');
    setTimeout(() => card.classList.remove('is-selected'), 600);
  });

  if (!reduced && fine) {
    /* magnetic primary buttons + card tilt (rAF-throttled) */
    let raf = 0;
    let last: PointerEvent | null = null;
    let magnet: HTMLElement | null = null;
    let tilt: HTMLElement | null = null;
    const frame = () => {
      raf = 0;
      const e = last;
      if (!e) return;
      const target = e.target as Element;
      const btn = target.closest?.<HTMLElement>('.btn-primary');
      if (magnet && magnet !== btn) { magnet.style.removeProperty('--mx'); magnet.style.removeProperty('--my'); }
      magnet = btn ?? null;
      if (btn) {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * MAGNET.strength;
        const dy = (e.clientY - (r.top + r.height / 2)) * MAGNET.strength;
        btn.style.setProperty('--mx', `${Math.max(-MAGNET.max, Math.min(MAGNET.max, dx)).toFixed(1)}px`);
        btn.style.setProperty('--my', `${Math.max(-MAGNET.max, Math.min(MAGNET.max, dy)).toFixed(1)}px`);
      }
      const card = target.closest?.<HTMLElement>('.card-motion');
      if (tilt && tilt !== card) { tilt.style.removeProperty('--rx'); tilt.style.removeProperty('--ry'); tilt.classList.remove('is-tilting'); }
      tilt = card ?? null;
      if (card) {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.classList.add('is-tilting');
        card.style.setProperty('--ry', `${(px * TILT.maxDeg * 2).toFixed(2)}deg`);
        card.style.setProperty('--rx', `${(-py * TILT.maxDeg * 2).toFixed(2)}deg`);
      }
      if (dot) {
        dot.style.setProperty('--cx', `${e.clientX}px`);
        dot.style.setProperty('--cy', `${e.clientY}px`);
        dot.classList.toggle('is-hot', !!target.closest?.('a, button, [role="button"], summary, label, input, select, textarea'));
      }
    };
    on('pointermove', (e) => { last = e; if (!raf) raf = requestAnimationFrame(frame); }, { passive: true });
    on('pointerleave' as keyof DocumentEventMap, () => { if (dot) dot.classList.remove('on'); });

    /* optional cursor dot — an extra, the native cursor always stays visible */
    let dot: HTMLElement | null = document.querySelector('.cursor-dot');
    if (!dot) {
      dot = document.createElement('div');
      dot.className = 'cursor-dot';
      dot.setAttribute('aria-hidden', 'true');
      document.body.appendChild(dot);
    }
    on('pointermove', () => dot?.classList.add('on'), { passive: true, once: true });
    off.push(() => { cancelAnimationFrame(raf); dot?.remove(); });
  }

  return () => off.forEach((f) => f());
}
