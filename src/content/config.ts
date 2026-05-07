import { defineCollection } from 'astro:content';
import { projectSchema, articleSchema, serviceSchema } from './schemas';

const projects = defineCollection({
  type: 'content',
  schema: projectSchema,
});

const articles = defineCollection({
  type: 'content',
  schema: articleSchema,
});

const services = defineCollection({
  type: 'content',
  schema: serviceSchema,
});

export const collections = {
  projects,
  articles,
  services,
};
