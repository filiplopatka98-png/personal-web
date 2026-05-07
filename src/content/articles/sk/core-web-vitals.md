---
title: "Core Web Vitals pre malé biznisy"
date: 2026-01-15
read: 6
tags: ["SEO", "Performance", "Beginner"]
excerpt: "Čo sú CWV, prečo sa o ne starať aj keď nemáš milión návštev mesačne, a tri rýchle kroky."
featured: false
---

## Core Web what?

Tri metriky od Google: LCP (ako rýchlo sa načíta hlavný obsah), INP (ako rýchlo reaguje na klik), CLS (či sa stránka neskáče počas nahrávania).

Ovplyvňujú SEO ranking. A čo je dôležitejšie — ovplyvňujú konverziu. Pomalá stránka = ľudia odídu.

## Tri rýchle kroky

### 1. Zapni image lazy loading

WordPress to robí od verzie 5.5 automaticky pre obrázky pod fold. Skontroluj `loading="lazy"` v HTML. Ak chýba, máš plugin, ktorý to vypína.

### 2. Vyhoď zbytočné pluginy

Otvor admin → Plugins. Spočítaj koľko ich máš. Ak >15, pravdepodobne je čas upratať. Každý plugin = potenciálny script v HTML.

### 3. Použi cache

WP Rocket alebo W3 Total Cache. Alebo radšej Cloudflare na DNS úrovni — robí 80 % roboty zadarmo.

## Ako merať

PageSpeed Insights (pagespeed.web.dev) ti povie čo opraviť. Search Console ti povie ako sa to vyvíja v čase. Sleduj oba.
