---
title: "Parallel and Intercepting Routes in Next.js: What They're Actually For"
date: 2026-11-19
read: 8
tags: ["Next.js"]
excerpt: "Two advanced App Router patterns without the hype. When they make sense, how they work, and why most projects don't actually need them."
featured: false
---

Parallel and intercepting routes are the kind of App Router features that get written about a lot and used a little. They sound exotic, the demos look slick, and you walk away feeling like you're doing Next.js wrong without them. The reality is more sober: they're two narrowly specialized tools that solve specific problems. If you don't have that problem, you don't need them.

I'm writing this against the Next.js 16 docs (the current stable release at the time of writing is 16.2.7). Both patterns have been in the App Router since it stabilized, and the API has been essentially unchanged since — so what I describe here holds across Next.js 13 through 16.

## Parallel routes: multiple pages in one layout

Parallel routes let you render several pages simultaneously within the same layout, where each one has its **own navigation, loading, and error state**. You define them with so-called slots — folders prefixed with `@`.

The key detail that trips people up: **a slot is not a route segment and doesn't affect the URL**. The folder `@analytics/views` shows up in the URL only as `/views`. The slot is passed to the layout as a prop.

```tsx
// app/layout.tsx
export default function Layout({
  children,
  team,
  analytics,
}: {
  children: React.ReactNode
  team: React.ReactNode
  analytics: React.ReactNode
}) {
  return (
    <>
      {children}
      {team}
      {analytics}
    </>
  )
}
```

The `@team` and `@analytics` folders become the `team` and `analytics` props. `children` is an implicit slot — you don't need an `@children` folder, `app/page.js` is its equivalent.

What's it good for in practice? Sections where several independent regions genuinely change at once and you want to give each its own streaming and error boundary — dashboards, feeds, split-view admin panels. A typical example is conditional rendering by role without duplicating the layout:

```tsx
// app/dashboard/layout.tsx
import { checkUserRole } from '@/lib/auth'

export default function Layout({
  user,
  admin,
}: {
  user: React.ReactNode
  admin: React.ReactNode
}) {
  const role = checkUserRole()
  return role === 'admin' ? admin : user
}
```

The reason to reach for slots instead of plain conditional JSX: **each slot streams independently**. An admin panel with heavy data won't block the rest from rendering. That's the real payoff for [streaming and Suspense in the App Router](/en/blog/streaming-suspense-app-router/) — not cosmetics.

## Why parallel routes hurt: `default.js`

This is where most people hit a wall, and it's worth saying out loud. Next.js remembers the active state of each slot during client-side (soft) navigation. But on a **hard navigation** — refresh, direct entry via URL — it can no longer recover that state for slots that don't match the current URL.

What happens then? Next.js renders the slot's `default.js`. And if `default.js` doesn't exist, it **throws a 404**. Not empty, not ignored — the whole page falls to 404.

```tsx
// app/@analytics/default.tsx
export default function Default() {
  return null
}
```

In practice this means you have to add `default.js` **at every level** where a slot could end up without a match — including the implicit `children`. This is the most common cause of mysterious 404s with parallel routes, and it's documented right in Next.js (the `slot-missing-default` error message). Once you get it, it stops being mysterious. Until you do, it eats half a day.

The second catch: if you put `@slot` in the layout JSX but the slot has no match on that route, you need a fallback ready (`default.js` or a page returning `null`), or you'll either see stale content or hit a 404.

## Intercepting routes: load someone else's route in the current layout

Intercepting routes solve a different problem: you want to show the content of some route **without pushing the user into a different context**. The classic case is a photo in a gallery — you click and a modal opens over the feed, but the URL changes to `/photo/123`, so it's shareable.

They're defined with a convention similar to relative paths, but **on route segments, not the file system**:

- `(.)` — match on the **same level**
- `(..)` — **one level above**
- `(..)(..)` — **two levels above**
- `(...)` — from the **root** `app` directory

The essence is this dual-mode behavior: on client-side navigation Next.js **intercepts** the route and renders it as an overlay in the current layout. On refresh or direct URL entry, **no interception happens** and the route renders as a full page. One and the same file, two behaviors depending on the navigation type.

## Where they make sense together: a shareable modal

The classic — and basically the only "textbook" — reason to combine these two patterns is a modal with deep linking. What you actually get from it:

- the modal content is **shareable via URL**,
- **a refresh won't close the modal** (or rather, it opens the full page of the same content),
- **back closes the modal** instead of jumping two pages back,
- **forward reopens it**.

These are exactly the things you have to bolt on manually with a hand-rolled `useState` modal, and it usually leaks somewhere.

The structure per the official docs: you have a real page `app/login/page.tsx`, an `@auth` slot with a `default.tsx` returning `null` (so the modal isn't visible when it's not active), and an intercepting folder `@auth/(.)login/page.tsx`:

```tsx
// app/@auth/(.)login/page.tsx
import { Modal } from '@/app/ui/modal'
import { Login } from '@/app/ui/login'

export default function Page() {
  return (
    <Modal>
      <Login />
    </Modal>
  )
}
```

An important detail: the path to the `login` segment uses `(.)`, not `(..)`, even though `@auth/(.)login` sits "deeper" in the file tree. Why? Because `@auth` is a slot, and the convention is counted on route segments — slots **don't count**. So `login` is only one segment level above.

The modal closes via `router.back()`:

```tsx
// app/ui/modal.tsx
'use client'

import { useRouter } from 'next/navigation'

export function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  return (
    <>
      <button onClick={() => router.back()}>Close</button>
      <div>{children}</div>
    </>
  )
}
```

And one more thing people forget: when you navigate away from the modal somewhere other than via `back()`, the `@auth` slot needs something to match against, or it stays visible. The fix is a catch-all slot `@auth/[...catchAll]/page.tsx` returning `null`. Without it, the modal simply won't hide on client-side navigation.

## When to (not) use them

My sober take, having gone through this on real projects:

Reach for **parallel routes** when you have several genuinely independent regions in one layout that you want to stream and handle separately. A dashboard with panels that load at different speeds. A conditional layout by role. If you just want two components side by side in a page, you **don't need slots** — you need two components.

**Intercepting routes** make sense essentially only for overlays that should have their own shareable URL: a photo modal, a product "quick view," a login modal with a standalone `/login` page. If the modal shouldn't have a URL — a confirmation dialog, a filter, settings — it's over-engineering. In that case a plain dialog and solid [focus management](/en/blog/focus-management-dialog/) is enough, because these patterns **won't solve accessibility for you** — a route-based modal is still just a `<div>`, and `role`, `aria-modal`, and the focus trap are on you.

And mind the cost: parallel routes change the mental model of routing, add `default.js` files, and make debugging less straightforward. On a small site that's not a win. If you're weighing App vs Pages Router or [Astro instead of Next.js](/en/blog/astro-vs-nextjs-tabulka/), these two patterns are an argument neither for nor against — they're specialized tools, not a reason to pick a framework.

To sum up: parallel and intercepting routes are well designed and elegant for their purpose. It's just that the purpose is narrower than the demo videos suggest. Use them when you're solving exactly the problem they solve. Otherwise you spare yourself the `default.js` pain.
