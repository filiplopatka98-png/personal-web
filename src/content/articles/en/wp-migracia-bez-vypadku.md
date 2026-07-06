---
title: "Migrating WordPress from Local to Production With Zero Downtime"
date: 2026-01-15
read: 8
tags: ["WordPress", "DevOps"]
excerpt: "A practical, battle-tested playbook for migrating WordPress with zero downtime — wp-cli search-replace, rsync for media, lowering DNS TTL ahead of time, and a 5-minute cutover. Bash scripts and the gotchas that bite you in production."
featured: false
---

Migrating WordPress isn't rocket science, but the number of ways to botch it is basically unlimited. A client called me two weeks ago: "a colleague migrated our shop, sales have been zero since Saturday, the contact form crashes, and login doesn't work." The cause? `siteurl` in the database was still pointing at the staging URL, the OAuth callbacks were dangling, and the admin login URL had only been half-rewritten in the search-replace.

This is the process I run the exact same way on every migration. The cutover takes about 5 minutes, and the downtime is effectively zero.

## Pre-flight: what to figure out before the first command

For a Woo store — or any live application — check **where your URL is hardwired into external services**:

- Stripe / Tatra eCard / GoPay — webhook URL, success/cancel URL
- Google OAuth (login plugins, Calendar embeds) — authorized redirect URI
- Mailchimp / Brevo / Klaviyo — webhook endpoint in their dashboard
- CDN config (Cloudflare, Bunny) — origin URL
- DNS provider — where the nameserver lives, and do you have access?

If these 5 things aren't sitting in a Notion checklist before the migration, you'll hit them inside the cutover window and lose 30 minutes.

## Step 1: DB export with wp-cli

The classic `mysqldump` works, but `wp-cli` is aware of the specific environment's context and can run `wp search-replace --dry-run` against a duplicate for you right away.

```bash
# on the source
wp db export --add-drop-table dump-$(date +%Y%m%d-%H%M).sql

# or without wp-cli
mysqldump --single-transaction --quick --add-drop-table -u user -p dbname > dump.sql
```

`--single-transaction` matters with InnoDB — the dump is a consistent snapshot of a single moment and doesn't lock the tables, so writes keep running throughout.

## Step 2: search-replace (CRITICAL: serialized data)

This is reason #1 why half of all migrations end in a wreck. WordPress stores serialized PHP arrays in the database (widgets, theme mods, ACF data). A naive `sed -i 's/old.com/new.com/g'` is a NON-starter — it breaks the string lengths inside the serialized data.

```bash
# correct — wp-cli preserves serialized arrays
wp search-replace 'https://staging.firma.sk' 'https://firma.sk' \
  --all-tables \
  --skip-columns=guid \
  --report-changed-only \
  --dry-run
```

A few notes:
- `--skip-columns=guid` — `guid` in `wp_posts` has to stay historically immutable; RSS readers use it as a permanent identifier for a feed item.
- `--all-tables` — without it, `wp-cli` only looks at tables registered in `$wpdb`. Woo, ACF, and custom plugins have extra tables of their own.
- `--dry-run` first. You'll see the number of hits before you commit to it.

After the dry run, drop `--dry-run` and run it for real.

Also handle a possible HTTP/HTTPS protocol mismatch:

```bash
wp search-replace 'http://firma.sk' 'https://firma.sk' --all-tables --dry-run
```

## Step 3: media — `rsync -avz`

Media is often gigabytes. `scp` copies it from scratch; `rsync` transfers only the changes.

```bash
# from local to production
rsync -avz --progress \
  /Users/filip/projects/klient/wp-content/uploads/ \
  user@server:/var/www/firma.sk/wp-content/uploads/

# second run right before cutover — a fast delta
rsync -avz --progress --delete \
  /Users/filip/projects/klient/wp-content/uploads/ \
  user@server:/var/www/firma.sk/wp-content/uploads/
```

`-z` is compression during the transfer over SSH; `--delete` removes files on production that no longer exist in the source (for a clean sync).

On projects with more than 20 GB of media, I'd rather upload 95% of the files **a week ahead**. During cutover I'm only moving the delta from the last few days.

