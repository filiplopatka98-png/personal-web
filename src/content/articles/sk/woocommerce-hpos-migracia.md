---
title: "WooCommerce HPOS: ako bezpečne migrovať objednávky na nové tabuľky"
date: 2026-08-05
read: 8
tags: ["WooCommerce", "WordPress"]
excerpt: "HPOS presúva objednávky z wp_posts do vlastných tabuliek a mení pomalý admin na rýchly pri väčšom katalógu. Bezpečný postup: záloha, compatibility mode, WP-CLI sync, overenie dát a rollback plán."
featured: false
faq:
  - q: "Čo je HPOS a prečo ho migrovať?"
    a: "HPOS (High-Performance Order Storage) presúva WooCommerce objednávky z tabuľky wp_posts a wp_postmeta do štyroch dedikovaných, indexovaných tabuliek. Podľa oficiálneho oznámenia WooCommerce prináša až 5-násobne rýchlejšie vytváranie objednávky, až 40-násobne rýchlejšie vyhľadávanie a filtrovanie objednávok v adminu a až 1,5-násobne rýchlejší checkout. Rozdiel je citeľný najmä pri eshope s tisíckami objednávok a rokmi histórie."
  - q: "Ako bezpečne zapnúť HPOS na produkčnom eshope?"
    a: "Najprv zálohuj databázu, potom zapni compatibility mode, ktorý len synchronizuje objednávky medzi starým a novým úložiskom bez zmeny autoritatívnej tabuľky. Pri väčšom obchode spusti synchronizáciu cez WP-CLI príkazom wp wc hpos sync namiesto čakania na web scheduler, over konzistenciu dát príkazom wp wc hpos verify_data, a až keď je počet nedosynchronizovaných objednávok nula, prepni v Advanced → Features na HPOS ako primárne úložisko."
  - q: "Čo je najväčšie riziko pri migrácii na HPOS?"
    a: "Najväčším rizikom sú pluginy alebo vlastný kód, ktoré pristupujú k objednávkam priamo cez SQL na wp_posts alebo wp_postmeta namiesto oficiálneho WC_Order API — s HPOS prestanú fungovať alebo uvidia neúplné dáta. WooCommerce má poistku: ak zistí nekompatibilný plugin, HPOS automaticky vypne a v adminu zobrazí zoznam problémových rozšírení. Preto treba pred migráciou na produkcii overiť všetky pluginy dotýkajúce sa objednávok najprv na stagingu."
  - q: "Dá sa migrácia na HPOS vrátiť späť?"
    a: "Áno, pokiaľ zostane zapnutý compatibility mode, stačí v Advanced → Features prepnúť autoritatívnu tabuľku späť na WordPress posts storage, keďže staré tabuľky boli počas synchronizácie priebežne aktuálne. Definitívne nezvratným krokom je až príkaz wp wc hpos cleanup all, ktorý reálne zmaže legacy dáta z wp_postmeta — ten sa má spúšťať až po týždňoch bezproblémovej prevádzky a s čerstvou zálohou."
---

HPOS (High-Performance Order Storage) presúva WooCommerce objednávky z tabuľky `wp_posts` do vlastných, indexovaných tabuliek — výsledkom je výrazne rýchlejší admin pri väčšom počte objednávok. Ak máš WooCommerce eshop založený pred rokom 2023, tvoje objednávky s vysokou pravdepodobnosťou ešte stále bývajú tam, kde bývali od začiatku WordPressu — v `wp_posts` spolu s článkami a stránkami, a metadáta k nim v `wp_postmeta`. Funguje to, ale je to architektonicky zlá dohoda: `wp_postmeta` je EAV štruktúra (key-value páry), takže aj jednoduchý filter „objednávky za posledný mesiac so statusom completed" znamená viacero JOINov na tabuľku, ktorá rastie donekonečna a nemá poriadne indexy pre biznisové otázky, ktoré si eshop kladie.

