---
title: "Headless Woo + Next.js: kedy sa to oplatí (a kedy nie)"
date: 2026-02-14
read: 8
tags: ["WooCommerce", "Next.js", "Headless"]
excerpt: "Headless WooCommerce s Next.js znie sexy, ale stojí 3x viac ako natívny eshop. Decision matrix podľa 4 osí, kedy to dáva zmysel."
featured: true
---

Pred mesiacom sa ma pýtal klient, či mu mám prerobiť WooCommerce eshop s 800 produktmi na headless Next.js setup. Pozrel som mu Analytics, traffic 12k MAU, vlastný malý dev tím o jednom človeku. Povedal som **nie**. Tu je matrix podľa ktorého sa rozhodujem.

## Os 1: Počet produktov

| Produkty | Odporúčanie |
|---|---|
| < 500 | Woo native, Astro frontend ak chceš rýchlosť |
| 500–5000 | Woo s caching plugin (Redis Object Cache + WP Rocket) |
| 5000–20000 | Hybrid — Woo backend, statické PLP cez ISR |
| > 20000 | Headless začne dávať reálny zmysel |

Prečo? **Database queries pri PLP** rastú exponenciálne s počtom atribútov. Pod 5000 produktov vieš MySQL utiahnuť composite indexmi (písal som o tom v inom článku). Nad to už potrebuješ search engine alebo statickú generáciu.

## Os 2: Mesačný traffic

| Traffic | Odporúčanie |
|---|---|
| < 30k MAU | Woo s Redis cache stačí, ROI z headless je záporný |
| 30k–100k | Headless začne mať zmysel, ak máš peak traffic |
| > 100k MAU | Headless takmer vždy zaplatí investíciu |

Edge cases: ak máš seasonal peaky (Black Friday 10x normálny traffic), headless ti zachráni infraštruktúru. PHP-FPM pri 1000 concurrent requests upadne, statický Next na CDN to znesie bez mihnutia oka.

## Os 3: Tím a skills

Toto je faktor, ktorý ľudia podceňujú:

- **1 dev, PHP background** → Woo. Headless ho zabije. WooCommerce má 12 rokov dokumentácie, headless setup vyžaduje GraphQL, Next.js, deployment pipeline, environment management, ISR debugging.
- **2-3 devs, mix PHP + JS** → Hybrid alebo Woo s React frontendom (Storefront API).
- **3+ devs, React/TypeScript** → Headless je ich domov. Idú rýchlejšie ako v PHP.

Ak je hlavný developer na projekte WordPress/PHP, headless ti reálne **spomalí** vývoj o 30-50 %, lebo musí riešiť problémy, ktoré v PHP nikdy nemal (CORS, SSR/CSR boundaries, hydration, cache invalidation).

## Os 4: Plánovaná customizácia

Otázka: **Čo budeš na frontende robiť, čo Woo natívne nezvládne?**

- **Basic eshop** (kategórie, produkty, košík, checkout) → Woo to robí 12 rokov, načo si komplikovať život.
- **Multi-channel** (web + mobile app + kiosk + B2B portal) → Headless dáva jeden API zdroj pre všetky.
- **Custom checkout flow** (3-step wizard, AR try-on, configurator) → Headless ti dá flexibility.
- **Heavy personalizácia** (different homepage per segment, A/B testing infraštruktúra) → Headless je výhodný, ale dá sa aj vo Woo.

## Cenovka

Reálne čísla z mojich projektov:

- **WooCommerce native** (nový eshop, design + dev): **€4 000 – €7 000**.
- **WooCommerce native s custom theme + perf optimalizácia**: **€7 000 – €12 000**.
- **Headless WooCommerce + Next.js**: **€15 000 – €25 000**, plus **€20-50/mes hosting** (Vercel/CF/VPS).

Maintenance je tiež jiná pesnička:

- Woo native: WP plugin updates, cca 2-4 hodiny/mesiac.
- Headless: deployment monitoring, dependency updates v Next.js (každé 2 mesiace major), API verzionovanie. **6-10 hodín/mesiac.**

## Decision tree v praxi

```text
Máš > 5000 produktov A > 30k MAU?
  ├─ Áno → Pokračuj
  └─ Nie → Stop, použiť Woo native
Máš tím s React/TS skills?
  ├─ Áno → Pokračuj
  └─ Nie → Stop, použiť Woo native (alebo najať)
Plánuješ multi-channel ALEBO heavy custom UX?
  ├─ Áno → Headless dáva zmysel, choď do toho
  └─ Nie → Stop, headless je overkill
Máš budget €15k+ a 6+ týždňov?
  ├─ Áno → Headless je dobrá voľba
  └─ Nie → Woo native s perf optimalizáciou
```

## Prečo som klientovi povedal NIE

Spomenutý klient s 800 produktmi:

- Produkty: 800 → Os 1 hovorí "Woo native".
- Traffic: 12k MAU → Os 2 hovorí "Woo native".
- Tím: 1 dev, PHP-only → Os 3 hovorí "Woo native".
- Customizácia: štandardný eshop, žiadny multi-channel → Os 4 hovorí "Woo native".

**4 zo 4 osí proti.** Headless by stál 3x viac, vyžadoval by si nový tím alebo ich zaškolenie, a nepriniesol by user-perceivable benefit. Klient by pália €18 000 na to, aby mal "modernejší stack". To nie je business case, to je marketingová póza.

## Kedy som naopak povedal ÁNO

Iný klient: 14 000 produktov, 180k MAU, 4-členný React tím, plánovaná mobile aplikácia + B2B portál cez rovnaké API. Tu **headless nebol voľba, bola to nutnosť**. Šiel naň aj napriek vyššej cene, lebo všetky 4 osi ukazovali rovnakým smerom.

## TL;DR

Headless WooCommerce + Next.js nie je default voľba. Je to investícia, ktorá sa oplatí, keď máš veľa produktov, veľa traffic-u, schopný tím a reálnu customizáciu. Ak ti chýba aspoň jedna z týchto štyroch vecí, ostaň na Woo native a daj peniaze do CWV optimalizácie. Bude ti za to konverzia oveľa vďačnejšia.
