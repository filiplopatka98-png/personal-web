---
title: "Slovenské platobné brány v 2026: GoPay, Stripe, Tatra Banka, ComGate"
date: 2026-04-22
read: 7
tags: ["WooCommerce", "Process"]
excerpt: "Porovnanie štyroch platobných brán pre malý slovenský eshop. Poplatky, integrácia, rýchlosť výplat, sandbox a refundy — konkrétne čísla a kedy ktorá vyhráva."
featured: false
---

Klient pred dvomi mesiacmi: „platobnú bránu sme vyberali celý deň, lebo všetky porovnávacie weby boli len copy-paste marketingové texty“. Férová výhrada. Tu je porovnanie štyroch hlavných hráčov pre **malý až stredný slovenský eshop** — z pohľadu vývojára, ktorý ich integroval všetky.

Porovnávacie kritériá:
1. Poplatky (transakčné %, mesačné poplatky)
2. Náročnosť integrácie (existuje oficiálny WooCommerce plugin? aká je jeho kvalita?)
3. Rýchlosť výplat (payout)
4. Sandbox a testovanie
5. Priebeh refundov

## GoPay

Český hráč, dlhoročne dominantný v SR aj ČR.

**Poplatky:**
- Mesačný poplatok: €0
- Transakčný poplatok: 1,4 % + €0.10 (karty), 0,6 % (Apple Pay / Google Pay), 0,8 % (bankový prevod)
- Zriaďovací poplatok: €0
- Poplatok za refund: €0

