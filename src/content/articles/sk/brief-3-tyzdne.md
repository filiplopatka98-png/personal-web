---
title: "Brief, ktorý ušetrí 3 týždne nedorozumení"
date: 2026-04-15
read: 7
tags: ["Process", "UX"]
excerpt: "5 sekcií, jedna A4 strana: cieľ, publikum, rozsah, obmedzenia, kritériá úspechu. Reálny ROI: 2 hodiny nad briefom ušetria 3 týždne implementačných hádok."
featured: false
---

Bez briefu klient povie „spravte web“ a o 6 týždňov sa čuduje, prečo na ňom nie je rezervačný systém. Ty sa čuduješ, prečo má klient v hlave čokoľvek iné než landing page. Brief odstráni 80 % týchto situácií.

Toto je päťsekciová šablóna, ktorú používam na každom novom projekte. Vyplnenie 2 hodiny (klient + ja), úspora 3 týždne neskôr. Nie je to metafora — je to reálny rozdiel medzi projektom s briefom a bez neho.

## Sekcia 1: Cieľ

**1 veta + 1 metrika.** Nič viac.

Príklad:

> Web má generovať 30 kvalifikovaných leadov mesačne pre B2B obchodný tím. Metrika: odoslané formuláre s vyplneným poľom „company“.

Čo do cieľa NEdávať:

- „Byť moderný a profesionálny“ — to nie je cieľ, to je pocit
- „Zlepšiť SEO“ — pre aké kľúčové slová? Čo z toho tečie?
- „Mať novú stránku“ — to je akcia, nie cieľ

Ak klient nevie sformulovať cieľ jednou vetou, projekt nie je pripravený. Pošli ho späť na discovery, alebo si dohodnite stretnutie, kde to poskladáte spolu.

## Sekcia 2: Publikum

**Kto, prečo prichádza, kde je teraz.** 3 vety.

Príklad:

> **Kto:** nákupcovia v stavebných firmách, 35 – 50 rokov, B2B.  
> **Prečo prichádza:** hľadajú dodávateľa pre konkrétny projekt, potrebujú rýchlu cenovú ponuku.  
> **Kde je teraz:** vyhľadávanie na Googli „stavebný materiál bratislava dodávka“, referencie na LinkedIne, odporúčanie kolegu.

To je všetko. Žiadny persona dokument s menom, koníčkami a Spotify playlistom. Tieto 3 vety ti definujú:

- Tón (B2B → vecný, žiadny startupový slang)
- Prioritu obsahu (rýchla cenová ponuka → výrazné CTA „Vyžiadať ponuku“)
- Akvizičný kanál (vyhľadávanie → SEO + reklama, nie sociálne siete)

Ak má projekt 2 odlišné publiká (napr. e-shop má B2B aj B2C zákazníkov), urob túto sekciu 2×. Nie viac. 4 publiká = projekt nemá fokus.

## Sekcia 3: Rozsah

Tri stĺpce: **In, Out, Later.**

```
IN (v cene):
- Landing page + 5 podstránok
- Šablóna blogu (bez obsahu)
- Kontaktný formulár s routovaním leadov do CRM
- Cookie lišta v súlade s GDPR
- Základné SEO nastavenie (sitemap, robots, meta tagy)

OUT (nie sme za to zodpovední):
- Písanie obsahu (zabezpečí klient)
- Brand identita / redizajn loga
- Nastavenie e-mail marketingu (existujúci Mailchimp)
- Produktové fotky (dodá klient)

LATER (2. fáza, samostatný rozsah):
- Viacjazyčnosť (EN verzia)
- Rezervačný systém / kalendár
- Členská sekcia s prihlásenými používateľmi
- Natívna mobilná aplikácia
```

Sekcia `LATER` je dôležitá — zachytáva veci, o ktorých klient hovorí „to by sme možno chceli“. Bez nej skončia v 1. fáze a posunú deadline o mesiac. So sekciou `LATER` má klient čierne na bielom: „na týchto veciach sme sa dohodli, že ich riešime neskôr.“

## Sekcia 4: Obmedzenia

4 podsekcie:

**Deadline.**
> Spustenie 30. novembra 2026. Pevný — viaže sa na kampaň Black Friday.

**Rozpočet.**
> 12 000 – 15 000 EUR (±20 %). Po dohode s CFO.

**Technické limity.**
> Hosting na existujúcom AWS účte. CMS musí byť WordPress (interný tím ho vie). E-mailová integrácia s Mailchimpom (existujúca).

**Brand.**
> Existujúci brand manuál (PDF, 2024). Farby: #003366, #FFAA00, #FFFFFF. Font: Inter. Tón: vecný, B2B, žiadny humor.

Ak klient nevyplní hociktorú zo 4 sekcií, máš jasné ďalšie kroky:

