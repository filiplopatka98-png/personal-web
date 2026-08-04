# Pridanie projektu / článku

Web je bilingválny (SK bez prefixu, EN pod `/en`). Pridaj SK aj EN variant.

## Nový projekt
Súbor: `src/content/projects/sk/<slug>.md` a `src/content/projects/en/<slug>.md`.
Schéma: `src/content/schemas.ts` (`projectSchema`). `url` = doména bez schémy
(napr. `web.sk`) — presne táto hodnota mapuje na monitorix perf metriky
(komponent `ProjectPerf` cez `normalizeDomain`).

```md
---
name: "Názov webu"
kind: "E-shop · WooCommerce"
year: "2026"
role: "WordPress Developer"
duration: "6 týždňov"
client: "Meno klienta"
url: "web.sk"
accent: accent        # accent | accent2 | accent3
order: 2
featured: false
brief: "Jedna-dve vety, čo to je (min. 10 znakov)."
metrics:
  - value: "10 000+"
    label: "produktov"
process:
  - title: "Analýza"
    duration: "1 týždeň"
    desc: "Čo sa udialo."
stack:
  - "WordPress"
  - "WooCommerce"
---

Voľný markdown text prípadovej štúdie (renderuje sa v proj-body).
```

(EN variant: rovnaké polia, anglické texty, súbor v `projects/en/`.)

## Nový článok
Súbor: `src/content/articles/sk/<slug>.md` a `src/content/articles/en/<slug>.md`.
Schéma: `articleSchema`.

```md
---
title: "Titulok článku"
date: 2026-08-04
read: 6
tags: ["astro", "performance"]
excerpt: "Krátky perex (min. 10 znakov)."
featured: false
---

Telo článku v markdowne.
```

## Overenie
`npx astro check && npm run build` — Zod schéma odmietne chýbajúce/nesprávne polia.
