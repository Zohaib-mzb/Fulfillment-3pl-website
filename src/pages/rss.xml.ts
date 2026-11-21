import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '@/lib/blog';
import { SITE } from '@/config/site';

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: `${SITE.brand} blog`,
    description: 'Guides on 3PL fulfillment, GTA delivery, Shopify, returns and EV delivery.',
    site: context.site ?? SITE.url,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.published,
      link: `/blog/${p.id}`,
      categories: [p.data.category],
      author: `${SITE.email} (${p.data.author})`,
    })),
    customData: '<language>en-CA</language>',
  });
}
