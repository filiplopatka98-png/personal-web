---
title: "WooCommerce vs Shopify for a Small SK Store: The Honest Comparison"
date: 2026-04-02
read: 8
tags: ["WooCommerce", "WordPress"]
excerpt: "A comparison across 5 dimensions on a 3-year horizon for a small SK store: TCO, customization, localization, payment gateways, and exit cost. Plus a clear call on when to reach for which platform."
featured: false
---

"Filip, we're building a small store — should we go Shopify or WooCommerce?" — I get this question at least once a month. The real answer is "it depends," but after the last 3 years I've got enough data to tell you specifically when each one wins.

This is NOT a clickbait comparison. Concrete numbers, concrete use cases, no PR spin.

## Dimension 1: 3-year TCO

The client = a small SK store, 200–300 products, 30k unique visitors per month, revenue of 100–300k EUR/year.

### Shopify Basic

| Item | EUR/month | EUR/3 years |
|---|---|---|
| Shopify Basic plan | 29 | 1,044 |
| Slovak / multi-currency apps | 15 | 540 |
| Email marketing app (Klaviyo Lite) | 0–25 | 0–900 |
| Reviews app (Loox) | 10 | 360 |
| Important: 2% transaction fee (if you don't use Shopify Payments — and it isn't available in SK) | ~150 | 5,400 |
| **Total over 3 years** | | **7,244–8,244 EUR** |

### WooCommerce + WordPress

| Item | EUR/one-time | EUR/year | EUR/3 years |
|---|---|---|---|
| Hosting (Webglobe / WP Engine starter) | — | 120 | 360 |
| Theme (Astra Pro / Blocksy) | — | 49 | 147 |
| Stripe / GoPay (transaction fees ~1.4%) | — | 0 | 0 |
| Premium plugins (ACF Pro, WP Rocket, Yoast Premium) | 200 | 200 | 800 |
| **Total over 3 years** | | | **~1,300 EUR** |

