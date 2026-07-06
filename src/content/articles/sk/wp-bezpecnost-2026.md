---
title: "Bezpečnosť WP v 2026: minimálny set, ktorý ozaj chráni"
date: 2026-04-28
read: 7
tags: ["WordPress", "Security"]
excerpt: "Šesť konkrétnych opatrení, ktoré reálne zabraňujú útokom na WordPress: automatické aktualizácie, 2FA, obmedzenie prihlásení, zámok editovania súborov a HSTS. Plus reálny brute-force útok cez XML-RPC a jeho odstavenie."
featured: false
---

WordPress je najpopulárnejší CMS na svete, čo z neho automaticky robí aj najčastejší cieľ. 90 % „hacknutých" WP stránok nepadlo cez sofistikovaný 0-day exploit — padli preto, lebo admin mal heslo `admin123`, alebo lebo plugin nebol aktualizovaný 8 mesiacov. Tu je minimálny set šiestich opatrení, ktoré pokrývajú asi 95 % reálnych útokov. Bez paranoje, bez prémiového Wordfence za 149 USD ročne.

## 1. Automatické aktualizácie pre core a bezpečnostné záplaty

WP od verzie 5.6 podporuje automatické aktualizácie aj pre **major verzie**. V roku 2026 už neexistuje rozumný dôvod toto nezapnúť. Bezpečnostné záplaty vychádzajú v rámci minor verzií (6.4.1, 6.4.2) a tie sa aktualizujú v predvolenom nastavení.

Pre **major** verzie (6.4 → 6.5):

```php
// wp-config.php
define('WP_AUTO_UPDATE_CORE', true);
```

