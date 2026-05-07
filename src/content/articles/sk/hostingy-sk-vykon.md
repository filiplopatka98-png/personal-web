---
title: "Hostingy v SK z pohľadu výkonu: realistické čísla"
date: 2026-04-10
read: 8
tags: ["Hosting", "Performance", "WordPress"]
excerpt: "Benchmark štyroch SK/CZ hostingov pre identický WP setup — TTFB, peak request handling, mesačná cena. Tabuľka, závery, kedy oplatí cloud a kedy VPS."
featured: false
---

Hosting marketing je plný hladkých sľubov: "ultra-rýchly", "neobmedzený", "99.99% uptime". Reálne čísla sú vzácne. Pred tromi mesiacmi som spravil benchmark štyroch SK/CZ hostingov pre identický WP setup — rovnaká téma, rovnaké pluginy, rovnaký obsah. Tu sú čísla bez marketingu.

## Test setup

Identický WP install na všetkých štyroch:

- WordPress 6.4.2
- Astra téma (free), default config
- 12 pluginov (Yoast SEO, Contact Form 7, WooCommerce, Cookie Notice, ďalších 8 typických)
- 50 produktov, 20 blog post-ov, 4 stránky
- PHP 8.2, MySQL 8 (kde to bolo dostupné)
- Page cache plugin: LiteSpeed Cache (kde podporované) alebo WP Super Cache
- Žiadny CDN — testujem origin performance

Testovacia metodika:

- **TTFB:** 50 requestov cez `curl -w "@curl-format.txt" -o /dev/null -s` z dvoch lokácií (Bratislava cez UPC fiber, Praha cez Vodafone). Median value.
- **Peak handling:** Apache Benchmark: `ab -c 50 -n 500 https://test.tld/` — 500 requestov pri 50 concurrent users. Sleduje sa requests/sec a fail rate.
- **PageSpeed mobile:** 3 spustenia, median.
- **Real load test:** k6.io scenario, 100 virtual users ramp-up cez 5 min, sustained 10 min.

## Štyri hostingy v teste

### 1. WebSupport Standard (€7.99/mes)

Klasický shared. LiteSpeed server, PHP 8.2, NVMe disk. Backupy denne, free SSL, štandardná SK podpora.

- TTFB Bratislava (cached): **62 ms**
- TTFB Bratislava (uncached): **480 ms**
- TTFB Praha: **75 ms**
- ab 50 concurrent: **142 req/s**, 0 % fail
- k6 100 VU: stabilný, p95 response 280 ms
- PageSpeed mobile: 78

**Verdikt:** prekvapivo dobré. Pre 90 % small business stránok stačí. LiteSpeed cache je game changer — TTFB cached je porovnateľné s drahšími variantmi. Limit je peak handling — pri 100+ concurrent users začne struggle.

### 2. WebSupport Cloud (€24.90/mes)

Managed cloud s 4GB RAM, 4 vCPU, dedicated resources. LiteSpeed Enterprise, Redis dostupný cez ticket support, PHP 8.3.

- TTFB Bratislava (cached): **28 ms**
- TTFB Bratislava (uncached): **210 ms**
- TTFB Praha: **48 ms**
- ab 50 concurrent: **380 req/s**, 0 % fail
- k6 100 VU: pohoda, p95 response 95 ms
- PageSpeed mobile: 88

**Verdikt:** sweet spot pre eshop nad ~30k MAU. Dramatically lepšie peak handling, predictable performance, dedicated resources. Reálne benefit oproti shared: konzistentnosť — žiadne "noisy neighbour" spomalenia.

### 3. Forpsi Linux (€4.20/mes)

Český shared. Apache 2.4 (nie LiteSpeed!), PHP 8.1, classic SATA SSD. Cena je výborná, ale...

- TTFB Bratislava (cached): **180 ms** (s WP Super Cache)
- TTFB Bratislava (uncached): **920 ms**
- TTFB Praha: **140 ms**
- ab 50 concurrent: **45 req/s**, 12 % fail rate (!)
- k6 100 VU: spadol na 60 VU — server začal vracať 503
- PageSpeed mobile: 54

**Verdikt:** lacné, ale ozaj cítiť. Apache + classic page cache = pomalšie z faktu o 3×. Pri peak loade fail rate stúpne nepríjemne. Pre statickú vizitku OK, pre eshop alebo content site katastrofa. **Neoplatí.**

### 4. Hostimul Premium (€9.50/mes)

