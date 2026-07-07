---
title: "Redis object cache na WordPresse: kedy dáva zmysel a ako ho nasadiť"
date: 2026-10-08
read: 8
tags: ["WordPress", "Performance"]
excerpt: "Persistentný object cache cez Redis vie odbremeniť databázu na admin-heavy WooCommerce weboch. Kedy to reálne pomôže, ako to nastaviť správne a kde sú pasce."
featured: false
---

Skoro každý druhý WordPress projekt, ktorý beriem do auditu, má v Site Health svietiacu hlášku „You should use a persistent object cache". Táto kontrola pribudla vo WordPress 6.1 a odvtedy ju vidím ignorovanú na weboch, kde by object cache reálne pomohol — aj na weboch, kde by bol úplne zbytočný. Poďme si to vyjasniť: kedy Redis object cache dáva zmysel, ako ho správne nasadiť a prečo samotné „zapnutie Redisu" často nespraví vôbec nič.

## Čo object cache vlastne rieši

WordPress má vstavaný object cache už roky, lenže v defaulte je **neperzistentný**. Znamená to, že všetko, čo `wp_cache_set()` uloží do pamäte, žije presne jeden request — po jeho skončení sa zahodí a ďalší request si tú istú robotu (rovnaké DB dotazy, rovnaké deserializácie options) odrobí odznova.

Persistentný object cache to zmení: dáta z `wp_cache_set()` sa uložia do externého úložiska (Redis alebo Memcached), ktoré je zdieľané naprieč všetkými PHP procesmi a prežije aj medzi requestami. Mechanika je prekvapivo jednoduchá — plugin nainštaluje drop-in súbor `wp-content/object-cache.php`, ktorý implementuje `wp_cache_*()` funkcie proti Redisu. WordPress core tento súbor načíta veľmi skoro pri bootovaní, ak existuje, a všetky volania cache tak idú do perzistentného backendu namiesto pamäte.

Dôležité rozlíšenie, ktoré si ľudia mýlia: object cache **nie je** to isté ako page cache. Page cache (Varnish, Nginx FastCGI cache, WP Rocket) servíruje hotové HTML anonymným návštevníkom a object cache k tomu ani nepustí. Object cache pomáha tam, kde page cache nefunguje — prihlásení používatelia, WooCommerce košík, admin, REST API. Ak riešiš aj to prvé, pozri [ktoré stránky na eshope riešiť ako prvé](/blog/cwv-eshop-priorita/).

## Kedy to dáva zmysel a kedy nie

Toto je časť, ktorú väčšina návodov preskočí. Redis object cache **nie je univerzálne zlepšenie**. V praxi to vidím takto:

**Dáva zmysel**, keď máš admin-heavy alebo dynamický web: WooCommerce s tisíckami produktov, členská sekcia, LMS, viacjazyčný web s ťažkými `options` tabuľkami, čokoľvek s množstvom prihlásených používateľov. Tam sa DB dotazy nedajú schovať za page cache a object cache reálne odbremení databázu.

**Nedáva zmysel** na jednoduchom brožúrovom webe alebo blogu, ktorý beží skoro celý za page cache. Anonymný návštevník dostane HTML z page cache a k PHP ani DB sa vôbec nedostane — object cache tam len pridá réžiu navyše a ďalšiu vec, ktorá sa môže pokaziť. WordPress toto priznáva aj v samotnej Site Health kontrole: odporúčanie sa zobrazuje až od určitého prahu (počet uložených options, počet komentárov, používateľov a pod.), lebo na malom webe je efekt zanedbateľný.

Moje pravidlo: ak web nemá výrazný podiel dynamických (necachovaných) requestov, Redis nerieš. Investuj radšej do rýchleho [TTFB pod 200 ms](/blog/ttfb-pod-200ms/) a poriadneho page cache.

## Redis alebo Memcached

Krátko, lebo to je večná otázka. Redis je vo väčšine prípadov lepší default — prežije reštart servera (perzistuje na disk), podporuje bohatšie dátové štruktúry a plugin okolo neho je aktívne udržiavaný. Memcached býva o kúsok rýchlejší na čisté key-value lookupy, ale cache stratí pri každom reštarte a kým sa znovu naplní, server dostáva zvýšenú záťaž. Pre WordPress beriem Redis, bez váhania.

## Nasadenie krok za krokom

Predpoklad číslo jedna, na ktorom to padá najčastejšie: **Redis server musí reálne bežať** a PHP sa naň musí vedieť pripojiť. Plugin sám o sebe Redis nenainštaluje. Ak hosting nemá Redis, samotný plugin je len mŕtva váha. Toto si over ako prvé — či už cez support hostingu, alebo príkazom.

```bash
redis-cli ping
# PONG
```

