---
title: "WooCommerce checkout, ktorý konvertuje: 9 mikro-úprav z reálneho auditu"
date: 2026-03-18
read: 9
tags: ["WooCommerce", "UX", "Performance"]
excerpt: "Audit checkoutu eshopu — z 71% cart abandonment na 48%. Devät konkrétnych úprav s code snippetmi: jednostránka, žiadny gating, autocomplete, mobile inputmode."
featured: true
---

Klient — stredne veľký SK eshop s ročným obratom okolo €1.2M — mi prišiel s otázkou: "tržby od mája rastú, ale cart abandonment je 71%. Vieš s tým niečo?". Po týždni auditu som vyrobil prioritizovaný zoznam zmien. Tu je 9 z nich, ktoré sme implementovali za 3 sprinty. Po nasadení **abandonment klesol na 48%**, conversion rate vzrástol z 1.4% na 2.6%.

Anonymizované, ale čísla a riešenia sú reálne.

## 1. Jednostránkový checkout namiesto multi-step

Pôvodný setup: 3-step checkout (Address → Shipping → Payment). 18% userov padalo medzi krokmi 1 a 2.

Riešenie: **single-page checkout** — všetky polia naraz, postupne odhalené ako user vypĺňa. Použili sme upravený default Woo template `checkout/form-checkout.php` v child themes a vyhodili wrappers pre kroky.

```php
// child theme: woocommerce/checkout/form-checkout.php
// odstránené tabs / step indicators
// jeden formulár, scroll-down structure: address → shipping → payment → review
```

Mental model usera: "vidím, koľko mi to ešte zaberie". Keď vidí 3 nadpisy a krátky formulár, začne. Keď vidí "Krok 1 z 3", odíde.

## 2. Odstránenie prihláška/registrácia gating

Pred: prvá vec, ktorú si user na checkoute videl, bolo "Máte u nás konto? Prihláste sa." Toto je **kill switch** pre conversion. User si pamätá heslo z roku 2019, frustruje sa, odíde.

Po: **guest checkout default**. Po vyplnení email-u sa pod ním objaví drobný checkbox "Vytvoriť heslo a uložiť si konto na ďalší nákup (1 click)". Optional.

```php
// functions.php
add_filter('woocommerce_checkout_must_create_account', '__return_false');
add_filter('woocommerce_checkout_registration_required', '__return_false');
add_filter('woocommerce_checkout_registration_enabled', '__return_true');
```

A v Woo settings: Accounts & Privacy → uncheck "Allow customers to log into an existing account during checkout".

Sám checkbox "vytvoriť konto" je opt-in, defaultne unchecked. Konverzia +9% sama o sebe.

## 3. Inline validácia (nie po submite)

Pôvodný validation flow: user vyplní celý formulár, klikne "Objednať", server vráti "PSČ je nevalidné", scroll naspäť, user musí nájsť, kde to je. 3 sekundy frustrácie.

Riešenie: validácia **na blur** (keď user opustí pole), s vizuálnym feedbackom hneď.

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

Plus aria-live=polite pre screen reader users. Accessibility win navyše.

## 4. Autocomplete na adresu — Slovenská pošta API

User vypĺňa "Bratislava" → ulica autocomplete-uje. PSČ sa doplní. Mestská časť sa doplní. **Z 12 polí stláča 4.**

