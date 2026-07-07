---
title: "Contrast and Design: How to Pass WCAG AA Without Your Site Going Gray"
date: 2027-02-09
read: 8
tags: ["Accessibility", "Design"]
excerpt: "AA contrast doesn't have to mean gray boredom. The real thresholds that apply, where WCAG 2 fools your perception, and how to compute colors right in CSS."
featured: false
---

Contrast is the most common finding in every accessibility audit I've ever seen. And also the one designers hate most — because in their heads, "passing AA" means "make it ugly and gray." That's not true. You can pass WCAG AA and have a pretty, on-brand site at the same time. You just need to know exactly where the thresholds are, and where the standard leads you astray.

## The numbers you need to memorize

WCAG 2.2 at Level AA has three contrast criteria, and you really only need two numbers:

- **Normal text** (criterion 1.4.3): at least **4.5:1** against the background.
- **Large text** (18 pt / 24 px, or 14 pt / 18.66 px bold): **3:1** is enough.
- **Non-text elements** — input borders, icons, component states, charts (criterion 1.4.11): at least **3:1**.

One detail that surprises a lot of people: these numbers **did not change between WCAG 2.1 and 2.2**. If you learned contrast five years ago, you missed nothing. And the thresholds are hard — 4.49:1 fails just like 2:1 does. No rounding up.

Level AAA is stricter (7:1 for normal text, 4.5:1 for large), but I don't chase that on a commercial site for a small business. AA is the legally relevant bar, including under the European Accessibility Act, and it's entirely sufficient.

## Why "large text = 3:1" changes the whole design

This is the lever designers overlook. Headings, hero claims, big numbers in stats — anything over 24 px (or 18.66 px bold) falls under the gentler 3:1 threshold. That opens up a whole palette of colors that would never pass in body copy.

A brand green or orange that reads as a `4.5:1` fail on a `16px` paragraph can be perfectly fine as a large heading. The practical takeaway: **you don't need a single text color for the whole site.** Keep body copy conservative and safe; let accents run wild at large sizes.

Verify it concretely. I use the [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — it's free, you drop in two hex codes and it shows pass/fail for both normal and large text, plus the non-text 3:1 case. When a color fails, it suggests the nearest shade that passes. That's exactly the workflow that keeps the brand intact while getting contrast over the line.

## Where WCAG 2 fools you

Let's be honest here. The WCAG 2 contrast formula is based on relative luminance, and it has two weak spots I run into constantly:

**It's symmetric.** Swap the text and background and you get the same number. But the human eye isn't symmetric — dark text on a light background is perceived differently from light text on a dark background. WCAG 2 doesn't distinguish.

**It ignores font weight and size** (beyond the coarse large/normal threshold). Thin type sitting right at 4.5:1 is genuinely harder to read than bold type at the same number, but the formula has no idea.

That's why APCA (Advanced Perceptual Contrast Algorithm) exists — a perceptual model that accounts for polarity, size, and weight. But watch out, and this is a common misunderstanding in articles online: **APCA is not "WCAG 3" and it is not normative.** WCAG 3.0 is still a working draft in 2026, and the working group pulled the APCA content out as exploratory. Nobody can honestly tell you today that APCA is the official WCAG 3 contrast method.

The practical conclusion: **audit and guarantee against WCAG 2 (4.5:1 / 3:1), because that's the binding bar.** Use APCA as a second opinion when something "passes" WCAG 2 but obviously reads badly — typically light text on a mid-tone colored background.

## Compute your colors, don't guess them

The most common cause of contrast failures I see is hand-picking shades in a design tool and copying hex codes. Modern CSS can take that off your hands.

`oklch()` is a perceptually uniform color space, and in 2026 it's supported by every evergreen browser (Chrome/Edge 111+, Safari 15.4+, Firefox 113+) — so the vast majority of real traffic. Its contrast advantage: when you change `L` (lightness), you change perceived brightness predictably, unlike HSL.

You can derive a brand color scale from a single source using relative color syntax:

```css
:root {
  --brand: oklch(0.62 0.19 264); /* source brand color */

  /* lighter/darker variants derived from one value */
  --brand-strong: oklch(from var(--brand) 0.42 c h); /* darker → higher contrast on white */
  --brand-soft:   oklch(from var(--brand) 0.92 0.04 h); /* badge/chip background */
}
```

When you need text that always lands on black or white depending on the background, there's `contrast-color()`. It takes a color and returns either `white` or `black` — whichever has higher contrast:

```css
.badge {
  background: var(--brand);
  color: contrast-color(var(--brand));
}
```

But it comes with two catches you need to know. First: per MDN, `contrast-color()` is **Baseline Newly Available only since April 2026** — it doesn't work on older browsers, so always define a fallback `color`. Second, more important: it only guarantees WCAG AA (4.5:1), and for **mid-tones** (say, a saturated royal blue) it can return black or white where neither is truly readable. So use it on light or dark backgrounds, not mid-tones. For a mid-tone, reach for a stronger custom shade and verify it by hand.

## Don't forget 1.4.11 and 1.4.1 — they fail more quietly

Everyone tests text contrast. What gets forgotten:

**Non-text contrast (1.4.11).** A `1px` input border in light gray against white is a classic fail — it needs 3:1 against the adjacent color. Same goes for meaningful icons, toggle states, or data series in a chart. Placeholder text, by the way, also falls under 1.4.3, so that pale-gray placeholder everyone loves tends to sit below the threshold.

**Don't rely on color alone (1.4.1, Level A).** A link in text distinguished **only** by color is a failure — it needs an underline, bold, or some other non-color signal too. Likewise a form error can't be just red; it needs an icon or text. This is the cheapest fix there is and the most frequently overlooked.

```css
/* link in a paragraph: not just color, but an underline too */
.prose a {
  color: var(--brand-strong);
  text-decoration: underline;
  text-underline-offset: 0.15em;
}
```

How to fold all of this into a broader minimum for a small site, I wrote up in [WCAG AA on a small site: 80% of the effect for 20% of the work](/en/blog/wcag-aa-80-20/). If you're dealing specifically with forms, where contrast and color states fail most often, see [accessible forms and the mistakes 90% of sites make](/en/blog/pristupne-formulare/). And if you want to sweep the whole site with a keyboard, including visible focus (which has its own contrast threshold), I have a [keyboard-only test in 10 minutes](/en/blog/keyboard-only-test/).

## How I do it

The order that works in most projects:

1. Define **one source brand color** in `oklch` and derive the scale from it with relative syntax. Don't copy hex codes by hand.
2. Keep body text safely above 4.5:1. Let accents and brand colors run at **large sizes** (3:1).
3. Sweep **non-text elements** — input borders, icons, focus ring, charts — to 3:1.
4. Check **1.4.1** — no information conveyed by color alone anywhere.
5. Verify the actual values in the WebAIM checker. For borderline cases, add APCA as a second opinion.

Contrast isn't the enemy of design. It's a constraint like any other — and good design happens inside constraints. Gray boredom only shows up when you get to contrast at the very end and dim everything across the board. When you plan for it from the start and know where the thresholds are, nobody can tell you "had to" do anything.
