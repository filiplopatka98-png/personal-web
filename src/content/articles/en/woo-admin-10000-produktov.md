---
title: "WooCommerce Admin at 10,000+ Products: Keeping the Backend Fast"
date: 2026-09-17
read: 8
tags: ["WooCommerce", "Performance"]
excerpt: "With a big catalog, WooCommerce admin chokes exactly where nothing is cached: postmeta JOINs, bloated autoload, and Action Scheduler. Here's what actually helps."
featured: false
---

You can hide a storefront behind a cache. You can't hide the admin. The product list, editing, bulk edits, orders — all of it runs the full WordPress + WooCommerce stack on every request, bypasses page cache, and fires expensive queries at the database. At 200 products nobody notices. At 10,000+ SKUs it becomes a daily embarrassment: the product list takes 5 seconds to load, a bulk price edit times out, and the client messages you that "the whole thing froze."

Good news: in most cases it's not the hosting and it's not "slow WordPress." It's four specific places where scaling breaks. Let's walk through them.

## postmeta JOINs are the first culprit

WooCommerce classically stores price, stock, rating, and SKU in `wp_postmeta` — one row per value. The product list in the admin then runs a series of JOINs against that table, and at 10,000 products it easily grows into millions of rows. A fulltext SKU search over `wp_postmeta` could take around 40 seconds on a large dataset.

The fix is **product lookup tables** (`wc_product_meta_lookup`), introduced in WooCommerce 3.6 (April 2019). Instead of JOINing to `wp_postmeta`, queries attach to a normalized lookup table where each product has price, stock, and rating in a single row. That same SKU search that took 40 seconds dropped to under 1 second.

They work automatically, but after a migration, import, or bulk edit they can drift out of sync — and then the admin shows stale prices or wrong stock. Regenerate them from **WooCommerce → Status → Tools → Update product lookup tables**, or via WP-CLI:

```bash
wp wc tool run regenerate_product_lookup_tables --user=1
```

This is the first thing I check on any slow Woo admin. I regularly see stores where the lookup tables exist but haven't been regenerated in years — and the database is still grinding through postmeta anyway.

## Autoload: the silent memory hog on every request

On every page load — including admin requests — WordPress pulls all autoloaded `wp_options` in a single query. On a bloated store that means several megabytes moving from MySQL into PHP on **every** request. The Woo ecosystem is the main offender here: plenty of plugins stuff transients, config, and cache into autoloaded options. The worst are leftovers from deactivated plugins that never cleaned up after themselves.

Since WordPress 6.6 (July 2024) this got a bit better — options above a size threshold are no longer autoloaded by default (the default is 150 KB, tunable via the `wp_max_autoloaded_option_size` filter) and Site Health flags a critical "Autoloaded options could affect performance" issue once total autoload exceeds 800 KB. Treat that 800 KB as your red line.

Measure it with one SQL query:

```sql
SELECT ROUND(SUM(LENGTH(option_value))/1024) AS autoload_kb, COUNT(*)
FROM wp_options WHERE autoload IN ('yes', 'on', 'auto-on');
```

If you're over 800 KB, find the biggest offenders and delete what doesn't belong there — especially orphaned options from old plugins. While you're at it, make sure `wp_options` has the index that helps these queries:

```sql
CREATE INDEX autoloadindex ON wp_options (autoload, option_name);
```

For what belongs in an object cache instead of autoload, I wrote about [Redis object cache on WordPress](/en/blog/redis-object-cache-wordpress/) — with a big catalog it's one of the biggest levers you have.

## Action Scheduler: the table that quietly grows into millions

Every order, email, webhook, product sync, and analytics job runs through Action Scheduler and writes a row into `wp_actionscheduler_actions`. The row stays there after the task completes. Even 50 orders a day can mean 500–750 new rows daily — that's 180,000–270,000 rows a year from orders alone. On a busy store that table hits millions of rows, indexes bloat, and the **Scheduled Actions** page in the admin becomes unusable. Worse — new task processing slows down, so orders, webhooks, and emails get delayed.

Here's the good news from summer 2026: **Action Scheduler 4.0.0** (June 17, 2026, part of WooCommerce 11.0) reworked cleanup. It now runs as a dedicated daily task at 3 AM site time, deletes in batches of at least 250 actions, and is no longer on the critical processing path — so it can catch up even on enormous tables. Failed actions are removed after 3 months. It requires WordPress 6.8+.

If you need a shorter retention for completed actions, tune it with a filter (default is 30 days):

```php
add_filter( 'action_scheduler_retention_period', function () {
    return 7 * DAY_IN_SECONDS;
} );
```

For a one-time cleanup of historical backlog on an old store, targeted SQL helps — but do it on a backed-up DB and off-peak:

```sql
DELETE FROM wp_actionscheduler_actions
WHERE status IN ('complete', 'failed', 'canceled')
  AND scheduled_date_gmt < DATE_SUB(NOW(), INTERVAL 60 DAY);
```

## Enable HPOS — but scale it carefully with a big catalog

High-Performance Order Storage (HPOS) moves orders out of `wp_posts`/`wp_postmeta` into dedicated tables optimized for Woo queries. The numbers Woo cites: up to **5× faster order creation**, up to **1.5× faster checkout**, and finding an order up to **40× faster**. With a big catalog and lots of orders, this is the biggest admin-side jump you get "for free."

The catch is the migration. Don't rely on scheduled jobs — with a large order count, run the sync via CLI and time how long it takes (Woo cites a test store with 9 million orders where the final migration took about a week):

```bash
wp wc hpos sync
wp wc hpos verify_cot_data --verbose
```

The sequence: in **WooCommerce → Settings → Advanced → Features**, first keep "Use the WordPress posts tables" and enable synchronization, let the CLI finish, verify integrity, and only then switch to "Use the WooCommerce orders tables." Disable compatibility mode last. Never do this for the first time on production — staging first, time it, then production off-peak.

## What else actually helps

A few things that, with a big catalog, mean the difference between "it works" and "misery":

- **Object cache (Redis).** The admin bypasses page cache, but an object cache offloads repeated DB queries. Details in the article above.
- **Audit admin-heavy plugins.** SEO and analytics plugins that hook into `save_post` or the product list can multiply the cost of every bulk edit. A [plugin diet](/en/blog/plugin-dieta-z-28-na-9/) pays off for the admin too, not just the front end.
- **PHP memory and `max_input_vars`.** Bulk edits and large imports need headroom; the default 128 M isn't enough at 10,000 products.
- **If the DB genuinely hurts, consider a headless front end** and offload visitor traffic — but that's a different league and only comes up once you've got the four points above handled. When it makes sense I covered in [headless Woo + Next.js](/en/blog/headless-woo-nextjs-kedy/).

With a big catalog there's no single magic switch. But if you work through lookup tables → autoload → Action Scheduler → HPOS in that order, you'll remove most of the pain before you even start thinking about switching hosts.
