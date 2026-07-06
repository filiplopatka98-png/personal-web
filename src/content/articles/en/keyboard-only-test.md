---
title: "The 10-Minute Keyboard-Only Test: A Process That Actually Works"
date: 2025-09-22
read: 6
tags: ["Accessibility", "Process"]
excerpt: "A 10-minute quick test before launch. Tab, Enter, Escape, Space — it catches 70% of accessibility problems with no special tools and no certification."
featured: false
---

Before every launch I spend 10 minutes testing the site using only the keyboard. No screen reader, no axe DevTools, just Tab, Shift+Tab, Enter, Space, Escape, and the arrow keys. It surfaces roughly 70% of accessibility problems and costs you less coffee than a full audit takes. I treat it as the first step toward [WCAG AA on a small site: 80% of the effect for 20% of the work](/en/blog/wcag-aa-80-20/).

This is the checklist you'll forget unless it's right in front of you.

## Setup: 30 seconds

- Open the page in Chrome or Firefox.
- Click into the address bar and press Tab. Focus should jump to the first focusable element on the page.
- If you can't see a focus ring anywhere (the blue outline), you've got a problem before you even start. Fix that first (look for `outline: none` in your CSS). Then continue.

## Test 1: Tab through the whole page (2 min)

Press Tab over and over, from top to bottom. Watch for three things:

1. **Is focus visible?** Every focusable element needs a clearly visible focus indicator. The browser's default blue outline is fine, but if you override it with `outline: none` and give nothing back, that's a fail.
2. **Is the order logical?** Focus moves left to right, top to bottom. If it jumps around chaotically (say, from the header down to the footer and back), your DOM order is out of sync with the visual layout.
3. **Any "focus zombies"?** Some elements (dropdown items, for example) are in the DOM but hidden via `display: none` or `visibility: hidden` — those shouldn't be focusable. If Tab lands on an "invisible" element, you've hidden it the wrong way (`opacity: 0` or just `visibility: hidden`).

When you hit a problem: `tabindex="-1"` on elements that shouldn't be focusable, or hide them with `display: none` or the `hidden` attribute.

## Test 2: Skip link (15 sec)

Reload the page. Press Tab once. A skip link — "Skip to content" or similar — should appear.

If the skip link is **missing**, add it. Otherwise a keyboard user has to tab through 30 nav links just to reach the content.

```html
<a href="#main" class="skip-link">Skip to content</a>
```

```css
.skip-link {
  position: absolute;
  top: -40px;
  background: #0066cc;
  color: white;
  padding: 8px 16px;
}
.skip-link:focus { top: 0; }
```

## Test 3: Menu / dropdown (2 min)

Find a nav with a dropdown. Tab to it, press Enter or Space.

- **Does it open?** If not, you've got a `<div onclick>` instead of a `<button>`. Fix: use the semantic `<button>` element.
- **Arrows, or Tab?** Common pattern: Tab moves on to the next top-level nav item, arrows move within the submenu. If you follow the [APG menu pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu/), Tab closes the submenu and moves focus out of it.
- **Does Escape close it?** Inside the dropdown, press Escape — it should close and focus should jump back to the trigger button.

The most common fail: the dropdown opens on mouse hover (mouseenter), but the keyboard never opens it at all. Fix: the dropdown has to open on `focus`/`focus-within` too.

```css
.dropdown:hover .submenu,
.dropdown:focus-within .submenu {
  display: block;
}
```

## Test 4: Form (3 min)

Find a contact, order, or login form. Tab into the first field.

1. **Tab through all fields** in the order they appear visually. No skipped fields.
2. **Submit** — press Enter in any text field. The form should submit (the browser default). If it doesn't, you've turned a `<button type="submit">` into a plain `<button>` (the default type is `submit`, but if you changed it to `type="button"`, Enter in a field won't trigger a submit).
3. **Are validation errors visible?** Submit an empty form or an invalid email. The error message must be:
   - Visually visible (not just a red border — that's color-dependent, a fail for low-vision users; WCAG 1.4.1 Use of Color)
   - Programmatically tied to the field via `aria-describedby` and `aria-invalid="true"`
   - Announced to screen readers via `aria-live="polite"` on the error container (or `role="alert"`)

Example of correct error markup:

```html
<label for="email">Email</label>
<input
  id="email"
  type="email"
  required
  aria-invalid="true"
  aria-describedby="email-error"
>
<p id="email-error" role="alert">
  Email is required.
</p>
```

## Test 5: Modal / dialog (2 min)

Open any modal (a cookie bar, login, an image lightbox).

1. **Does focus jump into the modal?** If not, the user has no idea where they are. Fix: programmatically `dialogEl.focus()`, or focus the first focusable element.
2. **Is focus trapped?** Press Tab, Tab, Tab... focus should stay within the modal. If it escapes to the background, you're missing a focus trap.
3. **Does Escape close it?** Press Escape — the modal should close.
4. **Does focus return?** After closing, focus should jump back to the button that opened the modal.

If all four hold, your dialog is implemented correctly. Otherwise, switch to the native `<dialog>` element or write the focus management yourself ([I wrote about that here](/en/blog/focus-management-dialog/)).

## Test 6: macOS VoiceOver basics (bonus, 30 sec)

If you're on a Mac: Cmd+F5 turns VoiceOver on. The same Cmd+F5 turns it right back off (you don't need it long for this test).

Before you switch it off, try:

- VO+A — read the page from the top
- VO+Right Arrow — next element

If VoiceOver reads gibberish ("graphic, image-cropped-2.jpg") instead of descriptive alt text, you've got a problem with your `alt` attributes (I covered [generating alt text with AI and its SEO risks](/en/blog/ai-alt-text-seo/) separately).

## The cookie banner anti-pattern

A special case. Cookie bars often:

- Pop up in front of the content, but focus stays in the footer
- Let Tab wander into the main content (no focus trap)
- Won't let you proceed without clicking "Accept" (a forced choice — a problem from a WCAG standpoint)

If a cookie bar blocks the page, it **must** have a focus trap and close on Escape. Otherwise it's unusable by keyboard.

## Real numbers from my projects

Across 12 sites I tested with this 10-minute method before launch:

- Average problems found: **8 per site**
- Of those, critical (completely blocking a keyboard user): **2 per site**
- Time to fix (average): **45 min**

If those slipped through to a post-launch Lighthouse audit or user feedback instead, the fix takes 3× longer — because of the context switch back into the project.

## Printable checklist

```
[ ] Tab through the whole page — focus visible everywhere?
[ ] Tab through the whole page — logical order?
[ ] Skip link works on the first Tab?
[ ] Menu: Enter/Space opens, Tab/arrows navigate, Escape closes
[ ] Form: Tab through fields, Enter submits, errors visible + announced
[ ] Modal: focus in, Tab trapped, Escape closes, focus returns
[ ] Cookie bar has a focus trap (if it blocks)
[ ] Basic check with VoiceOver (Cmd+F5)
```

## TL;DR

10 minutes, no extra tools. Tab through the page, test menus, forms, and modals for Tab/Enter/Escape, focus trapping, and focus return. It catches 70% of the accessibility problems that axe-core — or worse, a real user — would otherwise find. Pin the checklist to your monitor.
