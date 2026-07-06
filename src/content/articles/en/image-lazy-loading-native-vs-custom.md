---
title: "Image lazy-loading: when to go native, when to go custom"
date: 2025-12-04
read: 6
tags: ["Performance", "Core Web Vitals"]
excerpt: "A decision tree for three lazy-loading scenarios — the native attribute, IntersectionObserver, and framework Image components. Code samples and the real-world limits of each."
featured: false
---

Lazy-loading images in 2026 is not rocket science. `<img loading="lazy">` has over 93% browser support and it's enough for most projects. But in that remaining slice of cases you need something else — either IntersectionObserver for custom behavior, or a framework `<Image>` component for responsiveness and format negotiation.

This is the decision tree I actually use during audits.

## 1. Native loading="lazy" — the default choice

Works almost everywhere. [Chrome 77+, Firefox 75+, Safari 15.4+](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#loading) — total support is over 93%.

```html
<img src="/products/sku-1234.webp"
     alt="Modré tričko"
     loading="lazy"
     decoding="async"
     width="400"
     height="600">
```

**Key rules:**

- `width` and `height` must be set, otherwise you get [CLS](/en/blog/cls-mobil-banner/).
- `loading="lazy"` on a hero image is a **mistake** — there you actually want `loading="eager"` and `fetchpriority="high"`.
- `decoding="async"` keeps image decoding off the main thread.

**Limits you only discover once they start to bite:**

- The threshold distance in Chrome is 1250px on a fast connection (4G) and 2500px on a slower one (3G and below) — so it's driven by connection type, not by whether it's mobile or desktop. The browser starts downloading an image when it's roughly 1.25 viewports away. You can't change this.
- No placeholder. The browser simply renders an empty box and then the image. For blur-up or a dominant-color placeholder you need your own solution.
- No "the image is now visible" callback. If you want to track impressions, the native solution won't cut it.

For 90% of cases this is fine. Product listings, in-article images, galleries — all native.

## 2. Custom IntersectionObserver — when native isn't enough

Three scenarios where I actually reach for a custom observer:

### Scenario A: blur-up placeholder

You want to show a blurred, low-quality version of the image while the full one downloads. Great for portfolio sites and content sites with big in-article hero images.

```html
<img src="/path/lqip-20px.jpg"
     data-src="/path/full-1200px.webp"
     class="lazy-img"
     width="1200" height="800"
     style="filter: blur(20px); transition: filter 0.4s">
```

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const img = entry.target;
    img.src = img.dataset.src;
    img.onload = () => {
      img.style.filter = 'none';
      observer.unobserve(img);
    };
  });
}, { rootMargin: '200px 0px' });

document.querySelectorAll('.lazy-img').forEach(img => observer.observe(img));
```

Bonus: the server generates a 20px LQIP with `sharp` at build time, encodes it as base64, and inlines it as `src`. No extra HTTP request.

### Scenario B: custom rootMargin for infinite scroll

Native `loading="lazy"` has a fixed threshold distance. For an infinite-scroll feed (Instagram style) you want to kick off loading 3 viewports ahead so the user never sees a loading state.

```js
const observer = new IntersectionObserver(callback, {
  rootMargin: '300% 0px',  // 3 viewports ahead
  threshold: 0.01
});
```

The native solution can't do this; a custom observer can.

### Scenario C: tracking and analytics

You fire an "impression" event to GA4 when an image is at least 50% visible for at least 1 second. This is a textbook use case for IntersectionObserver.

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.intersectionRatio >= 0.5) {
      const timer = setTimeout(() => {
        gtag('event', 'image_view', { sku: entry.target.dataset.sku });
      }, 1000);
      entry.target._timer = timer;
    } else if (entry.target._timer) {
      clearTimeout(entry.target._timer);
    }
  });
}, { threshold: [0, 0.5, 1] });
```

## 3. Framework Image component — Astro and Next.js

If you're on a modern framework, you probably want its built-in component. It does more than a native `<img>`:

- automatic WebP/AVIF format negotiation via the `Accept` header,
- responsive `srcset` for different sizes,
- build-time optimization (resizing, compression),
- automatic LQIP / blur-up,
- a `priority` flag for the hero (the equivalent of `fetchpriority="high"` and `loading="eager"`).

### Astro

```astro
---
import { Image } from 'astro:assets';
import hero from '../assets/hero.jpg';
---

<Image
  src={hero}
  alt="Hero"
  widths={[400, 800, 1200, 1800]}
  sizes="(max-width: 768px) 100vw, 1200px"
  formats={['avif', 'webp']}
  loading="eager"
/>
```

Astro generates 4 sizes × 2 formats = 8 variants, builds the `srcset`, and optimizes via `sharp`. Zero config.

### Next.js

```jsx
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  sizes="(max-width: 768px) 100vw, 1200px"
  priority
  placeholder="blur"
  blurDataURL="data:image/png;base64,..."
/>
```

Next optimizes at runtime via Sharp on the server (or via the Vercel Image Optimization API if you deploy there). The result is cached to disk and to the CDN.

**The catch:** the default loader (`loader: 'default'`) for the Next `<Image>` component requires a server runtime. If you deploy as a static export, you need a custom `loader` (e.g. Cloudflare Images or Imgix).

## When to use what — quick reference

| Use case | Solution |
|---|---|
| In-article images, product listings (90% of cases) | `<img loading="lazy">` |
| Hero / above-the-fold content | `<img loading="eager" fetchpriority="high">` |
| Blur-up placeholder | IntersectionObserver + LQIP |
| Infinite-scroll feed | IntersectionObserver with custom rootMargin |
| Image impression tracking | IntersectionObserver |
| Astro / Next.js project | `<Image>` from `astro:assets` / `next/image` |
| WordPress | `loading="lazy"` is a core default since 5.5; for AVIF use Cloudflare Polish or a plugin |

## Summary

The default choice is `<img loading="lazy" width="..." height="..." decoding="async">`. If you want a responsive `srcset` and format negotiation, use your framework's `<Image>`. Save the custom observer for blur-up, custom rootMargin, or impression tracking — never as your default solution.

The most common mistake I see during audits: a hero image with `loading="lazy"`. That's shooting yourself in the foot. The hero belongs to `eager` and `fetchpriority="high"`; lazy is for images below the fold — the same trap that shows up in most of the [LCP-over-2.5s cases](/en/blog/lcp-nad-2-5s-pricin/) I dig into.

Related: [Core Web Vitals on an e-shop: which pages to fix first](/en/blog/cwv-eshop-priorita/).
