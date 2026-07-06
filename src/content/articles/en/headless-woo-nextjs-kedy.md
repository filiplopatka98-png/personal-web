---
title: "Headless Woo + Next.js: when it's worth it (and when it isn't)"
date: 2026-02-14
read: 8
tags: ["WooCommerce", "Next.js", "Headless"]
excerpt: "Headless WooCommerce with Next.js sounds sexy, but it costs 3x more than a native store. A decision matrix across 4 axes for when it makes sense."
featured: true
---

A month ago a client asked me whether I should rebuild his WooCommerce store with 800 products into a headless Next.js setup. I looked at his Analytics: traffic of 12k MAU, a small in-house dev team of one person. I said **no**. Here's the matrix I use to decide.

## Axis 1: Number of products

| Products | Recommendation |
|---|---|
| < 500 | Woo native, Astro frontend if you want speed |
| 500–5000 | Woo with a caching plugin (Redis Object Cache + WP Rocket) |
| 5000–20000 | Hybrid — Woo backend, static PLPs via ISR |
| > 20000 | Headless starts to make real sense |

Why? **Database queries on the PLP** grow exponentially with the number of attributes. Under 5000 products you can keep MySQL going with composite indexes (I wrote about that in another article). Above that you already need a search engine or static generation.

## Axis 2: Monthly traffic

| Traffic | Recommendation |
|---|---|
| < 30k MAU | Woo with Redis cache is enough; the ROI from headless is negative |
| 30k–100k | Headless starts to make sense if you have peak traffic |
| > 100k MAU | Headless almost always pays back the investment |

Edge cases: if you have seasonal peaks (Black Friday at 10x normal traffic), headless will save your infrastructure. PHP-FPM collapses at 1000 concurrent requests; static Next on a CDN takes it without blinking.

## Axis 3: Team and skills

This is the factor people underrate:

- **1 dev, PHP background** → Woo. Headless will kill them. WooCommerce has 12 years of documentation; a headless setup requires GraphQL, Next.js, a deployment pipeline, environment management, ISR debugging.
- **2-3 devs, mixed PHP + JS** → Hybrid, or Woo with a React frontend (Storefront API).
- **3+ devs, React/TypeScript** → Headless is their home. They move faster than in PHP.

If the lead developer on the project is WordPress/PHP, headless will genuinely **slow down** development by 30-50%, because they have to deal with problems they never had in PHP (CORS, SSR/CSR boundaries, hydration, cache invalidation).

## Axis 4: Planned customization

The question: **What will you do on the frontend that Woo can't handle natively?**

- **Basic store** (categories, products, cart, checkout) → Woo has done this for 12 years, why complicate your life.
- **Multi-channel** (web + mobile app + kiosk + B2B portal) → Headless gives one API source for all of them.
- **Custom checkout flow** (3-step wizard, AR try-on, configurator) → Headless gives you flexibility.
- **Heavy personalization** (a different homepage per segment, A/B testing infrastructure) → Headless is advantageous, but it can also be done in Woo.

## Pricing

Real numbers from my projects:

- **WooCommerce native** (new store, design + dev): **€4,000 – €7,000**.
- **WooCommerce native with a custom theme + perf optimization**: **€7,000 – €12,000**.
- **Headless WooCommerce + Next.js**: **€15,000 – €25,000**, plus **€20-50/mo hosting** (Vercel/CF/VPS).

Maintenance is a different tune too:

- Woo native: WP plugin updates, roughly 2-4 hours/month.
- Headless: deployment monitoring, dependency updates in Next.js (a major every 2 months), API versioning. **6-10 hours/month.**

## The decision tree in practice

```text
Do you have > 5000 products AND > 30k MAU?
  ├─ Yes → Continue
  └─ No → Stop, use Woo native
Do you have a team with React/TS skills?
  ├─ Yes → Continue
  └─ No → Stop, use Woo native (or hire)
Are you planning multi-channel OR heavy custom UX?
  ├─ Yes → Headless makes sense, go for it
  └─ No → Stop, headless is overkill
Do you have a budget of €15k+ and 6+ weeks?
  ├─ Yes → Headless is a good choice
  └─ No → Woo native with perf optimization
```

## Why I told the client NO

The client mentioned above with 800 products:

- Products: 800 → Axis 1 says "Woo native."
- Traffic: 12k MAU → Axis 2 says "Woo native."
- Team: 1 dev, PHP-only → Axis 3 says "Woo native."
- Customization: a standard store, no multi-channel → Axis 4 says "Woo native."

**4 out of 4 axes against.** Headless would cost 3x more, would require a new team or training them, and would deliver no user-perceivable benefit. The client would burn €18,000 just to have a "more modern stack." That's not a business case, it's a marketing pose.

## When I said YES instead

Another client: 14,000 products, 180k MAU, a 4-person React team, a planned mobile app + B2B portal over the same API. Here **headless wasn't a choice, it was a necessity.** They went for it despite the higher price, because all 4 axes pointed the same way.

## TL;DR

Headless WooCommerce + Next.js is not the default choice. It's an investment that pays off when you have lots of products, lots of traffic, a capable team, and real customization. If you're missing even one of these four things, stay on Woo native and put the money into CWV optimization. Your conversion rate will be much more grateful.
