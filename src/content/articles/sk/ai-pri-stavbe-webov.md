---
title: "Ako používam AI pri stavbe webov — a kde mu neverím"
date: 2027-01-19
read: 8
tags: ["AI"]
excerpt: "Kde mi AI reálne šetrí hodiny, kde ho púšťam len na krátku vodítku a kde ho k projektu nepustím vôbec. Bez hype, s overenými číslami."
featured: false
---

AI je dnes v mojom workflow tak samozrejmý ako terminál. Ale nemám k nemu žiadny vzťah — je to nástroj, nie kolega. A ako pri každom nástroji: viem, na čo je dobrý, a viem, kde ma dokáže poriadne spáliť. Toto je môj úprimný pohľad na to, kde AI pri stavbe webov púšťam k volantu a kde mu nechávam nanajvýš pravú nohu na plyne, zatiaľ čo riadim ja.

## Krajina nástrojov v 2027 (a prečo na tom záleží)

Trh sa ustálil na troch prístupoch. **GitHub Copilot** je pár programátor priamo v IDE; od júna 2026 prešli všetky plány na usage-based billing s AI kreditmi (Pro obsahuje 15 $/mesiac v kreditoch). **Cursor** je AI-native fork VS Code, Pro za 20 $/mesiac. **Claude Code** je agentický nástroj v termináli, Pro za 20 $/mesiac (alebo 17 $ pri ročnej platbe), Max od 100 $/mesiac.

V praxi väčšina profíkov nekombinuje jeden nástroj, ale niekoľko — bežná zostava je editor s inline návrhmi na dennú prácu plus agentický nástroj na väčšie, viackrokové úlohy. Ja mám podobne. Dôležitý kontextový posun: **Model Context Protocol (MCP)**, ktorý Anthropic vydal v novembri 2024 ako otvorený štandard, sa medzičasom stal de facto normou — v decembri 2025 ho darovali Agentic AI Foundation pod Linux Foundation a beží cez 10 000 MCP serverov v produkcii. Prakticky to znamená, že AI nástroj dnes vie siahnuť na tvoju databázu, CMS alebo issue tracker cez jedno rozhranie namiesto N×M vlastných konektorov.

## Kde AI púšťam k volantu

**Boilerplate a opakujúca sa štruktúra.** Custom post type, register skript, Gutenberg block scaffold, TypeScript typy z JSON payloadu, základné testy. Toto je práca, kde je „správna odpoveď" známa a overiteľná na prvý pohľad. Tu AI šetrí reálne hodiny týždenne.

**Refactoring s jasným zadaním.** Keď presne viem, čo chcem — „premeň tento callback na async/await, zachovaj error handling" — AI to spraví rýchlejšie, než to napíšem ručne. Kľúč je, že výsledok viem prečítať a okamžite posúdiť.

**Prvá verzia dokumentácie a komentárov.** README, JSDoc, commit message. Nie finálne znenie, ale slušný draft, ktorý doladím.

**Rubber-ducking.** Keď sa zaseknem, vysvetliť problém AI-u ma často dovedie k riešeniu skôr, než AI vôbec odpovie. Klasika.

## Kde mu dávam len krátku vodítku

Sem patrí všetko, kde je odpoveď „takmer správna" najnebezpečnejšia — lebo prejde na prvý pohľad a padne až v produkcii.

**Výkonové rozhodnutia.** AI ti s radosťou napíše `<img loading="lazy">` na LCP obrázok — a práve tým ti zhorší Largest Contentful Paint. Prahy Core Web Vitals sú tvrdé fakty, ktoré musíš poznať ty, nie hádať model: LCP dobré do 2,5 s, INP (od marca 2024 nahradil FID) dobré do 200 ms, CLS do 0,1. AI o nich vie, ale nevie o tvojej konkrétnej stránke — takže návrh beriem, ale meriam sám.

**Accessibility.** AI vygeneruje `aria-*` atribúty s prehľadom, lenže polovicu z nich buď netreba, alebo sú vyslovene škodlivé (`aria-label` na `<div>` bez role, redundantné `role="button"` na `<button>`). Referenčný bod je WCAG 2.2 — W3C Recommendation z októbra 2023, aktualizovaná v decembri 2024, a od 21. októbra 2025 aj ISO/IEC 40500:2025. To je štandard, ktorý overujem klávesnicou a screen readerom, nie dôverou v model. Viac v článku [WCAG AA na malom webe: 80 % efekt za 20 % práce](/blog/wcag-aa-80-20/).

