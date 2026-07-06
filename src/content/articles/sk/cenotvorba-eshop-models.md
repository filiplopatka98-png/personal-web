---
title: "Cenotvorba pre malé eshopy: hodinovka vs fix vs hybrid"
date: 2026-05-02
read: 8
tags: ["Process"]
excerpt: "Tri modely, jedno rozhodovacie pravidlo: <30 % scope drift = fix, 30–60 % = hybrid, >60 % = hodinovka. Plus reálne čísla z piatich eshop projektov."
featured: true
---

Nový klient, malý eshop, „potrebujeme web“. Tri spôsoby, ako mu to vyfakturovať. Každý má iný rizikový profil, inú prácu pre teba a inú mieru dôvery u klienta.

Toto je rozhodovací rámec, ktorý používam posledné tri roky. Plus reálne čísla z piatich eshop projektov.

## Model 1: Hodinovka

**Cena:** 60 – 90 EUR/h pre Bratislavu, 45 – 70 EUR/h pre menšie mestá. SZČO (samostatne zárobkovo činná osoba) alebo s.r.o. fakturuje plus 23 % DPH (ak je platiteľom).

**Vhodné, keď:**
- Scope je nejasný („postavme MVP a uvidíme“)
- Klient chce pracovať iteratívne, s neustálou spätnou väzbou
- Projekt má vysoké technické riziko (custom integrácie, headless CMS, AI)

**Riziko pre dev:** žiadne — fakturuješ, čo odrobíš.
**Riziko pre klienta:** vysoké — nepozná finálnu cenu.

**Komunikácia:** „Účtujem 75 EUR/h, fakturujem každé dva týždne s detailným výkazom práce. Limit pred eskaláciou: 80 h, potom prejdeme delivery review.“

Klient bude tlačiť na predvídateľnosť. Daj mu **odhad v rozpätiach** (40 – 60 h pre časť A, 20 – 30 h pre časť B), ale nesľubuj mu fixnú cenu na hodinovkový projekt — to je samovražda pre obe strany.

## Model 2: Fixná cena

**Cena:** 4 000 – 15 000 EUR pre malý až stredný eshop. Závisí od:

- Počtu produktov (do 50 / 50 – 500 / 500+)
- Custom funkcionality (iba katalóg vs. predplatné + členská sekcia)
- Integrácií (Mailchimp / Klaviyo / účtovníctvo / sklad)
- Dizajnu (template-based / semi-custom / fully custom)

Konkrétny rozpis jedného môjho eshopu (11 500 EUR fix):

| Časť | Hodiny | Hodinovka | Cena |
|---|---|---|---|
| Discovery + brief + design system | 12 h | 70 EUR | 840 EUR |
| WooCommerce setup + custom téma | 28 h | 70 EUR | 1 960 EUR |
| Import 80 produktov + obsah | 16 h | 60 EUR | 960 EUR |
| Checkout + platby (Stripe + GoPay) | 18 h | 80 EUR | 1 440 EUR |
| E-mailový flow (Klaviyo) | 14 h | 70 EUR | 980 EUR |
| SEO + analytics + GTM | 10 h | 70 EUR | 700 EUR |
| QA + oprava chýb | 12 h | 60 EUR | 720 EUR |
| **Buffer (15 %)** | 16 h | 70 EUR | 1 120 EUR |
| Projektový manažment | 14 h | 70 EUR | 980 EUR |
| Zaškolenie + odovzdanie | 6 h | 60 EUR | 360 EUR |
| **Spolu** | **146 h** | **~79 EUR** | **10 060 EUR** |

Plus 15 % biznis buffer (prekročenia, klientove zmeny mimo scope) = 11 569 EUR → zaokrúhlené na **11 500 EUR fix**.

**Vhodné, keď:**
- Scope je jasný (5+ strán briefov, mockupy)
- Klient chce predvídateľnú cenu
- Podobný projekt si robil už aspoň 3× (vieš odhadnúť)

