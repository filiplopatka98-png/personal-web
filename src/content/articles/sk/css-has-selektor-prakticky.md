---
title: "CSS :has() v praxi: rodičovský selektor bez JavaScriptu"
date: 2026-08-07
read: 7
tags: ["CSS", "Accessibility"]
excerpt: "Roky sme počúvali, že CSS nemá rodičovský selektor. :has() to zmenil — a je to už dva roky Baseline. Štyri reálne use-casy namiesto hračkárskych demos, plus gotchas, ktoré ťa môžu stáť celé pravidlo."
featured: false
faq:
  - q: "Čo robí CSS selektor :has()?"
    a: "Ide o relačný pseudo-selektor, ktorý vyberie rodičovský alebo predchádzajúci prvok na základe toho, či obsahuje iný prvok zodpovedajúci zadanej podmienke — napríklad a:has(img) vyberie odkaz, ktorý obsahuje obrázok. Predtým sa toto dalo riešiť len JavaScriptom, ktorý ručne pridával a odoberal triedy typu has-error. :has() túto limitáciu odstraňuje a umožňuje čisto CSS riešenia napríklad pri validácii formulárov, podmienenom layoute alebo reakcii na natívny open/checked stav."
  - q: "Funguje :has() vo všetkých prehliadačoch?"
    a: ":has() je Baseline Widely available od decembra 2023, s minimálnou podporou od Chrome/Edge 105, Firefox 121 a Safari 15.4. Ak nepodporuješ prehliadače spred roku 2023, dá sa písať bez váhania. Pre staršie prehliadače sa dá pridať fallback cez @supports not selector(:has(...))."
  - q: "Prečo môže jedna chyba v :has() zhodiť celé CSS pravidlo?"
    a: "Na rozdiel od :is() a :where(), ktoré používajú takzvaný forgiving selector list a ignorujú len nepodporovanú časť, je :has() podľa MDN unforgiving selector list. Ak čo i len jeden argument vnútri :has() prehliadač nevie spracovať — preklep, nepodporovaný pseudo-element, budúca syntax — padne celé pravidlo, nielen tá jedna časť. :has() sa navyše nedá vnoriť do seba a pseudo-elementy nie sú platné ani ako jeho argument, ani ako kotviaci prvok pred ním."
  - q: "Prečo je selektor typu body:has(...) pomalý?"
    a: "Selektor A:has(B) musí pri vyhodnocovaní prejsť celý podstrom A a hľadať v ňom B, takže čím širší je kotviaci prvok (napríklad body, :root alebo *) a čím menej obmedzený je B, tým väčší podstrom sa prehľadáva pri každom re-styli. MDN preto odporúča kotviť na užšom kontajneri a obmedzovať B kombinátorom priameho potomka alebo súrodenca, napríklad :has(> .item) namiesto :has(.item). Pri malých komponentoch je to zanedbateľné, pri veľkých zoznamoch stoviek či tisícok prvkov sa to už oplatí merať."
---

`:has()` je CSS rodičovský (relačný) selektor — `A:has(B)` vyberie `A`, ak obsahuje niečo zodpovedajúce `B` — a je to už dva roky Baseline „Widely available", takže sa dá bez váhania nasadiť v produkcii. Roky pritom platilo, že „CSS nevie vybrať rodiča na základe potomka", a obchádzali sme to JS triedami typu `.has-error` alebo `.is-active`, ktoré niekto musel ručne pridávať a odoberať. `:has()` túto limitáciu odstránil — nie je to hračka na CodePen demá, je to selektor, ktorým dnes reálne nahrádzam desiatky riadkov JS v projektoch, kde predtým nebola iná možnosť.

Tento článok nie je úvod do syntaxe. Je to zoznam prípadov, kde `:has()` skutočne nahradil JavaScript v produkčnom kóde, plus gotchas, na ktoré som narazil — vrátane jedného, ktorý ti vie potichu zhodiť celé CSS pravidlo.

## Čo `:has()` robí a odkedy naň môžeš spoľahnúť

`:has()` je relačný pseudo-selektor: `A:has(B)` vyberie `A`, ak `A` obsahuje (alebo je pred ním v DOM strome, podľa kombinátora) niečo, čo zodpovedá `B`. Najjednoduchší príklad — `a:has(img)` vyberie odkaz, ktorý obsahuje obrázok.

