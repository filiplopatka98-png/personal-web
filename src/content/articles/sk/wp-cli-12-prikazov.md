---
title: "WP-CLI: 12 príkazov, ktoré ti ušetria hodiny"
date: 2026-10-13
read: 8
tags: ["WordPress"]
excerpt: "Praktický WP-CLI toolkit: search-replace pri migrácii, hromadné aktualizácie, kontrola checksumov, čistenie transientov aj núdzový reset hesla — všetko z terminálu."
featured: false
---

Ak spravuješ WordPress cez wp-admin a myš, robíš to zbytočne pomaly. WP-CLI je oficiálny príkazový nástroj pre WordPress a väčšinu rutinnej práce — aktualizácie, migrácie, čistenie DB, debug — spraví za sekundy namiesto minút. Aktuálna stabilná verzia je **2.12.0** (vydaná 7. mája 2025) s podporou až po PHP 8.4.

Tu je dvanásť príkazov, ktoré používam najčastejšie. Nie je to referenčná príručka — je to výber, ktorý reálne šetrí čas. Príkazy spúšťaj vždy v koreňovom adresári WordPressu (tam, kde je `wp-config.php`), prípadne s `--path=/cesta/k/webu`.

## 1. search-replace — kráľ migrácií

Toto je jediný dôvod, prečo si väčšina ľudí WP-CLI vôbec nainštaluje. Pri presune webu z lokálu na produkciu treba prepísať doménu naprieč celou databázou — vrátane **serializovaných** dát (nastavenia widgetov, page builderov, ACF). Klasický SQL `REPLACE` serializované pole rozbije, lebo nedopočíta dĺžku reťazca. WP-CLI to rieši korektne:

```bash
# Najprv nasucho — ukáže, koľko výskytov by zmenil, ale nič nezapíše
wp search-replace 'https://localhost:8888' 'https://mojweb.sk' --dry-run

# Ostrý beh, s vynechaním stĺpca guid (ten sa nikdy nemení)
wp search-replace 'https://localhost:8888' 'https://mojweb.sk' --skip-columns=guid
```

`--dry-run` je tu povinnosť, nie luxus — vždy si najprv pozri report. Pri tvrdohlavých serializovaných dátach pridaj `--precise` (spracuje to v PHP namiesto SQL, je to pomalšie, ale spoľahlivejšie). Detailne som celý postup rozpísal v článku o [migrácii WordPressu z lokálu na produkciu bez výpadku](/blog/wp-migracia-bez-vypadku/).

## 2. db export — záloha za dve sekundy

Predtým, než čokoľvek zmeníš, sprav dump databázy. Žiadny plugin, žiadne klikanie:

```bash
wp db export zaloha-$(date +%Y%m%d-%H%M).sql
```

Import naspäť je `wp db import subor.sql`. Pri väčších weboch odporúčam pridať `--add-drop-table`, aby import najprv zahodil staré tabuľky.

## 3. plugin update --all — koniec klikania

Aktualizovať 20 pluginov cez wp-admin je otrava. Jedným príkazom:

```bash
wp plugin update --all
```

A ešte lepšie — najprv si pozri, čo je zastarané, bez toho, aby si čokoľvek menil:

```bash
wp plugin list --update=available --fields=name,version,update_version
```

Rovnaký princíp platí pre `wp theme update --all` aj `wp core update`. Pri produkcii to vždy rob nad stagingom a so zálohou — automatická aktualizácia vie občas niečo zlomiť. Viac o tom v článku o [minimálnom bezpečnostnom sete pre WordPress](/blog/wp-bezpecnost-2026/).

## 4. plugin list — nájdi mŕtve pluginy

Neaktívne pluginy sú bezpečnostné riziko aj balast. Vypíš si len ich názvy:

```bash
wp plugin list --status=inactive --field=name
```

Výstup vieš rovno prepojiť s ďalším príkazom cez `xargs` — napríklad hromadne odinštalovať. To ma privádza k plugin diéte, ktorú riešim v článku [z 28 pluginov na 9](/blog/plugin-dieta-z-28-na-9/).

## 5. verify-checksums — máš čistý core?

Ak máš podozrenie, že web niekto napadol, toto je prvý test. WP-CLI stiahne oficiálne kontrolné súčty z WordPress.org a porovná ich s tvojimi súbormi:

```bash
wp core verify-checksums
wp plugin verify-checksums --all
```