**Riziko pre dev:** vysoké — prekročenie ide z tvojho vrecka.
**Riziko pre klienta:** nízke — pozná cenu.

**Komfort klienta = +30 % k cene.** Klient platí prémiu za predvídateľnosť. To je férové, lebo ty platíš prémiu za riziko.

## Model 3: Hybrid (fixný základ + hodinovkové extras)

**Nastavenie:** fixná cena za core scope (6 – 12 tis. EUR) plus hodinovka (60 – 80 EUR/h) za všetko mimo scope.

**Príklad ponuky:**

```
Core scope (FIX): 8 500 EUR
- 5 stránok webu + WooCommerce
- 80 produktov
- Checkout + 2 platby
- Nastavenie e-mailového flow (1 sekvencia)
- Nastavenie SEO

Mimo scope (HODINOVKA @ 70 EUR/h):
- Ďalšie e-mailové sekvencie
- Custom integrácie (sklad, účtovníctvo)
- Úprava fotiek
- Písanie obsahu
- Nové funkcie po launchi
```

**Vhodné pre 80 % projektov.** Klient dostane fixnú cenu za jasnú časť, ty máš únikovú cestu pre veci typu „ešte toto malé pridáme“.

Priebeh change requestu:

1. Klient povie „ešte chcem X“
2. Napíšeš e-mail: „X nie je v core scope. Odhad 3 – 5 h, t. j. 210 – 350 EUR. Schváľ a vyfakturujem ako extra.“
3. Klient odsúhlasí písomne (e-mail stačí)
4. Ty to naimplementuješ a vyfakturuješ

Bez tohto postupu sa hybrid zmení na pseudofix s neobmedzenými revíziami.

## Rozhodovacie pravidlo

Používam jednoduchú heuristiku:

- **Očakávaný scope drift <30 %** (jasný brief, robil som podobné) → **fix**
- **Scope drift 30 – 60 %** (priemerný projekt, klient ešte mení názor) → **hybrid**
- **Scope drift >60 %** (nová technológia, vágny brief, R&D) → **hodinovka**

Scope drift = % práce mimo pôvodne dohodnutého. Odhadom z minulých projektov, nie je to exaktné číslo.

Pre malé eshopy je v 70 % prípadov **hybrid** najlepšia voľba. Klient dostane istotu v cene, ty dostaneš únikovú cestu.

## Reálne čísla z 5 eshop projektov

| Projekt | Model | Pôvodná cena | Finálna cena | Drift | Spokojnosť |
|---|---|---|---|---|---|
| Eshop A (50 prod., beauty) | Fix | 7 500 EUR | 7 500 EUR | 0 % | OK pre obe strany |
| Eshop B (200 prod., fashion) | Fix | 11 500 EUR | 11 500 EUR | 0 % | OK, ale **moje prekročenie ~30 h** (môj náklad) |
| Eshop C (B2B, custom) | Hodinovka | 5 000 EUR odhad | 8 200 EUR | +64 % | Klient sklamaný cenou |
| Eshop D (300 prod., foods) | Hybrid | 9 000 EUR + 1 800 EUR extras | 10 800 EUR | +20 % | **Najlepší** — klient spokojný |
| Eshop E (predplatné) | Hybrid | 12 000 EUR + 3 200 EUR extras | 15 200 EUR | +27 % | Klient spokojný, ja spokojný |

Eshop B (fix) ma stál 30 hodín prekročenia = ~2 100 EUR strata oproti hodinovke. Pri eshope C (hodinovka) klient zaplatil o **64 %** viac než odhad — vzťah ostal, ale ďalšia ponuka už nešla. Eshop D a E (hybrid) — všetci spokojní, vrátane mňa.

## Ako to predstaviť klientovi (šablóna)

