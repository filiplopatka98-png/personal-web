---
title: "Migrácia WordPressu z lokálu na produkciu bez výpadku"
date: 2026-01-15
read: 8
tags: ["WordPress", "DevOps"]
excerpt: "Praktický postup pre migráciu WordPressu bez výpadku — wp-cli search-replace, rsync médií, zníženie DNS TTL vopred a 5-minútový cutover. Bash skripty a záludné situácie z praxe."
featured: false
---

Migrácia WordPressu nie je raketová veda, ale spôsobov, ako ju pokašľať, je nespočetne. Klient mi pred dvoma týždňami zavolal: „kolega nám migroval shop, tržby od soboty nula, kontaktný formulár padá, prihlásenie nefunguje". Príčina? `siteurl` v databáze zostal na staging URL, OAuth callbacky viseli vo vzduchu a URL admin prihlásenia bola v search-replace prepísaná len napoly.

Toto je postup, ktorý si pri každej migrácii odjazdím rovnako. Cutover trvá zhruba 5 minút, výpadok je efektívne nulový.

## Pre-flight: čo zistiť pred prvým príkazom

Pri Woo eshope alebo akejkoľvek živej aplikácii over, **kde máš URL zadrôtované u externých služieb**:

- Stripe / Tatra eCard / GoPay — webhook URL, success/cancel URL
- Google OAuth (prihlasovacie pluginy, embedy Kalendára) — authorized redirect URI
- Mailchimp / Brevo / Klaviyo — webhook endpoint v ich nástenke
- konfigurácia CDN (Cloudflare, Bunny) — origin URL
- DNS provider — kde je nameserver, máš tam prístup?

Ak týchto 5 vecí nemáš v Notion checkliste pred migráciou, narazíš na ne v cutover okne a stratíš 30 minút.

## Krok 1: DB export cez wp-cli

Klasický `mysqldump` funguje, ale `wp-cli` zohľadní kontext konkrétneho prostredia a vie ti rovno spraviť `wp search-replace --dry-run` na duplikáte.

```bash
# na zdroji
wp db export --add-drop-table dump-$(date +%Y%m%d-%H%M).sql

# alebo bez wp-cli
mysqldump --single-transaction --quick --add-drop-table -u user -p dbname > dump.sql
```

`--single-transaction` je pri InnoDB dôležité — dump je konzistentný snapshot k jednému okamihu a nezamkne tabuľky, takže zápisy počas neho bežia ďalej.

## Krok 2: search-replace (CRITICAL: serialized data)

Toto je dôvod č. 1, prečo polovica migrácií skončí haváriou. WordPress ukladá do databázy serializované PHP polia (widgety, theme mods, dáta ACF). Naivné `sed -i 's/old.com/new.com/g'` sa NEHODÍ — rozbije dĺžky reťazcov v serializovaných dátach.

```bash
# správne — wp-cli zachová serializované polia
wp search-replace 'https://staging.firma.sk' 'https://firma.sk' \
  --all-tables \
  --skip-columns=guid \
  --report-changed-only \
  --dry-run
```

Niekoľko poznámok:
- `--skip-columns=guid` — `guid` v `wp_posts` musí zostať historicky nemenný, čítačky RSS ho používajú ako trvalý identifikátor položky vo feede.
- `--all-tables` — bez neho sa `wp-cli` pozerá iba na tabuľky registrované vo `$wpdb`. Woo, ACF a vlastné pluginy majú tabuľky navyše.
- najprv `--dry-run`. Uvidíš počet zásahov skôr, než sa rozhodneš.

Po dry-rune odober `--dry-run` a pusti to naostro.

Ešte ošetri prípadný nesúlad protokolu HTTP/HTTPS:

```bash
wp search-replace 'http://firma.sk' 'https://firma.sk' --all-tables --dry-run
```

## Krok 3: media — `rsync -avz`

Médiá majú často gigabajty. `scp` ich kopíruje odznova, `rsync` prenesie iba zmeny.

```bash
# z lokálu na produkciu
rsync -avz --progress \
  /Users/filip/projects/klient/wp-content/uploads/ \
  user@server:/var/www/firma.sk/wp-content/uploads/

# druhý beh tesne pred cutoverom — rýchla delta
rsync -avz --progress --delete \
  /Users/filip/projects/klient/wp-content/uploads/ \
  user@server:/var/www/firma.sk/wp-content/uploads/
```

`-z` je kompresia počas prenosu cez SSH, `--delete` zmaže na produkcii súbory, ktoré už v zdroji nie sú (kvôli čistej synchronizácii).

