---
title: "WCAG AA na malom webe: 80 % efekt za 20 % práce"
date: 2025-12-03
read: 7
tags: ["Accessibility", "Process"]
excerpt: "10 fixov, ktoré pokryjú 80 % findings z axe-core auditu. Žiadny WCAG cert, žiadny consultant — len realistický minimum pre malú firmu."
featured: false
---

WCAG 2.2 má 86 success criteria. Plný AA audit od certifikovaného consultanta je €3000+. Pre malú firmu nezmyselná investícia. Ale **nerobiť nič** = 1) si nedostupný pre 15 % populácie, 2) v EÚ porušuješ Accessibility Act (od 2025 platí pre eshopy), 3) Lighthouse Accessibility skóre je v Search Console signál.

Toto je 10 fixov, ktoré pokryjú **80 % findings** z bežného axe-core auditu. Implementácia: 1 deň práce na malom webe.

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

Kritické: dekoratívne obrázky (pozadia, oddeľovače) MAJÚ mať `alt=""`, nie chýbajúci alt. Prázdny alt znamená "ignoruj ma", chýbajúci alt nechá screen reader prečítať filename.

## 2. Form labels asociované s inputmi

```html
<!-- Zlé: label visíaci vo vzduchu -->
<span>Email</span>
<input type="email" name="email">

<!-- Dobré: explicit asociácia -->
<label for="email">Email</label>
<input id="email" type="email" name="email">

<!-- Dobré: implicit (label wrap-uje input) -->
<label>
  Email
  <input type="email" name="email">
</label>

<!-- Dobré: keď nemáš visible label -->
<input type="search" aria-label="Hľadať produkty">
```

Placeholder **nie je** label. Keď user začne písať, placeholder zmizne a screen reader nevie, čo to bolo za pole.

## 3. Heading hierarchy

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

Toto sa najčastejšie pokazí v WordPress page builderoch (Elementor, Divi), kde dropuješ "heading" widget bez kontroly úrovne. Quick check: v DevTools spusti `Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => h.tagName + ': ' + h.textContent.trim().slice(0,50))`.

## 4. Color contrast 4.5:1 (body text) / 3:1 (UI)

Najčastejšia chyba: šedý text na bielom pozadí, lebo "vyzerá decentne". `#999999` na bielom má kontrast 2.85:1 — fail. Minimum pre body text je `4.5:1`, pre veľký text (24px+) `3:1`.

Tools:

- Chrome DevTools → Inspect element → color picker ti zobrazí kontrast ratio
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- axe DevTools auto-detection

Pre brand farby ktoré nesplňujú: pridaj `text-shadow` alebo zmeň pozadie pod textom (overlay), nie samotnú farbu textu (poškodíš brand).

## 5. Focus indicators viditeľné

Najhorší nešvár frontendu: `*:focus { outline: none; }` v reset.css. Klávesnicový user nevie, kde je.

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

`:focus-visible` namiesto `:focus` znamená, že focus ring sa zobrazí len pri klávesnicovej navigácii (nie pri klike myšou) — best of both worlds.

## 6. Keyboard navigation poradie

Tab order = DOM order. Ak používaš `position: absolute` na presúvanie elementov vizuálne, ale v DOM-e sú v inom poradí, tab skáče po stránke chaoticky.

Skús: na akejkoľvek stránke stlač Tab a sleduj focus ring. Ak skáče zhora-zdola-naspäť-bokom, máš problém. Riešenie: opravit DOM order alebo (last resort) `tabindex` reorder.

Nikdy nepoužívaj `tabindex` > 0. To preorderuje celú stránku a vznikne chaos. `tabindex="0"` (zaradiť do tab order) a `tabindex="-1"` (vyňať z tab order) sú jediné dve hodnoty, ktoré v praxi potrebuješ.

## 7. Skip-link "preskočiť na obsah"

Klávesnicový user nemusí Tab-om prekliknúť cez 30 nav linkov, aby sa dostal k obsahu. Skip link to obíde:

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

Defaultne skrytý, viditeľný len pri focusovaní. Tab user dostane skip-link ako prvý element.

## 8. `lang` attribute na `<html>`

```html
<html lang="sk">
```

Bez toho screen reader prečíta slovenský text anglickou výslovnosťou. WCAG 3.1.1 (Level A — povinné). Triviálny fix, často chýba.

Ak na stránke máš sekciu v inom jazyku:

```html
<p>Klient nás kontaktoval s textom: <span lang="en">"How does this work?"</span></p>
```

## 9. Hit area minimálne 44×44px

Tlačidlá, linky, ikony — všetko klikatelné má mať aspoň 44×44 pixelov target area. Pre desktop často OK, na mobile sa to láme.

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

Špeciálne pre social icons v paticke. Tie sú často 16×16 a kliknutie zlyháva každému tretiemu používateľovi.

## 10. Respect `prefers-reduced-motion`

Animácie a auto-play parallax effects spôsobujú nevoľnosť ľuďom s vestibulárnymi poruchami.

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

Globálny override. Užívateľ má system setting → animácie zmiznú. Bez toho zlyháš WCAG 2.3.3.

## Tools

- **axe DevTools** ([Chrome ext](https://chromewebstore.google.com/)) — najlepší auto-detection nástroj. Skenuje stránku, dá ti zoznam findings s priority.
- **Lighthouse Accessibility audit** (DevTools → Lighthouse) — zabudovaný v Chrome, score 0–100.
- **WAVE** ([wave.webaim.org](https://wave.webaim.org/)) — bezplatný online checker.
- **Polypane** ([polypane.app](https://polypane.app/)) — paid browser pre developerov, má integrované A11y tools.

## Realistický timeline

Pre web s 20–30 stránkami, žiadne page buildre, čistý HTML/CSS:

- Audit cez axe DevTools: 30 min
- 10 fixov v rámci jednej PR: 4–6 hodín
- Re-audit: 15 min
- Lighthouse Accessibility skóre: z ~75 na 95+

Tým si pokryl 80 % issues. Zvyšných 20 % (custom widgets, complex tables, video transcripts) je špecifické pre projekt a tam už potrebuješ A11y consultant alebo aspoň pol dňa hĺbkového auditu.

## TL;DR

10 fixov, jeden pracovný deň, 80 % audit findings rieš. Alt text + form labels + heading hierarchy + 4.5:1 kontrast + focus visible + tab order + skip link + `lang` + 44×44 hit area + reduced motion. Otestuj cez axe DevTools, dotiahni cez Lighthouse na 95+.
