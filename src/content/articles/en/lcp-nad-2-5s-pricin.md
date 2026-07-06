---
title: "LCP over 2.5s? The 7 most common causes in practice"
date: 2026-01-22
read: 8
tags: ["Performance", "Core Web Vitals", "WordPress"]
excerpt: "Patterns from 30+ audits over six months. Seven concrete causes of slow LCP — each with a way to spot it in the WebPageTest filmstrip and a fix with real code."
featured: true
---

Largest Contentful Paint is merciless. The 2.5-second threshold is for the 75th percentile of real visitors — not for your test over fiber from your desk chair. Over the past six months I've done more than 30 LCP audits, most on WordPress and WooCommerce, some on Astro/Next.js. The patterns repeat. Here are the seven most common, in order of frequency, with both identification and a fix.

## 1. Hero image without fetchpriority or preload

The king of the category. The browser sees the `<img>` in the HTML but only discovers it after parsing half a page of CSS and JS. Meanwhile it's fetching a dozen scripts and fonts.

**Identification:** WebPageTest waterfall — the hero image only starts downloading after `domContentLoaded`. Connection View shows the hero sharing the same connection with analytics scripts.

**Fix:** two attributes.

```html
<img src="/hero.webp"
     fetchpriority="high"
     loading="eager"
     decoding="async"
     width="1200" height="600"
     alt="...">
```

And for good measure `<link rel="preload" as="image" href="/hero.webp" fetchpriority="high">` in the `<head>`. Typical saving: **0.6–1.2 s of LCP**. More at [web.dev/articles/fetch-priority](https://web.dev/articles/fetch-priority).

## 2. Render-blocking JS before body close

A Google Maps embed, a YouTube facade, Tidio chat. A plugin shoves a `<script>` tag right before `</body>` without `async` or `defer`. The main thread stalls for 200–600ms and the LCP element has no chance to paint.

**Identification:** Lighthouse "Eliminate render-blocking resources" + a waterfall row without the `async/defer` flag.

**Fix:** `defer` if the script needs the DOM, `async` otherwise. Or better still — fold it into a facade pattern. For YouTube: [`lite-youtube-embed`](https://github.com/paulirish/lite-youtube-embed) — instead of a 1MB+ iframe, it loads a ~30KB custom element that turns into the full iframe only after a click.

```html
<lite-youtube videoid="dQw4w9WgXcQ"></lite-youtube>
```

## 3. Slow TTFB (>800ms) from cheap hosting

Pure physics: if the server responds in 1.2s, LCP will never be under 2.5s. A good TTFB, per web.dev, is 800ms or less at the 75th percentile. Most common on shared hosts at €3/month running WP without a page cache. MySQL runs on the same VPS as another 800 domains, and I/O wait is grotesque.

**Identification:** the WebPageTest "First Byte" number. If it's >800ms in production from Slovakia, you have a problem. Also check via `curl -w "@curl-format.txt"` from several locations.

**Fix, in order of ROI:**

1. **Page cache plugin** (WP Rocket, LiteSpeed Cache, FastCGI cache on nginx). TTFB drops from 1.2s to 80ms overnight.
2. **Object cache** (Redis) — for WooCommerce categories with 50+ products, a 200ms+ difference.
3. **Better hosting** — €8–15/mo (quality shared) vs €25 (managed cloud). Detailed in my article on Slovak hosting performance.

## 4. WebP/AVIF missing, compression at 90%+

A 1.4MB hero JPEG at quality 95. WebP at quality 80 would be around 180KB at a visually identical result.

**Identification:** waterfall — the biggest file is an image >300KB.

**Fix:** server-side conversion via the `image_make_intermediate_size` filter (WP), or Cloudflare Polish, or build-time via `sharp`. For Astro, `<Picture>` from `astro:assets` is enough — auto WebP/AVIF with `srcset`.

```js
// Astro
import { Picture } from 'astro:assets';
import hero from '../assets/hero.jpg';

<Picture src={hero} alt="..." widths={[400, 800, 1200]} sizes="100vw" formats={['avif', 'webp']} />
```

Real numbers from an audit: hero 1.4MB JPEG → 142KB AVIF. LCP -0.8s.

## 5. Custom font without font-display: swap

The hero element is often an `<h1>` with a custom font. Without `font-display: swap` the browser waits up to 3 seconds (the block period) for the font before rendering the text at all. LCP goes down the drain.

**Identification:** filmstrip — the text appears a second after the image. Lighthouse reports "Ensure text remains visible during webfont load."

**Fix:**

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2-variations');
  font-display: swap;
  font-weight: 100 900;
}
```

And `<link rel="preload" as="font" type="font/woff2" href="/fonts/inter-var.woff2" crossorigin>` in the `<head>` — for a critical hero font. Bonus: one variable font instead of 4–6 static ones — a 400KB saving.

## 6. Cumulative blocking time from ads and widgets

Mediavine, Google AdSense, sponsored embeds. An ad slot calls `googletag.cmd.push()`, which fires 8 more scripts. Each one blocks the main thread for 50–150ms. The hero paints somewhere in between.

**Identification:** DevTools Performance → record the first 5s → "Long Tasks" from domains like `googletagservices`, `doubleclick`, `mediavine`.

**Fix:** an ad slot must never be above the fold if you want good LCP. A realistic compromise: the first ad only after the hero (typically after the first 600px). For a lazy ad SDK see [`@aditude/ad-sdk`](https://github.com/aditude/ad-sdk) or native Mediavine "lazy ad" mode.

## 7. Hero as a React/Vue island that hydrates

The modern-stack syndrome. The hero is a `<HeroComponent />` in Next.js; the server renders static HTML but marks it as a client component. LCP technically targets the hydrated DOM, which only arrives after downloading a 200KB JS bundle.

**Identification:** Chrome DevTools → Performance → click the LCP marker → "Related Node." If it's an element inside a React boundary with a `"use client"` directive, you have a problem.

**Fix:** mark the hero as a server component. In Astro: without a `client:*` directive. In Next.js: avoid `"use client"` in the hero component; build interactions into a smaller child component.

```jsx
// Hero.tsx — server component, no "use client"
export default function Hero() {
  return (
    <section>
      <h1>Headline</h1>
      <Image src="/hero.webp" priority alt="..." />
      <CTAButton /> {/* "use client" here, not higher up */}
    </section>
  );
}
```

## The process in a real audit

1. **WebPageTest** with a 4G mobile profile from Frankfurt (for Slovakia) or Prague. Filmstrip + Waterfall + Connection View.
2. **CrUX dashboard** or PageSpeed Insights — real data from Chrome users, not lab numbers.
3. **Chrome DevTools Performance** — a recording to identify the specific LCP element (click "LCP" in the timeline).
4. Identify one of these seven causes and fix it. Test. Next one.

The best LCP fix is often a combination of 2–3 of these: hero `fetchpriority` + WebP + page cache. That's usually enough to move from "Poor" to "Good" in a couple of hours of work.
