---
title: "Headless WordPress + Next.js: kedy áno"
date: 2026-02-15
read: 12
tags: ["Architecture", "WordPress", "Next.js"]
excerpt: "Rozhodovacia matica zo skúsenosti: kedy headless dáva zmysel a kedy len pridáva komplexitu."
featured: false
---

## Headless je trendy. Lenže nie pre každého.

Za posledný rok som spravil tri headless WP projekty a štyri klasické. Tu je úprimný pohľad na to, čo sa kedy vyplatí.

## Kedy ÁNO

Tím má vlastného frontend developera, ktorý zvláda Next.js. Bez toho sa každý fix mení na ticket, čo trvá týždne.

Frontend potrebuje veci, ktoré WordPress robí ťažko — komplexné animácie, real-time data, multi-channel publishing (web + mobile app).

Klient má rozpočet na DevOps. Headless = dva deploymenty, dve monitoring nástroje, dvojnásobné failure modes.

## Kedy NIE

Klient sám edituje content a chce vidieť výsledok hneď. Preview mode v headless funguje, ale je krehký.

Projekt je menší ako 10k mesačných návštev. ROI nedáva — namiesto headless choď radšej cez block theme + dobrý cache.

## Moja matica

Budget < 15k €? Klasický WP. Budget 15–40k €? Block theme + custom blocks. Budget 40k+ a tím má frontendistu? Headless začína dávať zmysel.

## Stack, ktorý funguje

WordPress + WPGraphQL + Faust.js (alebo plain Next.js). Vercel pre frontend, klasický LAMP/Cloud pre WP. Preview cez secret token v query.

Jeden tip: nezabudni nastaviť ISR revalidate krátko (60s) na zoznamy a dlho (1h+) na detaily. Ušetríš peniaze aj nervy.