Pri projektoch s viac než 20 GB médií radšej **týždeň vopred** nahrám 95 % súborov. V cutoveri už prenášam len deltu z posledných dní.

## Krok 4: DNS pre-warm s nízkym TTL

Týždeň pred plánovaným cutoverom **zníž TTL** na DNS záznamoch A/AAAA z bežných 86 400 s na 300 s. Znamená to, že keď v cutover okne zmeníš IP, propagácia po svete potrvá 5 minút namiesto 24 hodín.

```bash
# overenie aktuálneho TTL
dig +noall +answer firma.sk A
# firma.sk.    86400    IN    A    1.2.3.4
```

Po znížení by si mal vidieť `300`. Je to 30-sekundová úloha v DNS paneli (Wedos, Websupport, Cloudflare), ktorú väčšina ľudí ignoruje.

## Krok 5: Cutover okno (5–10 minút)

Toto je samotné prepnutie. Mám naň naplánovaný čas (zvyčajne 22:00 – 22:15 miestneho času, keď je najmenšia návštevnosť).

**Režim údržby na zdroji** (aby počas finálneho rsync nikto nepridal nový obrázok):

```bash
wp maintenance-mode activate
```

**Finálna synchronizácia databázy:**

```bash
# export z poslednej minúty
ssh staging-host "wp db export /tmp/final-dump.sql"
scp staging:/tmp/final-dump.sql ./

# import na produkciu
scp final-dump.sql production:/tmp/
ssh production "wp db import /tmp/final-dump.sql"
ssh production "wp search-replace 'staging.firma.sk' 'firma.sk' --all-tables --skip-columns=guid"
```

**Finálny rsync médií** (z bodu 3, druhý beh).

**Prepnutie DNS** — zmeň A záznam na novú IP cez panel.

**Overenie:**

```bash
# správna IP?
dig +short firma.sk
curl -I https://firma.sk
```

**Vyprázdnenie cache** — purge na Cloudflare aj cache pluginov:

```bash
ssh production "wp cache flush"
ssh production "wp w3-total-cache flush all" # ak používaš W3TC
```

**Vypnutie režimu údržby:**

```bash
wp maintenance-mode deactivate
```

## Krok 6: Post-launch checklist

Prvých 24 hodín po cutoveri:

- [ ] Search Console — pridaj novú property a cez nástroj URL Inspection požiadaj o indexáciu (staré „Fetch as Google" už neexistuje)
- [ ] znovu odošli `sitemap.xml`
- [ ] 301 presmerovania zo starej štruktúry URL (ak sa menili permalinky)
- [ ] otestuj priebeh objednávky na cudzom zariadení (mobil, iné pripojenie)
- [ ] otestuj prihlásenie s adminom aj bežným používateľom
- [ ] e-mail DKIM/SPF — funguje WP Mail SMTP / Postmark?
- [ ] webhooky — nástenka Stripe, nástenka GoPay, Mailchimp
- [ ] OAuth callbacky — prihlásenie cez Google, Facebook

## Záludné situácie, na ktoré som narazil

### Webhook URL platobných brán

Stripe posiela WooCommerce webhook na `https://staging.firma.sk/?wc-api=wc_stripe`. Ak to neaktualizuješ v nástenke Stripe, platba sa v ostrej prevádzke „nedotiahne" (platba prebehne, ale Woo objednávka zostane v stave „pending").

### OAuth redirect URI

Google Cloud Console → OAuth credentials → Authorized redirect URIs. Produkčnú URL pridaj **pred** cutoverom (pokojne tam môžeš mať staging aj prod naraz). Po týždni staging zmaž.

### Zadrôtované URL v PHP

`functions.php` alebo MU pluginy majú občas natvrdo zapísané `https://staging.firma.sk` vo volaniach `wp_remote_get()`. Search-replace v databáze to nezachytí. Príkaz:

```bash
grep -r "staging.firma.sk" wp-content/themes/ wp-content/plugins/ wp-content/mu-plugins/
```

### Cron eventy s URL

`wp cron event list` — niektoré naplánované eventy majú URL v argumentoch. Ak sa rozbijú, kontaktné formuláre či mailing listy prestanú odosielať.

## TL;DR

Migrácia bez výpadku v 6 krokoch: TTL zníž týždeň vopred, DB export cez `wp-cli`, `wp search-replace` (NIKDY `sed`), médiá cez `rsync` postupne plus delta v cutoveri, prepnutie DNS, vyprázdnenie cache. Po nasadení skontroluj webhooky, OAuth a Search Console. Cutover okno býva 5 – 10 minút. Najčastejší dôvod havárie: zabudnutý webhook URL u platobnej brány.
