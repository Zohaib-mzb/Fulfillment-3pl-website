import { getCollection, type CollectionEntry } from 'astro:content';
import readingTime from 'reading-time';

export type Post = CollectionEntry<'blog'>;

export async function getPosts() {
  const posts = await getCollection('blog', (p) => import.meta.env.DEV || !p.data.draft);
  return posts.sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf());
}

export const minutes = (p: Post) => Math.max(1, Math.round(readingTime(p.body ?? '').minutes));
export const words = (p: Post) => readingTime(p.body ?? '').words;

export const fmtDate = (d: Date) => d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

/** Related posts: same category first, then most recent. */
export function related(all: Post[], current: Post, n = 3) {
  const others = all.filter((p) => p.id !== current.id);
  const same = others.filter((p) => p.data.category === current.data.category);
  return [...same, ...others.filter((p) => !same.includes(p))].slice(0, n);
}
