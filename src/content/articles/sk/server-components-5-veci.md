---
title: "React Server Components: 5 vecí, ktoré ma prekvapili po roku"
date: 2026-03-19
read: 8
tags: ["React", "Next.js"]
excerpt: "Po roku produkčného používania RSC v Next.js — päť vecí, ktoré ti dokumentácia neukáže a ktoré ti zožerú celý deň, kým prídeš na to, čo sa deje."
featured: false
---

Pred rokom som nasadil React Server Components na prvý produkčný projekt — eshop s 5 000 produktmi v Next.js 14. Odvtedy som ich nasadil na šesť ďalších. Tu je päť vecí, ktoré ma prekvapili a ktoré dokumentácia odbije jednou vetou.

## 1) Disciplína pri `"use client"` hranici je jadro hry

Najčastejšia chyba, ktorú som videl (a sám robil): **`"use client"` na komponente najvyššej úrovne kvôli jedinému `useState`** — a celý strom pod ním sa stáva klientskym komponentom. Strácaš všetky výhody RSC.

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

Pravidlo: **`"use client"` ide čo najnižšie v strome**, ideálne na listové komponenty. Nie na stránku.

## 2) Knižnice tretích strán často nemajú `"use client"` obal

Toto ma chytilo trikrát. Nainštaluješ `react-select`, `@radix-ui/react-dialog`, `react-hot-toast` — lokálne fungujú, na produkcii ti spadne build:

```text
Error: You're importing a component that needs `useState`. This React hook only works in a client component. To fix, mark the file (or its parent) with the `"use client"` directive.
```

Príčina: knižnica používa hooky, ale nemá `"use client"` vo svojom `dist`. Musíš si import **obaliť**:

```tsx
// components/ui/select.tsx
"use client";
export { default } from "react-select";
```

A potom importuješ `from "@/components/ui/select"` namiesto priamo z `react-select`. Otravné, ale pekná lekcia: **každý import zo `node_modules`, ktorý používa hooky, treba vopred obaliť**.

Knižnice s natívnou podporou RSC (s `"use client"` v `dist`): `framer-motion@11+`, `react-hook-form@7.50+`, `zustand@4.5+`. Ostatné si over.

## 3) Mentálny model DevTools — server a klient osobitne

React DevTools ukazuje **iba klientske** komponenty. Serverové komponenty vidíš ako „anonymous“ alebo ich nevidíš vôbec. To znamená:

- Serverové komponenty debuguj cez **`console.log` s prefixom** typu `[server]`. Logy idú do **konzoly Node.js** (terminál, kde beží `next dev`), nie do konzoly prehliadača.
- Pre klientske komponenty máš normálne DevTools.
- **Karta Network** ti ukáže payload serverového komponentu s content type `RSC` — fascinujúci, takmer binárny formát, ktorý si síce môžeš pozrieť, ale nie debugovať.

Praktický tip:

```tsx
// app/products/page.tsx
export default async function Page() {
  console.log("[RSC] products page render", { time: Date.now() });
  // ...
}
```

Tieto logy uvidíš v termináli pri každom requeste. Pomáha to pri riešení problémov s cache hit/miss.

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

Toto je **sekvenčný waterfall**. Tri fetche pekne za sebou, celkový čas = ich súčet. Karta Network ukáže rebríčkový (ladder) vzor.

Riešenie 1: paralelný fetch, kde sa dá:

```tsx
const [products, reviews, user] = await Promise.all([
  fetchProducts(),
  fetchReviews(),
  fetchUser(),
]);
```

Riešenie 2: streaming cez `Suspense` — zobraz, čo už máš, a zvyšok streamuj:

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

Používateľ vidí produkty okamžite, recenzie sa dostreamujú, keď sa dotiahnu. **TTFB** zostane nízky a **LCP** sa neposunie kvôli pomalému vedľajšiemu fetchu.

Kedy waterfall NIE JE zlý: keď druhý fetch naozaj **závisí** od prvého (napr. najprv user, potom objednávky pre user.id). Vtedy je sekvencia nutná.

## 5) Cache pri `fetch` a `revalidate` — implicitné cachovanie prekvapí

Next.js 14 mal predvolenú cache pri `fetch` nastavenú na `force-cache`. To znamená, že:

```tsx
const data = await fetch("https://api.example.com/products");
```

...sa **uloží do cache navždy** (až do nasledujúceho deployu). Ak voláš API, ktoré vracia dynamické dáta, dostávaš zastarané dáta a nevieš prečo. V Next.js 15 to zmenili — predvolená hodnota je teraz `no-store` — ale staršie projekty sú stále chytené.

Explicitné voľby, ktoré si treba pamätať:

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

**Častý zádrhel:** ak máš `fetch` v serverovom komponente **a aj** `revalidate` v konfigurácii route segmentu, vyhráva ten reštriktívnejší (kratší interval). Nikdy neoľutuješ, že si skontroloval výstup `next build`, ktorý ti vypíše režim cache pre každý route.

## TL;DR

Server Components fungujú, ale majú vlastný mentálny model. **Pravidlá, ktoré si zapamätaj:**

1. `"use client"` čo najnižšie v strome.
2. Knižnice tretích strán s hookmi treba vopred obaliť.
3. Serverové logy idú do terminálu, nie do prehliadača.
4. Suspense + streaming pre paralelné rendery, `Promise.all` pre paralelné fetche.
5. Explicitná stratégia cache, nikdy sa nespoliehaj na predvolené hodnoty.

Po roku môžem povedať, že produkčne to funguje fajn a dev velocity je vyššia ako pri Pages Routeri. Ale prvé dva až tri týždne sú learning curve, na ktorú musíš tím psychicky pripraviť vopred.
