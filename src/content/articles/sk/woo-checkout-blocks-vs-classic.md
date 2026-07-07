---
title: "WooCommerce Checkout Blocks vs classic: prejsť, alebo počkať (2026)"
date: 2026-09-22
read: 8
tags: ["WooCommerce"]
excerpt: "Blocks checkout je default pre nové inštalácie, no 87 % eshopov stále beží na classic. Kedy sa migrácia oplatí, kedy je predčasná a čo reálne prehodíš."
featured: false
---

Otázku „ideme na Checkout Blocks alebo zostávame na classic?" dostávam čoraz častejšie a odpoveď nie je taká priamočiara, ako by sa z marketingu WooCommerce zdalo. Blocks sú od WooCommerce 8.3 (november 2023) default pre nové inštalácie na block themes, ale v praxi väčšina existujúcich eshopov stále beží na starom shortcode checkoute — a majú na to dobré dôvody.

Poďme si to rozobrať bez PR omáčky. Čo reálne získaš, čo stratíš a kedy má prechod zmysel práve pre tvoj projekt.

## Kde to dnes stojí

Dáta z analýzy zhruba 10 000 WooCommerce eshopov (Maarten Belmans, cituje Business Bloomer) hovoria jasne: **87 % eshopov stále beží na classic checkoute, len 13 % na blocks**. Aj medzi eshopmi vytvorenými po novembri 2023, keď sa blocks stali defaultom, je adopcia len okolo 18 %.

To nie je náhoda. Blocks checkout beží na Reacte a Store API — je to úplne iná architektúra než PHP šablóny a shortcode `[woocommerce_checkout]`. A práve tá zmena architektúry je zdroj celej debaty.

Rozdiel v jednej vete: classic checkout renderuje server cez PHP šablóny a rozširuješ ho cez desiatky známych hookov (`woocommerce_checkout_fields`, template overrides). Blocks checkout renderuje prehliadač cez React komponenty a rozširuješ ho cez kurátorské JavaScript API a Store API.

## Čo reálne získaš prechodom na Blocks

Nie je to len „modernejšie". Blocks prinášajú pár vecí, ktoré na classic checkoute buď nemáš, alebo si ich musel doplácať pluginmi:

- **Express platby v jednom kroku** — Apple Pay, Google Pay a link-based checkouty sedia v bloku natívne. Podľa FIS Worldpay Global Payments Report už digitálne peňaženky tvoria okolo 49 % hodnoty globálnych e-commerce transakcií, takže toto nie je okrajová vec.
- **Local pickup ako samostatný krok** — osobný odber je vlastný výberový krok, nie prilepený k doprave. Pre SK eshopy so Zásielkovňou/Packetou a osobným odberom je to čistejší UX.
- **Vizuálne skladanie v editore** — cart a checkout upravuješ v block editore s live preview namiesto template overrides.
- **Menej layout shiftu** — bloky renderujú stabilnejšie polia, čo pomáha INP aj CLS. A rýchlosť checkoutu má priamy dopad na konverziu: notoricky známy odhad hovorí o cca 7 % poklese konverzií na každú sekundu spomalenia.

Pre nový eshop, ktorý staviaš od nuly a nemáš batoh legacy pluginov, sú blocks dnes rozumný default.

## Čo je stále bolesť

Tu prichádza dôvod, prečo 87 % eshopov ostáva na classic — a treba to povedať narovinu.

**Kompatibilita pluginov.** Najväčší problém adopcie. Kým plugin explicitne nepodporuje blocks checkout, jeho polia, integrácie alebo custom logika jednoducho nefungujú. James Kemp z WooCommerce to sám priznáva: veľa pluginov s blocks checkoutom kompatibilných nie je. Ak máš na eshope 3 – 4 checkout pluginy (fakturácia, doprava, darčekové poukazy, vernostný program), pravdepodobnosť, že aspoň jeden nepodporuje blocks, je vysoká.

**Kurátorská rozšíriteľnosť.** WooCommerce zámerne nereplikoval všetky classic hooky. Ide o filozofiu „curated extensibility" — dostaneš definované miesta (slots), kam môžeš vpichnúť vlastné React komponenty cez fills, ale nie voľnú ruku ako pri PHP hookoch. Ak tvoj eshop stojí na ťažkých customizáciách checkoutu cez `woocommerce_checkout_fields` alebo template overrides, prepis nie je triviálny.

**Klasické hooky nefungujú.** Toto je časté prekvapenie. Starý spôsob pridania poľa:

```php
// Classic checkout — na Blocks checkoute NEFUNGUJE
add_filter( 'woocommerce_checkout_fields', function ( $fields ) {
    $fields['billing']['billing_ico'] = [
        'label'    => 'IČO',
        'required' => false,
        'class'    => [ 'form-row-wide' ],
    ];
    return $fields;
} );
```