Ak ti to vypíše, že súbor `wp-includes/…` nesedí, buď máš poškodenú inštaláciu, alebo tam niekto podstrčil kód. Je to najrýchlejší spôsob, ako odhaliť injektovaný malware v core súboroch.

## 6. transient delete — vyčisti cache haldy

Transienty sú dočasná cache v tabuľke `wp_options`. Pluginy ich generujú tisíce a nie vždy si po sebe upratujú — expirované transienty tam zostávajú a nafukujú `autoload`. Vyčisti len tie expirované:

```bash
wp transient delete --expired
```

Alebo, keď ladíš a chceš čistý stôl, všetky naraz cez `wp transient delete --all`. Toto je jeden z prvých krokov, keď riešim pomalý dashboard.

## 7. cache flush — keď „to nefunguje"

Object cache (Redis, Memcached) vie po zmene v DB držať starú hodnotu. Namiesto reštartu služby:

```bash
wp cache flush
```

Ak riešiš object cache do hĺbky, mám o tom samostatný článok — [Redis object cache na WordPresse: kedy a ako](/blog/redis-object-cache-wordpress/).

## 8. cron event — otestuj, čo sa má spustiť

WP-Cron sa spúšťa pri návštevách stránky, čo je na málo navštevovaných weboch problém. Cez CLI si vieš pozrieť naplánované eventy a manuálne ich spustiť:

```bash
# Čo je naplánované
wp cron event list

# Spusti všetko, čo je práve teraz „due"
wp cron event run --due-now
```

Toto je základ, ak WP-Cron nahrádzaš reálnym systémovým cronom (odporúčaný postup: `DISABLE_WP_CRON` v `wp-config.php` a systémový cron, ktorý volá `wp cron event run --due-now`).

## 9. user create — účet bez UI

Založiť administrátora z terminálu, napríklad na servisný prístup:

```bash
wp user create servis servis@mojweb.sk --role=administrator --user_pass='SemDlheHeslo!'
```

Bez zadania hesla ho WP-CLI vygeneruje a vypíše.

## 10. user reset-password — núdzový vstup

Klient zabudol heslo a e-maily nechodia? Reset priamo z CLI a heslo si rovno vypíšeš:

```bash
wp user reset-password admin --show-password
```

Flag `--show-password` zobrazí novo vygenerované heslo v termináli. Ak nechceš, aby WordPress poslal notifikačný e-mail, pridaj `--skip-email`.

## 11. media regenerate — nové rozmery obrázkov

Keď zmeníš rozmery v téme alebo pridáš novú veľkosť cez `add_image_size()`, staré obrázky ju nemajú. Pregeneruj náhľady hromadne:

```bash
# Len chýbajúce, existujúce preskočí
wp media regenerate --only-missing
```

Bez `--only-missing` pregeneruje všetko, čo pri tisíckach obrázkov trvá. Súvisí to s výkonom — o obrázkoch a lazy-loadingu píšem v článku [kedy native, kedy custom lazy-loading](/blog/image-lazy-loading-native-vs-custom/).

## 12. db optimize — údržba tabuliek

Fragmentované tabuľky spomaľujú dotazy. WP-CLI spustí `OPTIMIZE TABLE` nad celou databázou:

```bash
wp db optimize
```

Pri weboch s InnoDB to nie je zázrak, ale v kombinácii s čistením `wp_options` (transienty, expired sessions) to má merateľný efekt na TTFB.

## Bonus: aliasy pre viac webov

Toto je moment, keď sa WP-CLI zmení z „šikovné" na „nenahraditeľné". Do `~/.wp-cli/config.yml` si nadefinuješ aliasy — vrátane vzdialených cez SSH:

```yaml
@produkcia:
  ssh: user@server.sk/var/www/mojweb.sk
@lokal:
  path: /Users/ja/sites/mojweb
```

Potom `wp @produkcia plugin update --all` spustí príkaz priamo na produkčnom serveri bez toho, aby si sa tam manuálne prihlasoval. A `wp @all core version` vypíše verzie naprieč všetkými webmi naraz.

## Kde začať

Ak WP-CLI ešte nemáš, nainštaluj `wp-cli.phar` podľa [oficiálneho handbooku](https://make.wordpress.org/cli/handbook/guides/installing/), over `wp cli info` a začni s dvomi príkazmi: `wp search-replace --dry-run` a `wp db export`. Tie dva ťa presvedčia. Zvyšok si osvojíš prirodzene — a po týždni sa k wp-admin klikaniu pri rutinnej správe už nevrátiš.
