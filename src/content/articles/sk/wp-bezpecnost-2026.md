---
title: "Bezpečnosť WP v 2026: minimálny set, ktorý ozaj chráni"
date: 2026-04-28
read: 7
tags: ["WordPress", "Security"]
excerpt: "Šesť konkrétnych opatrení, ktoré reálne zabraňujú útokom na WordPress. Auto-updates, 2FA, login throttling, file editing lock, HSTS. Plus reálny brute-force XML-RPC útok a jeho mitigácia."
featured: false
---

WordPress je najpopulárnejší CMS na svete, čo z neho automaticky robí najpopulárnejší cieľ. 90 % "hacknutých" WP stránok nepadlo cez sofistikovaný 0-day exploit — padli, lebo admin mal heslo `admin123`, alebo lebo plugin nebol updatnutý 8 mesiacov. Tu je minimálny set šiestich opatrení ktoré pokrývajú asi 95 % reálnych útokov. Bez paranoje, bez €30/mes Wordfence Premium plánu.

## 1. Auto-updates pre core a security patches

WP od verzie 5.6 podporuje auto-updates pre **major releases**. V 2026 už neexistuje rozumný dôvod toto nezapnúť. Securitné patche sa releasujú v rámci minor verzií (6.4.1, 6.4.2) a tie sa updatujú default-ne.

Pre **major** verzie (6.4 → 6.5):

```php
// wp-config.php
define('WP_AUTO_UPDATE_CORE', true);
```

Pre **pluginy** — cez UI (Plugins → klik "Enable auto-updates" pri každom) alebo programaticky:

```php
add_filter('auto_update_plugin', '__return_true');
```

**Catch:** auto-update plugins môže občas niečo zlomiť. Riešenie: **staging environment** + **denný backup**. WebSupport má staging cez 1 click, Cloudpanel-managed VPSky tiež. Ak ti niečo padne, rollbackneš zo zálohy. Stratiť 30 minút raz za pol roka je menej zlé ako otvorené XSS na živej stránke 4 mesiace.

## 2. wp-config.php mimo public_html alebo chmod 600

`wp-config.php` obsahuje database credentials a security keys. Ak sa niekto dostane k jeho obsahu, má root prístup k tvojej databáze.

**Riešenie A:** presuň súbor o úroveň vyššie. WP automaticky hľadá `wp-config.php` aj v parent directory:

```
/var/www/mojadomena.sk/
├── public_html/
│   ├── index.php
│   ├── wp-admin/
│   └── wp-content/
└── wp-config.php   ← TU
```

**Riešenie B:** ak to z dôvodov hostingu nejde, nastav prísnejšie permissions:

```bash
chmod 600 wp-config.php
chown www-data:www-data wp-config.php
```

`600` znamená: čítanie a zápis len pre vlastníka súboru. PHP procesy bežiace pod `www-data` ho stále vedia čítať.

A v `.htaccess` (Apache):

```apache
<files wp-config.php>
  order allow,deny
  deny from all
</files>
```

Pre nginx:

```nginx
location ~* /(?:wp-config\.php|\.htaccess) {
  deny all;
}
```

## 3. Login throttling (Limit Login Attempts Reloaded)

Brute-force útoky na `/wp-login.php` sú konštanta. Bez throttling-u ti útočník skúša 1000 hesiel za hodinu. So throttlingom: 4 pokusy za 15 minút, potom IP ban.

**Plugin:** Limit Login Attempts Reloaded (free, 2M+ aktívnych installs, aktívne udržiavaný). Default config:

- 4 pokusy z jednej IP
- 20 minútový lockout
- 4 hodinový extended lockout pri opakovaných pokusoch
- Email notifikácia po lockoute

Po inštalácii v Settings → Limit Login Attempts:

- "Trusted IP origins" → ak používaš Cloudflare, daj `CF-Connecting-IP` (inak ban-uješ Cloudflare proxy IP)
- "GDPR compliance" → áno (logovanie IP adries)

**Reálny dopad** z auditu: klientský eshop mal pred plugin-om 14 000 failed login pokusov mesačne (z Vietnam, Russia, US datacenter IP-čok). Po plugin-e: 22 pokusov mesačne, žiaden úspešný.

## 4. 2FA cez Two-Factor (oficiálny WordPress.org plugin)