Pre **pluginy** — cez rozhranie (Plugins → klik na „Enable auto-updates" pri každom) alebo programovo:

```php
add_filter('auto_update_plugin', '__return_true');
```

**Háčik:** automatická aktualizácia pluginov môže občas niečo zlomiť. Riešenie: **staging prostredie** + **denná záloha**. WebSupport má staging na jeden klik, VPS pod správou CloudPanela tiež. Ak ti niečo padne, jednoducho sa vrátiš zo zálohy. Rovnaký prístup so stagingom používam aj pri [migrácii WordPressu z lokálu na produkciu bez výpadku](/blog/wp-migracia-bez-vypadku/). Stratiť 30 minút raz za pol roka je menšie zlo ako otvorená XSS diera na živej stránke 4 mesiace.

## 2. wp-config.php mimo public_html alebo chmod 600

`wp-config.php` obsahuje prihlasovacie údaje k databáze a bezpečnostné kľúče. Ak sa niekto dostane k jeho obsahu, má neobmedzený prístup k tvojej databáze.

**Riešenie A:** presuň súbor o úroveň vyššie. WP automaticky hľadá `wp-config.php` aj v nadradenom adresári:

```
/var/www/mojadomena.sk/
├── public_html/
│   ├── index.php
│   ├── wp-admin/
│   └── wp-content/
└── wp-config.php   ← TU
```

**Riešenie B:** ak to z dôvodov hostingu nejde, nastav prísnejšie oprávnenia:

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

## 3. Obmedzenie počtu prihlásení (Limit Login Attempts Reloaded)

Brute-force útoky na `/wp-login.php` sú konštanta. Bez obmedzenia ti útočník skúša 1000 hesiel za hodinu. S obmedzením: 4 pokusy za 15 minút, potom ban IP adresy.

**Plugin:** Limit Login Attempts Reloaded (zdarma, 2 milióny+ aktívnych inštalácií, aktívne udržiavaný). Predvolené nastavenie:

- 4 pokusy z jednej IP adresy
- 20-minútové zablokovanie
- 4-hodinové predĺžené zablokovanie pri opakovaných pokusoch
- e-mailové upozornenie po zablokovaní

Po inštalácii v Settings → Limit Login Attempts:

- „Trusted IP origins" → ak používaš Cloudflare, nastav `CF-Connecting-IP` (inak banuješ proxy IP adresy Cloudflaru)
- „GDPR compliance" → áno (logovanie IP adries)

**Reálny dopad** z auditu: klientský e-shop mal pred nasadením pluginu 14 000 neúspešných pokusov o prihlásenie mesačne (z vietnamských, ruských a amerických datacentrových IP adries). Po nasadení: 22 pokusov mesačne, ani jeden úspešný.

## 4. 2FA cez Two-Factor (oficiálny plugin z WordPress.org)

[Two-Factor](https://wordpress.org/plugins/two-factor/) je oficiálny plugin udržiavaný tímom vývojárov WP core. Zdarma, open source, podporuje TOTP (Google Authenticator, Authy, 1Password), kódy cez e-mail aj záložné kódy.

Po aktivácii: User → Edit User → „Two-Factor Options" → vyber preferovanú metódu.

Pre admin účty je 2FA v roku 2026 **nespochybniteľná nutnosť**. Heslo môže uniknúť cez phishing alebo únik dát (Have I Been Pwned). 2FA je druhý faktor, ktorý útočník nemá ani po úspešnom phishingu.

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

## 5. Vypni editovanie súborov v admin paneli

V predvolenom nastavení umožňuje WP editovať `.php` súbory pluginov a tém cez Admin → Plugins → Editor a Appearance → Theme File Editor. Toto je bezpečnostný horor — útočník, ktorý získa admin prístup, môže cez rozhranie vpašovať PHP kód.

Vypni to jediným riadkom:

```php
// wp-config.php
define('DISALLOW_FILE_EDIT', true);
```

A pre úplné vypnutie aj inštalácie pluginov a tém cez rozhranie:

```php
define('DISALLOW_FILE_MODS', true);
```

`DISALLOW_FILE_MODS` je agresívnejší — vypne aj automatické aktualizácie. Pre väčšinu projektov stačí len `DISALLOW_FILE_EDIT`.

## 6. SSL + hlavička HSTS

SSL (HTTPS) je samozrejmosť, zdarma cez Let's Encrypt na každom serióznom hostingu. Ale samotné SSL nestačí — bez **HSTS** (HTTP Strict Transport Security) hlavičky môže byť používateľ pri prvej návšteve z nedôveryhodnej Wi-Fi siete obeťou útoku typu MITM.

V `.htaccess` (Apache):

```apache
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
```

V nginx:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

`max-age=31536000` je 1 rok. Prehliadač si zapamätá: „túto doménu navštevuj len cez HTTPS". `preload` umožní zaregistrovať doménu na [hstspreload.org](https://hstspreload.org/) — Chrome, Firefox aj Safari ti potom natvrdo vynútia HTTPS už pri prvej návšteve. (Pozor: podmienkou zaradenia do preload zoznamu je `max-age` aspoň 31536000 a prítomnosť `includeSubDomains` aj `preload` — takže hlavička vyššie ich má správne.)

## Wordfence vs. Solid Security: kedy ktorý

Sú bezpečnostné pluginy nutnosťou? Záleží.

**Wordfence Free** je dobrý, ak chceš:

- WAF (web application firewall) na detekciu škodlivých požiadaviek
- signatúry z bezpečnostného feedu (vo verzii zdarma s 30-dňovým oneskorením oproti platenej)
- monitoring prihlásení s podrobným logom

Háčik: spomalí ti stránku (50 – 150 ms TTFB navyše) a generuje veľa databázových požiadaviek. Pre malú stránku zbytočná réžia.

**Solid Security (predtým iThemes Security)** je ľahší, zameraný na hardening (kontrola integrity súborov, zmena prefixu DB, zmena prihlasovacej URL). Nemá WAF, ale spotrebúva výrazne menej zdrojov.

**Môj prístup:** ani jeden. Šesť vecí vyššie + dobrý hosting (so serverovým WAF, napr. Cloudflare Free + page cache) pokryje 95 % útokov bez ďalšieho pluginu. Ako si vybrať taký hosting rozoberám v článku o [hostingoch v SK z pohľadu výkonu](/blog/hostingy-sk-vykon/). Aj samotné bezpečnostné pluginy sa navyše rátajú do celkovej záťaže — menej pluginov znamená rýchlejší web, čo som ukázal v [plugin diéte z 28 na 9](/blog/plugin-dieta-z-28-na-9/). Wordfence reálne zapínam len vtedy, keď bol klient nedávno napadnutý a treba forenznú analýzu a zvýšený monitoring.

## Reálny útok: brute-force cez XML-RPC

Klasika rokov 2024 – 2026. Endpoint XML-RPC (`/xmlrpc.php`) podporuje `system.multicall` — útočník v jednej požiadavke skúsi aj 1000 kombinácií mena a hesla (dokáže tak brute-force zosilniť až 500-násobne). Obíde tým aj pluginy na obmedzenie prihlásení, ktoré sledujú len `/wp-login.php`.

Odstavenie, dvojfázové:

```apache
# .htaccess — block XML-RPC celkom
<files xmlrpc.php>
  order allow,deny
  deny from all
</files>
```

Alebo elegantnejšie, ak XML-RPC používaš pre Jetpack alebo mobilnú aplikáciu:

```php
// functions.php — vypni len multicall
add_filter('xmlrpc_methods', function($methods) {
  unset($methods['system.multicall']);
  return $methods;
});
```

A v Cloudflare Page Rules (tarif Free):

```
URL: *example.com/xmlrpc.php
Settings: Block (alebo JS Challenge)
```

## TL;DR

Šesť opatrení v poradí podľa návratnosti:

1. **Automatické aktualizácie** — zapni, hotovo
2. **`DISALLOW_FILE_EDIT`** vo wp-config — 1 riadok
3. **2FA pre adminov** — plugin Two-Factor, 5 minút nastavenia
4. **Obmedzenie prihlásení** — plugin Limit Login Attempts, 5 minút
5. **Zabezpečený wp-config** — chmod 600 alebo presun von z public_html
6. **Hlavička HSTS** — 1 riadok v `.htaccess`/konfigurácii nginxu

Žiadny z týchto krokov nestojí peniaze. Spolu zaberú maximálne 30 minút nastavenia. Pokryjú 95 % útokov, ktoré dnes reálne vidíš v access logoch. Wordfence Premium za 149 USD ročne je luxus, nie nutnosť.
