---
title: "Cenotvorba pre malé eshopy: hodinovka vs fix vs hybrid"
date: 2026-05-02
read: 8
tags: ["Process"]
excerpt: "3 modely, jedno rozhodovacie pravidlo: <30 % scope drift = fix, 30-60 % = hybrid, >60 % = hourly. Plus reálne čísla z 5 eshop projektov."
featured: true
---

Nový klient, malý eshop, "potrebujeme web". Tri spôsoby, ako mu to fakturovať. Každý má iný risk profil, inú prácu pre teba a inú dôveru u klienta.

Toto je rozhodovací rámec, ktorý používam posledné 3 roky. Plus reálne čísla z 5 eshop projektov.

## Model 1: Hourly (hodinovka)

**Cena:** €60–€90/h pre Bratislavu, €45–€70/h pre menšie mestá. SME (samostatne zárobkovo činná osoba) alebo s.r.o. fakturuje plus 20% DPH (ak je platiteľ).

**Vhodné keď:**
- Scope je fuzzy ("postavme MVP a uvidíme")
- Klient chce iteratívne pracovať, neustále feedback
- Projekt má vysoký engineering risk (custom integrácie, headless CMS, AI)

**Risk pre dev:** žiadny — fakturuješ čo robíš.
**Risk pre klienta:** vysoký — nepozná finálnu cenu.

**Komunikácia:** "Účtujem €75/h, fakturujem každé 2 týždne s detailným time-logom. Limit pred eskaláciou: 80h, potom prejdeme delivery review."

Klient bude tlačiť na predvídateľnosť. Daj mu **estimate v rangoch** (40-60h pre časť A, 20-30h pre časť B), ale neobjednávaj mu fixed price na hourly projekt — to je sebevražda pre obe strany.

## Model 2: Fixed (fix cena)

**Cena:** €4 000 – €15 000 pre malý/stredný eshop. Záleží od:

- Počet produktov (do 50 / 50-500 / 500+)
- Custom funkcionalita (iba katalog vs subskripcie + member area)
- Integrácie (Mailchimp / Klaviyo / účtovníctvo / sklad)
- Design (template-based / semi-custom / fully custom)

Konkrétny breakdown jedného mojho eshopu (€11 500 fix):

| Časť | Hours | Hodinovka | Cena |
|---|---|---|---|
| Discovery + brief + design system | 12h | €70 | €840 |
| WooCommerce setup + theme custom | 28h | €70 | €1960 |
| 80 produktov import + content | 16h | €60 | €960 |
| Checkout + platby (Stripe + GoPay) | 18h | €80 | €1440 |
| E-mail flow (Klaviyo) | 14h | €70 | €980 |
| SEO + analytics + GTM | 10h | €70 | €700 |
| QA + bug fixes | 12h | €60 | €720 |
| **Buffer (15 %)** | 16h | €70 | €1120 |
| Project management | 14h | €70 | €980 |
| Training + handover | 6h | €60 | €360 |
| **Spolu** | **146h** | **~€79** | **€10 060** |

Plus 15 % business buffer (overruns, klientove zmeny mimo scope) = €11 569 → zaokrúhlené na **€11 500 fix**.

**Vhodné keď:**
- Scope je jasný (5+ stránok briefov, mockupy)
- Klient chce predvídateľnú cenu
- Robil si podobný projekt 3+ × predtým (vieš odhadnúť)

**Risk pre dev:** vysoký — overrun ide z tvojho vrecka.
**Risk pre klienta:** nízky — vie cenu.

**Klient comfort = +30 % cena.** Klient platí premium za predvídateľnosť. To je férové, lebo ty platíš premium za risk.

## Model 3: Hybrid (fix base + hourly extras)

**Setup:** fix cena za core scope (€6-12k), plus hourly rate (€60-80/h) pre everything mimo scope-u.

**Príklad ponuky:**

```
Core scope (FIX): €8 500
- 5 stránok web + WooCommerce
- 80 produktov
- Checkout + 2 platby
- E-mail flow setup (1 sequence)
- SEO setup

Mimo scope (HOURLY @ €70/h):
- Dodatočné e-mail sequences
- Custom integrácie (sklad, účtovníctvo)
- Foto editing
- Content písanie
- Future features po launch-i
```

**Vhodné pre 80 % projektov.** Klient dostane fix cenu za jasnú časť, ty máš escape hatch pre veci, ktoré klient povie "ešte to malé".

Change request flow:

1. Klient povie "ešte chcem X"
2. Ty napíšeš e-mail: "X-ko nie je v core scope. Estimate 3-5h, t.j. €210-€350. Schváľ a fakturujem ako extra."
3. Klient odsúhlasí písomne (e-mail stačí)
4. Ty implementuješ a fakturuješ

Bez tohto flow-u sa hybrid zmení na pseudo-fix s neobmedzenými revíziami.

## Rozhodovacie pravidlo

Ja používam jednoduchý heuristic:

- **<30 % scope drift očakávaný** (jasný brief, robil som podobné) → **fix**
- **30-60 % scope drift** (priemerný projekt, klient ešte mení názor) → **hybrid**
- **>60 % scope drift** (nový tech, vágny brief, R&D) → **hourly**

Scope drift = % work mimo pôvodne dohodnutého. Odhadom z minulých projektov, nie scientific number.

Pre malé eshopy je v 70 % prípadov **hybrid** najlepšia voľba. Klient dostane zelenú v cene, ty dostaneš escape hatch.

## Reálne čísla z 5 eshop projektov

| Projekt | Model | Pôvodná cena | Finálna cena | Drift | Spokojnosť |
|---|---|---|---|---|---|
| Eshop A (50 prod, beauty) | Fix | €7 500 | €7 500 | 0 % | OK pre obe strany |
| Eshop B (200 prod, fashion) | Fix | €11 500 | €11 500 | 0 % | OK, ale **moja overrun ~30h** (vlastný cost) |
| Eshop C (B2B, custom) | Hourly | €5 000 odhad | €8 200 | +64 % | Klient sklamaný cenou |
| Eshop D (300 prod, foods) | Hybrid | €9 000 + €1 800 extras | €10 800 | +20 % | **Najlepší** — klient happy |
| Eshop E (subskripcie) | Hybrid | €12 000 + €3 200 extras | €15 200 | +27 % | Klient happy, ja happy |

Eshop B (fix) ma stál 30 hodín overrun = ~€2100 strata oproti hourly. Eshop C (hourly) klient zaplatil **64 %** viac než odhad — vzťah ostal, ale čerstvá ponuka už nešla. Eshop D a E (hybrid) všetci spokojní, vrátane mňa.

## Ako predstaviť klientovi (template)

```
Pre váš projekt navrhujem hybrid model:

CORE SCOPE (fix): €8 500 — pokrýva [list]
EXTRAS (hourly @ €70/h): pre veci mimo core scope-u

Prečo hybrid:
- Vy máte istotu ceny pre hlavnú časť projektu
- Ja mám možnosť fakturovať férovo dodatočné požiadavky bez nutnosti revidovať celú zmluvu
- 80 % mojich klientov si vybralo tento model

Ak preferujete striktný fix, viem pripraviť aj tú variantu — ale:
- Cena bude o ~25 % vyššia (zahrnuje buffer pre potenciálne zmeny)
- Akákoľvek zmena mimo dohodnutého scope-u = nová zmluva (slow-down)

Hourly model viem ponúknuť tiež, ale len pre projekty s vysokou neistotou
(custom integrácie, R&D, MVP). Pre váš eshop sa neodporúčam.
```

Klient si vyberie 90 % prípadov hybrid. Ostávajúci 10 % sú buď zákazníci, ktorí trvajú na fix (a zaplatia premium), alebo veľmi technickí, ktorí preferujú hourly s rolling weekly check-ins.

## Buffers a contingency

V každom modeli zarátaj buffer — minimum 15 %, ideálne 20 %.

- Fix: pridaj 15-20 % na quoted hours pred násobením rate-om
- Hybrid: pridaj 10 % na fix base + plnú flexibilitu v hourly extras
- Hourly: 5 % buffer na admin / komunikáciu (lebo neviete fakturovať každý e-mail)

Bez buffer-u je fix cena hra na russian roulette.

## Scope buffer formulácie

V kontrakte (alebo proposal-e) dohodni:

- **Revízie:** "2 kolá revízií dizajnu. 3. kolo @ €70/h."
- **Meeting cap:** "Týždenný 30-min check-in v cene. Ad-hoc meetings nad 2h/mesiac @ €70/h."
- **Response time:** "E-mail response do 48h. Urgent (production down) phone call."
- **Out of scope:** "Content písanie, foto editing, branding nie sú zahrnuté."

Klient toto **podpíše**. Bez podpísaného contract-u (alebo aspoň e-mail acknowledge-u) sa scope obhajuje slovom proti slovu.

## Daňová poznámka pre Slovensko

Ako SZČO (živnostník) v 2026:

- 19 % daň + 14 % zdravotné + 25 % sociálne (efektívne ~40 % na netto)
- Pre €60/h gross fakturáciu = ~€36/h netto
- Pre €80/h gross = ~€48/h netto

Ak chceš zarobiť €40/h netto, fakturuj minimum €70/h. Pre s.r.o. počítaj inú daňovú štruktúru (21 % daň z príjmu PO + dividendy).

## TL;DR

3 modely: hourly (fuzzy scope, dev-friendly), fix (clear scope, klient comfort, dev risk), hybrid (80 % projektov, win-win). Pravidlo: <30 % scope drift = fix, 30-60 % = hybrid, >60 % = hourly. Vždy 15-20 % buffer. Pre malý eshop je hybrid s €8-12k base + €70/h extras najlepšia voľba. Za predvídateľnosť klient platí ~25 % premium — to je férové.
