/**
 * Page lifecycle that works with Astro View Transitions (<ClientRouter />) and without.
 * `onPage(fn)` runs `fn` on every page load (initial + client-side navigations).
 * If `fn` returns a cleanup, it runs before the next page swaps in.
 */
type Cleanup = void | (() => void);

const routerOn = () => !!document.querySelector('meta[name="astro-view-transitions-enabled"]');

export function onPage(fn: () => Cleanup) {
  let cleanup: Cleanup;
  const run = () => {
    if (typeof cleanup === 'function') cleanup();
    cleanup = fn();
  };
  if (routerOn()) {
    document.addEventListener('astro:page-load', run);
    document.addEventListener('astro:before-swap', () => {
      if (typeof cleanup === 'function') cleanup();
      cleanup = undefined;
    });
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}

/** requestIdleCallback with a timeout fallback (Safari). */
export function whenIdle(cb: () => void, timeout = 1500) {
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  if (ric) ric(cb, { timeout });
  else setTimeout(cb, Math.min(timeout, 300));
}

let lcpSettled: Promise<void> | null = null;
/**
 * Resolves once the Largest Contentful Paint has been painted and gone quiet (or after a cap).
 * Heavy, non-critical requests (hero video, 3D chunk, GSAP) start after this, so they never
 * compete with the LCP image on slow networks.
 */
function lcpDone(): Promise<void> {
  if (lcpSettled) return lcpSettled;
  lcpSettled = new Promise<void>((resolve) => {
    let quiet: ReturnType<typeof setTimeout> | undefined;
    const done = () => { obs?.disconnect(); resolve(); };
    const cap = setTimeout(done, 3000);
    let obs: PerformanceObserver | undefined;
    try {
      obs = new PerformanceObserver(() => { clearTimeout(quiet); quiet = setTimeout(() => { clearTimeout(cap); done(); }, 400); });
      obs.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch { clearTimeout(cap); setTimeout(done, 800); }
  });
  return lcpSettled;
}

/** After `load`, after LCP has painted, then idle — keeps heavy work off the critical path. */
export function afterLoadIdle(cb: () => void, timeout = 2000) {
  const go = () => lcpDone().then(() => whenIdle(cb, timeout));
  if (document.readyState === 'complete') go();
  else window.addEventListener('load', go, { once: true });
}
