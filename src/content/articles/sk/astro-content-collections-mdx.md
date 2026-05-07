---
title: "Astro Content Collections + MDX pre blog: typesafe end-to-end"
date: 2026-01-22
read: 7
tags: ["Astro", "MDX", "TypeScript"]
excerpt: "Zod schema chytí preklep vo frontmatteri pri builde — nie keď ti čitateľ otvorí 404. Setup Content Collections + MDX pre typesafe blog za 20 minút."
featured: false
---

V starom Astre si MDX súbory čítal cez `Astro.glob()` a `frontmatter.title` bol `any`. Preklep v dátume? Build prešiel. Stránka padla v runtime. Content Collections s Zod schémou to obracia: build fail-uje pri **nesprávnom** frontmatteri, runtime je čistý.

Toto je setup, ktorý používam na všetkých blog projektoch od Astra 4. V Astre 5.x je už `content.config.ts` namiesto `src/content/config.ts` (oba ešte fungujú, novší je preferred location).

## Setup

```bash
npm install @astrojs/mdx
```

V `astro.config.mjs`:

```js
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

export default defineConfig({
  integrations: [mdx()],
});
```

## Definícia kolekcie so Zod schémou

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

Pár dôležitých vecí:

- `z.coerce.date()` ti automaticky parsne `2026-01-22` string z YAML do `Date` objektu.
- `image()` helper validuje, že súbor existuje **a** dá ti optimalizované `<Image />`-ready data (width, height, format).
- `featured: z.boolean().default(false)` — keď v MDX nezadáš `featured`, dostaneš `false`.

## Frontmatter validácia at build time

V `src/content/articles/cwv-eshop.mdx`:

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

Ak napíšeš `read: "8"` (string namiesto number) alebo `excerpt` dlhší ako 280 znakov, `npm run build` zhodí s konkrétnym pointerom na súbor a riadok. **Žiadny článok s rozbitým frontmatterom sa nedostane na produkciu.**

Real-world test: blog s 50 článkami, jeden vývojár si neuvedomil, že zmenil `tags` na string namiesto array. Pred Content Collections by sa to prejavilo runtime errorom na článku, ktorý nikto neotvoril 3 dni. So Zod: build padol pri prvom commit-e.

## Typesafe getCollection()

Z `getCollection()` dostaneš plne typed entries. TypeScript vie, že `entry.data.tags` je `string[]`, a IDE ti ponúkne autocomplete.

```ts
---
import { getCollection } from "astro:content";

const articles = await getCollection("articles", ({ data }) => {
  return data.featured === true; // type-checked
});

// Sort by date — TS vie, že date je Date
articles.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
---
```

Pre tagované filtre:

```ts
const performanceArticles = await getCollection("articles", ({ data }) =>
  data.tags.includes("Performance")
);
```

## Render MDX s custom komponentmi

V starom prístupe si MDX renderoval cez globálnu `MDXProvider`. Content Collections to robí lokálne — per-render určíš, ktoré komponenty sú dostupné:

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

V `*.mdx` súbore potom môžeš písať:

```mdx
## Úvod

<Note type="warning">
  Toto je vlastný komponent. Astro vie, že existuje, lebo sme ho importli.
</Note>

Bežný odsek.
```

`code: CodeBlock` override-uje default `<code>` element — tak môžeš dať syntax highlighting cez Shiki alebo Prism bez globálneho `rehype-pretty-code` config-u.

## Image optimalizácia

Najlepšia ficka. Keď v schéme dáš `cover: image()`, vo frontmatteri uvedieš relatívnu cestu:

```yaml
cover: ./images/cwv-cover.jpg
```

A v template:

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

Astro vygeneruje WebP/AVIF varianty + správne `srcset`. Ak obrázok neexistuje na disku, build padne — žiadne broken images na produke.

## getStaticPaths pre dynamické trasy

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

V Astre 5+ je `entry.id` (predtým bolo `entry.slug`). `id` je file path bez extensionu, presne to, čo chceš pre URL.

## Build performance

Pre 50 článkov + image optimalizáciou (3 šírky každý) build trvá ~12s na M1 Mac. Pre 200 článkov ~35s. To je s `astro build`, žiadny incremental cache. Pre väčšie stránky skús `--mode=development` + persistent cache (Astro 5 má experimental incremental builds).

## Externé linky

- [Astro Content Collections docs](https://docs.astro.build/en/guides/content-collections/)
- [Zod docs](https://zod.dev/) — schema validation
- [@astrojs/mdx](https://docs.astro.build/en/guides/integrations-guide/mdx/)

## TL;DR

`defineCollection` + Zod schema = build-time validácia frontmatteru. `getCollection()` = typesafe queries. `render(entry)` + `<Content components={...} />` = MDX s custom komponentmi. `image()` schema helper = automaticky optimalizované obrázky s broken-link guardom. End-to-end typesafe od MDX súboru po finálne HTML, žiadny `any` po ceste.
