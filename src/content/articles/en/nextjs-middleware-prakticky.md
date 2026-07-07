---
title: "Next.js middleware in practice: auth, geo, and A/B without the cruft"
date: 2026-11-05
read: 8
tags: ["Next.js"]
excerpt: "Real-world middleware use cases in Next.js: optimistic auth, geo redirects, and A/B tests. Plus what changed in Next.js 16 with the rename to proxy."
featured: false
---

Middleware in Next.js is one of those things people either don't use at all, or they cram half the app into it and then wonder why every request crawls. The truth is somewhere in the middle. It runs before a request completes, which makes it good for exactly three things: rewriting or redirecting a request, touching headers and cookies, and making fast decisions based on who and where the visitor is. Nothing more.

And right up front, the most important change: in **Next.js 16** (released October 21, 2025), `middleware.ts` was renamed to `proxy.ts`. If you're starting a new project in 2026, you write proxy, not middleware. Let's do this properly.

## What changed in Next.js 16: middleware → proxy

Vercel renamed the file to make it clearer what it actually does — it sits as a network layer in front of the app, not as an Express-style middleware chain. Specifically:

- `middleware.ts` → `proxy.ts` (in the project root or in `src/`, at the same level as `app`)
- the exported function is now called `proxy` instead of `middleware`
- config flags with `middleware` in the name were renamed too — e.g. `skipMiddlewareUrlNormalize` is now `skipProxyUrlNormalize`

The most consequential difference is the runtime. **Proxy runs on the Node.js runtime and this cannot be reconfigured.** The Edge runtime is not supported in `proxy` — if you genuinely need it, you have to stick with `middleware.ts` for now, which is marked deprecated and will eventually be removed. For 90% of projects the Node.js runtime is good news: you can finally import regular Node libraries without dancing around edge constraints.

You don't have to migrate by hand. The codemod does it for you:

```bash
npx @next/codemod@canary upgrade latest
```

It renames the file, the function, and those config flags. I'd recommend running it even if you're migrating manually for something else — so you don't forget.

The rest of this article uses the `proxy` terminology, but everything applies equally if you're still on 15 with `middleware`. The `NextRequest`/`NextResponse` API is identical.

## Matcher: don't run proxy on every request

The first mistake I regularly see: proxy running on literally everything, including static assets and images. Pointless overhead on every single `.png`. `config.matcher` fixes it:

```ts
// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // ...logic
  return NextResponse.next()
}

export const config = {
  matcher: [
    // everything except internal paths, API, and static files
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

The matcher takes a string or an array and supports full regex patterns. Always use it — it's the cheapest performance win proxy gives you. The tighter the matcher, the fewer requests have to pass through proxy at all.

## Use case 1: optimistic auth

This is the most common reason people reach for proxy — and also where they most often get it wrong. The Next.js docs say it plainly: **proxy is not a session management or authorization solution.** It's meant for an *optimistic check* — a quick "do you even have a cookie? no? off to login you go" — not for verifying whether a session is actually valid.

Why? Because proxy is supposed to be fast. There should be no database call on every request. Verifying the session (querying the DB, checking expiration) belongs in a server component or your data access layer, where you need it anyway. Proxy just cuts off the obviously logged-out visitor before a protected page even starts rendering.

```ts
// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get('session')?.value

  const isProtected = pathname.startsWith('/dashboard')

  if (isProtected && !session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

Notice what's **not** here: no `await db.session.find(...)`, no verifying the token signature against a secret, no fetching the profile. Just "a cookie exists." The real verification happens in `/dashboard`, where the page reads the session through the data access layer anyway. This two-layer approach is the recommended pattern straight out of the Next.js authentication docs.

One more small thing that trips people up over a couple of characters: `fetch` with `cache`, `next.revalidate`, or `next.tags` has **no effect** inside proxy. If you're used to cached fetches from components, that doesn't hold here.

## Use case 2: geo redirects

A classic for a shop selling into multiple countries, or a site with language variants. You want a visitor from Slovakia sent to `/sk`, one from the Czech Republic to `/cz`, and everyone else to the default.

Here's a detail that burns a lot of people: **`request.geo` and `request.ip` no longer exist on `NextRequest`.** Vercel removed them in Next.js 15, reasoning that they were effectively a Vercel-specific thing and shouldn't be part of the framework. If you deploy on Vercel, you pull geolocation from the `@vercel/functions` package:

```ts
// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { geolocation } from '@vercel/functions'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // already redirected or a static file? do nothing
  if (pathname.startsWith('/sk') || pathname.startsWith('/cz')) {
    return NextResponse.next()
  }

  const { country } = geolocation(request)

  const locale = country === 'CZ' ? 'cz' : 'sk'
  return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url))
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
```

If you're not on Vercel, your host or CDN has to hand you the geolocation via a header (Cloudflare sends `CF-IPCountry`, others have their own). Then you read it with `request.headers.get('cf-ipcountry')`. Don't count on someone serving you the country for free — that's exactly what Vercel was signaling by removing `request.geo`.

A practical note on UX: automatic geo redirects can annoy people. A Czech vacationing in Croatia gets the Croatian variant even though they want Czech. In practice I typically use geo only as a *first guess* and let the user simply switch language — remembering the choice in a cookie that I check in proxy before geo.

## Use case 3: A/B tests and experiments

The third legitimate use case, one the Next.js docs mention directly: rewriting to different pages based on an A/B test. The principle is clean — you assign the visitor a variant once, store it in a cookie, and proxy then transparently rewrites them to the right version. The URL in the browser stays the same; only what gets served changes.

```ts
// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== '/') {
    return NextResponse.next()
  }

  // assign a variant once and keep it in a cookie
  let variant = request.cookies.get('ab-variant')?.value
  if (variant !== 'a' && variant !== 'b') {
    variant = Math.random() < 0.5 ? 'a' : 'b'
  }

  const url = request.nextUrl.clone()
  url.pathname = `/home-${variant}` // /home-a or /home-b

  const response = NextResponse.rewrite(url)
  response.cookies.set('ab-variant', variant, {
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  return response
}

export const config = {
  matcher: ['/'],
}
```

The difference between `rewrite` and `redirect` is crucial here. `redirect` sends the browser a 3xx and the URL changes — the visitor sees they landed on `/home-a`. `rewrite` serves the content of a different path while the URL stays `/`. For an A/B test you want `rewrite`, so the test is invisible to the user.

The cookie matters: without it the variant would be rolled on every request, and the same person would see A and B alternating. That wrecks your whole measurement. Assign once, hold for 30 days.

## Where proxy does not belong

To round it out — a few things you should not put in proxy, even if it technically works:

- **Slow data fetching.** The docs say it explicitly: proxy is not for slow data fetching. Every millisecond here delays absolutely every request.
- **Full authorization.** Optimistic check yes; deciding permissions based on the DB no.
- **Heavy logic.** If you're doing more than a redirect, headers, and a simple decision, ask whether it belongs in the [App Router and server components](/en/blog/nextjs-app-vs-pages-router/) or in [server actions](/en/blog/nextjs-form-actions/).

Proxy is a scalpel, not a Swiss Army knife. The three use cases above — auth check, geo, A/B — cover the vast majority of what you'll actually need it for. If your proxy starts sprawling, that's almost always a sign the logic belongs somewhere else. And if you're dealing with caching and revalidation around it, look at the [differences between revalidate, tag, and path](/en/blog/nextjs-cache-revalidate/) — that's a different layer, and it mixes with proxy surprisingly often.
