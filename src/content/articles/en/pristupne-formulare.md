---
title: "Accessible Forms: The Mistakes 90% of Sites Make"
date: 2027-02-04
read: 8
tags: ["Accessibility"]
excerpt: "Placeholder instead of a label, errors shown only in red, missing autocomplete. A practical guide to a form that works with a keyboard and a screen reader."
featured: false
---

A form is where a site either earns money or loses it. And it's also the part most often neglected when it comes to accessibility. Not because it's hard — but because it "works" at first glance. It looks fine, you can fill it in with a mouse, the designer is happy. Right up until someone tries to fill it in with a keyboard or a screen reader.

Over the years I keep seeing the same handful of mistakes over and over. Most of them take a few minutes to fix, yet they make the form unusable for real people. Here's the list of the ones that show up almost everywhere, along with how to fix them properly.

## 1. A placeholder instead of a label

The most common sin. The designer wants a clean form without "unnecessary" labels, so the text moves into the `placeholder` attribute. It looks minimal. And it's broken in three ways at once.

The placeholder disappears the moment you start typing — so the user loses their reference for what actually belongs in the field. On a validation error you have to go back and guess. Placeholder text contrast is usually deliberately low (light gray), so it fails the WCAG contrast criterion. And most screen readers don't treat a placeholder as a reliable label substitute.

WCAG 2.2 (an official W3C standard since October 5, 2023) covers this with criterion **3.3.2 Labels or Instructions** — every field that collects user input must have a visible, programmatically associated label. A placeholder is not a label. Period.

```html
<!-- Wrong: no label, just a placeholder -->
<input type="email" placeholder="Your email">

<!-- Right: a visible label associated via for/id -->
<label for="email">Email</label>
<input type="email" id="email" name="email" autocomplete="email">
```

If the design really needs a floating label, keep it as a real `<label>` in the DOM — just move it visually above the field with CSS. Never replace the label with a placeholder.

## 2. Errors signaled with color only

You submit the form, the field gets a red border, done. But a red border is information carried **by color alone** — and that's a violation of WCAG **1.4.1 Use of Color**. A colorblind user (roughly one in twelve men) may not see the difference. And a screen reader doesn't read color at all.

An error has to be announced through three independent channels at once:

1. **As text** — a specific message, not just a border. "Enter a valid email" instead of a wordless red outline.
2. **Programmatically tied to the field** — via `aria-describedby` and `aria-invalid="true"`, so the screen reader reads it as soon as the field gets focus.
3. **Announced on submit** — via `role="alert"` or `aria-live`, so the user knows about it even when they aren't on that field.

```html
<label for="email">Email</label>
<input
  type="email"
  id="email"
  name="email"
  autocomplete="email"
  aria-invalid="true"
  aria-describedby="email-error"
>
<p id="email-error" role="alert">Enter a valid email, e.g. name@company.com.</p>
```

One small but important detail: only put `aria-invalid="true"` on the field when an error actually exists. Don't hardcode it into the DOM on page load — otherwise the screen reader will announce a field the user hasn't even clicked into as invalid.

## 3. Missing autocomplete

I see this even on otherwise decent sites. Name, email, address, or phone fields with no `autocomplete` attribute. The browser then can't prefill them and the user has to manually retype what's already saved in their profile.

WCAG **1.3.5 Identify Input Purpose** (Level AA) explicitly requires that the purpose of common fields be programmatically determinable — and `autocomplete` is exactly that mechanism. The HTML standard defines a fixed set of tokens (over fifty of them), so you're not inventing anything, you just use the right one:

```html
<label for="fname">First name</label>
<input id="fname" name="fname" autocomplete="given-name">

<label for="lname">Last name</label>
<input id="lname" name="lname" autocomplete="family-name">

<label for="tel">Phone</label>
<input id="tel" type="tel" name="tel" autocomplete="tel">

<label for="street">Street address</label>
<input id="street" name="street" autocomplete="street-address">

<label for="zip">ZIP code</label>
<input id="zip" name="zip" autocomplete="postal-code" inputmode="numeric">
```