**Bezpečnosť.** Sanitizácia vstupov, nonce, capability checks vo WordPresse — tu čítam každý riadok. AI má tendenciu vynechať `wp_verify_nonce()` alebo escapovať až na výstupe „niekedy neskôr".

## Kde ho k projektu nepustím vôbec

**Závislosti, ktoré si sám nevymyslím.** Toto je najkonkrétnejšie riziko a mám k nemu tvrdé dáta. Na USENIX Security 2025 tím z UTSA, University of Oklahoma a Virginia Tech vygeneroval 2,23 milióna vzoriek kódu naprieč 16 modelmi — a **19,7 % obsahovalo aspoň jeden halucinovaný názov balíčka**. Horšie: pri desaťnásobnom opakovaní tej istej prompty sa 43 % halucinovaných názvov zopakovalo pri každom behu. To je predvídateľné, a preto zneužiteľné — vznikol z toho útok zvaný **slopsquatting**, kde niekto zaregistruje halucinovaný názov a čaká, kým ho niekomu AI navrhne.

Preto mám pravidlo: každý `import`/`require`, ktorý nepoznám, overím manuálne, než ho pustím do `package.json`. Rýchla kontrola pred inštaláciou:

```bash
# Overí, či balíček reálne existuje na npm a odkedy
npm view react-codeshift 2>/dev/null \
  && echo "existuje" \
  || echo "POZOR: balíček neexistuje — nepridávaj slepo"
```

A v CI radšej zamknem strom závislostí, nech mi žiadny „nový kamarát" nepretečie do buildu:

```bash
# lockfile musí sedieť; inak build padne (nie tichá inštalácia)
npm ci
```

**Architektonické rozhodnutia.** Astro vs Next.js, headless vs monolit, kedy Server Components — to sú rozhodnutia s dlhým chvostom dôsledkov, ktoré závisia od kontextu klienta, rozpočtu a tímu. AI ti dá priemer internetu; ja potrebujem rozhodnutie pre tento projekt. Ak sa v tom motáš, mám k tomu [rozhodovaciu tabuľku Astro vs Next.js](/blog/astro-vs-nextjs-tabulka/).

**Finálny obsah, ktorý má reprezentovať klienta.** Google po March 2024 a auguste 2025 pritvrdil na scaled AI obsah bez E-E-A-T signálov. Detailne to rozoberám v [AI content vs Google E-E-A-T](/blog/ai-content-eeat/) — v skratke: AI draft áno, AI ako autor nie.

## Ako to mám nastavené v praxi

Dve veci robia najväčší rozdiel v kvalite výstupu.

Po prvé, **kontext**. AI bez kontextu tvojho projektu háda; s kontextom je oveľa presnejší. V Claude Code na to slúži `CLAUDE.md` v koreni repa — súbor s konvenciami, ktorý sa načíta do každej session. Krátka ukážka:

```markdown
# Konvencie
- PHP 8.1, jedna trieda/súbor, `declare(strict_types=1)`.
- Žiadne nové npm balíčky bez môjho súhlasu.
- Pred „hotovo": lint + celá test suita zelená.
```

Po druhé, **verifikácia pred „hotovo"**. Žiadny AI výstup nepovažujem za dokončený, kým neprebehne lint, testy a — pri UI — vizuálna kontrola v prehliadači. Model rád napíše „✅ opravené", aj keď test padá. Dôkaz pred tvrdením, vždy.

## Záver: nástroj, nie orákulum

AI mi zrýchlil rutinu asi o tretinu a uvoľnil hlavu na veci, ktoré ho nezaujímajú — architektúru, výkon, prístupnosť, vzťah s klientom. Presne tam, kde je moja pridaná hodnota. Neverím mu na závislosti, na bezpečnosť a na rozhodnutia s dlhými dôsledkami. A to nie je nedôvera z princípu — je to inžinierska hygiena. Nástroj, ktorý v pätine prípadov vymyslí neexistujúci balíček, si jednoducho zaslúži, aby si po ňom čítal každý riadok.