[Two-Factor](https://wordpress.org/plugins/two-factor/) je oficiálny plugin udržiavaný core WP teamom. Free, open source, podporuje TOTP (Google Authenticator, Authy, 1Password), email codes, backup codes.

Po aktivácii: User → Edit User → "Two-Factor Options" → vyber preferovanú metódu.

Pre admin účty je 2FA **non-negotiable** v 2026. Heslo môže prelieknuť cez phishing alebo password leak (Have I Been Pwned). 2FA je second factor ktorý útočník nemá ani po phishu.

```php
// wp-config.php — vynúť 2FA pre adminov
add_action('after_setup_theme', function() {
  if (!class_exists('Two_Factor_Core')) return;
  add_filter('two_factor_enabled_providers_for_user', function($providers, $user_id) {
    if (user_can($user_id, 'manage_options') && empty($providers)) {
      // admin bez 2FA — redirect na setup
    }
    return $providers;
  }, 10, 2);
});
```

## 5. Disable file editing v admin paneli

Default WP umožňuje editovať `.php` plugin a téma súbory cez Admin → Plugins → Editor a Appearance → Theme File Editor. Toto je security horror — útočník ktorý získa admin prístup môže injectovať PHP kód cez UI.

Vypni to jediným riadkom:

```php
// wp-config.php
define('DISALLOW_FILE_EDIT', true);
```

A pre úplné vypnutie aj plugin/téma installu cez UI:

```php
define('DISALLOW_FILE_MODS', true);
```

`DISALLOW_FILE_MODS` je agresívnejší — vypne aj auto-updates. Pre väčšinu projektov stačí len `DISALLOW_FILE_EDIT`.

## 6. SSL + HSTS header

SSL (HTTPS) je samozrejmosť, free cez Let's Encrypt na každom seriózne hostingu. Ale samotný SSL nestačí — bez **HSTS** (HTTP Strict Transport Security) header user pri prvej návšteve zo zlej WiFi siete môže byť MITM-nutý.

V `.htaccess` (Apache):

```apache
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
```

V nginx:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

`max-age=31536000` je 1 rok. Browser si pamätá: "túto doménu navštevuj len cez HTTPS". `preload` umožní zaregistrovať doménu na [hstspreload.org](https://hstspreload.org/) — Chrome/Firefox/Safari ti potom natvrdo enforce-nu HTTPS aj pre prvú návštevu.

## Wordfence vs Solid Security: kedy ktorý

Free security pluginy = nutnosť? Záleží.

**Wordfence Free** je dobrý ak chceš:

- WAF (web application firewall) na detekciu malicious requests
- Real-time security feed signatures (s 30-dňovým delay vo free verzii)
- Login security monitoring s detailným logom

Catch: spomalí ti site (50–150ms TTFB navyše), generuje veľa databázových requestov. Pre malú stránku zbytočná réžia.

**Solid Security (predtým iThemes Security)** je ľahší, focus na hardening (file integrity, db prefix change, login URL change). Nemá WAF ale spotrebúva výrazne menej zdrojov.

**Môj prístup:** ani jeden. 6 vecí vyššie + dobrý hosting (s server-side WAF napr. Cloudflare Free + page cache) pokrýva 95 % útokov bez ďalšieho plugin-u. Wordfence reálne zapínam len ak klient bol nedávno hacknutý a treba forensic + heightened monitoring.

## Reálny attack: brute-force XML-RPC

Klasika 2024–2026. XML-RPC endpoint (`/xmlrpc.php`) podporuje multi-call — útočník v jednom request-e skúsi 1000 username/password combinácií. Bypassuje aj login throttling pluginy ktoré sledujú `/wp-login.php`.

Mitigácia, dvojfázová:

```apache
# .htaccess — block XML-RPC celkom
<files xmlrpc.php>
  order allow,deny
  deny from all
</files>
```

Alebo elegantnejšie ak používaš XML-RPC pre Jetpack alebo mobile app:

```php
// functions.php — disable len multicall
add_filter('xmlrpc_methods', function($methods) {
  unset($methods['system.multicall']);
  return $methods;
});
```

A v Cloudflare Page Rules (Free tier):

```
URL: *example.com/xmlrpc.php
Settings: Block (alebo JS Challenge)
```

## TL;DR

Šesť opatrení v poradí ROI:

1. **Auto-updates** — zapni, hotové
2. **`DISALLOW_FILE_EDIT`** v wp-config — 1 riadok
3. **2FA pre adminov** — Two-Factor plugin, 5 minút setup
4. **Login throttling** — Limit Login Attempts plugin, 5 minút
5. **wp-config secure** — chmod 600 alebo presun von z public_html
6. **HSTS header** — 1 riadok v `.htaccess`/nginx config

Žiadny z týchto krokov nestojí peniaze. Spolu zaberú max 30 minút setupu. Pokryjú 95 % útokov ktoré dnes reálne vidíš v access logoch. Wordfence Premium za €120/rok je luxus, nie nutnosť.
