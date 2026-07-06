---
title: "WCAG AA na malom webe: 80 % efekt za 20 % práce"
date: 2025-12-03
read: 7
tags: ["Accessibility", "Process"]
excerpt: "10 opráv, ktoré pokryjú 80 % nálezov z axe-core auditu. Žiadny WCAG certifikát, žiadny konzultant — len realistické minimum pre malú firmu."
featured: false
---

WCAG 2.2 má 86 úspešnostných kritérií. Plný AA audit od certifikovaného konzultanta stojí 3 000 EUR a viac. Pre malú firmu nezmyselná investícia. Ale **nerobiť nič** = 1) si nedostupný pre časť populácie so zdravotným znevýhodnením, 2) v EÚ porušuješ European Accessibility Act (účinný od 28. júna 2025, vzťahuje sa okrem iného na e-shopy), 3) Lighthouse Accessibility skóre je nepriamy signál kvality.

Toto je 10 opráv, ktoré pokryjú **80 % nálezov** z bežného axe-core auditu. Implementácia: 1 deň práce na malom webe.

## 1. Alt text na všetkých `<img>`

```html
<!-- Zlé: alt chýba úplne -->
<img src="logo.svg">

<!-- Zlé: alt = filename -->
<img src="logo.svg" alt="logo.svg">

<!-- Dobré: popisný alt -->
<img src="logo.svg" alt="Logo firmy ABC">

<!-- Dobré: dekoratívny obrázok, screen reader ho preskočí -->
<img src="ozdoba.svg" alt="" role="presentation">
```

Kritické: dekoratívne obrázky (pozadia, oddeľovače) MAJÚ mať `alt=""`, nie chýbajúci alt. Prázdny alt znamená „ignoruj ma“, chýbajúci alt necháva čítačku obrazovky prečítať názov súboru.

Generuješ alt text vo veľkom? Pozri môj pohľad na [image alt text z AI](/blog/ai-alt-text-seo/) — ušetrí hodiny, ale má SEO riziká.

## 2. Labely formulárov prepojené s inputmi

```html
<!-- Zlé: label visiaci vo vzduchu -->
<span>Email</span>
<input type="email" name="email">

<!-- Dobré: explicitná asociácia -->
<label for="email">Email</label>
<input id="email" type="email" name="email">

<!-- Dobré: implicitná (label obaľuje input) -->
<label>
  Email
  <input type="email" name="email">
</label>

<!-- Dobré: keď nemáš viditeľný label -->
<input type="search" aria-label="Hľadať produkty">
```

Placeholder **nie je** label. Keď používateľ začne písať, placeholder zmizne a čítačka obrazovky už nevie, čo to bolo za pole.

## 3. Hierarchia nadpisov

Jeden `<h1>` na stránku, žiadne preskočenia úrovní.

```html
<!-- Zlé -->
<h1>Hlavná stránka</h1>
<h3>Sekcia A</h3>  <!-- preskočilo h2 -->

<!-- Dobré -->
<h1>Hlavná stránka</h1>
<h2>Sekcia A</h2>
<h3>Pod-sekcia A.1</h3>
<h2>Sekcia B</h2>
```

Toto sa najčastejšie pokazí v WordPress page builderoch (Elementor, Divi), kde pretiahneš „heading“ widget bez kontroly úrovne. Rýchla kontrola: v DevTools spusti `Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => h.tagName + ': ' + h.textContent.trim().slice(0,50))`.

## 4. Kontrast farieb 4,5:1 (bežný text) / 3:1 (UI a veľký text)

Najčastejšia chyba: sivý text na bielom pozadí, lebo „vyzerá decentne“. `#999999` na bielom má kontrast 2,85:1 — fail. Minimum pre bežný text je `4,5:1`, pre veľký text (18 pt / cca 24 px, prípadne 14 pt tučný) a grafické prvky UI stačí `3:1` (WCAG 1.4.3 a 1.4.11, Level AA).

Nástroje:

- Chrome DevTools → Inspect element → color picker ti zobrazí pomer kontrastu
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- automatická detekcia v axe DevTools

Pre brandové farby, ktoré nespĺňajú prah: pridaj `text-shadow` alebo zmeň pozadie pod textom (overlay), nie samotnú farbu textu (poškodíš brand).

## 5. Viditeľné indikátory fokusu

Najhorší nešvár frontendu: `*:focus { outline: none; }` v reset.css. Používateľ na klávesnici nevie, kde sa nachádza.

```css
/* Zlé */
*:focus { outline: none; }

/* Dobré: vlastný focus style */
:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* Pre tlačidlá s vlastným focus */
button:focus-visible {
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.4);
}
```

`:focus-visible` namiesto `:focus` znamená, že focus ring sa zobrazí len pri navigácii klávesnicou (nie pri klikaní myšou) — best of both worlds.

## 6. Poradie navigácie klávesnicou

Poradie Tabu = poradie v DOM. Ak používaš `position: absolute` na vizuálne presúvanie elementov, ale v DOM sú v inom poradí, fokus skáče po stránke chaoticky.