```
Pre váš projekt navrhujem hybridný model:

CORE SCOPE (fix): 8 500 EUR — pokrýva [zoznam]
EXTRAS (hodinovka @ 70 EUR/h): pre veci mimo core scope

Prečo hybrid:
- Vy máte istotu ceny pre hlavnú časť projektu
- Ja môžem férovo fakturovať dodatočné požiadavky bez nutnosti
  revidovať celú zmluvu
- Tento model si vybralo 80 % mojich klientov

Ak preferujete striktný fix, viem pripraviť aj tú variantu — ale:
- Cena bude o ~25 % vyššia (zahŕňa buffer pre potenciálne zmeny)
- Akákoľvek zmena mimo dohodnutého scope = nová zmluva (spomalenie)

Hodinovku viem ponúknuť tiež, ale len pre projekty s vysokou neistotou
(custom integrácie, R&D, MVP). Pre váš eshop ju neodporúčam.
```

Klient si v 90 % prípadov vyberie hybrid. Zvyšných 10 % sú buď zákazníci, ktorí trvajú na fixe (a zaplatia prémiu), alebo veľmi technickí, ktorí preferujú hodinovku s pravidelnými týždennými check-inmi.

## Buffer a rezerva

V každom modeli zarátaj buffer — minimum 15 %, ideálne 20 %.

- Fix: pridaj 15 – 20 % k odhadovaným hodinám pred vynásobením hodinovkou
- Hybrid: pridaj 10 % k fixnému základu + plnú flexibilitu v hodinovkových extras
- Hodinovka: 5 % buffer na administratívu a komunikáciu (nedá sa fakturovať každý e-mail)

Bez buffera je fixná cena ako ruská ruleta.

## Ako naformulovať scope buffer

V zmluve (alebo ponuke) dohodni:

- **Revízie:** „2 kolá revízií dizajnu. 3. kolo @ 70 EUR/h.“
- **Limit stretnutí:** „Týždenný 30-min check-in v cene. Ad-hoc stretnutia nad 2 h/mesiac @ 70 EUR/h.“
- **Reakčný čas:** „Odpoveď na e-mail do 48 h. Urgentné (production down) telefonicky.“
- **Mimo scope:** „Písanie obsahu, úprava fotiek a branding nie sú zahrnuté.“

Klient toto **podpíše**. Bez podpísanej zmluvy (alebo aspoň e-mailového potvrdenia) sa scope obhajuje slovo proti slovu.

## Daňová poznámka pre Slovensko

Ako SZČO (živnostník) v roku 2026:

- 15 % daň z príjmu (do 100 000 EUR základu dane) + 16 % zdravotné + 33,15 % sociálne z vymeriavacieho základu. Pozor: odvody sa neplatia z každého vyfakturovaného eura ako daň — počítajú sa z vymeriavacieho základu s minimálnymi a maximálnymi hranicami. V praxi ti z hrubej hodinovky na čistý zárobok ostane zhruba 55 – 65 %, podľa výšky príjmu.
- Pri fakturácii 60 EUR/h hrubého ostáva rádovo ~36 EUR/h čistého
- Pri 80 EUR/h hrubého rádovo ~48 EUR/h čistého

Ak chceš zarobiť 40 EUR/h čistého, fakturuj minimálne 70 EUR/h. Pre s.r.o. počítaj s inou daňovou štruktúrou (daň z príjmu PO 10 % do 100 000 EUR, nad túto hranicu 21 %, plus zdanenie dividend).

## TL;DR

Tri modely: hodinovka (nejasný scope, priateľská k devovi), fix (jasný scope, komfort klienta, riziko devovi), hybrid (80 % projektov, win-win). Pravidlo: <30 % scope drift = fix, 30 – 60 % = hybrid, >60 % = hodinovka. Vždy 15 – 20 % buffer. Pre malý eshop je najlepšia voľba hybrid s fixným základom 8 – 12 tis. EUR + hodinovkou 70 EUR/h. Za predvídateľnosť klient platí ~25 % prémiu — to je férové.
