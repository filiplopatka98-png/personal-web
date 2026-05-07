---
title: "Image lazy-loading: kedy native, kedy custom"
date: 2025-12-04
read: 6
tags: ["Performance", "Core Web Vitals"]
excerpt: "Decision tree pre tri scenáre lazy-loadingu obrázkov — natívny atribút, IntersectionObserver a framework Image komponenty. Code samples + reálne limity."
featured: false
---

Lazy-loading obrázkov v 2026 nie je sci-fi. `<img loading="lazy">` má 95%+ browser support a väčšine projektov stačí. Ale v 5 % prípadov potrebuješ niečo iné — buď IntersectionObserver pre custom správanie, alebo framework `<Image>` komponentu pre responsive a format negotiation.

Decision tree, ktorý reálne používam pri auditoch.

## 1. Native loading="lazy" — default voľba

Funguje skoro všade. [Chrome 77+, Firefox 75+, Safari 15.4+](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#loading) — celkový support nad 96 %.

```html
<img src="/products/sku-1234.webp"
     alt="Modré tričko"
     loading="lazy"
     decoding="async"
     width="400"
     height="600">
```

**Kľúčové pravidlá:**

- `width` + `height` musí byť uvedené, inak CLS.
- `loading="lazy"` na hero obrázku je **chyba** — naopak chceš `loading="eager"` + `fetchpriority="high"`.
- `decoding="async"` neblokuje main thread pri dekódovaní obrázka.

**Limity, ktoré zistíš až keď ťa štípu:**

- Chrome `rootMargin` je 1250px na mobile, ~2500px na desktope. Browser začne sťahovať obrázok keď je 1.25 viewportu pred ním. Nemôžeš to zmeniť.
- Žiadny placeholder. Browser proste vykreslí prázdny box a potom obrázok. Pre blur-up alebo dominant color musíš mať custom riešenie.
- Žiadny callback "obrázok je teraz vidno". Ak chceš trackovať impresions, native nestačí.

Pre 90 % use cases je toto OK. Produktové listingy, blog post obrázky, gallery — všetko native.

## 2. Custom IntersectionObserver — keď ti native nestačí

Tri scenáre, kedy reálne siahnem po custom observer:

### Scenár A: blur-up placeholder

Chceš ukázať rozmazanú low-quality verziu obrázka, kým sa fetch-ne plná. Použiteľné na portfólio sajtoch, obsahových weboch s veľkými hero obrázkami v článkoch.

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

Bonus: server vygeneruje 20px LQIP cez `sharp` na build time, base64-encoded inline ako `src`. Žiadny extra HTTP request.

### Scenár B: custom rootMargin pre infinite scroll

Native `loading="lazy"` má fixný rootMargin. Pre infinite-scroll feed (Instagram-style) chceš trigger 4 viewport-y dopredu, aby user nikdy nevidel loading state.

```js
const observer = new IntersectionObserver(callback, {
  rootMargin: '300% 0px',  // 3 viewport-y dopredu
  threshold: 0.01
});
```

Native to nevie. Custom observer áno.

### Scenár C: tracking + analytics

Posielaš event "impression" do GA4 keď je obrázok minimálne 50 % vidno aspoň 1 sekundu. Toto je classic IntersectionObserver use case.

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

## 3. Framework Image komponent — Astro a Next.js

Ak používaš modern framework, pravdepodobne chceš jeho built-in. Robí toho viac ako natívny `<img>`:

- Auto WebP/AVIF format negotiation cez `Accept` header
- Responsive `srcset` pre rôzne veľkosti
- Build-time optimalizácia (resize, kompresia)
- Automatic LQIP / blur-up
- `priority` flag pre hero (ekvivalent `fetchpriority="high"` + `loading="eager"`)

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

Astro vygeneruje 4 veľkosti × 2 formáty = 8 variantov, vytvorí `srcset`, optimalizuje cez `sharp`. Bez konfigurácie.

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

Next runtime-optimalizuje cez Sharp na serveri (alebo cez Vercel Image Optimization API ak deploy-uješ tam). Cache na disk + CDN.

**Catch:** Next `<Image>` na `loader: 'default'` vyžaduje server-side runtime. Ak deploy-uješ ako static export, potrebuješ vlastný `loader` (napr. Cloudflare Images alebo Imgix).

## Kedy čo použiť — quick reference

| Use case | Riešenie |
|---|---|
| Blog post obrázky, produktové listingy (90 % cases) | `<img loading="lazy">` |
| Hero / above-the-fold | `<img loading="eager" fetchpriority="high">` |
| Blur-up placeholder | IntersectionObserver + LQIP |
| Infinite scroll feed | IntersectionObserver s custom rootMargin |
| Image impression tracking | IntersectionObserver |
| Astro / Next.js project | `<Image>` z `astro:assets` / `next/image` |
| WordPress | `loading="lazy"` je default v core od 5.5; pre AVIF Cloudflare Polish alebo plugin |

## TL;DR

Default voľba je `<img loading="lazy" width="..." height="..." decoding="async">`. Ak chceš responsive `srcset` + format negotiation, použi framework `<Image>`. Custom observer si necháš na blur-up, custom rootMargin alebo tracking — nikdy ako default.

Najčastejší fail v auditoch: hero obrázok má `loading="lazy"`. To je sebapoškodenie. Hero patrí `eager` + `fetchpriority="high"`, lazy je pre obrázky pod foldom.