A bonus everyone appreciates, not just people with disabilities: on mobile add `inputmode` (`numeric`, `tel`, `email`) to trigger the right keyboard. And for numeric codes, remember that `type="number"` on a ZIP or phone is a trap — it strips leading zeros and adds spinner arrows you don't want. For codes, use `type="text"` with `inputmode="numeric"`.

If you're building a multi-step checkout, the same logic touches the new criterion **3.3.7 Redundant Entry** (WCAG 2.2, Level A): information the user already entered within a single process must not be requested again. Either prefill it, or offer a "same as billing" option. When optimizing checkout, this goes hand in hand with [nine micro-tweaks from a real audit](/en/blog/checkout-konvertuje-9-uprav/).

## 4. Groups without `<fieldset>` and `<legend>`

Radio buttons and checkbox groups share a common question — say "Shipping method." If you don't wrap that question in a `<fieldset>` with a `<legend>`, the screen reader reads only the individual options ("Courier," "Pickup point") without the context of what they actually relate to.

```html
<fieldset>
  <legend>Shipping method</legend>

  <label>
    <input type="radio" name="shipping" value="courier"> Courier
  </label>
  <label>
    <input type="radio" name="shipping" value="pickup"> Pickup point
  </label>
</fieldset>
```

This is five lines of work that turn "read me some random words" into "pick your shipping method." And yet `<fieldset>` is almost never seen in forms.

## 5. Controls that are too small and cramped

WCAG 2.2 added criterion **2.5.8 Target Size (Minimum)** (Level AA): interactive targets should be at least 24 × 24 CSS pixels, or have enough spacing around them. Small checkboxes packed tightly under each other, a tiny "×" to close, buttons 20 pixels tall — all of it is a problem for people with limited motor control, and for the average mobile user with a thumb.

You don't have to enlarge the visual itself — it's enough to grow the clickable area via `padding` or an invisible layer. For checkbox labels it's nice to make the whole label clickable, not just the box (which the `<label>` wrapping from point 4 handles automatically).

## 6. A removed focus outline

This isn't strictly a form issue, but it hurts the most in forms. Someone drops `outline: none` into the CSS because the browser's blue outline "ruins the design," and never replaces it. A keyboard user tabbing through then has no idea which field they're in.

```css
/* Never like this on its own: */
:focus { outline: none; }

/* If you're overriding the default, provide your own visible state: */
:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

`:focus-visible` is supported in every modern browser today and settles the old "the outline is annoying when clicking with a mouse" argument — it only shows during keyboard navigation. There's no reason not to use it.

## 7. Custom components pretending to be inputs

A `<div>` with an `onclick` that looks like a checkbox. A custom select built from a `<ul>` and JavaScript. It looks nice, but the screen reader sees only an empty `<div>` with no role, no state, no keyboard control.

My rule: **try the native element first.** `<input type="checkbox">`, `<select>`, `<input type="date">` — all of them are far more styleable than a few years ago and bring accessibility for free. Reach for a custom component only when the native one genuinely isn't enough — and then follow the relevant [APG pattern](https://www.w3.org/WAI/ARIA/apg/) including roles, states, and keyboard handling. The same goes for dialogs: I covered [focus management in custom dialogs](/en/blog/focus-management-dialog/) separately.

## How to verify it in a few minutes

You don't need an audit or a paid tool for this. Open the form and:

- Put the mouse away. Go through the whole form using only **Tab, Shift+Tab, Enter, and arrow keys**. If you can't reach something or can't see the focus, you have a problem.
- Submit an **empty and incorrectly filled** form. Are the errors visible as text? Does the screen reader read them?
- Try **prefill** from the browser (a saved address). If nothing fills in, `autocomplete` is missing.

I have a more detailed process in [Keyboard-only test in 10 minutes](/en/blog/keyboard-only-test/). And if you're tackling accessibility on a small site overall, start with [WCAG AA for 20% of the effort](/en/blog/wcag-aa-80-20/) — forms are the highest-yield item in it.

## Wrap-up

An accessible form isn't about certification or an expensive audit. It's a handful of habits: a real `<label>` instead of a placeholder, errors as text and not just color, `autocomplete` on common fields, `<fieldset>` for groups, a big enough clickable area, a visible focus, and native elements while you can. Every single point is a few minutes of work — and together they make the difference between a form that "looks fine" and a form that everyone can actually fill in.
