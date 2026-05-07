---
title: "Technické SEO checklist, ktorý ozaj merateľne pomáha"
date: 2025-09-22
read: 8
tags: ["SEO", "Performance"]
excerpt: "20 položiek vážených podľa Pareto. Čo prinesie 80 % efektu, čo je mid-impact a čo je premarketovaný šum."
featured: false
---

Audit SEO checklistov na internete je v 2026 hrozný — typicky 80 položiek, kde 60 z nich nehne ničím. Po desiatkach auditov rôznych SK/CZ webov mám zúžený zoznam podľa toho, **čo merateľne pohlo organickým trafficom v Search Console**.

Rozdelím to na High-impact (toto rieš ako prvé), Mid-impact (postupne) a Low-impact (premarketované, najmä v slovenských SEO blogoch).

## High-impact: 80 % efektu

### 1. Crawlability — robots.txt, sitemap, hreflang

Ak Google nevie, čo crawlovať, nič ostatné nepomôže. Skontroluj:

- `robots.txt` neblocuje to, čo má indexovať (častý fail: `Disallow: /wp-content/` blokne CSS/JS, čím zlyhá render check)
- `sitemap.xml` existuje a je v Search Console submitnutý
- Sitemap obsahuje len indexable URLs (nie 301-ky, 404, noindex stránky)
- `hreflang` ak máš multilang — `<link rel="alternate" hreflang="sk-SK">` aj recipročne

Audit: Search Console → Pages → "Why pages aren't indexed". Najčastejšie príčiny: "Discovered – currently not indexed" (Google nemá kapacitu / signál slabý) alebo "Crawled – not indexed" (kvalita).

### 2. Core Web Vitals — LCP, INP

V 2026 sú CWV potvrdený ranking signal pre mobile. Cieľ:

- **LCP < 2.5s** (Largest Contentful Paint)
- **INP < 200ms** (Interaction to Next Paint, nahradilo FID v 2024)
- **CLS < 0.1** (Cumulative Layout Shift)

Search Console → Core Web Vitals report ti to ukáže field data. **Nie lab data z Lighthouse** — field data sú real users.

Pre WordPress eshop ktorý sme tento rok ladil: LCP 4.2s → 1.6s, organic traffic +28 % za 6 týždňov. Korelácia, nie kauzalita, ale paterny vidíme stále.

### 3. Structured data — Product, BreadcrumbList, Organization

JSON-LD schema pre eshop = rich results v SERPe = vyšší CTR. Minimum:

- `Product` s `Offer`, `AggregateRating`, `Review` (na product detail)
- `BreadcrumbList` (na všetkých stránkach okrem homepage)
- `Organization` (homepage)

Validácia: `validator.schema.org` + Google Rich Results Test. Search Console → Enhancements ti ukáže, či to Google parsuje.

### 4. Canonical URLs

Bez canonicals máš duplicity. WooCommerce produktov + filter URLs (`?orderby=price&min_price=10`) = tisíce duplicitných stránok ak nemáš canonical.

```html
<link rel="canonical" href="https://example.sk/produkty/kosela-modra/">
```

V Yoast SEO sa nastaví per-page-type. Skontroluj cez Search Console → Pages → Indexed: či sa neindexuje 5× ten istý produkt s rôznymi query params.

### 5. Title + meta description quality

Stále podceňované. Title je strongest on-page signal po obsahu. Meta description neovplyvňuje ranking priamo, ale CTR — a CTR je signal.

Pravidlá:
- Title: 50-60 znakov, primary keyword vľavo, brand vpravo
- Meta description: 140-160 znakov, hodnotová propozícia, mäkký CTA
- Unikátny per stránka (Search Console upozorní na duplicity)

## Mid-impact: postupne dorobiť

### 6. Internal linking

Linkuj v body texte (nie len menu) na related stránky. Anchor text je signal. Pre eshop: z blog článku linkuj na produktové kategórie. Pre service business: z homepage linkuj na všetky core service pages.

Audit: Screaming Frog → Internal links report. Stránky s 0-1 internal links sú "orphan" — Google ich možno necrawluje často.

### 7. Image alt + filename

`alt` atribút je accessibility + SEO signal. Filename `IMG_4521.jpg` je horší než `cervena-kosela-pansky-bavlnena.jpg`. Pre eshop s tisíckami obrázkov [pozri AI alt text článok](/sk/blog/ai-alt-text-seo).

### 8. Header hierarchy

Jeden `<h1>` per stránka. `<h2>`, `<h3>` v poriadku. Nie kvôli "Google to číta" (de facto váha minimálna), ale kvôli accessibility a štruktúre, ktorú Google pri parse extrakuje.

### 9. HTTPS + HSTS

V 2026 baseline. Žiadny https = no-go. HSTS header (`Strict-Transport-Security`) zabezpečí, že redirect z http je riešený na klientovi.

### 10. Mobile-friendly

Google indexes mobile-first od 2019. Test: Search Console → Mobile Usability. Najčastejší fail: text < 12px, click targets < 44px, viewport meta chýba.

## Low-impact: premarketované

### 11. Keyword density

Mýtus. V 2026 Google používa semantic understanding, nie counting. Píš prirodzene, použij synonymá, kontext > opakovanie. "Optimize for keyword density" je rada z roku 2012.

### 12. Exact match anchor texts

Naopak — over-optimized anchor texty (každý link má presne "lacné kosele Bratislava") sú spam signal. Mix natural anchor texts.

### 13. Schema markup beyond basics

`HowTo`, `FAQ`, `Recipe`, `Course`... áno, niekedy pomôžu. Ale často iba pridajú complexity bez merateľného benefitu. Sústreď sa na 5 core schemas (Product, BreadcrumbList, Organization, WebSite, LocalBusiness).

### 14. Meta keywords tag

Google to ignoruje od 2009. Bing tiež. Strata času.

### 15. XML sitemap priority + changefreq

Google ich [oficiálne ignoruje](https://developers.google.com/search/blog/2014/10/best-practices-for-xml-sitemaps-rssatom) pri prioritizovaní crawlu. Default values sú OK.

## Audit nástroje (2026)

| Tool | Cena | Use case |
|---|---|---|
| **Google Search Console** | free | baseline, must-have |
| **PageSpeed Insights** | free | CWV check |
| **Screaming Frog** | $259/rok (free do 500 URL) | technical crawl |
| **Ahrefs** | $129/mes Lite | competitor analysis, backlinks |
| **Sitebulb** | $13.50/mes | alternative crawler s lepším UI |
| **Bing Webmaster Tools** | free | občas zachytí veci, ktoré GSC nezobrazí |

Začni so Search Console. 80 % insights je tam zadarmo.

## Reálny audit flow (1 hodina pre malý web)

1. Search Console → Coverage report → fix indexing issues
2. PageSpeed Insights pre top 5 URL → CWV scores
3. Screaming Frog crawl → broken links, missing titles, duplicate content
4. Spot-check 10 produktov → schema validation
5. Search Console → Performance → identifikuj queries kde si na pozícii 8-15 (low-hanging fruit pre on-page tweaks)

## TL;DR

Z 80 položiek SEO checklistu reálne hýbu trafficom 5: crawlability, CWV, structured data, canonicals, titles + descriptions. Ak máš tieto v poriadku, riešiš mid-impact tier. Low-impact (keyword density, meta keywords, exotické schemas) ignoruj — tam je strata času. Audit cez Search Console (free) ti pre 80 % SK/CZ webov stačí.
