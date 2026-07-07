---
title: "Abandoned cart recovery on WooCommerce without pricey plugins"
date: 2026-09-24
read: 8
tags: ["WooCommerce"]
excerpt: "Seven out of ten carts end up abandoned. Here's how to win a chunk of them back for zero euros a month — one free plugin plus your own code instead of a subscription."
featured: false
---

The average e-commerce cart abandonment rate has sat around **70%** for years — Baymard Institute maintains this aggregate from nearly fifty studies, and the number has barely moved in a decade ([baymard.com/lists/cart-abandonment-rate](https://baymard.com/lists/cart-abandonment-rate)). That means seven out of ten people who drop something into a cart leave without buying. Part of that is just window shopping — you can't do anything about it. But a measurable slice you can win back with a single email, and you don't need a subscription for it.

I see it all the time: a store owner buys an expensive "all-in-one" marketing bundle for tens of euros a month just to send one recovery email. That's overkill. Here's the cheap path.

## Why people abandon carts (and what an email can actually fix)

Baymard has hard data on why people bail during checkout. The number one reason, six years running: **unexpected extra costs** — shipping, taxes, fees. In their survey **39%** of people cited it ([baymard.com/learn/reduce-cart-abandonment](https://baymard.com/learn/reduce-cart-abandonment)). Next up are forced account creation, a checkout that's too long, and distrust when entering card details.

Most of that is a checkout-design problem, not an email problem — I wrote about it in [nine micro-fixes for a WooCommerce checkout](/en/blog/checkout-konvertuje-9-uprav/). The recovery email is the second layer: it catches the people who got interrupted by a phone call, wanted to "think it over," or were comparing prices elsewhere. Those are exactly the ones a good reminder brings back.

## The free plugin that's genuinely enough

I won't pretend you'll write a custom recovery system in an hour. For 95% of small stores the smartest move is to start with the **Cart Abandonment Recovery for WooCommerce** plugin (by CartFlows). It's free on WordPress.org, has over **300,000 active installations**, and is actively maintained — version 2.1.3 shipped in June 2026 ([wordpress.org/plugins/woo-cart-abandonment-recovery](https://wordpress.org/plugins/woo-cart-abandonment-recovery/)).

Why this one over the ten others? Two things most of the free competition doesn't have at once:

1. **It captures the email the moment a visitor types it into checkout** — that is, before the order is finished. Without that you'd have no one to send a reminder to.
2. **It supports WooCommerce Cart & Checkout blocks**, not just the classic shortcode checkout (since version 1.3.0). That matters today — I cover the differences in [Checkout Blocks vs classic](/en/blog/woo-checkout-blocks-vs-classic/).

The free version does unlimited recovery emails, sequence scheduling, coupon generation, 1-click cart restoration, and its own analytics dashboard. You only pay for the SMS/WhatsApp channel — and for a small store you usually don't need it.

The setup that works in most projects is a simple three-step sequence:

- **+1 hour** — a plain reminder with no discount ("you left items in your cart").
- **+24 hours** — add social proof or answer an objection (shipping, availability).
- **+3 days** — only here do you drop in a small coupon, if at all.

Never put a discount in the first email. You'll teach people to abandon carts on purpose because they know a code is coming within the hour.

## When to leave it to the plugin, and when to reach for code

The plugin has a ceiling. When you want custom logic — hooking into your own ESP (say, via an API), branching by cart value, or not pinging people who bought something else in the meantime — it's cleaner to build a thin layer yourself. WooCommerce already has everything you need in core.

The key piece is **Action Scheduler** — a job queue that's part of every WooCommerce install and is more robust than bare WP-Cron. Instead of `wp_schedule_single_event()` you use `as_schedule_single_action()`; the function returns the scheduled action's ID and can group actions via `$group` ([actionscheduler.org](https://actionscheduler.org/)).

A minimal custom recovery without the plugin looks like this. When an order is created in "pending" status (the customer entered their details but didn't pay), we schedule a check an hour later:

```php
// functions.php or a small mu-plugin
add_action( 'woocommerce_checkout_order_created', function ( $order ) {
    // Schedule a check 1h after order creation
    as_schedule_single_action(
        time() + HOUR_IN_SECONDS,
        'kuko_check_abandoned_order',
        [ 'order_id' => $order->get_id() ],
        'kuko-recovery' // group
    );
} );
```

An hour later the handler checks whether the order is still sitting unpaid and sends the email. It's important to verify the current status — it may have been paid or cancelled in the meantime:

```php
add_action( 'kuko_check_abandoned_order', function ( $order_id ) {
    $order = wc_get_order( $order_id );
    if ( ! $order ) {
        return;
    }

    // Only send if it's still awaiting payment
    if ( ! $order->has_status( [ 'pending', 'failed' ] ) ) {
        return;
    }

    $email = $order->get_billing_email();
    if ( ! is_email( $email ) ) {
        return;
    }

    $pay_url = $order->get_checkout_payment_url(); // link to finish payment

    wp_mail(
        $email,
        'Finish your order',
        sprintf(
            'Hi, your order is waiting to be completed. Finish it here: %s',
            esc_url_raw( $pay_url )
        )
    );
} );
```

`get_checkout_payment_url()` returns a link that takes the customer straight to paying their existing order — they don't have to click through anything again. That's the whole core of "recovery." The rest is copywriting and timing.

A few things you have to police yourself, because the plugin handles them for you:

- **Deduplication.** Don't send three emails for the same order. Store a `meta` flag (`$order->update_meta_data( '_kuko_recovery_sent', 1 )`) and check it at the top of the handler.
- **Consent and GDPR.** An email typed into checkout may be used to complete **that** transaction (legitimate interest), but not for future marketing without consent. Don't mix the recovery reminder with a newsletter.
- **Deliverability.** `wp_mail()` over PHP mail lands in spam. Set up transactional SMTP (Postmark, Brevo, Amazon SES) — otherwise the whole effort is wasted.

## What to realistically expect

Don't promise yourself miracles. A good recovery rate on WooCommerce typically sits around **5–10%** of carts won back ([funnelkit.com/woocommerce-cart-abandonment](https://funnelkit.com/woocommerce-cart-abandonment/)). It sounds small until you translate it into money: for a store doing hundreds of orders a month, that's a handful of extra purchases every week — from an email that sends itself.

And above all: a recovery email will never fix a broken checkout. If people are fleeing because of expensive shipping or forced registration, no email will save it — fix the reason first, then chase the abandoned carts. If you're also working on the payment side, see the [overview of Slovak payment gateways in 2026](/en/blog/sk-platobne-brany-2026/). The order is always the same: cut abandonment with design first, then let the recovery email mop up the rest.
