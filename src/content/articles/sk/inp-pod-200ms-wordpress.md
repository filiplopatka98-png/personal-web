---
title: "INP pod 200ms na WordPresse: čo skutočne pomohlo"
date: 2026-02-18
read: 7
tags: ["Performance", "WordPress", "Core Web Vitals"]
excerpt: "Audit Interaction to Next Paint na produkčnom WooCommerce eshope. Z 480ms na 165ms cez päť konkrétnych zmien — bez prepisovania témy a bez výmeny hostingu."
featured: false
---

INP (Interaction to Next Paint) nahradil FID v marci 2024 a pre WordPress shopy je to brutálne odhalenie. FID meralo iba prvý klik. INP meria každú interakciu cez celú session — a vyberie najhoršiu. Lacné to nie je.

Klient z módneho segmentu, WooCommerce 8.5, 14 000 SKU, ~80k MAU. Pred auditom vyzeral CrUX takto: **INP 480ms na 75. percentile**, čo Google klasifikuje ako "Poor". Po štyroch týždňoch práce: **165ms na 75. percentile**, kategória "Good". Žiadny rebuild, žiadny headless. Tu je presný breakdown čo pomohlo a o koľko.

## 1. Blocking event listenery v admin-ajax pluginoch

Najväčší boomer. Plugin pre wishlist (TI WooCommerce Wishlist) registroval globálny `click` listener na `document` cez delegáciu — a v handleri robil synchronný `localStorage.getItem` + JSON parse pre stav 200+ položiek. Každý klik kdekoľvek na stránke = 80–120ms blokovaného hlavného vlákna.

Fix: dva riadky v `functions.php` cez `wp_dequeue_script` a vlastný 30-riadkový wishlist nad `IndexedDB` s lazy registráciou listenera len na `.product-card` elementoch.

```js
// Namiesto delegácie z document
document.querySelectorAll('.product-card').forEach(card => {
  card.querySelector('.wishlist-btn')?.addEventListener('click', toggle, { passive: true });
});
```

**Pred:** INP per-click p75 ~ 220ms. **Po:** ~ 45ms. Samotný tento fix dal -150ms na celkovom INP.

## 2. Defer non-critical third-party JS (Tidio, Smartsupp, Hotjar)

Tidio chat widget loadoval ~340KB JS pri `DOMContentLoaded`. Hotjar ďalších 90KB. Smartsupp tag manager 60KB. Všetko synchronne na vstup, všetko s postavením event listenerov ešte pred prvou interakciou.

Riešenie: namiesto `<script>` tagov v `<head>` ich load-nem cez `requestIdleCallback` (s `setTimeout` fallbackom pre Safari) až 3 sekundy po `load` evente, alebo pri prvom `pointerdown` — čokoľvek skôr.

```js
const loadDeferred = () => {
  ['https://code.tidio.co/PUBLIC_KEY.js',
   'https://static.hotjar.com/c/hotjar-XXXX.js'].forEach(src => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    document.head.appendChild(s);
  });
};

if ('requestIdleCallback' in window) {
  requestIdleCallback(loadDeferred, { timeout: 3000 });
} else {
  setTimeout(loadDeferred, 3000);
}

['pointerdown', 'keydown'].forEach(ev =>
  addEventListener(ev, loadDeferred, { once: true, passive: true })
);
```

INP zlepšenie: **-90ms p75**. Bonus: TBT klesol o 40 %.

## 3. requestIdleCallback pre analytics tracking

GA4 + Meta Pixel + custom server-side tracking endpoint. Každá interakcia spúšťala `gtag('event', ...)` synchronne v event handleri. Samotný `gtag` nie je drahý, ale Meta Pixel `fbq` má layer normalizácie eventov ktorý beží cez ~12ms na mobile.

Trick: trackovanie odložím, samotnú akciu nie.

```js
addToCartBtn.addEventListener('click', e => {
  // 1. UI update — okamžite
  updateCartUI();
  // 2. Server call — okamžite
  fetch('/wc-ajax/add_to_cart', { ... });
  // 3. Tracking — keď bude čas
  requestIdleCallback(() => {
    gtag('event', 'add_to_cart', payload);
    fbq('track', 'AddToCart', payload);
  });
});
```

INP per-click klesol o ďalších ~25ms. User vidí UI response v 80ms, tracking dobehne v ďalšom idle slot.

## 4. Virtualizácia produktovej mriežky

Listing kategórie mal default 50 produktov per page. Klient chcel "60 alebo 80 ak sa dá" pre lepšiu UX a SEO. Bez virtualizácie 80 produktov = 80 obrázkov v DOM, 80 hover handlerov, layout shifty pri scrollovaní.

Použil som `IntersectionObserver`-based "virtual" list — render-ujem len 24 viditeľných + 8 buffer kariet, ostatné sú placeholder `<div>` s rovnakou výškou. Pri scrollovaní prepínam content. Knižnicu netreba, ~120 riadkov vanilla JS.

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => e.isIntersecting ? hydrate(e.target) : dehydrate(e.target));
}, { rootMargin: '400px 0px' });

document.querySelectorAll('.product-slot').forEach(slot => observer.observe(slot));
```

Mohol som zobraziť **200 produktov per page** namiesto 50, INP sa nezhoršil. Konverzia na kategórii stúpla o 12 % (menej preklikov medzi paginated stranami).

## 5. Plugin diéta

Z pôvodných 31 aktívnych pluginov ostalo 12. Najväčší vinníci sa nazývali "iThemes Sync" (legacy, načítaval sa všade), "WP Statistics" (-/+ 80KB JS na každom page-view), "Yoast SEO Premium" (väčšinu funkcionality dnes pokrýva WP core a 40 riadkov v `functions.php`).

Plugin diéta nie je jednorazová akcia — je to mesačný ritual. Pre každý plugin si položím tri otázky:

- Pridáva ten plugin frontend JS/CSS, alebo je iba admin?
- Existuje natívna alternatíva v core / téme / 30 riadkoch v `functions.php`?
- Aktualizuje sa autor aktívne (posledných 6 mesiacov)?

Ak sú odpovede zlé, plugin letí. Detailnejšie som to rozobral v článku [Plugin diéta: z 28 na 9](/sk/articles/plugin-dieta-z-28-na-9).

## TL;DR — pred/po

| Metrika | Pred | Po |
|---|---|---|
| INP p75 (CrUX, mobile) | 480 ms | 165 ms |
| TBT (Lighthouse mobile) | 1 240 ms | 380 ms |
| JS payload (initial) | 612 KB | 244 KB |
| Aktívnych pluginov | 31 | 12 |

Najväčší boomer pre INP nie je framework ani téma. Sú to pluginy ktoré registrujú `click` listenery na `document` a robia v nich synchrónnu prácu. Pozri si DevTools → Performance → záznam interakcie a hľadaj dlhé Tasks pri user input. Potom hľadaj pôvod scriptu vo waterfall paneli. Často to bude plugin o ktorom si nevedel, že robí čokoľvek na frontende.
