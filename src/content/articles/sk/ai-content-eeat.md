---
title: "AI content vs Google E-E-A-T: čo ide a čo nie"
date: 2026-04-25
read: 8
tags: ["AI", "SEO"]
excerpt: "Stav 2026: Google March 2024 Core Update aj august 2025 Spam Update pritvrdili na E-E-A-T. Kde má AI v obsahu stále miesto a kde ťa zničí."
featured: false
---

Po Google March 2024 Core Update a august 2025 Spam Update bolo na slovenských affiliate weboch krviprelievanie. Weby s prepadom organického trafficu o 80–95 %, niektoré sa už nikdy nespamätali. Spoločný menovateľ: scaled AI obsah bez E-E-A-T signálov.

V roku 2026 je obraz jasnejší. AI má v obsahu miesto, ale s veľmi konkrétnymi hranicami. Tu je, čo merateľne funguje a čo Google trestá.

## Čo je E-E-A-T (refresh)

- **E**xperience — autor reálne zažil to, o čom píše (recenzia produktu, ktorý používal)
- **E**xpertise — odborné znalosti (lekár píšuci o medicíne, vývojár o kóde)
- **A**uthoritativeness — uznávaná autorita v odbore (publikácie, citácie, profil)
- **T**rustworthiness — overiteľné informácie, transparentnosť, kontakt

Pôvodne E-A-T (od roku 2014), `Experience` pribudlo v decembri 2022. V Google Quality Rater Guidelines sa E-E-A-T tiahne naprieč viac než 100 stranami.

## Čo FUNGUJE (AI ako súčasť workflow)

### 1. AI ako research asistent

Použiť Claude alebo GPT na zhrnutie 5 zdrojov, identifikovanie kľúčových bodov, kontrolu faktov pred písaním. **Výstup je tvoj vlastný text**, AI je len nástroj.

To Google nedeteguje (ani by nemal — v texte nie je žiadny AI výstup) a ušetrí to 30–50 % času na research.

### 2. AI na faktické prepisy (zmena tonality)

Máš už napísaný technický draft. AI ho prepíše do konverzačnej tonality, alebo naopak. Fakty zostávajú, mení sa len jazyk.

To je legitímne editorské použitie. Výstup je stále *tvoj* — AI len mení formu, nie podstatu.

### 3. AI na SEO meta (titulky, popisy, excerpty)

Vygenerovať 5 variantov title tagu na A/B test. Vygenerovať 280-znakový excerpt z vlastného článku. To sú úlohy s nízkou stávkou a nízkou kreativitou, kde AI šetrí čas a nehalucinuje (vstupom je tvoj vlastný obsah).

### 4. AI na alt text (s ľudskou kontrolou)

Detail v [samostatnom článku](/sk/blog/ai-alt-text-seo). Zhrnutie: áno, ale dávku pred nasadením skontroluj.

### 5. AI ako outline a brainstorm

„Daj mi 10 uhlov pohľadu na článok o X." Vyberieš si 1–2, dopíšeš sám. AI hrá rolu brainstormingového partnera, nie autora.

## Čo NEFUNGUJE (Google trestá)

### 1. Články na 100 % z AI bez ľudskej úpravy

Čistý výstup z GPT či Claude, copy-paste, publish. To Google odhalí viacerými signálmi:

