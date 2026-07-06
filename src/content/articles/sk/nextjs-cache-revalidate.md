---
title: "Next.js cache: revalidate, tag, path — kde čo použiť"
date: 2026-03-05
read: 7
tags: ["Next.js", "Performance"]
excerpt: "Tri spôsoby invalidácie cache v Next.js, každý robí niečo iné. Rozhodovací strom podľa situácie a tri praktické ukážky kódu."
featured: false
---

Next.js má tri spôsoby, ako revalidovať cache: `revalidate` (číslo), `revalidateTag()` a `revalidatePath()`. Vyzerajú podobne, robia rôzne veci a väčšina chýb na projektoch pramení z toho, že sa použije nesprávny spôsob na nesprávnu vec.

## Rozhodovací strom v jednej tabuľke

| Situácia | Mechanizmus | Príklad |
|---|---|---|
| Obnov každých X sekúnd | `revalidate = 3600` | Blogový feed raz za hodinu |
| Webhook → invaliduj jednu stránku | `revalidatePath('/blog')` | Publikovanie v CMS |
| Webhook → invaliduj skupinu fetchov | `revalidateTag('products')` | Admin upraví 50 produktov |

Inak povedané:
- **`revalidate`** = „automaticky, podľa hodín".
- **`revalidatePath`** = „manuálne, jedna konkrétna stránka".
- **`revalidateTag`** = „manuálne, všetko označené tagom naprieč stránkami".

## 1) `revalidate` (číslo) — časovo riadená

Najjednoduchšia. Definuješ ju ako export v stránke (alebo v segmente routy):

```tsx
// app/blog/page.tsx
export const revalidate = 3600; // sekundy

export default async function BlogPage() {
  const posts = await fetch("https://cms.com/posts").then(r => r.json());
  return <PostList posts={posts} />;
}
```

Po hodine od posledného renderu spustí prvý request regeneráciu. **Používateľ počas regenerácie vždy vidí starú verziu** (revalidácia beží na pozadí).

Kde sa hodí:

- **Blogový feed** — články pribúdajú zriedka, dáta staré do hodiny stačia.
- **Widget najlepších produktov** na domovskej stránke — prepočet raz za 6 hodín je v pohode.
- **Stavová stránka** — obnova každú minútu.
- **Kurzy mien** — obnova raz za hodinu.

Kde sa NEHODÍ: keď pri publikovaní potrebuješ okamžité premietnutie zmeny. Vtedy treba kombináciu s revalidáciou na požiadanie (on-demand). Mimochodom, presne tento `revalidate` mechanizmus sa dá zneužiť aj na to, aby [ISR nahradilo cron](/blog/isr-namiesto-cron/) na malých weboch.

## 2) `revalidatePath()` — invalidácia jednej stránky

Použitie z route handlera (typicky webhook):

```tsx
// app/api/cms-webhook/route.ts
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { type, slug } = await req.json();

  if (type === "post.published" || type === "post.updated") {
    revalidatePath("/blog");
    revalidatePath(`/blog/${slug}`);
  }

  if (type === "menu.updated") {
    revalidatePath("/", "layout"); // invaliduj root layout
  }

  return NextResponse.json({ ok: true });
}
```

`revalidatePath()` má voliteľný druhý parameter:

- `"page"` (predvolené) — len daná stránka.
- `"layout"` — stránka plus všetky layouty pod ňou (typický prípad: zmena v hlavnom menu).

Kde sa hodí:

- **Webhook z CMS pri publikovaní** — vieš, ktorú konkrétnu stránku invalidovať.
- **Úprava používateľského profilu** — revaliduj `/u/[username]`.
- **Vytvorenie objednávky** — revaliduj `/admin/orders`.

## 3) `revalidateTag()` — koordinovaná invalidácia

Toto je najsilnejší mechanizmus a najmenej pochopený. Každý `fetch()` môžeš označiť tagom:

```tsx
// app/products/[slug]/page.tsx
export default async function ProductPage({ params }) {
  const product = await fetch(`https://api.com/products/${params.slug}`, {
    next: { tags: ["products", `product-${params.slug}`] },
  }).then(r => r.json());

  return <ProductDetail product={product} />;
}

