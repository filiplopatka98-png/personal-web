---
title: "Astro 5 + view transitions for e-commerce: what already works"
date: 2026-02-18
read: 7
tags: ["Astro", "UX", "Performance"]
excerpt: "Astro 5 ships a stable view transitions API. An SPA feel without a React shell, a persistent header and cart, smooth crossfades. Plus 3 gotchas you'll hit on a real online store."
featured: false
---

Astro 5's view transitions API is stable (it's been stable since Astro 3.0; in 5.0 the `<ViewTransitions />` router was renamed to `<ClientRouter />`). For e-commerce that means you can get an SPA feel (no full reload, no white flash) without having to bootstrap an entire React shell. In practice: the same speed as plain Astro, but UX like you'd get out of Next.js. (If you're weighing those two right now, I put together a [decision table for Astro vs Next.js](/en/blog/astro-vs-nextjs-tabulka/).)

Here's what I found after shipping this on 3 smaller online stores.

## Setup is a single import

In your root layout you add `<ClientRouter />` (formerly `<ViewTransitions />` in Astro 4):

```astro
---
import { ClientRouter } from "astro:transitions";
---
<html lang="sk">
  <head>
    <ClientRouter />
  </head>
  <body>
    <slot />
  </body>
</html>
```

That's it. Out of the box you get a subtle crossfade between navigations. Browser support: the native View Transitions API runs in Chromium 111+ and Safari 18+; Firefox 144 (October 2025) added same-document view transitions, but it doesn't yet support the cross-document navigation that `<ClientRouter />` uses. Nothing breaks because of that, though — Astro has a default `animate` fallback that simulates the transition even without the native API (Firefox falls into it too). Alternatively you can set `fallback="swap"` (instant swap, no animation) or `fallback="none"` (a classic full navigation).

## Persistent header and cart

This is where it starts to pay off. You don't want to re-render the header with the cart item counter on every navigation — the counter would flicker and you'd duplicate network requests.

```astro
<header transition:persist="site-header">
  <Logo />
  <CartCounter client:load />
</header>
```

`transition:persist` tells Astro: don't throw this DOM node away, reuse it after navigation. The React/Preact island inside keeps running without a remount. So the cart counter holds its state even when a user moves from `/produkty/topanky-1` to `/produkty/topanky-2`.

Watch out for one detail: a persistent island **doesn't remount and keeps its state, but it re-renders with the new props** from the destination page (if you want to keep the original props too, add `transition:persist-props`). And if you want to run something on every page inside it (say, an analytics view event), don't keep that directly in the island — listen for the `astro:page-load` event.

## Gotcha #1: form state gets lost

Default behavior: navigation throws forms away. If the user has typed their address into the checkout form and accidentally hits "Back," the text is gone.

Fix:

```astro
<form transition:persist="checkout-form" method="post" action="/api/order">
  <input name="email" type="email" required />
  <input name="adresa" type="text" required />
  <button>Objednať</button>
</form>
```

`transition:persist` on the `<form>` element preserves the DOM and its descendants across navigation, including the filled-in values.

## Gotcha #2: flickering third-party widgets

Smartsupp chat, Tawk.to, the Google Ads pixel, GA4 — they all detach and reattach on navigation. The chat widget disappears for 200 ms and then reloads from scratch. It looks like a bug.

Good news: classic (bundled) scripts in Astro run only once. After the first run, Astro ignores them on subsequent navigations even when they're on the new page. So the trouble mostly comes from inline scripts that bootstrap third-party SDKs. For those it's enough to run initialization just once, gated on `window`:

```astro
<script is:inline>
  // Bootstrap len raz, nie na každej navigácii
  if (!window.__chatBooted) {
    window.__chatBooted = true;
    (function(d) {
      var s = d.createElement('script');
      s.src = 'https://example.com/widget.js';
      d.head.appendChild(s);
    })(document);
  }
</script>
```

## Gotcha #3: your own JS doesn't run again

The classic pattern:

```js
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".product-gallery").forEach(initGallery);
});
```

This used to run on every page load. With view transitions, `DOMContentLoaded` fires only once (on the first load). For subsequent navigations you use `astro:page-load`:

```js
document.addEventListener("astro:page-load", () => {
  document.querySelectorAll(".product-gallery").forEach(initGallery);
});
```

`astro:page-load` always fires — on the first load and after every view transition. You don't need `DOMContentLoaded` anymore.

Other events that come in handy:

- `astro:before-preparation` — before the new page is fetched
- `astro:after-preparation` — new page fetched, not yet shown
- `astro:before-swap` — right before the DOM swap
- `astro:after-swap` — DOM swap complete

## Custom transitions for a specific element

The default crossfade is fine, but going from a product card in a listing to the product detail looks better as a "shared element transition":

```astro
<a href="/produkt/topanky-1">
  <img
    src="/img/topanky-1.jpg"
    transition:name="produkt-1"
    alt="Topánky model X"
  />
</a>
```

And on the detail page:

```astro
<img
  src="/img/topanky-1.jpg"
  transition:name="produkt-1"
  alt="Topánky model X — detail"
/>
```

The same `transition:name` on both sides → the browser animates them as a shared element. It only works where the native View Transitions API runs (Chromium 111+, Safari 18+), but there it looks premium.

## Scroll restoration

Astro view transitions handle scroll position restoration on back/forward navigation automatically. On forward navigation it scrolls to the top of the page — a sensible default. If you want custom behavior (e.g., restoring scroll in the product listing after returning from a detail), you use `astro:before-swap`:

```js
document.addEventListener("astro:before-swap", (e) => {
  if (e.from.pathname === "/produkty" && e.to.pathname === "/produkty") {
    // už handled defaultne
  }
});
```

## Real-world impact

An online store I migrated from Astro 4 (no transitions) to Astro 5 + ClientRouter:

- LCP unchanged (transitions don't affect LCP; the first page load works the same)
- **INP improved from 240 ms to 110 ms** — no full reload, the browser debounces nothing when you click a link (on WordPress you tune INP differently — I have a [separate article on getting INP under 200 ms](/en/blog/inp-pod-200ms-wordpress/) about that)
- Bounce rate on the product catalog **−14%** (subjectively: people browse more because "nothing's loading anyway")
- Conversion +8% (hard to attribute to transitions alone, but they played their part)

## TL;DR

`<ClientRouter />` + `transition:persist` on the header/cart + `astro:page-load` instead of `DOMContentLoaded` + an init guard on `window` for third-party scripts. Three gotchas (form state, flickering widgets, JS initialization), all with a one-line fix. Firefox and other browsers without the native API fall into the simulated fallback — nothing breaks.

It's worth it. Especially if you're coming from plain Astro and don't want to add a React shell.

**Related:** [Core Web Vitals on an online store: which pages to fix first](/en/blog/cwv-eshop-priorita/)
