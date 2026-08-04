---
title: "CSS :has() in practice: the parent selector without JavaScript"
date: 2026-08-07
read: 7
tags: ["CSS", "Accessibility"]
excerpt: "For decades \"CSS can't select a parent\" was just true. :has() changed that, and it's been Baseline for two years now. Four real use-cases instead of toy demos, plus the gotchas that can quietly drop your whole rule."
featured: false
---

"CSS can't select a parent based on its children" was true for decades, and we learned to live with it — working around it with JS classes like `.has-error` or `.is-active` that someone had to add and remove by hand. `:has()` removed that limitation. It's not a CodePen party trick — it's a selector I now use in production to replace dozens of lines of JS in places where there used to be no other option.

This isn't a syntax primer. It's a list of cases where `:has()` genuinely replaced JavaScript in shipped code, plus the gotchas I've run into — including one that can silently drop your entire CSS rule.

## What `:has()` does, and since when you can rely on it

`:has()` is a relational pseudo-class: `A:has(B)` selects `A` if `A` contains (or, depending on the combinator, is followed by) something matching `B`. The simplest example — `a:has(img)` selects a link that contains an image.

Support is no longer up for debate. `:has()` has been **Baseline "Widely available"** since December 2023 ([developer.mozilla.org/.../:has](https://developer.mozilla.org/en-US/docs/Web/CSS/:has)), with minimum support from Chrome/Edge 105, Firefox 121, and Safari 15.4 ([caniuse.com/css-has](https://caniuse.com/css-has)). If you don't need to support browsers from before 2023, you can write it without hesitation. If you do, there's a section below on the `@supports` fallback.

## 1. Form validation without a JS class

The classic case I used to solve with an `input`/`change` listener toggling `.field--error`. Today plain CSS is enough:

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

One detail that's easy to miss: `:invalid` by itself is already true for an empty required field the moment the page loads — so without `:not(:placeholder-shown)` (or an equivalent) you'd greet the user with a red field before they've typed anything. Pairing `:invalid` with `:not(:placeholder-shown)` is a simple way to scope it to fields the user has actually touched. For a full rundown of accessible-form mistakes — including why a placeholder can't replace a label — see [Accessible forms: mistakes 90% of sites make](/en/blog/pristupne-formulare/).

## 2. A card that knows it has an image

A common CMS problem: a product or article card sometimes has an image and sometimes doesn't, and the layout has to handle both without the template rendering two different HTML variants.

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

This used to mean either two component variants or a bit of JS that, after render, does `card.querySelector('img')` and toggles a class. Now it's one CSS block, and the template doesn't need to know or care whether the image exists.

## 3. A compact filter row based on item count

Here `:has()` reacts to *how many* children an element has, via `:nth-child()` — useful for active-filter chips on a store, where you want to switch layout once there are too many of them:

```css
.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* From the 7th filter onward, switch to horizontal scroll and show a "more" button */
.active-filters:has(> :nth-child(7)) {
  flex-wrap: nowrap;
  overflow-x: auto;
}

.active-filters:has(> :nth-child(7)) .filters-more-btn {
  display: inline-flex;
}
```

A similar trick works the other way — hiding an empty state without counting items in JS: `.results-list:not(:has(li)) { display: none; }`, with `.results-empty` shown next to it. On a larger store's faceted filters, though, keep performance in mind — more on that below — and for handling filtering across thousands of products without Elasticsearch, see [Faceted filters on a store that don't lag](/en/blog/faceted-filtre-bez-elasticsearch/).

## 4. A header that reacts to an open mobile menu

A native `<details>` element is an increasingly common way to build a collapsible mobile menu without JS. `:has()` lets you style the surrounding chrome based on whether it's open:

```css
.site-header:has(> details[data-nav-menu][open]) {
  border-bottom-color: var(--border-strong);
}

.site-header:has(> details[data-nav-menu][open]) .nav-backdrop {
  display: block;
}
```

Locking scroll on `<body>` while the menu is open is one of the rare cases where reaching for a wider anchor is worth the performance cost (more on that below):

```css
body:has(details[data-nav-menu][open]) {
  overflow: hidden;
}
```

This only handles the visual state — not a focus trap, not closing on Escape. If you're building your own `<dialog>` or modal instead of `<details>`, focus management is a separate concern that `:has()` won't replace — I have a pattern for it in [Focus management in custom dialogs](/en/blog/focus-management-dialog/), including when it's better to reach for the native `<dialog>` element.

## The unforgiving selector: one bad clause drops the whole rule

This is the gotcha that once cost me an hour of debugging. `:is()` and `:where()` use a **forgiving selector list** — if the browser doesn't recognize one selector in the list, it's simply ignored and the rest still works. `:has()`, according to MDN, uses an **unforgiving selector list** ([developer.mozilla.org/.../:has](https://developer.mozilla.org/en-US/docs/Web/CSS/:has)) — if even one argument inside `:has()` can't be parsed (a typo, an unsupported pseudo-element, future syntax), the **entire rule** is dropped, not just that part.

```css
/* If the browser doesn't recognize ::before as a :has() argument, the WHOLE rule is ignored */
.card:has(img, ::before) {
  border-color: var(--accent);
}
```

Two more hard restrictions straight from the spec and MDN: `:has()` can't be nested inside itself (`:has(:has(...))` is invalid), and pseudo-elements aren't valid either as an argument inside `:has()` or as its anchor — because many pseudo-elements exist conditionally based on how their ancestor is styled, which would risk a cyclic dependency.

## Specificity and performance: why `body:has(...)` can hurt

`:has()` takes the specificity of the most specific selector among its arguments — same as `:is()` and `:not()`. The real surprises here aren't in specificity, though — they're in performance.

`A:has(B)` has to walk the entire subtree of `A` looking for `B` when it's evaluated. The wider the anchor `A` is, and the less constrained `B` is, the bigger the subtree the browser searches on every re-style. MDN explicitly recommends avoiding broad anchors like `body:has(...)`, `:root:has(...)`, or `*:has(...)`, and anchoring on a narrower container instead — plus, where possible, constraining `B` with a direct-child or sibling combinator (`:has(> .item)` instead of `:has(.item)`) so the search stops sooner ([developer.mozilla.org/.../:has](https://developer.mozilla.org/en-US/docs/Web/CSS/:has)). That's exactly why the menu example above anchors on `.site-header`, not `body` — and why `body:has(...)` for the scroll lock is left in as a deliberate exception, not a default habit.

For small components (a card, a form field, a list item) this is negligible. For large lists — hundreds of table rows, thousands of products in a listing — it's worth measuring, not just assuming.

## Progressive enhancement with `@supports selector()`

If you genuinely need a fallback for old browsers — not just "just in case" — `@supports` has a purpose-built tool for it: `selector()`.

```css
ul:has(> li li) {
  /* applied only where :has() is supported */
}

@supports not selector(:has(a, b)) {
  /* fallback for browsers without :has() */
  ul > li,
  ol > li {
    /* spelled-out replacement */
  }
}
```

([developer.mozilla.org/.../@supports](https://developer.mozilla.org/en-US/docs/Web/CSS/@supports)) In practice you rarely need this for purely visual detail (a label's color, a card's border) — degrading to "nothing happens" is fine. You need it where losing `:has()` means losing functionality, not just styling.

## When to reach for `:has()`, and when not to

`:has()` is strongest exactly where the only prior alternative was a JS class toggled on and off with every state change — form validation, content-conditional layout, reacting to a native `open`/`checked` state. It doesn't replace JS everywhere — focus traps, keyboard navigation, and network state are still JS's job. And with every new selector you add, it's worth checking it against a basic accessibility checklist, not just the visual result — I've summarized one in [WCAG AA on a small site: 80% of the effect for 20% of the work](/en/blog/wcag-aa-80-20/). `:has()` gives you cleaner CSS. You still have to verify accessibility yourself.
