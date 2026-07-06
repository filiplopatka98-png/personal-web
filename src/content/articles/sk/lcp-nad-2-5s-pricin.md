---
title: "LCP nad 2.5s? 7 najčastejších príčin v praxi"
date: 2026-01-22
read: 8
tags: ["Performance", "Core Web Vitals", "WordPress"]
excerpt: "Vzorce z vyše 30 auditov za pol roka. Sedem konkrétnych príčin pomalého LCP — ku každej identifikácia cez WebPageTest filmstrip a fix s reálnym kódom."
featured: true
---

Largest Contentful Paint je nemilosrdný. Prah 2,5 s je pre 75. percentil reálnych návštevníkov — nie pre tvoj test cez optiku zo stoličky. Za posledných šesť mesiacov som spravil vyše 30 LCP auditov, väčšinu na WordPresse a WooCommerce, časť na Astre/Next.js. Vzorce sa opakujú. Tu je sedem najčastejších, v poradí frekvencie, s identifikáciou aj fixom.

## 1. Hero image bez fetchpriority alebo preloadu

Kráľ kategórie. Prehliadač vidí `<img>` v HTML, ale objaví ho až keď preparsuje pol stránky CSS a JS. Medzitým sťahuje tucet skriptov a fontov.

**Identifikácia:** WebPageTest waterfall — hero obrázok sa začne sťahovať až po `domContentLoaded`. Connection View ukáže, že hero zdieľa rovnaké spojenie s analytickými skriptmi.

**Fix:** dva atribúty.

```html
<img src="/hero.webp"
     fetchpriority="high"
     loading="eager"
     decoding="async"
     width="1200" height="600"
     alt="...">
```

