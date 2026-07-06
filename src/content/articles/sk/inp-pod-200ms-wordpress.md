---
title: "INP pod 200ms na WordPresse: čo skutočne pomohlo"
date: 2026-02-18
read: 7
tags: ["Performance", "WordPress", "Core Web Vitals"]
excerpt: "Audit Interaction to Next Paint na produkčnom WooCommerce eshope. Z 480 ms na 165 ms cez päť konkrétnych zmien — bez prepisovania témy a bez výmeny hostingu."
featured: false
---

INP (Interaction to Next Paint) nahradil FID 12. marca 2024 a pre WordPress eshopy je to brutálne odhalenie. FID meralo iba prvý klik. INP meria každú interakciu počas celej návštevy — a vyberie tú najhoršiu. Lacné to nie je.

Klient z módneho segmentu, WooCommerce 8.5, 14 000 SKU, ~80-tisíc MAU. Pred auditom vyzeral CrUX takto: **INP 480 ms na 75. percentile**, čo Google klasifikuje ako „Needs Improvement“ (dobré je ≤ 200 ms, zlé až nad 500 ms). Po štyroch týždňoch práce: **165 ms na 75. percentile**, kategória „Good“. Žiadny rebuild, žiadny headless. Tu je presný rozpis, čo pomohlo a o koľko. INP je len jedno z troch Core Web Vitals — ak riešiš celý eshop, pozri aj [ktoré stránky na eshope riešiť ako prvé](/blog/cwv-eshop-priorita/).

## 1. Blokujúce event listenery v admin-ajax pluginoch

Najväčší problém. Plugin na wishlist (TI WooCommerce Wishlist) registroval globálny `click` listener na `document` cez delegáciu — a v handleri robil synchrónny `localStorage.getItem` a JSON parse pre stav 200+ položiek. Každý klik kdekoľvek na stránke znamenal 80 – 120 ms zablokovaného hlavného vlákna.

Fix: dva riadky vo `functions.php` cez `wp_dequeue_script` a vlastný 30-riadkový wishlist nad `IndexedDB` s lazy registráciou listenera len na `.product-card` elementoch.

```js
// Namiesto delegácie z document
document.querySelectorAll('.product-card').forEach(card => {
  card.querySelector('.wishlist-btn')?.addEventListener('click', toggle, { passive: true });
});
```

**Pred:** INP na klik p75 ~ 220 ms. **Po:** ~ 45 ms. Samotný tento fix ubral -150 ms na celkovom INP.

## 2. Odloženie nekritického third-party JS (Tidio, Smartsupp, Hotjar)

Tidio chat widget načítaval ~340 KB JS pri `DOMContentLoaded`. Hotjar ďalších 90 KB. Smartsupp tag manager 60 KB. Všetko synchrónne pri vstupe, všetko s registráciou event listenerov ešte pred prvou interakciou.

Riešenie: namiesto `<script>` tagov v `<head>` ich načítam cez `requestIdleCallback` (so `setTimeout` fallbackom pre Safari, ktoré ho v stabilných verziách štandardne stále nemá) až 3 sekundy po `load` evente, alebo pri prvom `pointerdown` — čokoľvek nastane skôr.

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

Zlepšenie INP: **-90 ms p75**. Bonus: TBT klesol o 40 %. Ak ťa trápi aj to, ako rýchlo server vôbec odpovie, mám samostatný rozpis, ako sa dostať [so server response time pod 200 ms cez cache, edge a prefetch](/blog/server-response-200ms/).

## 3. requestIdleCallback pre analytické trackovanie

GA4 + Meta Pixel + vlastný server-side tracking endpoint. Každá interakcia spúšťala `gtag('event', ...)` synchrónne v event handleri. Samotný `gtag` nie je drahý, ale Meta Pixel `fbq` má vrstvu normalizácie eventov, ktorá na mobile beží ~12 ms.

Trik: trackovanie odložím, samotnú akciu nie.

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

INP na klik klesol o ďalších ~25 ms. Používateľ vidí reakciu UI do 80 ms, tracking dobehne v ďalšom idle slote.

## 4. Virtualizácia produktovej mriežky

Výpis kategórie mal štandardne 50 produktov na stránku. Klient chcel „60 alebo 80, ak sa dá“ pre lepšiu UX a SEO. Bez virtualizácie 80 produktov = 80 obrázkov v DOM, 80 hover handlerov, layout shifty pri skrolovaní.

Použil som „virtuálny“ zoznam postavený na `IntersectionObserver` — renderujem len 24 viditeľných + 8 buffer kariet, ostatné sú placeholder `<div>` s rovnakou výškou. Pri skrolovaní obsah prepínam. Knižnicu netreba, ~120 riadkov vanilla JS.

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => e.isIntersecting ? hydrate(e.target) : dehydrate(e.target));
}, { rootMargin: '400px 0px' });

document.querySelectorAll('.product-slot').forEach(slot => observer.observe(slot));
```

Mohol som zobraziť **200 produktov na stránku** namiesto 50 a INP sa nezhoršil. Konverzia na kategórii stúpla o 12 % (menej preklikávania medzi stránkovanými stranami).

## 5. Plugin diéta

Z pôvodných 31 aktívnych pluginov ostalo 12. Najväčší vinníci sa volali „iThemes Sync“ (legacy, načítaval sa všade), „WP Statistics“ (plus-mínus 80 KB JS na každom zobrazení stránky) a „Yoast SEO Premium“ (väčšinu funkcií dnes pokrýva WP core a 40 riadkov vo `functions.php`).

Plugin diéta nie je jednorazová akcia — je to mesačný rituál. Pri každom plugine si položím tri otázky:

- Pridáva ten plugin frontendový JS/CSS, alebo je len admin?
- Existuje natívna alternatíva v core, v téme alebo v 30 riadkoch vo `functions.php`?
- Aktualizuje autor plugin aktívne (za posledných 6 mesiacov)?

Ak sú odpovede zlé, plugin letí. Detailnejšie som to rozobral v článku [Plugin diéta: z 28 na 9](/blog/plugin-dieta-z-28-na-9/).

## TL;DR — pred/po

| Metrika | Pred | Po |
|---|---|---|
| INP p75 (CrUX, mobil) | 480 ms | 165 ms |
| TBT (Lighthouse mobil) | 1 240 ms | 380 ms |
| JS payload (initial) | 612 KB | 244 KB |
| Aktívnych pluginov | 31 | 12 |

Najväčší problém pre INP nie je framework ani téma. Sú to pluginy, ktoré registrujú `click` listenery na `document` a robia v nich synchrónnu prácu. Pozri si DevTools → Performance → záznam interakcie a hľadaj dlhé Tasks pri vstupe používateľa. Potom hľadaj pôvod scriptu vo waterfall paneli. Často to bude plugin, o ktorom si nevedel, že na frontende vôbec niečo robí.

**Súvisiace:** [7 najčastejších príčin LCP nad 2.5 s](/blog/lcp-nad-2-5s-pricin/) · [Core Web Vitals na eshope: čo riešiť ako prvé](/blog/cwv-eshop-priorita/)
