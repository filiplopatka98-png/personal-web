---
title: "INP Under 200ms on WordPress: What Actually Moved the Needle"
date: 2026-02-18
read: 7
tags: ["Performance", "WordPress", "Core Web Vitals"]
excerpt: "An Interaction to Next Paint audit on a production WooCommerce store. From 480 ms to 165 ms via five specific changes — no theme rewrite, no hosting swap."
featured: false
---

INP (Interaction to Next Paint) replaced FID on March 12, 2024, and for WordPress stores it's a brutal reveal. FID only measured the first click. INP measures every interaction across the whole visit — and picks the worst one. It doesn't come cheap.

A client in the fashion space, WooCommerce 8.5, 14,000 SKUs, ~80k MAU. Before the audit, CrUX looked like this: **INP 480 ms at the 75th percentile**, which Google classifies as "Needs Improvement" (good is ≤ 200 ms, poor kicks in above 500 ms). After four weeks of work: **165 ms at the 75th percentile**, "Good" territory. No rebuild, no headless. Here's the exact breakdown of what helped and by how much. INP is just one of the three Core Web Vitals — if you're tackling a whole store, also check out [which pages to fix first on an eshop](/en/blog/cwv-eshop-priorita/).

## 1. Blocking event listeners in admin-ajax plugins

The biggest offender. A wishlist plugin (TI WooCommerce Wishlist) registered a global `click` listener on `document` via delegation — and inside the handler it did a synchronous `localStorage.getItem` plus a JSON parse over a 200+ item state. Every click anywhere on the page meant 80–120 ms of blocked main thread.

Fix: two lines in `functions.php` via `wp_dequeue_script` and a custom 30-line wishlist backed by `IndexedDB`, with the listener lazily registered only on `.product-card` elements.

```js
// Instead of delegating from document
document.querySelectorAll('.product-card').forEach(card => {
  card.querySelector('.wishlist-btn')?.addEventListener('click', toggle, { passive: true });
});
```

**Before:** INP-on-click p75 ~ 220 ms. **After:** ~ 45 ms. This fix alone shaved -150 ms off the overall INP.

## 2. Deferring non-critical third-party JS (Tidio, Smartsupp, Hotjar)

The Tidio chat widget loaded ~340 KB of JS at `DOMContentLoaded`. Hotjar another 90 KB. Smartsupp tag manager 60 KB. All synchronous on entry, all registering event listeners before the first interaction even happened.

The fix: instead of `<script>` tags in `<head>`, I load them via `requestIdleCallback` (with a `setTimeout` fallback for Safari, which still doesn't ship it by default in stable versions) up to 3 seconds after the `load` event, or on the first `pointerdown` — whichever comes first.

```js
const loadDeferred = () => {
  ['https://code.tidio.co/PUBLIC_KEY.js',
   'https://static.hotjar.com/c/hotjar-XXXX.js'].forEach(src => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    document.head.appendChild(s);
  });
};

if ('requestIdleCallback' in window) {
  requestIdleCallback(loadDeferred, { timeout: 3000 });
} else {
  setTimeout(loadDeferred, 3000);
}

['pointerdown', 'keydown'].forEach(ev =>
  addEventListener(ev, loadDeferred, { once: true, passive: true })
);
```

INP improvement: **-90 ms p75**. Bonus: TBT dropped by 40 %. If server-side latency is also bugging you, I've got a separate write-up on how to get [server response time under 200 ms with cache, edge, and prefetch](/en/blog/server-response-200ms/).

## 3. requestIdleCallback for analytics tracking

GA4 + Meta Pixel + a custom server-side tracking endpoint. Every interaction fired `gtag('event', ...)` synchronously inside the event handler. `gtag` itself isn't expensive, but the Meta Pixel `fbq` has an event-normalization layer that runs ~12 ms on mobile.

The trick: defer the tracking, not the action itself.

```js
addToCartBtn.addEventListener('click', e => {
  // 1. UI update — immediately
  updateCartUI();
  // 2. Server call — immediately
  fetch('/wc-ajax/add_to_cart', { ... });
  // 3. Tracking — whenever there's time
  requestIdleCallback(() => {
    gtag('event', 'add_to_cart', payload);
    fbq('track', 'AddToCart', payload);
  });
});
```

INP-on-click dropped by another ~25 ms. The user sees the UI react within 80 ms, and tracking catches up in the next idle slot.

## 4. Virtualizing the product grid

Category listings showed 50 products per page by default. The client wanted "60 or 80 if possible" for better UX and SEO. Without virtualization, 80 products = 80 images in the DOM, 80 hover handlers, layout shifts while scrolling.

I used a "virtual" list built on `IntersectionObserver` — I render only 24 visible cards + 8 buffer, and the rest are placeholder `<div>`s with the same height. As you scroll, I swap the content in. No library needed, ~120 lines of vanilla JS.

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => e.isIntersecting ? hydrate(e.target) : dehydrate(e.target));
}, { rootMargin: '400px 0px' });

document.querySelectorAll('.product-slot').forEach(slot => observer.observe(slot));
```

I could show **200 products per page** instead of 50 and INP didn't get any worse. Category conversion went up 12 % (less clicking back and forth between paginated pages).

## 5. Plugin diet

From the original 31 active plugins, 12 survived. The worst offenders were "iThemes Sync" (legacy, loaded everywhere), "WP Statistics" (roughly 80 KB of JS on every page view), and "Yoast SEO Premium" (most of its features are now covered by WP core plus 40 lines in `functions.php`).

A plugin diet isn't a one-time thing — it's a monthly ritual. For each plugin I ask three questions:

- Does this plugin add frontend JS/CSS, or is it admin-only?
- Is there a native alternative in core, in the theme, or in 30 lines in `functions.php`?
- Does the author actively maintain the plugin (updated in the last 6 months)?

If the answers are bad, the plugin goes. I broke this down in more detail in [Plugin diet: from 28 to 9](/en/blog/plugin-dieta-z-28-na-9/).

## TL;DR — before/after

| Metric | Before | After |
|---|---|---|
| INP p75 (CrUX, mobile) | 480 ms | 165 ms |
| TBT (Lighthouse mobile) | 1,240 ms | 380 ms |
| JS payload (initial) | 612 KB | 244 KB |
| Active plugins | 31 | 12 |

The biggest INP problem isn't the framework or the theme. It's plugins that register `click` listeners on `document` and do synchronous work inside them. Open DevTools → Performance → record an interaction and look for long Tasks on user input. Then trace the script's origin in the waterfall panel. It'll often be a plugin you had no idea was doing anything on the frontend at all.

**Related:** [7 most common causes of LCP above 2.5 s](/en/blog/lcp-nad-2-5s-pricin/) · [Core Web Vitals on an eshop: what to fix first](/en/blog/cwv-eshop-priorita/)