// app/products/page.tsx
export default async function ProductsListing() {
  const products = await fetch("https://api.com/products", {
    next: { tags: ["products"] },
  }).then(r => r.json());

  return <ProductGrid products={products} />;
}
```

Keď admin upraví 50 produktov, **jedno volanie** invaliduje všetky stránky používajúce tag `products`:

```tsx
// app/api/admin-bulk-update/route.ts
import { revalidateTag } from "next/cache";

export async function POST() {
  // process bulk update...
  revalidateTag("products");
  return NextResponse.json({ ok: true });
}
```

Toto invaliduje **výpis aj všetky detailové stránky súčasne**, lebo všetky fetche majú tag `products`. Bez tagov by si musel volať `revalidatePath('/products')` plus 50-krát `revalidatePath('/products/${slug}')`.

Kombinovať tagy je úplne v poriadku:

```tsx
fetch(url, { next: { tags: ["products", "category-electronics"] } });
```

A potom:

```tsx
revalidateTag("category-electronics"); // invaliduj len elektroniku
```

## Kedy revalidatePath a kedy revalidateTag

Pravidlo, ktoré používam:

- **Vieš presne, ktorú URL invalidovať?** → `revalidatePath`.
- **Chceš invalidovať skupinu fetchov rozhodených po viacerých URL?** → `revalidateTag`.

Príklad: úprava blogového článku.

- Použijem `revalidatePath('/blog/${slug}')` pre konkrétny článok.
- A `revalidatePath('/blog')` pre výpis.
- ALEBO: `revalidateTag('post-${slug}')` na fetch detailu plus `revalidateTag('posts-list')` na fetch výpisu.

Tagový prístup je flexibilnejší, ale vyžaduje disciplínu pridávať tagy k fetchom hneď od začiatku. Cestový prístup je jednoduchší pre malé projekty.

## Časté chyby, ktoré som videl

1. **Zabudnuté volanie revalidate** — `await db.update(...)` bez následného `revalidatePath/Tag`. Používateľ odošle formulár, vidí starú stránku a nadáva. Toto je najčastejší chyták, keď píšeš [Next.js form actions namiesto API endpointov](/blog/nextjs-form-actions/) — mutácia prebehne, ale zabudneš cache poslať preč.
2. **Nesprávna cesta** — voláš `revalidatePath('/products/123')`, ale stránka je `/products/[slug]` so slugom `auto-123`. Pri konkrétnej ceste musíš zadať **finálnu URL** (`/products/auto-123`), nie route pattern. Ak chceš zasiahnuť všetky stránky podľa vzoru, použi pattern spolu s druhým parametrom: `revalidatePath('/products/[slug]', 'page')`.
3. **Nezhoda tagu** — fetch má tag `'products'` (množné číslo), revalidate volá `revalidateTag('product')` (jednotné). Tichá chyba, žiadne vyhodenie výnimky, len cache nefunguje.
4. **Spoliehanie sa na cache fetchu v Server Action** — od Next.js 15 `fetch()` už **nie je cachovaný predvolene** (defaultne `no-store`). Ak si zvyknutý z Next.js 14, kde bol default `force-cache`, pozor: v Server Action ti neanotovaný `fetch()` už nič neukladá do cache. Ak naopak *chceš* cachovať, musíš explicitne pridať `cache: 'force-cache'` alebo `next: { revalidate }` — inak ide o čerstvé dáta pri každom volaní.

## Praktický tip na debug

Pridaj si log do webhooku:

```tsx
console.log(`[revalidate] tag=${tag} time=${Date.now()}`);
revalidateTag(tag);
```

A pri page render-e:

```tsx
console.log(`[render] /blog at ${Date.now()}`);
```

V termináli `next dev` vidíš, kedy sa volá revalidate oproti tomu, kedy reálne prebehne opätovný render. Ak sa render po volaní revalidate nedeje, máš nesprávny tag alebo cestu.

## Zhrnutie

Tri mechanizmy, tri situácie. `revalidate = 3600` na automatickú obnovu. `revalidatePath('/url')` na cielenú jednu stránku. `revalidateTag('group')` na koordinovanú invalidáciu skupiny fetchov. Pravidlo: vieš URL → path. Nevieš URL, ale máš tag → tag. Nechce sa ti nad tým rozmýšľať → revalidate číslom, ale priprav sa na staré dáta.

Súvisiace: [ISR namiesto cron-u na malých weboch](/blog/isr-namiesto-cron/) a [server response time pod 200 ms cez cache, edge a prefetch](/blog/server-response-200ms/).
