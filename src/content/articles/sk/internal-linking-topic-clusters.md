---
title: "Internal linking: topic clusters bez plugin-u"
date: 2025-10-12
read: 7
tags: ["SEO", "Process"]
excerpt: "Yoast Internal Linking ani Link Whisper ti nenahradia vlastnú hlavu. Manuálny topic cluster mapping pre 50–200 stránok je rýchlejší a presnejší než plugin guesswork."
featured: false
---

Plugin "Internal Linking" v Yoaste alebo Link Whisper ti odporučí linky na základe slovných zhôd. Funguje to ako Ctrl+F s lepším UI. Pre malý web (50–200 stránok) si tú prácu spravíš za 2 hodiny rukou a výsledok bude lepší — pretože plugin nevie, ktorá stránka je tvoja **pillar page** a ktorá je len doplnok.

## Prečo manuálny mapping vyhráva

Plugin nevie:

- Ktorý článok má najsilnejšie backlinky a má distribuovať PageRank ďalej
- Ktorá stránka konvertuje a zaslúži si interné linky z high-traffic obsahu
- Aký anchor text už nadužívaš (over-optimization)
- Aký je obchodný zámer ("buying intent" stránka vs. informational)

Plugin len matchne keyword. Keď máš 4 články o "Core Web Vitals", plugin ich začne navzájom linkovať dookola a tvoja pillar page sa stratí.

## Krok 1: Audit existujúceho contentu

Spravíš si jednoduchý spreadsheet — URL, titulok, primary keyword, typ (pillar / cluster / supporting), publikačný dátum, mesačné views z GA4 alebo Plausible.

Group by topic. Pre malý web hľadáš **3–5 hlavných tém**. Viac nemáš (a ak si myslíš že áno, asi nemáš). Príklad pre web freelance dev-a:

- Performance (LCP, INP, bundle size)
- WordPress (témy, plugin výber, security)
- Headless (Astro, Next.js, CMS)
- Process (cenotvorba, briefing, workflow)

Všetko ostatné je outlier — alebo ho zaradíš pod jednu z tém, alebo ho neoptimalizuješ.

## Krok 2: Pillar + cluster štruktúra

Pre každú tému jeden **pillar page** (2000+ slov, široký prehľad) a 5–10 **cluster článkov** (úzke, hĺbkové).

| Topic | Pillar page | Cluster (5–10 ks) |
|---|---|---|
| Performance | "Core Web Vitals: kompletný sprievodca" | LCP nad 2.5s, INP pod 200ms, CLS na mobile, image lazy loading, bundle audit |
| WordPress | "WordPress pre malú firmu 2026" | Theme výber, ACF vs MetaBox, multisite, migrácia bez výpadku |
| Headless | "Headless CMS: kedy áno a kedy nie" | Astro vs Next.js, Astro content collections, headless Woo, view transitions |

Linkovacia logika:

- Každý cluster článok linkuje **na pillar** (anchor = topic keyword variácia)
- Pillar linkuje **na všetky cluster články** (sekcia "súvisiace témy" alebo inline)
- Cluster články linkujú **medzi sebou** keď to dáva kontextový zmysel — nie nasilu

## Krok 3: Anchor text variácia

Toto je miesto, kde Link Whisper najviac kríva. Vždy ti odporučí exact match anchor (nudné, over-optimized). Google to vidí.

Zdravé rozdelenie pre cluster → pillar linky:

- **Exact match** (max 30 %): "Core Web Vitals", "WordPress pre malú firmu"
- **Partial match** (50 %): "ako optimalizovať Core Web Vitals", "návod na výber WordPress témy"
- **Branded / generic** (20 %): "v tomto návode", "podrobnejšie som písal tu", "kompletný sprievodca"

Generic anchory ("klikni sem", "viac tu") **nie sú zlé**. Dávajú Googlu signál, že linky robíš pre ľudí, nie pre algoritmus. Akurát ich nemiešaj viac než 10 %.

## Krok 4: Údržba — quarterly review

Každé 3 mesiace si na 60 minút sadneš a:

1. **Broken links**: spusti `wget --spider -r -nd -nv -l 5 https://tvoj-web.sk 2>&1 | grep -B1 "broken"` alebo Screaming Frog free tier do 500 URL.
2. **Nový content** integruj do mapy — kam linkuje, odkiaľ ho linkuješ.
3. **Orphaned pages**: stránky bez prichádzajúcich interných linkov. V Search Console → Links → Internal sa pozri ktorá má `0`. Tá je pre Google neviditeľná.
4. **Over-linked pillar**: ak má pillar > 50 prichádzajúcich interných linkov a tvoj web má 80 stránok, niečo si preháňaš.

## Reálny príklad: blog s 60 článkami

Klient mal 60 článkov, žiadny topic cluster. Z GSC chodilo ~800 organic návštev mesačne, hlavne na 3 článkoch (long-tail keywords trafili náhodou).

Po 6 týždňoch manuálnej reorganizácie:

- 4 pillar pages (každý dostal hĺbkový rewrite, +800 slov)
- 56 cluster článkov premapovaných (existujúci content, nepísal som nič nové)
- Linkovacia mapa v Notion-e (60 riadkov × čo linkuje kde)

Po 3 mesiacoch: **~2100 organic návštev**, pillar pages sa dostali na pozície 4–8 pre cieľové keywords. Bez nového obsahu, bez backlink building, len lepšou architektúrou.

## Tools, ktoré stačia

- **Notion / Google Sheets** — mapa
- **Screaming Frog (free do 500 URL)** — crawl, broken links
- **Search Console** — Links → Internal (orphan detection)
- **GA4 / Plausible** — page views, ktorá pillar zarába traffic

Žiadny SEO plugin za €99/rok. Naozaj.

## TL;DR

Pre 50–200 stránok je manuálny topic cluster mapping (pillar + 5–10 cluster článkov) presnejší než akýkoľvek plugin. 2 hodiny audit, 4 hodiny reorganizácia, kvartálny review. Anchor text variácia 30/50/20. Plugin si nechaj na weby s 5000+ stránkami, kde sa už neoplatí robiť to ručne.