**WooCommerce integrácia:**
- Oficiálny plugin: [GoPay Payment Gateway for WooCommerce](https://www.gopay.com/sk/integrations) — kvalita slušná, aktualizovaný kvartálne. Inštalácia: zadáš goid, secret, prepneš sandbox/produkcia. Cca 20 minút.

```bash
wp plugin install gopay-payment-gateway-for-woocommerce --activate
```

**Rýchlosť výplat:** T+3 (3 pracovné dni). Je to pomalšie ako konkurencia — pre nový eshop to môže byť problém s cash flow.

**Sandbox:**
GoPay má samostatný sandboxový účet (`gw.sandbox.gopay.com`). Testovacie karty (4444 4400 0000 0007 a podobne) fungujú. UX dashboardu je staršie, pri hľadaní testovacích kariet sa stále vraciam k FAQ.

**Priebeh refundov:**
Z Woo adminu cez Objednávka → Refundovať to spustí refund cez GoPay API. Funguje, ale **čiastočné refundy** majú občasnú chybu, kde suma nesedí na centy. Pri plnom refunde to je bez problémov.

**Kedy GoPay vyhráva:** český alebo slovenský klient, ktorý chce podporu v rodnom jazyku; eshop s nižším obratom, kde T+3 nevadí; žiadny mesačný poplatok.

## Stripe

Globálny hráč, v EÚ plnohodnotne dostupný. Na Slovensku funguje od roku 2019.

**Poplatky:**
- Mesačný poplatok: €0
- Transakčný poplatok: 1,5 % + €0.25 (karty z EHP), 3,25 % + €0.25 (karty mimo EHP), 0,8 % + €0.30 so stropom €6 (SEPA Direct Debit)
- Zriaďovací poplatok: €0
- Apple Pay / Google Pay: rovnaké ako karty

**WooCommerce integrácia:**
[Oficiálny Stripe plugin](https://wordpress.org/plugins/woocommerce-gateway-stripe/) — najlepšie napísaný plugin z celej zostavy. Vývojári sú aktívni, podpora spoľahlivá. Nastavenie webhookov je intuitívne:

```php
// .env style config v wp-config.php
define('STRIPE_PUBLISHABLE_KEY', 'pk_live_...');
define('STRIPE_SECRET_KEY', 'sk_live_...');
define('STRIPE_WEBHOOK_SECRET', 'whsec_...');
```

**Rýchlosť výplat:** štandardne T+2 (rolujúci payout, dva pracovné dni po zúčtovaní), pričom prvá výplata príde 7 až 14 dní po prvej transakcii (počiatočná anti-fraud lehota). Aj tak patrí medzi najrýchlejšie v zostave.

**Sandbox:**
Stripe Test Mode je **kráľom zostavy**. Prepínač priamo v dashboarde, žiadny samostatný účet. Testovacie karty (4242 4242 4242 4242 a varianty pre 3DS, zamietnutia či čiastočné refundy) sú dokonale zdokumentované. CLI nástroj `stripe listen` testuje webhooky lokálne.

```bash
stripe login
stripe listen --forward-to localhost:8000/wc-api/wc_stripe
stripe trigger payment_intent.succeeded
```

**Priebeh refundov:**
Bezchybný. Čiastočný aj plný refund priamo z Woo adminu, Stripe ho spracuje promptne. Spory a chargebacky sú v Stripe dashboarde vidieť s kompletnou históriou.

**Kedy Stripe vyhráva:** moderný stack, tím zvyknutý na vývojárske nástroje, potreba rýchlych výplat, zákazníci aj z EÚ mimo SR/ČR. Stripe je moja predvolená voľba.

## Tatra banka CardPay

Tradičný slovenský hráč. Banka ti zriadi merchantský účet.

**Poplatky:**
- Mesačný poplatok: ~€15/mesiac (závisí od balíčka)
- Transakčný poplatok: 1,2 % (najnižší v zostave, ak rátaš s vysokým obratom)
- Zriaďovací poplatok: ~€100 (vyjednateľný)
- Poplatok za refund: €0

**WooCommerce integrácia:**
Oficiálny modul CardPay funguje, ale integrácia je zdĺhavá. Setup: musíš požiadať banku o testovací účet (čaká sa cca týždeň), získaš certifikát a integruješ cez API konfiguráciu.

```php
// konfigurácia CardPay — staršie vzory
define('CARDPAY_MID', '12345');
define('CARDPAY_PRIVATE_KEY_PATH', '/etc/cardpay/private.pem');
```

Nie je to zamerané na vývojárov. Navyše integrácia trvá viac ako deň, lebo tok s bankovým certifikátom nie je triviálny.

**Rýchlosť výplat:** T+1 alebo T+2, závisí od dohody s bankou. Zvyčajne v poriadku.

**Sandbox:**
Banka ti dá testovací endpoint a čísla testovacích kariet. UX je v štýle roku 2010. Funguje, ale žiadna sláva.

**Priebeh refundov:**
Historicky sa refundy riešili cez banku (napríklad Internet banking → žiadosť o refund), nie priamo z Woo adminu, čo bolo pre správkyne eshopov neintuitívne. (Novšie moduly už refund z Woo adminu podporujú — over si aktuálnu verziu.)

**Kedy CardPay vyhráva:** klient s **vysokým obratom (nad €500k/rok)**, ktorému nižšia sadzba 1,2 % vyváži ~€180/rok na mesačných poplatkoch. Plus klient, ktorý už má v Tatra banke firemný účet a chce jedného dodávateľa. Pre malé eshopy zbytočne komplikované.

## ComGate

Český hráč, ktorý rýchlo rastie a od roku 2020 je populárny aj na Slovensku.

**Poplatky:**
- Mesačný poplatok: €0
- Transakčný poplatok: 1,39 % + €0.07 (karty)
- Zriaďovací poplatok: €0
- Poplatok za refund: €0

**WooCommerce integrácia:**
[ComGate plugin](https://help.comgate.cz/) — slušne udržiavaný, setup cca 25 minút. Dashboard má pekné štatistiky a prehľad transakcií v reálnom čase.

**Rýchlosť výplat:** T+1 (nasledujúci pracovný deň). Konkurencieschopné so Stripe.

**Sandbox:**
Testovací merchantský účet na vyžiadanie cez podporu. UX dashboardu je príjemné, testovacie karty sú zdokumentované jasne.

**Priebeh refundov:**
Priamo z Woo adminu, bez problémov. Refund prebehne vzorovo do 24 hodín.

**Kedy ComGate vyhráva:** český klient, ktorý chce konkurenciu GoPay s rýchlejšou výplatou a lepším dashboardom. Slovenský klient, ktorý chce nízke poplatky a výplatu T+1 bez Stripe (napr. preferencia lokálneho SK/CZ poskytovateľa).

## Tabuľka — zhrnutie

| | GoPay | Stripe | Tatra CardPay | ComGate |
|---|---|---|---|---|
| Mesačný poplatok | €0 | €0 | €15 | €0 |
| Transakčný poplatok | 1,4 % + €0.10 | 1,5 % + €0.25 | 1,2 % | 1,39 % + €0.07 |
| Zriaďovací poplatok | €0 | €0 | ~€100 | €0 |
| Rýchlosť výplat | T+3 | T+2 | T+1 / T+2 | T+1 |
| Kvalita pluginu | Slušná | Výborná | Zastaraná | Slušná |
| Sandbox | OK | Výborný | Zastaraný | OK |
| Refund cez Woo admin | Áno (chyba pri čiastočných) | Áno | Skôr nie (starší modul) | Áno |

## Reálne odporúčanie

- **Predvolená voľba:** Stripe. Najlepšie nástroje, rýchle výplaty, najľahšia vývojárska skúsenosť. Poplatky sú mierne vyššie, ale hodnotu za ne dostaneš.
- **Lokálni klienti, ktorí chcú podporu po slovensky/česky:** ComGate alebo GoPay. ComGate má rýchlejšiu výplatu, GoPay je zaužívanejší.
- **Eshop s vysokým obratom (nad €500k/rok) a účtom v Tatra banke:** CardPay sa vyplatí, sadzba 1,2 % pokryje aj ~€180/rok na mesačných poplatkoch.
- **Kombinácia:** Stripe (predvolený) + GoPay (pre tých, čo preferujú „lokálnu“ bránu). Woo to umožňuje natívne — zákazník si vyberá pri pokladni.

## Slabé miesta, o ktorých sa nehovorí

- **3D Secure 2** podporujú všetky štyri, ale zákaznícky zážitok sa líši. Stripe má najmenej trenia (Apple Pay a Google Pay spĺňajú SCA cez overenie priamo v zariadení, takže klasickú 3DS výzvu zvyčajne preskočíš), Tatra najviac.
- **Opakované platby / predplatné** — Stripe je kráľ. GoPay a ComGate predplatné zvládajú tiež, ale UX je horšie. CardPay opakované platby priamo nemá, rieši ich cez nadstavbu ComfortPay.
- **Viacero mien** — Stripe natívne podporuje 135+ mien. Ostatné tri primárne EUR/CZK.
- **Dokumenty o zhode** (PCI DSS, SOC 2) — Stripe má najlepšie verejne dostupné dokumenty. Pre B2B partnerov to môže byť rozhodujúci faktor.

## TL;DR

Ako predvolenú voľbu ber Stripe (rýchle výplaty, priateľský k vývojárom, globálny). Pre podporu po slovensky/česky GoPay alebo ComGate (ComGate má rýchlejšiu výplatu). CardPay len pri eshope s vysokým obratom a existujúcim vzťahom s Tatra bankou. Vyhni sa porovnávaniam podľa marketingových stránok — otestuj sandbox jeden deň a zistíš oveľa viac.
