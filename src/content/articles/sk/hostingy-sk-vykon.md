---
title: "Hostingy v SK z pohľadu výkonu: realistické čísla"
date: 2026-04-10
read: 8
tags: ["Hosting", "Performance", "WordPress"]
excerpt: "Benchmark štyroch SK/CZ hostingov na identickom WordPresse — TTFB, zvládanie záťaže pri špičke, mesačná cena. Tabuľka, závery a kedy sa oplatí cloud a kedy VPS."
featured: false
---

Marketing hostingov je plný hladkých sľubov: „ultra-rýchly“, „neobmedzený“, „99,99 % uptime“. Reálne čísla sú vzácne. Pred tromi mesiacmi som spravil benchmark štyroch SK/CZ hostingov na identickom WordPresse — rovnaká téma, rovnaké pluginy, rovnaký obsah. Tu sú čísla bez marketingu.

## Testovacia zostava

Identická inštalácia WordPressu na všetkých štyroch:

- WordPress 6.4.2
- téma Astra (zadarmo), predvolená konfigurácia
- 12 pluginov (Yoast SEO, Contact Form 7, WooCommerce, Cookie Notice a ďalších 8 typických)
- 50 produktov, 20 blogových článkov, 4 stránky
- PHP 8.2, MySQL 8 (kde to bolo dostupné)
- plugin na page cache: LiteSpeed Cache (kde bol podporovaný) alebo WP Super Cache
- žiadny CDN — testujem výkon samotného origin servera

Testovacia metodika:

- **TTFB:** 50 requestov cez `curl -w "@curl-format.txt" -o /dev/null -s` z dvoch lokácií (Bratislava cez UPC fiber, Praha cez Vodafone). Medián.
- **Zvládanie špičky:** Apache Benchmark: `ab -c 50 -n 500 https://test.tld/` — 500 requestov pri 50 súbežných používateľoch. Sledujem requesty za sekundu a fail rate.
- **PageSpeed mobile:** 3 spustenia, medián.
- **Reálny load test:** scenár v k6.io, 100 virtuálnych používateľov s nábehom cez 5 min, potom 10 min ustálenej záťaže.

## Štyri hostingy v teste

### 1. WebSupport Standard (7,99 EUR/mes)

Klasický zdieľaný hosting. Server LiteSpeed, PHP 8.2, NVMe disk. Denné zálohy, SSL zadarmo, štandardná slovenská podpora.

- TTFB Bratislava (cached): **62 ms**
- TTFB Bratislava (uncached): **480 ms**
- TTFB Praha: **75 ms**
- ab 50 súbežných: **142 req/s**, 0 % fail
- k6 100 VU: stabilný, p95 odozva 280 ms
- PageSpeed mobile: 78

**Verdikt:** prekvapivo dobré. Pre 90 % stránok malých firiem to stačí. LiteSpeed cache je zlom — cached TTFB je porovnateľné s drahšími variantmi. Limitom je zvládanie špičky — pri 100+ súbežných používateľoch to začne mať problém.

### 2. WebSupport Cloud (24,90 EUR/mes)

Managed cloud so 4 GB RAM, 4 vCPU a vyhradenými zdrojmi. LiteSpeed Enterprise, Redis dostupný cez podporu na požiadanie, PHP 8.3.

- TTFB Bratislava (cached): **28 ms**
- TTFB Bratislava (uncached): **210 ms**
- TTFB Praha: **48 ms**
- ab 50 súbežných: **380 req/s**, 0 % fail
- k6 100 VU: pohoda, p95 odozva 95 ms
- PageSpeed mobile: 88

**Verdikt:** ideálna voľba pre eshop nad ~30k MAU. Výrazne lepšie zvládanie špičky, predvídateľný výkon, vyhradené zdroje. Reálny prínos oproti zdieľanému hostingu: konzistentnosť — žiadne spomalenia od „hlučných susedov“.

### 3. Forpsi Linux (4,20 EUR/mes)

Český zdieľaný hosting. Apache 2.4 (nie LiteSpeed!), PHP 8.1, klasické SATA SSD. Cena je výborná, ale…

- TTFB Bratislava (cached): **180 ms** (s WP Super Cache)
- TTFB Bratislava (uncached): **920 ms**
- TTFB Praha: **140 ms**
- ab 50 súbežných: **45 req/s**, 12 % fail rate (!)
- k6 100 VU: spadol na 60 VU — server začal vracať 503
- PageSpeed mobile: 54

**Verdikt:** lacné, ale ozaj to cítiť. Apache + klasická page cache = fakticky 3× pomalšie. Pri záťažovej špičke fail rate stúpne nepríjemne. Pre statickú vizitku OK, pre eshop alebo obsahový web katastrofa. **Neoplatí sa.**

### 4. Hostimul Premium (9,50 EUR/mes)

Slovenský zdieľaný hosting, LiteSpeed, PHP 8.2, NVMe. Marketing tvrdí „až 10× rýchlejší ako konkurencia“. Realita:

- TTFB Bratislava (cached): **70 ms**
- TTFB Bratislava (uncached): **520 ms**
- TTFB Praha: **95 ms**
- ab 50 súbežných: **165 req/s**, 0 % fail
- k6 100 VU: stabilný, p95 odozva 240 ms
- PageSpeed mobile: 80

