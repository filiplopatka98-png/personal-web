---
title: "AI search na webe pre malú firmu: $5/mes alebo $500/mes?"
date: 2025-10-08
read: 8
tags: ["AI", "WordPress"]
excerpt: "Štyri prístupy k vyhľadávaniu na webe — od Relevanssi pluginu po LLM RAG. Rozdiel v cene je 100-násobný, rozdiel v kvalite menší, než by si čakal."
featured: false
---

Klient mi minulý mesiac volal: „Filip, chcem na webe AI search ako má ChatGPT." Má 240 článkov, traffic ~3000 návštev/mesiac. Cez prsty mu hodila agentúra 4500 € za „RAG riešenie s OpenAI". Sadol som si, prešli sme čísla a skončili sme pri pluginu za 99 dolárov.

Tu sú štyri reálne možnosti pre malé až stredné firmy. Cenovo sa líšia 100-násobne, kvalitatívne pre 90 % prípadov skoro vôbec.

## 1. Natívny WP search + Relevanssi (~0–120 € jednorazovo)

Predvolené vyhľadávanie vo WordPresse je príšerné — `LIKE %query%` cez `wp_posts.post_title` a `wp_posts.post_content`, žiadny ranking, žiadny stemming. [Relevanssi](https://www.relevanssi.com/) to nahradí poriadnym indexom: TF-IDF ranking, fuzzy match, synonymá, vlastné polia.

Free verzia stačí pre väčšinu blogov. Premium (120 €/rok, neobmedzený počet webov) pridáva indexovanie viacerých webov a sledovanie klikov.

**Kedy:** do ~500 článkov, slovenský/český obsah (Relevanssi rieši aj skloňovanie cez stemmery), žiadne extrémne nároky na latenciu.

```bash
wp plugin install relevanssi --activate
wp relevanssi index
```

Po tomto kroku má 80 % WordPress webov „AI search" lepší než predtým. Bez API kľúčov, bez mesačných nákladov, bez vendor lock-inu. Keď už si v tom, je to aj dobrá chvíľa pozrieť sa, koľko pluginov vlečieš — pozri [plugin diétu z 28 na 9](/blog/plugin-dieta-z-28-na-9/).

## 2. Algolia (~30–100 €/mesiac)

[Algolia](https://www.algolia.com/) je hostovaný search-as-a-service. Faceted search, okamžité výsledky, tolerancia preklepov. Pricing na pláne Grow: prvých 10 000 vyhľadávaní mesačne zadarmo, potom 0,50 $ za 1000 vyhľadávaní (plán Grow Plus s AI funkciami stojí 1,75 $ za 1000).

Pre eshop s 5000 produktmi a 50-tisíc vyhľadávaniami za mesiac počítaj rádovo 30–70 €/mesiac. Plus integrácia (pre WP máš oficiálny plugin, pre Next.js `react-instantsearch`).

**Plus:** okamžité vyhľadávanie (výsledky pri každom stlačení klávesy pod 50 ms), rozumné predvolené nastavenia, dobrá analytika.
**Mínus:** cena rýchlo rastie so škálovaním, nemáš plnú kontrolu nad rankingom, slovenčina vyžaduje konfiguráciu (vlastné synonymá, jazykové nastavenia).

## 3. Typesense self-hosted (~4 €/mesiac Hetzner VPS)

[Typesense](https://typesense.org/) je open-source alternatíva k Algolii. API kompatibilné v duchu, REST endpointy, jednoduchá dokumentácia.

Self-host na Hetzner CX22 VPS (3,79 €/mesiac) — pre 200 článkov + 5000 produktov bohato stačí. Docker Compose a beží to.

```yaml
services:
  typesense:
    image: typesense/typesense:30.2
    ports: ["8108:8108"]
    volumes: ["./data:/data"]
    command: >
      --data-dir /data
      --api-key=xyz
      --enable-cors
```

Index zaplníš cez API, klient cez `typesense-instantsearch-adapter` dostane UX v štýle Algolie. Pre stredné firmy s technickým človekom in-house (alebo dev partnerom) je toto sweet spot — kontrola, cena aj výkon. Presne toto poháňa aj [faceted filtre, ktoré nelagnú — bez ElasticSearch](/blog/faceted-filtre-bez-elasticsearch/).

## 4. LLM RAG (Claude API + pgvector, 50–500 €/mesiac)

Toto je to, čo klienti chcú, keď hovoria „AI search". Vektorové embeddingy, sémantická podobnosť, odpoveď vygenerovaná LLM-kom s citáciami. Stack: Postgres + pgvector, OpenAI `text-embedding-3-small` (0,02 $ za 1M tokenov), Claude Sonnet alebo niektorý lacnejší model (napr. Claude Haiku) na re-rank a generovanie.

Cena pri 3000 unikátnych dopytoch za mesiac: ~5 $ embeddingy + ~30 $ LLM completions + 20 $ hosting = ~55 $/mesiac. Pri 30-tisíc dopytoch to vyskočí na 300 $ a viac.

**Kedy to dáva zmysel:**
- dokumentácia, knowledge base, dlhé články, kde sa používateľ pýta „ako urobím X"
- viacjazyčný obsah (sémantické vyhľadávanie ignoruje jazyk)
- chatbotové UX, nie len zoznam odkazov

**Kedy NIE:**
- eshop s 200 produktmi (Algolia/Typesense bude rýchlejšie a presnejšie)
- novinový web (chronologický, riadený kľúčovými slovami)
- akýkoľvek web, kde používateľ presne vie, čo hľadá

## Decision tree

| Stav | Riešenie |
|---|---|
| WordPress, < 500 článkov | Relevanssi Premium |
| WordPress, eshop, < 1000 SKU, malý rozpočet | Relevanssi |
| WordPress eshop, > 5000 SKU | Algolia alebo Typesense |
| Next.js / Astro headless, technický tím | Typesense self-hosted |
| Knowledge base / dokumentácia / chatbotové UX | LLM RAG (pgvector) |
| Viacjazyčné, sémantické dopyty | LLM RAG |

## Praktické závery z troch projektov tento rok

1. **Eshop s 1200 produktmi** — Relevanssi Premium ($99/rok), nulové mesačné náklady. Čas na implementáciu: 4 hodiny vrátane vlastnej sady synoným.
2. **Realitka, 380 inzerátov** — Typesense na CX22, ~€5/mes. Faceted search (lokalita, cena, m²), ktorý WordPress nikdy nedal. 12 hodín vývoja.
3. **B2B SaaS dokumentácia, ~600 strán** — pgvector + Claude. €70/mes za celý stack. Toto bol jediný prípad, kde RAG dával reálne pridanú hodnotu — dokumentácia má long-tail „ako" otázky.

## TL;DR

Skôr než zaplatíš €4500 za „AI search", vyskúšaj Relevanssi za pár desiatok eur. V 7 z 10 prípadov ti to stačí. Ak nestačí, skoč rovno na Typesense — má lepší pomer cena/výkon než Algolia pre väčšinu SK projektov. RAG odkladaj, kým nemáš jasný use case nad 500 dokumentmi a používateľov, ktorí sa pýtajú celými vetami, nie kľúčovými slovami.

Súvisiace: [WooCommerce vs Shopify pre malý SK eshop](/blog/woocommerce-vs-shopify/), [faceted filtre bez ElasticSearch](/blog/faceted-filtre-bez-elasticsearch/).