SK shared, LiteSpeed, PHP 8.2, NVMe. Marketing tvrdí "až 10× rýchlejší ako konkurencia". Realita:

- TTFB Bratislava (cached): **70 ms**
- TTFB Bratislava (uncached): **520 ms**
- TTFB Praha: **95 ms**
- ab 50 concurrent: **165 req/s**, 0 % fail
- k6 100 VU: stabilný, p95 response 240 ms
- PageSpeed mobile: 80

**Verdikt:** porovnateľný s WebSupport Standard, mierne lepší pri uncached, mierne horší TTFB do Prahy. Pre SK-only audience podobná voľba. "10× rýchlejší" je marketing — reálne 1.05× v prospech.

## Tabuľka: head-to-head

| | WebSupport Std | WS Cloud | Forpsi | Hostimul |
|---|---|---|---|---|
| Cena/mes | €7.99 | €24.90 | €4.20 | €9.50 |
| TTFB BA cached | 62 ms | 28 ms | 180 ms | 70 ms |
| TTFB BA uncached | 480 ms | 210 ms | 920 ms | 520 ms |
| ab 50c req/s | 142 | 380 | 45 | 165 |
| k6 100 VU | OK | OK | FAIL | OK |
| PageSpeed mobile | 78 | 88 | 54 | 80 |
| LiteSpeed | Yes | Yes | No | Yes |
| Redis available | Plán | Yes | No | No |

## Kedy ísť na čo

**Statická vizitka, blog, malá firma (< 5k MAU):**
WebSupport Standard, Hostimul. Kľúčové je mať LiteSpeed (kvôli built-in page cache). Vyhni sa Forpsi a iným Apache-only shared hostingom — peak handling je problém aj pre malé sajty.

**Eshop alebo content site (5k–50k MAU):**
WebSupport Cloud (€25/mes). Dedicated resources eliminujú noisy neighbour effect, Redis cez support. TTFB consistency rozhoduje pri Core Web Vitals.

**High-traffic eshop (50k+ MAU) alebo špecifický stack:**
VPS — Hetzner CX22 (€5.83/mes, 4 vCPU, 4GB RAM, Falkenstein) alebo Linode 4GB (€20/mes, multiple lokácie). Self-managed, ale kontrolu nad nginx, PHP-FPM tuning, MySQL config, Redis. TTFB pod 30ms, peak handling 1000+ req/s. Nie je to pre WP začiatočníka — treba server admin skills alebo managed servis.

## VPS setup ktorý reálne používam

Pre clientov nad 50k MAU:

- **Hetzner CX22** (€5.83/mes) — base server, Ubuntu 24.04 LTS
- **Cloudflare Free** — DNS, edge cache, DDoS protection
- **Cloudpanel** — free admin panel, lepší ako cPanel pre managed PHP
- nginx + PHP-FPM 8.3 + MariaDB 11 + Redis
- Auto-renewal SSL cez Cloudpanel (Let's Encrypt)
- Nightly backupy na external S3-compatible storage (Hetzner Storage Box, €3.20/mes pre 1TB)

Total cost: **~€10/mes** (server + storage). Performance ďaleko nad WebSupport Cloud (€25/mes). Catch: musíš to vedieť spravovať alebo platiť niekoho kto to vie. Ja vediem niekoľko klient-VPSiek pri €30–50/mes managed fee.

## Náklady vs ROI

Brutálne čestne: rozdiel medzi €5 hostingom a €25 hostingom môže byť rozdiel medzi PageSpeed 54 a 88. Pre eshop s konverziou 2 % a priemernou objednávkou €60, **20-bodový PageSpeed boost reálne zvýši konverziu o 8–15 %**. Pri 5000 návštev/mes to je extra 80–150 objednávok = €4 800–9 000 / mes.

Šetriť na hostingu pri eshope je peniaze hodené z okna. Šetriť pri portfólio sajte ktorá má 200 návštev/mes je naopak rozumné.

## TL;DR

- **WebSupport Standard / Hostimul** (€8–10) — small business, blog, vizitka. LiteSpeed je nutnosť.
- **WebSupport Cloud** (€25) — eshop, content site, mid-traffic. Peak handling rozhodujúci.
- **Hetzner VPS + Cloudpanel** (€10 self-managed alebo €40 managed) — high-traffic, špecifické požiadavky, plná kontrola.
- **Forpsi a podobné €4 Apache shared** — vyhni sa, ekonomika nesedí. €4 ušetríš, €40 stratíš na konverzii.
