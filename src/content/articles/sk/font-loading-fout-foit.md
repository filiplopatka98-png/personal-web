---
title: "Fonty bez blikania: recept na loading bez FOUT a FOIT"
date: 2026-12-15
read: 8
tags: ["Performance"]
excerpt: "Konkrétny recept na web fonty, ktoré neblikajú a nepreskakujú layout: subset, preload, správny font-display a fallback zladený metrikami."
featured: false
---

Font, ktorý pri načítaní stránky blikne, preskočí alebo na chvíľu zmizne, je jeden z mála výkonnostných problémov, čo si všimne aj úplný laik. Buď je text pár stoviek milisekúnd neviditeľný (FOIT — Flash of Invisible Text), alebo sa najprv zobrazí systémovým písmom a potom hupne do vlastného fontu (FOUT — Flash of Unstyled Text). Ani jedno nechceme mať bez kontroly.

Dobrá správa: dá sa to poskladať tak, že blikanie zmizne a layout sa nehýbe. Tu je recept, ktorý bežne používam. Štyri kroky: subset, preload, `font-display` a zladený fallback.

## 1. WOFF2 a subset — najprv menej dát

Väčšina blikania je len dôsledok toho, že sa font sťahuje pridlho. Prvá páka je preto veľkosť súboru.

Formát je v roku 2026 jednoznačný: **iba WOFF2**. Komprimuje približne o 30 % lepšie ako staršie WOFF a podporu má cez 97 % prehliadačov v reálnej prevádzke. TTF, EOT ani WOFF na web už nepotrebujeme.

Druhá páka je **subset**. Kompletný súbor fontu nesie stovky glyfov pre jazyky, ktoré na svojom webe nikdy nepoužiješ. Slovenský web potrebuje základnú latinku plus pár diakritických znakov — nič viac. Rozdiel býva dramatický: font pokrývajúci všetky skripty môže vážiť 400 kB aj viac, orezaný na latinku spadne pod 30 kB.

Na orezanie používam `pyftsubset` z balíka `fonttools`. Pre slovenčinu (latinka + Latin-1 + Latin Extended-A, čo pokrýva ď, ľ, š, č, ž, ť a spol.):

```bash
pip install fonttools brotli

pyftsubset Inter.ttf \
  --unicodes="U+0020-007F,U+00A0-00FF,U+0100-017F" \
  --layout-features="kern,liga,calt" \
  --flavor="woff2" \
  --output-file="inter-latin-ext.woff2"
```

`--flavor=woff2` vyžaduje nainštalovaný `brotli`, preto je v `pip install`. `--layout-features` necháva zapnuté kerning a ligatúry; keby si dal `*`, ponecháš všetky OpenType featury, čo súbor zbytočne nafúkne. Ak si nie si istý, ktoré znaky web reálne používa, projekt `glyphhanger` vie preskenovať HTML a vygenerovať presný zoznam Unicode rozsahov.

## 2. Preload — ale len ten pravý súbor

Font sa štandardne zistí až vtedy, keď prehliadač spracuje CSS a natrafí na `@font-face`, ktorý sa reálne používa. To je neskoro. `<link rel="preload">` posunie sťahovanie na začiatok.

```html
<link
  rel="preload"
  href="/fonts/inter-latin-ext.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```

Tri veci, na ktorých to padá:

- **`crossorigin` je povinné aj pri fonte z vlastnej domény.** Fonty sa načítavajú v anonymous CORS režime; bez `crossorigin` prehliadač preload nespáruje so skutočnou požiadavkou a stiahne font dvakrát.
- **Preload ignoruje `unicode-range`.** Ak si font rozdelil na latinku a cyriliku, preloadni len ten subset, ktorý reálne vykreslíš nad ohybom. Preloadovanie všetkých subsetov popiera zmysel subsetovania.
- **Preloaduj jeden, maximálne dva súbory** — typicky písmo hlavného textu. Preload obchádza bežnú prioritizáciu prehliadača, takže priveľa preloadov si navzájom kradne pásmo a poškodí [LCP](/blog/lcp-nad-2-5s-pricin/) namiesto toho, aby pomohlo.

