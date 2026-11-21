/**
 * Site-wide motion bootstrap (runs on every page, survives View Transitions).
 * - micro-interactions + reading progress: immediately (tiny, vanilla)
 * - scroll choreography: GSAP is lazy-loaded after load + idle, skipped under reduced motion
 * - page-transition progress line (Astro <ClientRouter /> events)
 */
import { onPage, afterLoadIdle } from '@/scripts/lifecycle';
import { prefersReducedMotion } from '@/lib/motion';
import { initInteractions } from './interactions';
import { initReadProgress } from './read-progress';

onPage(() => {
  const cleanups: (() => void)[] = [initInteractions(), initReadProgress()];
  let disposed = false;
  if (!prefersReducedMotion()) {
    afterLoadIdle(async () => {
      if (disposed) return;
      const { initScroll } = await import('./scroll');
      if (disposed) return;
      cleanups.push(await initScroll());
    }, 1200);
  }
  return () => {
    disposed = true;
    cleanups.forEach((c) => c());
  };
});

/* thin teal line across the top during client-side navigation */
const bar = () => document.querySelector<HTMLElement>('.nav-progress');
document.addEventListener('astro:before-preparation', () => {
  const b = bar();
  if (!b) return;
  b.classList.remove('is-done');
  void b.offsetWidth;
  b.classList.add('is-loading');
});
document.addEventListener('astro:after-swap', () => {
  document.documentElement.classList.add('js');
  const b = bar();
  if (!b) return;
  b.classList.remove('is-loading');
  b.classList.add('is-done');
});
