import { z } from 'zod';

const langEnum = z.enum(['sk', 'en']);

/**
 * Image stub for testing context — accepts string (path) or any object with `src`.
 * In Astro builds, this gets replaced by Astro's image() in config.ts via .extend().
 */
const imageStub = z.union([
  z.string(),
  z.object({ src: z.string() }).passthrough(),
]);

export const projectSchema = z.object({
  slugKey: z.string(),
  slug: z.string(),
  lang: langEnum,
  title: z.string().min(1),
  client: z.string().optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  role: z.string().optional(),
  tags: z.array(z.string()).default([]),
  cover: imageStub,
  gallery: z.array(imageStub).default([]),
  url: z.string().url().optional(),
  excerpt: z.string().min(1),
  featured: z.boolean().default(false),
  order: z.number().int().default(999),
});

export const postSchema = z.object({
  slugKey: z.string(),
  slug: z.string(),
  lang: langEnum,
  title: z.string().min(1),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  cover: imageStub.optional(),
  excerpt: z.string().min(1),
  draft: z.boolean().default(false),
});

export const serviceSchema = z.object({
  slugKey: z.string(),
  lang: langEnum,
  title: z.string().min(1),
  icon: z.string(),
  order: z.number().int().default(999),
  priceFrom: z.string().optional(),
  ctaLabel: z.string().min(1),
});

export const testimonialSchema = z.object({
  quote: z.string().min(10),
  author: z.string().min(1),
  role: z.string().min(1),
  photo: imageStub.optional(),
  projectKey: z.string().optional(),
  lang: langEnum,
  featured: z.boolean().default(false),
});
