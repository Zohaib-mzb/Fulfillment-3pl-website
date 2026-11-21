/**
 * Motion tokens — the single source of truth for timing and easing.
 * CSS mirrors these as custom properties in src/styles/global.css (--dur-*, --ease-brand).
 * Brand easing = "ease-out quint": quick start, long soft landing (things arriving at a door).
 */
export const DUR = {
  /** micro feedback: press, ripple start, focus ring */
  fast: 0.15,
  /** hovers, small state changes */
  base: 0.3,
  /** reveals, step slides */
  reveal: 0.6,
} as const;

/** CSS cubic-bezier for the brand curve, and its GSAP equivalent. */
export const EASE_CSS = 'cubic-bezier(0.22, 1, 0.36, 1)';
export const EASE_GSAP = 'power4.out';
/** Symmetric ease for camera moves and scrubbed timelines. */
export const EASE_INOUT_GSAP = 'power2.inOut';

export const REVEAL = {
  /** card/list rise distance (px) */
  y: 48,
  /** stagger between siblings (s) — 75 ms sits in the 60–90 ms brief */
  stagger: 0.075,
  /** word-by-word heading stagger (s) */
  wordStagger: 0.045,
} as const;

export const TILT = { maxDeg: 6, lift: 4 } as const;
export const MAGNET = { strength: 0.22, max: 8 } as const;

export const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => typeof matchMedia !== 'undefined' && matchMedia('(hover: hover) and (pointer: fine)').matches;
