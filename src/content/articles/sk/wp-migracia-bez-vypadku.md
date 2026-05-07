---
title: "Migrácia WordPressu z lokálu na produkciu bez výpadku"
date: 2026-01-15
read: 8
tags: ["WordPress", "DevOps"]
excerpt: "Praktický postup pre zero-downtime migráciu WP — wp-cli search-replace, rsync media, DNS pre-warm s nízkym TTL, 5-minútový cutover. Bash skripty a edge cases."
featured: false
---

Migrácia WordPressu nie je raketová veda, ale spôsobov, ako ju pokašľať, je nespočetne. Klient mi pred dvomi týždňami zavolal: "kolega nám migroval shop, tržby od soboty zero, kontaktný formulár padá, prihlásenia neidú". Príčina? `siteurl` v DB ostal na staging URL, OAuth callbacks viseli vo vzduchu a AdMin login URL bol v search-replace prepísaný napoly.

Toto je postup, ktorý odjazdím s rovnakým opakovaním pri každej migrácii. Cutover je ~5 minút, downtime efektívne 0.

## Pre-flight: čo zistiť pred prvým príkazom

Pre Woo eshop alebo akúkoľvek live aplikáciu skontroluj **kde sú vendor-locked URL**:

- Stripe / Tatra eCard / GoPay — webhook URLs, success/cancel URLs
- Google OAuth (login plugins, Calendar embeds) — authorized redirect URIs
- Mailchimp / Brevo / Klaviyo — webhook endpoint v ich dashboarde
- CDN config (Cloudflare, Bunny) — origin URL
- DNS provider — kde je nameserver, máš tam access?

Ak týchto 5 vecí nemáš v Notion checklisteoch pred migráciou, narazíš na to v cutover okne a stratíš 30 minút.

## Krok 1: DB export cez wp-cli

Klasický `mysqldump` funguje, ale `wp-cli` zohľadní per-environment context, vie ti rovno spraviť `wp db search-replace --dry-run` na duplikáte.

```bash
# na zdroji
wp db export --add-drop-table dump-$(date +%Y%m%d-%H%M).sql

# alebo bez wp-cli
mysqldump --single-transaction --quick --add-drop-table -u user -p dbname > dump.sql
```

`--single-transaction` je dôležité pre InnoDB — dump je konzistentný point-in-time snapshot bez table locku.

## Krok 2: search-replace (CRITICAL: serialized data)

Toto je #1 dôvod, prečo polovica migrácií skončí v haváriii. WordPress ukladá serialized PHP arrays do DB (widgets, theme mods, ACF data). Naivné `sed -i 's/old.com/new.com/g'` sa NEHODÍ — rozbije serialized string lengths.

```bash
# v správnej forme — wp-cli zachová serialized arrays
wp search-replace 'https://staging.firma.sk' 'https://firma.sk' \
  --all-tables \
  --skip-columns=guid \
  --report-changed-only \
  --dry-run
```

Niekoľko vecí:
- `--skip-columns=guid` — `guid` v `wp_posts` musí ostať historický, Google a feed readers ho používajú ako identifikátor.
- `--all-tables` — defaultne sa pozerá iba na "WP" tabuľky. Woo, ACF, custom plugins ich majú navyše.
- `--dry-run` najprv. Uvidíš počet matchov, predtým než sa rozhodneš.

Po dry-rune drop `--dry-run` a pusti naživo.

Pridanie HTTP/HTTPS protocol mismatch:

```bash
wp search-replace 'http://firma.sk' 'https://firma.sk' --all-tables --dry-run
```

## Krok 3: media — `rsync -avz`

Mediá sú často gigabajty. `scp` ich kopíruje od nuly. `rsync` len zmeny.

```bash
# z lokálu na produkciu
rsync -avz --progress \
  /Users/filip/projects/klient/wp-content/uploads/ \
  user@server:/var/www/firma.sk/wp-content/uploads/

# druhý beh tesne pred cutoverom — rýchle delta
rsync -avz --progress --delete \
  /Users/filip/projects/klient/wp-content/uploads/ \
  user@server:/var/www/firma.sk/wp-content/uploads/
```

`-z` kompresia cez SSH, `--delete` zmaže súbory na produkcii, ktoré už nie sú v zdroji (pre čistú sync).

