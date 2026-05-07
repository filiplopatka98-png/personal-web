---
title: "Slovenské platobné brány v 2026: GoPay, Stripe, Tatra Banka, ComGate"
date: 2026-04-22
read: 7
tags: ["WooCommerce", "Process"]
excerpt: "Porovnanie 4 platobných brán pre malý SK eshop. Poplatky, integrácia, payout speed, sandbox UX, refund flow. Konkrétne čísla a kedy ktorá vyhráva."
featured: false
---

Klient pred dvomi mesiacmi: "platobnú bránu sme vyberali deň, lebo všetky weby pre porovnanie boli copy-paste marketing texty". Fér problém. Tu je porovnanie štyroch hlavných hráčov pre **malý/stredný SK eshop** — z pohľadu dev-a, ktorý ich integroval všetky.

Porovnávacie kritériá:
1. Poplatky (transakčné %, mesačné fees)
2. Integračná zložitosť (oficiálny WooCommerce plugin? quality?)
3. Payout speed
4. Sandbox / testing UX
5. Refund flow

## GoPay

Český hráč, dlhoročne dominantný v SK a CZ.

**Poplatky:**
- Mesačný fee: €0
- Transakčný fee: 1.4% + €0.10 (karty), 0.6% (Apple Pay / Google Pay), 0.8% (bank transfer)
- Setup fee: €0
- Refund fee: €0