A pre istotu `<link rel="preload" as="image" href="/hero.webp" fetchpriority="high">` v `<head>`. Typická úspora **0,6–1,2 s LCP**. Bližšie na [web.dev/articles/fetch-priority](https://web.dev/articles/fetch-priority).

## 2. Render-blocking JS pred body close

Google Maps embed, YouTube fasáda, Tidio chat. Plugin natlačí `<script>` tesne pred `</body>` bez `async` aj `defer`. Hlavné vlákno sa zastaví na 200–600 ms a LCP element nemá kedy vykresliť.

**Identifikácia:** Lighthouse „Eliminate render-blocking resources" + riadok vo waterfalle bez `async/defer` flagu.

**Fix:** `defer`, ak skript potrebuje DOM, inak `async`. Alebo ešte lepšie — zlož ho do facade patternu. Pre YouTube: [`lite-youtube-embed`](https://github.com/paulirish/lite-youtube-embed) — namiesto vyše 1 MB iframu načíta ~30 KB custom element, ktorý sa zmení na plný iframe až po kliknutí.

```html
<lite-youtube videoid="dQw4w9WgXcQ"></lite-youtube>
```

## 3. Slow TTFB (>800ms) z lacného hostingu

Čistá fyzika: ak server odpovedá 1,2 s, LCP nikdy nebude pod 2,5 s. Dobrý TTFB je podľa web.dev do 800 ms na 75. percentile. Najčastejšie na zdieľaných hostingoch za 3 €/mesiac s WP bez page cache. MySQL beží na rovnakej VPS s ďalšími 800 doménami a I/O wait je groteskný.

**Identifikácia:** WebPageTest číslo „First Byte". Ak je >800 ms na produkcii zo SK, máš problém. Pozri aj cez `curl -w "@curl-format.txt"` z viacerých lokácií.

**Fix v poradí ROI:**

1. **Page cache plugin** (WP Rocket, LiteSpeed Cache, FastCGI cache na nginxe). TTFB klesne z 1,2 s na 80 ms cez noc.
2. **Object cache** (Redis) — pri WooCommerce kategóriách s 50+ produktmi rozdiel 200 ms+.
3. **Lepší hosting** — 8–15 €/mes. (kvalitný shared) vs. 25 € (managed cloud). Detailne v článku [Hostingy v SK z pohľadu výkonu](/sk/articles/hostingy-sk-vykon).

## 4. WebP/AVIF chýba, kompresia 90%+

Hero obrázok 1,4 MB JPEG pri kvalite 95. WebP s kvalitou 80 by mal cca 180 KB pri vizuálne identickom výsledku.

**Identifikácia:** waterfall — najväčší súbor je obrázok >300 KB.

**Fix:** server-side konverzia cez filter `image_make_intermediate_size` (WP), alebo Cloudflare Polish, alebo build-time cez `sharp`. Pre Astro stačí `<Picture>` z `astro:assets` — auto WebP/AVIF s `srcset`.

```js
// Astro
import { Picture } from 'astro:assets';
import hero from '../assets/hero.jpg';

<Picture src={hero} alt="..." widths={[400, 800, 1200]} sizes="100vw" formats={['avif', 'webp']} />
```

Reálne čísla z auditu: hero 1,4 MB JPEG → 142 KB AVIF. LCP −0,8 s.

## 5. Custom font bez font-display: swap

Hero element je často `<h1>` s custom fontom. Bez `font-display: swap` prehliadač čaká na font až 3 sekundy (block period) a text zatiaľ nevykreslí. LCP ide dole vodou.

**Identifikácia:** filmstrip — text sa objaví až sekundu po obrázku. Lighthouse hlási „Ensure text remains visible during webfont load".

**Fix:**

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2-variations');
  font-display: swap;
  font-weight: 100 900;
}
```

A `<link rel="preload" as="font" type="font/woff2" href="/fonts/inter-var.woff2" crossorigin>` v `<head>` — pri kritickom fonte na hero. Bonus: jeden variable font namiesto 4–6 statických — úspora 400 KB.

## 6. Cumulative blocking time z reklám a widgetov

Mediavine, Google AdSense, sponzorované embedy. Ad slot zavolá `googletag.cmd.push()`, ktorý spustí 8 ďalších skriptov. Každý z nich blokuje main thread na 50–150 ms. Hero sa medzitým snaží vykresliť.

**Identifikácia:** DevTools Performance → záznam prvých 5 s → „Long Tasks" z domén `googletagservices`, `doubleclick`, `mediavine`.

**Fix:** ad slot nikdy nesmie byť above the fold, ak chceš dobré LCP. Reálny kompromis: prvá reklama až po hero (typicky po prvých 600 px). Pre lazy ad SDK pozri [`@aditude/ad-sdk`](https://github.com/aditude/ad-sdk) alebo natívny Mediavine režim „lazy ad".

## 7. Hero ako React/Vue island ktorý hydratuje

Syndróm moderného stacku. Hero je `<HeroComponent />` v Next.js, server vyrenderuje statický HTML, ale označí ho ako client component. LCP sa technicky zameria na zhydratovaný DOM, ktorý prichádza až po stiahnutí 200 KB JS bundlu.

**Identifikácia:** Chrome DevTools → Performance → klikni na LCP marker → „Related Node". Ak je to element vnútri React boundary s direktívou `"use client"`, máš problém.

**Fix:** označ hero ako server component. V Astre: bez direktívy `client:*`. V Next.js: vyhni sa `"use client"` v hero komponente a interakcie zabuduj do menšieho child komponentu.

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

1. **WebPageTest** so 4G mobilným profilom z Frankfurtu (pre SK) alebo z Prahy. Filmstrip + Waterfall + Connection View.
2. **CrUX dashboard** alebo PageSpeed Insights — reálne dáta z Chrome používateľov, nie laboratórne.
3. **Chrome DevTools Performance** — záznam na identifikáciu konkrétneho LCP elementu (klikni na „LCP" v timeline).
4. Identifikuj jednu z týchto siedmich príčin a oprav ju. Otestuj. Ďalšia.

Najlepší LCP fix je často kombinácia 2–3 z nich: hero `fetchpriority` + WebP + page cache. To spravidla stačí na presun z „Poor" do „Good" za pár hodín práce.
