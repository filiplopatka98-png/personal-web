---
title: "Astro Content Collections + MDX pre blog: typesafe end-to-end"
date: 2026-01-22
read: 7
tags: ["Astro", "MDX", "TypeScript"]
excerpt: "Zod schéma chytí preklep vo frontmatteri už pri builde — nie až keď ti ho čitateľ otvorí ako 404. Nastavenie Content Collections + MDX pre typovo bezpečný blog za 20 minút."
featured: false
---

V starom Astre si MDX súbory čítal cez `Astro.glob()` a `frontmatter.title` bol `any`. Preklep v dátume? Build prešiel. Stránka spadla až za behu. Content Collections so Zod schémou to obracia: build zlyhá pri **nesprávnom** frontmatteri, za behu je už čisto.

Toto je nastavenie, ktoré používam na všetkých blogových projektoch od Astra 4. V Astre 5 je konfigurácia už v `src/content.config.ts` namiesto `src/content/config.ts` — staré umiestnenie ešte funguje cez spätnú kompatibilitu, ale je označené za zastarané, takže novú konfiguráciu píš rovno do `src/content.config.ts`.

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

- `z.coerce.date()` ti automaticky prevedie reťazec `2026-01-22` z YAML na `Date` objekt.
- `image()` helper overí, že súbor existuje, **a** dá ti dáta pripravené pre `<Image />` (width, height, format).
- `featured: z.boolean().default(false)` — keď v MDX pole `featured` nezadáš, dostaneš `false`.

## Validácia frontmatteru pri builde

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

Ak napíšeš `read: "8"` (reťazec namiesto čísla) alebo `excerpt` dlhší ako 280 znakov, `npm run build` zlyhá a ukáže ti konkrétny súbor a riadok. **Žiadny článok s rozbitým frontmatterom sa nedostane na produkciu.**

Príklad z praxe: blog s 50 článkami, jeden vývojár si neuvedomil, že zmenil `tags` z poľa na obyčajný reťazec. Pred Content Collections by sa to prejavilo chybou za behu na článku, ktorý nikto tri dni neotvoril. So Zod: build spadol hneď pri prvom commite.

## Typovo bezpečný getCollection()

Z `getCollection()` dostaneš plne otypované záznamy. TypeScript vie, že `entry.data.tags` je `string[]`, a IDE ti ponúkne automatické dopĺňanie.

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

Na filtrovanie podľa tagu:

```ts
const performanceArticles = await getCollection("articles", ({ data }) =>
  data.tags.includes("Performance")
);
```

## Renderovanie MDX s vlastnými komponentmi

V starom prístupe si MDX renderoval cez globálny `MDXProvider`. Content Collections to robia lokálne — pri každom renderovaní určíš, ktoré komponenty sú dostupné:

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
  Toto je vlastný komponent. Astro vie, že existuje, lebo sme ho importovali.
</Note>

Bežný odsek.
```

`code: CodeBlock` prepíše štandardný `<code>` element — tak môžeš pridať zvýrazňovanie syntaxe cez Shiki alebo Prism bez globálnej `rehype-pretty-code` konfigurácie.

## Optimalizácia obrázkov

Najlepšia vychytávka. Keď v schéme dáš `cover: image()`, vo frontmatteri uvedieš relatívnu cestu:

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

`<Image />` vygeneruje štandardne WebP variant a k nemu správny `srcset` pre zadané šírky. Ak potrebuješ aj AVIF s fallbackom, siahni po komponente `<Picture />` — ten vie vyrobiť viac formátov naraz (predvolene AVIF aj WebP). Ak obrázok na disku neexistuje, build padne — žiadne rozbité obrázky na produkcii.

## getStaticPaths pre dynamické cesty

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

V Astre 5+ je `entry.id` (predtým bolo `entry.slug`). Pri `glob()` loaderi je `id` URL-friendly slug, ktorý Astro vygeneruje z názvu súboru (kebab-case cez github-slugger) — presne to, čo chceš pre URL.

## Build performance

Pre 50 článkov s optimalizáciou obrázkov (3 šírky na každý) build trvá ~12 s na M1 Macu. Pre 200 článkov ~35 s. To je s `astro build`, bez akejkoľvek cache. Pre väčšie stránky sa oplatí zapnúť perzistentnú cache: experimentálne cachovanie Content Collections existuje od Astra 3.5 (na dokumentácii Astra zrýchlilo daný krok buildu z 133 s na 10 s, teda o zhruba 92 %) a Astro 6 prinieslo nový cachovací systém, ktorý zrýchľuje najmä opakované (inkrementálne) buildy.

## Externé odkazy

- [Astro Content Collections docs](https://docs.astro.build/en/guides/content-collections/)
- [Zod docs](https://zod.dev/) — validácia schém
- [@astrojs/mdx](https://docs.astro.build/en/guides/integrations-guide/mdx/)

## TL;DR

`defineCollection` + Zod schéma = validácia frontmatteru pri builde. `getCollection()` = typovo bezpečné dotazy. `render(entry)` + `<Content components={...} />` = MDX s vlastnými komponentmi. `image()` schema helper = automaticky optimalizované obrázky s poistkou proti rozbitým odkazom. Typovo bezpečné end-to-end od MDX súboru po finálne HTML, žiadny `any` po ceste.