Plus payment fees: WooCommerce with GoPay ~1.4% vs Shopify ~2% (with another 2% transaction fee on top if you don't use Shopify Payments). At 200k EUR/year in revenue, that's an extra **2,400 EUR/year for Shopify**.

**Real difference over 3 years: ~10–13k EUR.**

Shopify makes up for it with **setup speed** and **out-of-the-box features**. You have to weigh those euro differences against that.

## Dimension 2: Customization

### Shopify

Frontend = the Liquid templating language. Limited. It's enough for 90% of use cases, but if you want:
- a product page with a custom price calculator based on parameters,
- a registration flow with a 4-step onboarding,
- backend logic that manipulates the order before payment,

you have to go through Shopify Functions / apps, which you either pay for monthly or code yourself in Node.js. It's not zero effort.

Theme customization is pleasant, but the **theme setting limits** are real. If you want an extra option, you have to edit Liquid (which Shopify's admin UI barely supports).

### WooCommerce

PHP, hooks, filters. For a developer who knows WordPress, everything is open. Example: you want to add a "requires approval before shipping" option to a product:

```php
// functions.php — 5 minutes of work
add_action('woocommerce_thankyou', function($order_id) {
    $order = wc_get_order($order_id);
    foreach ($order->get_items() as $item) {
        $product = $item->get_product();
        if ($product->get_meta('requires_approval') === 'yes') {
            $order->update_status('on-hold', 'Čaká na schválenie produktu');
            wp_mail('admin@firma.sk', 'Nová objednávka na schválenie', "Order #{$order_id}");
            return;
        }
    }
});
```

Freedom has a price — you can break everything. Discipline and a child theme are a must.

**Customization verdict:** Woo > Shopify for teams with their own developer. Shopify > Woo for teams without one.

## Dimension 3: SK/CZ localization

This is the area **where Shopify genuinely falls short in our region**.

### Shopify

- Slovak translation of the admin UI: it exists, but in some sections it's incomplete (Reports and Analytics stay in English).
- Multilingual storefront: via Shopify Markets (basic tier free) + the Translate & Adapt app. It works, but "beautiful SEO" for `/sk/` and `/cz/` on separate domains requires Shopify Plus (2,300 USD/month, lol).
- VAT compliance: SK 23% / CZ 21%. Shopify handles tax rates by country, but the invoice format isn't Slovak (no IČO, no IČ DPH unless you add it manually).
- Accounting connections (Pohoda, MoneyS3, iDoklad): via third-party apps, lightweight, often half-baked.

### WooCommerce

- Slovak translation of WordPress + Woo: 100%, maintained long-term.
- Multilingual: WPML or Polylang. Stable, well integrated with Woo.
- VAT: plugins like [Kybernaut IČO DIČ](https://wordpress.org/plugins/woolab-ic-dic/) handle IČO/IČ DPH/DIČ on the invoice directly and verify them via ARES/VIES, with an invoice format that follows the SK standard.
- Accounting connections: direct integrations with Pohoda mServer, plugins for MoneyS3. I walk through the whole setup — including inventory and shipping — in [WooCommerce + Pohoda + MoneyS3](/en/blog/doprava-sklad-pohoda/).

**Localization verdict:** WooCommerce wins by a wide margin for the SK/CZ market.

## Dimension 4: Payment gateways

### Shopify

In SK you **don't get Shopify Payments**. You have to go through a third-party gateway, which means an extra +2% transaction fee from Shopify on top. Gateways available through Shopify:

- Stripe — works, OK.
- GoPay — via a non-standard plugin, uneven quality.
- Tatra banka — historically problematic, better today, but still creaky.

In practice: you have to pay that +2% fee on top of everything.

### WooCommerce

GoPay, ComGate, Tatra eCard, Stripe, PayPal — all **official plugins**, quality varies, but they work. No fees on top. Setup is usually 30 minutes. You'll find a detailed gateway comparison in [Slovak payment gateways in 2026](/en/blog/sk-platobne-brany-2026/).

```bash
# e.g. the official GoPay plugin
wp plugin install gopay-gateway --activate
# configuration in Woo → Settings → Payments
```

**Payments verdict:** WooCommerce is significantly better for the SK market.

## Dimension 5: Exit cost — what if you quit

### Shopify

You can export your content (products, orders, customers) as CSV. **Your theme and customizations stay in Shopify** — you can't reuse Liquid templates elsewhere. You cancel the app subscriptions, but the data you have in them often stays behind a paywall.

Migrating away from Shopify = a complete storefront rebuild and re-implementation of your integrations. ~80–160 developer hours for a mid-size store.

### WooCommerce

You're on your own hosting. The database is yours. The theme files are yours. You grab the entire `wp-content/` directory + a database dump and move it to another host. Migration = ~4 hours.

If you want to leave WordPress entirely (say, for Medusa.js), CSV export works the same as with Shopify. You'll rebuild your custom theme code, but you **still own the storefront content**.

**Exit verdict:** WooCommerce is significantly better. Shopify is vendor lock-in.

## When I recommend Shopify

- **Founder without a dev team**, non-technical, with a budget of 5–10k EUR per year.
- A need for a **fast launch** (2–3 weeks), not robustness at any cost.
- The goal is a global market where Shopify Markets makes sense (US, UK, an EU mix).
- A predictable stack — you don't need exotic integrations.
- Catalog < 200 products, no per-customer custom pricing.

## When I recommend WooCommerce

- **The target is the SK/CZ market** with accounting in Pohoda/MoneyS3.
- A need for **data ownership** and the option to leave anytime.
- **Customization** beyond "product pages and checkout."
- B2B elements — per-customer pricing, role-based catalogs, quote requests.
- A multilingual storefront with strong SEO in each language.
- You have a developer or an agency that knows WordPress.

## Which platform most of my clients end up choosing

Over the last 2 years I've launched ~14 SK stores. **WooCommerce 11×, Shopify 3×.** Those three Shopify projects were: 1) a US founder with a Slovak branch, 2) a startup with a 6-week launch deadline, 3) a client who wanted **as little** technical wrestling as possible (and accepted +2.5k EUR per year for it).

## TL;DR

For a small SK store on a budget, Woo wins the 3-year TCO by ~10k EUR, plus SK/CZ localization, payment gateways, and exit cost. Shopify wins on setup speed, polished UX, and maintenance. Recommend Shopify only when the founder explicitly has no dev support and wants to pay extra for convenience. Otherwise, Woo.

Related: [A WooCommerce checkout that converts](/en/blog/checkout-konvertuje-9-uprav/).
