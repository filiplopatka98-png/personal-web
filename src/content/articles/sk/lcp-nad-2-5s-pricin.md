---
title: "LCP nad 2.5s? 7 najčastejších príčin v praxi"
date: 2026-01-22
read: 8
tags: ["Performance", "Core Web Vitals", "WordPress"]
excerpt: "Pattern matching z 30+ auditov za pol roka. Sedem konkrétnych príčin pomalého LCP, ku každej identifikácia cez WebPageTest filmstrip a fix s reálnym kódom."
featured: true
---

Largest Contentful Paint je nemilosrdný. Prah 2.5 sekundy je pre 75. percentil reálnych návštevníkov — nie pre tvoj test cez fiber zo stoličky. Za posledných šesť mesiacov som spravil cez 30 LCP auditov, väčšinu na WordPresse a WooCommerce, časť na Astro/Next.js. Vzorce sa opakujú. Tu je sedem najčastejších, v poradí frekvencie, s identifikáciou aj fixom.

## 1. Hero image bez fetchpriority alebo preloadu

Kráľ kategórie. Browser vidí `<img>` v HTML, ale objaví ho až keď preparsuje pol stránky CSS a JS. Medzitým fetch-uje tucet skriptov a fontov.

**Identifikácia:** WebPageTest waterfall — hero obrázok sa začne sťahovať až po `domContentLoaded`. Connection View ukáže, že hero soup-uje rovnakú connection s analytics scriptmi.

**Fix:** dva atribúty.

```html
<img src="/hero.webp"
     fetchpriority="high"
     loading="eager"
     decoding="async"
     width="1200" height="600"
     alt="...">
```

