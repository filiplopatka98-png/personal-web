---
title: "WooCommerce vs Shopify pre malý SK eshop: pravdivé porovnanie"
date: 2026-04-02
read: 8
tags: ["WooCommerce", "WordPress"]
excerpt: "5 dimenzií porovnania na 3-ročnom horizonte pre malý SK eshop. TCO, customizácia, lokalizácia, payment gates, exit cost. Plus jasné odporúčanie kedy ktorá."
featured: false
---

"Filip, robíme malý eshop, ideme na Shopify alebo WooCommerce?" — minimum raz mesačne. Reálna odpoveď je "závisí", ale za poslednými 3 rokmi mám dostatok dát, aby som ti vedel povedať konkrétne kedy vyhráva čo.

Toto NIE je clickbait porovnanie. Konkrétne čísla, konkrétne use cases, žiadny PR.

## Dimenzia 1: TCO na 3 roky

Klient = malý SK eshop, 200-300 produktov, traffic 30k unique/mesiac, obrat €100-300k/rok.

### Shopify Basic

| Položka | €/mesiac | €/3 roky |
|---|---|---|
| Shopify Basic plan | 29 | 1 044 |
| Slovak / multi-currency apps | 15 | 540 |
| Email marketing app (Klaviyo Lite) | 0–25 | 0–900 |
| Reviews app (Loox) | 10 | 360 |
| Dôležité: per-transaction fee 2% (ak nepoužívaš Shopify Payments — a v SK nie je dostupné) | ~150 | 5 400 |
| **Total 3 roky** | | **€7 244 – €8 244** |

### WooCommerce + WordPress

| Položka | €/jednorázovo | €/rok | €/3 roky |
|---|---|---|---|
| Hosting (Webglobe / WPEngine starter) | — | 120 | 360 |
| Theme (Astra Pro / Blocksy) | — | 49 | 147 |
| Stripe / GoPay (transakčné fees ~1.4%) | — | 0 | 0 |
| Premium pluginy (ACF Pro, WP Rocket, Yoast Premium) | 200 | 200 | 800 |
| **Total 3 roky** | | | **~€1 300** |

Plus payment fees: WooCommerce s GoPay ~1.4% vs Shopify ~2% (s extra 2% transaction fee navrch ak nepoužívaš Shopify Payments). Pri obrate €200k/rok je to dodatočných **€2 400/rok pre Shopify**.

**Reálny rozdiel za 3 roky: ~€10-13k.**

Shopify zarobí **rýchlosťou setupu** a **out-of-the-box features**. Tie € rozdiely musíš vyvážiť.

## Dimenzia 2: Customizácia

### Shopify

Frontend = Liquid templating. Limitovaný. Pre 90% use cases stačí, ale ak chceš:
- product page s custom kalkulačkou ceny podľa parametrov
- registration flow s 4-krokovým onboarding-om
- backend logiku ktorá manipuluje order pred zaplatením

Musíš ísť cez Shopify Functions / Apps, ktoré buď platíš mesačne, alebo si kódeš sám v Node.js. Nie je to non-zero effort.

Theme customizácia je friendly, ale **theme settings limity** sú reálne. Ak chceš extra option, musíš editovať Liquid (čo Shopify v admin UI ledva podporuje).

### WooCommerce

PHP, hooks, filters. Pre dev-a, ktorý vie WP, je všetko otvorené. Príklad: chceš pridať per-produkt option "vyžaduje schválenie pred odoslaním":

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

Sloboda má cenu — môžeš si zlomiť všetko. Disciplína a child theme sú nutnosť.

**Verdikt customizácie:** Woo > Shopify pre tímy s vlastným dev-om. Shopify > Woo pre tímy bez dev-a.

## Dimenzia 3: Lokalizácia SK/CZ

Toto je **kde Shopify reálne pokuľháva** v našom regióne.

### Shopify

- Slovenský preklad admin UI: existuje, ale v niektorých sekciách neúplný (Reports, Analytics ostávajú anglické).
- Multi-language storefront: cez Shopify Markets (basic free) + Translate & Adapt app. Funguje, ale "krásne SEO" pre `/sk/` a `/cz/` na cudzích doménach žiada Shopify Plus (€2 300/mesiac, lol).
- DPH compliance: SK 23% / CZ 21%. Shopify rieši tax rates per country, ale invoice formát neslovak (žiadny IČO, žiadne IČ DPH okrem manuálneho add).
- Účtovné napojenia (Pohoda, MoneyS3, iDoklad): cez 3rd-party apps, lightweight, často nedotiahnuté.

