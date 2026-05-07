---
title: "AI search na webe pre malú firmu: $5/mes alebo $500/mes?"
date: 2025-10-08
read: 8
tags: ["AI", "WordPress"]
excerpt: "Štyri prístupy k vyhľadávaniu na webe — od Relevanssi pluginu po LLM RAG. Rozdiel v cene je 100×, rozdiel v kvalite menší ako čakáš."
featured: false
---

Klient ma minulý mesiac volal: "Filip, chcem na webe AI search ako má ChatGPT." Má 240 článkov, traffic ~3000 návštev/mes. Cez prsty mu hodil agency 4500 € za "RAG riešenie s OpenAI". Posadil som sa, prešli sme čísla a skončili sme pri pluginu za 99 dolárov.

Tu sú štyri reálne možnosti pre malé až stredné firmy. Cenovo sa líšia 100×, kvalitatívne pre 90 % use-casov skoro vôbec.

## 1. Native WP search + Relevanssi (~$0–99 jednorázovo)

Default WordPress search je príšerný — `LIKE %query%` cez `wp_posts.post_content`, žiadny ranking, žiadne stemming. [Relevanssi](https://www.relevanssi.com/) to nahradí poriadnym indexom: TF-IDF ranking, fuzzy match, synonymá, custom fields.

Free verzia stačí pre väčšinu blogov. Premium ($99/rok) pridáva multi-site indexing a click tracking.

**Kedy:** do ~500 článkov, slovenský/český obsah (Relevanssi rieši aj inflexiu cez stemmery), žiadne extrémne nároky na latency.

```bash
wp plugin install relevanssi --activate
wp relevanssi index
```

Po tomto kroku má 80 % WordPress webov "AI search" lepší než predtým. Bez API kľúčov, bez mesačných nákladov, bez vendor lock-inu.

## 2. Algolia (~$30–100/mes)

[Algolia](https://www.algolia.com/) je hosted search-as-a-service. Faceted search, instant results, typo tolerance. Pricing: $1 za 1000 search ops + index size.

Pre eshop s 5000 produktmi a 50k searchov/mes počítaj $40–80/mes. Plus integrácia (pre WP máš oficiálny plugin, pre Next.js `react-instantsearch`).

**Plus:** instant search UX (results pri každom keystroke pod 50ms), pretty defaults, dobrá analytika.
**Mínus:** pricing sa rýchlo škáluje, nemáš kontrolu nad rankingom, slovenčina vyžaduje config (custom synonymá, language settings).

## 3. Typesense self-hosted (~$5/mes Hetzner VPS)

[Typesense](https://typesense.org/) je open-source alternatíva k Algolia. API kompatibilná v duchu, REST endpointy, jednoduchá dokumentácia.

Self-host na Hetzner CX22 VPS (€4.51/mes) — pre 200 článkov + 5000 produktov bohato stačí. Docker compose, behá to.

```yaml
services:
  typesense:
    image: typesense/typesense:0.25.2
    ports: ["8108:8108"]
    volumes: ["./data:/data"]
    command: >
      --data-dir /data
      --api-key=xyz
      --enable-cors
```

Index zaplníš cez API, klient cez `typesense-instantsearch-adapter` dostane Algolia-style UX. Pre stredné firmy s technickým in-house znalosťou (alebo dev partnera) je toto sweet spot — kontrola, cena, výkon.

## 4. LLM RAG (Claude API + pgvector, $50–500/mes)

Toto je to, čo klienti chcú, keď hovoria "AI search". Vector embeddings, semantic similarity, LLM-generated odpoveď s citáciami. Stack: Postgres + pgvector, OpenAI `text-embedding-3-small` ($0.02/1M tokens), Claude 3.5 Sonnet alebo GPT-4o-mini na re-rank/generation.

Cena pri 3000 unikátnych queries/mes: ~$5 embeddings + ~$30 LLM completions + $20 hosting = ~$55/mes. Pri 30 000 queries to skočí na $300+.

**Kedy to dáva zmysel:**
- dokumentácia, knowledge base, dlhé články kde používateľ pýta "ako urobím X"
- multilingválny obsah (semantic search ignoruje jazyk)
- chatbot UX, nie len list of links

**Kedy NIE:**
- eshop s 200 produktmi (Algolia/Typesense bude rýchlejšie a presnejšie)
- novinový web (chronologický, keyword-driven)
- akýkoľvek site kde používateľ vie čo hľadá

## Decision tree

| Stav | Riešenie |
|---|---|
| WordPress, < 500 článkov | Relevanssi Premium |
| WordPress, eshop, < 1000 SKU, malý budget | Relevanssi |
| WordPress eshop, > 5000 SKU | Algolia alebo Typesense |
| Next.js / Astro headless, technical team | Typesense self-hosted |
| Knowledge base / docs / chatbot UX | LLM RAG (pgvector) |
| Multi-language, semantic queries | LLM RAG |

## Praktické závery z troch projektov tento rok

1. **Eshop s 1200 produktmi** — Relevanssi Premium ($99/rok), zero monthly cost. Čas na implementáciu: 4 hodiny vrátane custom synonym setu.
2. **Realitka, 380 listingov** — Typesense na CX22, ~€5/mes. Faceted search (lokalita, cena, m²) ktorý WordPress nikdy nedal. 12 hodín devu.
3. **B2B SaaS dokumentácia, ~600 strán** — pgvector + Claude. €70/mes plný stack. Toto bol jediný case kde RAG dával reálne pridanú hodnotu — dokumentácia má long-tail "ako" otázky.

## TL;DR

Predtým než zaplatíš €4500 za "AI search", vyskúšaj Relevanssi za $99. V 7 z 10 prípadov ti to stačí. Ak nestačí, skoč rovno na Typesense — má lepší cost/performance pomer než Algolia pre väčšinu SK projektov. RAG odkladaj, kým nemáš jasný use case nad 500 dokumentmi a používateľov, ktorí pýtajú vetné otázky, nie keywordy.
