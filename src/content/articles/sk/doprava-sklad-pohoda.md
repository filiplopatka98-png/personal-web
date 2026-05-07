---
title: "WooCommerce + Pohoda + MoneyS3: ako nastaviť sklad a dopravu"
date: 2026-05-02
read: 8
tags: ["WooCommerce", "DevOps"]
excerpt: "Dva integračné scenáre pre SK eshopy — Pohoda mServer XML a MoneyS3 REST API. Sync objednávok, stock counts, mapovanie SKU a kedy oplatí custom riešenie."
featured: false
---

Eshop bez napojenia na účtovníctvo je dvoma databázami, ktoré sa nezhodujú. Klient nedávno zistil, že na Pohode mal stav skladu 0, ale eshop predal 23 ks za víkend — pri rozbalení balíkov tovar zostal v sklade, lebo manažér zabudol pridať príjemku do Pohody. Klasická bolesť.

Tu je presný setup, ktorý odjazdím pre 90% klientov s **Pohoda** alebo **MoneyS3**. Plus konkrétne čísla pre to, kedy oplatí custom riešenie.

## Scenár 1: Pohoda mServer (XML)

Pohoda je SK/CZ desktop accounting software. Komunikácia s eshopom = **mServer**, čo je HTTP wrapper okolo XML import/export interface.

### Architektúra

```
WooCommerce  →  Push: nové objednávky každú hodinu (XML)  →  Pohoda mServer
WooCommerce  ←  Pull: stock counts 2x denne (XML)         ←  Pohoda mServer
```

Na strane Pohody musíš mať:
- Pohoda E1/SQL alebo vyšší (Standard nemá mServer)
- mServer running na dedikovanej IP (väčšinou cez VPN do klientovho účtovníctva)
- mServer API listener s basic auth credentials

### WP-Cron pre push

Defaultný WP-Cron je nespoľahlivý (závisí od traffic-u). Pre business-critical sync používam **system cron** + zavolanie WP endpointu:

```bash
# /etc/cron.d/woo-pohoda
0 * * * * www-data curl -X POST -H "X-Sync-Token: ${TOKEN}" https://firma.sk/wp-json/firma/v1/pohoda/push-orders >> /var/log/woo-sync.log 2>&1
```

A REST endpoint:

```php
add_action('rest_api_init', function() {
    register_rest_route('firma/v1', '/pohoda/push-orders', [
        'methods' => 'POST',
        'callback' => 'firma_pohoda_push_orders',
        'permission_callback' => function($req) {
            return $req->get_header('x-sync-token') === SYNC_TOKEN;
        },
    ]);
});

function firma_pohoda_push_orders() {
    $orders = wc_get_orders([
        'status' => 'processing',
        'meta_key' => '_pohoda_synced',
        'meta_compare' => 'NOT EXISTS',
        'limit' => 50,
    ]);

    foreach ($orders as $order) {
        try {
            $xml = firma_build_pohoda_xml($order);
            $response = firma_send_to_pohoda($xml);

            if ($response['status'] === 'ok') {
                $order->update_meta_data('_pohoda_synced', current_time('mysql'));
                $order->update_meta_data('_pohoda_doc_number', $response['doc_number']);
                $order->save();
            }
        } catch (Exception $e) {
            error_log("Pohoda push failed for order {$order->get_id()}: " . $e->getMessage());
            $order->add_order_note("Pohoda sync error: " . $e->getMessage());
        }
    }

    return ['synced' => count($orders)];
}
```

XML formát (zjednodušene):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<dat:dataPack xmlns:dat="http://www.stormware.cz/schema/version_2/data.xsd">
  <dat:dataPackItem id="ord-{$order_id}">
    <ord:order>
      <ord:orderHeader>
        <ord:numberOrder>WOO-{$order_id}</ord:numberOrder>
        <ord:date>{$order_date}</ord:date>
        <ord:partnerIdentity>
          <typ:address>
            <typ:company>{$billing_company}</typ:company>
            <typ:name>{$billing_name}</typ:name>
            <typ:ico>{$billing_ico}</typ:ico>
            <typ:dic>{$billing_dic}</typ:dic>
          </typ:address>
        </ord:partnerIdentity>
      </ord:orderHeader>
      <ord:orderDetail>
        <!-- pozícia per item -->
      </ord:orderDetail>
    </ord:order>
  </dat:dataPackItem>