**WooCommerce integrácia:**
- Oficiálny plugin: [GoPay Payment Gateway for WooCommerce](https://www.gopay.com/sk/integrations) — kvalita slušná, aktualizovaný kvartálne. Inštalácia: zoolla goid, secret, prepínač sandbox/produkcia. ~20 minút.

```bash
wp plugin install gopay-payment-gateway-for-woocommerce --activate
```

**Payout speed:** T+3 (3 working days). Toto je pomalšie ako konkurencia, môže byť cash-flow problém pre nový eshop.

**Sandbox:**
GoPay má separátny sandbox account (`gw.sandbox.gopay.com`). Test cards (4444 4400 0000 0007 atď.) fungujú. UX dashboardu je staršia, hľadanie testovacích cards stále vraciam k FAQ-ke.

**Refund flow:**
Z Woo admin → Order → Refund tlačí refund cez GoPay API. Funguje, ale **partial refunds** majú occasional bug, kde nesedí amount na haliere. Pri full refund-e bezproblémové.

**Kedy GoPay vyhráva:** český / slovenský klient, ktorý chce český support v jazyku, low-volume eshop kde T+3 nie je problém, žiadny mesačný fee.

## Stripe

Globálny hráč, v EU dostupný plnohodnotne. V SK funguje od roku 2023.

**Poplatky:**
- Mesačný fee: €0
- Transakčný fee: 1.4% + €0.25 (EU karty), 2.9% + €0.25 (non-EU), 0.8% (SEPA Direct Debit)
- Setup fee: €0
- Apple Pay / Google Pay: rovnaký ako karty

**WooCommerce integrácia:**
[Stripe official plugin](https://wordpress.org/plugins/woocommerce-gateway-stripe/) — najlepšie napísaný plugin z trojice. Maintainery sú aktívni, support je solid. Webhook setup je intuitívny:

```php
// .env style config v wp-config.php
define('STRIPE_PUBLISHABLE_KEY', 'pk_live_...');
define('STRIPE_SECRET_KEY', 'sk_live_...');
define('STRIPE_WEBHOOK_SECRET', 'whsec_...');
```

**Payout speed:** T+1 (next business day) po prvých pár transakciách (počiatočné T+7 anti-fraud). Najrýchlejší v zostave.

**Sandbox:**
Stripe Test Mode je **kingom v zostave**. Toggle v dashboarde, žiadny separátny account. Test cards (4242 4242 4242 4242 + variations pre 3DS, declines, partial refunds) sú dokumentované perfektne. CLI tool `stripe listen` lokálne testuje webhooks.

```bash
stripe login
stripe listen --forward-to localhost:8000/wc-api/wc_stripe
stripe trigger payment_intent.succeeded
```

**Refund flow:**
Bezchybný. Z Woo admin partial / full refund, Stripe ho processuje promptne. Disputes / chargebacks sú vidieť v Stripe dashboarde s celým paper-trail-om.

**Kedy Stripe vyhráva:** moderný stack, dev-friendly tím, potreba T+1 payout, zákazníci aj z EU mimo SK/CZ. Stripe je defaultná moja voľba.

## Tatra Banka eCard

Tradičný SK hráč. Banka ti pripraví merchant account.

**Poplatky:**
- Mesačný fee: ~€15/mesiac (závisí od balíčka)
- Transakčný fee: 1.2% (najnižšie v zostave, ak rátaš pri vysokom obrate)
- Setup fee: ~€100 (vyjednateľné)
- Refund fee: €0

**WooCommerce integrácia:**
Oficiálny plugin TatraPay je **v stave údržby na minimálnej úrovni**. Funguje, ale UI sa od 2018 nezmenilo. Setup: musíš požiadať banku o test account (čaká sa cca týždeň), získaš certificate file, integruješ cez API config.

```php
// kód z TatraPay pluginu — older patterns
define('TATRAPAY_MID', '12345');
define('TATRAPAY_PRIVATE_KEY_PATH', '/etc/tatrapay/private.pem');
```

Nie je dev-friendly. Plus: integrácia trvá viac ako den, lebo bank certificate flow nie je triviálny.

**Payout speed:** T+1 alebo T+2, závisí od dohody s bankou. Zvyčajne dobrý.

**Sandbox:**
Banka ti dá test endpoint a test card numbers. UX je 2010-style. Funguje, ale nie nadšenie.

**Refund flow:**
Rieši sa cez banku (napríklad Internet banking → refund request). NIE z Woo admin priamo. Pre eshop manažérky neintuitívne.

**Kedy Tatra eCard vyhráva:** klient s **vysokým obrate (>€500k/rok)**, ktorému 1.2% fee outweighs €180/rok mesačné fees. Plus klient, ktorý už má Tatra Banka biznisový účet a chce single-vendor relationship. Pre malé eshopy zbytočne komplikované.

## ComGate

Český hráč rastúci rýchlo, populárny v SK od 2020.

**Poplatky:**
- Mesačný fee: €0
- Transakčný fee: 1.39% + €0.07 (karty)
- Setup fee: €0
- Refund fee: €0

**WooCommerce integrácia:**
[ComGate plugin](https://help.comgate.cz/) — slušne udržiavaný, setup ~25 minút. Dashboard má pekné stats a real-time transactions view.

**Payout speed:** T+1 (next working day). Konkurenčné s Stripe.

**Sandbox:**
Test merchant account na vyžiadanie cez support. UX dashboardu je príjemné, test cards dokumentované jasne.

**Refund flow:**
Z Woo admin priamo, bez problémov. Vzorovo refundované do 24h.

**Kedy ComGate vyhráva:** český klient, ktorý chce konkurencu GoPay s rýchlejším payout-om a lepším dashboard-om. SK klient, ktorý chce nízke fees + T+1 payout bez Stripe (napr. preferencia local SK/CZ provider).

## Tabuľka — sumarizácia

| | GoPay | Stripe | Tatra eCard | ComGate |
|---|---|---|---|---|
| Mesačný fee | €0 | €0 | €15 | €0 |
| Transakčný fee | 1.4% + €0.10 | 1.4% + €0.25 | 1.2% | 1.39% + €0.07 |
| Setup fee | €0 | €0 | ~€100 | €0 |
| Payout speed | T+3 | T+1 | T+1 / T+2 | T+1 |
| Plugin kvalita | Slušná | Excellent | Vintage | Slušná |
| Sandbox UX | OK | Excellent | Vintage | OK |
| Refund cez Woo admin | Áno (partial bug) | Áno | Nie | Áno |

## Reálne odporúčanie

- **Default voľba:** Stripe. Najlepšie tooling, T+1, najľahšia developerská skúsenosť. Fees mierne vyššie ale value je tam.
- **Lokálni klienti, ktorí chcú česky/slovensky support:** ComGate alebo GoPay. ComGate má rýchlejší payout, GoPay viac zaužívaný.
- **High-volume eshop (€500k+/rok), Tatra Banka customer:** Tatra eCard zarobí na 1.2% fees aj s €180/rok mesačnými fees.
- **Combo:** Stripe (default) + GoPay (pre tých, ktorí preferujú "local" gateway). Woo to umožňuje natívne — user vyberá pri checkoute.

## Slabé miesta, ktoré nikto nehovorí

- **3DS Secure 2.0** je všetky 4 podporujú, ale customer experience je rôzna. Stripe má najmenej friction (Apple Pay / Google Pay obchádza 3DS), Tatra najviac.
- **Recurring payments / subscriptions** — Stripe je king. GoPay/ComGate majú subscription support, ale UX je horší. Tatra eCard subscriptions nepodporuje.
- **Multi-currency** — Stripe podporuje 135+ mien natívne. Ostatné troje primarily EUR/CZK.
- **Compliance docs** (PCI DSS, SOC 2) — Stripe má najlepšie verejné dokumenty. Pre B2B partnerov to môže byť decision factor.

## TL;DR

Pre default voľbu Stripe (T+1, dev-friendly, globálny). Pre slovensky/česky support GoPay alebo ComGate (ComGate má rýchlejší payout). Tatra eCard len pri high-volume eshopu s existujúcim Tatra Banka vzťahom. Vyhni sa porovnávaniam podľa marketingových stránok — testuj sandbox 1 deň, zistíš oveľa viac.
