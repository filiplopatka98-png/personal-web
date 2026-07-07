---
title: "Recovery opustených košíkov na WooCommerce bez drahých pluginov"
date: 2026-09-24
read: 8
tags: ["WooCommerce"]
excerpt: "Sedem z desiatich košíkov skončí opustených. Ukážem, ako ich časť vrátiť za nulu eur mesačne — jeden free plugin plus vlastný kód namiesto predplatného."
featured: false
---

Priemerná opustenosť košíka v e-commerce je dlhodobo okolo **70 %** — Baymard Institute drží tento agregát z takmer päťdesiatich štúdií a číslo sa desať rokov takmer nehýbe ([baymard.com/lists/cart-abandonment-rate](https://baymard.com/lists/cart-abandonment-rate)). To znamená, že sedem z desiatich ľudí, ktorí si niečo hodia do košíka, odíde bez nákupu. Časť z toho je len window shopping, s tým nič nespravíš. Ale merateľnú časť vieš vrátiť jedným e-mailom — a nemusíš na to platiť predplatné.

Vídam to bežne: majiteľ eshopu si kúpi drahý „all-in-one“ marketing balík za desiatky eur mesačne len preto, aby posielal jeden recovery e-mail. To je zbytočné. Ukážem lacnú cestu.

## Prečo ľudia opúšťajú košík (a čo z toho vieš riešiť e-mailom)

Baymard má tvrdé dáta o dôvodoch opustenia checkoutu. Číslo jedna už šesť rokov po sebe: **neočakávané extra náklady** — doprava, dane, poplatky. V ich prieskume to uviedlo **39 %** ľudí ([baymard.com/learn/reduce-cart-abandonment](https://baymard.com/learn/reduce-cart-abandonment)). Ďalej nasleduje nútená registrácia, príliš dlhý checkout a nedôvera pri zadávaní karty.

Väčšinu z toho rieši dizajn checkoutu, nie e-mail — o tom som písal v [deviatich mikro-úpravách WooCommerce checkoutu](/blog/checkout-konvertuje-9-uprav/). Recovery e-mail je až druhá vrstva: chytí ľudí, ktorých vyrušil telefón, ktorí si to chceli „ešte rozmyslieť“ alebo porovnávali cenu inde. Práve tí sa pri dobrom pripomenutí vrátia.

## Free plugin, ktorý reálne stačí

Nebudem predstierať, že vlastný recovery systém napíšeš za hodinu. Pre 95 % malých eshopov je najrozumnejšie začať pluginom **Cart Abandonment Recovery for WooCommerce** (autor CartFlows). Je zadarmo na WordPress.org, má cez **300 000 aktívnych inštalácií** a aktívne sa udržiava — verzia 2.1.3 vyšla v júni 2026 ([wordpress.org/plugins/woo-cart-abandonment-recovery](https://wordpress.org/plugins/woo-cart-abandonment-recovery/)).

Prečo práve tento a nie desať iných? Dve veci, ktoré väčšina free konkurencie nemá naraz:

1. **Zachytí e-mail hneď, ako ho návštevník napíše do checkoutu** — teda ešte pred dokončením objednávky. Bez toho by si nemal komu poslať pripomienku.
2. **Podporuje WooCommerce Cart & Checkout blocks**, nielen classic shortcode checkout (od verzie 1.3.0). To je dnes dôležité — o rozdieloch píšem v [Checkout Blocks vs classic](/blog/woo-checkout-blocks-vs-classic/).

Free verzia vie neobmedzené recovery e-maily, plánovanie sekvencie, generovanie kupónov, 1-klik obnovenie košíka a vlastný analytický dashboard. Platíš až za SMS/WhatsApp kanál — a ten pri slovenskom malom eshope väčšinou nepotrebuješ.

Nastavenie, ktoré vo väčšine projektov funguje, je jednoduchá trojkroková sekvencia:

- **+1 hodina** — čistá pripomienka bez zľavy („nechali ste si tovar v košíku“).
- **+24 hodín** — pridaj sociálny dôkaz alebo odpoveď na námietku (doprava, dostupnosť).
- **+3 dni** — až sem daj malý kupón, ak vôbec.

Zľavu do prvého e-mailu nedávaj nikdy. Naučíš ľudí opúšťať košík schválne, lebo vedia, že do hodiny im príde kód.

## Kedy to nechať pluginu a kedy siahnuť po kóde

Plugin má strop. Keď chceš vlastnú logiku — napojiť sa na vlastný ESP (napr. cez API), pridať vetvenie podľa hodnoty košíka, alebo neposielať pripomienky ľuďom, ktorí medzitým nakúpili niečo iné — je čistejšie spraviť si tenkú vlastnú vrstvu. WooCommerce na to už má všetko v jadre.

Kľúč je **Action Scheduler** — job queue, ktorá je súčasťou každej WooCommerce inštalácie a je robustnejšia než holý WP-Cron. Namiesto `wp_schedule_single_event()` použiješ `as_schedule_single_action()`; funkcia vracia ID naplánovanej akcie a vie akcie zoskupovať cez `$group` ([actionscheduler.org](https://actionscheduler.org/)).

Minimalistický vlastný recovery bez pluginu vyzerá takto. Pri vytvorení objednávky v stave „pending“ (zákazník zadal údaje, ale nezaplatil) naplánujeme kontrolu o hodinu:

```php
// functions.php alebo malý mu-plugin
add_action( 'woocommerce_checkout_order_created', function ( $order ) {
    // Naplánuj kontrolu 1 h po vytvorení objednávky
    as_schedule_single_action(
        time() + HOUR_IN_SECONDS,
        'kuko_check_abandoned_order',
        [ 'order_id' => $order->get_id() ],
        'kuko-recovery' // group
    );
} );
```

Handler po hodine skontroluje, či objednávka stále visí nezaplatená, a pošle e-mail. Dôležité je overiť aktuálny stav — medzitým mohla byť zaplatená alebo zrušená:

```php
add_action( 'kuko_check_abandoned_order', function ( $order_id ) {
    $order = wc_get_order( $order_id );
    if ( ! $order ) {
        return;
    }

    // Posielaj len ak stále čaká na platbu
    if ( ! $order->has_status( [ 'pending', 'failed' ] ) ) {
        return;
    }

    $email = $order->get_billing_email();
    if ( ! is_email( $email ) ) {
        return;
    }

    $pay_url = $order->get_checkout_payment_url(); // odkaz na dokončenie platby

    wp_mail(
        $email,
        'Dokončite svoju objednávku',
        sprintf(
            'Dobrý deň, vaša objednávka čaká na dokončenie. Dokončiť môžete tu: %s',
            esc_url_raw( $pay_url )
        )
    );
} );
```

`get_checkout_payment_url()` vráti odkaz, ktorý zákazníka vezme presne na platbu jeho existujúcej objednávky — nemusí nič klikať odznova. To je celé jadro „recovery“. Zvyšok je copywriting a načasovanie.

Pár vecí, ktoré si musíš ustrážiť sám, lebo ich plugin rieši za teba:

- **Deduplikácia.** Neposielaj tri e-maily na tú istú objednávku. Ulož si `meta` flag (`$order->update_meta_data( '_kuko_recovery_sent', 1 )`) a na začiatku handlera ho over.
- **Súhlas a GDPR.** E-mail zadaný v checkoute smieš použiť na dokončenie **tej** transakcie (oprávnený záujem), ale nie na budúci marketing bez súhlasu. Nemiešaj recovery pripomienku s newsletterom.
- **Doručiteľnosť.** `wp_mail()` cez PHP mail končí v spame. Nasaď transakčný SMTP (Postmark, Brevo, Amazon SES) — inak je celá námaha zbytočná.

## Čo od toho reálne čakať

Nesľubuj si zázraky. Dobrá recovery miera na WooCommerce sa v praxi pohybuje bežne okolo **5 – 10 %** vrátených košíkov ([funnelkit.com/woocommerce-cart-abandonment](https://funnelkit.com/woocommerce-cart-abandonment/)). Znie to málo, kým si to neprepočítaš na peniaze: pri eshope so stovkami objednávok mesačne je to zopár nákupov navyše každý týždeň — za e-mail, ktorý sa odošle sám.

A hlavne: recovery e-mail nikdy nenapraví rozbitý checkout. Ak ľudia utekajú kvôli drahej doprave alebo nútenej registrácii, žiaden e-mail to nezachráni — najprv oprav dôvod, potom lov opustené košíky. Ak riešiš aj platobnú časť, pozri [prehľad slovenských platobných brán 2026](/blog/sk-platobne-brany-2026/). Poradie je vždy rovnaké: najskôr znížiš opustenosť dizajnom, až potom recovery e-mailom dobehneš zvyšok.