Podpora už nie je téma na diskusiu. `:has()` je **Baseline „Widely available"** od decembra 2023 ([developer.mozilla.org/.../:has](https://developer.mozilla.org/en-US/docs/Web/CSS/:has)), s minimálnou podporou od Chrome/Edge 105, Firefox 121 a Safari 15.4 ([caniuse.com/css-has](https://caniuse.com/css-has)). Ak nepodporuješ prehliadače spred roku 2023, môžeš ho písať bez váhania. Ak áno, nižšie je sekcia o `@supports` fallbacku. Rovnaký prístup „nasaď a nechaj staršie prehliadače spadnúť na normálne správanie" používam aj pri [Speculation Rules API pre okamžitú navigáciu](/blog/speculation-rules-instant-navigacia/).

## 1. Validácia formulára bez JS triedy

Klasika, ktorú som predtým riešil `input`/`change` listenerom pridávajúcim `.field--error`. Dnes stačí CSS:

```css
.field {
  --field-color: var(--gray-600);
}

.field:has(input:invalid:not(:placeholder-shown)) {
  --field-color: var(--red-600);
}

.field:has(input:focus-visible) {
  --field-color: var(--blue-600);
}

.field-label {
  color: var(--field-color);
}

.field:has(input:invalid:not(:placeholder-shown)) .field-error {
  display: block;
}
```

Dôležitý detail, na ktorý sa ľahko zabúda: samotné `:invalid` je pravdivé aj pre prázdne povinné pole hneď po načítaní stránky — takže bez `:not(:placeholder-shown)` (alebo ekvivalentu) by si červenou farbou vítal používateľa skôr, než čokoľvek napísal. Kombinácia `:invalid:not(:placeholder-shown)` je jednoduchý spôsob, ako to obmedziť na polia, ktorých sa používateľ už dotkol. Kompletný prehľad chýb pri prístupných formulároch — vrátane toho, prečo placeholder nesmie nahrádzať label — mám v [Prístupné formuláre: chyby, ktoré robí 90 % webov](/blog/pristupne-formulare/).

## 2. Karta, ktorá vie, že má obrázok

Bežný problém v CMS-kách: karta produktu alebo článku niekedy má obrázok, niekedy nie, a layout musí fungovať pre oba prípady bez toho, aby šablóna renderovala dve rôzne verzie HTML.

```css
.card {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

.card:has(img) {
  grid-template-columns: 96px 1fr;
  align-items: start;
}

.card:has(img) .card-body {
  align-self: center;
}
```

Predtým to znamenalo buď dve varianty komponentu, alebo JS, ktorý po vyrenderovaní skontroluje `card.querySelector('img')` a pridá triedu. Teraz je to jeden CSS blok a šablóna sa vôbec nemusí starať o to, či obrázok existuje.

## 3. Kompaktný rad filtrov podľa počtu položiek

Toto je prípad, kde `:has()` reaguje na *počet* detí cez `:nth-child()` — užitočné pri aktívnych filtroch na eshope, kde chceš prepnúť layout, keď ich pribudne priveľa:

```css
.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Od siedmeho filtra prepni na horizontálny scroll a ukáž tlačidlo "viac" */
.active-filters:has(> :nth-child(7)) {
  flex-wrap: nowrap;
  overflow-x: auto;
}

.active-filters:has(> :nth-child(7)) .filters-more-btn {
  display: inline-flex;
}
```

Podobný trik funguje aj opačne — na skrytie prázdneho stavu bez toho, aby si počítal položky v JS: `.results-list:not(:has(li)) { display: none; }` a vedľa neho zobrazíš `.results-empty`. Pri faceted filtroch na väčšom eshope ale nezabudni na výkon — o tom nižšie, a o riešení filtrovania na tisíckach produktov bez Elasticsearch píšem v [Faceted filtre na eshope, ktoré nelagnú](/blog/faceted-filtre-bez-elasticsearch/).

## 4. Hlavička, ktorá reaguje na otvorené mobilné menu

Natívny `<details>` je čoraz bežnejší spôsob, ako spraviť rozbaľovacie mobilné menu bez JS. `:has()` dovolí štýlovať okolie podľa toho, či je otvorené:

```css
.site-header:has(> details[data-nav-menu][open]) {
  border-bottom-color: var(--border-strong);
}

.site-header:has(> details[data-nav-menu][open]) .nav-backdrop {
  display: block;
}
```

Zamknutie scrollu na `<body>`, keď je menu otvorené, je jeden z mála prípadov, kde má zmysel siahnuť aj po širšom kotviacom prvku napriek výkonovej cene (viac nižšie):

```css
body:has(details[data-nav-menu][open]) {
  overflow: hidden;
}
```

Toto rieši len vizuálny stav — nie focus trap ani zatváranie cez Escape. Ak stavíš na vlastný `<dialog>` alebo modal namiesto `<details>`, focus management je samostatná téma a `:has()` ju nenahradí — mám na ňu vzor v [Focus management v custom dialógoch](/blog/focus-management-dialog/), vrátane toho, kedy je lepšie siahnuť po natívnom `<dialog>`.

