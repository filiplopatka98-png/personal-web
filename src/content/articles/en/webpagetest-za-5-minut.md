---
title: "How to Read a WebPageTest Report in 5 Minutes"
date: 2025-09-25
read: 6
tags: ["Performance", "Core Web Vitals"]
excerpt: "The three charts I look at first in a WebPageTest report — filmstrip, waterfall, connection view. A concrete workflow from report URL to spotting the fix."
featured: false
---

WebPageTest is one of the best free tools for a performance audit, but its UI looks like it's from 2010 and the report has 30+ tables. On every audit I only look at three charts — and thanks to them I can pinpoint the primary problem in 5 minutes. Here's the exact workflow.

## Setup: how to configure the test

First, a few battle-tested test settings, otherwise the report is worthless:

- **Location:** Frankfurt, Germany (closest for Slovak visitors). For Czech projects, Prague (via the `EC2 - Prague` location or Linode Prague).
- **Browser:** Chrome (default), mobile — Motorola G (gen 4) or iPhone 13 if you want a realistic mobile profile.
- **Connection:** **4G** (9 Mbps down, 170 ms RTT). Not cable, not 4G LTE — 4G is a realistic average for rural Slovakia.
- **Number of runs:** **3** (default). The median of three runs is your real worst case.
- **Capture Video:** **YES**. Without video you have no filmstrip, and you lose 50% of the insight.
- **Repeat View:** **YES**. The second load with a warm cache tells you how it'll go for returning visitors.

After the test you get a URL, for example `webpagetest.org/result/250915_AB_xyz/`. Open the "Median Run" tab.

## Chart 1: Filmstrip — when do I actually see content

The first and most important view. The filmstrip shows you frames of the page every 0.5 s. It visualizes **perceived performance** — what the user actually sees.

Check three things:

### 1. When does the white screen go away?

If the first 2 seconds are completely white, you have a **render-blocking** problem. JS or CSS blocking the first paint. In the report, look for the "Start Render" metric — if it's above 2 s, you've got something to fix.

### 2. When does the hero (LCP element) render?

The hero image should show up within 2.5 s. If it doesn't, head to the "LCP" section in the report — there you get the exact element identifier (CSS selector + a frame with the outline highlighted). If LCP keeps sitting above 2.5 s, walk through the [most common causes of a slow LCP in practice](/en/blog/lcp-nad-2-5s-pricin/).

### 3. Does the layout move during load?

On the filmstrip you can visually see content jumping around — that's CLS. If the frame at `0.5 s` has a banner up top and the frame at `1.0 s` has the banner lower down, you've got a shift. Click into "Visual Comparison" for a side-by-side view. This is exactly what plagues most mobile sites — see [why dynamic banners wreck the layout on mobile](/en/blog/cls-mobil-banner/).

The filmstrip tells you in 30 seconds whether you have a **rendering** problem or a **layout** problem. That decides where you go next.

## Chart 2: Waterfall — what's downloading and in what order

The second view. The waterfall is a horizontal chart of every HTTP request — when it started, how long it took, and where the DNS/TLS/TTFB/download phases are.

Three patterns I look for:

### Pattern A: Render-blocking JS/CSS at the top

The first 5–10 rows of the waterfall are request 1 (HTML), requests 2–4 (CSS), request 5+ (JS in the `<head>`). If you see a JS request without an `async`/`defer` attribute (WPT flags it with an icon), the browser waits until it downloads and executes before it moves on.

A concrete example: jQuery and `wp-emoji-release.min.js` in the `<head>` block rendering. Fix: `defer` via the `strategy` parameter in `wp_enqueue_script` (WP 6.3+).

```php
wp_enqueue_script('jquery', '...', [], null, ['strategy' => 'defer']);
```

### Pattern B: Third-party domains before first paint

In the "Domain" column, look for hostnames outside your own domain: `googletagmanager.com`, `connect.facebook.net`, `widget.tidio.co`, `ws.zoominfo.com`. If they're **before** the start render line, they're blocking rendering.

WPT shows "Start Render" as a vertical yellow line across the whole waterfall. Everything to the left of it is a problem.

### Pattern C: Late requests in a long tail

What's running at the end? Often it'll be analytics, tracking, retargeting. If the last request has a finish time of, say, 12 s even though LCP is at 2 s, it means the main thread is busy long after LCP — the user can't scroll smoothly.

## Chart 3: Connection View — DNS and TLS overhead

The third view, often overlooked. Connection View shows the **breakdown by connection** — how many domains you contact and how much time is spent on DNS lookup, TLS handshake, and idle time.

You open it via the "Performance Review" tab → "Connection View".

What I look for:

### Too many domains

If you see 15+ unique connections, you've got a third-party mess. Every domain = a DNS lookup (~30 ms) + a TLS handshake (~100 ms) on top. 5 pointless domains = 650 ms of latency.

Fix: consolidate. Cloudflare Zaraz proxies your tracking scripts (Google Analytics, Meta Pixel) — everything goes through your own domain and runs on the edge, not in the browser. Host fonts locally instead of Google Fonts. The Tidio chat can't be self-hosted, but at least preconnect it via `<link rel="preconnect" href="https://widget.tidio.co">`.

### Idle time on the main connection

If your primary domain has a long idle time between requests in Connection View, it means the server is responding slowly (high TTFB) or the browser is waiting to resolve the dependency tree. This points to a server-side problem, not a frontend one — like getting your [server response under 200 ms with cache, edge, and prefetch](/en/blog/server-response-200ms/).

## Repeat View — the impact of cache

After the first three, check the "Repeat View" tab. The second load with a warm cache should be **dramatically** faster — if it isn't, you're not using HTTP cache headers correctly.

Concrete signals: if LCP in Repeat View isn't under 1 s, your static assets have `Cache-Control: no-cache` or a completely missing `Cache-Control` header.

Fix: in nginx or `.htaccess`:

```nginx
location ~* \.(jpg|jpeg|png|webp|avif|svg|woff2|css|js)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}
```

Files with a revision hash (`app.4f3c2.js`) can be `immutable` — the browser will never re-request them.

## The 5-minute workflow: TL;DR

1. **Open report → Filmstrip.** When does the white screen go away, when does the hero render? (60 s)
2. **Open Waterfall.** Render-blocking JS/CSS before start render? Third-party before LCP? (90 s)
3. **Open Connection View.** Too many domains? (45 s)
4. **Open the Repeat View tab.** Is the warm cache working? (60 s)
5. **Identify the single biggest problem** and fix it. Test again. (45 s)

The most common findings, in order of frequency:

- Hero image without `fetchpriority="high"` (visible in the waterfall — it downloads late)
- Render-blocking script tag in the `<head>` without `defer`
- Too many third-party domains before first paint
- A cookie banner that causes CLS (visible on the filmstrip as a sudden jump)

WebPageTest has 30 more panels that occasionally help (Bytes, Requests, Domains, Custom Metrics), but in 90% of audits these three charts are enough. Start with them, fix the biggest problem, test again. Iterate.
