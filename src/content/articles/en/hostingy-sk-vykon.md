---
title: "SK Hosting from a Performance Angle: The Real Numbers"
date: 2026-04-10
read: 8
tags: ["Hosting", "Performance", "WordPress"]
excerpt: "A benchmark of four SK/CZ hosts on an identical WordPress install — TTFB, behavior under peak load, monthly price. The table, the takeaways, and when cloud beats a VPS."
featured: false
---

Hosting marketing is wall-to-wall smooth promises: "ultra-fast," "unlimited," "99.99% uptime." Actual numbers are rare. Three months ago I benchmarked four SK/CZ hosts on an identical WordPress install — same theme, same plugins, same content. Here are the numbers, no marketing attached.

## The test setup

An identical WordPress install across all four:

- WordPress 6.4.2
- Astra theme (free), default configuration
- 12 plugins (Yoast SEO, Contact Form 7, WooCommerce, Cookie Notice, and 8 other typical ones)
- 50 products, 20 blog posts, 4 pages
- PHP 8.2, MySQL 8 (where available)
- page-cache plugin: LiteSpeed Cache (where supported) or WP Super Cache
- no CDN — I'm testing the raw origin server's performance

Test methodology:

- **TTFB:** 50 requests via `curl -w "@curl-format.txt" -o /dev/null -s` from two locations (Bratislava over UPC fiber, Prague over Vodafone). Median.
- **Peak handling:** Apache Benchmark: `ab -c 50 -n 500 https://test.tld/` — 500 requests at 50 concurrent users. I track requests per second and fail rate.
- **PageSpeed mobile:** 3 runs, median.
- **Real-world load test:** a k6.io scenario, 100 virtual users ramping up over 5 min, then 10 min of sustained load.

## The four hosts in the test

### 1. WebSupport Standard (7.99 EUR/mo)

Classic shared hosting. LiteSpeed server, PHP 8.2, NVMe disk. Daily backups, free SSL, standard Slovak support.

- TTFB Bratislava (cached): **62 ms**
- TTFB Bratislava (uncached): **480 ms**
- TTFB Prague: **75 ms**
- ab 50 concurrent: **142 req/s**, 0% fail
- k6 100 VU: stable, p95 response 280 ms
- PageSpeed mobile: 78

**Verdict:** surprisingly good. For 90% of small-business sites, this is enough. LiteSpeed cache is the game-changer — cached TTFB is on par with the pricier options. The ceiling is peak handling — at 100+ concurrent users it starts to struggle.

### 2. WebSupport Cloud (24.90 EUR/mo)

Managed cloud with 4 GB RAM, 4 vCPU, and dedicated resources. LiteSpeed Enterprise, Redis available via support on request, PHP 8.3.

- TTFB Bratislava (cached): **28 ms**
- TTFB Bratislava (uncached): **210 ms**
- TTFB Prague: **48 ms**
- ab 50 concurrent: **380 req/s**, 0% fail
- k6 100 VU: no sweat, p95 response 95 ms
- PageSpeed mobile: 88

**Verdict:** the ideal pick for an eshop above ~30k MAU. Noticeably better peak handling, predictable performance, dedicated resources. The real gain over shared hosting: consistency — no slowdowns from "noisy neighbors."

### 3. Forpsi Linux (4.20 EUR/mo)

Czech shared hosting. Apache 2.4 (not LiteSpeed!), PHP 8.1, plain SATA SSD. The price is great, but…

- TTFB Bratislava (cached): **180 ms** (with WP Super Cache)
- TTFB Bratislava (uncached): **920 ms**
- TTFB Prague: **140 ms**
- ab 50 concurrent: **45 req/s**, 12% fail rate (!)
- k6 100 VU: collapsed at 60 VU — the server started returning 503s
- PageSpeed mobile: 54

**Verdict:** cheap, but you really feel it. Apache + classic page cache = effectively 3× slower. Under a load spike the fail rate climbs uncomfortably. Fine for a static business card, a disaster for an eshop or content site. **Not worth it.**

### 4. Hostimul Premium (9.50 EUR/mo)

Slovak shared hosting, LiteSpeed, PHP 8.2, NVMe. The marketing claims "up to 10× faster than the competition." Reality:

- TTFB Bratislava (cached): **70 ms**
- TTFB Bratislava (uncached): **520 ms**
- TTFB Prague: **95 ms**
- ab 50 concurrent: **165 req/s**, 0% fail
- k6 100 VU: stable, p95 response 240 ms
- PageSpeed mobile: 80