[API Slovenskej pošty](https://api.posta.sk/) má free tier pre PSČ lookup. Endpoint: `GET https://api.posta.sk/v1/postcodes?city={query}`.

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

Backend proxy v WP (aby sa API key netrúsil v JS):

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

Cache cez transients, aby si neminul API quota.

## 5. Platobné metódy ako ikony, nie skryté za radio

Default Woo: radio buttons pod text "Platobná metóda". User musí kliknúť, aby uvidel, čo je tam.

Po: vizuálna grid s logami (Visa, MasterCard, GoPay, Tatra Banka, Bankový prevod). User vidí naraz všetky možnosti. **Trust signal.**

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

## 6. Mobile číslo s `inputmode="numeric"`

Telefón na mobile defaultne otvorí qwerty klávesnicu. User stláča "?123" a potom čísla. Frustrácia.

```php
add_filter('woocommerce_checkout_fields', function($fields) {
    $fields['billing']['billing_phone']['custom_attributes'] = [
        'inputmode' => 'numeric',
        'pattern' => '[0-9+ ]*',
    ];
    return $fields;
});
```

`inputmode="numeric"` otvorí číselnú klávesnicu na iOS aj Androide. PSČ tiež dostane rovnaké:

```php
$fields['billing']['billing_postcode']['custom_attributes'] = [
    'inputmode' => 'numeric',
    'maxlength' => 5,
];
```

## 7. Order summary sticky pri scroll na mobile

Mobile checkout: user vypĺňa polia, súčet €82,40 a počet items je nad záhybom. Po scroll dole stratí kontext. Sticky `position: sticky` summary panel pri scroll-e.

```css
@media (max-width: 768px) {
  .firma-order-summary-mini {
    position: sticky; top: 0; z-index: 10;
    background: white; border-bottom: 1px solid #e5e7eb;
    padding: 8px 16px; display: flex; justify-content: space-between;
  }
}
```

A v PHP partial render summary mini-bar:

```php
<div class="firma-order-summary-mini">
    <span><?php echo WC()->cart->get_cart_contents_count(); ?> ks</span>
    <strong><?php echo WC()->cart->get_total(); ?></strong>
</div>
```

## 8. Zobraziť dopravu pred zadaním adresy

User chce vedieť koľko ho dôjde produkt **pred** vyplnením 12 polí. Default Woo počíta dopravu až po zadaní PSČ.

Riešenie: **estimate na základe IP geolokalizácie**. Používame [GeoIP Detection](https://wordpress.org/plugins/geoip-detect/) plugin. V `cart` page zobrazujeme:

```php
$location = geoip_detect2_get_info_from_current_ip();
$country = $location->country->isoCode;

if ($country === 'SK') {
    echo '<p>Doprava na Slovensko od €3,90 (Slovenská pošta)</p>';
} elseif ($country === 'CZ') {
    echo '<p>Doprava do ČR od €5,50 (Zásilkovna)</p>';
}
```

User vie, čo ho čaká. Žiadne unpleasant surprises na poslednej obrazovke.

## 9. Odstránenie "vypnúť AdBlock" upsell z checkoutu

Klient mal v checkout-e banner: "Vypnúť AdBlock pre 5% zľavu na ďalšiu objednávku". Plus exit-intent modal s newsletter sign-upom.

Vyhodené. Checkout flow musí byť **lineárny a single-purpose**: dokončiť objednávku. Každý ďalší prvok je friction. Newslettery a discount triks patria do post-purchase emails alebo cart, nie checkoutu.

```php
// vyhodili sme
remove_action('woocommerce_checkout_after_customer_details', 'firma_newsletter_modal');
remove_action('woocommerce_review_order_before_payment', 'firma_adblock_banner');
```

## Výsledky audit-u

3 sprinty implementácie (~12 dev hodín celkovo). Pred-After (8 týždňov porovnanie):

| Metrika | Pred | Po |
|---|---|---|
| Cart abandonment | 71% | 48% |
| Checkout completion (mobile) | 22% | 41% |
| Average checkout time | 4:18 | 1:52 |
| Mesačné tržby | €98k | €134k |

Najväčší impact malo (poradie podľa odhadu): #2 (gating), #1 (one-page), #4 (autocomplete), #6 (numeric inputmode).

## TL;DR

Checkout konverzie nie sú o color tlačidla. Sú o znižovaní friction: žiadny login gate, jeden flow miesto troch, inline validation, mobile-friendly inputs, autocomplete adresy, sticky summary, transparent shipping, žiadne distractions. Devät malých zmien spravilo z 71% abandonment 48%. Otestuj na svojom Woo projekte aspoň prvých 5.
