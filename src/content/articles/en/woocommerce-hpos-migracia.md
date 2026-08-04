---
title: "WooCommerce HPOS: how to safely migrate orders to the new tables"
date: 2026-08-05
read: 8
tags: ["WooCommerce", "WordPress"]
excerpt: "HPOS moves orders out of wp_posts into dedicated tables and turns a sluggish admin into a fast one once your order history grows. A safe migration path: backup, compatibility mode, WP-CLI sync, data verification, and a rollback plan."
featured: false
---

If you launched a WooCommerce store before 2023, your orders are almost certainly still living where WordPress has always kept them — in the `wp_posts` table alongside your posts and pages, with the order metadata in `wp_postmeta`. It works, but it's an architecturally poor deal: `wp_postmeta` is an EAV structure (key-value pairs), so even a simple filter like "completed orders from last month" turns into several JOINs against a table that grows forever and has no real indexes for the business questions a store actually asks.

HPOS (High-Performance Order Storage, formerly "Custom Order Tables") is WooCommerce's answer to exactly that problem. The plan was published in January 2022 ([developer.woocommerce.com/2022/01/17](https://developer.woocommerce.com/2022/01/17/the-plan-for-the-woocommerce-custom-order-table/)), community testing ran from May 2022, and it reached stable status in **WooCommerce 8.2** (released October 10, 2023) — since then HPOS is enabled by default for every new install ([developer.woocommerce.com — HPOS docs](https://developer.woocommerce.com/docs/features/orders/high-performance-order-storage/)). If your store predates that release, you're likely still on the legacy storage, and the migration is on you.

## Why it's worth doing

