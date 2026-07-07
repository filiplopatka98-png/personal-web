---
title: "WooCommerce Checkout Blocks vs classic: switch, or wait (2026)"
date: 2026-09-22
read: 8
tags: ["WooCommerce"]
excerpt: "Blocks checkout is the default for new installs, yet 87% of stores still run classic. When migration pays off, when it's premature, and what actually changes."
featured: false
---

The question "do we go Checkout Blocks or stay on classic?" comes up more and more, and the answer isn't as clean-cut as WooCommerce marketing makes it sound. Blocks have been the default for new installs on block themes since WooCommerce 8.3 (November 2023), but in practice most existing stores still run the old shortcode checkout — and they have good reasons.

Let's break it down without the PR gloss. What you actually gain, what you lose, and when the switch makes sense for your specific project.

## Where things stand today

Data from an analysis of roughly 10,000 WooCommerce stores (Maarten Belmans, cited by Business Bloomer) is blunt: **87% of stores still run classic checkout, only 13% run blocks**. Even among stores created after November 2023, when blocks became the default, adoption sits around 18%.

That's no accident. Blocks checkout runs on React and the Store API — a completely different architecture from PHP templates and the `[woocommerce_checkout]` shortcode. And that architecture shift is the source of the whole debate.

The difference in one sentence: classic checkout is rendered server-side via PHP templates and you extend it through dozens of well-known hooks (`woocommerce_checkout_fields`, template overrides). Blocks checkout is rendered in the browser via React components and you extend it through curated JavaScript APIs and the Store API.

## What you actually gain by moving to Blocks

It's not just "more modern." Blocks bring a few things you either don't have on classic or had to bolt on with plugins:

- **One-tap express payments** — Apple Pay, Google Pay, and link-based checkouts sit in the block natively. Per the FIS Worldpay Global Payments Report, digital wallets already make up around 49% of global e-commerce transaction value, so this is not a fringe feature.
- **Local pickup as its own step** — in-store pickup is a dedicated selection step, not glued onto shipping. For stores with pickup points and self-collection, it's a cleaner UX.
- **Visual assembly in the editor** — you edit cart and checkout in the block editor with a live preview instead of template overrides.
- **Less layout shift** — blocks render fields more stably, which helps INP and CLS. And checkout speed directly affects conversion: the well-worn estimate is roughly a 7% drop in conversions per second of added delay.

For a brand-new store you're building from scratch, with no backpack of legacy plugins, blocks are a sensible default today.

## What's still painful

Here's why 87% of stores stay on classic — and it needs to be said plainly.

**Plugin compatibility.** The single biggest adoption blocker. Until a plugin explicitly supports blocks checkout, its fields, integrations, or custom logic simply don't work. James Kemp of WooCommerce admits it himself: many plugins aren't compatible with blocks checkout. If your store has 3–4 checkout plugins (invoicing, shipping, gift cards, loyalty), the odds that at least one doesn't support blocks are high.

**Curated extensibility.** WooCommerce deliberately did not replicate every classic hook. It's a "curated extensibility" philosophy — you get defined spots (slots) where you can inject your own React components via fills, but not the free hand you had with PHP hooks. If your store rests on heavy checkout customization via `woocommerce_checkout_fields` or template overrides, the rewrite isn't trivial.

**Classic hooks don't fire.** This one surprises people. The old way to add a field:

```php
// Classic checkout — does NOT work on Blocks checkout
add_filter( 'woocommerce_checkout_fields', function ( $fields ) {
    $fields['billing']['billing_ico'] = [
        'label'    => 'Company ID',
        'required' => false,
        'class'    => [ 'form-row-wide' ],
    ];
    return $fields;
} );
```

On blocks checkout this filter does nothing. The field won't show, validation won't run. You have to reach for the new API.

## A custom field on Blocks checkout, done right

Good news: for simple fields (text, checkbox, select) you don't have to write a single line of JavaScript. WooCommerce has an **Additional Checkout Fields API** — pure PHP, stable since WooCommerce 8.9 (May 2024). You register via `woocommerce_register_additional_checkout_field` on `woocommerce_init` or later:

```php
add_action( 'woocommerce_init', function () {
    woocommerce_register_additional_checkout_field( [
        'id'       => 'kuko/ico',
        'label'    => 'Company ID',
        'location' => 'address', // 'contact' | 'address' | 'order'
        'type'     => 'text',     // 'text' | 'checkbox' | 'select'
        'required' => false,
    ] );
} );
```

Three locations and what they mean:

- `contact` — top of the form, saved to the customer account,
- `address` — in both shipping and billing forms, saved to customer and order,
- `order` — in the order information block, saved to the order only.

You add validation and sanitization via WordPress action hooks; you react to a saved value via `woocommerce_set_additional_field_value`. For 80% of real needs (VAT ID, company number, note, consent, pickup point) this is enough. Fancier stuff — conditional fields, custom React components — needs Slots & Fills and JavaScript enqueuing, and that's where cost climbs.

If you need deeper checkout optimization without rewriting the architecture, see [9 micro-tweaks to a WooCommerce checkout from a real audit](/en/blog/checkout-konvertuje-9-uprav/) — most of them work on both versions.

## How to roll back (and why it matters)

This is the safety net that lowers the risk of experimenting. You can turn a blocks checkout back into classic anytime: in the block editor click the block, and in the toolbar hit **Transform → Classic Shortcode**. Cart and checkout work as a pair — if you revert checkout, revert cart too.

In practice that means you can test the migration on staging, and if something doesn't fit, you're back in a minute. No one-way trip.

## My decision rule for 2026

I'm not going to tell you "everyone onto blocks." The reality is more nuanced:

**Go Blocks if:**

- you're building a new store from scratch on a block theme,
- you want express payments (Apple/Google Pay) and simple local pickup,
- your checkout customizations fit within the Additional Fields API,
- all your key plugins explicitly support blocks (verify it, don't assume).

**Stay on Classic (for now) if:**

- you have a running store with heavy PHP checkout customizations,
- you depend on plugins that don't support blocks,
- your checkout converts and you have no measurable reason to rewrite it.

The golden rule: **don't migrate a working checkout just because blocks are "the future."** They are the future — WordPress and WooCommerce are both heading this way and extensibility improves release over release. But rewriting a production checkout with no measurable upside is pure risk, no reward.

If you're picking a platform from scratch before you even worry about checkout, read the [honest WooCommerce vs Shopify comparison for a small store](/en/blog/woocommerce-vs-shopify/). And when you're sorting out payments, the [rundown of Slovak payment gateways in 2026](/en/blog/sk-platobne-brany-2026/) helps — because blocks-checkout support varies between gateways.

## Bottom line

Blocks checkout is neither hype nor a dead end — it's where WooCommerce is going. But as of September 2026, it's still true that 87% of stores run classic and are right to, unless they have a concrete reason to switch. New project? Blocks. Working store with legacy customizations? Test on staging, verify plugins, and if something breaks, `Transform → Classic Shortcode` gets you back. Decide by your stack, not by the changelog.
