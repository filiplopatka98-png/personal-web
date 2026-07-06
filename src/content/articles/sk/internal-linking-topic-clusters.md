---
title: "Internal linking: topic clusters bez plugin-u"
date: 2025-10-12
read: 7
tags: ["SEO", "Process"]
excerpt: "Yoast Internal Linking ani Link Whisper ti nenahradia vlastnú hlavu. Pri malom webe (50–200 stránok) je manuálny topic cluster mapping rýchlejší aj presnejší než hádanie od pluginu."
featured: false
---

Plugin „Internal Linking“ v Yoaste alebo Link Whisper ti odporučí linky na základe slovných zhôd. Funguje to ako Ctrl+F s krajším rozhraním. Pri malom webe (50–200 stránok) si tú prácu spravíš za 2 hodiny rukou a výsledok bude lepší — pretože plugin nevie, ktorá stránka je tvoja **pillar page** a ktorá je len doplnok.

## Prečo manuálny mapping vyhráva

Plugin nevie:

- Ktorý článok má najsilnejšie backlinky a mal by distribuovať PageRank ďalej
- Ktorá stránka konvertuje a zaslúži si interné linky z obsahu s vysokou návštevnosťou
- Ktorý anchor text už nadužívaš (over-optimization)
- Aký je obchodný zámer stránky (nákupný úmysel vs. informačná)

Plugin len matchne kľúčové slovo. Keď máš 4 články o „Core Web Vitals“, plugin ich začne navzájom prelinkovávať dookola a tvoja pillar page sa v tom stratí.

## Krok 1: Audit existujúceho obsahu

Spravíš si jednoduchý spreadsheet — URL, titulok, primárne kľúčové slovo, typ (pillar / cluster / supporting), dátum publikácie, mesačné návštevy z GA4 alebo Plausible.

Zoskup podľa témy. Pri malom webe hľadáš **3–5 hlavných tém**. Viac nemáš (a ak si myslíš, že áno, asi nemáš). Príklad pre web freelance dev-a:

- Performance (LCP, INP, bundle size)
- WordPress (témy, výber pluginov, security)
- Headless (Astro, Next.js, CMS)
- Process (cenotvorba, briefing, workflow)

Všetko ostatné je outlier — buď ho zaradíš pod jednu z tém, alebo ho neoptimalizuješ.

## Krok 2: Štruktúra pillar + cluster

Pre každú tému jeden **pillar page** (2000+ slov, široký prehľad) a 5–10 **cluster článkov** (úzke, do hĺbky).

| Téma | Pillar page | Cluster (5–10 ks) |
|---|---|---|
| Performance | „Core Web Vitals: kompletný sprievodca“ | LCP nad 2,5 s, INP nad 200 ms, CLS na mobile, image lazy loading, bundle audit |
| WordPress | „WordPress pre malú firmu 2026“ | výber témy, ACF vs MetaBox, multisite, migrácia bez výpadku |
| Headless | „Headless CMS: kedy áno a kedy nie“ | Astro vs Next.js, Astro content collections, headless Woo, view transitions |

Linkovacia logika:

- Každý cluster článok linkuje **na pillar** (anchor = variácia témového kľúčového slova)
- Pillar linkuje **na všetky cluster články** (sekcia „súvisiace témy“ alebo inline)
- Cluster články linkujú **medzi sebou**, keď to dáva kontextový zmysel — nie nasilu

## Krok 3: Variácia anchor textu

Toto je miesto, kde Link Whisper najviac kríva. Vždy ti odporučí exact match anchor (nudné, over-optimized). Google to vidí.

Zdravé rozdelenie pre linky cluster → pillar:

- **Exact match** (max 30 %): „Core Web Vitals“, „WordPress pre malú firmu“
- **Partial match** (50 %): „ako optimalizovať Core Web Vitals“, „návod na výber WordPress témy“
- **Branded / generic** (20 %): „v tomto návode“, „podrobnejšie som písal tu“, „kompletný sprievodca“

Generické anchory („klikni sem“, „viac tu“) **nie sú zlé**. Dávajú Googlu signál, že linky robíš pre ľudí, nie pre algoritmus. Len ich nemiešaj viac než 10 %.

## Krok 4: Údržba — kvartálny review

Každé 3 mesiace si na 60 minút sadneš a:

1. **Broken links**: spusti `wget --spider -r -nd -nv -l 5 https://tvoj-web.sk 2>&1 | grep -B1 "broken"` alebo Screaming Frog vo free verzii do 500 URL.
2. **Nový obsah** integruj do mapy — kam linkuje, odkiaľ ho linkuješ.
3. **Orphaned pages**: stránky bez prichádzajúcich interných linkov. V Search Console → Links → Internal (Odkazy → Interné odkazy) sa pozri, ktorá dôležitá stránka v zozname chýba alebo má najmenej odkazov. Tá je pre Google prakticky neviditeľná.
4. **Over-linked pillar**: ak má pillar viac než 50 prichádzajúcich interných linkov a tvoj web má 80 stránok, niečo si preháňaš.

## Reálny príklad: blog so 60 článkami

Klient mal 60 článkov, žiadny topic cluster. Z GSC chodilo ~800 organic návštev mesačne, hlavne na 3 článkoch (long-tail keywords trafili náhodou).

Po 6 týždňoch manuálnej reorganizácie:

- 4 pillar pages (každý dostal hĺbkový rewrite, +800 slov)
- 56 cluster článkov premapovaných (existujúci obsah, nepísal som nič nové)
- Linkovacia mapa v Notion-e (60 riadkov × čo linkuje kde)

Po 3 mesiacoch: **~2100 organic návštev**, pillar pages sa dostali na pozície 4–8 pre cieľové keywords. Bez nového obsahu, bez budovania backlinkov, len lepšou architektúrou.

## Nástroje, ktoré stačia

- **Notion / Google Sheets** — mapa
- **Screaming Frog (free do 500 URL)** — crawl, broken links
- **Search Console** — Links → Internal (detekcia orphan stránok)
- **GA4 / Plausible** — page views, ktorá pillar zarába traffic

Žiadny SEO plugin za 99 EUR/rok. Naozaj.

Ak riešiš aj technickú stránku SEO, mám k tomu [checklist, ktorý ozaj merateľne pomáha](/blog/seo-checklist-co-pomaha/) — architektúra interných linkov je len jeden z jeho bodov.

## TL;DR

Pri 50–200 stránkach je manuálny topic cluster mapping (pillar + 5–10 cluster článkov) presnejší než akýkoľvek plugin. 2 hodiny audit, 4 hodiny reorganizácia, kvartálny review. Variácia anchor textu 30/50/20. Plugin si nechaj na weby s 5000+ stránkami, kde sa už neoplatí robiť to ručne.

**Súvisiace:** [ktoré Core Web Vitals stránky riešiť ako prvé](/blog/cwv-eshop-priorita/) · [7 najčastejších príčin LCP nad 2,5 s](/blog/lcp-nad-2-5s-pricin/).
