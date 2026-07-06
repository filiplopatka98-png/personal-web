---
title: "Astro 5 + view transitions na e-commerce: čo už funguje"
date: 2026-02-18
read: 7
tags: ["Astro", "UX", "Performance"]
excerpt: "Astro 5 má stabilné view transitions API. SPA pocit bez React shellu, persistentný header aj košík, plynulý crossfade. Plus 3 nástrahy, na ktoré narazíš pri reálnom eshope."
featured: false
---

Astro 5 má view transitions API stabilné (stabilné je od Astro 3.0, vo verzii 5.0 sa router `<ViewTransitions />` premenoval na `<ClientRouter />`). Pre e-commerce to znamená, že môžeš mať SPA dojem (žiadny full reload, žiadne biele bliknutie) bez toho, aby si musel bootstrapovať celý React shell. V praxi: rovnaká rýchlosť ako čisté Astro, ale UX ako z Next.js. (Ak práve rozmýšľaš medzi týmito dvomi, mám k tomu [rozhodovaciu tabuľku Astro vs Next.js](/blog/astro-vs-nextjs-tabulka/).)

Tu je to, čo som zistil po nasadení na 3 menších eshopoch.

## Setup je jeden import

V root layoute pridáš `<ClientRouter />` (predtým `<ViewTransitions />` v Astro 4):

```astro
---
import { ClientRouter } from "astro:transitions";
---
<html lang="sk">
  <head>
    <ClientRouter />
  </head>
  <body>
    <slot />
  </body>
</html>
```

A je to. V predvolenom stave dostaneš jemný crossfade medzi navigáciami. Podpora v prehliadačoch: natívne View Transitions API bežia v Chromiu 111+ a Safari 18+; Firefox 144 (október 2025) doplnil same-document view transitions, ale cross-document navigáciu, ktorú `<ClientRouter />` používa, zatiaľ nepodporuje. Nič sa tým ale nepokazí — Astro má predvolený fallback `animate`, ktorý prechod odsimuluje aj bez natívneho API (do neho spadne aj Firefox). Prípadne si môžeš nastaviť `fallback="swap"` (okamžitá výmena bez animácie) alebo `fallback="none"` (klasická plná navigácia).

## Persistentný header a košík

Tu sa to začína hodiť. Header s počítadlom položiek v košíku nechceš znova vykresľovať pri každej navigácii — počítadlo by blikalo a znova by sa duplikovali sieťové požiadavky.

```astro
<header transition:persist="site-header">
  <Logo />
  <CartCounter client:load />
</header>
```

`transition:persist` povie Astru: tento DOM uzol nezahadzuj, po navigácii ho použi znova. React/Preact island vnútri beží ďalej bez remountu. Počítadlo košíka si teda drží svoj stav aj vtedy, keď používateľ prejde z `/produkty/topanky-1` na `/produkty/topanky-2`.

Pozor na jeden detail: persistentný island sa **neremountne a drží si stav, ale prekreslí sa s novými props** z cieľovej stránky (ak chceš zachovať aj pôvodné props, pridaj `transition:persist-props`). A ak v ňom chceš spustiť niečo na každej stránke (napr. analytické zaznamenanie zobrazenia), nedrž to priamo v islande — počúvaj na udalosť `astro:page-load`.

## Nástraha #1: stratí sa stav formulára

Predvolené správanie: navigácia formuláre zahodí. Ak má používateľ napísanú adresu v checkout formulári a omylom klikne „Späť“, text je preč.

Riešenie:

```astro
<form transition:persist="checkout-form" method="post" action="/api/order">
  <input name="email" type="email" required />
  <input name="adresa" type="text" required />
  <button>Objednať</button>
</form>
```

`transition:persist` na elemente `<form>` zachová cez navigáciu DOM aj jeho potomkov vrátane vyplnených hodnôt.

## Nástraha #2: blikajúce third-party widgety

Smartsupp chat, Tawk.to, Google Ads pixel, GA4 — všetky sa pri navigácii odpoja a znova pripoja. Chat widget zmizne na 200 ms a potom sa načíta odznova. Vyzerá to ako chyba.

Dobrá správa: klasické (bundlované) skripty v Astre bežia iba raz. Po prvom spustení ich Astro pri ďalších navigáciách ignoruje, aj keď sú na novej stránke. Problém teda robia hlavne inline skripty, ktoré bootstrapujú third-party SDK. Pri nich stačí spustiť inicializáciu len raz cez stráž na `window`:

```astro
<script is:inline>
  // Bootstrap len raz, nie na každej navigácii
  if (!window.__chatBooted) {
    window.__chatBooted = true;
    (function(d) {
      var s = d.createElement('script');
      s.src = 'https://example.com/widget.js';
      d.head.appendChild(s);
    })(document);
  }
</script>
```

## Nástraha #3: vlastný JS sa znovu nespustí

Klasický vzor:

```js
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".product-gallery").forEach(initGallery);
});
```

Toto bežalo pri každom načítaní stránky. S view transitions sa `DOMContentLoaded` spustí len raz (pri prvom načítaní). Na ďalšie navigácie použiješ `astro:page-load`:

```js
document.addEventListener("astro:page-load", () => {
  document.querySelectorAll(".product-gallery").forEach(initGallery);
});
```

`astro:page-load` sa spustí vždy — pri prvom načítaní aj po každej view transition. `DOMContentLoaded` už nepotrebuješ.

Ďalšie udalosti, ktoré sa zídu:

- `astro:before-preparation` — pred stiahnutím novej stránky
- `astro:after-preparation` — nová stránka stiahnutá, ešte nezobrazená
- `astro:before-swap` — tesne pred výmenou DOM
- `astro:after-swap` — výmena DOM dokončená

## Vlastné prechody pre konkrétny element

Predvolený crossfade je fajn, ale prechod z produktovej karty vo výpise na produktový detail vyzerá lepšie ako „shared element transition“ (prechod zdieľaného prvku):

```astro
<a href="/produkt/topanky-1">
  <img
    src="/img/topanky-1.jpg"
    transition:name="produkt-1"
    alt="Topánky model X"
  />
</a>
```

A na detail page:

```astro
<img
  src="/img/topanky-1.jpg"
  transition:name="produkt-1"
  alt="Topánky model X — detail"
/>
```

Rovnaké `transition:name` na oboch stranách → prehliadač ich zanimuje ako zdieľaný prvok. Funguje to len tam, kde beží natívne View Transitions API (Chromium 111+, Safari 18+), ale tam vyzerá prémiovo.

## Scroll restoration

Astro view transitions rieši obnovu pozície scrollu pri navigácii späť/vpred automaticky. Pri navigácii vpred odscrolluje na začiatok stránky — čo je rozumné predvolené správanie. Ak chceš vlastné (napr. obnoviť scroll vo výpise produktov po návrate z detailu), použiješ `astro:before-swap`:

```js
document.addEventListener("astro:before-swap", (e) => {
  if (e.from.pathname === "/produkty" && e.to.pathname === "/produkty") {
    // už handled defaultne
  }
});
```

## Reálny dopad

Eshop, ktorý som migroval z Astro 4 (bez transitions) na Astro 5 + ClientRouter:

- LCP nezmenené (transitions LCP neovplyvňujú, prvé načítanie stránky funguje rovnako)
- **INP sa zlepšilo z 240 ms na 110 ms** — žiadny full reload, prehliadač pri kliku na odkaz nič nedebouncuje (na WordPresse sa INP ladí inak — o tom mám [samostatný článok o INP pod 200 ms](/blog/inp-pod-200ms-wordpress/))
- Bounce rate na produktovom katalógu **−14 %** (subjektívne: ľudia listujú viac, lebo „veď sa nič nenačítava“)
- Konverzia +8 % (ťažko pripísať len transitions, ale svoje k tomu prispeli)

## TL;DR

`<ClientRouter />` + `transition:persist` na header/košík + `astro:page-load` namiesto `DOMContentLoaded` + inicializačná stráž na `window` pri third-party skriptoch. Tri nástrahy (stav formulára, blikanie widgetov, inicializácia JS), všetky majú jednoriadkovú opravu. Firefox a ostatné prehliadače bez natívneho API spadnú do simulovaného fallbacku — nič sa nepokazí.

Stojí to za to. Obzvlášť ak prechádzaš z čistého Astra a nechceš pridávať React shell.

**Súvisiace:** [Core Web Vitals na eshope: ktoré stránky riešiť ako prvé](/blog/cwv-eshop-priorita/)
