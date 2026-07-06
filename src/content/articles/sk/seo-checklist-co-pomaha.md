---
title: "Technické SEO checklist, ktorý ozaj merateľne pomáha"
date: 2025-09-22
read: 8
tags: ["SEO", "Performance"]
excerpt: "20 položiek vážených podľa Pareto princípu. Čo prinesie 80 % efektu, čo má stredný dosah a čo je premarketovaný šum."
featured: false
---

Väčšina SEO checklistov na internete je v roku 2026 hrozná — typicky 80 položiek, z ktorých 60 nepohne ničím. Po desiatkach auditov rôznych SK/CZ webov mám zúžený zoznam podľa toho, **čo merateľne pohlo organickým trafficom v Search Console**.

Rozdelím to na high-impact (toto rieš ako prvé), mid-impact (postupne) a low-impact (premarketované, najmä v slovenských SEO blogoch).

## High-impact: 80 % efektu

### 1. Crawlovateľnosť — robots.txt, sitemap, hreflang

Ak Google nevie, čo má crawlovať, nič ostatné nepomôže. Skontroluj:

- `robots.txt` neblokuje to, čo má indexovať (častý fail: `Disallow: /wp-content/` zablokuje CSS/JS, čím zlyhá kontrola renderu)
- `sitemap.xml` existuje a je odoslaná v Search Console
- sitemap obsahuje len indexovateľné URL (nie 301-ky, 404, noindex stránky)
- `hreflang` ak máš viac jazykov — `<link rel="alternate" hreflang="sk-SK">`, a to recipročne

Audit: Search Console → Pages → „Why pages aren't indexed". Najčastejšie príčiny: „Discovered – currently not indexed" (Google nemá kapacitu alebo je signál slabý) alebo „Crawled – not indexed" (kvalita).

### 2. Core Web Vitals — LCP, INP

V roku 2026 sú CWV potvrdený ranking signál pre mobil. Cieľ:

- **LCP < 2,5 s** (Largest Contentful Paint)
- **INP < 200 ms** (Interaction to Next Paint, nahradilo FID v marci 2024)
- **CLS < 0,1** (Cumulative Layout Shift)

