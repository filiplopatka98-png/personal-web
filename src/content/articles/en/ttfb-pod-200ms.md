---
title: "TTFB under 200 ms: where the time actually goes"
date: 2026-08-04
read: 8
tags: ["Performance","Hosting"]
excerpt: "TTFB isn't one number — it's the sum of five phases. How to break it apart with Server-Timing and Navigation Timing and find out whether DNS, TLS, DB, or the edge is to blame."
featured: false
---

"Our site is slow." The first thing I do isn't optimization — it's measurement. Because TTFB (Time to First Byte) is not one number. It's the sum of five phases, and when you only see it as `TTFB: 640 ms` in a single column, you have no idea where to reach. It could be a redirect, DNS, the TLS handshake, server processing, or a cache miss at the edge. Each one is fixed in a completely different way.

This article is about breaking TTFB into its components. If you're after ready-made cache configs for WordPress, I have a [separate piece on server response time](/en/blog/server-response-200ms/). Here we go one level deeper — how to figure out *which* layer to touch in the first place.

## What TTFB is made of

Per web.dev, TTFB is made up of five phases: redirect, service worker startup, DNS lookup, connection + TLS negotiation, and finally the request itself up to the first byte of the response. The thresholds are clear — **a good TTFB is 0.8 s or less, poor is above 1.8 s** (at the 75th percentile of real users). Note: TTFB itself is *not* a Core Web Vital. It's a diagnostic metric. But it's the ceiling of your LCP — if the server stays silent for 800 ms, no frontend trick will get you [LCP under 2.5 s](/en/blog/lcp-nad-2-5s-pricin/).

The "under 200 ms" goal is entirely realistic for static or well-cached content. A CDN edge can return a cached page in 20–50 ms. The problem is that those 200 ms can leak away in ten different places, and you need to know which one.

## Step 1: break TTFB apart in the browser

The Navigation Timing API is free in every browser. Here's the raw version that shows you the individual phases in milliseconds:

```js
new PerformanceObserver((list) => {
  const nav = list.getEntriesByType('navigation')[0];
  console.table({
    redirect:  nav.redirectEnd - nav.redirectStart,
    dns:       nav.domainLookupEnd - nav.domainLookupStart,
    tcp:       nav.connectEnd - nav.connectStart,
    tls:       nav.secureConnectionStart
                 ? nav.connectEnd - nav.secureConnectionStart : 0,
    ttfb:      nav.responseStart,
    server:    nav.responseStart - nav.requestStart,
  });
}).observe({ type: 'navigation', buffered: true });
```

`server` (the `responseStart − requestStart` delta) is the time the request spent "in the air and on the server" after the connection was established. If DNS is 120 ms and TLS is 90 ms, your backend can be lightning fast and you're still over 200 ms — the culprit is the network, not the code.

One important detail from 2025/2026: Chrome kept changing the definition of `responseStart`. As of Chrome 133, if the server sends `103 Early Hints`, `responseStart` reflects that early 103 response, not the final headers. So after enabling Early Hints, your *reported* TTFB drops even though the server takes just as long to compute. Measure real server time via `finalResponseHeadersStart` or Server-Timing. Don't get fooled by a graph that "magically" fell off a cliff.

## Step 2: Server-Timing — the only way to see inside the server

Navigation Timing tells you the server ran for 380 ms. It won't tell you that 300 ms of that was one unfortunate SQL query. For that there's the `Server-Timing` HTTP header — a W3C standard that works in all major browsers and shows up in DevTools' Network tab as well as through the `PerformanceServerTiming` API.

The server adds it to the response and you pour your own measurements into it:

```
Server-Timing: db;dur=182;desc="MySQL", tpl;dur=94;desc="render", app;dur=41
```

In PHP you can assemble it straight from real measurements — no APM, no extra dependencies:

```php
$t0 = microtime(true);
// ... DB queries ...
$dbMs = (microtime(true) - $t0) * 1000;

header(sprintf('Server-Timing: db;dur=%.1f;desc="MySQL"', $dbMs), false);
```

And you read it on the client like this:

```js
const nav = performance.getEntriesByType('navigation')[0];
for (const t of nav.serverTiming) {
  console.log(t.name, t.duration, t.description);
}
```

This is the moment guessing turns into diagnosis. I regularly see a dev spend three days "optimizing the template" while 80% of TTFB is eaten by one unfortunate `meta_query` with no index. Server-Timing shows you that in ten seconds. A couple of notes from practice: send the header before you start streaming the response body, and for cross-origin measurement you also need `Timing-Allow-Origin`, otherwise the browser hides the values.

## Step 3: where the time actually leaks

Once you've broken the numbers apart, the culprit is usually in one of these layers:

**Redirects.** Every redirect is a whole extra round-trip — often 100–300 ms. An `http → https` and `non-www → www` chain can easily add two of them. The fix is `Strict-Transport-Security` (HSTS), which tells the browser to go straight to HTTPS and skip the HTTP redirect entirely.

**DNS and TLS.** A cold DNS lookup and a full TLS handshake are tens of milliseconds you pay only on the first connection. HTTP/3 and TLS 1.3 (0-RTT resumption) shorten them significantly — and that's one of the most tangible reasons to route traffic through a decent CDN instead of straight to origin.

**Server processing.** This is where 90% of real problems live: PHP with no opcache, missing object cache, N+1 queries, blocking third-party calls right inside the request cycle. The Server-Timing from step 2 shows you the exact ratio of DB vs. render vs. app.

**Cache miss at the edge.** If one region sits above 500 ms while the rest are under 50 ms, that PoP simply missed the cache or routing is sending it the long way. The key is `stale-while-revalidate` — the edge returns the stale copy to the user immediately and fetches a fresh one in the background, so nobody waits on the origin:

```
Cache-Control: public, max-age=0, must-revalidate
CDN-Cache-Control: public, s-maxage=60, stale-while-revalidate=300
```

For dynamic content that can't be cached for hours, micro-caching works — a TTL of 1–10 seconds. The origin generates the response once and the edge hands it to every request in that window. On Nginx this moves one server from a handful to hundreds of requests per second.

## Step 4: when the backend really has to compute

Not everything can be cached. A personalized page, a logged-in user, checkout — the backend genuinely has to work there and some server time is simply unavoidable. That's where `103 Early Hints` helps: the server sends an early 103 response with `Link: preconnect`/`preload` for critical resources while it's still computing the body. Meanwhile the browser opens connections and downloads CSS.

```
HTTP/2 103 Early Hints
Link: </styles/main.css>; rel=preload; as=style
Link: <https://fonts.example.com>; rel=preconnect
```

Support is solid: Chrome/Edge 103+, Firefox 123+ (both preconnect and preload), Safari 17+ preconnect only for now. It works **only over HTTP/2 or HTTP/3** and only for navigation requests — over HTTP/1.1 forget it. It's not a miracle for TTFB itself (the server still computes just as long), but it cuts time-to-LCP by filling the "dead" server wait with useful work.

## How I approach it

The order is always the same: **measure first, optimize second.** Break TTFB apart with Navigation Timing, ship Server-Timing with at least three marks (`db`, `render`, `app`), and look at the ratio. Only once you see where the time is do you decide: DB → index or cache; render → object cache; network → CDN, HTTP/3, HSTS; edge → `stale-while-revalidate`.

Most "slow sites" I see don't have one big problem — they have three small ones that add up to 700 ms. And without Server-Timing you're guessing blind. With it you see them in DevTools in one reload. That's the whole secret to TTFB under 200 ms: not a magic trick, just refusing to guess.
