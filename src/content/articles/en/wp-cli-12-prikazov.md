---
title: "WP-CLI: 12 Commands That Save You Hours"
date: 2026-10-13
read: 8
tags: ["WordPress"]
excerpt: "A practical WP-CLI toolkit: search-replace for migrations, bulk updates, checksum verification, transient cleanup, and emergency password resets — all from the terminal."
featured: false
---

If you manage WordPress through wp-admin and a mouse, you're doing it slower than you need to. WP-CLI is WordPress's official command-line tool, and it handles most routine work — updates, migrations, DB cleanup, debugging — in seconds instead of minutes. The current stable release is **2.12.0** (shipped May 7, 2025), with support up to PHP 8.4.

Here are the twelve commands I reach for most. This isn't a reference manual — it's the subset that actually saves time. Always run these from the WordPress root (where `wp-config.php` lives), or add `--path=/path/to/site`.

## 1. search-replace — the king of migrations

This is the single reason most people install WP-CLI at all. When you move a site from local to production, you have to rewrite the domain across the entire database — including **serialized** data (widget settings, page builders, ACF). A plain SQL `REPLACE` breaks serialized arrays because it doesn't recompute the string length. WP-CLI handles it correctly:

```bash
# Dry run first — reports how many occurrences it would change, writes nothing
wp search-replace 'https://localhost:8888' 'https://mysite.com' --dry-run

# Live run, skipping the guid column (that one never changes)
wp search-replace 'https://localhost:8888' 'https://mysite.com' --skip-columns=guid
```

`--dry-run` here is mandatory, not a luxury — always read the report first. For stubborn serialized data, add `--precise` (it processes in PHP instead of SQL, slower but more reliable). I walk through the whole process in my post on [migrating WordPress from local to production without downtime](/en/blog/wp-migracia-bez-vypadku/).

## 2. db export — a backup in two seconds

Before you change anything, dump the database. No plugin, no clicking around:

```bash
wp db export backup-$(date +%Y%m%d-%H%M).sql
```

Importing back is `wp db import file.sql`. On larger sites I'd add `--add-drop-table` so the import drops old tables first.

## 3. plugin update --all — no more clicking

Updating 20 plugins through wp-admin is tedious. One command:

```bash
wp plugin update --all
```

Even better — check what's outdated first, without changing anything:

```bash
wp plugin list --update=available --fields=name,version,update_version
```

The same principle applies to `wp theme update --all` and `wp core update`. On production, always do this over staging and with a backup — auto-updates can occasionally break something. More on that in my post on the [minimal security set for WordPress](/en/blog/wp-bezpecnost-2026/).

## 4. plugin list — find dead plugins

Inactive plugins are both a security risk and dead weight. List just their names:

```bash
wp plugin list --status=inactive --field=name
```

You can pipe that output straight into another command via `xargs` — for example, to bulk-uninstall. Which brings me to the plugin diet I cover in [from 28 plugins down to 9](/en/blog/plugin-dieta-z-28-na-9/).

## 5. verify-checksums — is your core clean?

If you suspect a site's been compromised, this is the first test. WP-CLI pulls the official checksums from WordPress.org and compares them against your files:

```bash
wp core verify-checksums
wp plugin verify-checksums --all
```

If it reports that a `wp-includes/…` file doesn't match, either you have a corrupted install or someone slipped code in. It's the fastest way to catch injected malware in core files.

## 6. transient delete — clear the cache clutter

Transients are temporary cache stored in the `wp_options` table. Plugins generate thousands of them and don't always clean up after themselves — expired transients linger and bloat `autoload`. Clear just the expired ones:

```bash
wp transient delete --expired
```

Or, when you're debugging and want a clean slate, all of them at once with `wp transient delete --all`. This is one of my first steps when troubleshooting a slow dashboard.

## 7. cache flush — when "it's not working"

An object cache (Redis, Memcached) can hold a stale value after a DB change. Instead of restarting the service:

```bash
wp cache flush
```

If you're going deep on object caching, I have a dedicated post — [Redis object cache on WordPress: when and how](/en/blog/redis-object-cache-wordpress/).

## 8. cron event — test what should run

WP-Cron fires on page visits, which is a problem on low-traffic sites. From the CLI you can inspect scheduled events and trigger them manually:

```bash
# What's scheduled
wp cron event list

# Run everything that's currently due
wp cron event run --due-now
```

This is the foundation if you're replacing WP-Cron with a real system cron (the recommended setup: `DISABLE_WP_CRON` in `wp-config.php` plus a system cron calling `wp cron event run --due-now`).

## 9. user create — an account without the UI

Spin up an administrator from the terminal, e.g. for service access:

```bash
wp user create service service@mysite.com --role=administrator --user_pass='AGoodLongPassword!'
```

Leave the password out and WP-CLI generates and prints one.

## 10. user reset-password — emergency access

Client forgot their password and emails aren't going through? Reset it straight from the CLI and print the new one:

```bash
wp user reset-password admin --show-password
```

The `--show-password` flag prints the newly generated password in the terminal. If you don't want WordPress sending a notification email, add `--skip-email`.

## 11. media regenerate — new image sizes

When you change theme dimensions or add a new size via `add_image_size()`, old images don't have it. Regenerate thumbnails in bulk:

```bash
# Only the missing ones, skips existing
wp media regenerate --only-missing
```

Without `--only-missing` it regenerates everything, which drags on with thousands of images. It's a performance topic — I cover images and lazy-loading in [when to go native, when custom](/en/blog/image-lazy-loading-native-vs-custom/).

## 12. db optimize — table maintenance

Fragmented tables slow queries down. WP-CLI runs `OPTIMIZE TABLE` across the whole database:

```bash
wp db optimize
```

On InnoDB sites it's no miracle, but combined with cleaning up `wp_options` (transients, expired sessions) it has a measurable effect on TTFB.

## Bonus: aliases for multiple sites

This is where WP-CLI goes from "handy" to "indispensable." In `~/.wp-cli/config.yml` you define aliases — including remote ones over SSH:

```yaml
@production:
  ssh: user@server.com/var/www/mysite.com
@local:
  path: /Users/me/sites/mysite
```

Then `wp @production plugin update --all` runs the command directly on the production server without you logging in manually. And `wp @all core version` prints versions across every site at once.

## Where to start

If you don't have WP-CLI yet, install `wp-cli.phar` following the [official handbook](https://make.wordpress.org/cli/handbook/guides/installing/), verify with `wp cli info`, and start with two commands: `wp search-replace --dry-run` and `wp db export`. Those two will sell you on it. The rest you'll pick up naturally — and after a week you won't go back to clicking through wp-admin for routine work.
