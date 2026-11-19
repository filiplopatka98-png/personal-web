---
title: "Rýchlosť webu a SEO: čo naozaj ovplyvňuje poradie v Google"
date: 2026-11-19
read: 7
tags: ["SEO", "Performance", "Core Web Vitals"]
excerpt: "Ovplyvňuje rýchlosť webu poradie v Google? Čo je pravda o Core Web Vitals, prečo skóre 100 v PageSpeed nie je cieľ a čo opraviť ako prvé."
metaDescription: "Rýchlosť webu a SEO: ako Google používa Core Web Vitals, prečo sa nehnať za 100 bodmi v PageSpeed a v akom poradí opravovať LCP, server a obrázky."
featured: false
faq:
  - q: "Je rýchlosť webu faktor poradia v Google?"
    a: "Áno, ale nie jediný a nie najsilnejší. Google používa Core Web Vitals v rankingových systémoch, no podľa jeho vlastných pokynov nejde o jeden signál a relevancia obsahu je dôležitejšia. Dobrá rýchlosť pomáha najmä tam, kde je viac stránok s podobne relevantným obsahom."
  - q: "Aké hodnoty Core Web Vitals sú dobré?"
    a: "LCP do 2,5 sekundy, INP do 200 milisekúnd a CLS do 0,1, merané na 75. percentile reálnych návštev. Hodnoty sa berú z dát skutočných používateľov, nie z jedného testu."
  - q: "Mám sa snažiť o 100 bodov v PageSpeed Insights?"
    a: "Nie. Skóre je súhrn laboratórneho testu a nie je to to, čo Google používa na poradie. Dôležité sú reálne hodnoty LCP, INP a CLS. Za hranicou „dobré“ ďalšie zrýchľovanie poradie zvyčajne nepohne."
  - q: "Čo zrýchliť ako prvé?"
    a: "Najprv nameraj reálne dáta v Search Console a nájdi najhoršiu skupinu stránok. Potom zvyčajne najviac pomôže hero obrázok (LCP), odozva servera a ťažké skripty tretích strán."
---

Krátka odpoveď: **rýchlosť webu poradie ovplyvňuje, ale slabo a na úzkej hranici**. Pomalý web ti poradie nezníži kvôli sekunde navyše. Ale pomalý web stratí návštevníkov skôr, než sa dočítajú, čo ponúkaš, a to je dôvod, prečo sa o rýchlosť oplatí starať. Tu je, čo z toho je overené a čo je mýtus.

## Čo hovorí Google

Google vo svojich pokynoch uvádza, že **Core Web Vitals používajú jeho rankingové systémy**. Zároveň píše, že neexistuje jeden signál, ale skupina signálov okolo celkového zážitku zo stránky, a že dobré výsledky v Search Console alebo v nástrojoch tretích strán nezaručia popredné miesto. Ostatné aspekty zážitku zo stránky podľa neho priamo poradie nezvyšujú. Relevancia obsahu je pri poradí dôležitejšia.

Prakticky: ak sú dve stránky obsahovo rovnako dobré, rýchlejšia môže mať navrch. Ak je jedna obsahovo výrazne lepšia, vyhrá aj pomalšia.

## Čo sa vlastne meria

Core Web Vitals sú tri čísla:

- **LCP** (kedy sa zobrazí hlavný obsah): do 2,5 s,
- **INP** (ako rýchlo web reaguje na kliky): do 200 ms,
- **CLS** (skákanie obsahu pri načítaní): do 0,1.

Hodnotí sa **75. percentil reálnych návštev**, teda to, čo zažije väčšina ľudí na bežnom mobile, nie test zo stoličky na rýchlej wifi. Preto je dôležité pozerať *Search Console → Core Web Vitals*, nie len jednorazový test.

## Prečo sa nehnať za 100 bodmi v PageSpeed

Skóre v PageSpeed Insights je z laboratórneho testu (Lighthouse) a spája viac metrík do jedného čísla. Google na poradie nepoužíva toto číslo, ale **reálne dáta používateľov**. Preto môže mať web 95 bodov a zlé reálne LCP (lebo veľa návštevníkov má slabé pripojenie), aj 70 bodov a prejsť Core Web Vitals.

Keď už je web v zelených hodnotách, ďalšie zrýchľovanie poradie zvyčajne nepohne. Čas je lepšie dať do obsahu a indexácie. Pri novom webe, ktorý Google ešte ani nepreliezol, je rýchlosť druhoradá.

## Kde rýchlosť pomáha najviac

1. **Mobilný LCP na dôležitých stránkach.** Najčastejšie ho kazí veľký hero obrázok bez `fetchpriority`, pomalý server alebo blokujúci JavaScript. Rozbor príčin je v článku [LCP nad 2,5 s: príčiny](/blog/lcp-nad-2-5s-pricin/).
2. **Odozva servera a hosting.** Pomalý server zdrží všetko ostatné a zbytočne spomaľuje aj prehľadávanie webu. Čísla z benchmarku sú v článku [Hostingy na Slovensku: výkon](/blog/hostingy-sk-vykon/).
3. **E-shopy a stránky, kde sa platí.** Pomalý košík a detail produktu stoja tržby skôr než pozície. Spolu s technickým základom to prechádzam v článku [SEO pre WordPress a WooCommerce](/blog/seo-wordpress-woocommerce-zaklad/).

## Poradie krokov

1. **Nameraj reálne dáta.** Search Console → Core Web Vitals. Nájdi skupiny stránok v stave „Zlé“ alebo „Vyžaduje zlepšenie“ a vyber tie, ktoré majú návštevnosť.
2. **Oprav najväčšiu vec.** Zvyčajne obrázok v hornej časti stránky (rozmer, formát, `fetchpriority`), potom server a cache, potom skripty tretích strán.
3. **Over po zmene.** Reálne dáta sa aktualizujú s oneskorením niekoľkých týždňov, preto zmenu overuj najprv v teste a potom v Search Console.
4. **Zastav sa v zelenej.** Keď prejdeš hranice, rieš obsah a indexáciu.

## Príklad z praxe

Pri e-shope natur-life.sk (WooCommerce) som skóre detailu produktu na mobile posunul z 27 na 83 bodov. Veľkosť stránok klesla o 52 až 73 % a odozva servera je 120 až 250 ms. Nemenila sa téma ani web sa neprepisoval: išlo o obrázky, skripty a nastavenie cache. Celý postup je v [prípadovej štúdii](/praca/natur-life/). Poradie v Google som pri tom nesľuboval a nemeral: cieľom bol rýchlejší nákup. Presne tak sa na rýchlosť pozerám aj teraz: ako na podmienku, nie ako na skratku k prvej pozícii.

## Chceš vedieť, kde si na tom?

Základný SEO audit malého webu (do približne 10 stránok) robím za **99 €**: indexácia, technické chyby vrátane rýchlosti, tituly a metaopisy a prioritizovaný zoznam úloh. Samotné zrýchlenie webu alebo e-shopu je od 390 € podľa auditu, viac v článku [Koľko stojí web a e-shop](/blog/kolko-stoji-web-eshop-2026/) a v [ponuke služieb](/sluzby/). Ak začínaš, pozri najprv [návod na SEO optimalizáciu](/blog/seo-optimalizacia-webu-navod/).
