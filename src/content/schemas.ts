import { z } from 'zod';

const accentEnum = z.enum(['accent', 'accent2', 'accent3']);

// Project schema per CONTENT_SCHEMA.md
export const projectSchema = z.object({
  name: z.string().min(1),
  kind: z.string().min(1),
  year: z.coerce.string(),
  role: z.string().min(1),
  duration: z.string().min(1),
  client: z.string().min(1),
  url: z.string().min(1).optional(),
  accent: accentEnum.default('accent'),
  order: z.number().int().default(999),
  featured: z.boolean().default(false),
  brief: z.string().min(10),
  metrics: z.array(z.object({
    value: z.string().min(1),
    label: z.string().min(1),
  })).default([]),
  process: z.array(z.object({
    title: z.string().min(1),
    duration: z.string().min(1),
    desc: z.string().min(1),
  })).default([]),
  stack: z.array(z.string()).default([]),
  // Per-language captions for the 3 mockup slots in the project page.
  // When omitted, the template falls back to generic strings (data.url for hero,
  // localized "mobile view" for mobile, "—" for secondary).
  heroCaption: z.string().optional(),
  mobileCaption: z.string().optional(),
  secondaryCaption: z.string().optional(),
});

// Article schema per CONTENT_SCHEMA.md
export const articleSchema = z.object({
  title: z.string().min(1),
  date: z.coerce.date(),
  read: z.number().int().min(1).default(5),
  tags: z.array(z.string()).default([]),
  excerpt: z.string().min(10),
  featured: z.boolean().default(false),
});

// Service schema per CONTENT_SCHEMA.md
export const serviceSchema = z.object({
  order: z.number().int().default(999),
  name: z.string().min(1),
  price: z.string().min(1),
  duration: z.string().min(1),
  tagline: z.string().min(1),
  desc: z.string().min(10),
  featured: z.boolean().default(false),
  includes: z.array(z.string()).min(1),
  notFor: z.string().optional(),
});

// Inferred types for consumer use
export type Project = z.infer<typeof projectSchema>;
export type Article = z.infer<typeof articleSchema>;
export type Service = z.infer<typeof serviceSchema>;
