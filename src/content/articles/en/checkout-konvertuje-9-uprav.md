---
title: "The WooCommerce checkout that converts: 9 micro-fixes from a real audit"
date: 2026-03-18
read: 9
tags: ["WooCommerce", "UX", "Performance"]
excerpt: "A store checkout audit — from 71% cart abandonment down to 48%. Nine concrete fixes with code snippets: single page, no gating, autocomplete, mobile inputmode."
featured: true
---

A client — a mid-sized Slovak store with annual revenue around €1.2M — came to me with a question: "revenue has been growing since May, but cart abandonment is 71%. Can you do something about it?" After a week of auditing I produced a prioritized list of changes. Here are 9 of them that we shipped across 3 sprints. After deployment **abandonment dropped to 48%**, and conversion rate rose from 1.4% to 2.6%.

Anonymized, but the numbers and solutions are real.

## 1. Single-page checkout instead of multi-step

Original setup: a 3-step checkout (Address → Shipping → Payment). 18% of users dropped between steps 1 and 2.

Solution: **single-page checkout** — all fields at once, revealed progressively as the user fills them in. We used a modified default Woo template `checkout/form-checkout.php` in the child theme and removed the step wrappers.

```php
// child theme: woocommerce/checkout/form-checkout.php
// removed tabs / step indicators
// one form, scroll-down structure: address → shipping → payment → review
```

The user's mental model: "I can see how much is still left." When they see 3 headings and a short form, they start. When they see "Step 1 of 3," they leave.

## 2. Removing the login/registration gating

Before: the first thing a user saw at checkout was "Have an account? Log in." This is a **kill switch** for conversion. The user tries to remember a password from 2019, gets frustrated, leaves.

After: **guest checkout by default**. After entering their email, a small checkbox appears beneath it: "Create a password and save an account for your next purchase (1 click)." Optional.

```php
// functions.php
add_filter('woocommerce_checkout_must_create_account', '__return_false');
add_filter('woocommerce_checkout_registration_required', '__return_false');
add_filter('woocommerce_checkout_registration_enabled', '__return_true');
```

And in Woo settings: Accounts & Privacy → uncheck "Allow customers to log into an existing account during checkout."

The "create account" checkbox itself is opt-in, unchecked by default. +9% conversion on its own.

## 3. Inline validation (not after submit)

Original validation flow: the user fills out the whole form, clicks "Order," the server returns "Postcode is invalid," scrolls back, and has to find where it is. 3 seconds of frustration.

Solution: validation **on blur** (when the user leaves a field), with immediate visual feedback.

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
    msg.textContent = valid ? '' : 'A Slovak postcode has 5 digits';
  });
});
```

Plus aria-live="polite" for screen reader users. An accessibility win on top.

## 4. Address autocomplete — Slovak Post API

The user types "Bratislava" → the street autocompletes. The postcode fills in. The district fills in. **They press 4 fields instead of 12.**

The [Slovak Post API](https://api.posta.sk/) has a free tier for postcode lookup. Endpoint: `GET https://api.posta.sk/v1/postcodes?city={query}`.

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

A backend proxy in WP (so the API key doesn't leak in JS):

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

Cache via transients so you don't burn your API quota.

## 5. Payment methods as icons, not hidden behind a radio

Default Woo: radio buttons under the text "Payment method." The user has to click to see what's there.

After: a visual grid with logos (Visa, MasterCard, GoPay, Tatra Banka, bank transfer). The user sees all the options at once. **A trust signal.**

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

CSS to make the radio buttons look like clickable cards:

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

## 6. Mobile phone field with `inputmode="numeric"`

On mobile, the phone field opens a QWERTY keyboard by default. The user taps "?123" and then the numbers. Frustration.

```php
add_filter('woocommerce_checkout_fields', function($fields) {
    $fields['billing']['billing_phone']['custom_attributes'] = [
        'inputmode' => 'numeric',
        'pattern' => '[0-9+ ]*',
    ];
    return $fields;
});
```

`inputmode="numeric"` opens the numeric keyboard on both iOS and Android. The postcode gets the same:

```php
$fields['billing']['billing_postcode']['custom_attributes'] = [
    'inputmode' => 'numeric',
    'maxlength' => 5,
];
```

## 7. Sticky order summary on mobile scroll

Mobile checkout: the user fills in fields, but the €82.40 total and item count are above the fold. After scrolling down they lose context. A sticky `position: sticky` summary panel on scroll.

```css
@media (max-width: 768px) {
  .firma-order-summary-mini {
    position: sticky; top: 0; z-index: 10;
    background: white; border-bottom: 1px solid #e5e7eb;
    padding: 8px 16px; display: flex; justify-content: space-between;
  }
}
```

And a PHP partial rendering the summary mini-bar:

```php
<div class="firma-order-summary-mini">
    <span><?php echo WC()->cart->get_cart_contents_count(); ?> items</span>
    <strong><?php echo WC()->cart->get_total(); ?></strong>
</div>
```

## 8. Show shipping before the address is entered

The user wants to know how much the product will cost to ship **before** filling in 12 fields. Default Woo only calculates shipping after the postcode is entered.

Solution: an **estimate based on IP geolocation**. We use the [GeoIP Detection](https://wordpress.org/plugins/geoip-detect/) plugin. On the `cart` page we show:

```php
$location = geoip_detect2_get_info_from_current_ip();
$country = $location->country->isoCode;

if ($country === 'SK') {
    echo '<p>Shipping to Slovakia from €3.90 (Slovak Post)</p>';
} elseif ($country === 'CZ') {
    echo '<p>Shipping to Czechia from €5.50 (Zásilkovna)</p>';
}
```

The user knows what to expect. No unpleasant surprises on the final screen.

## 9. Removing the "disable AdBlock" upsell from checkout

The client had a banner in the checkout: "Disable AdBlock for 5% off your next order." Plus an exit-intent modal with a newsletter sign-up.

Gone. The checkout flow has to be **linear and single-purpose**: complete the order. Every additional element is friction. Newsletters and discount tricks belong in post-purchase emails or the cart, not the checkout.

```php
// we removed
remove_action('woocommerce_checkout_after_customer_details', 'firma_newsletter_modal');
remove_action('woocommerce_review_order_before_payment', 'firma_adblock_banner');
```

## Audit results

3 implementation sprints (~12 dev hours total). Before-After (8-week comparison):

| Metric | Before | After |
|---|---|---|
| Cart abandonment | 71% | 48% |
| Checkout completion (mobile) | 22% | 41% |
| Average checkout time | 4:18 | 1:52 |
| Monthly revenue | €98k | €134k |

The biggest impact came from (order by estimate): #2 (gating), #1 (one-page), #4 (autocomplete), #6 (numeric inputmode).

## TL;DR

Checkout conversion isn't about button color. It's about reducing friction: no login gate, one flow instead of three, inline validation, mobile-friendly inputs, address autocomplete, sticky summary, transparent shipping, no distractions. Nine small changes turned 71% abandonment into 48%. Test at least the first 5 on your own Woo project.