- **Detekcia cez perplexity** — AI text má charakteristickú distribúciu pravdepodobností slov
- **Štylometrické vzorce** — nadužívanie určitých spojok („furthermore", „in conclusion", „moreover")
- **Chýbajúce konkrétnosti** — AI píše abstraktne, skutoční autori majú konkrétne čísla, mená, dátumy
- **Burstiness** — ľudský text má premenlivú dĺžku viet, AI má rovnomerne stredne dlhé vety

Google nepriznáva presnú hranicu, ale Quality Rater Guidelines a spam politiky explicitne pomenúvajú „scaled content abuse". March 2024 update spolu s novými spam politikami mal podľa Googlu vyčistiť z výsledkov o 45 % menej nekvalitného a neoriginálneho obsahu.

### 2. AI case studies bez reálneho zázemia

„Ako sme zvýšili traffic o 320 %" napísané AI bez skutočného klienta = čisté porušenie E-E-A-T. `Experience` je nula.

To je obľúbený prešľap affiliate webov — falošné recenzie, falošné články typu „I tried product X for 30 days".

### 3. Vzorce scaled AI farmy

Web, ktorý publikuje 50 článkov denne, všetko AI generované, hocijaká téma, žiadny konzistentný profil autora. Ľahko sa deteguje cez:
- Pomer rýchlosti publikovania k počtu autorov
- Chýbajúcu `Author` schému
- Generické stock fotky ako featured images
- Absenciu vzorcov interného prelinkovania typických pre ľudskú kuráciu

Google v roku 2024 explicitne povedal, že jeho algoritmy cielia na „scaled content abuse". Definícia: „generovanie mnohých stránok primárne na manipuláciu poradia vo vyhľadávaní, s malým alebo žiadnym prínosom pre používateľa".

### 4. AI generovaný YMYL obsah bez odbornej kontroly

YMYL = Your Money or Your Life. Zdravie, financie, právo. Tu má Google najprísnejšie E-E-A-T štandardy.

Medicínsky článok napísaný AI bez kontroly lekárom = pozvánka na demotion. Vidím to na slovenských health weboch — preložené z angličtiny, AI prepis, žiadny kredit pre medicínskeho recenzenta. Viditeľnosť vo vyhľadávaní padá.

## Stratégie, ktoré v roku 2026 fungujú

### Author byline + author schema

Každý článok má reálneho ľudského autora s profilovou stránkou:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "author": {
    "@type": "Person",
    "name": "Filip Lopatka",
    "url": "https://example.sk/autor/filip-lopatka/",
    "sameAs": [
      "https://www.linkedin.com/in/filip-lopatka-wordpress-dev/",
      "https://www.facebook.com/filip.lopatka98"
    ],
    "jobTitle": "WordPress developer",
    "knowsAbout": ["WordPress", "WooCommerce", "Performance"]
  }
}
```

Stránka autora (`/autor/filip-lopatka/`) má bio, kvalifikácie, staršie články. Google to používa na vyhodnotenie signálov Expertise a Authoritativeness.

### Originálny výskum / dáta

Vlastný prieskum (200 respondentov, výsledky publikované), prípadová štúdia s reálnymi číslami, benchmark test (porovnanie 3 hostingov). Google to **veľmi** preferuje — originálne dáta sú niečo, čo AI nevie vygenerovať.

V roku 2026 robia najlepšie fungujúce obsahové marketingy v SK/CZ priestore 1–2 originálne výskumné kúsky za štvrťrok. Nie viac. Kvalita nad frekvenciou.

### Expertné citácie

Aj v článku písanom s pomocou AI ti jedna citácia od skutočného experta s overiteľným kontaktom dvíha dôveryhodnosť:

> „V roku 2026 vidíme posun od server-side renderingu k partial hydration…"  
> — Ján Novák, CTO XYZ s.r.o.

Citácia musí byť reálna, expert musí byť dosiahnuteľný, ideálne má aj vlastnú online prezentáciu (LinkedIn, blog). Inak je to pseudoautorita.

### Disclosure o použití AI

Niektoré seriózne magazíny začali v rokoch 2025/2026 pridávať disclosure pätičku:

> Tento článok vznikol s pomocou AI nástrojov pri researchi. Finálny draft, faktická kontrola a editorská revízia prebehli manuálne.

Google to priamo nebonusuje ani netrestá… ale signalizuje to **dôveru** používateľovi, čo má druhotný efekt na engagement metriky (čas na stránke, scroll depth), ktoré signálmi sú.

### Aktualizuj starý obsah

Refresh článkov každých 6–12 mesiacov. Dátum aktualizácie má SEO váhu, plus *reálny* update (nové dáta, nové linky, opravená informácia) signalizuje, že obsah je živý — niečo, čo „AI farma" typicky nerobí.

## Filtre Google API (čo vieme)

Google sa otvorene nepriznáva ku konkrétnym detekčným metódam, ale verejné vyhlásenia a uniknuté dokumenty (Google Search API leak z marca 2024) odhalili:

- `siteAuthority` skóre na doménu
- `originalContentScore` na stránku
- Kvalitatívne signály zo správania používateľa (pogo-sticking, return-to-SERP rate)
- Sledovanie autora ako entity cez Knowledge Graph

Implikácia: stránka s nízkym E-E-A-T na doméne s nízkym E-E-A-T = dvojitá penalizácia. Naopak autor s vysokým E-E-A-T na etablovanej doméne = základná dôvera aj pri novom článku.

## TL;DR

V roku 2026 nie je AI obsah otázka „áno/nie", ale otázka „ako". AI ako nástroj vo workflow (research, prepisy, meta, alt text) — v poriadku. AI ako autor publikujúci scaled content bez ľudského ownershipu a E-E-A-T signálov — penalizácia čakajúca na svoju chvíľu. Stratégia, ktorá funguje: reálny ľudský autor, originálne dáta, expertné citácie, transparentný proces. AI len urýchľuje, neodoberá ti ownership.
