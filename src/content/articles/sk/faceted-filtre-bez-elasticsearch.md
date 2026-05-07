---
title: "Faceted filtre na eshope, ktoré nelagnú — bez ElasticSearch"
date: 2025-11-18
read: 8
tags: ["WooCommerce", "Performance"]
excerpt: "Pre 5000-50000 produktov nemusíš kupovať ElasticSearch hosting. Štyri kroky, ktoré dostali response z 4.2s na 280ms na čistom WooCommerce."
featured: false
---

Klient mal 18 000 produktov, šesť atribútov filtra (značka, farba, materiál, cena, dostupnosť, štítok) a stránka dýchala 4.2s na každom kliknutí filtra. ElasticSearch by to vyriešil — ale aj naložil €40-80/mesiac do hostingu plus udržiavacia robota. Skúsili sme štyri kroky bez ES. Skončili sme na **280ms response** a klient ušetril €600/rok.

## Krok 1: Database indexy na `wp_postmeta`

WooCommerce drží atribúty produktu v `wp_postmeta`. Default schema má index na `(meta_key)` a `(post_id)`, ale **nie na `(meta_key, meta_value)` composite**. Pri filtri typu "značka = Adidas" Mysql robí filesort na 200 000 riadkoch.

```sql
CREATE INDEX idx_postmeta_key_value
ON wp_postmeta (meta_key, meta_value(20));

CREATE INDEX idx_postmeta_value_partial
ON wp_postmeta (meta_value(20));
```

**Nepoužívaj full-length index na `meta_value`** — je to TEXT/LONGTEXT a indexovanie celej hodnoty zožerie 200+ MB. Stačí `(20)` prefix pre 95 % použitia.

Po týchto dvoch indexoch náš query čas spadol z **2.8s na 320ms** bez ďalších zmien. Spusti `EXPLAIN SELECT ...` na hlavnom WP_Query a uvidíš `Using index` namiesto `Using filesort`.

## Krok 2: Pre-computed term counts cez transient cache

V sidebare filtra ukazuješ `Adidas (142)`, `Nike (97)`, `Puma (38)`. Ak to počítaš pri každom request-e, robíš `COUNT(*)` cez post_meta JOIN — lagy.

Spočítaj raz, ulož do transientu:

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

A invaliduj len keď sa naozaj niečo zmení:

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

Default WooCommerce filtering robí full page reload — server musí znova vyrenderovať header, footer, sidebar. Trápenie. Spravme AJAX endpoint, ktorý vráti len HTML grid produktov + nové count čísla:

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

Klient strana s `300ms` debounce, aby sa nepálili requesty pri rýchlom klikaní:

```js
let timer;
const onFilterChange = () => {
  clearTimeout(timer);
  timer = setTimeout(() => fetchProducts(getFilterState()), 300);
};
```

## Krok 4: URL state cez `history.pushState`

Užívateľ chce **zdielať** odkaz na filtrovaný výsledok. A používať **back button**. Pridaj URL state:

```js
function updateUrl(filterState) {
  const params = new URLSearchParams(filterState);
  history.pushState(filterState, '', `?${params}`);
}

window.addEventListener('popstate', (e) => {
  if (e.state) applyFilterState(e.state);
});
```

A pri page load číta `URLSearchParams` a aplikuje stav. Tým máš sharable + back-button-friendly bez routera.

## Výsledky a kedy stále zvážiť ES

Reálne výsledky na 18 000 produktov:

- **Pred:** 4.2s response na filter, 2.8s len na DB query.
- **Po krokoch 1+2:** 720ms response.
- **Po krokoch 3+4:** 280ms (a žiadny page reload, pocit appky).

Kedy by som siahol po ElasticSearch napriek tomu:

1. **Full-text vyhľadávanie** s typo-tolerance a synonymami — MySQL FULLTEXT je slabučký.
2. **Nad 100 000 produktov** — composite index prestane škálovať.
3. **Multi-language search** s morfológiou (skloňovanie v slovenčine je peklo).

Pod 50 000 produktov si pohodlne vystačíš so štyrmi krokmi vyššie. ES si nechaj na moment, keď budeš mať na to dôvod, nielen feeling že "to tak treba".
