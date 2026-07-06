---
title: "WooCommerce checkout, ktorý konvertuje: 9 mikro-úprav z reálneho auditu"
date: 2026-03-18
read: 9
tags: ["WooCommerce", "UX", "Performance"]
excerpt: "Audit checkoutu jedného eshopu — z 71 % opustených košíkov na 48 %. Deväť konkrétnych úprav s ukážkami kódu: jednostránkový checkout, žiadny login gate, autocomplete adresy, mobilný inputmode."
featured: true
---

Klient — stredne veľký slovenský eshop s ročným obratom okolo €1,2 mil. — mi prišiel s otázkou: „Tržby od mája rastú, ale opustenosť košíka je 71 %. Vieš s tým niečo urobiť?“ Po týždni auditu som pripravil prioritizovaný zoznam zmien. Tu je 9 z nich, ktoré sme implementovali počas 3 šprintov. Po nasadení **opustenosť košíka klesla na 48 %** a konverzný pomer vzrástol z 1,4 % na 2,6 %.

Anonymizované, ale čísla aj riešenia sú reálne.

## 1. Jednostránkový checkout namiesto multi-step

Pôvodný stav: trojkrokový checkout (Adresa → Doprava → Platba). 18 % používateľov odpadávalo medzi krokmi 1 a 2.

Riešenie: **jednostránkový checkout** — všetky polia naraz, postupne odhaľované, ako ich používateľ vypĺňa. Použili sme upravenú predvolenú šablónu WooCommerce `checkout/form-checkout.php` v child téme a vyhodili sme wrappery jednotlivých krokov.

```php
// child theme: woocommerce/checkout/form-checkout.php
// odstránené tabs / step indicators
// jeden formulár, scroll-down structure: address → shipping → payment → review
```

Mentálny model používateľa: „vidím, koľko mi to ešte zaberie“. Keď vidí 3 nadpisy a krátky formulár, začne. Keď vidí „Krok 1 z 3“, odíde.

## 2. Odstránenie gatingu prihlásením/registráciou

Predtým: prvá vec, ktorú používateľ na checkoute videl, bolo „Máte u nás konto? Prihláste sa.“ Toto je **kill switch** pre konverziu. Používateľ si spomína na heslo z roku 2019, frustruje sa a odíde.

Potom: **guest checkout ako predvolený**. Po vyplnení e-mailu sa pod ním objaví drobný checkbox „Vytvoriť heslo a uložiť si konto na ďalší nákup (na 1 klik)“. Voliteľné.

```php
// functions.php
// registrácia nie je povinná → povolí sa guest checkout
add_filter('woocommerce_checkout_registration_required', '__return_false');
// ale možnosť vytvoriť si konto zostane zobrazená (opt-in checkbox)
add_filter('woocommerce_checkout_registration_enabled', '__return_true');
```

A v nastaveniach WooCommerce: Accounts & Privacy → odškrtni „Allow customers to log into an existing account during checkout“.

Samotný checkbox „vytvoriť konto“ je opt-in, predvolene neoznačený. Konverzia +9 % sama o sebe.

## 3. Inline validácia (nie po submite)

Pôvodný priebeh validácie: používateľ vyplní celý formulár, klikne „Objednať“, server vráti „PSČ je nevalidné“, scroll naspäť a musí hľadať, kde to je. 3 sekundy frustrácie.

Riešenie: validácia **na blur** (keď používateľ opustí pole), s okamžitým vizuálnym feedbackom.

```js
// child theme assets/js/checkout-validation.js
document.querySelectorAll('#billing_postcode').forEach(field => {
  field.addEventListener('blur', () => {
    const value = field.value.replace(/\s/g, '');
    const valid = /^\d{5}$/.test(value);
    field.classList.toggle('field-error', !valid);

    let msg = field.parentElement.querySelector('.field-msg');
    if (!msg) {
      msg = document.createElement('span');
      msg.className = 'field-msg';
      field.parentElement.appendChild(msg);
    }
    msg.textContent = valid ? '' : 'Slovenské PSČ má 5 číslic';
  });
});
```

Plus `aria-live="polite"` pre používateľov čítačiek obrazovky. Prístupnosť navyše.

## 4. Autocomplete adresy — API Slovenskej pošty

Používateľ vypĺňa „Bratislava“ → ulica sa doplní automaticky. PSČ sa doplní. Mestská časť sa doplní. **Z 12 polí vypĺňa 4.**

