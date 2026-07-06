---
title: "WooCommerce vs Shopify pre malý SK eshop: pravdivé porovnanie"
date: 2026-04-02
read: 8
tags: ["WooCommerce", "WordPress"]
excerpt: "Porovnanie v 5 dimenziách na 3-ročnom horizonte pre malý SK eshop: TCO, customizácia, lokalizácia, platobné brány a exit cost. Plus jasné odporúčanie, kedy siahnuť po ktorej platforme."
featured: false
---

„Filip, robíme malý eshop, ideme na Shopify alebo WooCommerce?" — túto otázku dostanem minimálne raz mesačne. Reálna odpoveď je „závisí", ale za posledné 3 roky mám dosť dát na to, aby som ti vedel povedať konkrétne, kedy vyhráva čo.

Toto NIE je clickbaitové porovnanie. Konkrétne čísla, konkrétne use cases, žiadny PR.

## Dimenzia 1: TCO na 3 roky

Klient = malý SK eshop, 200 – 300 produktov, návštevnosť 30k unikátov mesačne, obrat 100 – 300 tis. EUR/rok.

### Shopify Basic

| Položka | EUR/mesiac | EUR/3 roky |
|---|---|---|
| Shopify Basic plan | 29 | 1 044 |
| Slovak / multi-currency appky | 15 | 540 |
| Email marketing app (Klaviyo Lite) | 0 – 25 | 0 – 900 |
| Reviews app (Loox) | 10 | 360 |
| Dôležité: transakčný poplatok 2 % (ak nepoužívaš Shopify Payments — a v SK nie je dostupné) | ~150 | 5 400 |
| **Spolu za 3 roky** | | **7 244 – 8 244 EUR** |

### WooCommerce + WordPress

| Položka | EUR/jednorazovo | EUR/rok | EUR/3 roky |
|---|---|---|---|
| Hosting (Webglobe / WP Engine starter) | — | 120 | 360 |
| Šablóna (Astra Pro / Blocksy) | — | 49 | 147 |
| Stripe / GoPay (transakčné poplatky ~1,4 %) | — | 0 | 0 |
| Prémiové pluginy (ACF Pro, WP Rocket, Yoast Premium) | 200 | 200 | 800 |
| **Spolu za 3 roky** | | | **~1 300 EUR** |

Plus platobné poplatky: WooCommerce s GoPay ~1,4 % vs Shopify ~2 % (s ďalšími 2 % transakčného poplatku navrch, ak nepoužívaš Shopify Payments). Pri obrate 200 tis. EUR/rok je to dodatočných **2 400 EUR/rok pre Shopify**.

**Reálny rozdiel za 3 roky: ~10 – 13 tis. EUR.**

Shopify si to vynahradí **rýchlosťou setupu** a **funkciami z krabice**. Tie eurové rozdiely musíš vyvážiť.

## Dimenzia 2: Customizácia

### Shopify

Frontend = šablónovací jazyk Liquid. Limitovaný. Pre 90 % use cases stačí, ale ak chceš:
- produktovú stránku s vlastnou kalkulačkou ceny podľa parametrov,
- registračný flow so 4-krokovým onboardingom,
- backendovú logiku, ktorá manipuluje s objednávkou pred zaplatením,

musíš ísť cez Shopify Functions / appky, ktoré buď platíš mesačne, alebo si ich nakódiš sám v Node.js. Nie je to nulová námaha.

Customizácia šablóny je príjemná, ale **limity nastavení šablóny** sú reálne. Ak chceš extra možnosť, musíš editovať Liquid (čo Shopify v admin UI podporuje len ledva).

### WooCommerce

PHP, hooks, filters. Pre vývojára, ktorý pozná WordPress, je otvorené všetko. Príklad: chceš pridať k produktu možnosť „vyžaduje schválenie pred odoslaním":

```php
// functions.php — 5 minút práce
add_action('woocommerce_thankyou', function($order_id) {
    $order = wc_get_order($order_id);
    foreach ($order->get_items() as $item) {
        $product = $item->get_product();
        if ($product->get_meta('requires_approval') === 'yes') {
            $order->update_status('on-hold', 'Čaká na schválenie produktu');
            wp_mail('admin@firma.sk', 'Nová objednávka na schválenie', "Order #{$order_id}");
            return;
        }
    }
});
```

Sloboda má cenu — môžeš si rozbiť všetko. Disciplína a child theme sú nutnosť.

**Verdikt customizácie:** Woo > Shopify pre tímy s vlastným vývojárom. Shopify > Woo pre tímy bez vývojára.

## Dimenzia 3: Lokalizácia SK/CZ

Toto je oblasť, **kde Shopify v našom regióne reálne pokuľháva**.

### Shopify

- Slovenský preklad admin UI: existuje, ale v niektorých sekciách je neúplný (Reports a Analytics ostávajú v angličtine).
- Viacjazyčný storefront: cez Shopify Markets (základ zadarmo) + appku Translate & Adapt. Funguje, ale „krásne SEO" pre `/sk/` a `/cz/` na samostatných doménach žiada Shopify Plus (2 300 USD/mesiac, lol).
- DPH compliance: SK 23 % / CZ 21 %. Shopify rieši sadzby dane podľa krajiny, ale formát faktúry nie je slovenský (žiadne IČO, žiadne IČ DPH okrem manuálneho doplnenia).
- Účtovné napojenia (Pohoda, MoneyS3, iDoklad): cez appky tretích strán, odľahčené, často nedotiahnuté.

