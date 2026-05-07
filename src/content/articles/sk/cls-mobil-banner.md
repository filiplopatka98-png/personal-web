---
title: "CLS na mobiloch: prečo dynamické bannery ničia layout"
date: 2025-11-12
read: 6
tags: ["Performance", "Core Web Vitals", "UX"]
excerpt: "Tri najčastejšie zdroje CLS na mobile a ako pre každý reservovať priestor — od cookie banneru po YouTube embed. Cieľ: CLS pod 0.1 bez kompromisov v UX."
featured: false
---

CLS (Cumulative Layout Shift) je jediná metrika z Core Web Vitals ktorá nemeria rýchlosť, ale stabilitu. Užívateľ klikne CTA, banner sa pohne nadol, klikne Reklama. Frustrácia, bounce. Google to vidí cez `LayoutShift` API a počíta — čokoľvek nad 0.1 na mobile je "Needs Improvement", nad 0.25 je "Poor".

Za posledný rok som identifikoval tri opakujúce sa zdroje CLS, ktoré pokrývajú odhadom 80 % prípadov: cookie consent banner, lazy-loaded iframe (YouTube/Vimeo) a ad/widget sloty. Tu je detailný breakdown s fixmi.

## 1. Cookie consent banner (Cookiebot, Iubenda, CookieYes)

Najklasickejší boomer. Banner sa vloží do DOM **po** load evente, top-of-page, a stlačí celý obsah o 80–140px nadol. CLS contribution: **0.15–0.40** sám o sebe. Často viac ako celý zvyšok stránky dokopy.

**Diagnóza:** otvor stránku v Chrome DevTools → Performance → Web Vitals overlay. Sleduj kde sa CLS spike vyskytne — ak v prvých 800ms a celá stránka skočí dole, máš consent banner.

**Riešenie 1 — sticky position:** najjednoduchšie. Banner nech je `position: fixed` alebo `position: sticky` na bottome. Žiaden push pre obsah nad ním. Cookiebot to vie cez "Bottom" template. Iubenda cez "floating banner" config.

```css
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  /* žiadne stlačenie obsahu */
}
```

**Riešenie 2 — reservovaný placeholder:** ak musí byť top, vlož prázdny div s rovnakou výškou už v server-side HTML. Banner ho len naplní obsahom.

```html
<div id="cookie-slot" style="min-height: 120px"></div>
```

```js
// po načítaní pluginu
document.getElementById('cookie-slot').innerHTML = bannerHTML;
```

CLS spadne z 0.32 na 0.02 cez noc.

## 2. Lazy iframe embedy (YouTube, Vimeo, Spotify)

`<iframe loading="lazy">` bez `width`/`height` atribútov. Browser nevie aký priestor rezervovať, default je 300×150px, potom video dohrá metadata a iframe sa zväčší na 16:9. CLS contribution **0.05–0.15** per embed.

**Fix 1 — aspect-ratio:**

```html
<div class="video-wrapper">
  <iframe src="..." loading="lazy" allowfullscreen></iframe>
</div>

<style>
.video-wrapper {
  aspect-ratio: 16 / 9;
  width: 100%;
}
.video-wrapper iframe {
  width: 100%;
  height: 100%;
  border: 0;
}
</style>
```

`aspect-ratio` je [supported](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio) vo všetkých moderných prehliadačoch (Safari 15+, Chrome 88+, Firefox 89+). Pre staršie browsere fallback cez padding-bottom hack.

**Fix 2 — facade pattern:** lite-youtube-embed alebo lite-vimeo. Ako bonus získaš ~500KB úspory na initial load. Zobrazujú statický thumbnail + play button, iframe sa nahodí až po kliku.

## 3. Ad sloty, nutrition box, "Mohlo by ťa zaujímať"

Klasika obsahových stránok. Slot pre AdSense alebo natívnu reklamu sa naplní async-ne 1.5s po loade. Ak nemá `min-height`, obsah článku skočí.

**Fix:** rezervuj **maximálnu** očakávanú výšku, nie priemernú. Ak slot môže obsahovať buď 250px banner alebo 600px sponsored content, daj `min-height: 600px`. Áno, prázdny priestor na sekundu vyzerá hlúpo, ale CLS = 0 a Google ti to oplatí v rankingu.

```css
.ad-slot {
  min-height: 280px; /* MPU 300x250 + label */
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.ad-slot::before {
  content: 'Reklama';
  color: #999;
  font-size: 12px;
}
```

Pre dynamickú výšku (Mediavine adaptive ad units) použi `aspect-ratio` alebo backend-driven `min-height` cez data atribút.

## Skeleton placeholders pre custom widgety

Ak rendruješ niečo cez fetch (recenzie, related products, instagram feed), placeholder s rovnakými rozmermi je nutnosť.

```css
.skeleton-card {
  width: 100%;
  height: 320px; /* presne ako finálna karta */
  background: linear-gradient(90deg, #eee, #f5f5f5, #eee);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

Po načítaní dát zameníš obsah, ale rozmery ostanú. CLS = 0.

## Ako merať CLS reálne

Lighthouse v lab measurement nezachytí všetko — meria sa cca 5 sekúnd. CLS môže nastať aj pri scrollovaní (lazy-loaded obrázky bez dimenzií). Best practice:

1. **CrUX dashboard** v PageSpeed Insights — 28-dňové dáta z reálnych Chrome users na mobile.
2. **Web Vitals JS library** — pošle CLS hodnoty do GA4 / vlastného endpointu.

```js
import { onCLS } from 'web-vitals';
onCLS(({ value, entries }) => {
  // entries[i].sources ti povie KTORÝ element robil shift
  console.log('CLS', value, entries);
  gtag('event', 'web_vitals', { metric: 'CLS', value });
});
```

Tip: `entries[i].sources[j].node` ti v DevTools vráti referenciu na element ktorý spôsobil shift. Vďaka tomu hľadáš vinníka v sekundách, nie minútach.

## TL;DR

CLS pod 0.1 nie je magic. Tri pravidlá:

- Každý `<img>` a `<iframe>` má `width`/`height` alebo `aspect-ratio`.
- Každý dynamický slot má rezervovaný `min-height` na **maximálnu** očakávanú výšku.
- Cookie banner je `position: fixed`, nie inserted do DOM.

Začni cookie bannerom — najväčší ROI na mobile, často jeden config switch a CLS klesne pod 0.05.
