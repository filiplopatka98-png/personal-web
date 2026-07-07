---
title: "Streaming and Suspense in the App Router: A Faster Feel, No Tricks"
date: 2026-11-17
read: 8
tags: ["Next.js", "React"]
excerpt: "How to use loading.js and Suspense in the Next.js App Router to send content in pieces — so users don't wait on the slowest query in the whole page."
featured: false
---

Classic server-side rendering has one annoying property: the server won't send a single byte of HTML until it has the whole document. One slow database query or external API and the entire page stalls. The user stares at a blank window even though the header, navigation, and layout have been ready for ages.

Streaming flips that. The server sends what it already has and streams the rest as it gets computed. In the Next.js App Router this needs no trick and no extra library — it's built into the framework. I'm basing this on the official [streaming docs](https://nextjs.org/docs/app/guides/streaming), last updated June 23, 2026 for Next.js 16.2.

## How it actually works

React's server renderer produces HTML in chunks aligned with `<Suspense>` boundaries. In the App Router, Next.js wires this up through [chunked transfer encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Transfer-Encoding) — sending the response in pieces, as each one becomes ready.

The key concept is the **static shell**: everything that renders before any async work resolves. Layouts, navigation, and the fallbacks of your `<Suspense>` boundaries. That shell flies to the client immediately. The browser paints it, and the user has something to look at while the dynamic content is still being computed.

Each `<Suspense>` boundary is an independent streaming point. Components in different boundaries resolve and stream in separately — they don't block each other.

## The cheapest start: loading.js

If you don't have time to tune individual boundaries, start with `loading.js`. Drop the file next to `page.js` and Next.js automatically wraps the page content in a `<Suspense>` boundary, using your component as the fallback.

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
      <div className="h-4 w-full bg-gray-200 rounded mb-2" />
      <div className="h-4 w-full bg-gray-200 rounded mb-2" />
      <div className="h-4 w-2/3 bg-gray-200 rounded" />
    </div>
  )
}
```

Behind the scenes: the layout renders as part of the static shell, the skeleton shows instantly as the Suspense fallback, and when the page resolves its HTML replaces the skeleton.

This is a fine solution where there's nothing meaningful to show until the data resolves. But it isn't free — the entire page falls back to one big skeleton. So I usually treat it as just the first step.

## Where it really shines: granular Suspense

The real win comes when you push fallbacks down into specific sections. The static shell then holds more real content, and each slow section streams on its own. When multiple components do async work, wrap each in its own `<Suspense>` boundary.

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react'
import { Revenue } from './revenue'
import { RecentOrders } from './recent-orders'
import { Recommendations } from './recommendations'

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <div className="grid grid-cols-2 gap-4">
        <Suspense fallback={<p>Loading revenue…</p>}>
          <Revenue />
        </Suspense>
        <Suspense fallback={<p>Loading orders…</p>}>
          <RecentOrders />
        </Suspense>
      </div>
      <Suspense fallback={<p>Loading recommendations…</p>}>
        <Recommendations />
      </Suspense>
    </div>
  )
}
```

If `Revenue` resolves in 200 ms, `RecentOrders` in 1 s, and `Recommendations` in 3 s, the user sees each section the moment its data is ready. Meanwhile `<h1>` sits in the shell — important for LCP, more on that below.

## Trick number one: don't push dynamics up

This is probably the most common mistake I see. If you `await` `params`, `searchParams`, `cookies()`, `headers()`, or data at the top of a layout or page, **everything below that point becomes dynamic** and can't be part of the static shell. You've just killed the whole streaming benefit.

The fix: don't request the promise up top — pass it down to the component that actually needs it, and resolve it there inside `<Suspense>`.

```tsx
// app/dashboard/layout.tsx
import { Suspense } from 'react'
import { Nav } from './nav'
import { UserMenu } from './user-menu'
import { cookies } from 'next/headers'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies() // start the work, but don't await

  return (
    <div>
      <Nav>
        <Suspense fallback={<p>Loading user…</p>}>
          <UserMenu cookiePromise={cookieStore} />
        </Suspense>
      </Nav>
      {children}
    </div>
  )
}
```

Here both `<Nav>` and `{children}` render as the static shell, because the layout awaits nothing. Only `<UserMenu>` suspends when it resolves the cookie. Had the layout called `await cookies()` up top, the whole thing would have blocked.

## Web Vitals: what streaming actually improves, and what it can break

Worth being precise here, because streaming is not a magic wand for every metric. The [Core Web Vitals](https://web.dev/articles/vitals) thresholds didn't change in 2026: LCP good under 2.5 s, INP under 200 ms, CLS under 0.1. TTFB isn't a Core Web Vital, but the common recommended bar is under 200 ms.

**TTFB and FCP** — without streaming, the server waits on all data, so TTFB equals the slowest query. With streaming it sends the shell right away and TTFB drops to the time it takes to render layouts and fallbacks. That's the "faster feel, no tricks."

**LCP** — careful, this is where streaming can hurt you. If your LCP element (a hero image, a main heading) sits inside a Suspense boundary, it won't paint until that boundary resolves. Keep LCP elements **outside** or **above** Suspense boundaries. For images, use the `preload` prop on `next/image` — it injects a `<link rel="preload">` into the `<head>`, so the browser starts fetching the image from the very first chunk. If you're chasing LCP elsewhere too, I have a separate piece on [the seven most common causes of LCP over 2.5 s](/en/blog/lcp-nad-2-5s-pricin/).

**CLS** — when a fallback is replaced by content of a different size, the layout reflows. Design skeletons with the **same dimensions** as the final content, or reserve space with `min-height`. Otherwise you produce exactly the kind of [layout shift that wrecks mobile](/en/blog/cls-mobil-banner/).

**INP** — streaming enables selective hydration. Each `<Suspense>` boundary is a hydration unit, so React doesn't hydrate the whole page in one blocking pass but in pieces that yield the main thread. That helps responsiveness.

## Where real infrastructure breaks it

Streaming looks great on `localhost`, but between the server and the client there's infrastructure that can buffer the response and kill the whole effect:

- **Reverse proxies** (Nginx and friends) buffer by default. Disable it with the `X-Accel-Buffering: no` header.
- **CDNs** — some buffer the entire response before forwarding it. Check whether your provider supports chunked responses.
- **Serverless** — not every environment supports streaming. AWS Lambda requires response streaming mode to be explicitly enabled; Vercel handles it natively.
- **Compression** — gzip/brotli holds data while it has enough to compress, which can add latency to the first visible chunk.

To confirm the response really flows in pieces, check Chrome DevTools: in the Network tab, select the document and look at "Timing" — an early TTFB with a long "Content Download" phase means it's streaming. Or run a short `fetch` script with `Accept-Encoding: identity` so compression doesn't buffer your chunks.

## One HTTP trap to close with

Once streaming starts, the headers — status code included — have already been sent and **can't be changed**. If `notFound()` fires mid-stream, Next.js can no longer return a 404 — instead it injects `<meta name="robots" content="noindex">`. So put a fast existence check and `notFound()` **before** any `await` or `<Suspense>` if you want a real HTTP status.

That's the whole thing. No magic library, no trick — just sensible boundary placement and the discipline not to push dynamics up. If you're still deciding between the App and Pages Router, see my [rundown of what's still relevant in 2026](/en/blog/nextjs-app-vs-pages-router/) — full streaming is one of the main reasons I build new projects on the App Router today.