Skús: na akejkoľvek stránke stlač Tab a sleduj focus ring. Ak skáče zhora-zdola-naspäť-bokom, máš problém. Riešenie: opraviť poradie v DOM alebo (v krajnom prípade) preusporiadať cez `tabindex`.

Nikdy nepoužívaj `tabindex` väčší ako 0. To preusporiada celú stránku a vznikne chaos. `tabindex="0"` (zaradiť do poradia Tabu) a `tabindex="-1"` (vyňať z poradia Tabu) sú jediné dve hodnoty, ktoré v praxi potrebuješ.

Presne toto ťa dobehne vo vlastných widgetoch — viac o tom v [focus management v custom dialógoch](/blog/focus-management-dialog/).

## 7. Skip-link „preskočiť na obsah“

Používateľ na klávesnici nemusí Tabom prekliknúť cez 30 odkazov v navigácii, aby sa dostal k obsahu. Skip-link to obíde:

```html
<body>
  <a href="#main" class="skip-link">Preskočiť na hlavný obsah</a>
  <header>...</header>
  <nav>...</nav>
  <main id="main" tabindex="-1">
    <h1>Stránka</h1>
    ...
  </main>
</body>
```

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #0066cc;
  color: white;
  padding: 8px 16px;
  z-index: 100;
}
.skip-link:focus {
  top: 0;
}
```

Predvolene skrytý, viditeľný len pri fokuse. Používateľ na klávesnici dostane skip-link ako prvý element.

## 8. Atribút `lang` na `<html>`

```html
<html lang="sk">
```

Bez toho čítačka obrazovky prečíta slovenský text anglickou výslovnosťou. WCAG 3.1.1 Language of Page (Level A — povinné). Triviálna oprava, často chýba.

Ak na stránke máš sekciu v inom jazyku:

```html
<p>Klient nás kontaktoval s textom: <span lang="en">"How does this work?"</span></p>
```

## 9. Klikacia plocha aspoň 24×24 px (a radšej 44×44)

Tlačidlá, odkazy, ikony — všetko klikateľné má mať dostatočne veľkú klikaciu plochu. WCAG 2.5.8 Target Size (Minimum) na úrovni AA žiada minimum **24×24 CSS px** (alebo 24 px rozostupu medzi cieľmi). Prísnejšia hranica 44×44 px je až Level AAA (WCAG 2.5.5) a zároveň zodpovedá odporúčaniu Apple HIG pre dotykové ciele — preto ju v praxi berieme ako rozumný cieľ. Na desktope býva plocha OK, na mobile sa to láme.

```css
/* Zlé: 24px ikona, 24×24 hit area */
.icon-button {
  width: 24px;
  height: 24px;
}

/* Dobré: 24px ikona, 44×44 hit area cez padding */
.icon-button {
  width: 24px;
  height: 24px;
  padding: 10px;
  /* alebo: */
  min-width: 44px;
  min-height: 44px;
}
```

Špeciálne pozor na ikony sociálnych sietí v pätičke. Tie sú často 16×16 a kliknutie zlyháva každému tretiemu používateľovi.

## 10. Rešpektuj `prefers-reduced-motion`

Animácie a automaticky spustené parallax efekty spôsobujú nevoľnosť ľuďom s vestibulárnymi poruchami.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Globálny override. Používateľ má systémové nastavenie → animácie zmiznú. Bez toho zlyháš WCAG 2.3.3 Animation from Interactions (formálne Level AAA, ale je to lacná a slušná vec navyše).

## Nástroje

- **axe DevTools** ([Chrome rozšírenie](https://chromewebstore.google.com/)) — najlepší nástroj na automatickú detekciu. Naskenuje stránku a dá ti zoznam nálezov aj s prioritou.
- **Lighthouse Accessibility audit** (DevTools → Lighthouse) — zabudovaný v Chrome, skóre 0–100.
- **WAVE** ([wave.webaim.org](https://wave.webaim.org/)) — bezplatný online checker.
- **Polypane** ([polypane.app](https://polypane.app/)) — platený prehliadač pre vývojárov, má integrované nástroje na prístupnosť.

## Realistický odhad času

Pre web s 20–30 stránkami, bez page builderov, čistý HTML/CSS:

- Audit cez axe DevTools: 30 min
- 10 opráv v rámci jednej PR: 4–6 hodín
- Re-audit: 15 min
- Lighthouse Accessibility skóre: z cca 75 na 95+

Tým si pokryl 80 % problémov. Zvyšných 20 % (vlastné widgety, zložité tabuľky, prepisy videí) je špecifické pre projekt a tam už potrebuješ konzultanta na prístupnosť alebo aspoň pol dňa hĺbkového auditu.

## TL;DR

10 opráv, jeden pracovný deň, 80 % nálezov z auditu vyriešené. Alt text + labely formulárov + hierarchia nadpisov + kontrast 4,5:1 + viditeľný fokus + poradie Tabu + skip-link + `lang` + klikacia plocha (24×24 AA, ideálne 44×44) + reduced motion. Otestuj cez axe DevTools, dotiahni cez Lighthouse na 95+.

Súvisiace: [keyboard-only test za 10 minút](/blog/keyboard-only-test/) a [technické SEO checklist, ktorý ozaj merateľne pomáha](/blog/seo-checklist-co-pomaha/).