Na blocks checkoute tento filter nespraví nič. Pole sa nezobrazí, validácia nezbehne. Musíš na to ísť cez nové API.

## Custom pole na Blocks checkoute správne

Dobrá správa: pre jednoduché polia (text, checkbox, select) nemusíš písať ani riadok JavaScriptu. WooCommerce má **Additional Checkout Fields API** — čisto PHP, stabilné od WooCommerce 8.9 (máj 2024). Registruješ cez `woocommerce_register_additional_checkout_field` na `woocommerce_init` alebo neskôr:

```php
add_action( 'woocommerce_init', function () {
    woocommerce_register_additional_checkout_field( [
        'id'       => 'kuko/ico',
        'label'    => 'IČO',
        'location' => 'address', // 'contact' | 'address' | 'order'
        'type'     => 'text',     // 'text' | 'checkbox' | 'select'
        'required' => false,
    ] );
} );
```

Tri lokácie a čo znamenajú:

- `contact` — hore vo formulári, ukladá sa k zákazníckemu účtu,
- `address` — v shipping aj billing formulári, ukladá sa k zákazníkovi aj objednávke,
- `order` — v bloku objednávky, ukladá sa len k objednávke.

Validáciu a sanitizáciu doplníš cez WordPress action hooky; na uloženú hodnotu reaguješ cez `woocommerce_set_additional_field_value`. Pre 80 % reálnych potrieb (IČO, DIČ, poznámka, súhlas, výber pobočky) toto stačí. Zložitejšie veci — podmienené polia, custom React komponenty — už chcú Slots & Fills a JavaScript enqueue, a tam náklady rastú.

Ak potrebuješ hlbšie do checkout optimalizácie bez prepisovania architektúry, mrkni na [9 mikro-úprav WooCommerce checkoutu z reálneho auditu](/blog/checkout-konvertuje-9-uprav/) — väčšina z nich funguje na oboch verziách.

## Ako sa vrátiť späť (a prečo je to dôležité)

Toto je poistka, ktorá znižuje riziko experimentu. Blocks checkout vieš kedykoľvek premeniť späť na classic: v block editore klikneš na blok, v toolbare **Transform → Classic Shortcode**. Cart a checkout fungujú v páre — ak vraciaš checkout, vráť aj cart.

Prakticky to znamená, že migráciu vieš otestovať na staging a keď niečo nesadne, si za minútu späť. Žiadny one-way trip.

## Moje rozhodovacie pravidlo pre 2026

Nebudem ti tvrdiť „všetci na blocks". Realita je jemnejšia:

**Choď na Blocks, ak:**

- staviaš nový eshop od nuly na block theme,
- chceš express platby (Apple/Google Pay) a jednoduchý osobný odber,
- tvoje checkout customizácie sú v rozsahu Additional Fields API,
- všetky tvoje kľúčové pluginy blocks explicitne podporujú (over to, nehádaj).

**Zostaň na Classic (zatiaľ), ak:**

- máš bežiaci eshop s ťažkými PHP customizáciami checkoutu,
- závisíš od pluginov, ktoré blocks nepodporujú,
- checkout ti konvertuje a nemáš merateľný dôvod ho prepisovať.

Zlaté pravidlo: **nemigruj fungujúci checkout len preto, že blocks sú „budúcnosť".** Budúcnosť to je, WordPress aj WooCommerce sa uberajú týmto smerom a rozšíriteľnosť sa zlepšuje z verzie na verziu. Ale prepis produkčného checkoutu bez merateľného prínosu je čisté riziko bez odmeny.

Ak vyberáš platformu úplne od začiatku, skôr než riešiš checkout, prečítaj si [pravdivé porovnanie WooCommerce vs Shopify pre malý SK eshop](/blog/woocommerce-vs-shopify/). A keď riešiš platby, pomôže [prehľad slovenských platobných brán v 2026](/blog/sk-platobne-brany-2026/) — lebo práve podpora blocks checkoutu sa medzi bránami líši.

## Zhrnutie

Blocks checkout nie je hype ani slepá ulička — je to smer, kam WooCommerce ide. Ale v septembri 2026 stále platí, že 87 % eshopov beží na classic a robia dobre, ak nemajú konkrétny dôvod prejsť. Nový projekt? Blocks. Fungujúci eshop s legacy customizáciami? Otestuj na staging, over pluginy, a ak niečo neklape, `Transform → Classic Shortcode` ťa vráti späť. Rozhoduj podľa svojho stacku, nie podľa changelogu.