### WooCommerce

- Slovenský preklad WordPressu + Woo: 100 %, dlhodobo udržiavaný.
- Viacjazyčnosť: WPML alebo Polylang. Stabilné, dobre integrované s Woo.
- DPH: pluginy ako [Kybernaut IČO DIČ](https://wordpress.org/plugins/woolab-ic-dic/) priamo riešia IČO/IČ DPH/DIČ na faktúre a overujú ich cez ARES/VIES, formát faktúr podľa SK štandardu.
- Účtovné napojenia: priame integrácie s Pohoda mServer, pluginy pre MoneyS3. Ako to celé nastaviť vrátane skladu a dopravy rozpisujem v článku [WooCommerce + Pohoda + MoneyS3](/blog/doprava-sklad-pohoda/).

**Verdikt lokalizácie:** WooCommerce vyhráva výrazne pre SK/CZ trh.

## Dimenzia 4: Platobné brány

### Shopify

V SK **nemáš Shopify Payments**. Musíš ísť cez bránu tretej strany, čo znamená +2 % transakčného poplatku od Shopify navyše. Dostupné brány cez Shopify:

- Stripe — funkčné, OK.
- GoPay — cez neštandardný plugin, kolísavá kvalita.
- Tatra banka — historicky problematické, dnes lepšie, ale stále to skrípe.

Prakticky: musíš platiť +2 % poplatku navrch na všetko.

### WooCommerce

GoPay, ComGate, Tatra eCard, Stripe, PayPal — všetko **oficiálne pluginy**, kvalita rôzna, ale funkčné. Žiadne poplatky navrch. Setup zvyčajne 30 minút. Podrobné porovnanie brán nájdeš v [slovenských platobných bránach v 2026](/blog/sk-platobne-brany-2026/).

```bash
# napr. oficiálny GoPay plugin
wp plugin install gopay-gateway --activate
# konfigurácia vo Woo → Settings → Payments
```

**Verdikt platieb:** WooCommerce výrazne lepšie pre SK trh.

## Dimenzia 5: Exit cost — čo keď skončíš

### Shopify

Svoj obsah (produkty, objednávky, zákazníkov) si vyexportuješ ako CSV. **Tvoja šablóna a customizácie ostanú v Shopify** — Liquid šablóny inde nepoužiješ. Predplatné appiek zrušíš, ale dáta, ktoré v nich máš, často zostanú za paywallom.

Migrácia preč zo Shopify = kompletný rebuild storefrontu a re-implementácia integrácií. ~80 – 160 vývojárskych hodín pre stredný eshop.

### WooCommerce

Si na vlastnom hostingu. Databáza je tvoja. Súbory šablóny sú tvoje. Zoberieš celý adresár `wp-content/` + dump databázy a presunieš na iný hosting. Migrácia = ~4 hodiny.

Ak chceš ísť preč z WordPressu úplne (povedzme na Medusa.js), CSV export funguje rovnako ako pri Shopify. Vlastný kód šablóny prerobíš, ale **obsah storefrontu stále vlastníš**.

**Verdikt exitu:** WooCommerce výrazne lepšie. Shopify je vendor lock-in.

## Kedy odporučím Shopify

- **Founder bez dev tímu**, technicky neorientovaný, s rozpočtom 5 – 10 tis. EUR na rok.
- Potreba **rýchleho launchu** (2 – 3 týždne), nie robustnosti za každú cenu.
- Cieľom je globálny trh, kde Shopify Markets dáva zmysel (USA, UK, mix EU).
- Predvídateľný stack — nepotrebuješ exotické integrácie.
- Katalóg < 200 produktov, žiadny cenník na mieru zákazníka.

## Kedy odporučím WooCommerce

- **Cieľom je SK/CZ trh** s účtovníctvom v Pohode/MoneyS3.
- Potreba **vlastníctva dát** a možnosti odísť kedykoľvek.
- **Customizácia** za hranice „produktové stránky a checkout".
- B2B prvky — cenník na zákazníka, katalóg podľa rolí, dopyty na cenovú ponuku.
- Viacjazyčný storefront so silným SEO v každom jazyku.
- Máš vývojára alebo agentúru, ktorá WordPress pozná.

## Pre ktorú platformu sa rozhodne väčšina mojich klientov

Za posledné 2 roky som nasadil ~14 SK eshopov. **WooCommerce 11×, Shopify 3×.** Tie tri Shopify projekty boli: 1) founder z USA so slovenskou pobočkou, 2) startup so 6-týždňovým launch deadlinom, 3) klient, ktorý chcel **čo najmenej** technického zápasu (a akceptoval +2,5 tis. EUR ročne).

## TL;DR

Pre malý SK eshop s rozpočtom Woo vyhráva 3-ročné TCO o ~10 tis. EUR, plus lokalizáciu SK/CZ, platobné brány a exit cost. Shopify vyhráva rýchlosťou setupu, uhladeným UX a údržbou. Odporúčaj Shopify len vtedy, ak founder explicitne nemá dev support a chce si priplatiť za pohodlie. Inak Woo.

Súvisiace: [WooCommerce checkout, ktorý konvertuje](/blog/checkout-konvertuje-9-uprav/).
