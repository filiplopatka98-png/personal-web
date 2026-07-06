---
title: "Faceted filtre na eshope, ktoré nelagnú — bez ElasticSearch"
date: 2025-11-18
read: 8
tags: ["WooCommerce", "Performance"]
excerpt: "Pre 5 000 – 50 000 produktov nemusíš kupovať Elasticsearch hosting. Štyri kroky, ktoré zrazili odozvu zo 4,2 s na 280 ms na čistom WooCommerce."
featured: false
---

Klient mal 18 000 produktov, šesť atribútov filtra (značka, farba, materiál, cena, dostupnosť, štítok) a stránka sa nadýchla 4,2 s pri každom kliknutí na filter. Elasticsearch by to vyriešil — ale zároveň by pridal 40 – 80 EUR/mesiac na hostingu plus starosti s údržbou. Skúsili sme štyri kroky bez neho. Skončili sme na **odozve 280 ms** a klient ušetril 600 EUR/rok.

## Krok 1: Databázové indexy na `wp_postmeta`

WooCommerce drží veľa filtrovateľných dát produktu v `wp_postmeta` (cena, sklad, vlastné atribúty). Predvolená schéma má index na `(meta_key)` a `(post_id)`, ale **nie composite index na `(meta_key, meta_value)`**. Pri filtri typu „cena od–do“ tak MySQL robí filesort na 200 000 riadkoch.

```sql
CREATE INDEX idx_postmeta_key_value
ON wp_postmeta (meta_key, meta_value(20));

CREATE INDEX idx_postmeta_value_partial
ON wp_postmeta (meta_value(20));
```

**Neindexuj `meta_value` v plnej dĺžke** — je to `LONGTEXT`, takže MySQL ti index bez prefixu ani nedovolí vytvoriť, a indexovanie celej hodnoty by zožralo 200+ MB. Prefix `(20)` pokryje 95 % použitia.

Po týchto dvoch indexoch nám čas dopytu spadol z **2,8 s na 320 ms** bez ďalších zmien. Spusti `EXPLAIN SELECT ...` na hlavnom `WP_Query` a uvidíš `Using index` namiesto `Using filesort`.

## Krok 2: Pre-computed term counts cez transient cache

V bočnom paneli filtra ukazuješ `Adidas (142)`, `Nike (97)`, `Puma (38)`. Ak to počítaš pri každej požiadavke, robíš `COUNT(*)` cez JOIN na `postmeta` — a to seká.

Spočítaj to raz a ulož do transientu:

```php
function get_filter_counts($attribute) {
  $key = "filter_counts_{$attribute}";
  $counts = get_transient($key);

  if (false === $counts) {
    global $wpdb;
    $counts = $wpdb->get_results($wpdb->prepare("
      SELECT pm.meta_value, COUNT(*) as cnt
      FROM {$wpdb->postmeta} pm
      JOIN {$wpdb->posts} p ON p.ID = pm.post_id
      WHERE pm.meta_key = %s
        AND p.post_status = 'publish'
        AND p.post_type = 'product'
      GROUP BY pm.meta_value
    ", $attribute), OBJECT_K);

    set_transient($key, $counts, DAY_IN_SECONDS);
  }
  return $counts;
}
```

A invaliduj ho len vtedy, keď sa naozaj niečo zmení:

```php
add_action('woocommerce_update_product', function($product_id) {
  delete_transient('filter_counts_pa_brand');
  delete_transient('filter_counts_pa_color');
  // ostatné atribúty
});

add_action('woocommerce_product_set_stock', function($product) {
  // stock-based filter (in stock / out of stock)
  delete_transient('filter_counts_stock');
});
```

## Krok 3: AJAX endpoint s debounce, nie full reload

Predvolené filtrovanie vo WooCommerce robí kompletný reload stránky — server musí znova vyrenderovať hlavičku, pätičku aj bočný panel. Utrpenie. Spravme AJAX endpoint, ktorý vráti len HTML mriežku produktov a nové čísla počtov:

```php
add_action('wp_ajax_filter_products', 'filter_products_ajax');
add_action('wp_ajax_nopriv_filter_products', 'filter_products_ajax');

function filter_products_ajax() {
  $args = [
    'post_type' => 'product',
    'posts_per_page' => 24,
    'tax_query' => build_tax_query_from_request(),
    'meta_query' => build_meta_query_from_request(),
  ];

  $query = new WP_Query($args);

  ob_start();
  while ($query->have_posts()) {
    $query->the_post();
    wc_get_template_part('content', 'product');
  }
  wp_send_json([
    'html' => ob_get_clean(),
    'total' => $query->found_posts,
    'counts' => get_all_filter_counts(),
  ]);
}
```

Na strane klienta `300 ms` debounce, aby sa pri rýchlom klikaní nepálili zbytočné požiadavky:

```js
let timer;
const onFilterChange = () => {
  clearTimeout(timer);
  timer = setTimeout(() => fetchProducts(getFilterState()), 300);
};
```

## Krok 4: URL state cez `history.pushState`

Používateľ chce **zdieľať** odkaz na filtrovaný výsledok. A používať **tlačidlo Späť**. Pridaj stav do URL:

```js
function updateUrl(filterState) {
  const params = new URLSearchParams(filterState);
  history.pushState(filterState, '', `?${params}`);
}

window.addEventListener('popstate', (e) => {
  if (e.state) applyFilterState(e.state);
});
```

A pri načítaní stránky prečíta `URLSearchParams` a aplikuje stav. Tým máš zdieľateľné odkazy aj funkčné tlačidlo Späť — bez routera.

## Výsledky a kedy stále zvážiť ES

Reálne výsledky na 18 000 produktov:

- **Pred:** 4,2 s odozva na filter, 2,8 s len samotný DB dopyt.
- **Po krokoch 1 + 2:** 720 ms odozva.
- **Po krokoch 3 + 4:** 280 ms (a žiadny reload stránky, pocit aplikácie).

Kedy by som po Elasticsearchi siahol napriek tomu:

1. **Fulltextové vyhľadávanie** s toleranciou preklepov a synonymami — MySQL FULLTEXT je slabučký.
2. **Nad 100 000 produktov** — composite index prestane škálovať.
3. **Viacjazyčné vyhľadávanie** s morfológiou (skloňovanie v slovenčine je peklo).

Pod 50 000 produktov si so štyrmi krokmi vyššie pohodlne vystačíš. Elasticsearch si nechaj na chvíľu, keď budeš mať na to dôvod — nie len pocit, že „to tak treba“.

---

**Súvisiace:** [INP pod 200ms na WordPresse](/blog/inp-pod-200ms-wordpress/) · [Core Web Vitals na eshope: ktoré stránky riešiť ako prvé](/blog/cwv-eshop-priorita/) · [Plugin diéta: z 28 na 9 a web zrýchlel o 60 %](/blog/plugin-dieta-z-28-na-9/)
