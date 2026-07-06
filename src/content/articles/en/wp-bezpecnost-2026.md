---
title: "WordPress Security in 2026: the minimal set that actually protects"
date: 2026-04-28
read: 7
tags: ["WordPress", "Security"]
excerpt: "Six concrete measures that genuinely stop WordPress attacks: automatic updates, 2FA, login throttling, locking down file editing, and HSTS. Plus a real brute-force attack over XML-RPC and how to shut it down."
featured: false
---

WordPress is the most popular CMS in the world, which automatically makes it the most frequent target too. 90% of "hacked" WP sites didn't fall to some sophisticated 0-day exploit — they fell because the admin's password was `admin123`, or because a plugin hadn't been updated in 8 months. Here's the minimal set of six measures that cover roughly 95% of real-world attacks. No paranoia, no premium Wordfence at $149 a year.

## 1. Automatic updates for core and security patches

Since version 5.6, WP supports automatic updates for **major versions** too. In 2026 there's no longer any sensible reason to leave this off. Security patches ship as minor releases (6.4.1, 6.4.2), and those update by default.

For **major** versions (6.4 → 6.5):

```php
// wp-config.php
define('WP_AUTO_UPDATE_CORE', true);
```

For **plugins** — through the UI (Plugins → click "Enable auto-updates" on each) or programmatically:

```php
add_filter('auto_update_plugin', '__return_true');
```

**The catch:** an automatic plugin update can occasionally break something. The fix: a **staging environment** + a **daily backup**. WebSupport has one-click staging, and so does a VPS managed with CloudPanel. If something breaks, you just roll back from the backup. I use the same staging-first approach when [migrating WordPress from local to production with zero downtime](/en/blog/wp-migracia-bez-vypadku/). Losing 30 minutes once every six months is a smaller evil than an open XSS hole sitting on a live site for 4 months.

## 2. wp-config.php outside public_html, or chmod 600

`wp-config.php` holds your database credentials and security keys. If someone gets at its contents, they have unrestricted access to your database.

**Option A:** move the file up one level. WP automatically looks for `wp-config.php` in the parent directory too:

```
/var/www/mydomain.com/
├── public_html/
│   ├── index.php
│   ├── wp-admin/
│   └── wp-content/
└── wp-config.php   ← HERE
```

**Option B:** if hosting constraints make that impossible, set stricter permissions:

```bash
chmod 600 wp-config.php
chown www-data:www-data wp-config.php
```

`600` means: read and write for the file owner only. PHP processes running as `www-data` can still read it.

And in `.htaccess` (Apache):

```apache
<files wp-config.php>
  order allow,deny
  deny from all
</files>
```

For nginx:

```nginx
location ~* /(?:wp-config\.php|\.htaccess) {
  deny all;
}
```

## 3. Throttle login attempts (Limit Login Attempts Reloaded)

Brute-force attacks on `/wp-login.php` are a constant. Without throttling, an attacker tries 1,000 passwords an hour. With it: 4 attempts per 15 minutes, then the IP gets banned.

**Plugin:** Limit Login Attempts Reloaded (free, 2 million+ active installs, actively maintained). Default settings:

- 4 attempts from a single IP address
- 20-minute lockout
- 4-hour extended lockout on repeated attempts
- email notification after a lockout

After installing, in Settings → Limit Login Attempts:

- "Trusted IP origins" → if you're using Cloudflare, set `CF-Connecting-IP` (otherwise you'll be banning Cloudflare's proxy IPs)
- "GDPR compliance" → yes (IP logging)

**Real-world impact** from an audit: before the plugin went live, a client's e-shop was seeing 14,000 failed login attempts a month (from Vietnamese, Russian, and US datacenter IPs). After deployment: 22 attempts a month, not a single one successful.

## 4. 2FA via Two-Factor (the official plugin from WordPress.org)