[API Slovenskej pošty](https://api.posta.sk/) má free tier pre lookup PSČ. Endpoint: `GET https://api.posta.sk/v1/postcodes?city={query}`.

```js
// debounced search
const cityInput = document.querySelector('#billing_city');
let timer;
cityInput.addEventListener('input', () => {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    if (cityInput.value.length < 2) return;
    const res = await fetch(`/wp-json/firma/v1/postcode-lookup?q=${encodeURIComponent(cityInput.value)}`);
    const suggestions = await res.json();
    renderSuggestions(suggestions);
  }, 250);
});
```

Backend proxy vo WordPresse (aby sa API kľúč nedostal do JS):

```php
add_action('rest_api_init', function() {
    register_rest_route('firma/v1', '/postcode-lookup', [
        'methods' => 'GET',
        'callback' => 'firma_postcode_lookup',
        'permission_callback' => '__return_true',
    ]);
});

function firma_postcode_lookup($request) {
    $q = sanitize_text_field($request['q']);
    $cached = get_transient("psc_{$q}");
    if ($cached) return $cached;

    $res = wp_remote_get("https://api.posta.sk/v1/postcodes?city=" . urlencode($q));
    $body = json_decode(wp_remote_retrieve_body($res), true);
    set_transient("psc_{$q}", $body, HOUR_IN_SECONDS);
    return $body;
}
```

Cache cez transienty, aby si nevyčerpal API kvótu.

## 5. Platobné metódy ako ikony, nie skryté za radiobuttonom

Predvolený WooCommerce: radiobuttony pod textom „Platobná metóda“. Používateľ musí kliknúť, aby uvidel, čo tam je.

Potom: vizuálny grid s logami (Visa, Mastercard, GoPay, Tatra banka, bankový prevod). Používateľ vidí všetky možnosti naraz. **Trust signal.**

```php
// functions.php
add_action('woocommerce_review_order_before_payment', 'firma_payment_logos');
function firma_payment_logos() {
    echo '<div class="firma-payment-trust">
        <img src="/icons/visa.svg" alt="Visa" />
        <img src="/icons/mastercard.svg" alt="MasterCard" />
        <img src="/icons/gopay.svg" alt="GoPay" />
        <img src="/icons/tatrabanka.svg" alt="Tatra Banka" />
    </div>';
}
```

CSS na to, aby radio buttons vyzerali ako klikacie karty:

```css
.wc_payment_method label {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; border: 2px solid #e5e7eb;
  border-radius: 12px; cursor: pointer;
}
.wc_payment_method input:checked + label {
  border-color: var(--brand);
  background: var(--brand-50);
}
```

## 6. Telefónne číslo na mobile s `inputmode="numeric"`

Pole telefónu na mobile predvolene otvorí QWERTY klávesnicu. Používateľ ťuká „?123“ a až potom čísla. Frustrácia.

```php
add_filter('woocommerce_checkout_fields', function($fields) {
    $fields['billing']['billing_phone']['custom_attributes'] = [
        'inputmode' => 'numeric',
        'pattern' => '[0-9+ ]*',
    ];
    return $fields;
});
```

`inputmode="numeric"` otvorí číselnú klávesnicu na iOS aj Androide (spolu s `pattern` kvôli starším verziám iOS). PSČ dostane to isté:

```php
$fields['billing']['billing_postcode']['custom_attributes'] = [
    'inputmode' => 'numeric',
    'maxlength' => 5,
];
```

## 7. Sticky súhrn objednávky pri scrolle na mobile

Mobilný checkout: používateľ vypĺňa polia, ale súčet €82,40 a počet položiek sú nad záhybom. Po scrolle dole stratí kontext. Riešením je súhrnný panel prilepený cez `position: sticky`.

```css
@media (max-width: 768px) {
  .firma-order-summary-mini {
    position: sticky; top: 0; z-index: 10;
    background: white; border-bottom: 1px solid #e5e7eb;
    padding: 8px 16px; display: flex; justify-content: space-between;
  }
}
```

A v PHP partiale sa renderuje mini-lišta so súhrnom:

```php
<div class="firma-order-summary-mini">
    <span><?php echo WC()->cart->get_cart_contents_count(); ?> ks</span>
    <strong><?php echo WC()->cart->get_total(); ?></strong>
</div>
```

## 8. Zobraziť dopravu pred zadaním adresy

Používateľ chce vedieť, koľko ho bude stáť doprava **pred** vyplnením 12 polí. Predvolený WooCommerce počíta dopravu až po zadaní PSČ.

Riešenie: **odhad na základe IP geolokácie**. Používame plugin [GeoIP Detection](https://wordpress.org/plugins/geoip-detect/). Na stránke košíka zobrazujeme:

```php
$location = geoip_detect2_get_info_from_current_ip();
$country = $location->country->isoCode;

if ($country === 'SK') {
    echo '<p>Doprava na Slovensko od €3,90 (Slovenská pošta)</p>';
} elseif ($country === 'CZ') {
    echo '<p>Doprava do ČR od €5,50 (Zásilkovna)</p>';
}
```

Používateľ vie, čo ho čaká. Žiadne nepríjemné prekvapenia na poslednej obrazovke.

## 9. Odstránenie „vypni AdBlock“ upsellu z checkoutu

Klient mal v checkoute banner: „Vypni AdBlock a získaj 5 % zľavu na ďalšiu objednávku.“ Plus exit-intent modal s prihlásením na newsletter.

Vyhodené. Checkout flow musí byť **lineárny a jednoúčelový**: dokončiť objednávku. Každý ďalší prvok je friction. Newslettery a zľavové triky patria do post-purchase e-mailov alebo do košíka, nie na checkout.

```php
// vyhodili sme
remove_action('woocommerce_checkout_after_customer_details', 'firma_newsletter_modal');
remove_action('woocommerce_review_order_before_payment', 'firma_adblock_banner');
```

## Výsledky auditu

3 šprinty implementácie (~12 dev hodín celkovo). Porovnanie pred/po (8-týždňové okno):

| Metrika | Pred | Po |
|---|---|---|
| Opustenosť košíka | 71 % | 48 % |
| Dokončenie checkoutu (mobil) | 22 % | 41 % |
| Priemerný čas checkoutu | 4:18 | 1:52 |
| Mesačné tržby | €98k | €134k |

Najväčší dopad malo (poradie podľa odhadu): #2 (gating), #1 (jednostránka), #4 (autocomplete), #6 (numeric inputmode).

## TL;DR

Konverzia checkoutu nie je o farbe tlačidla. Je o znižovaní friction: žiadny login gate, jeden flow namiesto troch, inline validácia, mobile-friendly inputy, autocomplete adresy, sticky súhrn, transparentná doprava, žiadne rozptýlenia. Deväť malých zmien spravilo zo 71 % opustenosti 48 %. Otestuj na svojom WooCommerce projekte aspoň prvých 5.
