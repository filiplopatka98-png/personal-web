import { defineCollection } from 'astro:content';
import { projectSchema, postSchema, serviceSchema, testimonialSchema } from './schemas';

const projects = defineCollection({
  type: 'content',
  schema: ({ image }) => projectSchema.extend({
    cover: image(),
    gallery: image().array().default([]),
  }),
});

const posts = defineCollection({
  type: 'content',
  schema: ({ image }) => postSchema.extend({
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
