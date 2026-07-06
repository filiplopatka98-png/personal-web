---
title: "Slovak payment gateways in 2026: GoPay, Stripe, Tatra Banka, ComGate"
date: 2026-04-22
read: 7
tags: ["WooCommerce", "Process"]
excerpt: "A comparison of four payment gateways for a small Slovak online store. Fees, integration, payout speed, sandbox, and refunds — concrete numbers and when each one wins."
featured: false
---

A client, two months ago: "we spent a whole day picking a payment gateway, because every comparison site was just copy-pasted marketing fluff." Fair complaint. Here's a comparison of the four main players for a **small-to-mid Slovak online store** — from the perspective of a developer who has integrated all of them.

Comparison criteria:
1. Fees (transaction %, monthly fees)
2. Integration difficulty (is there an official WooCommerce plugin? how good is it?)
3. Payout speed
4. Sandbox and testing
5. Refund flow

## GoPay

A Czech player, long dominant in both Slovakia and Czechia.

**Fees:**
- Monthly fee: €0
- Transaction fee: 1.4% + €0.10 (cards), 0.6% (Apple Pay / Google Pay), 0.8% (bank transfer)
- Setup fee: €0
- Refund fee: €0

**WooCommerce integration:**
- Official plugin: [GoPay Payment Gateway for WooCommerce](https://www.gopay.com/sk/integrations) — decent quality, updated quarterly. Installation: enter your goid, secret, flip sandbox/production. About 20 minutes.

```bash
wp plugin install gopay-payment-gateway-for-woocommerce --activate
```

**Payout speed:** T+3 (3 business days). It's slower than the competition — for a new store this can be a cash-flow problem.

**Sandbox:**
GoPay has a separate sandbox account (`gw.sandbox.gopay.com`). Test cards (4444 4400 0000 0007 and similar) work. The dashboard UX is dated, and I still find myself going back to the FAQ to dig up the test cards.

**Refund flow:**
From the Woo admin via Order → Refund, which triggers a refund through the GoPay API. It works, but **partial refunds** occasionally have a bug where the amount is off by a few cents. Full refunds are trouble-free.

**When GoPay wins:** a Czech or Slovak client who wants support in their native language; a lower-volume store where T+3 doesn't hurt; no monthly fee.

## Stripe

A global player, fully available in the EU. It has worked in Slovakia since 2019.

**Fees:**
- Monthly fee: €0
- Transaction fee: 1.5% + €0.25 (EEA cards), 3.25% + €0.25 (non-EEA cards), 0.8% + €0.30 capped at €6 (SEPA Direct Debit)
- Setup fee: €0
- Apple Pay / Google Pay: same as cards

**WooCommerce integration:**
[The official Stripe plugin](https://wordpress.org/plugins/woocommerce-gateway-stripe/) — the best-written plugin of the whole lineup. The developers are active, support is reliable. Setting up webhooks is intuitive:

```php
// .env style config in wp-config.php
define('STRIPE_PUBLISHABLE_KEY', 'pk_live_...');
define('STRIPE_SECRET_KEY', 'sk_live_...');
define('STRIPE_WEBHOOK_SECRET', 'whsec_...');
```

**Payout speed:** T+2 by default (rolling payout, two business days after settlement), with the first payout landing 7 to 14 days after your first transaction (initial anti-fraud hold). Even so, it's among the fastest in the lineup.

**Sandbox:**
Stripe Test Mode is the **king of the lineup**. A toggle right in the dashboard, no separate account. Test cards (4242 4242 4242 4242 and variants for 3DS, declines, or partial refunds) are perfectly documented. The `stripe listen` CLI tool tests webhooks locally.

```bash
stripe login
stripe listen --forward-to localhost:8000/wc-api/wc_stripe
stripe trigger payment_intent.succeeded
```

**Refund flow:**
Flawless. Partial and full refunds straight from the Woo admin, and Stripe processes them promptly. Disputes and chargebacks show up in the Stripe dashboard with full history.

**When Stripe wins:** a modern stack, a team comfortable with developer tooling, a need for fast payouts, customers from the EU beyond SK/CZ. Stripe is my default choice. If you're also figuring out what to even charge for an integration like this, see [pricing for small online stores](/en/blog/cenotvorba-eshop-models/).

## Tatra banka CardPay

A traditional Slovak player. The bank sets up a merchant account for you.

**Fees:**
- Monthly fee: ~€15/month (depends on the plan)
- Transaction fee: 1.2% (the lowest in the lineup, if you're counting on high volume)
- Setup fee: ~€100 (negotiable)
- Refund fee: €0

**WooCommerce integration:**
The official CardPay module works, but the integration is a slog. Setup: you have to request a test account from the bank (about a week's wait), get a certificate, and integrate via API configuration.

```php
// CardPay configuration — older patterns
define('CARDPAY_MID', '12345');
define('CARDPAY_PRIVATE_KEY_PATH', '/etc/cardpay/private.pem');
```

It's not built with developers in mind. On top of that, the integration takes more than a day, because the bank-certificate flow isn't trivial.

**Payout speed:** T+1 or T+2, depending on your agreement with the bank. Usually fine.

**Sandbox:**
The bank gives you a test endpoint and test card numbers. The UX is very 2010. It works, but nothing to write home about.

**Refund flow:**
Historically, refunds were handled through the bank (for example, Internet banking → refund request) rather than directly from the Woo admin, which was unintuitive for the people managing the store. (Newer modules do support refunds from the Woo admin — check the current version.)

**When CardPay wins:** a client with **high volume (over €500k/year)** for whom the lower 1.2% rate offsets the ~€180/year in monthly fees. Plus a client who already has a business account with Tatra banka and wants a single vendor. For small stores, it's needlessly complicated.

## ComGate

A Czech player growing fast, and popular in Slovakia too since 2020.

**Fees:**
- Monthly fee: €0
- Transaction fee: 1.39% + €0.07 (cards)
- Setup fee: €0
- Refund fee: €0

**WooCommerce integration:**
[The ComGate plugin](https://help.comgate.cz/) — reasonably maintained, setup around 25 minutes. The dashboard has nice statistics and a real-time transaction overview.

**Payout speed:** T+1 (next business day). Competitive with Stripe.

**Sandbox:**
A test merchant account on request via support. The dashboard UX is pleasant, and the test cards are clearly documented.

**Refund flow:**
Straight from the Woo admin, no problems. A refund goes through cleanly within 24 hours.

**When ComGate wins:** a Czech client who wants a competitor to GoPay with faster payouts and a better dashboard. A Slovak client who wants low fees and T+1 payouts without Stripe (e.g. a preference for a local SK/CZ provider).

## Table — summary

| | GoPay | Stripe | Tatra CardPay | ComGate |
|---|---|---|---|---|
| Monthly fee | €0 | €0 | €15 | €0 |
| Transaction fee | 1.4% + €0.10 | 1.5% + €0.25 | 1.2% | 1.39% + €0.07 |
| Setup fee | €0 | €0 | ~€100 | €0 |
| Payout speed | T+3 | T+2 | T+1 / T+2 | T+1 |
| Plugin quality | Decent | Excellent | Dated | Decent |
| Sandbox | OK | Excellent | Dated | OK |
| Refund via Woo admin | Yes (buggy on partials) | Yes | Not really (older module) | Yes |

## The real recommendation

- **Default choice:** Stripe. Best tooling, fast payouts, the easiest developer experience. The fees are slightly higher, but you get the value for them.
- **Local clients who want support in Slovak/Czech:** ComGate or GoPay. ComGate has faster payouts, GoPay is more established.
- **High-volume store (over €500k/year) with an account at Tatra banka:** CardPay pays off — the 1.2% rate covers even the ~€180/year in monthly fees.
- **A combination:** Stripe (default) + GoPay (for those who prefer a "local" gateway). Woo supports this natively — the customer chooses at checkout.

## The weak spots nobody talks about

- **3D Secure 2** is supported by all four, but the customer experience differs. Stripe has the least friction (Apple Pay and Google Pay satisfy SCA via on-device verification, so you usually skip the classic 3DS challenge); Tatra has the most.
- **Recurring payments / subscriptions** — Stripe is king. GoPay and ComGate handle subscriptions too, but the UX is worse. CardPay has no native recurring payments; it handles them through the ComfortPay add-on.
- **Multiple currencies** — Stripe natively supports 135+ currencies. The other three are primarily EUR/CZK.
- **Compliance documents** (PCI DSS, SOC 2) — Stripe has the best publicly available documentation. For B2B partners, this can be a deciding factor.

## TL;DR

Take Stripe as your default choice (fast payouts, developer-friendly, global). For support in Slovak/Czech, GoPay or ComGate (ComGate has faster payouts). CardPay only for a high-volume store with an existing relationship with Tatra banka. Avoid comparing based on marketing pages — test the sandbox for a day and you'll learn far more.

**Related:** [The WooCommerce checkout that converts](/en/blog/checkout-konvertuje-9-uprav/) · [WooCommerce + Pohoda + MoneyS3: stock and shipping](/en/blog/doprava-sklad-pohoda/)
