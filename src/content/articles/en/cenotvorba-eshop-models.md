---
title: "Pricing small online stores: hourly vs fixed vs hybrid"
date: 2026-05-02
read: 8
tags: ["Process"]
excerpt: "Three models, one decision rule: <30% scope drift = fixed, 30–60% = hybrid, >60% = hourly. Plus real numbers from five e-commerce projects."
featured: true
---

New client, small online store, "we need a website." Three ways to bill it. Each has a different risk profile, a different amount of work for you, and a different level of trust from the client.

This is the decision framework I've been using for the past three years. Plus real numbers from five e-commerce projects.

## Model 1: Hourly

**Rate:** €60–90/h for Bratislava, €45–70/h for smaller cities. A sole trader (SZČO) or an LLC bills plus 23% VAT (if VAT-registered).

**Good fit when:**
- Scope is unclear ("let's build an MVP and see")
- The client wants to work iteratively, with constant feedback
- The project carries high technical risk (custom integrations, headless CMS, AI)

**Risk for the dev:** none — you bill what you work.
**Risk for the client:** high — they don't know the final price.

**How to frame it:** "I charge €75/h, invoiced every two weeks with a detailed work log. Cap before escalation: 80 h, then we do a delivery review."

The client will push for predictability. Give them a **range estimate** (40–60 h for part A, 20–30 h for part B), but never promise a fixed price on an hourly project — that's suicide for both sides.

## Model 2: Fixed price

**Price:** €4,000–15,000 for a small to mid-sized store. Depends on:

- Number of products (up to 50 / 50–500 / 500+)
- Custom functionality (catalog only vs. subscriptions + members area)
- Integrations (Mailchimp / Klaviyo / accounting / inventory)
- Design (template-based / semi-custom / fully custom)

A concrete breakdown of one of my stores (€11,500 fixed):

| Item | Hours | Rate | Price |
|---|---|---|---|
| [Discovery](/en/blog/discovery-call-30-minut/) + brief + design system | 12 h | €70 | €840 |
| WooCommerce setup + custom theme | 28 h | €70 | €1,960 |
| Import 80 products + content | 16 h | €60 | €960 |
| Checkout + [payments (Stripe + GoPay)](/en/blog/sk-platobne-brany-2026/) | 18 h | €80 | €1,440 |
| Email flow (Klaviyo) | 14 h | €70 | €980 |
| SEO + analytics + GTM | 10 h | €70 | €700 |
| QA + bug fixing | 12 h | €60 | €720 |
| **Buffer (15%)** | 16 h | €70 | €1,120 |
| Project management | 14 h | €70 | €980 |
| Training + handover | 6 h | €60 | €360 |
| **Total** | **146 h** | **~€79** | **€10,060** |

Plus a 15% business buffer (overruns, client changes outside scope) = €11,569 → rounded to **€11,500 fixed**.

**Good fit when:**
- Scope is clear ([5+ pages of briefs](/en/blog/brief-3-tyzdne/), mockups)
- The client wants a predictable price
- You've done a similar project at least 3 times before (you can estimate it)

**Risk for the dev:** high — overruns come out of your pocket.
**Risk for the client:** low — they know the price.

**Client comfort = +30% on the price.** The client pays a premium for predictability. That's fair, because you're paying a premium for the risk.

## Model 3: Hybrid (fixed base + hourly extras)

**Setup:** a fixed price for the core scope (€6–12k) plus an hourly rate (€60–80/h) for everything outside scope.

**Sample quote:**

```
Core scope (FIXED): €8,500
- 5 website pages + WooCommerce
- 80 products
- Checkout + 2 payment methods
- Email flow setup (1 sequence)
- SEO setup

Out of scope (HOURLY @ €70/h):
- Additional email sequences
- Custom integrations (inventory, accounting)
- Photo editing
- Content writing
- New features after launch
```

**A good fit for 80% of projects.** The client gets a fixed price for the clear part, and you have an escape hatch for the "let's just add this little thing" requests.

Change request flow:

1. The client says "I also want X"
2. You send an email: "X isn't in the core scope. Estimate 3–5 h, i.e. €210–350. Approve it and I'll invoice it as an extra."
3. The client approves in writing (an email is enough)
4. You implement it and invoice it

Without this process, the hybrid turns into a pseudo-fixed price with unlimited revisions.

## The decision rule

I use a simple heuristic:

