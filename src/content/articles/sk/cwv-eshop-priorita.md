---
title: "Core Web Vitals na eshope: ktoré stránky riešiť ako prvé"
date: 2026-01-22
read: 7
tags: ["Core Web Vitals", "WooCommerce", "Performance"]
excerpt: "Eshop má 4 typy šablón a každá má iné CWV problémy. Tu je decision tree na to, ktorú riešiť ako prvú podľa traffic-weighted ROI."
featured: false
---

Eshop nie je jedna stránka, ale štyri rôzne šablóny s úplne odlišnými výkonnostnými profilmi. Keď ti Search Console hodí 412 "Poor URL", nemá zmysel ich opravovať abecedne. Najprv musíš vedieť, ktorá oprava prinesie najviac peňazí.

## Stiahni si dáta z Search Console

Nech v Search Console nečumíš na zoznam URLov ako idiot. Pravý workflow je:

1. **Search Console → Page Experience → Core Web Vitals → Mobile**.
2. Klikni na **"Poor URLs"** report.
3. Daj **Export → CSV** (28-day okno).
4. Otvor v Tabuľkách a pridaj stĺpec `template` (homepage / PLP / PDP / cart-checkout).
5. Pridaj **traffic** z GA4 (page-views za rovnaké 28 dní) a vynásob.

Čo dostaneš je *traffic-weighted poor URL skóre*. Šablóna s najvyšším skóre = tvoja prvá oprava.

## 1) Homepage — vyzerá zle, ale často je to LCP hero

Homepage má vysoký traffic, takže keď padne, padne to dramaticky. Ale 80 % prípadov je príčina jedna:

- **LCP hero image** bez `fetchpriority="high"`, bez modernej kompresie, alebo lazy-loadnutý.
- Slider s 5 obrázkami, kde prvý nie je preloadnutý.

Fix je často jednodňová robota:

```html
<link rel="preload" as="image" href="/wp-content/uploads/hero.avif" fetchpriority="high">
<img src="/wp-content/uploads/hero.avif" fetchpriority="high" decoding="async" alt="...">
```

Reálny prípad: jeden klient mal LCP 4.1s na homepage, po preload + AVIF konverzii **1.2s**. Bez ďalších zmien.

## 2) PLP (product listing) — najťažší boj

Tu sa najviac vykrváca. Product listing má **image grid** (12-24 obrázkov), **filtering JS**, **pagination** a často aj **AJAX add-to-cart**. CWV problémy:

- **LCP** je prvý produkt v gride, ktorý je často `loading="lazy"` (chyba — má byť eager pre prvé 4-6 produktov nad foldom).
- **CLS** od filter sidebar, ktorý sa renderuje až po JS.
- **INP** od debounced filtering, ktorý filtruje 5000 produktov klientsky.

PLP fix dáva najväčší ROI, lebo PLP je 35-50 % traffic-u. Reálne číslo z jedného projektu: po PLP optimalizácii **+12 % revenue** za mesiac. Nie kliky, **revenue**.

## 3) PDP (product detail) — kritické pre konverzie

PDP je miesto, kde sa robí rozhodnutie. Ak abandonment rate na PDP > 60 % a CWV sú v "Poor", **toto rieš ako prvé**, aj keď má menší traffic ako PLP.

Typické problémy:

- **LCP**: hlavný produkt obrázok je v karuseli, ktorý sa hydratuje 2 sekundy.
- **CLS**: review widget, social proof badges, "people also bought" — všetko sa nashufluje až po loadnutí.
- **INP**: variant selector (farba/veľkosť) prepočítava cenu pomalým JS-kom.

Príklad fixu pre WooCommerce:

```php
// reserve space pre review widget
add_action('woocommerce_after_single_product_summary', function() {
  echo '<div style="min-height:320px" id="reviews-placeholder"></div>';
}, 5);
```

Žiadny CLS, lebo placeholder má fixnú výšku.

## 4) Cart a checkout — INP a TBT vládnu

Tu LCP nikoho nezaujíma. Cart/checkout má nízky traffic ale **najvyššiu hodnotu na page-view**. Metriky, ktoré rieš:

- **INP** — klik na "Pridať" / "Aplikovať kupón" musí odpovedať pod 200ms.
- **TBT** — pri prvom načítaní checkout-u, kde sa hydratuje stripe.js + Google Pay + 3D-Secure.

Praktická rada: na checkout strane **vyhoď všetky tracking pixely**, ktoré tam nemajú čo robiť. Hotjar, Clarity, FB Pixel — daj ich len na thank-you stranu. Zbavíš sa 400ms TBT-čka.

## Decision tree v jednej tabuľke

| Šablóna | Primárna metrika | Kedy rieš ako prvú |
|---|---|---|
| Homepage | LCP | Vždy lacný fix, urob za týždeň |
| PLP | LCP + CLS | Najvyšší traffic-weighted ROI |
| PDP | LCP + CLS + INP | Ak abandonment > 60 % |
| Cart/checkout | INP + TBT | Ak conversion rate < benchmark |

## TL;DR

Nepýtaj sa "ktorá stránka je pomalá". Pýtaj sa "ktorá oprava prinesie najviac peňazí". Stiahni si Poor URL CSV-čko, group by template, vynásob traffic-om. Začni tam, kde je číslo najvyššie. PLP fix má v 9 z 10 prípadov najlepší ROI, ale ak máš na PDP abandonment cez 60 %, idi tam. Cart/checkout je špecifický — INP a TBT, nie LCP.
