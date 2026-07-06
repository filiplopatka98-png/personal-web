---
title: "React Server Components: 5 Things That Surprised Me After a Year"
date: 2026-03-19
read: 8
tags: ["React", "Next.js"]
excerpt: "After a year of running RSC in production with Next.js — five things the docs won't show you, the kind that eat a whole day before you figure out what's actually going on."
featured: false
---

A year ago I shipped React Server Components on my first production project — an ecommerce store with 5,000 products on Next.js 14. Since then I've shipped them on six more. Here are five things that surprised me, the ones the docs wave off in a single sentence.

## 1) Discipline at the `"use client"` boundary is the whole game

The most common mistake I've seen (and made myself): **slapping `"use client"` on a top-level component just because of a single `useState`** — and now the entire tree beneath it becomes a client component. You lose every benefit of RSC.

Bad example:

```tsx
// app/products/page.tsx
"use client";

export default function ProductsPage() {
  const [filter, setFilter] = useState("");
  return (
    <div>
      <Header />               {/* could've been server */}
      <ProductGrid />          {/* fetching from the DB, should be server */}
      <FilterInput value={filter} onChange={setFilter} />
    </div>
  );
}
```

Better: `"use client"` only where the `useState` actually lives:

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

The rule: **push `"use client"` as far down the tree as it'll go**, ideally onto leaf components. Not onto the page.

## 2) Third-party libraries often ship without a `"use client"` wrapper

This one got me three times. You install `react-select`, `@radix-ui/react-dialog`, `react-hot-toast` — works fine locally, then the production build blows up:

```text
Error: You're importing a component that needs `useState`. This React hook only works in a client component. To fix, mark the file (or its parent) with the `"use client"` directive.
```

The cause: the library uses hooks but doesn't include `"use client"` in its `dist`. You have to **wrap** the import yourself:

```tsx
// components/ui/select.tsx
"use client";
export { default } from "react-select";
```

And then you import `from "@/components/ui/select"` instead of straight from `react-select`. Annoying, but a nice lesson: **any import from `node_modules` that uses hooks needs to be wrapped up front**.

Libraries with native RSC support (with `"use client"` in their `dist`): `framer-motion@11+`, `react-hook-form@7.50+`, `zustand@4.5+`. Everything else, verify for yourself.

## 3) The DevTools mental model — server and client, separately

React DevTools shows you **only client** components. Server components show up as "anonymous" or don't show up at all. Which means:

- Debug server components with a **prefixed `console.log`** like `[server]`. Those logs go to the **Node.js console** (the terminal where `next dev` is running), not the browser console.
- For client components you get normal DevTools.
- The **Network tab** shows you the server component's payload with content type `RSC` — a fascinating, near-binary format you can look at but not debug.

Practical tip:

```tsx
// app/products/page.tsx
export default async function Page() {
  console.log("[RSC] products page render", { time: Date.now() });
  // ...
}
```

You'll see these logs in the terminal on every request. It helps a lot when you're chasing cache hit/miss issues.

## 4) Streaming + Suspense — when a waterfall is bad and when it's fine

Naive RSC code:

```tsx
export default async function Page() {
  const products = await fetchProducts();
  const reviews = await fetchReviews();
  const user = await fetchUser();
  return <Layout {...{products, reviews, user}} />;
}
```

This is a **sequential waterfall**. Three fetches, one after another, total time = the sum of all three. The Network tab shows you a ladder pattern.

Fix 1: fetch in parallel wherever you can:

```tsx
const [products, reviews, user] = await Promise.all([
  fetchProducts(),
  fetchReviews(),
  fetchUser(),
]);
```

Fix 2: stream with `Suspense` — show what you already have and stream the rest:

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

The user sees the products instantly, and the reviews stream in once they're ready. **TTFB** stays low and **LCP** doesn't slip because of a slow secondary fetch.

When a waterfall is NOT bad: when the second fetch genuinely **depends** on the first (say, fetch the user first, then that user's orders by user.id). In that case the sequence is unavoidable.

## 5) Caching with `fetch` and `revalidate` — the implicit caching will surprise you

Next.js 14 set the default cache for `fetch` to `force-cache`. Which means:

```tsx
const data = await fetch("https://api.example.com/products");
```

...gets **cached forever** (until the next deploy). If you're calling an API that returns dynamic data, you get stale data and no idea why. Next.js 15 changed this — the default is now `no-store` — but older projects are still caught out by it.

The explicit options worth memorizing (I went deeper on this in [Next.js cache: revalidate, tag, path — where to use what](/en/blog/nextjs-cache-revalidate/)):

```tsx
// no cache — always fresh
fetch(url, { cache: "no-store" });

// cache + time-based revalidate
fetch(url, { next: { revalidate: 3600 } });

// cache + tag-based revalidate (for on-demand invalidation)
fetch(url, { next: { tags: ["products"] } });
```

And then from a webhook:

```tsx
import { revalidateTag } from "next/cache";
revalidateTag("products");
```

**A common gotcha:** if you have a `fetch` in a server component **and also** a `revalidate` in the route segment config, the more restrictive one wins (the shorter interval). You'll never regret checking the `next build` output, which prints the cache mode for every route.

## TL;DR

Server Components work, but they come with their own mental model. **Rules to remember:**

1. `"use client"` as far down the tree as possible.
2. Third-party libraries with hooks need to be wrapped up front.
3. Server logs go to the terminal, not the browser.
4. Suspense + streaming for parallel renders, `Promise.all` for parallel fetches.
5. An explicit cache strategy — never rely on the defaults.

After a year I can say it works well in production and dev velocity is higher than with the Pages Router. But the first two or three weeks are a learning curve you need to prep your team for psychologically, ahead of time.

**Related:** [Next.js App Router vs Pages Router in 2026: what's still relevant](/en/blog/nextjs-app-vs-pages-router/) · [Migrating React 18 → 19: what actually breaks the build](/en/blog/react-19-migracia/)