## 3. font-display: čím sa reálne riadi blikanie

Descriptor `font-display` v `@font-face` rozhoduje o dvoch obdobiach: **block** (text je neviditeľný, čaká sa na font) a **swap** (zobrazí sa fallback a font sa vymení, keď dorazí). Kombinácia týchto dvoch určuje, či dostaneš FOIT, FOUT, alebo nič.

Hodnoty a ich časovanie (podľa Chrome for Developers):

- **`block`** — krátke block obdobie (odporúčané cca 3 s) a nekonečný swap. Toto je FOIT: text môže byť neviditeľný až 3 sekundy.
- **`swap`** — nulové block obdobie a nekonečný swap. Fallback sa ukáže hneď, font sa vymení kedykoľvek dorazí. Klasický FOUT.
- **`fallback`** — extrémne krátky block (cca 100 ms) a krátky swap (cca 3 s). Po 3 s sa už fallback nevymení.
- **`optional`** — extrémne krátky block (cca 100 ms) a nulový swap. Font sa použije len ak je v cache alebo dorazí do zhruba 100 ms, inak zostane fallback po celý čas návštevy.
- **`auto`** — necháva na prehliadač; ten sa dnes správa podobne ako `block`.

Predvolené `auto` je teda to najhoršie — dostaneš FOIT až na 3 sekundy. Vždy nastav niečo explicitne.

Moja voľba: pre bežný text **`swap`**, pretože chcem, aby človek začal čítať okamžite. FOUT sám o sebe nevadí — vadí až preskočenie layoutu, a to vyriešime v kroku 4. Kde mi na presnom tvare písma až tak nezáleží (napr. čisto dekoratívny nadpisový font), siaham po **`optional`**: buď je font okamžite k dispozícii, alebo ho pre danú návštevu vynecháme a žiadny swap sa nekoná.

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

## 4. Zladený fallback — koniec preskakovania layoutu

Toto je krok, ktorý väčšina návodov vynechá, a pritom je v roku 2026 najdôležitejší. Pri `swap` sa síce text ukáže hneď, ale systémový fallback má iné rozmery ako cieľový font — iná šírka znakov, iná výška riadka. Keď font dorazí, text sa preformátuje a skočí. To je [CLS](/blog/cls-mobil-banner/), jedna z [Core Web Vitals](/blog/cwv-eshop-priorita/) metrík.

Riešením sú metrické override descriptory: `size-adjust`, `ascent-override`, `descent-override` a `line-gap-override`. Nimi natiahneš systémový fallback tak, aby zaberal presne rovnaký priestor ako cieľový font. Keď sedia, výmena je bez reflowu — nulový CLS zo swapu.

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

Hodnoty sa nehádajú — počítajú sa z metrík fontu (`size-adjust` je pomer priemernej šírky znaku cieľového a fallback fontu, override descriptory prepočítavajú ascent/descent voči UPM). Ručne to nikto nerobí. Buď použiješ generátor override hodnôt, alebo — ak si na Next.js — to celé rieši `next/font` automaticky: pri lokálnom aj Google fonte sám vygeneruje zladený fallback a self-hostuje súbor bez externej požiadavky.

## Recept v skratke

1. **WOFF2 + subset** na jazyk, ktorý reálne používaš. Cieľ: pod 30 kB pre latinku.
2. **Preload** jedného súboru hlavného textu, vždy s `crossorigin`.
3. **`font-display: swap`** pre text, `optional` pre dekoratívne písmo. Nikdy nenechaj `auto`.
4. **Zladený fallback** cez `size-adjust` a override descriptory (alebo `next/font`), aby swap nepreskakoval layout.

Prvé tri kroky zabijú blikanie, štvrtý zabije preskakovanie. Keď sedia všetky štyri, používateľ nezbadá vôbec nič — a presne o to ide. Ak chceš vidieť, či ti swap ešte niečo posúva, [WebPageTest](/blog/webpagetest-za-5-minut/) alebo Web Vitals overlay v DevTools ti spike ukážu okamžite.
