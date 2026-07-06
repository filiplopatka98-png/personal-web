---
title: "Core Web Vitals na eshope: ktoré stránky riešiť ako prvé"
date: 2026-01-22
read: 7
tags: ["Core Web Vitals", "WooCommerce", "Performance"]
excerpt: "Eshop má štyri typy šablón a každá má iné CWV problémy. Tu je rozhodovací strom na to, ktorú riešiť ako prvú podľa návštevnosti a reálneho dopadu na tržby."
featured: false
---

Eshop nie je jedna stránka, ale štyri rôzne šablóny s úplne odlišnými výkonnostnými profilmi. Keď ti Search Console hodí 412 „Poor URL", nemá zmysel opravovať ich po abecede. Najprv musíš vedieť, ktorá oprava prinesie najviac peňazí.

## Stiahni si dáta zo Search Console

Nech v Search Console nečumíš na zoznam URL adries ako idiot. Správny postup je takýto:

1. **Search Console → Page Experience → Core Web Vitals → Mobile**.
2. Klikni na report **„Poor URLs"**.
3. Daj **Export → CSV** (28-dňové okno).
4. Otvor v Tabuľkách a pridaj stĺpec `template` (homepage / PLP / PDP / cart-checkout).
5. Pridaj **návštevnosť** z GA4 (počet zobrazení za rovnakých 28 dní) a prenásob.

Dostaneš tak *skóre poor URL vážené návštevnosťou*. Šablóna s najvyšším skóre je tvoja prvá oprava.

## 1) Homepage — vyzerá zle, ale často je to LCP hero

Homepage má vysokú návštevnosť, takže keď padne, padne to dramaticky. Ale v 80 % prípadov je príčina jediná:

- **LCP hero obrázok** bez `fetchpriority="high"`, bez modernej kompresie, alebo načítaný cez lazy loading.
- Slider s piatimi obrázkami, kde prvý nie je prednačítaný.

Oprava je často robota na jeden deň:

```html
<link rel="preload" as="image" href="/wp-content/uploads/hero.avif" fetchpriority="high">
<img src="/wp-content/uploads/hero.avif" fetchpriority="high" decoding="async" alt="...">
```

Reálny prípad: jeden klient mal LCP 4,1 s na homepage, po prednačítaní a konverzii do AVIF **1,2 s**. Bez ďalších zmien.

## 2) PLP (výpis produktov) — najťažší boj

Tu sa najviac vykrváca. Výpis produktov má **mriežku obrázkov** (12 – 24 obrázkov), **filtrovací JavaScript**, **stránkovanie** a často aj **AJAX pridávanie do košíka**. CWV problémy:

- **LCP** je prvý produkt v mriežke, ktorý má často `loading="lazy"` (chyba — prvých 4 – 6 produktov nad zlomom má byť eager).
- **CLS** od bočného panela s filtrami, ktorý sa vykreslí až po JavaScripte.
- **INP** od filtrovania s odloženým spúšťaním (debounce), ktoré filtruje 5000 produktov na strane klienta.

Oprava PLP dáva najväčší dopad na tržby, lebo PLP tvorí 35 – 50 % návštevnosti. Reálne číslo z jedného projektu: po optimalizácii PLP **+12 % tržieb** za mesiac. Nie kliky, **tržby**.

## 3) PDP (detail produktu) — kritická pre konverzie

PDP je miesto, kde padne rozhodnutie. Ak je miera opustenia na PDP nad 60 % a CWV sú v pásme „Poor", **rieš to ako prvé**, aj keď má menšiu návštevnosť ako PLP.

Typické problémy:

- **LCP**: hlavný obrázok produktu je v karuseli, ktorý sa hydratuje dve sekundy.
- **CLS**: widget s recenziami, odznaky sociálneho dôkazu, „ľudia kúpili aj" — všetko sa nasype až po načítaní.
- **INP**: výber variantu (farba/veľkosť) prepočítava cenu pomalým JavaScriptom.

Príklad opravy pre WooCommerce:

```php
// rezervuj priestor pre widget s recenziami
add_action('woocommerce_after_single_product_summary', function() {
  echo '<div style="min-height:320px" id="reviews-placeholder"></div>';
}, 5);
```

Žiadny CLS, lebo zástupný prvok má pevnú výšku.

## 4) Košík a pokladňa — vládne INP a TBT

Tu LCP nikoho nezaujíma. Košík a pokladňa majú nízku návštevnosť, ale **najvyššiu hodnotu na jedno zobrazenie**. Metriky, ktoré rieš:

- **INP** — klik na „Pridať" či „Použiť kupón" musí odpovedať do 200 ms.
- **TBT** — pri prvom načítaní pokladne, kde sa hydratuje stripe.js + Google Pay + 3D Secure.

Praktická rada: na stránke pokladne **vyhoď všetky sledovacie pixely**, ktoré tam nemajú čo robiť. Hotjar, Clarity, FB Pixel — daj ich len na stránku poďakovania. Zbavíš sa 400 ms TBT.

## Rozhodovací strom v jednej tabuľke

| Šablóna | Primárna metrika | Kedy riešiť ako prvú |
|---|---|---|
| Homepage | LCP | Vždy lacná oprava, urob za týždeň |
| PLP | LCP + CLS | Najvyšší dopad na tržby vážený návštevnosťou |
| PDP | LCP + CLS + INP | Ak je miera opustenia nad 60 % |
| Košík/pokladňa | INP + TBT | Ak je konverzný pomer pod benchmarkom |

## Zhrnutie

Nepýtaj sa „ktorá stránka je pomalá". Pýtaj sa „ktorá oprava prinesie najviac peňazí". Stiahni si CSV s poor URL, zoskup podľa šablóny, prenásob návštevnosťou. Začni tam, kde je číslo najvyššie. Oprava PLP má v 9 z 10 prípadov najlepší dopad na tržby, ale ak máš na PDP mieru opustenia nad 60 %, choď tam. Košík a pokladňa sú špecifické — INP a TBT, nie LCP.