## Nezhovievavý selektor: jedna preklepnutá časť zhodí celé pravidlo

Toto je gotcha, ktorá ma raz stála hodinu debugovania. `:is()` a `:where()` sú **forgiving selector list** — ak jeden zo selektorov v zozname prehliadač nepozná, jednoducho ho ignoruje a zvyšok funguje ďalej. `:has()` je podľa MDN **unforgiving selector list** ([developer.mozilla.org/.../:has](https://developer.mozilla.org/en-US/docs/Web/CSS/:has)) — ak čo i len jeden argument vnútri `:has()` prehliadač nevie spracovať (preklep, nepodporovaný pseudo-element, budúca syntax), padne **celé pravidlo**, nielen tá časť.

```css
/* Ak prehliadač nepozná ::before ako argument :has(), CELÉ pravidlo sa ignoruje */
.card:has(img, ::before) {
  border-color: var(--accent);
}
```

Ďalšie dve tvrdé obmedzenia priamo zo špecifikácie a MDN: `:has()` sa nedá vnoriť do seba (`:has(:has(...))` nie je platné) a pseudo-elementy nie sú platné ani ako argument vnútri `:has()`, ani ako kotviaci prvok pred ním — kvôli riziku cyklickej závislosti, keďže veľa pseudo-elementov existuje podmienene podľa štýlovania rodiča.

## Špecifickosť a výkon: prečo `body:has(...)` bolieť môže

`:has()` má špecifickosť najšpecifickejšieho selektora zo svojich argumentov — rovnako ako `:is()` a `:not()`. Prekvapenia tu väčšinou nie sú v špecifickosti, ale vo výkone.

Selektor `A:has(B)` musí pri vyhodnocovaní prejsť celý podstrom `A` a hľadať `B`. Čím širší je kotviaci prvok `A` a čím menej obmedzený je `B`, tým väčší podstrom prehliadač prehľadáva pri každom re-styli. MDN preto explicitne odporúča vyhýbať sa širokým kotvám ako `body:has(...)`, `:root:has(...)` alebo `*:has(...)` a namiesto toho kotviť na užšom kontajneri — a kde sa dá, obmedziť `B` kombinátorom priameho potomka alebo súrodenca (`:has(> .item)` namiesto `:has(.item)`), aby sa prehľadávanie zastavilo skôr ([developer.mozilla.org/.../:has](https://developer.mozilla.org/en-US/docs/Web/CSS/:has)). Presne preto som v prípade menu vyššie kotvil na `.site-header`, nie na `body` — a to `body:has(...)` pre zamknutie scrollu ponechal ako vedomú výnimku, nie ako predvolený návyk.

Pri malých komponentoch (karta, pole formulára, položka zoznamu) je to zanedbateľné. Pri veľkých zoznamoch — stovky riadkov tabuľky, tisícky produktov vo výpise — sa to už oplatí merať, nie len predpokladať.

## Progresívne vylepšenie cez `@supports selector()`

Ak fallback pre staré prehliadače naozaj potrebuješ (nie len „pre istotu"), `@supports` má na to presne stavaný nástroj — `selector()`:

```css
ul:has(> li li) {
  /* aplikuje sa len tam, kde je :has() podporované */
}

@supports not selector(:has(a, b)) {
  /* fallback pre prehliadače bez :has() */
  ul > li,
  ol > li {
    /* rozpísaná náhrada */
  }
}
```

([developer.mozilla.org/.../@supports](https://developer.mozilla.org/en-US/docs/Web/CSS/@supports)) V praxi to väčšinou nepotrebuješ pre vizuálne detaily (farba labelu, border karty) — degradácia na „nič sa nestane" je v poriadku. Potrebuješ to len tam, kde bez `:has()` prídeš o funkčnosť, nielen o štýl.

## Kedy siahnuť po `:has()` a kedy nie

`:has()` je najsilnejší presne tam, kde predtým jediná alternatíva bola JS trieda pridávaná/odoberaná pri každej zmene stavu — validácia formulára, podmienený layout podľa obsahu, reakcia na natívny `open`/`checked` stav. Nenahrádza JS všade — focus trap, klávesová navigácia či network stav sú stále na JS. A pri každom novom selektore, ktorý pridáš, stojí za to prejsť si aj základný a11y checklist, nielen vizuálny výsledok — mám ho zhrnutý v [WCAG AA na malom webe: 80 % efekt za 20 % práce](/blog/wcag-aa-80-20/). `:has()` ti dá čistejšie CSS. Prístupnosť aj tak musíš overiť sám.
