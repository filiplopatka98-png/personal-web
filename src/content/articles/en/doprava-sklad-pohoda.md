---
title: "WooCommerce + Pohoda + Money S3: setting up stock and shipping"
date: 2026-05-02
read: 8
tags: ["WooCommerce", "DevOps"]
excerpt: "Two integration scenarios for Slovak eshops — Pohoda mServer XML and Money S3. Order sync, stock levels, SKU mapping, and when a custom build actually pays off."
featured: false
---

An eshop with no link to accounting is just two databases that disagree. A client recently found out that Pohoda showed a stock level of 0 while the eshop had sold 23 units over the weekend — the goods were sitting in the warehouse the whole time because the manager forgot to enter the receipt into Pohoda while unpacking the boxes. Classic pain.

Here's the exact setup I roll out for 90% of clients running **Pohoda** or **Money S3**. Plus concrete numbers on when a custom build is worth it.

## Scenario 1: Pohoda mServer (XML)

Pohoda is a Slovak-Czech desktop accounting package. It talks to the eshop through **mServer** — an HTTP wrapper around an XML interface for import and export.

### Architecture

```
WooCommerce  →  Push: new orders every hour (XML)   →  Pohoda mServer
WooCommerce  ←  Pull: stock counts 2x daily (XML)    ←  Pohoda mServer
```

On the Pohoda side you need:
- Pohoda E1/SQL or higher (Standard doesn't have mServer)
- mServer running on a dedicated IP (usually over a VPN into the client's accounting box)
- an mServer listener with credentials over basic auth

### WP-Cron for the push

The default WP-Cron is unreliable (it fires based on traffic). For sync that actually matters I use a **system cron** + a call to a WP endpoint:

```bash
# /etc/cron.d/woo-pohoda
0 * * * * www-data curl -X POST -H "X-Sync-Token: ${TOKEN}" https://firma.sk/wp-json/firma/v1/pohoda/push-orders >> /var/log/woo-sync.log 2>&1
```

And the REST endpoint:

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

The XML format (simplified):

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
        <!-- jedna položka na riadok objednávky -->
      </ord:orderDetail>
    </ord:order>
  </dat:dataPackItem>
</dat:dataPack>
```

### Stock pull from Pohoda

```bash
0 6,18 * * * www-data curl -X POST https://firma.sk/wp-json/firma/v1/pohoda/pull-stocks
```

The pull code:

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

### Handling database-lock errors

Pohoda has a **write lock per single user** over a given ledger. If the accountant has an order open, mServer hands you back `Database is locked`. The fix:

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

Three attempts with a 60-second wait clear 95% of the locks.

## Scenario 2: Money S3 (API)

Money S3 (these days under the Seyfor brand) is another popular desktop accounting package on the market. It handles programmatic integration natively over XML (the XML DE module, or XML DE Profi), and its official API is built on GraphQL. Below I show the principle using simplified REST calls — treat the code as an illustration of the data flow, not a literal Money S3 signature.

### The off-the-shelf plugin

If the client doesn't want a custom build, there are commercial connectors (typically in the low hundreds of euros per year) that give you:

- two-way sync of orders ↔ invoices
- stock-level pulls every hour (optional)
- product sync (names, prices, categories)
- payment-status sync (paid → mark as settled)

Install:

```bash
wp plugin install woocommerce-moneys3-sync.zip --activate
# Settings → Money S3 → enter the API endpoint and credentials
```

Setup takes about 30 minutes once you have API access ready. **This is the default choice** for 90% of clients running Money S3. No hours of custom development.

### A custom build over the API

For projects with non-standard needs (custom invoice numbering, multi-tenant flows, B2B contract pricing). Sample calls:

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

## Real gotchas I've run into

### SKU normalization

The eshop has the SKU `PROD-001`, Pohoda has it as `PROD001` (no dash). The sync fails silently — nothing matches up. The fix:

```php
function normalize_sku($sku) {
    return strtoupper(preg_replace('/[^A-Z0-9]/i', '', $sku));
}
```

Apply it at every match, in both directions.

### Currency conversion

Pohoda in CZK, the eshop in EUR. mServer has the exchange rate, but the **rate difference between the order date and the invoice-issue date** can produce a discrepancy of a few cents. That can cause you grief during a tax audit. The fix: when issuing the invoice, send an explicit `exchangeRate` from the order date.

### Return and refund flows

The eshop creates a refund → how do you get it into accounting? Two options:
1. **Negative order** (negative quantities) — Pohoda accepts it, but it's weird from a user's point of view.
2. **Credit note** — the correct solution, but trickier XML.

I built my own credit-note handler for Pohoda:

```php
add_action('woocommerce_order_refunded', function($order_id, $refund_id) {
    $refund = wc_get_order($refund_id);
    $original = wc_get_order($order_id);
    $xml = firma_build_pohoda_credit_note_xml($refund, $original);
    firma_send_to_pohoda($xml);
}, 10, 2);
```

## When a custom build beats a paid plugin

**Plugin (€99/yr):** the client has standard needs, order volume < 1000/month, no custom invoice numbering, the standard Slovak 23% VAT. Savings: ~40 dev hours = ~€2–3k.

**Custom build:** the client runs B2B with contract pricing, multiple currencies, custom invoice formats, integration with 3+ other systems (CRM, WMS, ERP). A plugin won't cover it, so custom development makes sense. Realistic budget: 60–120 hours up front + 10 h/month for maintenance.

## Wrap-up

For eshops on Pohoda: the mServer XML interface + a system cron + a WP REST endpoint, pushing orders every hour and pulling stock levels twice a day. For Money S3: an off-the-shelf connector for 90% of cases, a custom API integration only for B2B and multi-currency edge cases. The most common bugs: unmatched SKUs, exchange-rate discrepancies, and an unprepared refund flow. Plan your retry logic for Pohoda's database locks up front — it isn't optional.

Related: [Slovak payment gateways in 2026](/en/blog/sk-platobne-brany-2026/) and [Next.js ISR as a cron replacement](/en/blog/isr-namiesto-cron/) if you're rethinking scheduled syncs. If the checkout itself is leaking orders, see [the 9 micro-tweaks that made a WooCommerce checkout convert](/en/blog/checkout-konvertuje-9-uprav/).
