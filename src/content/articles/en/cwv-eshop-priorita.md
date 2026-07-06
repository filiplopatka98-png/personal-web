---
title: "Core Web Vitals on an eshop: which pages to fix first"
date: 2026-01-22
read: 7
tags: ["Core Web Vitals", "WooCommerce", "Performance"]
excerpt: "An eshop has four template types and each has its own CWV problems. Here's a decision tree for which one to fix first, based on traffic and real revenue impact."
featured: false
---

An eshop isn't one page — it's four different templates with completely different performance profiles. When Search Console throws 412 "Poor URLs" at you, fixing them in alphabetical order makes no sense. First you need to know which fix brings in the most money.

## Pull the data from Search Console

Don't just sit there staring at a list of URLs like an idiot. The right approach is this:

1. **Search Console → Page Experience → Core Web Vitals → Mobile**.
2. Click the **"Poor URLs"** report.
3. Hit **Export → CSV** (28-day window).
4. Open it in Sheets and add a `template` column (homepage / PLP / PDP / cart-checkout).
5. Add **traffic** from GA4 (pageviews over the same 28 days) and multiply.

That gives you a *traffic-weighted poor-URL score*. The template with the highest score is your first fix.

## 1) Homepage — looks bad, but it's usually the LCP hero

The homepage gets a lot of traffic, so when it tanks, it tanks dramatically. But in 80% of cases there's a single culprit:

- **The LCP hero image** without `fetchpriority="high"`, without modern compression, or loaded via lazy loading.
- A slider with five images where the first one isn't preloaded.

The fix is often a one-day job:

```html
<link rel="preload" as="image" href="/wp-content/uploads/hero.avif" fetchpriority="high">
<img src="/wp-content/uploads/hero.avif" fetchpriority="high" decoding="async" alt="...">
```

Real case: one client had an LCP of 4.1s on the homepage; after preloading and converting to AVIF, **1.2s**. No other changes. If your homepage LCP is high but the cause isn't the hero, it's worth walking through the [most common causes of LCP over 2.5s](/en/blog/lcp-nad-2-5s-pricin/) before you start guessing.

## 2) PLP (product listing) — the toughest fight

This is where you bleed the most. A product listing has an **image grid** (12–24 images), **filtering JavaScript**, **pagination**, and often **AJAX add-to-cart** too. The CWV problems:

- **LCP** is the first product in the grid, which often has `loading="lazy"` (a mistake — the first 4–6 products above the fold should be eager).
- **CLS** from the filter sidebar that only renders after the JavaScript runs.
- **INP** from filtering with a debounce that filters 5,000 products client-side.

Fixing the PLP has the biggest revenue impact, because the PLP accounts for 35–50% of traffic. A real number from one project: after optimizing the PLP, **+12% revenue** in a month. Not clicks — **revenue**.

## 3) PDP (product detail) — critical for conversions

The PDP is where the decision gets made. If the bounce rate on the PDP is above 60% and the CWV are in the "Poor" band, **fix it first** — even if it has less traffic than the PLP.

Typical problems:

- **LCP**: the main product image lives in a carousel that hydrates for two seconds.
- **CLS**: the reviews widget, social-proof badges, "people also bought" — all of it dumps in after load.
- **INP**: the variant picker (color/size) recalculates the price with slow JavaScript.

Example fix for WooCommerce:

```php
// reserve space for the reviews widget
add_action('woocommerce_after_single_product_summary', function() {
  echo '<div style="min-height:320px" id="reviews-placeholder"></div>';
}, 5);
```

No CLS, because the placeholder has a fixed height.

## 4) Cart and checkout — INP and TBT rule here

Here nobody cares about LCP. The cart and checkout get low traffic but the **highest value per view**. The metrics you fix:

- **INP** — a click on "Add" or "Apply coupon" has to respond within 200ms.
- **TBT** — on the first load of the checkout, where stripe.js + Google Pay + 3D Secure all hydrate.

Practical tip: on the checkout page, **rip out every tracking pixel** that has no business being there. Hotjar, Clarity, FB Pixel — put them only on the thank-you page. That gets you 400ms of TBT back. While you're in the checkout, it's worth pairing this with a conversion pass — I walk through [nine micro-tweaks that make a WooCommerce checkout convert](/en/blog/checkout-konvertuje-9-uprav/) elsewhere.

## The decision tree in one table

| Template | Primary metric | When to fix first |
|---|---|---|
| Homepage | LCP | Always a cheap fix, do it in a week |
| PLP | LCP + CLS | Highest traffic-weighted revenue impact |
| PDP | LCP + CLS + INP | If the bounce rate is above 60% |
| Cart/checkout | INP + TBT | If the conversion rate is below benchmark |

## Summary

Don't ask "which page is slow." Ask "which fix brings in the most money." Pull the CSV of poor URLs, group by template, multiply by traffic. Start where the number is highest. Fixing the PLP has the best revenue impact in 9 out of 10 cases, but if your PDP bounce rate is above 60%, go there. The cart and checkout are their own thing — INP and TBT, not LCP.
