---
title: "Image lazy-loading: kedy native, kedy custom"
date: 2025-12-04
read: 6
tags: ["Performance", "Core Web Vitals"]
excerpt: "Rozhodovací strom pre tri scenáre lazy-loadingu obrázkov — natívny atribút, IntersectionObserver a Image komponenty vo frameworkoch. Ukážky kódu a reálne limity."
featured: false
---

Lazy-loading obrázkov v roku 2026 nie je žiadna raketová veda. `<img loading="lazy">` má vyše 93 % podporu v prehliadačoch a väčšine projektov stačí. Ale v tých zvyšných percentách prípadov potrebuješ niečo iné — buď IntersectionObserver pre vlastné správanie, alebo `<Image>` komponent z frameworku pre responzívnosť a vyjednávanie formátu.

Toto je rozhodovací strom, ktorý reálne používam pri auditoch.

## 1. Natívne loading="lazy" — predvolená voľba

Funguje skoro všade. [Chrome 77+, Firefox 75+, Safari 15.4+](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#loading) — celková podpora je vyše 93 %.

```html
<img src="/products/sku-1234.webp"
     alt="Modré tričko"
     loading="lazy"
     decoding="async"
     width="400"
     height="600">
```

**Kľúčové pravidlá:**

- `width` a `height` musia byť uvedené, inak dostaneš CLS.
- `loading="lazy"` na hero obrázku je **chyba** — tam naopak chceš `loading="eager"` a `fetchpriority="high"`.
- `decoding="async"` neblokuje hlavné vlákno pri dekódovaní obrázka.

**Limity, ktoré zistíš, až keď ťa začnú štípať:**

- Prahová vzdialenosť v Chrome je 1250 px na rýchlom pripojení (4G) a 2500 px na pomalšom (3G a nižšie) — riadi sa teda typom pripojenia, nie tým, či ide o mobil alebo desktop. Prehliadač začne sťahovať obrázok, keď je približne 1,25 viewportu pred ním. Zmeniť to nemôžeš.
- Žiadny placeholder. Prehliadač jednoducho vykreslí prázdny box a potom obrázok. Pre blur-up alebo dominantnú farbu musíš mať vlastné riešenie.
- Žiadny callback „obrázok je teraz vidno". Ak chceš sledovať impresie, natívne riešenie nestačí.

Pre 90 % prípadov je toto v poriadku. Produktové výpisy, obrázky v článkoch, galéria — všetko natívne.

## 2. Vlastný IntersectionObserver — keď ti natívne riešenie nestačí

Tri scenáre, kedy reálne siahnem po vlastnom observeri:

### Scenár A: blur-up placeholder

Chceš ukázať rozmazanú verziu obrázka v nízkej kvalite, kým sa stiahne plná. Hodí sa to na portfóliových stránkach a obsahových weboch s veľkými hero obrázkami v článkoch.

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

Bonus: server vygeneruje 20 px LQIP cez `sharp` pri builde, zakóduje ho do base64 a vloží inline ako `src`. Žiadny HTTP request navyše.

### Scenár B: vlastný rootMargin pre nekonečný scroll

Natívne `loading="lazy"` má pevne danú prahovú vzdialenosť. Pre feed s nekonečným scrollom (v štýle Instagramu) chceš spustiť načítanie 3 viewporty dopredu, aby používateľ nikdy nevidel stav načítavania.

```js
const observer = new IntersectionObserver(callback, {
  rootMargin: '300% 0px',  // 3 viewporty dopredu
  threshold: 0.01
});
```

Natívne riešenie to nevie, vlastný observer áno.

### Scenár C: sledovanie a analytika

Posielaš event „impression" do GA4, keď je obrázok aspoň z 50 % viditeľný minimálne 1 sekundu. Toto je učebnicový prípad použitia IntersectionObserveru.

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

## 3. Image komponent vo frameworku — Astro a Next.js

Ak používaš moderný framework, pravdepodobne chceš jeho zabudovaný komponent. Robí toho viac ako natívny `<img>`:

- automatické vyjednávanie formátu WebP/AVIF cez hlavičku `Accept`,
- responzívny `srcset` pre rôzne veľkosti,
- optimalizácia pri builde (zmena rozmerov, kompresia),
- automatické LQIP / blur-up,
- príznak `priority` pre hero (ekvivalent `fetchpriority="high"` a `loading="eager"`).

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

Astro vygeneruje 4 veľkosti × 2 formáty = 8 variantov, vytvorí `srcset` a optimalizuje cez `sharp`. Bez konfigurácie.

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

Next optimalizuje za behu cez Sharp na serveri (alebo cez Vercel Image Optimization API, ak nasadzuješ tam). Výsledok sa cachuje na disk a do CDN.

**Háčik:** predvolený loader (`loader: 'default'`) komponentu Next `<Image>` vyžaduje serverový runtime. Ak nasadzuješ ako statický export, potrebuješ vlastný `loader` (napr. Cloudflare Images alebo Imgix).

## Kedy čo použiť — rýchly prehľad

| Prípad použitia | Riešenie |
|---|---|
| Obrázky v článkoch, produktové výpisy (90 % prípadov) | `<img loading="lazy">` |
| Hero / obsah nad foldom | `<img loading="eager" fetchpriority="high">` |
| Blur-up placeholder | IntersectionObserver + LQIP |
| Feed s nekonečným scrollom | IntersectionObserver s vlastným rootMargin |
| Sledovanie impresií obrázkov | IntersectionObserver |
| Projekt v Astre / Next.js | `<Image>` z `astro:assets` / `next/image` |
| WordPress | `loading="lazy"` je predvolené v jadre od verzie 5.5; pre AVIF Cloudflare Polish alebo plugin |

## Zhrnutie

Predvolená voľba je `<img loading="lazy" width="..." height="..." decoding="async">`. Ak chceš responzívny `srcset` a vyjednávanie formátu, použi `<Image>` z frameworku. Vlastný observer si necháš na blur-up, vlastný rootMargin alebo sledovanie impresií — nikdy nie ako predvolené riešenie.

Najčastejšia chyba, ktorú vidím pri auditoch: hero obrázok má `loading="lazy"`. To je streľba do vlastnej nohy. Hero patrí `eager` a `fetchpriority="high"`, lazy je pre obrázky pod foldom.
