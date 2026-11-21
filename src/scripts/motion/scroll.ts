/**
 * Scroll choreography (GSAP + ScrollTrigger + SplitText), lazy-loaded per page after
 * load + idle, never under prefers-reduced-motion. Everything is two-way: it plays when
 * scrolling down and reverses smoothly when scrolling back up.
 *
 *  - cards & list items rise 48 px + fade, 75 ms stagger      (auto: .card-motion, grids, FAQ rows, [data-reveal])
 *  - section headings reveal word by word                     (auto: main h2)
 *  - images / illustrations unmask with a clip-path wipe       ([data-unmask])
 *  - dotted teal route line down the side of long pages, drawn by scroll, parcel travels on it
 *  - homepage story: the same route connects the six chapters
 *  - parallax decor                                            ([data-parallax="0.2"])
 *  - city mini-map route draw                                  ([data-route-draw])
 * Only elements that start BELOW the fold get a hidden start state, so nothing visible flashes.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DUR, EASE_GSAP, REVEAL } from '@/lib/motion';

gsap.registerPlugin(ScrollTrigger, SplitText);

const EXCLUDE = '[data-hero], #story .story-stage-wrap, header, footer, form, nav, .no-reveal';
const TWO_WAY = 'play reverse play reverse';
const belowFold = (el: Element) => el.getBoundingClientRect().top > innerHeight * 0.92;
const ok = (el: Element) => !el.closest(EXCLUDE);

export async function initScroll(): Promise<() => void> {
  const main = document.querySelector<HTMLElement>('main');
  if (!main) return () => {};
  document.documentElement.classList.add('motion-on');

  const ctx = gsap.context(() => {
    /* ── cards & list items ── */
    const candidates = Array.from(
      main.querySelectorAll<HTMLElement>('.card-motion, [data-reveal], ul.grid > li, ol.grid > li, .faq details, dl.grid > div, .story-card'),
    ).filter(ok);
    const set = new Set(candidates);
    const items = candidates.filter((el) => {
      for (let p = el.parentElement; p && p !== main; p = p.parentElement) if (set.has(p)) return false;
      return belowFold(el);
    });
    if (items.length) {
      gsap.set(items, { autoAlpha: 0, y: REVEAL.y });
      ScrollTrigger.batch(items, {
        start: 'top 90%',
        end: 'bottom 4%',
        onEnter: (b) => gsap.to(b, { autoAlpha: 1, y: 0, duration: DUR.reveal, ease: EASE_GSAP, stagger: REVEAL.stagger, overwrite: true, clearProps: 'transform,opacity,visibility' }),
        onEnterBack: (b) => gsap.to(b, { autoAlpha: 1, y: 0, duration: DUR.reveal, ease: EASE_GSAP, stagger: REVEAL.stagger, overwrite: true, clearProps: 'transform,opacity,visibility' }),
        onLeaveBack: (b) => gsap.to(b, { autoAlpha: 0, y: REVEAL.y, duration: DUR.base, ease: 'power2.in', stagger: 0.03, overwrite: true }),
      });
    }

    /* ── headings, word by word (SplitText keeps an aria-label on the heading) ── */
    main.querySelectorAll<HTMLElement>('h2').forEach((h) => {
      if (!ok(h) || !belowFold(h) || h.closest('.faq summary') || h.classList.contains('sr-only')) return;
      if (Array.from(h.childNodes).some((n) => n.nodeType === 1 && (n as Element).tagName !== 'BR')) return; // only plain-text headings
      const split = SplitText.create(h, { type: 'words', mask: 'words', aria: 'auto', wordsClass: 'word' });
      gsap.from(split.words, {
        yPercent: 110, duration: DUR.reveal, ease: EASE_GSAP, stagger: REVEAL.wordStagger,
        scrollTrigger: { trigger: h, start: 'top 88%', end: 'bottom top', toggleActions: TWO_WAY },
      });
    });

    /* ── image / illustration unmask ── */
    main.querySelectorAll<HTMLElement>('[data-unmask]').forEach((el) => {
      if (!ok(el) || !belowFold(el)) return;
      gsap.fromTo(el, { clipPath: 'inset(0% 100% 0% 0% round 1.25rem)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 1.25rem)', duration: 0.9, ease: EASE_GSAP,
        scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom top', toggleActions: TWO_WAY },
        clearProps: 'clipPath',
      });
    });

    /* ── parallax decor ── */
    main.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
      const speed = Number(el.dataset.parallax) || 0.15;
      gsap.fromTo(el, { y: () => -speed * 120 }, {
        y: () => speed * 120, ease: 'none',
        scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true },
      });
    });

    /* ── city mini-map route ── */
    main.querySelectorAll<SVGGElement>('[data-route-draw]').forEach((g) => {
      const line = g.querySelector('.map-route');
      const stops = g.querySelectorAll('.map-stop');
      const tl = gsap.timeline({ scrollTrigger: { trigger: g.closest('svg') ?? g, start: 'top 85%', end: 'bottom top', toggleActions: TWO_WAY } });
      if (line) tl.fromTo(line, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.6, ease: 'power2.inOut' });
      tl.fromTo(stops, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.35, ease: 'back.out(2)', stagger: 0.28 }, 0.25);
    });

    /* ── route lines: down the side of long pages + through the homepage story ── */
    if (innerWidth >= 1328 && main.scrollHeight > innerHeight * 2.6 && !document.querySelector('[data-no-side-route]')) buildRoute(main, 'side');
    const story = document.querySelector<HTMLElement>('[data-story-body]');
    if (story) buildRoute(story, 'story');
  }, main);

  // late layout changes (fonts, images, the 3D story) → recompute trigger positions
  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener('load', refresh, { once: true });
  document.fonts?.ready.then(refresh);

  return () => {
    ctx.revert();
    document.querySelectorAll('.side-route').forEach((n) => n.remove());
    document.documentElement.classList.remove('motion-on');
  };
}

