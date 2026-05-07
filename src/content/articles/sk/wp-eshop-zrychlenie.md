---
title: "Ako som zrýchlil WP eshop z 4s na 0.9s"
date: 2026-04-15
read: 8
tags: ["Performance", "WordPress", "WooCommerce"]
excerpt: "Audit, ktorý odhalil tri skryté kvety a jeden zbytočný kvíz. Rozpis konkrétnych krokov, čísel a omylov."
featured: true
---

## Východisko: 3.8s LCP a panika

Klient ma volal v stredu pred Vianocami. Eshop padá, košík sa nedá dokončiť, mobil zobrazí prázdnu stránku 4 sekundy. Otvoril som Search Console — Core Web Vitals červené v 78 % URL.

Začal som meraním, nie kódom. WebPageTest z BA, mobile 4G, throttling. Tri runy, medián. To je číslo, ktoré nás zaujíma.

## Tri skryté kvety

Plugin „Pretty WhatsApp Button" načítaval celé Tailwind CDN. 280 kB CSS pre jedno tlačidlo. Vyhodil som, napísal 30 riadkov vlastných.

Druhý — staré galérie cez Slick.js. Tri kópie jQuery v DOM. Slick som nahradil natívnym CSS scroll-snap, jQuery zmizol.

Tretí — produktové fotky cez Cloudinary, ale bez `f_auto`. Servovali sa JPG namiesto AVIF/WebP. Jedna úprava URL šablóny — 60 % menej bytov.

## Cache a CDN

WP Rocket vypol, lebo robil viac škody než osohu (TTI sa hýbal kvôli defer JS). Namiesto toho čistý Cloudflare cache rule pre HTML s `Cache-Control: s-maxage=300, stale-while-revalidate=86400`.

Statika ide cez Cloudflare s `cache everything`, dynamické endpointy bypass.

## Výsledok

LCP mobil 0.9s, desktop 0.4s. Tržby v Q1 +38 %. Klient teraz spí lepšie.

Najväčšie poučenie: 80 % výkonnostných problémov sú zlé pluginy. 15 % zlý cache. 5 % zvyšok.
