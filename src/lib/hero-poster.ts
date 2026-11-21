/**
 * Poster frame for the hero film (rendered from the 3D scene by scripts/capture-hero.mjs).
 * Used by both <HeroFilm> (markup) and the homepage <head> (preload), so URLs match exactly.
 */
import { getImage } from 'astro:assets';
import poster from '@/assets/hero/poster.png';

export const POSTER_WIDTHS = [480, 720, 960, 1280, 1920];
// phones: the poster is a 16:10 band; at DPR ≥ 2 the 720w file is plenty sharp for a stylised render
export const POSTER_SIZES = '(min-width: 1024px) 100vw, (min-width: 640px) 100vw, 60vw';

export async function heroPoster() {
  const avif = await Promise.all(POSTER_WIDTHS.map((w) => getImage({ src: poster, width: w, format: 'avif', quality: w <= 720 ? 45 : 55 })));
  const webp = await Promise.all(POSTER_WIDTHS.map((w) => getImage({ src: poster, width: w, format: 'webp', quality: 70 })));
  const jpg = await getImage({ src: poster, width: 1280, format: 'jpg', quality: 72 });
  const set = (imgs: { src: string }[]) => imgs.map((im, i) => `${im.src} ${POSTER_WIDTHS[i]}w`).join(', ');
  return { avifSet: set(avif), webpSet: set(webp), fallback: jpg.src, width: 1920, height: 1080, sizes: POSTER_SIZES };
}
