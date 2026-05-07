---
title: "Server response time pod 200ms: cache, edge, prefetch"
date: 2025-10-08
read: 7
tags: ["Performance", "Hosting", "WordPress"]
excerpt: "Layered caching pre WordPress — page cache, object cache, CDN edge a prefetch. Konfigurácie pre LiteSpeed, Redis, Cloudflare. Cieľ TTFB pod 200ms na produkcii."
featured: false
---

TTFB (Time to First Byte) je strop tvojho LCP. Ak server odpovedá 800ms, žiadnym frontend trikom nedostaneš LCP pod 2.5s na pomalom mobile. WP shop s 50k MAU by mal mať TTFB pod 200ms — a dá sa to aj na hostingu za €15/mes. Treba len správne vrstviť cache.

Tu je layered caching strategia ktorá reálne funguje na produkčnom WP/WooCommerce.

## Vrstva 1: page cache (full-page HTML cache)

Najväčší ROI, nainštaluješ za 5 minút. Plugin vyrenderuje HTML pre anonymných užívateľov a uloží ho na disk. Ďalší request sa neopiera o PHP ani MySQL — server vráti hotový HTML súbor. TTFB **80ms namiesto 800ms**.

### Tri rozumné voľby

**WP Rocket** (€59/rok). Komerčný, najjednoduchšie nastavenie. Dobrá dokumentácia, slušný support. Default config funguje pre 90 % stránok.

**LiteSpeed Cache** (zadarmo, ale potrebuješ LiteSpeed/OpenLiteSpeed server). Najrýchlejší, lebo cache je integrovaná v server-level (nie cez disk soubory ktoré PHP musí čítať). WebSupport má LiteSpeed default-ne.

**FastCGI cache na nginx** (zadarmo, ale konfig). Najškálovateľnejšie pre traffic-heavy stránky.

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

Dôležité: nikdy necachuj logged-in users a cart/checkout pages. WooCommerce cookies (`woocommerce_*`) bypassujú cache. Toto WP Rocket aj LiteSpeed robia automaticky.

## Vrstva 2: object cache (Redis / Memcached)

Page cache nepokryje všetko. Logged-in user, cart page, AJAX endpointy — všetko ide cez PHP a MySQL. Na týchto stránkach query reduction cez object cache uštetrí 200–500ms.

WordPress má built-in `WP_Object_Cache` API, default-ne in-memory pre single request. Persistent variant cez plugin **Redis Object Cache** alebo **W3 Total Cache** s Redis backendom.

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

Aktivuj **Redis Object Cache** plugin → "Enable Object Cache". Hotovo.

**Reálny dopad** na WooCommerce kategórii s 80 produktmi: TTFB 620ms → 180ms. MySQL queries 320 → 24. Cache hit ratio po týždni cca 92 %.

## Vrstva 3: CDN edge cache (Cloudflare)

Page cache + object cache ti dajú 80ms TTFB na origin. Ale ak je server v Bratislave a user v Mníchove, latency cez routing pridá 60ms. Globálni návštevníci platia ešte viac.

Cloudflare Free tier má CDN pre statiku (CSS, JS, obrázky) automaticky. Pre **HTML caching** treba povoliť explicitne — buď cez Page Rules, alebo cez Cache Rules (newer API).

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

`Cache-Control` header na origin musíš tiež upraviť — inak Cloudflare nebude HTML cachovať. V `functions.php`:

```php
add_action('send_headers', function() {
  if (is_user_logged_in() || is_cart() || is_checkout() || is_account_page()) {
    header('Cache-Control: private, no-cache, no-store, must-revalidate');
    return;
  }
  header('Cache-Control: public, max-age=300, s-maxage=3600');
});
```

`max-age` (browser) krátky, `s-maxage` (CDN) dlhší. CDN sa pýta origin každú hodinu, browser každých 5 minút.

**Reálny dopad** pre user z Frankfurtu hitujúci SK origin: TTFB 280ms → 45ms. Pre user z Bratislavy: 80ms → 25ms (lokálny PoP).

## Vrstva 4: prefetch a speculation rules

Posledná vrstva — predikcia. User je 70 % pravdepodobne klikne na "Pridať do košíka". Prečo by si mal čakať na network request? Pre-fetchni stránku v idle čase.

### `<link rel="prefetch">`

Klasika. Browser na pozadí stiahne resource, uloží do cache. Pri kliku načíta z cache, navigation je inštantná.

```html
<link rel="prefetch" href="/kosik" as="document">
<link rel="prefetch" href="/produkt/sku-1234" as="document">
```

Zapni len pre most-likely-next-page, nie pre všetko. Inak zbytočne ťaháš dáta.

### Speculation Rules API (Chrome 121+)

Modernejší, agresívnejší. Browser nielen prefetchne, ale aj prerenderuje stránku v background tabe. Klik = okamžitý paint.

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

`eagerness: "moderate"` znamená prerender na hover. `"eager"` na first paint (drahé), `"conservative"` na pointerdown (lacné, neskoré).

Pre detail [web.dev/articles/speculation-rules](https://web.dev/articles/speculation-rules).

## Reálny stack pre WP shop s 50k MAU

| Vrstva | Riešenie | Cena/mes |
|---|---|---|
| Hosting | WebSupport Cloud (4GB RAM, LiteSpeed) | €25 |
| Page cache | LiteSpeed Cache (built-in) | €0 |
| Object cache | Redis Object Cache + Redis na serveri | €0 |
| CDN | Cloudflare Free + Cache Rules | €0 |
| Prefetch | Speculation Rules + custom JS | €0 |

**Výsledné TTFB:**

- Anonymous user, cached page (BA): 25 ms
- Anonymous user, cached page (Frankfurt): 45 ms
- Logged-in user, dynamic page: 180 ms
- Cold cache miss: 320 ms

LCP na produkčnom shopu klesol z 3.4s na 1.6s. PageSpeed mobile 42 → 89.

## TL;DR

Vrstvi cache zhora-nadol: CDN edge → page cache → object cache → MySQL. Každá vrstva chytí 80–95 % requestov, len zvyšok ide hlbšie. Bez page cache nemá zmysel ladiť object cache. Bez object cache nemá zmysel ladiť MySQL. Začni page cache (1 plugin), potom Redis (1 deň práce), potom Cloudflare HTML cache (2 hodiny), potom prefetch (par hodín). Po týždni si na 200ms TTFB.