HPOS (High-Performance Order Storage, predtým "Custom Order Tables") je odpoveď WooCommerce na presne tento problém. Plán publikovali v januári 2022 ([developer.woocommerce.com/2022/01/17](https://developer.woocommerce.com/2022/01/17/the-plan-for-the-woocommerce-custom-order-table/)), reálne testovanie s komunitou bežalo od mája 2022 a stabilný stav prišiel vo **WooCommerce 8.2** (vydané 10. októbra 2023) — odvtedy je HPOS predvolene zapnutý pre všetky nové inštalácie ([developer.woocommerce.com — HPOS docs](https://developer.woocommerce.com/docs/features/orders/high-performance-order-storage/)). Ak si eshop rozbehol pred týmto dátumom, HPOS pravdepodobne bežíš stále v legacy móde a migrácia je na tebe.

## Prečo sa to oplatí riešiť

Toto nie je kozmetická zmena. Podľa oficiálneho oznámenia WooCommerce prináša HPOS **až 5-násobne rýchlejšie** vytváranie objednávky, **až 40-násobne rýchlejšie** vyhľadávanie/filtrovanie objednávok v adminu a **až 1,5-násobne rýchlejší** checkout ([woocommerce.com — Platform Upgrade: HPOS](https://woocommerce.com/posts/platform-update-high-performance-order-storage-for-woocommerce/)). Pri malom eshope s desiatkami objednávok mesačne to nepocítiš. Pri eshope s tisíckami objednávok a rokmi histórie je to rozdiel medzi adminom, ktorý sa dá používať, a adminom, kde filter objednávok podľa zákazníka trvá desať sekúnd. Podobný efekt „veľký katalóg = pomalý admin" riešim aj z produktovej strany v článku o [Woo administrácii pri 10 000+ produktoch](/blog/woo-admin-10000-produktov/) — tam je vinníkom postmeta pri produktoch, tu presne tá istá chyba dizajnu pri objednávkach.

HPOS presúva dáta zo `wp_posts`/`wp_postmeta` do štyroch dedikovaných tabuliek, optimalizovaných priamo na to, ako WooCommerce s objednávkami pracuje ([woocommerce.com — Installed Database Tables](https://woocommerce.com/document/installed-database-tables/)):

- `wp_wc_orders` — jadro objednávky (status, mena, sumy, dátumy)
- `wp_wc_order_addresses` — fakturačná a dodacia adresa
- `wp_wc_order_operational_data` — platobné a doručovacie prevádzkové dáta
- `wp_wc_orders_meta` — voľné metadáta (to, čo si pluginy predtým ukladali do postmeta)

Dôsledok: namiesto reťaze JOINov na EAV tabuľku dostaneš normálne stĺpce s indexmi. Dotaz, ktorý by pri legacy štruktúre vyzeral ako desiatky riadkov s `postmeta` JOINmi na `meta_key IN ('_billing_email', '_order_total', ...)`, sa zmení na priamy `WHERE` nad skutočnými stĺpcami tabuľky `wp_wc_orders`.

## Ako zistiť, v akom stave si teraz

V **WooCommerce → Nastavenia → Rozšírené → Funkcie** (Advanced → Features) uvidíš sekciu High-Performance Order Storage a aktuálny stav — legacy (posts), HPOS, alebo compatibility mode (obe naraz, synchronizované). Rovnaké info vieš vytiahnuť z terminálu:

```bash
wp wc hpos status
```

Príkaz vypíše, ktorá tabuľka je aktuálne autoritatívna (zdroj pravdy), či beží compatibility mode, koľko objednávok čaká na sync a koľko ich čaká na cleanup zo starých tabuliek ([developer.woocommerce.com — HPOS CLI Tools](https://developer.woocommerce.com/docs/features/high-performance-order-storage/cli-tools/)). Ak WP-CLI nemáš poruke, celý prehľad odporúčaných príkazov na rutinnú správu WordPressu mám v [WP-CLI: 12 príkazov, ktoré ti ušetria hodiny](/blog/wp-cli-12-prikazov/) — HPOS príkazy do tej dvanástky nepočítam, ale filozofia „radšej terminál ako čakanie na web UI" platí rovnako.

## Bezpečný postup migrácie

Migráciu objednávok neber na ľahkú váhu o nič menej než presun celého webu — princíp „najprv záloha, potom over, až potom prepni" je rovnaký ako v [migrácii WordPressu bez výpadku](/blog/wp-migracia-bez-vypadku/). Tu je postup, ktorý funguje pre bežný eshop v produkcii.

### 1. Záloha databázy

Bez debaty, pred akoukoľvek zmenou v Advanced → Features:

```bash
wp db export pred-hpos-$(date +%Y%m%d).sql
```

### 2. Zapni compatibility mode (nie rovno HPOS)

V **WooCommerce → Nastavenia → Rozšírené → Funkcie** zapni **„Enable compatibility mode (synchronizes orders to the posts table)"**. Toto NEPREPÍNA autoritatívnu tabuľku — len začne obojsmerne synchronizovať objednávky medzi starým a novým úložiskom na pozadí ([developer.woocommerce.com — Enable HPOS](https://developer.woocommerce.com/docs/features/orders/high-performance-order-storage/enable-hpos/)). Toto je bod, kde môžeš najviac pokaziť najmenej — ak niečo nesedí, si stále na legacy dátach a nič sa nestratí.

Synchronizácia beží defaultne cez Action Scheduler v dávkach po 25 objednávkach; priebeh vidíš v **WooCommerce → Status → Scheduled Actions**, kde vieš naplánované úlohy aj ručne spustiť.

### 3. Pri väčšom obchode nečakaj na web scheduler — použi WP-CLI

Pri stovkách či tisíckach objednávok je čakanie na Action Scheduler cez web pomalé a naráža na HTTP timeouty. Rýchlejšie a spoľahlivejšie je spustiť sync priamo:

```bash
wp wc hpos sync
```

Príkaz migruje objednávky z aktuálne aktívneho úložiska do druhého podľa nastavenia v Advanced → Features, a je výrazne rýchlejší než spoliehať sa len na compatibility mode na pozadí ([developer.woocommerce.com — HPOS CLI Tools](https://developer.woocommerce.com/docs/features/high-performance-order-storage/cli-tools/)). Počet nedosynchronizovaných objednávok priebežne skontroluješ cez:

```bash
wp wc hpos count_unmigrated
```

### 4. Over konzistenciu dát pred prepnutím

Toto je krok, ktorý ľudia preskakujú a potom riešia divné bugy v reportoch. HPOS má vstavaný nástroj na porovnanie dát medzi oboma úložiskami:

```bash
wp wc hpos verify_data
```

Ak nájde nezrovnalosti (napr. rozdielny status alebo chýbajúci meta kľúč), vieš ich rovno dorovnať pridaním `--re-migrate`. Pri konkrétnej podozrivej objednávke vieš ísť do detailu:

```bash
wp wc hpos diff 12345 --format=list
```

### 5. Prepni autoritatívne tabuľky

Až keď `count_unmigrated` hovorí nula a `verify_data` je čistý, prepni v Advanced → Features na HPOS ako primárne úložisko. Compatibility mode odporúčam nechať zapnutý ešte nejaký čas po prepnutí — je to tvoja poistka, ktorá ti umožní vrátiť sa späť, ak niečo nesedí (napr. plugin, ktorý číta priamo z `wp_postmeta`).

## Rollback

Presne preto compatibility mode nevypínaš hneď: ak po prepnutí zistíš problém (chybný report, plugin, ktorý prestal fungovať), stačí v Advanced → Features prepnúť autoritatívnu tabuľku späť na „WordPress posts storage". Kým bola synchronizácia zapnutá, staré tabuľky mali priebežne aktuálne dáta, takže návrat nie je destruktívna operácia. Až keď si si na 100 % istý, že HPOS beží bez problémov (typicky po týždňoch produkčnej prevádzky), môžeš vyčistiť staré dáta:

```bash
wp wc hpos cleanup all
```

Tento krok je nezvratný — legacy dáta v `wp_postmeta` reálne zmaže. Nerob ho, kým nemáš čerstvú zálohu a istotu, že sa už nevraciaš.

## Najväčší gotcha: nekompatibilné pluginy

Toto je dôvod, prečo HPOS nezapneš naslepo na produkcii. Každý plugin alebo vlastný kód, ktorý pristupuje k objednávkam priamo cez SQL na `wp_posts`/`wp_postmeta` namiesto oficiálneho `WC_Order` / `wc_get_orders()` API, s HPOS prestane fungovať alebo bude vidieť neúplné dáta. WooCommerce má na to poistku — ak zistí nekompatibilný plugin, HPOS sa automaticky vypne a v adminu dostaneš zoznam problémových rozšírení s odporúčaním kontaktovať ich autorov, nech pridajú podporu ([developer.woocommerce.com — HPOS docs](https://developer.woocommerce.com/docs/features/orders/high-performance-order-storage/)).

Prakticky to znamená: pred migráciou na produkcii over každý plugin, ktorý sa dotýka objednávok (fakturačné pluginy, export do účtovníctva, custom reporty, staršie prepojenia na sklad) — najprv na stagingu, nie priamo na živom obchode. Ak máš vlastný kód, ktorý číta `get_post_meta($order_id, ...)` namiesto `$order->get_meta(...)`, oprav ho pred prepnutím — to je presne ten kód, ktorý ťa pri HPOS prekvapí.

## Zhrnutie

HPOS nie je voliteľná hračka — je to smer, ktorým sa WooCommerce architektonicky uberá, a pri väčšom katalógu objednávok je rozdiel v rýchlosti admina citeľný okamžite. Bezpečná cesta je vždy rovnaká: záloha → compatibility mode → WP-CLI sync namiesto čakania na web scheduler → `verify_data` → prepnutie → cleanup až s odstupom. Ak k tomu chceš pridať aj databázový cache stack (Redis pre object cache popri HPOS pre objednávky), pozri [Redis object cache na WordPresse](/blog/redis-object-cache-wordpress/) — obe zmeny spolu riešia rovnaký koreňový problém: databázu, ktorá sa pri raste eshopu stáva úzkym hrdlom.
