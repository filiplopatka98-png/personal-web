---
title: "WCAG AA on a Small Site: 80% of the Effect for 20% of the Work"
date: 2025-12-03
read: 7
tags: ["Accessibility", "Process"]
excerpt: "10 fixes that cover 80% of the findings from an axe-core audit. No WCAG certificate, no consultant — just a realistic minimum for a small business."
featured: false
---

WCAG 2.2 has 86 success criteria. A full AA audit from a certified consultant runs 3,000 EUR and up. For a small business, that's a pointless investment. But **doing nothing** means 1) you're inaccessible to a slice of the population with disabilities, 2) in the EU you're violating the European Accessibility Act (in force since June 28, 2025, covering e-commerce among other things), and 3) your Lighthouse Accessibility score is an indirect quality signal.

These are the 10 fixes that cover **80% of the findings** from a typical axe-core audit. Implementation: one day of work on a small site.

## 1. Alt text on every `<img>`

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

Critical: decorative images (backgrounds, dividers) MUST have `alt=""`, not a missing alt. An empty alt means "ignore me"; a missing alt lets the screen reader read out the filename.

Generating alt text at scale? See my take on [image alt text from AI](/en/blog/ai-alt-text-seo/) — it saves hours but has SEO gotchas.

## 2. Form labels tied to inputs

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

A placeholder is **not** a label. Once the user starts typing, the placeholder disappears and the screen reader no longer knows what the field was for.

## 3. Heading hierarchy

One `<h1>` per page, no skipped levels.

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

This breaks most often in WordPress page builders (Elementor, Divi), where you drag in a "heading" widget without watching the level. Quick check: in DevTools, run `Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => h.tagName + ': ' + h.textContent.trim().slice(0,50))`.

## 4. Color contrast 4.5:1 (body text) / 3:1 (UI and large text)

The most common mistake: gray text on a white background because it "looks classy." `#999999` on white has a contrast of 2.85:1 — fail. The minimum for body text is `4.5:1`; for large text (18 pt / roughly 24 px, or 14 pt bold) and graphical UI elements, `3:1` is enough (WCAG 1.4.3 and 1.4.11, Level AA).

Tools:

- Chrome DevTools → Inspect element → the color picker shows you the contrast ratio
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- automatic detection in axe DevTools

For brand colors that don't clear the threshold: add a `text-shadow` or change the background behind the text (an overlay), not the text color itself (you'd damage the brand).

## 5. Visible focus indicators

The worst frontend habit: `*:focus { outline: none; }` in reset.css. A keyboard user has no idea where they are.

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

`:focus-visible` instead of `:focus` means the focus ring shows up only during keyboard navigation (not on mouse clicks) — best of both worlds.

## 6. Keyboard navigation order

Tab order = DOM order. If you use `position: absolute` to move elements around visually while they sit in a different order in the DOM, focus jumps around the page chaotically.

Try it: on any page, press Tab and watch the focus ring. If it jumps top-bottom-back-sideways, you have a problem. The fix: correct the DOM order or (as a last resort) rearrange with `tabindex`.

Never use a `tabindex` greater than 0. That reorders the whole page and creates chaos. `tabindex="0"` (add to the Tab order) and `tabindex="-1"` (remove from the Tab order) are the only two values you actually need in practice.

This is exactly the kind of thing that bites you inside custom widgets — I go deeper on [focus management in custom dialogs](/en/blog/focus-management-dialog/).

## 7. "Skip to content" link

A keyboard user shouldn't have to Tab through 30 links in the navigation just to reach the content. A skip link bypasses it:

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

Hidden by default, visible only on focus. A keyboard user gets the skip link as the very first element.

## 8. The `lang` attribute on `<html>`

```html
<html lang="sk">
```

Without it, a screen reader reads Slovak text with English pronunciation. WCAG 3.1.1 Language of Page (Level A — mandatory). A trivial fix, often missing.

If you have a section in another language on the page:

```html
<p>Klient nás kontaktoval s textom: <span lang="en">"How does this work?"</span></p>
```

## 9. Click target at least 24×24 px (and preferably 44×44)

Buttons, links, icons — anything clickable should have a large enough hit area. WCAG 2.5.8 Target Size (Minimum) at Level AA requires a minimum of **24×24 CSS px** (or 24 px of spacing between targets). The stricter 44×44 px threshold is Level AAA (WCAG 2.5.5) and also matches Apple's HIG recommendation for touch targets — which is why in practice we treat it as a sensible goal. On desktop the area is usually fine; on mobile it falls apart.

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

Watch out especially for social media icons in the footer. They're often 16×16, and every third user fails the click.

## 10. Respect `prefers-reduced-motion`

Animations and auto-playing parallax effects cause nausea in people with vestibular disorders.

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

A global override. The user has the system setting on → animations disappear. Without it you fail WCAG 2.3.3 Animation from Interactions (formally Level AAA, but it's a cheap and decent extra).

## Tools

- **axe DevTools** ([Chrome extension](https://chromewebstore.google.com/)) — the best tool for automatic detection. It scans the page and hands you a prioritized list of findings.
- **Lighthouse Accessibility audit** (DevTools → Lighthouse) — built into Chrome, score 0–100.
- **WAVE** ([wave.webaim.org](https://wave.webaim.org/)) — a free online checker.
- **Polypane** ([polypane.app](https://polypane.app/)) — a paid browser for developers with built-in accessibility tools.

## A realistic time estimate

For a site with 20–30 pages, no page builders, clean HTML/CSS:

- Audit via axe DevTools: 30 min
- 10 fixes in a single PR: 4–6 hours
- Re-audit: 15 min
- Lighthouse Accessibility score: from around 75 to 95+

That covers 80% of the problems. The remaining 20% (custom widgets, complex tables, video transcripts) is project-specific, and there you'll need an accessibility consultant or at least half a day of deep auditing.

## TL;DR

10 fixes, one working day, 80% of audit findings solved. Alt text + form labels + heading hierarchy + 4.5:1 contrast + visible focus + Tab order + skip link + `lang` + click target (24×24 AA, ideally 44×44) + reduced motion. Test it with axe DevTools, push it to 95+ with Lighthouse.

Related: [the 10-minute keyboard-only test](/en/blog/keyboard-only-test/) and the [technical SEO checklist that actually moves the needle](/en/blog/seo-checklist-co-pomaha/).