Pre projekty s 20+ GB uploadov radšej **pred týždňom** nahrám 95 % súborov. V cutoveri len delta z posledných dní.

## Krok 4: DNS pre-warm s nízkym TTL

Týždeň pred plánovaným cutoverom **zníž TTL** na DNS A/AAAA záznamoch z default 86400s na 300s. To znamená, že keď v cutover okne zmeníš IP, propagácia sveta trvá 5 minút namiesto 24 hodín.

```bash
# overenie current TTL
dig +noall +answer firma.sk A
# firma.sk.    86400    IN    A    1.2.3.4
```

Po znížení by si mal vidieť `300`. Toto je 30-sekundová úloha v DNS panel-e (Wedos, Websupport, Cloudflare), ale väčšina ju ignoruje.

## Krok 5: Cutover okno (5–10 minút)

Toto je samotný switch. Mám naplánovaný čas (zvyčajne 22:00–22:15 lokálne, najmenšia traffic).

**Maintenance mode na zdroji** (aby si nikto nepridal nový obrázok počas finálneho rsync):

```bash
wp maintenance-mode activate
```

**Final DB sync:**

```bash
# export z poslednej minúty
ssh stagging-host "wp db export /tmp/final-dump.sql"
scp staging:/tmp/final-dump.sql ./

# import na produkciu
scp final-dump.sql production:/tmp/
ssh production "wp db import /tmp/final-dump.sql"
ssh production "wp search-replace 'staging.firma.sk' 'firma.sk' --all-tables --skip-columns=guid"
```

**Final media rsync** (z bodu 3, druhý beh).

**DNS switch** — zmeň A záznam na novú IP cez panel.

**Verifikácia:**

```bash
# spravne IP?
dig +short firma.sk
curl -I https://firma.sk
```

**Cache flush** — Cloudflare purge, plugin caches:

```bash
ssh production "wp cache flush"
ssh production "wp w3-total-cache flush all" # ak používaš W3TC
```

**Maintenance mode off:**

```bash
wp maintenance-mode deactivate
```

## Krok 6: Post-launch checklist

Prvých 24 hodín po cutoveri:

- [ ] Search Console — pridaj novú property, fetch as Google
- [ ] `sitemap.xml` resubmit
- [ ] 301 redirects ze starej URL štruktúry (ak sa menili permalinky)
- [ ] Test checkout flow na cudzom zariadení (mobile, iný internet)
- [ ] Test login s adminom + bežným userom
- [ ] Email DKIM/SPF — funguje WP Mail SMTP / Postmark?
- [ ] Webhooks — Stripe dashboard, GoPay dashboard, MailChimp
- [ ] OAuth callbacks — login cez Google, FB

## Edge cases, na ktoré som narazil

### Payment gateway webhook URLs

Stripe ti pošle webhook na `https://staging.firma.sk/?wc-api=stripe`. Ak to neaktualizuješ v Stripe dashboarde, payment v live nedôjde (charge sa stane, ale Woo order ostane "pending").

### OAuth redirect URIs

Google Cloud Console → OAuth credentials → Authorized redirect URIs. Pridaj produkčnú URL **pred** cutoverom (môžeš mať tam stating aj prod naraz). Po týždni staging zmaž.

### Hardcoded URLs v PHP

`functions.php` alebo MU plugins občas majú hardcoded `https://staging.firma.sk` v `wp_remote_get()` calloch. Search-replace v DB to nezachytí. Príkaz:

```bash
grep -r "staging.firma.sk" wp-content/themes/ wp-content/plugins/ wp-content/mu-plugins/
```

### Cron events s URL

`wp cron event list` — niektoré scheduled events majú URL v argumentoch. Ak sa rozbijú, kontakt formy či mailing lists prestanú odosielať.

## TL;DR

Zero-downtime migrácia v 6 krokoch: TTL zníž týždeň vopred, DB export cez `wp-cli`, `wp search-replace` (NIKDY `sed`), media `rsync` postupne + delta v cutoveri, DNS switch, cache flush. Post-launch skontroluj webhooks, OAuth a Search Console. Cutover okno typicky 5–10 minút. Najčastejší dôvod havárie: zabudnutý webhook URL u payment provider-a.
