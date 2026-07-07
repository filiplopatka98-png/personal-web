---
title: "Fonts Without the Flicker: A Recipe for Loading Without FOUT and FOIT"
date: 2026-12-15
read: 8
tags: ["Performance"]
excerpt: "A concrete recipe for web fonts that don't flicker or shift the layout: subset, preload, the right font-display, and a fallback matched by metrics."
featured: false
---

A font that flickers, jumps, or briefly vanishes on page load is one of the few performance problems that even a complete non-techie will notice. Either the text is invisible for a few hundred milliseconds (FOIT — Flash of Invisible Text), or it renders first in a system font and then snaps into your custom font (FOUT — Flash of Unstyled Text). Neither should happen without your say-so.

The good news: you can put this together so the flicker disappears and the layout stays put. Here's the recipe I reach for by default. Four steps: subset, preload, `font-display`, and a matched fallback.

## 1. WOFF2 and subset — less data first

Most flicker is just a symptom of the font taking too long to download. So the first lever is file size.

The format question is settled in 2026: **WOFF2 only**. It compresses roughly 30% better than the older WOFF and enjoys 97%+ browser support in real-world traffic. TTF, EOT, and plain WOFF are no longer needed on the web.

The second lever is the **subset**. A complete font file carries hundreds of glyphs for languages you'll never use on your site. An English site needs basic Latin and little else. The difference is dramatic: a font covering every script can weigh 400 KB or more, but trimmed to Latin it drops below 30 KB.

For trimming I use `pyftsubset` from the `fonttools` package. For Latin plus Latin-1 and Latin Extended-A (which covers accented characters like ď, ľ, š, č):

```bash
pip install fonttools brotli

pyftsubset Inter.ttf \
  --unicodes="U+0020-007F,U+00A0-00FF,U+0100-017F" \
  --layout-features="kern,liga,calt" \
  --flavor="woff2" \
  --output-file="inter-latin-ext.woff2"
```

`--flavor=woff2` requires `brotli` installed, which is why it's in the `pip install`. `--layout-features` keeps kerning and ligatures on; passing `*` would keep every OpenType feature and needlessly bloat the file. If you're unsure which characters your site actually uses, the `glyphhanger` project can scan your HTML and generate the exact set of Unicode ranges.

## 2. Preload — but only the right file

By default the font isn't discovered until the browser parses the CSS and hits a `@font-face` that's actually used. That's late. `<link rel="preload">` moves the download to the very start.

```html
<link
  rel="preload"
  href="/fonts/inter-latin-ext.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```

Three things that trip people up:

- **`crossorigin` is required even for a same-origin font.** Fonts load in anonymous CORS mode; without `crossorigin` the browser won't match the preload to the real request and downloads the font twice.
- **Preload ignores `unicode-range`.** If you split the font into Latin and Cyrillic, preload only the subset you'll actually paint above the fold. Preloading every subset defeats the point of subsetting.
- **Preload one file, maybe two** — typically your body-text font. Preload bypasses the browser's normal prioritization, so too many preloads steal bandwidth from each other and hurt [LCP](/en/blog/lcp-nad-2-5s-pricin/) instead of helping it.

## 3. font-display: what actually controls the flicker

The `font-display` descriptor in `@font-face` governs two periods: **block** (text is invisible while it waits for the font) and **swap** (a fallback shows and the font swaps in when it arrives). The combination of those two decides whether you get FOIT, FOUT, or nothing.

The values and their timing (per Chrome for Developers):

- **`block`** — a short block period (around 3s recommended) and an infinite swap. This is FOIT: text can be invisible for up to 3 seconds.
- **`swap`** — a zero-second block period and an infinite swap. The fallback shows immediately and the font swaps whenever it arrives. Classic FOUT.
- **`fallback`** — an extremely short block (around 100 ms) and a short swap (around 3s). After 3s the fallback is no longer swapped.
- **`optional`** — an extremely short block (around 100 ms) and a zero-second swap. The font is used only if it's cached or arrives within roughly 100 ms; otherwise the fallback stays for the whole visit.
- **`auto`** — leaves it to the browser, which today behaves much like `block`.

So the default `auto` is the worst option — you get FOIT for up to 3 seconds. Always set something explicitly.

My picks: for body text, **`swap`**, because I want people reading immediately. FOUT on its own is fine — what actually hurts is the layout shift, and we solve that in step 4. Where I don't care about the exact shape of the letters (say, a purely decorative heading font), I reach for **`optional`**: either the font is available right away or we skip it for that visit and no swap happens.

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter-latin-ext.woff2") format("woff2");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0100-017F;
}
```

## 4. A matched fallback — the end of layout jumps

This is the step most guides skip, and in 2026 it's the most important one. With `swap` the text shows immediately, but the system fallback has different dimensions than your target font — different character widths, different line height. When the font arrives, the text reflows and jumps. That's [CLS](/en/blog/cls-mobil-banner/), one of the [Core Web Vitals](/en/blog/cwv-eshop-priorita/) metrics.

The fix is the metric override descriptors: `size-adjust`, `ascent-override`, `descent-override`, and `line-gap-override`. With them you stretch the system fallback to occupy exactly the same space as the target font. When they match, the swap is reflow-free — zero CLS from the swap.

```css
@font-face {
  font-family: "Inter Fallback";
  src: local("Arial");
  size-adjust: 107%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}

body {
  font-family: "Inter", "Inter Fallback", sans-serif;
}
```

You don't guess these values — you compute them from the font metrics (`size-adjust` is the ratio of the average character width of the target vs. the fallback font; the override descriptors recompute ascent/descent against the UPM). Nobody does this by hand. Either use a fallback-override generator, or — if you're on Next.js — let `next/font` handle the whole thing automatically: for both local and Google fonts it generates a matched fallback and self-hosts the file with no external request.

## The recipe in short

1. **WOFF2 + subset** to the language you actually use. Target: under 30 KB for Latin.
2. **Preload** one body-text file, always with `crossorigin`.
3. **`font-display: swap`** for text, `optional` for decorative faces. Never leave it on `auto`.
4. **A matched fallback** via `size-adjust` and the override descriptors (or `next/font`), so the swap doesn't jump the layout.

The first three steps kill the flicker; the fourth kills the jump. When all four line up, the user notices nothing at all — and that's exactly the point. If you want to check whether a swap is still nudging anything, [WebPageTest](/en/blog/webpagetest-za-5-minut/) or the Web Vitals overlay in DevTools will show the spike instantly.