A pre istotu `<link rel="preload" as="image" href="/hero.webp" fetchpriority="high">` v `<head>`. Typicky úspora **0.6–1.2 s LCP**. Bližšie na [web.dev/articles/fetch-priority](https://web.dev/articles/fetch-priority).

## 2. Render-blocking JS pred body close

Google Maps embed, YouTube facade, Tidio chat. Plugin shoves `<script>` tag tesne pred `</body>` bez `async` ani `defer`. Hlavné vlákno sa zastaví na 200–600ms, LCP element nemá kedy paint-núť.

**Identifikácia:** Lighthouse "Eliminate render-blocking resources" + waterfall riadok bez `async/defer` flagu.

**Fix:** `defer` ak script potrebuje DOM, `async` inak. Alebo ešte lepšie — zlož do facade pattern. Pre YouTube: [`lite-youtube-embed`](https://github.com/paulirish/lite-youtube-embed) — namiesto 540KB iframe naloaduje 3KB custom element ktorý sa zmení na iframe až po kliku.

```html
<lite-youtube videoid="dQw4w9WgXcQ"></lite-youtube>
```

## 3. Slow TTFB (>800ms) z lacného hostingu

Čistá fyzika: ak server odpovedá 1.2s, LCP nikdy nebude pod 2.5s. Najčastejšie u zdieľaných hostingov za €3/mesiac s WP bez page cache. Postgres/MySQL behajú na rovnakej VPSke s ďalšími 800 doménami, I/O wait je groteskný.

**Identifikácia:** WebPageTest "First Byte" číslo. Ak >800ms na production zo SK, máš problém. Pozri aj cez `curl -w "@curl-format.txt"` z viacerých lokácií.

**Fix v poradí ROI:**

1. **Page cache plugin** (WP Rocket, LiteSpeed Cache, FastCGI cache na nginx). TTFB klesne z 1.2s na 80ms cez noc.
2. **Object cache** (Redis) — pre WooCommerce kategórie s 50+ produktmi rozdiel 200ms+.
3. **Lepší hosting** — €8–15/mes (kvalitný shared) vs €25 (managed cloud). Detailne v [Hostingy v SK z pohľadu výkonu](/sk/articles/hostingy-sk-vykon).

## 4. WebP/AVIF chýba, kompresia 90%+

Hero obrázok 1.4MB JPEG pri kvalite 95. WebP s kvalitou 80 by mal cca 180KB pri vizuálne identickom výsledku.

**Identifikácia:** waterfall — najväčší súbor je obrázok >300KB.

**Fix:** server-side konverzia v `image_make_intermediate_size` filter (WP), alebo Cloudflare Polish, alebo build-time cez `sharp`. Pre Astro stačí `<Image>` z `astro:assets` — auto WebP/AVIF s `srcset`.

```js
// Astro
import { Image } from 'astro:assets';
import hero from '../assets/hero.jpg';

<Image src={hero} alt="..." widths={[400, 800, 1200]} formats={['avif', 'webp']} />
```

Reálne čísla z auditu: hero 1.4MB JPEG → 142KB AVIF. LCP -0.8s.

## 5. Custom font bez font-display: swap

Hero element je často `<h1>` s custom fontom. Bez `font-display: swap` browser čaká až 3 sekundy na font, potom rendruje text. LCP ide spať.

**Identifikácia:** filmstrip — text sa objaví až sekundu po obrázku. Lighthouse hlási "Ensure text remains visible during webfont load".

**Fix:**

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2-variations');
  font-display: swap;
  font-weight: 100 900;
}
```

A `<link rel="preload" as="font" type="font/woff2" href="/fonts/inter-var.woff2" crossorigin>` v `<head>`. Pri kritickom fonte na hero. Bonus: jeden variable font namiesto 4–6 statických — úspora 400KB.

## 6. Cumulative blocking time z reklám a widgetov

Mediavine, Google AdSense, sponsored embedy. Ad slot zavolá `googletag.cmd.push()` ktorý spustí 8 ďalších skriptov. Každý z nich blokuje main thread po 50–150ms. Hero medzi tým paint-uje.

**Identifikácia:** DevTools Performance → záznam first 5s → "Long Tasks" z domén `googletagservices`, `doubleclick`, `mediavine`.

**Fix:** ad slot nikdy nesmie byť above-the-fold ak chceš dobré LCP. Reálne kompromis: prvá reklama až po hero (typicky po prvých 600px). Pre lazy ad SDK pozri [`@aditude/ad-sdk`](https://github.com/aditude/ad-sdk) alebo native Mediavine "lazy ad" mode.

## 7. Hero ako React/Vue island ktorý hydratuje

Modern stack syndrom. Hero je `<HeroComponent />` v Next.js, server vyrenderuje statický HTML, ale označí ho ako client component. LCP sa technicky zameria na hydrated DOM, čo prichádza až po stiahnutí 200KB JS bundle.

**Identifikácia:** Chrome DevTools → Performance → kliknú LCP marker → "Related Node". Ak je to element vnútri React boundary s `"use client"` direktívou, máš problém.

**Fix:** označ hero ako server component. V Astro: bez `client:*` direktívy. V Next.js: vyhneš sa `"use client"` v hero komponente; interakcie zabuduj do menšieho child komponentu.

```jsx
// Hero.tsx — server component, žiadny "use client"
export default function Hero() {
  return (
    <section>
      <h1>Headline</h1>
      <Image src="/hero.webp" priority alt="..." />
      <CTAButton /> {/* "use client" tu, nie vyššie */}
    </section>
  );
}
```

## Postup pri reálnom audite

1. **WebPageTest** s 4G mobile profilom z Frankfurtu (pre SK) alebo Prahy. Filmstrip + Waterfall + Connection View.
2. **CrUX dashboard** alebo PageSpeed Insights — reálne dáta z Chrome users, nie laboratórne.
3. **Chrome DevTools Performance** — záznam pre identifikáciu konkrétneho LCP elementu (kliknú "LCP" v timeline).
4. Identifikuj jednu z týchto sedmich príčin a fixni. Otestuj. Ďalšia.

Najlepší LCP fix je často kombinácia 2–3 z týchto: hero `fetchpriority` + WebP + page cache. To spravidla stačí na presun z "Poor" do "Good" za pár hodín práce.
