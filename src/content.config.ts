import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const BLOG_CATEGORIES = {
  fulfillment: 'Fulfillment',
  delivery: 'Delivery',
  shopify: 'Shopify',
  returns: 'Returns',
  sustainability: 'Sustainability',
} as const;
export type BlogCategory = keyof typeof BLOG_CATEGORIES;

const qa = z.object({ q: z.string(), a: z.string() });

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      /** H1. The <title> tag uses seoTitle (≤ 60). */
      title: z.string().max(100),
      /** Meta description, ≤ 155 characters. */
      description: z.string().max(155),
      /** SEO <title>; defaults to `${title} | Kinematics` when it fits in 60 characters. */
      seoTitle: z.string().max(60).optional(),
      /** 2–3 sentence direct answer shown at the top of the post (AEO). */
      answer: z.string(),
      published: z.coerce.date(),
      updated: z.coerce.date().optional(),
      author: z.string().default('Kinematics Team'),
      category: z.enum(Object.keys(BLOG_CATEGORIES) as [BlogCategory, ...BlogCategory[]]),
      cover: image(),
      coverAlt: z.string(),
      faqs: z.array(qa).min(2),
      relatedServices: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
    }),
});

const careers = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/careers' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().max(200),
    location: z.string(),
    city: z.string().default('Toronto'),
    department: z.enum(['Operations', 'Delivery', 'Warehouse', 'Dispatch', 'Corporate']),
    employmentType: z.array(z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'TEMPORARY'])),
    published: z.coerce.date(),
    validThrough: z.coerce.date().optional(),
    open: z.boolean().default(true),
    /** Pay ranges are intentionally never shown (pages or schema), per the owner's decision. */
    existingVacancy: z.boolean().default(true),
  }),
});

export const collections = { blog, careers };