/**
 * Dotted teal route that draws itself as you scroll (clip-path wipe — no stroke animation),
 * with a parcel travelling along it and stop dots at each section; the final dot is orange.
 */
function buildRoute(host: HTMLElement, kind: 'side' | 'story') {
  const hostRect = host.getBoundingClientRect();
  const H = host.offsetHeight;
  if (H < 400) return;
  const sections = kind === 'side'
    ? Array.from(host.querySelectorAll<HTMLElement>(':scope > section, :scope > div > section')).filter((s) => s.offsetHeight > 120)
    : Array.from(host.querySelectorAll<HTMLElement>('[data-chapter]'));
  const stopsY = sections.map((s) => s.getBoundingClientRect().top - hostRect.top + (kind === 'story' ? s.offsetHeight / 2 : 40)).filter((y) => y > 0 && y < H);
  const W = 44;
  const x0 = W / 2;
  // gentle S-bends between stops
  let d = `M${x0} ${Math.max(0, (stopsY[0] ?? 40) - 40)}`;
  const ys = [...stopsY, H - 30];
  ys.forEach((y, i) => {
    const prev = i === 0 ? Math.max(0, (stopsY[0] ?? 40) - 40) : ys[i - 1];
    const bend = (i % 2 ? -1 : 1) * 10;
    d += ` C ${x0 + bend} ${prev + (y - prev) * 0.35}, ${x0 - bend} ${prev + (y - prev) * 0.65}, ${x0} ${y}`;
  });
  const el = document.createElement('div');
  el.className = 'side-route';
  el.setAttribute('aria-hidden', 'true');
  el.style.height = `${H}px`;
  if (kind === 'side') {
    const container = document.querySelector('.container-site');
    const left = container ? container.getBoundingClientRect().left - hostRect.left + 4 - W : 12;
    el.style.left = `${Math.max(6, left)}px`;
  } else {
    const card = host.querySelector('.story-text');
    const left = card ? card.getBoundingClientRect().left - hostRect.left - W - 8 : 8;
    el.style.left = `${Math.max(4, left)}px`;
  }
  const ns = 'http://www.w3.org/2000/svg';
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <path d="${d}" fill="none" stroke="#D9DEE4" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="0 9"/>
      <g class="route-draw"><path d="${d}" fill="none" stroke="#12B5A6" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="0 9"/></g>
      ${ys.map((y, i) => `<circle class="route-stop" cx="${x0}" cy="${y}" r="${i === ys.length - 1 ? 6 : 5}" fill="${i === ys.length - 1 ? '#FF6A3D' : '#fff'}" stroke="${i === ys.length - 1 ? '#FF6A3D' : '#12B5A6'}" stroke-width="2.5"/>`).join('')}
    </svg>
    <svg class="side-route__parcel" viewBox="0 0 22 20"><rect x="1" y="3" width="20" height="16" rx="3" fill="#F4F6F8" stroke="#C5CDD6"/><rect x="9" y="3" width="4" height="16" fill="#12B5A6"/></svg>`;
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  host.appendChild(el);
  void ns;
  const path = el.querySelector<SVGPathElement>('.route-draw path')!;
  const draw = el.querySelector<SVGGElement>('.route-draw')!;
  const parcel = el.querySelector<SVGSVGElement>('.side-route__parcel')!;
  const stops = Array.from(el.querySelectorAll<SVGCircleElement>('.route-stop'));
  const len = path.getTotalLength();
  gsap.set(stops, { scale: 0.001, transformOrigin: '50% 50%' });
  const state = { p: 0 };
  const lit = new Set<number>();
  gsap.to(state, {
    p: 1,
    ease: 'none',
    scrollTrigger: { trigger: host, start: 'top 60%', end: 'bottom 70%', scrub: 0.5 },
    onUpdate: () => {
      const y = state.p * H;
      draw.style.clipPath = `inset(0 0 ${Math.max(0, 100 - state.p * 100)}% 0)`;
      const pt = path.getPointAtLength(state.p * len);
      parcel.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0)`;
      ys.forEach((sy, i) => {
        const on = y >= sy - 4;
        if (on && !lit.has(i)) { lit.add(i); gsap.to(stops[i], { scale: 1, duration: 0.35, ease: 'back.out(2.2)' }); }
        if (!on && lit.has(i)) { lit.delete(i); gsap.to(stops[i], { scale: 0.001, duration: 0.25, ease: 'power2.in' }); }
      });
    },
  });
}