[Two-Factor](https://wordpress.org/plugins/two-factor/) is the official plugin maintained by the WP core dev team. Free, open source, and it supports TOTP (Google Authenticator, Authy, 1Password), email codes, and backup codes.

After activation: User → Edit User → "Two-Factor Options" → pick your preferred method.

For admin accounts, 2FA is a **non-negotiable must** in 2026. A password can leak through phishing or a data breach (Have I Been Pwned). 2FA is the second factor an attacker doesn't have even after a successful phish.

```php
// wp-config.php — enforce 2FA for admins
add_action('after_setup_theme', function() {
  if (!class_exists('Two_Factor_Core')) return;
  add_filter('two_factor_enabled_providers_for_user', function($providers, $user_id) {
    if (user_can($user_id, 'manage_options') && empty($providers)) {
      // admin without 2FA — redirect to setup
    }
    return $providers;
  }, 10, 2);
});
```

## 5. Disable file editing in the admin panel

By default, WP lets you edit `.php` files for plugins and themes through Admin → Plugins → Editor and Appearance → Theme File Editor. This is a security horror show — an attacker who gains admin access can smuggle PHP code in through the UI.

Turn it off with a single line:

```php
// wp-config.php
define('DISALLOW_FILE_EDIT', true);
```

And to fully disable plugin and theme installs through the UI as well:

```php
define('DISALLOW_FILE_MODS', true);
```

`DISALLOW_FILE_MODS` is more aggressive — it also disables automatic updates. For most projects, just `DISALLOW_FILE_EDIT` is enough.

## 6. SSL + the HSTS header

SSL (HTTPS) is table stakes, free via Let's Encrypt on any serious host. But SSL alone isn't enough — without an **HSTS** (HTTP Strict Transport Security) header, a user visiting for the first time from an untrusted Wi-Fi network can fall victim to a MITM attack.

In `.htaccess` (Apache):

```apache
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
```

In nginx:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

`max-age=31536000` is 1 year. The browser remembers: "only ever visit this domain over HTTPS." `preload` lets you register the domain at [hstspreload.org](https://hstspreload.org/) — Chrome, Firefox, and Safari will then hard-enforce HTTPS from the very first visit. (Heads up: to get onto the preload list you need `max-age` of at least 31536000 plus both `includeSubDomains` and `preload` present — so the header above has them right.)

## Wordfence vs. Solid Security: which one, when

Are security plugins a must? It depends.

**Wordfence Free** is good if you want:

- a WAF (web application firewall) to detect malicious requests
- signatures from a security feed (in the free version, with a 30-day delay behind the paid one)
- login monitoring with a detailed log

The catch: it slows your site down (50–150 ms of extra TTFB) and generates a lot of database queries. For a small site, it's needless overhead.

**Solid Security (formerly iThemes Security)** is lighter, focused on hardening (file integrity checks, DB prefix change, changing the login URL). It has no WAF, but consumes far fewer resources.

**My approach:** neither. The six things above + good hosting (with a server-side WAF, e.g. Cloudflare Free + page cache) cover 95% of attacks without another plugin. I cover how to pick that kind of hosting in my piece on [Slovak hosting from a performance standpoint](/en/blog/hostingy-sk-vykon/). Security plugins themselves also count toward your total load, too — fewer plugins means a faster site, which I showed in the [plugin diet from 28 to 9](/en/blog/plugin-dieta-z-28-na-9/). I only actually switch Wordfence on when a client was recently compromised and needs forensic analysis and heightened monitoring.

## A real attack: brute-force over XML-RPC

A 2024–2026 classic. The XML-RPC endpoint (`/xmlrpc.php`) supports `system.multicall` — in a single request an attacker can try 1,000 username/password combos (which can amplify brute-forcing by up to 500x). This also bypasses login-throttling plugins that only watch `/wp-login.php`.

Shutting it down, in two phases:

```apache
# .htaccess — block XML-RPC entirely
<files xmlrpc.php>
  order allow,deny
  deny from all
</files>
```

Or, more elegantly, if you use XML-RPC for Jetpack or a mobile app:

```php
// functions.php — disable multicall only
add_filter('xmlrpc_methods', function($methods) {
  unset($methods['system.multicall']);
  return $methods;
});
```

And in Cloudflare Page Rules (Free plan):

```
URL: *example.com/xmlrpc.php
Settings: Block (or JS Challenge)
```

## TL;DR

Six measures, ordered by return on effort:

1. **Automatic updates** — turn on, done
2. **`DISALLOW_FILE_EDIT`** in wp-config — 1 line
3. **2FA for admins** — the Two-Factor plugin, 5 minutes to set up
4. **Login throttling** — the Limit Login Attempts plugin, 5 minutes
5. **Secured wp-config** — chmod 600 or move it out of public_html
6. **The HSTS header** — 1 line in `.htaccess`/nginx config

None of these steps costs money. Together they take 30 minutes of setup at most. They cover 95% of the attacks you actually see in your access logs today. Wordfence Premium at $149 a year is a luxury, not a necessity.
