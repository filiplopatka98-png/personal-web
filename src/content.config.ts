import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { projectSchema, articleSchema, serviceSchema } from './content/schemas';

// Astro 6 removed legacy content collections — collections now use the Content
// Layer with an explicit loader. The glob loader derives each entry `id` from
// its path relative to `base` (without extension), e.g. "sk/krivosik" — same
// value the old `entry.slug` produced, so downstream locale filtering is
// unchanged (just entry.slug → entry.id, entry.render() → render(entry)).
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: projectSchema,
});

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: articleSchema,
});

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: serviceSchema,
});

export const collections = {
  projects,
  articles,
  services,
};
