---
title: "Redis Object Cache on WordPress: When It Pays Off and How to Set It Up"
date: 2026-10-08
read: 8
tags: ["WordPress", "Performance"]
excerpt: "A persistent object cache via Redis can take real load off the database on admin-heavy WooCommerce sites. When it actually helps, how to set it up right, and where the traps are."
featured: false
---

Almost every other WordPress project I take into an audit has that Site Health notice glowing at me: "You should use a persistent object cache." This check landed in WordPress 6.1, and ever since I keep seeing it ignored on sites where an object cache would genuinely help — and also on sites where it would be completely pointless. Let's clear this up: when Redis object cache makes sense, how to deploy it correctly, and why simply "turning on Redis" often does nothing at all.

## What an object cache actually solves

WordPress has had a built-in object cache for years, but by default it's **non-persistent**. That means everything `wp_cache_set()` stores in memory lives for exactly one request — once the request ends it's thrown away, and the next request redoes the same work (same DB queries, same options deserialization) from scratch.

A persistent object cache changes that: data from `wp_cache_set()` gets stored in an external store (Redis or Memcached) that's shared across all PHP processes and survives between requests. The mechanics are surprisingly simple — the plugin installs a drop-in file at `wp-content/object-cache.php` that implements the `wp_cache_*()` functions against Redis. WordPress core loads this file very early during boot, if it exists, so all cache calls go to the persistent backend instead of memory.

An important distinction people mix up: object cache is **not** the same as page cache. Page cache (Varnish, Nginx FastCGI cache, WP Rocket) serves ready-made HTML to anonymous visitors and never even reaches the object cache. Object cache helps precisely where page cache doesn't work — logged-in users, the WooCommerce cart, admin, the REST API. If you're also tackling the former, see [which pages to fix first on an online store](/en/blog/cwv-eshop-priorita/).

## When it makes sense, and when it doesn't

This is the part most guides skip. Redis object cache is **not a universal improvement**. In practice I see it like this:

**It makes sense** when you have an admin-heavy or dynamic site: WooCommerce with thousands of products, a membership section, an LMS, a multilingual site with heavy `options` tables, anything with lots of logged-in users. There the DB queries can't hide behind page cache, and object cache genuinely takes load off the database.

**It doesn't make sense** on a simple brochure site or a blog that runs almost entirely behind page cache. An anonymous visitor gets HTML from page cache and never reaches PHP or the DB at all — object cache just adds overhead there and one more thing that can break. WordPress acknowledges this in the Site Health check itself: the recommendation only appears above a certain threshold (number of stored options, comments, users, and so on), because on a small site the effect is negligible.

My rule: if a site doesn't have a significant share of dynamic (uncached) requests, don't bother with Redis. Invest in a fast [TTFB under 200 ms](/en/blog/ttfb-pod-200ms/) and a solid page cache instead.

## Redis or Memcached

Briefly, because it's the eternal question. Redis is the better default in most cases — it survives a server restart (it persists to disk), supports richer data structures, and the plugin around it is actively maintained. Memcached tends to be slightly faster for pure key-value lookups, but the cache is lost on every restart and while it refills, the server takes on extra load. For WordPress I go with Redis, no hesitation.

## Step-by-step deployment

Assumption number one, the one it fails on most often: **the Redis server has to actually be running** and PHP has to be able to connect to it. The plugin won't install Redis for you. If the host doesn't have Redis, the plugin alone is just dead weight. Verify this first — either via your host's support or with a command.

```bash
redis-cli ping
# PONG
```

Ideally you also want the **PhpRedis** extension (PECL, compiled in C), not just the Predis PHP library. According to real benchmarks PhpRedis is several times faster — roughly ~150,000 GET/SET operations per second versus ~30,000 for Predis. Check what you have in `phpinfo()` or with:

```bash
php -m | grep redis
```

Next, add the constants to `wp-config.php` — **above** the `/* That's all, stop editing! */` line:

```php
define( 'WP_REDIS_HOST', '127.0.0.1' );
define( 'WP_REDIS_PORT', 6379 );
define( 'WP_REDIS_DATABASE', 0 );

// CRITICAL when multiple sites share one Redis server:
define( 'WP_CACHE_KEY_SALT', 'mysite.com:' );
```

`WP_CACHE_KEY_SALT` is the part people leave out and then wonder why their data gets mixed between sites on a shared Redis. Without a unique salt, cache keys from two installs collide — and those are very hard-to-trace bugs. If Redis runs over a unix socket, use this instead of host/port:

```php
define( 'WP_REDIS_SCHEME', 'unix' );
define( 'WP_REDIS_PATH', '/var/run/redis/redis.sock' );
```

Then install the **Redis Object Cache** plugin by Till Krüss (currently 2.8.0, over 400,000 active installs, requires PHP 7.2+). It's the de facto standard and supports PhpRedis, Predis, and Relay. You activate it in the admin via the "Enable Object Cache" button, or more elegantly via WP-CLI:

```bash
wp redis enable
wp redis status
```

`wp redis status` tells you whether the connection works, which client is in use, and whether the drop-in is in place. That's your proof it's actually running — not the Site Health notice, which you can "quiet down" even with a half-finished setup.

## Don't forget igbinary

A small but real performance detail: enable the **igbinary** serializer. Instead of native PHP serialize it stores data more compactly — in practice it shrinks stored data to roughly a third and saves (de)serialization time; profiling often shows up to half the time spent on unserialize disappearing. You need the `igbinary` PHP extension and one constant:

```php
define( 'WP_REDIS_SERIALIZER', 'igbinary' );
```

Verify the extension is loaded (`php -m | grep igbinary`), otherwise the plugin quietly falls back to the default and you'll think it's working.

## Traps I watch out for

**Redis goes down, the site goes down — unless you cover yourself.** A decent plugin has a built-in fallback: when Redis is unreachable it silently drops back to the non-persistent cache and the site keeps running (just slower). Verify it. A brief Redis outage must not take the whole site down.

**Stale cache after a deploy.** After bigger changes (plugin updates, a migration, changed options) flush the cache, otherwise you serve stale data:

```bash
wp cache flush
```

**Shared Redis with no memory limit.** If several sites run on one Redis instance with no `maxmemory` and `maxmemory-policy` set (e.g. `allkeys-lru`), sooner or later Redis will eat all the memory. This is something you handle on the server side, not in the plugin.

**Measure, don't believe.** Don't deploy Redis "because Site Health said so." Measure before and after — DB queries per request (Query Monitor), TTFB on uncached URLs, admin operation time. In most admin-heavy projects I see a real drop in DB query counts and TTFB, but verify the number on your own site, not from a blog post.

## Summary

Redis object cache is a great tool in the right place: dynamic, admin-heavy, and WooCommerce sites where page cache doesn't help. On a static blog it's a solution to a problem you don't have. Deployment is straightforward — a running Redis, the PhpRedis extension, a few constants in `wp-config.php`, the plugin, igbinary, and `WP_CACHE_KEY_SALT`. And above all: verify it works via `wp redis status` and measure the effect — don't rely on the green check in Site Health. If you want the broader WordPress performance picture, see also [WP-CLI commands that save you hours](/en/blog/wp-cli-12-prikazov/) and [the plugin diet from 28 down to 9](/en/blog/plugin-dieta-z-28-na-9/).
