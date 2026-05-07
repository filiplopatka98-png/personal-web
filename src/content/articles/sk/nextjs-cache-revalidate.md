---
title: "Next.js cache: revalidate, tag, path — kde čo použiť"
date: 2026-03-05
read: 7
tags: ["Next.js", "Performance"]
excerpt: "Tri druhy cache invalidation v Next.js robia každý niečo iné. Decision tree podľa use case s tromi praktickými code samplami."
featured: false
---

Next.js má tri spôsoby, ako revalidovať cache: `revalidate` (number), `revalidateTag()` a `revalidatePath()`. Vyzerajú podobne, robia rôzne veci a väčšina chýb na projektoch ide z toho, že sa použije nesprávny spôsob na nesprávnu vec.

## Decision tree v jednej tabuľke

| Use case | Mechanizmus | Príklad |
|---|---|---|
| Refresh každých X sekúnd | `revalidate = 3600` | Blog feed every 1h |
| Webhook → invaliduj jednu stránku | `revalidatePath('/blog')` | CMS publish |
| Webhook → invaliduj skupinu fetch-ov | `revalidateTag('products')` | Admin updatuje 50 produktov |

Inak povedané:
- **`revalidate`** = "automaticky, podľa hodín".
- **`revalidatePath`** = "manuálne, jedna konkrétna stránka".
- **`revalidateTag`** = "manuálne, všetko označené tag-om naprieč stránkami".

## 1) `revalidate` (number) — time-based

Najjednoduchší. Definuješ ako export v page (alebo route segmente):

```tsx
// app/blog/page.tsx
export const revalidate = 3600; // sekundy

export default async function BlogPage() {
  const posts = await fetch("https://cms.com/posts").then(r => r.json());
  return <PostList posts={posts} />;
}
```

Po hodine od posledného renderu prvý request spustí regeneráciu. **User vždy vidí starú verziu počas regenerácie** (background revalidation).

Kde sa hodí:

- **Blog feed** — articles sa pridávajú zriedka, hour fresh stačí.
- **Top products widget** na homepage — recompute raz za 6 hodín OK.
- **Status page** — refresh každú minútu.
- **Currency rates** — raz za hodinu refresh.

Kde sa NEHODÍ: pri publish-i potrebuješ okamžité odzrkadlenie. Vtedy treba kombináciu s on-demand revalidation.

## 2) `revalidatePath()` — single-page invalidation

Použitie z route handler-a (typicky webhook):

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

- `"page"` (default) — len daná stránka.
- `"layout"` — stránka + všetky layouty pod ňou (use case: header menu zmena).

Kde sa hodí:

- **CMS publish hook** — vieš, ktorú konkrétnu stránku invalidovať.
- **User profile update** — revaliduj `/u/[username]`.
- **Order placed** — revaliduj `/admin/orders`.

## 3) `revalidateTag()` — koordinovaná invalidation

Toto je najsilnejší mechanizmus a najmenej pochopený. Každý `fetch()` môžeš označiť tag-om:

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

Keď admin updatne 50 produktov, **jeden call** invalidne všetky stránky používajúce tag `products`:

```tsx
// app/api/admin-bulk-update/route.ts
import { revalidateTag } from "next/cache";

export async function POST() {
  // process bulk update...
  revalidateTag("products");
  return NextResponse.json({ ok: true });
}
```

Toto invaliduje **listing aj všetky detail stránky súčasne**, lebo všetky fetche majú tag `products`. Bez tag-ov by si musel volať `revalidatePath('/products')` + 50x `revalidatePath('/products/${slug}')`.

Kombinovať tagy je legit:

```tsx
fetch(url, { next: { tags: ["products", "category-electronics"] } });
```

A potom:

```tsx
revalidateTag("category-electronics"); // invaliduj len elektroniku
```

## Kedy revalidatePath vs revalidateTag

Pravidlo, ktoré používam:

- **Vieš presne, ktorú URL invalidovať?** → `revalidatePath`.
- **Chceš invalidovať skupinu fetch-ov, ktoré sú rozhodené na viacerých URLs?** → `revalidateTag`.

Príklad: blog post update.

- Použijem `revalidatePath('/blog/${slug}')` pre konkrétny post.
- A `revalidatePath('/blog')` pre listing.
- ALEBO: `revalidateTag('post-${slug}')` na detail fetch + `revalidateTag('posts-list')` na listing fetch.

Tag-ový prístup je flexibilnejší, ale vyžaduje disciplínu pri pridávaní tag-ov k fetch-om hneď na začiatku. Path-ový prístup je hladší pre malé projekty.

## Common mistakes, ktoré som videl

1. **Zabudnutý revalidate volanie** — `await db.update(...)` bez následného `revalidatePath/Tag`. User submituje formulár, vidí starú stránku, nadáva.
2. **Wrong path** — `revalidatePath('/products/123')` ale stránka je `/products/[slug]` s slugom `auto-123`. Cesta musí matchnúť **finálny URL**, nie route pattern (alebo používaj typu argument: `revalidatePath('/products/[slug]', 'page')`).
3. **Nezhoda tag-u** — fetch má tag `'products'` (singular), revalidate volá `revalidateTag('product')`. Tichá chyba, žiadny error, len cache nefunguje.
4. **Cache layer cez fetch v Server Action** — Server Actions majú vlastný `cache()` mechanizmus. Ak v action voláš `fetch()` bez `cache: 'no-store'`, môže ti dôjsť k stale read.

## Praktický tip na debug

Pridaj si log do API webhook-u:

```tsx
console.log(`[revalidate] tag=${tag} time=${Date.now()}`);
revalidateTag(tag);
```

A pri page render-e:

```tsx
console.log(`[render] /blog at ${Date.now()}`);
```

V `next dev` termináli vidíš, kedy sa volá revalidate vs kedy reálne preběhne re-render. Ak sa render nedeje po revalidate volaní, máš nesprávny tag/path.

## TL;DR

Tri mechanizmy, tri use cases. `revalidate = 3600` pre auto refresh. `revalidatePath('/url')` pre cielenú jednu stránku. `revalidateTag('group')` pre koordinovanú invalidation skupiny fetch-ov. Pravidlo: vieš URL → path. Nevieš URL ale máš tag → tag. Nechce sa ti uvažovať → revalidate number, ale priprav sa na stale data.