Search Console → Core Web Vitals report ti ukáže field data. **Nie lab data z Lighthouse** — field data sú od reálnych používateľov. (Pozn.: prahy platia na 75. percentile, čiže „dobré" skóre musíš dosiahnuť pre 75 % návštev.)

Pre WordPress eshop, ktorý sme tento rok ladili: LCP 4,2 s → 1,6 s, organic traffic +28 % za 6 týždňov. Korelácia, nie kauzalita, ale vzorec vidíme stále.

### 3. Štruktúrované dáta — Product, BreadcrumbList, Organization

JSON-LD schema pre eshop = rich results v SERP-e = vyšší CTR. Minimum:

- `Product` s `Offer`, `AggregateRating`, `Review` (na detaile produktu)
- `BreadcrumbList` (na všetkých stránkach okrem homepage)
- `Organization` (homepage)

Validácia: `validator.schema.org` + Google Rich Results Test. Search Console → Enhancements ti ukáže, či to Google parsuje.

### 4. Kanonické URL

Bez canonicals máš duplicity. Produkty vo WooCommerce + filtračné URL (`?orderby=price&min_price=10`) = tisíce duplicitných stránok, ak nemáš canonical.

```html
<link rel="canonical" href="https://example.sk/produkty/kosela-modra/">
```

V Yoast SEO sa nastaví per typ stránky. Skontroluj cez Search Console → Pages → Indexed, či sa neindexuje päťkrát ten istý produkt s rôznymi query parametrami.

### 5. Kvalita titulku a meta popisu

Stále podceňované. Titulok je najsilnejší on-page signál hneď po obsahu. Meta popis neovplyvňuje ranking priamo, ale CTR — a CTR je signál.

Pravidlá:
- titulok: 50 – 60 znakov, hlavný keyword vľavo, brand vpravo
- meta popis: 140 – 160 znakov, hodnotová propozícia, mäkký CTA
- unikátny pre každú stránku (Search Console upozorní na duplicity)

## Mid-impact: postupne dorobiť

### 6. Interné prelinkovanie

Linkuj v tele textu (nielen v menu) na súvisiace stránky. Anchor text je signál. Pre eshop: z blogového článku linkuj na produktové kategórie. Pre service business: z homepage linkuj na všetky kľúčové service pages.

Audit: Screaming Frog → Internal links report. Stránky s 0 – 1 internými odkazmi sú „orphan" — Google ich možno necrawluje často.

### 7. Alt a názov súboru obrázka

Atribút `alt` je signál pre prístupnosť aj SEO. Názov súboru `IMG_4521.jpg` je horší než `cervena-kosela-pansky-bavlnena.jpg`. Pre eshop s tisíckami obrázkov [pozri článok o AI alt textoch](/sk/blog/ai-alt-text-seo).

### 8. Hierarchia nadpisov

Jeden `<h1>` na stránku. `<h2>`, `<h3>` v poriadku. Nie kvôli tomu, že „to Google číta" (de facto minimálna váha), ale kvôli prístupnosti a štruktúre, ktorú si Google pri parsovaní vytiahne.

### 9. HTTPS + HSTS

V roku 2026 baseline. Žiadne https = no-go. Hlavička HSTS (`Strict-Transport-Security`) zabezpečí, že presmerovanie z http vyrieši prehliadač.

### 10. Prívetivosť pre mobil

Google indexuje mobile-first už od roku 2019. Test: Search Console → Mobile Usability. Najčastejšie faily: text pod 12 px, klikacie ciele pod 44 px, chýbajúci viewport meta.

## Low-impact: premarketované

### 11. Hustota kľúčových slov

Mýtus. V roku 2026 Google používa sémantické porozumenie, nie počítanie. Píš prirodzene, používaj synonymá, kontext > opakovanie. „Optimalizuj na keyword density" je rada z roku 2012.

### 12. Presné anchor texty

Naopak — príliš optimalizované anchor texty (každý odkaz má presne „lacné košele Bratislava") sú spam signál. Miešaj prirodzené anchor texty.

### 13. Schema markup nad rámec základov

`HowTo`, `FAQ`, `Recipe`, `Course`... áno, niekedy pomôžu. Ale často iba pridajú komplexitu bez merateľného prínosu. Sústreď sa na 5 kľúčových schém (Product, BreadcrumbList, Organization, WebSite, LocalBusiness).

### 14. Meta keywords tag

Google ho ignoruje od roku 2009. Bing tiež. Strata času.

### 15. Priority + changefreq v XML sitemap

Google ich [oficiálne ignoruje](https://developers.google.com/search/blog/2014/10/best-practices-for-xml-sitemaps-rssatom) pri prioritizovaní crawlu (spolieha sa na `lastmod`). Predvolené hodnoty sú v pohode.

## Audit nástroje (2026)

| Nástroj | Cena | Použitie |
|---|---|---|
| **Google Search Console** | zdarma | baseline, must-have |
| **PageSpeed Insights** | zdarma | kontrola CWV |
| **Screaming Frog** | 245 EUR/rok (zdarma do 500 URL) | technický crawl |
| **Ahrefs** | 129 USD/mes Lite | analýza konkurencie, backlinky |
| **Sitebulb** | 13,50 USD/mes | alternatívny crawler s lepším UI |
| **Bing Webmaster Tools** | zdarma | občas zachytí veci, ktoré GSC nezobrazí |

Začni so Search Console. 80 % insightov je tam zadarmo.

## Reálny audit flow (1 hodina pre malý web)

1. Search Console → Coverage report → oprav problémy s indexovaním
2. PageSpeed Insights pre top 5 URL → skóre CWV
3. Screaming Frog crawl → broken linky, chýbajúce titulky, duplicitný obsah
4. Spot-check 10 produktov → validácia schémy
5. Search Console → Performance → identifikuj queries, kde si na pozícii 8 – 15 (low-hanging fruit pre on-page tweaky)

## TL;DR

Z 80 položiek SEO checklistu reálne hýbe trafficom 5: crawlovateľnosť, CWV, štruktúrované dáta, canonicals, titulky + popisy. Ak máš tieto v poriadku, rieš mid-impact tier. Low-impact (hustota kľúčových slov, meta keywords, exotické schémy) ignoruj — tam je strata času. Audit cez Search Console (zdarma) ti pre 80 % SK/CZ webov stačí.