### WooCommerce

- Slovenský preklad WP + Woo: 100%, dlhodobo udržiavaný.
- Multi-language: WPML alebo Polylang. Stable, dobre integrované s Woo.
- DPH: pluginy ako [WooCommerce Slovakia](https://wordpress.org/plugins/woocommerce-slovakia/) priamo riešia IČO/IČ DPH/DIČ na invoice, formát faktúr SK štandard.
- Účtovné napojenia: priame integrácie s Pohoda mServer, MoneyS3 plugins.

**Verdikt lokalizácie:** WooCommerce vyhráva výrazne pre SK/CZ trh.

## Dimenzia 4: Payment gates

### Shopify

V SK **nemáš Shopify Payments**. Musíš cez third-party gateway, ktorý znamená +2% per-transaction fee od Shopify navyše. Dostupné brány cez Shopify:

- Stripe — funkčné, OK
- GoPay — cez nestandard plugin, kvalita kolísavá
- Tatra Banka — historicky problematické, dnes lepšie ale stále hacky

Prakticky: musíš platiť +2% fee navrch na všetko.

### WooCommerce

GoPay, ComGate, Tatra eCard, Stripe, PayPal — všetko **oficiálne pluginy**, kvalita rôzna ale funkčná. Žiadne extra fees navrch. Setup obvykle 30 minút.

```bash
# napr. GoPay official plugin
wp plugin install gopay-woocommerce-payment-gateway --activate
# config v Woo → Settings → Payments
```

**Verdikt payment:** WooCommerce výrazne lepšie pre SK trh.

## Dimenzia 5: Exit cost — čo keď zrušíš

### Shopify

Tvoj content (produkty, objednávky, customers) si vyexportuješ ako CSV. **Tvoj theme a customizácie ostanú v Shopify** — Liquid templates nepoužiješ inde. Apps subscriptions zrušíš, ale data, ktoré v nich máš, často zostanú za paywallom.

Migrácia preč zo Shopify = full rebuild storefront a re-implement integrations. ~80-160 dev hodín pre stredný eshop.

### WooCommerce

Si na vlastnom hostingu. Database je tvoja. Theme files sú tvoje. Zoberieš celý `wp-content/` adresár + DB dump a presunieš na iný hosting. Migrácia = ~4 hodiny.

Ak chceš ísť preč z WP úplne (povedzme na Medusa.js), CSV export funguje rovnako ako pri Shopify. Custom theme code prerobíš, ale **storefront content si stále vlastníš**.

**Verdikt exit:** WooCommerce výrazne lepšie. Shopify je vendor lock.

## Kedy odporučím Shopify

- **Founder bez dev tímu**, technicky neorientovaný, rozpočet €5-10k na rok.
- Potreba **rýchleho launch** (2-3 týždne), nie obyčajná robustnosť.
- Cieľ globálny trh kde Shopify Markets dáva zmysel (USA, UK, EU mix).
- Predikovateľný stack — netrebuješ exotické integrácie.
- Catalog < 200 produktov, žiadne customer-specific pricing.

## Kedy odporučím WooCommerce

- **Cieľ SK/CZ trh** s Pohoda/MoneyS3 účtovníctvom.
- Potreba **vlastníctvo dát** a možnosť exit kedykoľvek.
- **Customizácia** za hranice "produktové stránky a checkout".
- B2B prvky — per-customer pricing, role-based catalog, quote requests.
- Multi-language storefront s SEO-strong každým jazykom.
- Máš dev-a alebo agentúru, ktorá WP pozná.

## Pre ktorý sa rozhodne väčšina mojich klientov

Za posledné 2 roky som setupoval ~14 SK eshopov. **WooCommerce 11×, Shopify 3×**. Tri shopify projekty boli: 1) US-based founder so SK pobočkou, 2) start-up s 6-týždňovým launch deadline, 3) klient, ktorý chcel **najmenej** technického zápasu (a akceptoval +€2.5k ročne).

## TL;DR

Pre malý SK eshop s rozpočtom Woo vyhráva 3-ročný TCO o ~€10k, lokalizácia SK/CZ, payment gates a exit cost. Shopify vyhráva rýchlosťou setupu, polished UX a maintenance. Odporúčaj Shopify, len ak founder explicitne nemá dev support a chce platiť za pohodlie. Inak Woo.
