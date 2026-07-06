---
title: "WooCommerce + Pohoda + MoneyS3: ako nastaviť sklad a dopravu"
date: 2026-05-02
read: 8
tags: ["WooCommerce", "DevOps"]
excerpt: "Dva integračné scenáre pre slovenské eshopy — Pohoda mServer XML a Money S3. Synchronizácia objednávok, stavov skladu, mapovanie SKU a kedy sa oplatí zákazkové riešenie."
featured: false
---

Eshop bez napojenia na účtovníctvo sú dve databázy, ktoré sa nezhodujú. Klient nedávno zistil, že v Pohode mal stav skladu 0, ale eshop cez víkend predal 23 ks — pri rozbaľovaní balíkov tovar zostal v sklade, lebo manažér zabudol pridať príjemku do Pohody. Klasická bolesť.

Tu je presný setup, ktorý nasadzujem pre 90 % klientov s **Pohodou** alebo **Money S3**. Plus konkrétne čísla, kedy sa oplatí zákazkové riešenie.

## Scenár 1: Pohoda mServer (XML)

Pohoda je slovensko-český desktopový účtovný softvér. Komunikácia s eshopom prebieha cez **mServer** — HTTP obal okolo XML rozhrania na import a export.

### Architektúra

```
WooCommerce  →  Push: nové objednávky každú hodinu (XML)  →  Pohoda mServer
WooCommerce  ←  Pull: stock counts 2x denne (XML)         ←  Pohoda mServer
```

Na strane Pohody musíš mať:
- Pohodu E1/SQL alebo vyššiu (Standard nemá mServer)
- mServer bežiaci na dedikovanej IP (väčšinou cez VPN do klientovho účtovníctva)
- mServer listener s prihlasovacími údajmi cez basic auth

### WP-Cron pre push

Predvolený WP-Cron je nespoľahlivý (spúšťa sa podľa návštevnosti). Pre kriticky dôležitú synchronizáciu používam **systémový cron** + zavolanie WP endpointu:

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
        <!-- jedna položka na riadok objednávky -->
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

### Ošetrenie chýb pri zámkoch databázy

Pohoda má **zámok na zápis pre jedného používateľa** nad danou agendou. Ak má účtovníčka otvorenú objednávku, mServer ti vráti `Database is locked`. Riešenie:

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

Tri pokusy so 60-sekundovým čakaním vyriešia 95 % zámkov.

## Scenár 2: Money S3 (API)

Money S3 (dnes pod značkou Seyfor) je ďalší populárny desktopový účtovný softvér na trhu. Programové napojenie rieši natívne cez XML (modul XML DE, resp. XML DE Profi), oficiálne API má postavené na GraphQL. Nižšie ukazujem princíp cez zjednodušené REST volania — kód ber ako ilustráciu toku dát, nie ako doslovnú Money S3 signatúru.

### Hotový plugin

Ak klient nechce zákazkový vývoj, existujú komerčné konektory (spravidla v ráde nižších stoviek eur ročne), ktoré poskytujú:

- obojsmernú synchronizáciu objednávok ↔ faktúry
- sťahovanie stavu skladu každú hodinu (voliteľne)
- synchronizáciu produktov (názvy, ceny, kategórie)
- synchronizáciu stavu platby (zaplatené → označiť ako uhradené)

Inštalácia:

```bash
wp plugin install woocommerce-moneys3-sync.zip --activate
# Nastavenia → Money S3 → zadaj API endpoint a prihlasovacie údaje
```

Nastavenie zaberie asi 30 minút, keď máš pripravený prístup k API. **Toto je predvolená voľba** pre 90 % klientov, ktorí Money S3 používajú. Žiadne hodiny zákazkového vývoja.

### Zákazkové riešenie cez API

Pre projekty s neštandardnými potrebami (vlastné číslovanie faktúr, multi-tenant toky, B2B zmluvné ceny). Ukážka volaní:

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

### Normalizácia SKU

Eshop má SKU `PROD-001`, Pohoda ho má ako `PROD001` (bez pomlčky). Synchronizácia zlyhá potichu — nespáruje sa. Riešenie:

```php
function normalize_sku($sku) {
    return strtoupper(preg_replace('/[^A-Z0-9]/i', '', $sku));
}
```

Aplikuj ju pri každom párovaní v oboch smeroch.

### Prepočty meny

Pohoda v CZK, eshop v EUR. mServer má kurz, ale **kurzový rozdiel medzi dňom objednávky a dňom vystavenia faktúry** môže spôsobiť rozdiel pár centov. Pri daňovej kontrole ti to vie narobiť problém. Riešenie: pri vystavení faktúry posielaj explicitný `exchangeRate` z dňa objednávky.

### Toky vrátenia tovaru a refundácie

Eshop vytvorí refundáciu → ako ju dostať do účtovníctva? Dve možnosti:
1. **Záporná objednávka** (záporné množstvá) — Pohoda ju akceptuje, ale používateľsky je to čudné.
2. **Dobropis (credit note)** — správne riešenie, ale zložitejšie XML.

Vyrobil som vlastný handler pre dobropisy v Pohode:

```php
add_action('woocommerce_order_refunded', function($order_id, $refund_id) {
    $refund = wc_get_order($refund_id);
    $original = wc_get_order($order_id);
    $xml = firma_build_pohoda_credit_note_xml($refund, $original);
    firma_send_to_pohoda($xml);
}, 10, 2);
```

## Kedy sa oplatí zákazkové riešenie vs. platený plugin

**Plugin (€99/rok):** klient má štandardné potreby, počet objednávok < 1000/mesiac, žiadne vlastné číslovanie faktúr, štandardná slovenská 23 % DPH. Úspora: ~40 dev hodín = ~€2-3k.

**Zákazkové riešenie:** klient má B2B so zmluvnými cenami, viac mien, vlastné formáty faktúr, integráciu s 3+ ďalšími systémami (CRM, WMS, ERP). Plugin to nepokryje, zákazkový vývoj dáva zmysel. Reálny rozpočet: 60-120 hodín na začiatku + 10 h/mesiac na údržbu.

## Zhrnutie

Pre eshopy s Pohodou: XML rozhranie mServera + systémový cron + WP REST endpoint, posielanie objednávok každú hodinu, sťahovanie stavu skladu 2× denne. Pre Money S3: hotový konektor pre 90 % prípadov, zákazková integrácia cez API len pre B2B a viac-menové okrajové prípady. Najčastejšie chyby: nespárované SKU, kurzové rozdiely, nepripravený tok refundácií. Naplánuj si logiku opakovaných pokusov pri zámkoch databázy v Pohode — nie je to voliteľné.