This isn't a cosmetic change. According to WooCommerce's official announcement, HPOS delivers **up to 5x faster** order creation, **up to 40x faster** order search/filtering in the admin, and **up to 1.5x faster** checkout ([woocommerce.com — Platform Upgrade: HPOS](https://woocommerce.com/posts/platform-update-high-performance-order-storage-for-woocommerce/)). On a small store doing dozens of orders a month you won't notice. On a store with thousands of orders and years of history, it's the difference between an admin you can actually use and one where filtering orders by customer takes ten seconds. I cover the same "large catalog = slow admin" problem from the product side in [Woo admin at 10,000+ products](/en/blog/woo-admin-10000-produktov/) — there the culprit is postmeta on products; here it's the exact same design flaw, just on orders.

HPOS moves data out of `wp_posts`/`wp_postmeta` into four dedicated tables, built specifically around how WooCommerce actually works with orders ([woocommerce.com — Installed Database Tables](https://woocommerce.com/document/installed-database-tables/)):

- `wp_wc_orders` — the order core (status, currency, totals, dates)
- `wp_wc_order_addresses` — billing and shipping addresses
- `wp_wc_order_operational_data` — payment and shipping operational data
- `wp_wc_orders_meta` — free-form metadata (what plugins used to dump into postmeta)

The upshot: instead of a chain of JOINs against an EAV table, you get plain columns with real indexes. A query that under the legacy structure would look like a dozen `postmeta` JOINs on `meta_key IN ('_billing_email', '_order_total', ...)` becomes a direct `WHERE` clause against real columns in `wp_wc_orders`.

## How to check your current state

Under **WooCommerce → Settings → Advanced → Features** you'll find the High-Performance Order Storage section showing the current state — legacy (posts), HPOS, or compatibility mode (both, kept in sync). You can pull the same info from the terminal:

```bash
wp wc hpos status
```

The command prints which storage is currently authoritative, whether compatibility mode is running, how many orders are pending sync, and how many are pending cleanup from the old tables ([developer.woocommerce.com — HPOS CLI Tools](https://developer.woocommerce.com/docs/features/high-performance-order-storage/cli-tools/)). If you don't have WP-CLI handy yet, I keep a rundown of the commands I use most for routine WordPress maintenance in [WP-CLI: 12 commands that save you hours](/en/blog/wp-cli-12-prikazov/) — HPOS commands aren't among that dozen, but the "terminal over waiting on a web UI" philosophy applies just the same.

## A safe migration path

Don't treat an order migration as any less serious than moving an entire site — the "backup first, verify, then cut over" principle is the same one I use in [migrating WordPress without downtime](/en/blog/wp-migracia-bez-vypadku/). Here's a sequence that works for a store already in production.

### 1. Back up the database

Non-negotiable, before touching anything in Advanced → Features:

```bash
wp db export before-hpos-$(date +%Y%m%d).sql
```

### 2. Turn on compatibility mode first (not HPOS directly)

Under **WooCommerce → Settings → Advanced → Features**, enable **"Enable compatibility mode (synchronizes orders to the posts table)."** This does NOT switch the authoritative table — it just starts syncing orders bidirectionally between the old and new storage in the background ([developer.woocommerce.com — Enable HPOS](https://developer.woocommerce.com/docs/features/orders/high-performance-order-storage/enable-hpos/)). This is the point where you can break the least while learning the most — if something's off, you're still reading from the legacy data and nothing is lost.

Sync runs by default through Action Scheduler in batches of 25 orders; you can watch progress and trigger it manually under **WooCommerce → Status → Scheduled Actions**.

### 3. For a bigger store, don't wait on the web scheduler — use WP-CLI

With hundreds or thousands of orders, waiting on Action Scheduler over HTTP is slow and runs into request timeouts. It's faster and more reliable to trigger the sync directly:

```bash
wp wc hpos sync
```

The command migrates orders from the currently active storage to the other one, based on your Advanced → Features setting, and is considerably faster than relying on compatibility mode's background jobs alone ([developer.woocommerce.com — HPOS CLI Tools](https://developer.woocommerce.com/docs/features/high-performance-order-storage/cli-tools/)). You can check how many orders are still unsynced at any point with:

```bash
wp wc hpos count_unmigrated
```

### 4. Verify data consistency before switching

This is the step people skip and then chase weird bugs in their reports for. HPOS ships with a built-in tool to compare data between both storages:

```bash
wp wc hpos verify_data
```

If it finds discrepancies (a mismatched status, a missing meta key), you can reconcile them directly by adding `--re-migrate`. For a specific order you're suspicious of, drill into the detail:

```bash
wp wc hpos diff 12345 --format=list
```

### 5. Switch the authoritative table

Once `count_unmigrated` reports zero and `verify_data` comes back clean, switch to HPOS as the primary storage under Advanced → Features. I'd still leave compatibility mode running for a while after the switch — it's your safety net, letting you fall back if something's off (say, a plugin that reads directly from `wp_postmeta`).

## Rollback

That's exactly why you don't turn compatibility mode off right away: if you spot a problem after switching (a broken report, a plugin that stopped working), you can just flip the authoritative table back to "WordPress posts storage" under Advanced → Features. As long as sync was running, the old tables have been kept up to date the whole time, so reverting isn't a destructive operation. Only once you're fully confident HPOS is running cleanly (typically after weeks in production) should you clean up the old data:

```bash
wp wc hpos cleanup all
```

This step is irreversible — it actually deletes the legacy data in `wp_postmeta`. Don't run it until you have a fresh backup and are certain you won't be reverting.

## The real gotcha: incompatible plugins

This is why you don't just flip HPOS on blind in production. Any plugin or custom code that reads orders directly via SQL against `wp_posts`/`wp_postmeta` instead of the official `WC_Order` / `wc_get_orders()` API will break or see incomplete data under HPOS. WooCommerce has a safeguard for this — if it detects an incompatible plugin, it automatically disables HPOS and shows you a list of the problem extensions in the admin, with a recommendation to contact their authors to add support ([developer.woocommerce.com — HPOS docs](https://developer.woocommerce.com/docs/features/orders/high-performance-order-storage/)).

In practice, that means: before migrating in production, check every plugin that touches orders — invoicing tools, accounting exports, custom reporting, older inventory integrations — on staging first, never directly against a live store. If you have custom code reading `get_post_meta($order_id, ...)` instead of `$order->get_meta(...)`, fix it before the switch — that's exactly the kind of code HPOS will catch you off guard with.

## Wrap-up

HPOS isn't an optional toy — it's the direction WooCommerce's architecture is moving, and once your order history grows, the admin speed difference is immediately noticeable. The safe path is always the same: backup → compatibility mode → WP-CLI sync instead of waiting on the web scheduler → `verify_data` → switch → cleanup only after a delay. If you want to pair it with a database caching layer too (Redis object cache alongside HPOS for orders), see [Redis object cache on WordPress](/en/blog/redis-object-cache-wordpress/) — both changes address the same root problem: a database that becomes the bottleneck as a store grows.
