---
title: "CLS na mobiloch: prečo dynamické bannery ničia layout"
date: 2025-11-12
read: 6
tags: ["Performance", "Core Web Vitals", "UX"]
excerpt: "Tri najčastejšie zdroje CLS na mobile a ako pre každý rezervovať priestor — od cookie banneru po YouTube embed. Cieľ: CLS pod 0,1 bez kompromisov v UX."
featured: false
---

CLS (Cumulative Layout Shift) je jediná metrika z [Core Web Vitals](/blog/cwv-eshop-priorita/), ktorá nemeria rýchlosť, ale stabilitu. Používateľ klikne na CTA, banner sa pohne nadol a on namiesto toho klikne na reklamu. Frustrácia, odchod. Google to vidí cez `LayoutShift` API a počíta — čokoľvek od 0,1 na mobile je „Needs Improvement“, nad 0,25 je „Poor“.

Za posledný rok som identifikoval tri opakujúce sa zdroje CLS, ktoré pokrývajú odhadom 80 % prípadov: cookie consent banner, lazy-loaded iframe (YouTube/Vimeo) a ad/widget sloty. Tu je podrobný rozbor s riešeniami.

## 1. Cookie consent banner (Cookiebot, Iubenda, CookieYes)

Najklasickejší prípad. Banner sa vloží do DOM **po** load evente, na vrch stránky, a stlačí celý obsah o 80 – 140 px nadol. Sám o sebe prispeje ku CLS **0,15 – 0,40**. Často viac ako celý zvyšok stránky dokopy.

**Diagnóza:** otvor stránku v Chrome DevTools → Performance → Web Vitals overlay. Sleduj, kde sa objaví CLS spike — ak v prvých 800 ms celá stránka skočí dole, máš consent banner.

**Riešenie 1 — fixná pozícia:** najjednoduchšie. Banner nech je `position: fixed` alebo `position: sticky` naspodku. Žiadne stlačenie obsahu nad ním. Cookiebot to vie cez šablónu „Bottom“, Iubenda cez konfiguráciu „floating banner“.

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

**Riešenie 2 — rezervovaný placeholder:** ak musí byť hore, vlož prázdny div s rovnakou výškou už do server-side HTML. Banner ho len naplní obsahom.

```html
<div id="cookie-slot" style="min-height: 120px"></div>
```

```js
// po načítaní pluginu
document.getElementById('cookie-slot').innerHTML = bannerHTML;
```

CLS spadne z 0,32 na 0,02 cez noc.

## 2. Lazy iframe embedy (YouTube, Vimeo, Spotify)

`<iframe loading="lazy">` bez atribútov `width`/`height`. Prehliadač nevie, aký priestor rezervovať, predvolene použije 300 × 150 px, potom video dotiahne metadáta a iframe sa zväčší na 16:9. Prispeje ku CLS **0,05 – 0,15** na jeden embed.

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

`aspect-ratio` je [podporované](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio) vo všetkých moderných prehliadačoch (Safari 15+, Chrome 88+, Firefox 89+). Pre staršie prehliadače použi fallback cez padding-bottom hack.

**Fix 2 — facade pattern:** lite-youtube-embed alebo lite-vimeo. Ako bonus získaš približne 500 KB úspory pri initial loade. Zobrazujú statický náhľad a play tlačidlo, iframe sa nahrá až po kliku. Podobná logika platí aj pri obrázkoch — pozri [kedy siahnuť po native lazy-loadingu a kedy po custom riešení](/blog/image-lazy-loading-native-vs-custom/).

## 3. Ad sloty, nutrition box, "Mohlo by ťa zaujímať"

Klasika obsahových stránok. Slot pre AdSense alebo natívnu reklamu sa naplní asynchrónne 1,5 s po loade. Ak nemá `min-height`, obsah článku skočí.

**Fix:** rezervuj **maximálnu** očakávanú výšku, nie priemernú. Ak môže slot obsahovať buď 250 px banner, alebo 600 px sponzorovaný obsah, daj `min-height: 600px`. Áno, prázdny priestor na sekundu vyzerá hlúpo, ale CLS = 0 a Google ti to v rankingu oplatí.

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

Pre dynamickú výšku (Mediavine adaptive ad units) použi `aspect-ratio` alebo `min-height` riadenú z backendu cez data atribút.

## Skeleton placeholders pre custom widgety

Ak niečo vykresľuješ cez fetch (recenzie, súvisiace produkty, Instagram feed), placeholder s rovnakými rozmermi je nutnosť.

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

Lighthouse v laboratórnom meraní nezachytí všetko — meria sa asi 5 sekúnd. CLS môže nastať aj pri scrollovaní (lazy-loaded obrázky bez rozmerov). Best practice:

1. **CrUX dáta** v PageSpeed Insights — 28-dňový kĺzavý priemer z reálnych Chrome používateľov na mobile.
2. **Web Vitals JS knižnica** — pošle CLS hodnoty do GA4 alebo vlastného endpointu.

```js
import { onCLS } from 'web-vitals';
onCLS(({ value, entries }) => {
  // entries[i].sources ti povie KTORÝ element robil shift
  console.log('CLS', value, entries);
  gtag('event', 'web_vitals', { metric: 'CLS', value });
});
```

Tip: `entries[i].sources[j].node` ti v DevTools vráti referenciu na element, ktorý spôsobil shift. Vďaka tomu hľadáš vinníka v sekundách, nie minútach.

## TL;DR

CLS pod 0,1 nie je žiadna mágia. Tri pravidlá:

- Každý `<img>` a `<iframe>` má `width`/`height` alebo `aspect-ratio`.
- Každý dynamický slot má rezervovaný `min-height` na **maximálnu** očakávanú výšku.
- Cookie banner je `position: fixed`, nevkladá sa do toku DOM.

Začni cookie bannerom — najväčší ROI na mobile, často stačí jeden prepínač v konfigurácii a CLS klesne pod 0,05.

**Súvisiace:** [LCP nad 2.5s? 7 najčastejších príčin v praxi](/blog/lcp-nad-2-5s-pricin/) · [Core Web Vitals na eshope: ktoré stránky riešiť ako prvé](/blog/cwv-eshop-priorita/)