**Verdict:** comparable to WebSupport Standard, slightly better on uncached, slightly worse TTFB to Prague. For a strictly Slovak audience, a similar choice. "10× faster" is marketing — in reality it's 1.05× in its favor.

## Table: head-to-head

| | WebSupport Std | WS Cloud | Forpsi | Hostimul |
|---|---|---|---|---|
| Price/mo | 7.99 € | 24.90 € | 4.20 € | 9.50 € |
| TTFB BA cached | 62 ms | 28 ms | 180 ms | 70 ms |
| TTFB BA uncached | 480 ms | 210 ms | 920 ms | 520 ms |
| ab 50c req/s | 142 | 380 | 45 | 165 |
| k6 100 VU | OK | OK | FAIL | OK |
| PageSpeed mobile | 78 | 88 | 54 | 80 |
| LiteSpeed | Yes | Yes | No | Yes |
| Redis available | Planned | Yes | No | No |

## When to go with what

**Static business card, blog, small business (< 5k MAU):**
WebSupport Standard, Hostimul. The key is having LiteSpeed (for the built-in page cache). Steer clear of Forpsi and other Apache-only shared hosts — peak handling is a problem even for small sites.

**Eshop or content site (5k–50k MAU):**
WebSupport Cloud (25 EUR/mo). Dedicated resources kill the noisy-neighbor effect, Redis via support. When it comes to [Core Web Vitals, consistent TTFB is what decides it](/en/blog/cwv-eshop-priorita/) — and TTFB can be squeezed down [with cache, edge, and prefetch](/en/blog/server-response-200ms/), not just by paying for a pricier host.

**High-traffic eshop (50k+ MAU) or a specific stack:**
A VPS — Hetzner CX22 (5.83 EUR/mo, 2 vCPU, 4 GB RAM, Falkenstein) or Linode 4 GB (20 EUR/mo, multiple locations). Self-managed, but you get control over nginx, PHP-FPM tuning, MySQL configuration, and Redis. TTFB under 30 ms, peak handling of 1000+ req/s. Not for a WordPress beginner — you need server-admin skills or a managed service.

## The VPS setup I actually run

For clients above 50k MAU:

- **Hetzner CX22** (5.83 EUR/mo) — the base server, Ubuntu 24.04 LTS
- **Cloudflare Free** — DNS, edge cache, DDoS protection
- **CloudPanel** — free admin panel, better than cPanel for managed PHP
- nginx + PHP-FPM 8.3 + MariaDB 11 + Redis
- automatic SSL renewal via CloudPanel (Let's Encrypt)
- nightly backups to S3-compatible external storage (Hetzner Storage Box, 3.20 EUR/mo for 1 TB)

Total cost: **~10 EUR/mo** (server + storage). Performance far above WebSupport Cloud (25 EUR/mo). The catch: you have to know how to run it, or pay someone who does. I manage a handful of client VPSes for a managed fee of 30–50 EUR/mo.

## Cost vs ROI

Completely honestly: the gap between a 5 EUR host and a 25 EUR host can be the gap between PageSpeed 54 and 88. On an eshop with a 2% conversion rate and a 60 EUR average order, **a 20-point PageSpeed bump realistically lifts conversion by 8–15%**. At 5,000 visits a month, that's 80–150 extra orders = 4,800–9,000 EUR/mo.

Skimping on hosting for an eshop is money thrown out the window. Skimping on a portfolio site with 200 visits a month is, on the other hand, the sensible move.

## TL;DR

- **WebSupport Standard / Hostimul** (8–10 EUR) — small businesses, blogs, business cards. LiteSpeed is a must.
- **WebSupport Cloud** (25 EUR) — eshop, content site, mid-range traffic. Peak handling is what decides it.
- **Hetzner VPS + CloudPanel** (10 EUR self-managed or 40 EUR managed) — high traffic, specific requirements, full control.
- **Forpsi and similar 4 EUR Apache shared hosts** — steer clear, the economics don't add up. You save 4 EUR and lose 40 EUR in conversion.

Related: [Vercel vs Cloudflare Pages vs your own node](/en/blog/vercel-vs-cloudflare-vs-vps/) · [Server response time under 200 ms](/en/blog/server-response-200ms/) · [Core Web Vitals on an eshop](/en/blog/cwv-eshop-priorita/)
