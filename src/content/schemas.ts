import { z } from 'zod';

export const langEnum = z.enum(['sk', 'en']);

/**
 * Cross-language pair identifier — must match between SK/EN versions of the
 * same logical content. Empty string would silently break pairing.
 */
const slugKey = z.string().min(1);

/**
 * URL-safe slug — only lowercase letters, digits, and hyphens.
 * Catches authoring mistakes (spaces, accented chars, slashes) at build time.
 */
const urlSlug = z.string().regex(
  /^[a-z0-9-]+$/,
  'Slug must contain only lowercase letters, digits, and hyphens'
);

/**
 * Image stub for testing context — accepts string (path) or any object with `src`.
 * In Astro builds, this gets replaced by Astro's image() in config.ts via .extend().
 */
const imageStub = z.union([
  z.string(),
  z.object({ src: z.string() }).passthrough(),
]);

export const projectSchema = z.object({
  slugKey,
  slug: urlSlug,
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
  slugKey,
  slug: urlSlug,
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
  slugKey,
  lang: langEnum,
  title: z.string().min(1),
  icon: z.string(),
  order: z.number().int().default(999),
  priceFrom: z.string().optional(),
  ctaLabel: z.string().min(1),
});

/**
 * Testimonials don't have their own URL — they're embedded on home/services/contact
 * pages. So no `slug`/`slugKey`. The optional `projectKey` links a quote back to
 * the project it's about (matches a project's `slugKey`).
 */
export const testimonialSchema = z.object({
  quote: z.string().min(10),
  author: z.string().min(1),
  role: z.string().min(1),
  photo: imageStub.optional(),
  projectKey: z.string().optional(),
  lang: langEnum,
  featured: z.boolean().default(false),
});

// Inferred types for consumers (Astro pages, helper modules).
export type Project = z.infer<typeof projectSchema>;
export type Post = z.infer<typeof postSchema>;
export type Service = z.infer<typeof serviceSchema>;
export type Testimonial = z.infer<typeof testimonialSchema>;
export type Lang = z.infer<typeof langEnum>;