## Step 4: DNS pre-warm with a low TTL

A week before the planned cutover, **lower the TTL** on the A/AAAA DNS records from the usual 86,400 s down to 300 s. That means when you change the IP in the cutover window, propagation across the world takes 5 minutes instead of 24 hours.

```bash
# check the current TTL
dig +noall +answer firma.sk A
# firma.sk.    86400    IN    A    1.2.3.4
```

After lowering it you should see `300`. It's a 30-second task in the DNS panel (Wedos, Websupport, Cloudflare) that most people ignore.

## Step 5: The cutover window (5–10 minutes)

This is the switch itself. I schedule a time for it (usually 22:00–22:15 local time, when traffic is lowest).

**Maintenance mode on the source** (so nobody adds a new image during the final rsync):

```bash
wp maintenance-mode activate
```

**Final database sync:**

```bash
# export from the last minute
ssh staging-host "wp db export /tmp/final-dump.sql"
scp staging:/tmp/final-dump.sql ./

# import to production
scp final-dump.sql production:/tmp/
ssh production "wp db import /tmp/final-dump.sql"
ssh production "wp search-replace 'staging.firma.sk' 'firma.sk' --all-tables --skip-columns=guid"
```

**Final media rsync** (from step 3, the second run).

**Flip the DNS** — change the A record to the new IP in the panel.

**Verify:**

```bash
# correct IP?
dig +short firma.sk
curl -I https://firma.sk
```

**Purge the cache** — purge on Cloudflare and in the cache plugins:

```bash
ssh production "wp cache flush"
ssh production "wp w3-total-cache flush all" # if you use W3TC
```

**Turn off maintenance mode:**

```bash
wp maintenance-mode deactivate
```

## Step 6: Post-launch checklist

The first 24 hours after cutover:

- [ ] Search Console — add the new property and use the URL Inspection tool to request indexing (the old "Fetch as Google" is gone)
- [ ] resubmit `sitemap.xml`
- [ ] 301 redirects from the old URL structure (if permalinks changed)
- [ ] test the checkout flow on a device that isn't yours (phone, different connection)
- [ ] test login as both an admin and a regular user
- [ ] email DKIM/SPF — is WP Mail SMTP / Postmark working?
- [ ] webhooks — Stripe dashboard, GoPay dashboard, Mailchimp
- [ ] OAuth callbacks — login via Google, Facebook

## Gotchas I've run into

### Payment gateway webhook URLs

Stripe sends the WooCommerce webhook to `https://staging.firma.sk/?wc-api=wc_stripe`. If you don't update that in the Stripe dashboard, payments in production don't "close out" (the payment goes through, but the Woo order stays stuck in "pending").

### OAuth redirect URI

Google Cloud Console → OAuth credentials → Authorized redirect URIs. Add the production URL **before** cutover (you can happily have both staging and prod in there at once). Delete staging a week later.

### Hardcoded URLs in PHP

`functions.php` or MU plugins sometimes have `https://staging.firma.sk` hardcoded inside `wp_remote_get()` calls. A database search-replace won't catch that. The command:

```bash
grep -r "staging.firma.sk" wp-content/themes/ wp-content/plugins/ wp-content/mu-plugins/
```

### Cron events with URLs

`wp cron event list` — some scheduled events carry a URL in their arguments. If they break, contact forms or mailing lists stop sending.

## TL;DR

Zero-downtime migration in 6 steps: lower the TTL a week ahead, export the DB with `wp-cli`, `wp search-replace` (NEVER `sed`), move media with `rsync` incrementally plus a delta at cutover, flip DNS, purge cache. After launch, check webhooks, OAuth, and Search Console. The cutover window is usually 5–10 minutes. The most common reason for a wreck: a forgotten webhook URL at a payment gateway.

Related: [WP security in 2026: the minimum set that actually protects](/en/blog/wp-bezpecnost-2026/), [the plugin diet — from 28 to 9 and 60% faster](/en/blog/plugin-dieta-z-28-na-9/), and [SK hosting through a performance lens](/en/blog/hostingy-sk-vykon/).
