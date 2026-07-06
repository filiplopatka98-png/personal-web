---
title: "Server response time under 200ms: cache, edge, prefetch"
date: 2025-10-08
read: 7
tags: ["Performance", "Hosting", "WordPress"]
excerpt: "Layered caching for WordPress — page cache, object cache, CDN edge, and prefetch. Ready-to-use configs for LiteSpeed, Redis, and Cloudflare. Goal: TTFB under 200 ms in production."
featured: false
---

TTFB (Time to First Byte) is the ceiling on your LCP. If the server takes 800 ms to respond, no frontend trick will get you [LCP under 2.5 s](/en/blog/lcp-nad-2-5s-pricin/) on a slow phone. A WooCommerce shop with 50k MAU should have TTFB under 200 ms — and you can pull that off even on 15 EUR/month hosting. You just have to layer your cache correctly.

Here's the layered caching strategy that actually works on a production WordPress with WooCommerce.

## Layer 1: page cache (full-page HTML cache)

Biggest ROI, installs in 5 minutes. The plugin renders the HTML for anonymous visitors and stores it on disk. The next request never touches PHP or MySQL — the server hands back a finished HTML file. TTFB **80 ms instead of 800 ms**.

### Three sensible options

**WP Rocket** (59 USD/year). Commercial, the easiest to set up. Good docs, decent support. The default config works for 90 % of sites.

**LiteSpeed Cache** (free, but you need a server running LiteSpeed/OpenLiteSpeed). The fastest, because the cache is integrated right at the server level (not through files on disk that PHP has to read). WebSupport runs LiteSpeed by default.

**FastCGI cache on nginx** (free, but it's config work). The most scalable option for high-traffic sites.

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

Important: never cache logged-in users or the cart and checkout pages. WooCommerce cookies (`woocommerce_*`) bypass the cache. Both WP Rocket and LiteSpeed handle this automatically.

## Layer 2: object cache (Redis / Memcached)

Page cache doesn't cover everything. A logged-in user, the cart page, AJAX endpoints — all of it goes through PHP and MySQL. On these pages, cutting down queries with an object cache saves 200 – 500 ms.

WordPress ships with a built-in `WP_Object_Cache` API, in-memory for a single request by default. You get a persistent variant with the **Redis Object Cache** plugin or **W3 Total Cache** with a Redis backend.

```bash
# Install Redis on Ubuntu
sudo apt install redis-server php-redis
sudo systemctl enable redis
```

In `wp-config.php`:

```php
define('WP_CACHE', true);
define('WP_REDIS_HOST', '127.0.0.1');
define('WP_REDIS_PORT', 6379);
define('WP_REDIS_DATABASE', 0);
define('WP_CACHE_KEY_SALT', 'mojadomena.sk_'); // unique per site
```

Activate the **Redis Object Cache** plugin → "Enable Object Cache". Done.

**Real-world impact** on a WooCommerce category with 80 products: TTFB 620 ms → 180 ms. MySQL queries 320 → 24. Cache hit ratio after a week roughly 92 %.

## Layer 3: CDN edge cache (Cloudflare)

Page cache + object cache get you 80 ms TTFB at the origin. But if the server is in Bratislava and the user is in Munich, routing latency adds 60 ms. Global visitors pay even more.

Cloudflare's Free tier gives you a CDN for static assets (CSS, JS, images) automatically. To **cache HTML**, you have to enable it explicitly — either via Page Rules or via Cache Rules (the newer API).

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

At the origin you also have to set the `Cache-Control` header — otherwise Cloudflare won't cache HTML at all. In `functions.php`:

```php
add_action('send_headers', function() {
  if (is_user_logged_in() || is_cart() || is_checkout() || is_account_page()) {
    header('Cache-Control: private, no-cache, no-store, must-revalidate');
    return;
  }
  header('Cache-Control: public, max-age=300, s-maxage=3600');
});
```

`max-age` (browser) short, `s-maxage` (CDN) longer. The CDN checks the origin every hour, the browser every 5 minutes.

**Real-world impact** for a user in Frankfurt connecting to a SK origin: TTFB 280 ms → 45 ms. For a user in Bratislava: 80 ms → 25 ms (local PoP).

## Layer 4: prefetch and speculation rules

The last layer — prediction. There's a 70 % chance the user will click "Add to cart". Why should they wait on a network request? Pull the page down ahead of time while they're idle.

### `<link rel="prefetch">`

The classic. The browser fetches the resource in the background and stores it in cache. On click, it loads from cache and the navigation is instant.

```html
<link rel="prefetch" href="/kosik" as="document">
<link rel="prefetch" href="/produkt/sku-1234" as="document">
```

Only turn it on for the single most likely next page, not for everything. Otherwise you're pulling data for nothing.

### Speculation Rules API (Chrome 109+)

More modern, more aggressive. The browser doesn't just prefetch the page — it also prerenders it in the background. Click = instant paint.

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

`eagerness: "moderate"` means prerender after roughly 200 ms of hovering over a link (or on `pointerdown`, if that comes first). `"conservative"` only fires the speculation on `pointerdown` / touch (cheap, but late). `"eager"` reacts to even a very brief hover, and `"immediate"` prerenders the moment the rules load (the most expensive).

For details, see [developer.chrome.com/docs/web-platform/prerender-pages](https://developer.chrome.com/docs/web-platform/prerender-pages).

## The real stack for a WooCommerce shop with 50k MAU

| Layer | Solution | Cost/month |
|---|---|---|
| Hosting | WebSupport Cloud (4 GB RAM, LiteSpeed) | 25 EUR |
| Page cache | LiteSpeed Cache (built-in) | 0 EUR |
| Object cache | Redis Object Cache + Redis on the server | 0 EUR |
| CDN | Cloudflare Free + Cache Rules | 0 EUR |
| Prefetch | Speculation Rules + custom JS | 0 EUR |

**Resulting TTFB:**

- Anonymous user, cached page (BA): 25 ms
- Anonymous user, cached page (Frankfurt): 45 ms
- Logged-in user, dynamic page: 180 ms
- Cold cache miss: 320 ms

LCP on the production shop dropped from 3.4 s to 1.6 s. PageSpeed mobile 42 → 89.

## TL;DR

Layer your cache from the top down: CDN edge → page cache → object cache → MySQL. Each layer catches 80 – 95 % of requests, and only the remainder goes deeper. There's no point tuning object cache without page cache. There's no point tuning MySQL without object cache. Start with page cache (1 plugin), then Redis (1 day of work), then Cloudflare HTML cache (2 hours), then prefetch (a couple of hours). A week later you're at 200 ms TTFB.

Once you've got server response handled, the next ceiling is client-side interactivity — see [INP under 200 ms on WordPress](/en/blog/inp-pod-200ms-wordpress/). And if you're figuring out which shop pages to optimize first, check out [prioritizing Core Web Vitals on an eshop](/en/blog/cwv-eshop-priorita/).
