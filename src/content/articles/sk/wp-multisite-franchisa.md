---
title: "WP Multisite pre franchisy: zdieľať theme, oddeliť content"
date: 2025-12-03
read: 8
tags: ["WordPress", "DevOps"]
excerpt: "Praktický návod na multisite setup pre franchisy. Subdomain vs subfolder, permissions, MU plugins, domain mapping a riziká pri škálovaní cez 50 sites."
featured: false
---

Klient prevádzkuje franchisu reštaurácií — 18 prevádzok po Slovensku, každá chce vlastnú podstránku s lokálnym menu, kontaktom a fotkami. Centrálny brand a šablóna sa nemenia. Klasický use case pre **WordPress Multisite**.

Tu je všetko, čo by som chcel vedieť, keď som to setupoval prvýkrát.

## Subdomain vs subfolder — rozhoduješ raz

Po `define('WP_ALLOW_MULTISITE', true)` v `wp-config.php` ti WP ponúkne dve cesty. Toto je **one-way door**, mení sa to neskôr len cez DB hacks.

**Subdomain** (`bratislava.firma.sk`, `kosice.firma.sk`):
- DNS wildcard `*.firma.sk → server IP`
- Lepšie pre veľké franchisy, kde každá pobočka chce vlastnú "značku"
- SEO ich Google považuje za samostatné weby

**Subfolder** (`firma.sk/bratislava`, `firma.sk/kosice`):
- Žiadny wildcard DNS
- SEO authority sa zlieva pod root doménu
- Lepšie pre malé franchisy alebo content-heavy weby

Pre 18 reštaurácií som išiel **subfolder** — silnejšia centrálna doména, jednoduchšie hosting setup.

## Inštalácia v 4 krokoch

```bash
# 1. wp-config.php
wp config set WP_ALLOW_MULTISITE true --raw

# 2. Cez WP admin: Tools → Network Setup → vyber subdomain/subfolder
# 3. Pridaj výstupné riadky do wp-config.php a .htaccess (UI ti ukáže)

# 4. Vytvor prvý sub-site
wp site create --slug=bratislava --title="Bratislava — Restaurant Brand"
```

Po kroku 2 sa rozdelí admin na **Network Admin** (super-admin) a per-site admin.

## Network admin vs site admin — kľúčový concept

| Akcia | Network Admin | Site Admin |
|---|---|---|
| Inštalovať plugin | Áno | Nie |
| Aktivovať plugin pre sieť | Áno | Nie |
| Aktivovať plugin per-site | Áno (network-wide) | Áno (ak povolené) |
| Inštalovať theme | Áno | Nie |
| Pridávať users globálne | Áno | Iba `editor`/`author` ktorých už majú |
| Settings (Reading, Writing) per site | Áno | Áno |

Pre franchisu to znamená: ja ako developer som network admin, manažér každej reštaurácie je editor svojej sub-site. Nepridáva nové pluginy, nemení theme, ale plne kontroluje content (menu, fotky, otváracie hodiny).

## User Switching plugin pre support

