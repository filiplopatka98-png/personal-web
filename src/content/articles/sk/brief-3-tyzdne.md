---
title: "Brief, ktorý ušetrí 3 týždne nedorozumení"
date: 2026-04-15
read: 7
tags: ["Process", "UX"]
excerpt: "5 sekcií, jedna A4 strana. Goal, audience, scope, constraints, success criteria. Reálny ROI: 2 hodiny brief discovery zachránili 3 týždne implementačných hádok."
featured: false
---

Bez briefu klient povie "spravte web" a o 6 týždňov sa čuduje, prečo na ňom nie je booking systém. Ty sa čuduješ, prečo má klient v hlave čokoľvek iné než landing page. Brief odstráni 80 % týchto situácií.

Toto je 5-sekcia template, ktorú používam na každom novom projekte. Vyplnenie 2 hodiny (klient + ja), úspora 3 týždne neskoršie. Nie metafora — reálny rozdiel medzi projektom s briefom a bez.

## Sekcia 1: Goal

**1 veta + 1 metrika.** Nič viac.

Príklad:

> Web má generovať 30 kvalifikovaných lead-ov mesačne pre B2B sales tím. Metrika: form submissions s vyplneným "company" field-om.

Čo NEdávať do goalu:

- "Byť moderný a profesionálny" — to nie je goal, to je pocit
- "Zlepšiť SEO" — pre aké keywordy? Čo z toho tečie?
- "Mať novú stránku" — to je akcia, nie cieľ

Ak klient nevie zformulovať goal vetou, projekt nie je ready. Pošli ho späť na discovery, alebo dohodnite session kde to spolu skladáte.

## Sekcia 2: Audience

**Kto, prečo prichádza, kde sú teraz.** 3 vety.

Príklad:

> **Kto:** Procurement managers v stavebných firmách, 35-50 rokov, B2B.  
> **Prečo prichádza:** Hľadajú dodávateľa pre konkrétny projekt, potrebujú rýchlu cenovú ponuku.  
> **Kde sú teraz:** Google search "stavebný materiál bratislava dodávka", LinkedIn referencie, kolega odporučil.

Toto je všetko. Nie persona dokument s menom, hobby a Spotify playlist-om. Tieto 3 vety ti definujú:

- Tone (B2B → vecný, žiadny startup-y slang)
- Content priority (rýchla cenová ponuka → prominent CTA "Vyžiadať ponuku")
- Acquisition channel (search → SEO + ads, nie social media)

Ak má projekt 2 distinct audiences (napr. eshop má B2B aj B2C zákazníkov), urob 2× túto sekciu. Nie viac. 4 audiences = projekt nemá fokus.

## Sekcia 3: Scope

Tri stĺpce: **In, Out, Later.**

```
IN (v cene):
- Landing page + 5 pod-stránok
- Blog template (ne content)
- Kontakt form s lead routing do CRM
- Cookie banner GDPR-compliant
- Základné SEO setup (sitemap, robots, meta tagy)

OUT (nie sme za to zodpovední):
- Content písanie (klient zabezpečí)
- Brand identity / logo redesign
- E-mail marketing setup (existing Mailchimp)
- Production fotky (klient dodá)

LATER (Phase 2, separate scope):
- Multi-language (EN verzia)
- Booking systém / kalendár
- Member area s logged-in users
- Native mobile app
```

`LATER` sekcia je dôležitá — zachytáva veci, ktoré klient hovorí "to by sme možno chceli". Bez nej skončia v Phase 1 a posunú deadline o mesiac. S `LATER` sekciou má klient čierno na bielom: "tieto veci sme dohodli, že riešime neskôr."

## Sekcia 4: Constraints

4 podsekcie:

**Deadline.**
> Launch 30. november 2026. Pevný — viaže sa na Black Friday kampaň.

**Budget.**
> €12 000 – €15 000 (±20 %). Po dohode s CFO.

**Technical limits.**
> Hosting na existing AWS account. CMS musí byť WordPress (interný tím vie). E-mail integrácia s Mailchimp (existing).

**Brand.**
> Existing brand guidelines (PDF, 2024). Farby: #003366, #FFAA00, #FFFFFF. Font: Inter. Tone: vecný, B2B, žiadny humor.

Ak klient nevyplní hocijakú zo 4 sekcií, máš jasné next steps:

- Bez deadline → "kedy je posledný možný launch?"
- Bez budget → "máte interval ±50 %?"
- Bez tech limits → ty navrhneš stack
- Bez brand → musíš space-ovať brand work-shop pred dizajnom

## Sekcia 5: Success criteria

**Kedy sme hotoví. Kto schvaľuje.**

Príklad:

```
HOTOVÉ keď:
- Web je live na klient-com produkčnom dom-éne
- Lighthouse Performance ≥ 90 na mobile pre top 5 stránok
- Kontakt form testovaný end-to-end (form → CRM)
- Cookie banner approved by klient-ov DPO
- Klient má prístup do CMS a vie editovať blog posty (1h training)

SCHVAĽUJE:
- Final dizajn → Marketing manager (Anna K.)
- Texty → Content lead (Peter M.)
- Tech setup → CTO (Tomáš S.)
- Sign-off na live → CEO (Martin L.)
```

Ak success criteria nie sú definované, pri konci projektu sa vždy nájde "ešte jedna malá vec". Nie je. Klient nemá čierno na bielom, kedy projekt skončil. Toto rieši.

## Čo NEdávať do briefu

- **Implementation details.** "Použite Yoast SEO plugin, theme Astra, Elementor Pro." To rieši dev. Klient sa starata o **čo**, nie **ako**.
- **Wireframe sketches.** Ak klient nakreslí 3 wireframy a pošle ich, briefuje výsledok namiesto cieľa. Wireframe sa robí pri dizajne. V briefe sú slová.
- **"Spravte to ako Stripe ale pre nás."** Toto je antipattern. Stripe má 1000+ engineerov, $billion budget a iný product. Konkrétne odkazy na inšpiráciu sú OK ("máme radi sekciu X na webe Y, lebo Z"), ale "ako Stripe" nie je špecifikácia.
- **Detail copy.** "Hero text bude Z." Brief je **goal**, nie **content**. Texty sa píšu počas implementácie, na základe SEO research-u a dizajnu.

## Kto vyplňa brief

V ideálnom stave: **klient vyplní 80 %, ja doplním 20 %.**

Reálne: klient vyplní 40 %, ja doplním 60 %. Spolu na 90-min calle prejdeme template, ja kladiem otázky, klient odpovedá, ja zapisujem.

Ak klient odmietne vyplniť brief ("nemáme čas, povedz cenu"), je to test commitment-u. Bez briefu projekt zlyhá; klient bez vyplneného briefu nie je commited. Ja takéto projekty neberiem.

## Reálny ROI

Posledné 3 projekty s briefom:

- **Brief discovery:** 2 hodiny (90 min call + 30 min písanie)
- **Implementačná fáza:** 3-6 týždňov, 2-3 zmeny scope-u (oboje strany akceptujú)
- **Disputes:** žiadne

Predchádzajúce 3 projekty bez briefu:

- **Discovery:** 30 minút "rýchly call, ja viem čo chceš"
- **Implementačná fáza:** 5-10 týždňov, 8-12 scope changes (nezhody na čom sa dohodlo)
- **Disputes:** v 2/3 projektoch

Pre 1 priemerný projekt: brief ušetrí ~3 týždne kalendárneho času a zabráni ~5 hádkam o scope. Klient platí menej (lebo žiadny rework), ja zarobím rovnako (rovnaké hodiny, ale na value-add prácu, nie na clarification calls).

## Brief template (skrátená verzia na copy-paste)

```markdown
# Brief: [Názov projektu]

## 1. Goal
Web má _______ (1 veta). Metrika: _______.

## 2. Audience
**Kto:** _______
**Prečo prichádza:** _______
**Kde sú teraz:** _______

## 3. Scope
**IN:** _______
**OUT:** _______
**LATER:** _______

## 4. Constraints
- Deadline: _______
- Budget: _______
- Technical: _______
- Brand: _______

## 5. Success criteria
**Hotové keď:** _______
**Schvaľuje:** _______
```

Stačí jedna A4 strana. Notion alebo Google Doc, sharedný link. Žiadny PDF, žiadny PowerPoint.

## TL;DR

5 sekcií, jedna strana: Goal (1 veta + metrika), Audience (3 vety), Scope (in/out/later), Constraints (deadline/budget/tech/brand), Success criteria (kedy hotové + kto schvaľuje). Vyplnenie 2h, úspora ~3 týždne. Bez briefu projekty zlyhávajú v scope creep-e.
