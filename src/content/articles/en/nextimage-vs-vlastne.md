---
title: "next/image vs Rolling Your Own: When Each One Wins"
date: 2026-11-26
read: 8
tags: ["Next.js", "Performance"]
excerpt: "next/image gives you blur placeholders, srcset, and AVIF for free — but on Vercel you pay per transformation. When to let the component do the work, and when to write your own."
featured: false
---

`next/image` is one of those components that eats half your Core Web Vitals problems before you even get to have them. It auto-generates `srcset`, serves AVIF or WebP based on the `Accept` header, gives you a blur placeholder, and handles the LCP image preload through `priority`. All from a single import.

Except "free" here only applies to the API. It doesn't apply to money, and it doesn't apply to control over the pipeline. Let's break this down the practical way — when I let `next/image` do the work, and when I reach for my own solution.

## What next/image actually gives you

So we're talking about the same thing. In Next.js 16 (the current stable branch at the time of writing) the component does this out of the box:

```jsx
import Image from 'next/image'
import hero from './hero.jpg'

export default function Hero() {
  return (
    <Image
      src={hero}
      alt="Kids' play corner with toys"
      priority
      placeholder="blur"
      sizes="(max-width: 768px) 100vw, 50vw"
    />
  )
}
```

With a static import (`./hero.jpg`) you get `width`, `height`, and `blurDataURL` automatically — you don't have to write them by hand, which kills an entire category of CLS problems caused by wrong dimensions. `priority` adds `fetchpriority="high"` and a preload on the LCP image. According to Google, `fetchpriority="high"` alone on the LCP image can pull LCP from 2.6s down to 1.9s — so this isn't cosmetics.

`sizes` is the most commonly ignored but most important attribute. Without it the browser doesn't know which `srcset` variant to pick and downloads one that's needlessly large. This is something you have to solve identically in a custom setup too — the component just reminds you.

Formats are handled in `next.config.js`:

```js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2678400, // 31 days
  },
}
```

AVIF compresses roughly 20% better than WebP, but it takes about 50% longer to encode — so the first request for a given variant is slower, subsequent ones come from cache. Support is high today: per caniuse data, WebP sits around 96% and AVIF around 95% of global coverage, so the AVIF + WebP fallback pair covers practically everyone.

## The catch: cost and control

On Vercel, image optimization is billed. Per the current pricing (limits valid as of February 2026), the Hobby plan gives you 5,000 transformations, 300,000 cache reads, and 100,000 cache writes per month for free. Beyond that you pay from $0.05 per 1,000 transformations, from $0.40 per million cache reads, and from $4 per million cache writes. A transformation is billed for every cache MISS and STALE.

For a small site with a few dozen images, that's zero. For a store with thousands of products, where each product has multiple variants times multiple breakpoints, it can add up to a real line item on the invoice. That's why Vercel itself recommends `minimumCacheTTL` or static imports (which set `Cache-Control` to a year) — precisely to cut down the number of transformations.

The second catch isn't cost, it's control. Vercel's optimization is a black box: you can't see into the encoder, you can't change chroma subsampling, you can't run your own `sharp` pipeline with exact parameters. For 90% of projects that's perfectly fine. For a project where image quality is the business (a photographer, a fashion store), it starts to get in the way.

## Rolling your own: two different things

When we say "roll your own," we usually mean one of two things — and it matters not to mix them up.

**First: a custom loader over an external service.** You keep the `next/image` API but hand the transformation off to Cloudinary, imgix, or Cloudflare Images. You configure a `loaderFile`:

```jsx
// image-loader.js
export default function cloudflareLoader({ src, width, quality }) {
  const params = [`width=${width}`, `quality=${quality || 75}`, 'format=auto']
  return `https://example.com/cdn-cgi/image/${params.join(',')}/${src}`
}
```

```js
// next.config.js
module.exports = {
  images: {
    loader: 'custom',
    loaderFile: './image-loader.js',
  },
}
```

This keeps the comfort of the component (`srcset`, `sizes`, lazy loading), but you pay for the transformation to the service you picked — and that one tends to be cheaper at volume and gives you more control.

**Second: a fully custom `<img>` with hand-prepared variants.** Here you don't use `next/image` at all. You pre-generate the images (e.g. via `sharp` in a build step, or via WordPress in a headless setup) and serve a static `<picture>`:

```html
<picture>
  <source
    srcset="/img/hero-800.avif 800w, /img/hero-1600.avif 1600w"
    sizes="(max-width: 768px) 100vw, 50vw"
    type="image/avif" />
  <img
    src="/img/hero-1600.jpg"
    width="1600" height="900"
    alt="Kids' play corner with toys"
    loading="eager" fetchpriority="high" decoding="async" />
</picture>
```

Native `loading="lazy"` has worked natively in all major browsers (Chrome, Edge, Firefox, Safari) since 2020, and so have `fetchpriority` and `srcset`. So everything `next/image` does you can do by hand — the only question is how much work that is and who's going to maintain it. On the native vs custom lazy-loading split I've got a dedicated [breakdown of image lazy-loading](/en/blog/image-lazy-loading-native-vs-custom/).

## How I decide

Here's my practical rule that works in most projects:

**Keep `next/image` with Vercel's optimization** if the site is small to medium, you host on Vercel, and image volume doesn't push you past the free tier. Don't overthink it. Spend the saved time on `sizes` attributes and `priority` on the right image — that's 80% of the effect.

**Keep `next/image`, but swap the loader** to Cloudflare Images / imgix / Cloudinary if you have lots of images, you're watching costs, or you're on a host other than Vercel (where Vercel's optimization isn't available anyway). You get the same API at a more predictable price. If you're weighing hosting more broadly, see the [Vercel vs Cloudflare vs your own node comparison](/en/blog/vercel-vs-cloudflare-vs-vps/).

**Go full custom `<picture>`** if you need precise control over encoding, the images are known ahead of time and change rarely (marketing site, landing page), or when `next/image` isn't available on the project (e.g. a pure static export with no optimization server). With a static export you have to set `unoptimized: true` or a custom loader anyway — and a component with no optimization layer loses half its point.

A small note on self-hosting: since Next.js 15, `sharp` installs automatically in standalone mode, so `next/image` optimization works out of the box even off Vercel. Just watch out that `sharp` has native bindings — it must be compiled for the target platform, not your Mac. If you copy `node_modules` from a Mac into an Alpine container, the bindings won't fit and optimization breaks. Install `sharp` in the runner stage for the correct platform.

## Wrap-up

`next/image` isn't an "always yes" or an "always no." It's a comfortable default that solves `srcset`, formats, blur, and LCP preload — and one you pay per transformation for on Vercel. Small site: leave it. Lots of images or a different host: swap the loader. Critical quality or a static site: custom `<picture>`. But whatever you pick, you have to get `sizes` and `fetchpriority` on the LCP image right — that's the one thing no component solves for you. If a slow LCP specifically is bugging you, I've got a [rundown of the most common causes of LCP over 2.5s](/en/blog/lcp-nad-2-5s-pricin/).