Ideálne maj aj PHP rozšírenie **PhpRedis** (PECL, kompilované v C), nie iba PHP knižnicu Predis. PhpRedis je podľa reálnych benchmarkov násobne rýchlejší — rádovo ~150-tisíc GET/SET operácií za sekundu oproti ~30-tisíc u Predisu. Rozdiel overíš v `phpinfo()` alebo:

```bash
php -m | grep redis
```

Ďalej pridaj konštanty do `wp-config.php` — **nad** riadok `/* That's all, stop editing! */`:

```php
define( 'WP_REDIS_HOST', '127.0.0.1' );
define( 'WP_REDIS_PORT', 6379 );
define( 'WP_REDIS_DATABASE', 0 );

// KĽÚČOVÉ pri viacerých weboch na jednom Redis serveri:
define( 'WP_CACHE_KEY_SALT', 'mojweb.sk:' );
```

`WP_CACHE_KEY_SALT` je tá časť, ktorú ľudia vynechávajú a potom sa čudujú, prečo sa im na zdieľanom Redise miešajú dáta medzi webmi. Bez unikátneho saltu sa cache kľúče z dvoch inštalácií kolidujú — a to sú veľmi ťažko dohľadateľné bugy. Ak Redis beží cez unix socket, použi namiesto host/port:

```php
define( 'WP_REDIS_SCHEME', 'unix' );
define( 'WP_REDIS_PATH', '/var/run/redis/redis.sock' );
```

Potom nainštaluj plugin **Redis Object Cache** od Tilla Krüssa (aktuálne 2.8.0, vyše 400-tisíc aktívnych inštalácií, vyžaduje PHP 7.2+). Je to de facto štandard a podporuje PhpRedis, Predis aj Relay. Aktiváciu spravíš v administrácii cez tlačidlo „Enable Object Cache", alebo elegantnejšie cez WP-CLI:

```bash
wp redis enable
wp redis status
```

`wp redis status` ti povie, či je pripojenie funkčné, aký klient sa používa a či drop-in sedí. To je tvoja kontrola, že to naozaj beží — nie hláška v Site Health, tá sa dá „upokojiť" aj polovičatým setupom.

## Nezabudni na igbinary

Malý, ale reálny výkonový detail: zapni **igbinary** serializer. Namiesto natívneho PHP serialize ukladá dáta kompaktnejšie — v praxi zmenší uložené dáta zhruba na tretinu a ušetrí čas na (de)serializácii, pri profilovaní to býva až polovica času stráveného unserializom. Potrebuješ PHP rozšírenie `igbinary` a jednu konštantu:

```php
define( 'WP_REDIS_SERIALIZER', 'igbinary' );
```

Over si, že rozšírenie beží (`php -m | grep igbinary`), inak plugin ticho spadne na default a ty budeš mať pocit, že to funguje.

## Pasce, na ktoré si dávam pozor

**Redis padne, web padne — ak si to nepoistíš.** Kvalitný plugin má vstavaný fallback: keď je Redis nedostupný, ticho sa vráti k neperzistentnému cache a web beží ďalej (len pomalšie). Overuj to. Krátky výpadok Redisu nesmie zhodiť celý web.

**Stará cache po deployi.** Po väčších zmenách (update pluginov, migrácia, zmena options) vyprázdni cache, inak servíruješ staré dáta:

```bash
wp cache flush
```

**Zdieľaný Redis bez limitu pamäte.** Ak beží viac webov na jednej Redis inštancii bez nastaveného `maxmemory` a `maxmemory-policy` (napr. `allkeys-lru`), skôr či neskôr ti Redis zožerie pamäť. Toto je vec, ktorú riešiš na strane servera, nie v pluginy.

**Meranie, nie viera.** Nenasadzuj Redis „lebo Site Health". Zmeraj predtým a potom — počet DB dotazov na request (Query Monitor), TTFB na necachovaných URL, čas admin operácií. Vo väčšine admin-heavy projektov vidím reálny pokles počtu DB dotazov aj TTFB, ale číslo si over na svojom webe, nie z blogu.

## Zhrnutie

Redis object cache je skvelý nástroj na správnom mieste: dynamické, admin-heavy a WooCommerce weby, kde page cache nepomáha. Na statickom blogu je to riešenie problému, ktorý nemáš. Nasadenie je priamočiare — bežiaci Redis, PhpRedis rozšírenie, pár konštánt v `wp-config.php`, plugin, igbinary a `WP_CACHE_KEY_SALT`. A hlavne: over funkčnosť cez `wp redis status` a zmeraj efekt, nespoliehaj sa na zelenú fajku v Site Health. Ak ťa zaujíma širší obraz výkonu WordPressu, pozri aj [WP-CLI príkazy, ktoré ušetria hodiny](/blog/wp-cli-12-prikazov/) a [plugin diétu z 28 na 9](/blog/plugin-dieta-z-28-na-9/).
