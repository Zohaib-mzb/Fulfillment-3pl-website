/** Reading progress for blog posts and job pages: a tiny van drives across the top (transform only). */
export function initReadProgress(): () => void {
  const bar = document.querySelector<HTMLElement>('[data-read-progress]');
  const article = document.querySelector<HTMLElement>(bar?.dataset.readProgress || 'article');
  if (!bar || !article) return () => {};
  let raf = 0;
  const update = () => {
    raf = 0;
    const r = article.getBoundingClientRect();
    const total = Math.max(1, r.height - innerHeight * 0.6);
    const p = Math.min(1, Math.max(0, -r.top / total));
    bar.style.setProperty('--p', p.toFixed(4));
    bar.toggleAttribute('data-done', p > 0.985);
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  update();
  return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
}
