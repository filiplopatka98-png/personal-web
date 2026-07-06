---
title: "Server response time pod 200ms: cache, edge, prefetch"
date: 2025-10-08
read: 7
tags: ["Performance", "Hosting", "WordPress"]
excerpt: "Vrstvené cachovanie pre WordPress — page cache, object cache, CDN edge a prefetch. Hotové konfigurácie pre LiteSpeed, Redis a Cloudflare. Cieľ: TTFB pod 200 ms na produkcii."
featured: false
---

TTFB (Time to First Byte) je strop tvojho LCP. Ak server odpovedá 800 ms, žiadnym frontendovým trikom nedostaneš [LCP pod 2,5 s](/blog/lcp-nad-2-5s-pricin/) na pomalom mobile. WooCommerce shop s 50k MAU by mal mať TTFB pod 200 ms — a dá sa to aj na hostingu za 15 EUR/mesiac. Treba len správne vrstviť cache.

Tu je stratégia vrstveného cachovania, ktorá reálne funguje na produkčnom WordPresse s WooCommerce.

## Vrstva 1: page cache (full-page HTML cache)

Najväčší ROI, nainštaluješ za 5 minút. Plugin vyrenderuje HTML pre anonymných používateľov a uloží ho na disk. Ďalší request sa neopiera o PHP ani MySQL — server vráti hotový HTML súbor. TTFB **80 ms namiesto 800 ms**.

### Tri rozumné voľby

**WP Rocket** (59 USD/rok). Komerčný, najjednoduchšie nastavenie. Dobrá dokumentácia, slušný support. Predvolená konfigurácia funguje pre 90 % stránok.

**LiteSpeed Cache** (zadarmo, ale potrebuješ server s LiteSpeed/OpenLiteSpeed). Najrýchlejší, lebo cache je integrovaná priamo na úrovni servera (nie cez súbory na disku, ktoré musí čítať PHP). WebSupport má LiteSpeed v predvolenom nastavení.

**FastCGI cache na nginxe** (zadarmo, ale konfigurácia). Najškálovateľnejšia pre stránky s vysokou návštevnosťou.

```nginx
# /etc/nginx/conf.d/fastcgi-cache.conf
fastcgi_cache_path /var/cache/nginx levels=1:2 keys_zone=WORDPRESS:100m
                   inactive=60m use_temp_path=off;

server {
  set $skip_cache 0;
  if ($request_method = POST) { set $skip_cache 1; }
  if ($query_string != "") { set $skip_cache 1; }
  if ($request_uri ~* "/wp-admin/|/cart/|/checkout/|/my-account/") { set $skip_cache 1; }
  if ($http_cookie ~* "wordpress_logged_in_|woocommerce_") { set $skip_cache 1; }

  location ~ \.php$ {
    fastcgi_cache WORDPRESS;
    fastcgi_cache_valid 200 60m;
    fastcgi_cache_bypass $skip_cache;
    fastcgi_no_cache $skip_cache;
    add_header X-Cache $upstream_cache_status;
    # ... rest
  }
}
```

Dôležité: nikdy necachuj prihlásených používateľov ani stránky košíka a pokladne. Cookies WooCommerce (`woocommerce_*`) cache obchádzajú. Toto WP Rocket aj LiteSpeed robia automaticky.

## Vrstva 2: object cache (Redis / Memcached)

Page cache nepokryje všetko. Prihlásený používateľ, stránka košíka, AJAX endpointy — všetko ide cez PHP a MySQL. Na týchto stránkach ušetrí redukcia dopytov cez object cache 200 – 500 ms.

WordPress má vstavané API `WP_Object_Cache`, v predvolenom stave in-memory pre jeden request. Perzistentný variant zabezpečíš pluginom **Redis Object Cache** alebo **W3 Total Cache** s Redis backendom.

```bash
# Inštalácia Redis na Ubuntu
sudo apt install redis-server php-redis
sudo systemctl enable redis
```

V `wp-config.php`:

```php
define('WP_CACHE', true);
define('WP_REDIS_HOST', '127.0.0.1');
define('WP_REDIS_PORT', 6379);
define('WP_REDIS_DATABASE', 0);
define('WP_CACHE_KEY_SALT', 'mojadomena.sk_'); // unique per site
```

Aktivuj plugin **Redis Object Cache** → „Enable Object Cache". Hotovo.

**Reálny dopad** na kategórii WooCommerce s 80 produktmi: TTFB 620 ms → 180 ms. MySQL dopyty 320 → 24. Pomer zásahov cache (cache hit ratio) po týždni cca 92 %.

## Vrstva 3: CDN edge cache (Cloudflare)

Page cache + object cache ti dajú 80 ms TTFB na origine. Ale ak je server v Bratislave a používateľ v Mníchove, latencia routingu pridá 60 ms. Globálni návštevníci platia ešte viac.

Cloudflare Free tier má CDN pre statiku (CSS, JS, obrázky) automaticky. Pre **cachovanie HTML** ho treba povoliť explicitne — buď cez Page Rules, alebo cez Cache Rules (novšie API).

