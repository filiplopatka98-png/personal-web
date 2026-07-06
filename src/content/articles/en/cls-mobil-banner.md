---
title: "CLS on Mobile: Why Dynamic Banners Wreck Your Layout"
date: 2025-11-12
read: 6
tags: ["Performance", "Core Web Vitals", "UX"]
excerpt: "The three most common sources of mobile CLS and how to reserve space for each one — from the cookie banner to a YouTube embed. Goal: CLS under 0.1 with no UX compromises."
featured: false
---

CLS (Cumulative Layout Shift) is the one metric in [Core Web Vitals](/en/blog/cwv-eshop-priorita/) that doesn't measure speed — it measures stability. A user taps a CTA, the banner shoves everything down, and they hit an ad instead. Frustration, bounce. Google sees all of this through the `LayoutShift` API and keeps score — anything past 0.1 on mobile is "Needs Improvement," and above 0.25 is "Poor."

Over the past year I've pinned down three recurring sources of CLS that cover an estimated 80% of cases: the cookie consent banner, lazy-loaded iframes (YouTube/Vimeo), and ad/widget slots. Here's a detailed breakdown with fixes for each.

## 1. Cookie consent banner (Cookiebot, Iubenda, CookieYes)

The classic offender. The banner gets injected into the DOM **after** the load event, at the top of the page, and pushes the whole layout down by 80–140 px. On its own it can add **0.15–0.40** to your CLS. Often more than the entire rest of the page combined.

**Diagnosis:** open the page in Chrome DevTools → Performance → Web Vitals overlay. Watch for where the CLS spike shows up — if the whole page jumps down in the first 800 ms, you've got a consent banner.

**Fix 1 — fixed positioning:** the simplest one. Let the banner be `position: fixed` or `position: sticky` at the bottom. Nothing above it gets pushed. Cookiebot handles this with its "Bottom" template, Iubenda through its "floating banner" configuration.

```css
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  /* žiadne stlačenie obsahu */
}
```

**Fix 2 — reserved placeholder:** if it absolutely has to sit up top, drop an empty div with the same height into the server-side HTML. The banner just fills it in.

```html
<div id="cookie-slot" style="min-height: 120px"></div>
```

```js
// po načítaní pluginu
document.getElementById('cookie-slot').innerHTML = bannerHTML;
```

CLS drops from 0.32 to 0.02 overnight.

## 2. Lazy iframe embeds (YouTube, Vimeo, Spotify)

`<iframe loading="lazy">` with no `width`/`height` attributes. The browser has no idea how much space to reserve, so it defaults to 300 × 150 px, then the video pulls in its metadata and the iframe snaps to 16:9. That's **0.05–0.15** of CLS per embed.

**Fix 1 — aspect-ratio:**

```html
<div class="video-wrapper">
  <iframe src="..." loading="lazy" allowfullscreen></iframe>
</div>

<style>
.video-wrapper {
  aspect-ratio: 16 / 9;
  width: 100%;
}
.video-wrapper iframe {
  width: 100%;
  height: 100%;
  border: 0;
}
</style>
```

`aspect-ratio` is [supported](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio) in every modern browser (Safari 15+, Chrome 88+, Firefox 89+). For older browsers, fall back to the padding-bottom hack.

**Fix 2 — facade pattern:** lite-youtube-embed or lite-vimeo. As a bonus you shave roughly 500 KB off the initial load. They show a static thumbnail and a play button, and the iframe only loads on click. The same logic applies to images — see [when to reach for native lazy-loading and when to go custom](/en/blog/image-lazy-loading-native-vs-custom/).

## 3. Ad slots, nutrition boxes, "You might also like"

The staple of content sites. A slot for AdSense or native advertising fills in asynchronously 1.5 s after load. With no `min-height`, the article content jumps.

**Fix:** reserve the **maximum** expected height, not the average. If a slot might hold either a 250 px banner or 600 px of sponsored content, set `min-height: 600px`. Yes, the empty space looks silly for a second, but CLS = 0 and Google pays you back in rankings.

```css
.ad-slot {
  min-height: 280px; /* MPU 300x250 + label */
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.ad-slot::before {
  content: 'Reklama';
  color: #999;
  font-size: 12px;
}
```

For dynamic heights (Mediavine adaptive ad units) use `aspect-ratio` or a `min-height` driven from the backend via a data attribute.

## Skeleton placeholders for custom widgets

If you're rendering something over fetch (reviews, related products, an Instagram feed), a placeholder with the same dimensions is non-negotiable.

```css
.skeleton-card {
  width: 100%;
  height: 320px; /* presne ako finálna karta */
  background: linear-gradient(90deg, #eee, #f5f5f5, #eee);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

Once the data lands you swap the content, but the dimensions stay put. CLS = 0.

## How to measure CLS for real

Lighthouse in a lab run won't catch everything — it measures for about 5 seconds. CLS can also happen on scroll (lazy-loaded images with no dimensions). Best practice:

1. **CrUX data** in PageSpeed Insights — a 28-day rolling average from real Chrome users on mobile.
2. **The web-vitals JS library** — ships CLS values to GA4 or your own endpoint.

```js
import { onCLS } from 'web-vitals';
onCLS(({ value, entries }) => {
  // entries[i].sources ti povie KTORÝ element robil shift
  console.log('CLS', value, entries);
  gtag('event', 'web_vitals', { metric: 'CLS', value });
});
```

Tip: `entries[i].sources[j].node` hands you a reference in DevTools to the element that caused the shift. That's how you find the culprit in seconds, not minutes.

## TL;DR

CLS under 0.1 is no magic trick. Three rules:

- Every `<img>` and `<iframe>` has `width`/`height` or `aspect-ratio`.
- Every dynamic slot reserves a `min-height` for its **maximum** expected height.
- The cookie banner is `position: fixed` and never gets inserted into the DOM flow.

Start with the cookie banner — it's the biggest ROI on mobile, often a single toggle in the config, and CLS drops below 0.05.

**Related:** [LCP over 2.5s? The 7 most common causes in practice](/en/blog/lcp-nad-2-5s-pricin/) · [Core Web Vitals on an e-shop: which pages to fix first](/en/blog/cwv-eshop-priorita/)
