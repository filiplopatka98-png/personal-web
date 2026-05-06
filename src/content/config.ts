import { defineCollection } from 'astro:content';
import { projectSchema, postSchema, serviceSchema, testimonialSchema } from './schemas';

// `slug` is a reserved field in Astro content collections — it must not be
// present in the schema passed to defineCollection. The shared zod schema
// keeps `slug` for unit testing the regex; we strip it here so Astro can
// use the frontmatter `slug` value as the entry's URL slug (entry.slug).
const projects = defineCollection({
  type: 'content',
  schema: ({ image }) => projectSchema.omit({ slug: true }).extend({
    cover: image(),
    gallery: image().array().default([]),
  }),
});

const posts = defineCollection({
  type: 'content',
  schema: ({ image }) => postSchema.omit({ slug: true }).extend({
    cover: image().optional(),
  }),
});

const services = defineCollection({
  type: 'content',
  schema: serviceSchema,
});

const testimonials = defineCollection({
  type: 'content',
  schema: ({ image }) => testimonialSchema.extend({
    photo: image().optional(),
  }),
});

export const collections = {
  projects,
  posts,
  services,
  testimonials,
};
