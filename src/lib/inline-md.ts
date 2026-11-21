/** Tiny, safe inline-markdown renderer for data-file copy: [links](/x), **bold**, paragraphs. */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function inline(s: string) {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, t, h) => `<a class="link" href="${h}">${t}</a>`);
}
export function marked(s: string) {
  return s.split(/\n{2,}/).map((p) => `<p class="mt-2 first:mt-0">${inline(p.trim())}</p>`).join('');
}