Keď ti manažér na Skype napíše "u mňa nefunguje hero block", chceš sa do jeho dashboardu pozrieť presne tak, ako on. [User Switching](https://wordpress.org/plugins/user-switching/) plugin urobí presne to — bez zdieľania hesiel.

```bash
wp plugin install user-switching --activate-network
```

Network-activate znamená, že je dostupný vo všetkých sub-sites.

## Domain mapping — vlastná doména pre sub-site

Klient si po roku rozhodne, že `firma.sk/bratislava` chce premenovať na `bratislava-restaurant.sk`. Od WP 4.5 je domain mapping natívny.

V Network Admin → Sites → Edit → tab Site Address (URL), zmeň URL. V `wp-config.php`:

```php
define('SUNRISE', 'on');
```

A pridaj `sunrise.php` do `wp-content/`:

```php
<?php
// veľmi zjednodušené — produkčne použi Mercator alebo WP Domain Mapping plugin
$domain_map = [
    'bratislava-restaurant.sk' => 2, // blog_id
    'kosice-restaurant.sk' => 3,
];

$host = $_SERVER['HTTP_HOST'];
if (isset($domain_map[$host])) {
    $blog_id = $domain_map[$host];
    // ...nastav $current_blog a $current_site
}
```

V praxi odporúčam plugin [Multiple Domain Mapping on Single Site](https://wordpress.org/plugins/multiple-domain-mapping-on-single-site/) alebo Mercator (zadarmo na GitHube). Robia to bezpečnejšie.

## MU plugins vs network-activated

Toto si pleťie aj skúsený developer.

**Must-Use Plugins** (`wp-content/mu-plugins/`):
- Aktivujú sa automaticky, nedajú sa deaktivovať z UI
- Načítavajú sa pred bežnými pluginmi
- Ideálne pre globálne hooks, security forces, analytics injection
- **Nemôžu** sa použiť pre commercial pluginy, ktoré majú activation hooks

**Network-activated plugins** (`Plugins → Network Activate`):
- Bežné pluginy zapnuté pre všetky sub-sites naraz
- Aktivačné hooks sa volajú per-site
- Site admin ich nemôže deaktivovať
- Vhodné pre Yoast, Woo, security pluginy

Pre franchisu mám MU plugin `restrict-theme-changes.php`, ktorý zabraňuje site adminom zmeniť theme cez `customize.php` aj keby mali rights:

```php
<?php
add_action('admin_init', function() {
    if (!is_super_admin()) {
        remove_submenu_page('themes.php', 'themes.php');
    }
});
```

## Riziká pri škálovaní cez 50 sites

Tu sa to začína trochu komplikovať. Niekoľko reálnych problémov, na ktoré som narazil:

### 1. `wp_options` autoload bloat

Každá sub-site má vlastné `wp_X_options`, ale niektoré plugins zapisujú do `wp_options` s `autoload=yes`. Pri 50 sites a 200 autoload optionoch na site to znamená 10 000 záznamov načítaných pri každom requeste.

```sql
-- check
SELECT option_name, LENGTH(option_value)
FROM wp_options
WHERE autoload = 'yes'
ORDER BY LENGTH(option_value) DESC
LIMIT 20;
```

Náprava: nájdi 5 najväčších, prepni ich na `autoload=no`.

### 2. Single point of failure pre `wp-content/uploads/`

Multisite default ukladá uploady do `wp-content/uploads/sites/{blog_id}/`. Ak tento adresár padne (NFS lock, disk full), padá celá sieť. Pri 50+ sites silne odporúčam:

- Object storage (S3 / DigitalOcean Spaces) cez WP Offload Media
- Aspoň monthly backup celého `uploads/` adresára

### 3. Plugin updates riskujú celú sieť

Update Yoast SEO na 50 sites naraz a ak má bug — máš 50 down sites. Stratégia: **canary site**. Mám jednu testovaciu sub-site, kde updaty prejdu prvé. Po 24h bez chýb idú na zvyšné.

### 4. `wp_users` vs per-site capabilities

Users sú globálni. Pavol má capabilities per site. Ale ak si Pavol nastaví `display_name` v profile, mení sa všade. Pre franchisu to bola surprise — manažérka si zmenila nick na "Mama Janka" a v autor box vo všetkých 18 weboch sa zobrazila tak.

## Backup strategy per-site

Štandardné Vaultpress / UpdraftPlus zálohuje len celú sieť ako jeden balík. Pre franchisu chceš môcť vrátiť **jednu pobočku** bez ovplyvnenia ostatných.

Riešenie: [UpdraftPlus Multisite](https://updraftplus.com/shop/network-multisite/) (~€95/y) umožňuje per-site exports. Alebo manuálne cez WP-CLI:

```bash
wp db export --tables=wp_5_options,wp_5_posts,wp_5_postmeta,wp_5_terms,wp_5_term_relationships,wp_5_term_taxonomy,wp_5_commentmeta,wp_5_comments,wp_5_links bratislava-backup.sql --url=firma.sk/bratislava
```

Skript v cron-e na večer, výstup do S3.

## TL;DR

Multisite je výborný nástroj pre franchisy s 5–50 sub-sites a zdieľaným designom. Subfolder pre SEO consolidation, MU plugins pre globálnu policy, User Switching pre support, S3 pre uploady. Nad 50 sites zvážiť alternatívy ako headless WP s shared frontend a per-tenant API. Pri všetkom ostatnom multisite zarobí svoje.
