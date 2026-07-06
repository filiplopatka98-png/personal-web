---
title: "Astro Content Collections + MDX for a blog: typesafe end-to-end"
date: 2026-01-22
read: 7
tags: ["Astro", "MDX", "TypeScript"]
excerpt: "A Zod schema catches a frontmatter typo at build time — not when a reader opens it as a 404. Setting up Content Collections + MDX for a type-safe blog in 20 minutes."
featured: false
---

In old Astro you read MDX files through `Astro.glob()` and `frontmatter.title` was `any`. A typo in the date? The build passed. The page blew up at runtime. Content Collections with a Zod schema flip that around: the build fails on **bad** frontmatter, and at runtime everything is already clean.

This is the setup I use on every blog project since Astro 4. In Astro 5 the config now lives in `src/content.config.ts` instead of `src/content/config.ts` — the old location still works via backward compatibility, but it's marked deprecated, so write new config straight into `src/content.config.ts`.

If you're still deciding whether Astro is even the right call for a given project, I put together a [decision table for Astro vs. Next.js](/en/blog/astro-vs-nextjs-tabulka/) that covers exactly that.

## Setup

```bash
npm install @astrojs/mdx
```

In `astro.config.mjs`:

```js
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

export default defineConfig({
  integrations: [mdx()],
});
```

## Defining a collection with a Zod schema

`src/content.config.ts` (Astro 5+):

```ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const articles = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/articles" }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(5).max(120),
      date: z.coerce.date(),
      read: z.number().int().min(1).max(30),
      tags: z.array(z.string()).min(1).max(5),
      excerpt: z.string().max(280),
      featured: z.boolean().default(false),
      cover: image().optional(),
    }),
});

export const collections = { articles };
```

A few things worth calling out:

- `z.coerce.date()` automatically turns the string `2026-01-22` from YAML into a `Date` object.
- The `image()` helper verifies that the file exists **and** hands you data ready for `<Image />` (width, height, format).
- `featured: z.boolean().default(false)` — when you leave `featured` out of the MDX, you get `false`.

## Frontmatter validation at build time

In `src/content/articles/cwv-eshop.mdx`:

```mdx
---
title: "CWV na eshope: priorita 1"
date: 2026-01-15
read: 8
tags: ["Performance", "Core Web Vitals"]
excerpt: "Krátky popis."
---

## Úvod

Telo článku.
```

If you write `read: "8"` (a string instead of a number) or an `excerpt` longer than 280 characters, `npm run build` fails and points you at the exact file and line. **No article with broken frontmatter makes it to production.**

A real example: a blog with 50 articles, one developer didn't realize he'd changed `tags` from an array to a plain string. Before Content Collections, that would have surfaced as a runtime error on an article nobody had opened in three days. With Zod: the build broke on the very first commit.

## Type-safe getCollection()

`getCollection()` gives you fully typed entries. TypeScript knows `entry.data.tags` is `string[]`, and your IDE offers autocomplete.

```ts
---
import { getCollection } from "astro:content";

const articles = await getCollection("articles", ({ data }) => {
  return data.featured === true; // type-checked
});

// Sort by date — TS knows date is a Date
articles.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
---
```

To filter by tag:

```ts
const performanceArticles = await getCollection("articles", ({ data }) =>
  data.tags.includes("Performance")
);
```

## Rendering MDX with custom components

In the old approach you rendered MDX through a global `MDXProvider`. Content Collections do it locally — on each render you decide which components are available:

```astro
---
import { getEntry, render } from "astro:content";
import Note from "../components/Note.astro";
import CodeBlock from "../components/CodeBlock.astro";

const { slug } = Astro.params;
const entry = await getEntry("articles", slug);
if (!entry) return Astro.redirect("/404");

const { Content } = await render(entry);
---

<article>
  <h1>{entry.data.title}</h1>
  <time>{entry.data.date.toLocaleDateString("sk-SK")}</time>
  <Content components={{ Note, code: CodeBlock }} />
</article>
```

Then in the `*.mdx` file you can write:

```mdx
## Úvod

<Note type="warning">
  Toto je vlastný komponent. Astro vie, že existuje, lebo sme ho importovali.
</Note>

Bežný odsek.
```

`code: CodeBlock` overrides the standard `<code>` element — so you can add syntax highlighting via Shiki or Prism without a global `rehype-pretty-code` config.

## Image optimization

The best part. When you set `cover: image()` in the schema, you give a relative path in the frontmatter:

```yaml
cover: ./images/cwv-cover.jpg
```

And in the template:

```astro
---
import { Image } from "astro:assets";
const entry = await getEntry("articles", slug);
---

{entry.data.cover && (
  <Image
    src={entry.data.cover}
    alt={entry.data.title}
    widths={[400, 800, 1200]}
    sizes="(max-width: 768px) 100vw, 800px"
    loading="lazy"
  />
)}
```

`<Image />` generates a WebP variant by default plus the correct `srcset` for the widths you specify. If you also need AVIF with a fallback, reach for the `<Picture />` component — it can emit multiple formats at once (AVIF and WebP by default). If the image doesn't exist on disk, the build fails — no broken images in production. That `loading="lazy"` is doing real work here; if you want to know when to trust the native attribute versus rolling your own, I dug into [native vs. custom lazy-loading](/en/blog/image-lazy-loading-native-vs-custom/) separately.

## getStaticPaths for dynamic routes

```ts
---
import { getCollection } from "astro:content";

export async function getStaticPaths() {
  const articles = await getCollection("articles");
  return articles.map((article) => ({
    params: { slug: article.id },
    props: { article },
  }));
}

const { article } = Astro.props;
const { Content } = await render(article);
---
```

In Astro 5+ it's `entry.id` (it used to be `entry.slug`). With the `glob()` loader, `id` is a URL-friendly slug that Astro generates from the filename (kebab-case via github-slugger) — exactly what you want for a URL.

## Build performance

For 50 articles with image optimization (3 widths each), the build takes ~12s on an M1 Mac. For 200 articles, ~35s. That's with `astro build`, without any cache. For larger sites it pays to turn on a persistent cache: experimental Content Collections caching has been around since Astro 3.5 (on the Astro docs it cut that build step from 133s to 10s, roughly 92%) and Astro 6 shipped a new caching system that speeds up repeat (incremental) builds in particular.

## External links

- [Astro Content Collections docs](https://docs.astro.build/en/guides/content-collections/)
- [Zod docs](https://zod.dev/) — schema validation
- [@astrojs/mdx](https://docs.astro.build/en/guides/integrations-guide/mdx/)

## TL;DR

`defineCollection` + a Zod schema = frontmatter validation at build time. `getCollection()` = type-safe queries. `render(entry)` + `<Content components={...} />` = MDX with custom components. The `image()` schema helper = automatically optimized images with a safety net against broken links. Type-safe end-to-end from the MDX file to the final HTML, no `any` along the way.

Related: [Astro 5 + view transitions on e-commerce: what already works](/en/blog/astro-view-transitions-eshop/) · [Astro vs. Next.js: the decision table](/en/blog/astro-vs-nextjs-tabulka/)
