---
title: "React Server Components: 5 vecí, ktoré ma prekvapili po roku"
date: 2026-03-19
read: 8
tags: ["React", "Next.js"]
excerpt: "Po roku produkčného používania RSC v Next.js — päť vecí, ktoré dokumentácia neukáže a ktoré ti zožerú deň, kým prídeš na to, čo sa deje."
featured: false
---

Pred rokom som zaviedol React Server Components na prvý produkčný projekt — eshop s 5 000 produktmi v Next.js 14. Odvtedy som ich nasadil na 6 ďalších. Tu je päť vecí, ktoré ma prekvapili a ktoré dokumentácia odbije jednou vetou.

## 1) `"use client"` boundary discipline je jadro hry

Najčastejšia chyba, ktorú som videl (a sám robil): **`"use client"` na top-level komponenta kvôli jednému `useState`** a celý strom pod ním sa stáva client component. Strácaš všetky benefity RSC.

Zlý príklad:

```tsx
// app/products/page.tsx
"use client";

export default function ProductsPage() {
  const [filter, setFilter] = useState("");
  return (
    <div>
      <Header />               {/* mohol byť server */}
      <ProductGrid />          {/* fetch z DB by bol server */}
      <FilterInput value={filter} onChange={setFilter} />
    </div>
  );
}
```

Lepšie: `"use client"` len tam, kde je `useState`:

```tsx
// app/products/page.tsx — server component
export default async function ProductsPage() {
  const products = await db.products.findMany();
  return (
    <div>
      <Header />
      <FilterableGrid products={products} />
    </div>
  );
}

// FilterableGrid.tsx
"use client";

export function FilterableGrid({ products }) {
  const [filter, setFilter] = useState("");
  return <>...</>;
}
```

Pravidlo: **`"use client"` ide čo najnižšie v strome**, ideálne na list komponenty. Nie na page.

## 2) Third-party libs často nemajú `"use client"` wrap

Toto ma chytilo trikrát. Nainštaluješ `react-select`, `@radix-ui/react-dialog`, `react-hot-toast` — fungujú lokálne, na produkcii ti spadne build:

```text
Error: useState only works in Client Components
```

Príčina: lib používa hooks ale nemá `"use client"` v svojom `dist`. Musíš si **wrap-núť** import:

```tsx
// components/ui/select.tsx
"use client";
export { default } from "react-select";
```

A potom importuješ `from "@/components/ui/select"` namiesto priameho `react-select`. Otravné, ale pekná lekcia: **každý import zo `node_modules`, ktorý používa hooks, treba pre-wrap-núť**.

Knižnice s natívnym RSC supportom (s `"use client"` v `dist`): `framer-motion@11+`, `react-hook-form@7.50+`, `zustand@4.5+`. Ostatné si over.

## 3) DevTools mental model — Server vs Client osobitne

React DevTools ukazuje **iba klientské** komponenty. Server komponenty vidíš ako "anonymous" alebo nevidíš vôbec. To znamená:

- Pre debugging serverových komponent **používaj `console.log` s prefixom** typu `[server]`. Logy idú do **Node.js console** (terminál, kde beží `next dev`), nie do browser console.
- Pre client komponenty máš normálne DevTools.
- **Network tab** ti ukáže payload Server Component-u ako `RSC` content type — fascinujúci binary-ish formát, ktorý si môžeš pozrieť ale nie debugovať.

Praktický tip:

```tsx
// app/products/page.tsx
export default async function Page() {
  console.log("[RSC] products page render", { time: Date.now() });
  // ...
}
```

Tieto logy uvidíš v termináli pri každom request-e. Pomáha to pri troubleshootingu cache hit/miss.

## 4) Streaming + Suspense — kedy je waterfall zlý a kedy v poriadku

Naivný RSC kód:

```tsx
export default async function Page() {
  const products = await fetchProducts();
  const reviews = await fetchReviews();
  const user = await fetchUser();
  return <Layout {...{products, reviews, user}} />;
}
```

Toto je **sequential waterfall**. 3 fetch-y pekne za sebou, total time = súčet. Network tab ukáže ladder pattern.

Riešenie 1: parallelný fetch, kde je to možné:

```tsx
const [products, reviews, user] = await Promise.all([
  fetchProducts(),
  fetchReviews(),
  fetchUser(),
]);
```

Riešenie 2: streaming so `Suspense` — show what you have, stream the rest:

```tsx
export default function Page() {
  return (
    <>
      <ProductsSection />
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews />
      </Suspense>
    </>
  );
}

async function Reviews() {
  const reviews = await fetchReviews();
  return <ReviewsList reviews={reviews} />;
}
```

User vidí produkty okamžite, recenzie sa stream-nú keď sa dotiahnu. **TTFB** zostane nízky, **LCP** sa neposunie kvôli pomalému side-fetch-u.

Kedy waterfall NIE JE zlý: keď druhý fetch naozaj **závisí** od prvého (napr. najprv user, potom orders pre user.id). Vtedy je sequence nutná.

## 5) Cache `fetch` a `revalidate` — implicit caching prekvapí

Next.js 14 mal default `fetch` cache `force-cache`. To znamená, že:

```tsx
const data = await fetch("https://api.example.com/products");
```

...sa **uloží do cache navždy** (do nasledujúceho deploye). Ak voláš API, ktorá vracia dynamické dáta, dostávaš stale data a nevieš prečo. Toto v Next.js 15 zmenili na `no-store` default — ale starší projekty sú stále chytené.

Explicit voľby, ktoré si treba pamätať:

```tsx
// no cache — vždy fresh
fetch(url, { cache: "no-store" });

// cache + time-based revalidate
fetch(url, { next: { revalidate: 3600 } });

// cache + tag-based revalidate (pre on-demand invalidation)
fetch(url, { next: { tags: ["products"] } });
```

A potom z webhook-u:

```tsx
import { revalidateTag } from "next/cache";
revalidateTag("products");
```

**Common gotcha:** ak máš `fetch` v server component **a aj** `revalidate` v `route segment config`, vyhráva ten reštriktívnejší (kratší interval). Spätne to nikdy neoľutuješ skontrolovať `next build` output, ktorý ti vypíše cache režim pre každý route.

## TL;DR

Server Components fungujú, ale majú vlastný mental model. **Pravidlá, ktoré si zapamätaj:**

1. `"use client"` čo najnižšie v strome.
2. Third-party libs s hooks treba pre-wrap-núť.
3. Server logy idú do terminálu, nie browseru.
4. Suspense + streaming pre paralelné rendery, `Promise.all` pre paralelné fetche.
5. Explicit cache strategy, nikdy nespoliehaj na default.

Po roku môžem povedať že produkčne to funguje fajn a dev velocity je vyššia ako pri Pages Router. Ale prvé 2-3 týždne sú learning curve, na ktorú musíš tím psychicky pripraviť.
