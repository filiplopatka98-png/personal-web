---
title: "Astro 5 + view transitions na e-commerce: čo už funguje"
date: 2026-02-18
read: 7
tags: ["Astro", "UX", "Performance"]
excerpt: "Astro 5 má stable view transitions API. SPA-feel bez React shell-u, persistent header a cart, smooth crossfade. Plus 3 gotchas, na ktoré narazíš pri reálnom eshope."
featured: false
---

Astro 5 má view transitions API stable (od Astro 4.5 stable, v 5.x doladené). Pre e-commerce to znamená, že môžeš mať SPA-like dojem (žiadny full reload, žiadny biely flash) bez toho, aby si bootstrapoval celý React shell. V praxi: rovnaká rýchlosť ako vanilla Astro, ale UX ako Next.js.

Tu je čo som zistil po nasadení na 3 menších eshopov.

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

A je to. Defaultne dostaneš jemný crossfade medzi navigáciami. Browser support: Chromium 111+, Safari 18+, Firefox má stále len partial support — pre Firefox sa fallbackuje na plain navigation (full reload), čo je presne to, čo by si chcel — žiadne lámajúce sa polovičné riešenie.

## Persistent header a košík

Tu sa to stáva užitočné. Header s košík counter-om nechceš znova vykresliť pri každej navigácii — counter by blikal a re-fetch požiadaviek by sa duplikoval.

```astro
<header transition:persist="site-header">
  <Logo />
  <CartCounter client:load />
</header>
```

`transition:persist` povie Astro: tento DOM uzol nediskartuj, znova ho použi po navigácii. React/Preact island vnútri pokračuje bežať bez remount-u. Cart counter teda drží svoj state aj keď user prejde z `/produkty/topanky-1` na `/produkty/topanky-2`.

Pozor: persisted island sa **nereinicializuje**. Ak v ňom chceš spustiť niečo na každej page (napr. analytics page view), nedrž to v island-e samom — počúvaj na `astro:page-load` event.

## Gotcha #1: form state sa stratí

Default behaviour: navigácia diskartuje formuláre. Ak má user napísanú adresu v checkout formulári a omylom klikne "Späť", text je preč.

Riešenie:

```astro
<form transition:persist="checkout-form" method="post" action="/api/order">
  <input name="email" type="email" required />
  <input name="adresa" type="text" required />
  <button>Objednať</button>
</form>
```

Persist na `<form>` element zachová DOM aj jeho children (vrátane vyplnených hodnôt) cez navigáciu.

## Gotcha #2: third-party widgets flashujú

Smartsupp chat, Tawk.to, Google Ads pixel, GA4 — všetky sa pri navigácii unmountujú a remountujú. Chat widget zmizne na 200ms, potom sa znova načíta. Vyzerá to ako bug.

Riešenie pre script tagy:

```astro
<script is:persist src="https://www.smartsuppchat.com/loader.js?..."></script>
```

Pre inline scripty čo bootstrapujú third-party SDK:

```astro
<script is:persist>
  // Bootstrap len raz, nie na každej navigation
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

## Gotcha #3: vlastný JS sa nereinicializuje

Klasický pattern:

```js
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".product-gallery").forEach(initGallery);
});
```

Toto bežalo pri každom load-e. S view transitions `DOMContentLoaded` zazvoní len raz (pri prvom load-e). Na ďalšie navigácie použiješ `astro:page-load`:

```js
document.addEventListener("astro:page-load", () => {
  document.querySelectorAll(".product-gallery").forEach(initGallery);
});
```

`astro:page-load` zazvoní vždy — pri prvom načítaní aj po každej view transition. Žiadny `DOMContentLoaded` už nepotrebuješ.

Ďalšie eventy ktoré sa zídia:

- `astro:before-preparation` — pred fetchom novej stránky
- `astro:after-preparation` — nová stránka načítaná, ešte nezviditeľnená
- `astro:before-swap` — DOM swap chvíľu pred
- `astro:after-swap` — DOM swap dokončený

## Custom transitions per element

Default crossfade je fine, ale produktová karta na list page → produktový detail vyzerá lepšie ako "shared element transition":

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

Rovnaké `transition:name` na oboch stranách → browser ich animuje ako shared element. Funguje to len v Chromium 111+, ale tam vyzerá premium.

## Scroll restoration

Astro view transitions handle-uje scroll restoration automaticky pre back/forward navigation. Pre forward navigáciu sa scrollne na top — čo je dobré default. Ak chceš custom (napr. obnoviť scroll na produkty list po návrate z detailu), použiješ `astro:before-swap`:

```js
document.addEventListener("astro:before-swap", (e) => {
  if (e.from.pathname === "/produkty" && e.to.pathname === "/produkty") {
    // už handled defaultne
  }
});
```

## Reálny dopad

Eshop, ktorý som migroval z Astro 4 (bez transitions) na Astro 5 + ClientRouter:

- LCP nezmenený (transitions nepriaľa LCP, prvý page load funguje rovnako)
- **INP zlepšené z 240ms na 110ms** — žiadny full reload, browser nedebounce-uje pri klike na link
- Bounce rate na produktovom katalógu **−14 %** (subjective: ľudia listia viac, lebo "čo si nič nenačítava")
- Konverzia +8 % (ťažko pripísať len transitions, ale spoluhrá)

## TL;DR

`<ClientRouter />` + `transition:persist` na header/cart + `astro:page-load` namiesto `DOMContentLoaded` + `is:persist` na third-party scripty. Tri gotchas (form state, widget flash, JS init), všetky majú jednoriadkový fix. Pre Firefox plain navigation fallback — nič sa nepokazí.

Stojí to za to. Particulárne ak prechádzaš z čistého Astra a nechceš pridať React shell.