</dat:dataPack>
```

### Stock pull z Pohody

```bash
0 6,18 * * * www-data curl -X POST https://firma.sk/wp-json/firma/v1/pohoda/pull-stocks
```

Pull kód:

```php
function firma_pohoda_pull_stocks() {
    $xml_request = '<lst:listStock version="2.0"><lst:requestStock><lst:filter><ftr:onlyOnStock>true</ftr:onlyOnStock></lst:filter></lst:requestStock></lst:listStock>';

    $response = firma_send_to_pohoda($xml_request);
    $stocks = simplexml_load_string($response['body']);

    foreach ($stocks->stock as $item) {
        $sku = (string)$item->code;
        $count = (int)$item->count;

        $product_id = wc_get_product_id_by_sku($sku);
        if ($product_id) {
            wc_update_product_stock($product_id, $count, 'set');
        }
    }
}
```

### Error handling pri DB lockoch

Pohoda má **single-user write lock** na danej zákazke. Ak účtovníčka má otvorenú objednávku, mServer ti vráti `Database is locked`. Riešenie:

```php
function firma_send_to_pohoda($xml, $retry = 0) {
    $response = wp_remote_post(POHODA_MSERVER_URL, [
        'body' => $xml,
        'headers' => ['Content-Type' => 'text/xml'],
        'timeout' => 60,
    ]);

    $body = wp_remote_retrieve_body($response);

    if (str_contains($body, 'Database is locked')) {
        if ($retry < 3) {
            sleep(60);
            return firma_send_to_pohoda($xml, $retry + 1);
        }
        throw new Exception('Pohoda DB locked after 3 retries');
    }

    return ['status' => 'ok', 'body' => $body];
}
```

3 retry s 60-sekundovým sleep-om vyrieši 95% lock-ov.

## Scenár 2: MoneyS3 (REST API)

MoneyS3 je modernejší, cloud-friendly accounting tool. REST API z fabriky, v 2024+ s OAuth 2.

### Plugin: WooCommerce-MoneyS3-Sync

Komerčný plugin **[WooCommerce MoneyS3 Sync](https://www.moneys3-pro.cz/)** za ~€99/year. Poskytuje:

- bidirectional sync orders ↔ MoneyS3 invoices
- stock pull každú hodinu (configurable)
- product sync (názvy, ceny, kategórie)
- payment status sync (paid → MoneyS3 mark as paid)

Inštalácia:

```bash
wp plugin install woocommerce-moneys3-sync.zip --activate
# Settings → MoneyS3 → enter API endpoint, OAuth client_id + secret
```

Setup ~30 minút ak máš MoneyS3 dev account ready. **Toto je default voľba** pre 90% klientov, ktorí MoneyS3 používajú. Žiadne custom dev hours.

### Custom riešenie cez REST API

Pre projekty s netradičnými potrebami (custom invoice numbering, multi-tenant flows, B2B contract pricing). MoneyS3 REST API:

```php
function moneys3_create_invoice($order) {
    $token = moneys3_get_oauth_token();

    $payload = [
        'documentNumber' => 'WOO-' . $order->get_id(),
        'documentDate' => $order->get_date_created()->format('Y-m-d'),
        'partner' => [
            'name' => $order->get_billing_company() ?: $order->get_formatted_billing_full_name(),
            'ico' => $order->get_meta('_billing_ico'),
            'dic' => $order->get_meta('_billing_dic'),
        ],
        'items' => array_map(function($item) {
            return [
                'sku' => $item->get_product()->get_sku(),
                'quantity' => $item->get_quantity(),
                'unitPrice' => $item->get_total() / $item->get_quantity(),
                'vatRate' => 23,
            ];
        }, array_values($order->get_items())),
    ];

    $response = wp_remote_post('https://api.moneys3.cz/v2/invoices', [
        'headers' => [
            'Authorization' => "Bearer {$token}",
            'Content-Type' => 'application/json',
        ],
        'body' => json_encode($payload),
    ]);

    return json_decode(wp_remote_retrieve_body($response), true);
}
```

OAuth token refresh:

```php
function moneys3_get_oauth_token() {
    $cached = get_transient('moneys3_token');
    if ($cached) return $cached;

    $response = wp_remote_post('https://auth.moneys3.cz/oauth/token', [
        'body' => [
            'grant_type' => 'client_credentials',
            'client_id' => MONEYS3_CLIENT_ID,
            'client_secret' => MONEYS3_CLIENT_SECRET,
        ],
    ]);

    $data = json_decode(wp_remote_retrieve_body($response), true);
    set_transient('moneys3_token', $data['access_token'], $data['expires_in'] - 60);
    return $data['access_token'];
}
```

## Reálne zákutia, na ktoré som narazil

### SKU normalizácia

Eshop má SKU `PROD-001`, Pohoda v ňom má `PROD001` (bez pomlčky). Sync zlyhá ticho — nezmatchuje. Riešenie:

```php
function normalize_sku($sku) {
    return strtoupper(preg_replace('/[^A-Z0-9]/i', '', $sku));
}
```

Aplikuj pri každom matchi v oboch smeroch.

### Mena prepočty

Pohoda v CZK, eshop v EUR. mServer má conversion rate, ale **kurzový rozdiel medzi dňom objednávky a dňom invoice-u** môže spôsobiť rozdiel pár centov. Pre IRS audit ti to môže narobiť. Riešenie: pri create invoice posielaj explicit `exchangeRate` z dňa objednávky.

### Return / refund flow

Eshop vytvorí refund → ako to dostať do účtovníctva? Dve možnosti:
1. **Zápornú objednávku** (negative quantities) — Pohoda akceptuje, ale UX je weird.
2. **Credit note (dobropis)** — správne riešenie, ale zložitejšie XML.

Vyrobil som vlastný handler pre Pohoda credit notes:

```php
add_action('woocommerce_order_refunded', function($order_id, $refund_id) {
    $refund = wc_get_order($refund_id);
    $original = wc_get_order($order_id);
    $xml = firma_build_pohoda_credit_note_xml($refund, $original);
    firma_send_to_pohoda($xml);
}, 10, 2);
```

## Kedy oplatí custom vs platený plugin

**Plugin (€99/year):** klient má štandardné potreby, počet objednávok < 1000/mesiac, žiadne custom invoice numbering, štandardná SK 23% DPH. Saving: ~40 dev hodín = ~€2-3k.

**Custom:** klient má B2B s per-contract pricing, multi-currency, custom invoice formats, integráciu s 3+ ďalšími systémami (CRM, WMS, ERP). Plugin nepokrýva, custom dev má sense. Reálny budget: 60-120 hodín initial + 10h/mesiac maintenance.

## TL;DR

Pre Pohoda eshopy: mServer XML interface + system cron + WP REST endpoint, push orders hourly, pull stocks 2× denne. Pre MoneyS3: oficiálny plugin €99/year pre 90% prípadov, custom REST integration len pre B2B/multi-currency edge cases. Najčastejšie chyby: SKU mismatch, kurzové rozdiely, nepripravený refund flow. Plánuj retry logic pre DB locks pri Pohode — nie je to optional.