- Bez deadlinu → „kedy je posledný možný termín spustenia?“
- Bez rozpočtu → „máte interval ±50 %?“
- Bez technických limitov → stack navrhneš ty
- Bez brandu → pred dizajnom musíš naplánovať brand workshop

## Sekcia 5: Kritériá úspechu

**Kedy sme hotoví. Kto schvaľuje.**

Príklad:

```
HOTOVÉ keď:
- Web je nasadený na klientovej produkčnej doméne
- Lighthouse Performance ≥ 90 na mobile pre top 5 stránok
- Kontaktný formulár otestovaný end-to-end (formulár → CRM)
- Cookie lištu schválil klientov DPO
- Klient má prístup do CMS a vie editovať blogové články (1 h zaškolenia)

SCHVAĽUJE:
- Finálny dizajn → marketingový manažér (Anna K.)
- Texty → content lead (Peter M.)
- Technické nastavenie → CTO (Tomáš S.)
- Súhlas so spustením → CEO (Martin L.)
```

Ak kritériá úspechu nie sú definované, v závere projektu sa vždy nájde „ešte jedna malá vec“. Nenájde. Klient nemá čierne na bielom, kedy projekt skončil. Toto to rieši.

## Čo do briefu NEdávať

- **Implementačné detaily.** „Použite plugin Yoast SEO, tému Astra, Elementor Pro.“ To rieši vývojár. Klient sa stará o **čo**, nie o **ako**.
- **Wireframy.** Ak klient nakreslí 3 wireframy a pošle ich, briefuje výsledok namiesto cieľa. Wireframe sa robí pri dizajne. V briefe sú slová.
- **„Spravte to ako Stripe, ale pre nás.“** To je antipattern. Stripe má tisíce inžinierov, miliardový rozpočet a úplne iný produkt. Konkrétne odkazy na inšpiráciu sú v poriadku („máme radi sekciu X na webe Y, lebo Z“), ale „ako Stripe“ nie je špecifikácia.
- **Detailné texty.** „Hero text bude Z.“ Brief je **cieľ**, nie **obsah**. Texty sa píšu počas implementácie, na základe SEO researchu a dizajnu.

## Kto brief vypĺňa

V ideálnom stave: **klient vyplní 80 %, ja doplním 20 %.**

Reálne: klient vyplní 40 %, ja doplním 60 %. Na 90-minútovom hovore spolu prejdeme šablónu, ja kladiem otázky, klient odpovedá, ja zapisujem.

Ak klient odmietne brief vyplniť („nemáme čas, povedz cenu“), je to test odhodlania. Bez briefu projekt zlyhá; klient bez vyplneného briefu nie je odhodlaný do toho ísť. Ja takéto projekty neberiem.

## Reálny ROI

Posledné 3 projekty s briefom:

- **Discovery:** 2 hodiny (90-minútový hovor + 30 minút písania)
- **Implementačná fáza:** 3 – 6 týždňov, 2 – 3 zmeny rozsahu (obe strany ich akceptujú)
- **Spory:** žiadne

Predchádzajúce 3 projekty bez briefu:

- **Discovery:** 30 minút „rýchly hovor, ja viem, čo chceš“
- **Implementačná fáza:** 5 – 10 týždňov, 8 – 12 zmien rozsahu (nezhody na tom, čo sa dohodlo)
- **Spory:** v 2 z 3 projektov

Pre 1 priemerný projekt: brief ušetrí ~3 týždne kalendárneho času a zabráni ~5 hádkam o rozsahu. Klient platí menej (lebo žiadne prerábky), ja zarobím rovnako (rovnaké hodiny, ale na prácu s pridanou hodnotou, nie na vyjasňovacie hovory).

## Šablóna briefu (skrátená verzia na copy-paste)

```markdown
# Brief: [Názov projektu]

## 1. Cieľ
Web má _______ (1 veta). Metrika: _______.

## 2. Publikum
**Kto:** _______
**Prečo prichádza:** _______
**Kde je teraz:** _______

## 3. Rozsah
**IN:** _______
**OUT:** _______
**LATER:** _______

## 4. Obmedzenia
- Deadline: _______
- Rozpočet: _______
- Technické: _______
- Brand: _______

## 5. Kritériá úspechu
**Hotové keď:** _______
**Schvaľuje:** _______
```

Stačí jedna A4 strana. Notion alebo Google Doc, zdieľaný odkaz. Žiadny PDF, žiadny PowerPoint.

## Zhrnutie

5 sekcií, jedna strana: cieľ (1 veta + metrika), publikum (3 vety), rozsah (in/out/later), obmedzenia (deadline/rozpočet/tech/brand), kritériá úspechu (kedy hotové + kto schvaľuje). Vyplnenie 2 h, úspora ~3 týždne. Bez briefu projekty zlyhávajú na rozpínaní rozsahu.