- **Expected scope drift <30%** (clear brief, I've done similar work) → **fixed**
- **Scope drift 30–60%** (average project, client still changing their mind) → **hybrid**
- **Scope drift >60%** (new technology, vague brief, R&D) → **hourly**

Scope drift = the % of work outside what was originally agreed. Estimated from past projects — it's not an exact number.

For small online stores, **hybrid** is the best choice in 70% of cases. The client gets price certainty, and you get an escape hatch.

## Real numbers from 5 e-commerce projects

| Project | Model | Original price | Final price | Drift | Satisfaction |
|---|---|---|---|---|---|
| Store A (50 prod., beauty) | Fixed | €7,500 | €7,500 | 0% | OK for both sides |
| Store B (200 prod., fashion) | Fixed | €11,500 | €11,500 | 0% | OK, but **~30 h overrun on my side** (my cost) |
| Store C (B2B, custom) | Hourly | €5,000 estimate | €8,200 | +64% | Client unhappy with the price |
| Store D (300 prod., foods) | Hybrid | €9,000 + €1,800 extras | €10,800 | +20% | **Best** — client happy |
| Store E (subscriptions) | Hybrid | €12,000 + €3,200 extras | €15,200 | +27% | Client happy, I'm happy |

Store B (fixed) cost me 30 hours of overrun = ~€2,100 lost compared to hourly. On store C (hourly) the client paid **64%** more than the estimate — the relationship survived, but there was no next quote. Stores D and E (hybrid) — everyone happy, myself included.

## How to present it to the client (template)

```
For your project I recommend a hybrid model:

CORE SCOPE (fixed): €8,500 — covers [list]
EXTRAS (hourly @ €70/h): for things outside the core scope

Why hybrid:
- You get price certainty for the main part of the project
- I can fairly invoice additional requests without having to
  renegotiate the entire contract
- 80% of my clients have chosen this model

If you prefer a strict fixed price, I can prepare that variant too — but:
- The price will be ~25% higher (it includes a buffer for potential changes)
- Any change outside the agreed scope = new contract (slowdown)

I can offer hourly as well, but only for high-uncertainty projects
(custom integrations, R&D, MVP). For your store I don't recommend it.
```

In 90% of cases the client picks hybrid. The remaining 10% are either clients who insist on a fixed price (and pay the premium), or very technical ones who prefer hourly with regular weekly check-ins.

## Buffer and reserve

In every model, build in a buffer — minimum 15%, ideally 20%.

- Fixed: add 15–20% to the estimated hours before multiplying by the rate
- Hybrid: add 10% to the fixed base + full flexibility in the hourly extras
- Hourly: 5% buffer for admin and communication (you can't invoice every email)

Without a buffer, a fixed price is Russian roulette.

## How to word the scope buffer

In the contract (or quote), agree on:

- **Revisions:** "2 rounds of design revisions. 3rd round @ €70/h."
- **Meeting limit:** "A weekly 30-min check-in is included. Ad-hoc meetings over 2 h/month @ €70/h."
- **Response time:** "Email replies within 48 h. Urgent (production down) by phone."
- **Out of scope:** "Content writing, photo editing, and branding are not included."

The client **signs** this. Without a signed contract (or at least an email confirmation), scope becomes his word against yours.

## Tax note for Slovakia

As a sole trader (živnostník) in 2026:

- 15% income tax (up to a €100,000 tax base) + 16% health + 33.15% social insurance on the assessment base. Note: contributions aren't paid on every invoiced euro the way tax is — they're calculated from an assessment base with minimum and maximum thresholds. In practice, you keep roughly 55–65% of your gross hourly rate as net earnings, depending on your income level.
- Billing €60/h gross leaves roughly ~€36/h net
- At €80/h gross, roughly ~€48/h net

If you want to earn €40/h net, bill at least €70/h. For an LLC, count on a different tax structure (corporate income tax 10% up to €100,000, 21% above that, plus dividend taxation).

## TL;DR

Three models: hourly (unclear scope, dev-friendly), fixed (clear scope, client comfort, risk on the dev), hybrid (80% of projects, win-win). The rule: <30% scope drift = fixed, 30–60% = hybrid, >60% = hourly. Always a 15–20% buffer. For a small online store, the best choice is a hybrid with a fixed base of €8–12k + an hourly rate of €70/h. For predictability, the client pays a ~25% premium — and that's fair.

**Related:** [WooCommerce vs Shopify for a small SK store](/en/blog/woocommerce-vs-shopify/)
