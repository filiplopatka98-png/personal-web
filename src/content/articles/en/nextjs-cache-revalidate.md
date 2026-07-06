---
title: "Next.js cache: revalidate, tag, path — which one to use where"
date: 2026-03-05
read: 7
tags: ["Next.js", "Performance"]
excerpt: "Three ways to invalidate the cache in Next.js, each doing something different. A decision tree by situation and three practical code examples."
featured: false
---

Next.js has three ways to revalidate the cache: `revalidate` (a number), `revalidateTag()`, and `revalidatePath()`. They look similar, they do different things, and most of the bugs I see on projects come down to reaching for the wrong one for the job.

## The decision tree in a single table

| Situation | Mechanism | Example |
|---|---|---|
| Refresh every X seconds | `revalidate = 3600` | Blog feed once an hour |
| Webhook → invalidate one page | `revalidatePath('/blog')` | Publishing in a CMS |
| Webhook → invalidate a group of fetches | `revalidateTag('products')` | Admin edits 50 products |

Put another way:
- **`revalidate`** = "automatically, on a clock."
- **`revalidatePath`** = "manually, one specific page."
- **`revalidateTag`** = "manually, everything marked with a tag across pages."

## 1) `revalidate` (a number) — time-driven

The simplest one. You define it as an export in the page (or in a route segment):

```tsx
// app/blog/page.tsx
export const revalidate = 3600; // seconds

export default async function BlogPage() {
  const posts = await fetch("https://cms.com/posts").then(r => r.json());
  return <PostList posts={posts} />;
}
```

An hour after the last render, the first request triggers a regeneration. **The user always sees the stale version during regeneration** (revalidation runs in the background).

Where it fits:

- **A blog feed** — posts get added rarely, data that's up to an hour old is fine.
- **A "top products" widget** on the homepage — recalculating once every 6 hours is totally fine.
- **A status page** — refresh every minute.
- **Currency rates** — refresh once an hour.

Where it does NOT fit: when you need a change to show up immediately on publish. That's when you need to combine it with on-demand revalidation. Incidentally, this exact `revalidate` mechanism can be bent to let [ISR replace cron](/en/blog/isr-namiesto-cron/) on small sites.

## 2) `revalidatePath()` — invalidating a single page

Used from a route handler (typically a webhook):

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
    revalidatePath("/", "layout"); // invalidate the root layout
  }

  return NextResponse.json({ ok: true });
}
```

`revalidatePath()` takes an optional second argument:

- `"page"` (the default) — just that one page.
- `"layout"` — the page plus every layout beneath it (the classic case: a change in the main menu).

Where it fits:

- **A CMS webhook on publish** — you know exactly which page to invalidate.
- **Editing a user profile** — revalidate `/u/[username]`.
- **Creating an order** — revalidate `/admin/orders`.

## 3) `revalidateTag()` — coordinated invalidation

This is the most powerful mechanism and the least understood. You can tag every `fetch()`:

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

When the admin edits 50 products, **a single call** invalidates every page that uses the `products` tag:

```tsx
// app/api/admin-bulk-update/route.ts
import { revalidateTag } from "next/cache";

export async function POST() {
  // process bulk update...
  revalidateTag("products");
  return NextResponse.json({ ok: true });
}
```

This invalidates **the listing and every detail page at once**, because all of those fetches carry the `products` tag. Without tags you'd have to call `revalidatePath('/products')` plus `revalidatePath('/products/${slug}')` 50 times.

Combining tags is perfectly fine:

```tsx
fetch(url, { next: { tags: ["products", "category-electronics"] } });
```

And then:

```tsx
revalidateTag("category-electronics"); // invalidate electronics only
```

## When revalidatePath vs. when revalidateTag

The rule I use:

- **Do you know exactly which URL to invalidate?** → `revalidatePath`.
- **Do you want to invalidate a group of fetches scattered across several URLs?** → `revalidateTag`.

Example: editing a blog post.

- I'll use `revalidatePath('/blog/${slug}')` for the specific post.
- And `revalidatePath('/blog')` for the listing.
- OR: `revalidateTag('post-${slug}')` on the detail fetch plus `revalidateTag('posts-list')` on the listing fetch.

The tag approach is more flexible, but it takes the discipline to add tags to your fetches right from the start. The path approach is simpler for small projects.

## Common mistakes I've seen

1. **A forgotten revalidate call** — `await db.update(...)` with no `revalidatePath/Tag` after it. The user submits the form, sees the old page, and curses at you. This is the most common gotcha when you write [Next.js form actions instead of API endpoints](/en/blog/nextjs-form-actions/) — the mutation runs, but you forget to blow the cache away.
2. **The wrong path** — you call `revalidatePath('/products/123')`, but the page is `/products/[slug]` with the slug `auto-123`. For a concrete path you have to pass the **final URL** (`/products/auto-123`), not the route pattern. If you want to hit every page matching a pattern, pass the pattern together with the second argument: `revalidatePath('/products/[slug]', 'page')`.
3. **A tag mismatch** — the fetch has the tag `'products'` (plural), and revalidate calls `revalidateTag('product')` (singular). A silent failure, no exception thrown, the cache just doesn't work.
4. **Relying on fetch caching in a Server Action** — as of Next.js 15, `fetch()` is **no longer cached by default** (it defaults to `no-store`). If you're used to Next.js 14, where the default was `force-cache`, watch out: in a Server Action an un-annotated `fetch()` no longer stores anything in the cache. If you *do* want caching, you have to explicitly add `cache: 'force-cache'` or `next: { revalidate }` — otherwise you get fresh data on every call.

## A practical debugging tip

Add a log to your webhook:

```tsx
console.log(`[revalidate] tag=${tag} time=${Date.now()}`);
revalidateTag(tag);
```

And on the page render:

```tsx
console.log(`[render] /blog at ${Date.now()}`);
```

In the `next dev` terminal you can see when revalidate gets called versus when the re-render actually happens. If the render doesn't happen after a revalidate call, you've got the wrong tag or the wrong path.

## Wrap-up

Three mechanisms, three situations. `revalidate = 3600` for an automatic refresh. `revalidatePath('/url')` to target a single page. `revalidateTag('group')` for coordinated invalidation of a group of fetches. The rule: you know the URL → path. You don't know the URL but you have a tag → tag. You can't be bothered to think about it → revalidate with a number, but be ready for stale data.

Related: [ISR instead of cron on small sites](/en/blog/isr-namiesto-cron/) and [server response time under 200ms via cache, edge, and prefetch](/en/blog/server-response-200ms/).