```
# Cloudflare Cache Rule
Rule name: Cache HTML
If: (URI Path does not contain "/wp-admin")
   AND (URI Path does not contain "/cart")
   AND (URI Path does not contain "/checkout")
   AND (HTTP Cookie does not contain "wordpress_logged_in_")
Then:
   Cache Eligibility: Eligible for cache
   Edge TTL: Override origin, 1 hour
   Browser TTL: 4 hours
```

Na origine musíš upraviť aj hlavičku `Cache-Control` — inak Cloudflare HTML cachovať nebude. V `functions.php`:

```php
add_action('send_headers', function() {
  if (is_user_logged_in() || is_cart() || is_checkout() || is_account_page()) {
    header('Cache-Control: private, no-cache, no-store, must-revalidate');
    return;
  }
  header('Cache-Control: public, max-age=300, s-maxage=3600');
});
```

`max-age` (prehliadač) krátky, `s-maxage` (CDN) dlhší. CDN sa pýta origin každú hodinu, prehliadač každých 5 minút.

**Reálny dopad** pre používateľa z Frankfurtu, ktorý sa pripája na SK origin: TTFB 280 ms → 45 ms. Pre používateľa z Bratislavy: 80 ms → 25 ms (lokálny PoP).

## Vrstva 4: prefetch a speculation rules

Posledná vrstva — predikcia. Používateľ s 70 % pravdepodobnosťou klikne na „Pridať do košíka". Prečo by mal čakať na sieťový request? Stiahni si stránku dopredu v čase nečinnosti.

### `<link rel="prefetch">`

Klasika. Prehliadač na pozadí stiahne resource a uloží ho do cache. Pri kliku ho načíta z cache a navigácia je okamžitá.

```html
<link rel="prefetch" href="/kosik" as="document">
<link rel="prefetch" href="/produkt/sku-1234" as="document">
```

Zapni to len pre najpravdepodobnejšiu ďalšiu stránku, nie pre všetko. Inak zbytočne ťaháš dáta.

### Speculation Rules API (Chrome 109+)

Modernejší, agresívnejší. Prehliadač stránku nielen prefetchne, ale ju aj prerenderuje na pozadí. Klik = okamžitý paint.

```html
<script type="speculationrules">
{
  "prerender": [{
    "where": {
      "and": [
        {"href_matches": "/produkt/*"},
        {"not": {"selector_matches": ".no-prerender"}}
      ]
    },
    "eagerness": "moderate"
  }]
}
</script>
```

`eagerness: "moderate"` znamená prerender po približne 200 ms hoveru nad odkazom (alebo na `pointerdown`, ak nastane skôr). `"conservative"` spustí špekuláciu až na `pointerdown` / dotyk (lacné, ale neskoré). `"eager"` reaguje už na veľmi krátky hover a `"immediate"` prerenderuje hneď, ako sa pravidlá načítajú (najdrahšie).

Pre detail [developer.chrome.com/docs/web-platform/prerender-pages](https://developer.chrome.com/docs/web-platform/prerender-pages).

## Reálny stack pre WooCommerce shop s 50k MAU

| Vrstva | Riešenie | Cena/mesiac |
|---|---|---|
| Hosting | WebSupport Cloud (4 GB RAM, LiteSpeed) | 25 EUR |
| Page cache | LiteSpeed Cache (vstavaný) | 0 EUR |
| Object cache | Redis Object Cache + Redis na serveri | 0 EUR |
| CDN | Cloudflare Free + Cache Rules | 0 EUR |
| Prefetch | Speculation Rules + vlastný JS | 0 EUR |

**Výsledné TTFB:**

- Anonymný používateľ, cachovaná stránka (BA): 25 ms
- Anonymný používateľ, cachovaná stránka (Frankfurt): 45 ms
- Prihlásený používateľ, dynamická stránka: 180 ms
- Studený výpadok cache (cache miss): 320 ms

LCP na produkčnom shope klesol z 3,4 s na 1,6 s. PageSpeed mobile 42 → 89.

Keď máš server response vyriešený, ďalší strop je interaktivita na klientovi — pozri [INP pod 200 ms na WordPresse](/blog/inp-pod-200ms-wordpress/). A ak riešiš, ktoré stránky eshopu optimalizovať ako prvé, mrkni na [prioritizáciu Core Web Vitals na eshope](/blog/cwv-eshop-priorita/).

## TL;DR

Vrstvi cache zhora nadol: CDN edge → page cache → object cache → MySQL. Každá vrstva chytí 80 – 95 % requestov, hlbšie ide len zvyšok. Bez page cache nemá zmysel ladiť object cache. Bez object cache nemá zmysel ladiť MySQL. Začni page cache (1 plugin), potom Redis (1 deň práce), potom Cloudflare HTML cache (2 hodiny), potom prefetch (pár hodín). Po týždni si na TTFB 200 ms.