**Verdikt:** porovnateľný s WebSupport Standard, mierne lepší v uncached, mierne horší TTFB do Prahy. Pre výhradne slovenské publikum podobná voľba. „10× rýchlejší“ je marketing — reálne 1,05× v prospech.

## Tabuľka: head-to-head

| | WebSupport Std | WS Cloud | Forpsi | Hostimul |
|---|---|---|---|---|
| Cena/mes | 7,99 € | 24,90 € | 4,20 € | 9,50 € |
| TTFB BA cached | 62 ms | 28 ms | 180 ms | 70 ms |
| TTFB BA uncached | 480 ms | 210 ms | 920 ms | 520 ms |
| ab 50c req/s | 142 | 380 | 45 | 165 |
| k6 100 VU | OK | OK | FAIL | OK |
| PageSpeed mobile | 78 | 88 | 54 | 80 |
| LiteSpeed | Áno | Áno | Nie | Áno |
| Redis dostupný | V pláne | Áno | Nie | Nie |

## Kedy ísť na čo

**Statická vizitka, blog, malá firma (< 5k MAU):**
WebSupport Standard, Hostimul. Kľúčové je mať LiteSpeed (kvôli zabudovanej page cache). Vyhni sa Forpsi a iným zdieľaným hostingom len na Apache — zvládanie špičky je problém aj pri malých weboch.

**Eshop alebo obsahový web (5k – 50k MAU):**
WebSupport Cloud (25 EUR/mes). Vyhradené zdroje eliminujú efekt hlučného suseda, Redis cez podporu. Pri [Core Web Vitals rozhoduje konzistentné TTFB](/blog/cwv-eshop-priorita/) — a TTFB sa dá stlačiť aj [cez cache, edge a prefetch](/blog/server-response-200ms/), nielen výberom drahšieho hostingu.

**Eshop s vysokou návštevnosťou (50k+ MAU) alebo špecifický stack:**
VPS — Hetzner CX22 (5,83 EUR/mes, 2 vCPU, 4 GB RAM, Falkenstein) alebo Linode 4 GB (20 EUR/mes, viacero lokácií). Self-managed, ale máš kontrolu nad nginxom, ladením PHP-FPM, konfiguráciou MySQL a Redisom. TTFB pod 30 ms, zvládanie špičky 1000+ req/s. Nie je to pre začiatočníka vo WordPresse — treba zručnosti v správe servera alebo managed službu.

## VPS zostava, ktorú reálne používam

Pre klientov nad 50k MAU:

- **Hetzner CX22** (5,83 EUR/mes) — základný server, Ubuntu 24.04 LTS
- **Cloudflare Free** — DNS, edge cache, ochrana proti DDoS
- **CloudPanel** — admin panel zadarmo, pre managed PHP lepší ako cPanel
- nginx + PHP-FPM 8.3 + MariaDB 11 + Redis
- automatické obnovovanie SSL cez CloudPanel (Let's Encrypt)
- nočné zálohy na externé úložisko kompatibilné s S3 (Hetzner Storage Box, 3,20 EUR/mes za 1 TB)

Celková cena: **~10 EUR/mes** (server + úložisko). Výkon ďaleko nad WebSupport Cloud (25 EUR/mes). Háčik: musíš to vedieť spravovať alebo si zaplatiť niekoho, kto to vie. Ja spravujem niekoľko klientskych VPS-iek za managed fee 30 – 50 EUR/mes.

## Náklady vs ROI

Úplne úprimne: rozdiel medzi hostingom za 5 EUR a hostingom za 25 EUR môže byť rozdielom medzi PageSpeed 54 a 88. Pri eshope s konverziou 2 % a priemernou objednávkou 60 EUR **20-bodový nárast PageSpeed reálne zvýši konverziu o 8 – 15 %**. Pri 5000 návštevách za mesiac to je 80 – 150 objednávok navyše = 4 800 – 9 000 EUR/mes.

Šetriť na hostingu pri eshope sú peniaze hodené z okna. Šetriť pri portfóliovom webe s 200 návštevami za mesiac je naopak rozumné.

## TL;DR

- **WebSupport Standard / Hostimul** (8 – 10 EUR) — malé firmy, blog, vizitka. LiteSpeed je nutnosť.
- **WebSupport Cloud** (25 EUR) — eshop, obsahový web, stredná návštevnosť. Rozhoduje zvládanie špičky.
- **Hetzner VPS + CloudPanel** (10 EUR self-managed alebo 40 EUR managed) — vysoká návštevnosť, špecifické požiadavky, plná kontrola.
- **Forpsi a podobné zdieľané Apache hostingy za 4 EUR** — vyhni sa, ekonomika nesedí. 4 EUR ušetríš, 40 EUR stratíš na konverzii.

Súvisiace: [Vercel vs Cloudflare Pages vs vlastný node](/blog/vercel-vs-cloudflare-vs-vps/) · [Server response time pod 200 ms](/blog/server-response-200ms/) · [Core Web Vitals na eshope](/blog/cwv-eshop-priorita/)
