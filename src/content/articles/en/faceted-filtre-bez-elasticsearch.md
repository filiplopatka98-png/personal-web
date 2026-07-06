---
title: "Faceted Filters That Don't Lag on a Store — Without Elasticsearch"
date: 2025-11-18
read: 8
tags: ["WooCommerce", "Performance"]
excerpt: "For 5,000–50,000 products you don't need to pay for Elasticsearch hosting. Four steps that cut response time from 4.2s to 280ms on plain WooCommerce."
featured: false
---

The client had 18,000 products, six filter attributes (brand, color, material, price, availability, tag), and the page took a 4.2s breath on every filter click. Elasticsearch would have fixed it — but it would also add 40–80 EUR/month in hosting plus the maintenance headache. We tried four steps without it. We landed at a **280ms response** and the client saved 600 EUR/year.

## Step 1: Database indexes on `wp_postmeta`

WooCommerce keeps a lot of filterable product data in `wp_postmeta` (price, stock, custom attributes). The default schema has an index on `(meta_key)` and `(post_id)`, but **no composite index on `(meta_key, meta_value)`**. So for a "price from–to" filter, MySQL runs a filesort over 200,000 rows.

```sql
CREATE INDEX idx_postmeta_key_value
ON wp_postmeta (meta_key, meta_value(20));

CREATE INDEX idx_postmeta_value_partial
ON wp_postmeta (meta_value(20));
```

**Don't index `meta_value` at full length** — it's a `LONGTEXT`, so MySQL won't even let you create an index without a prefix, and indexing the whole value would eat 200+ MB. A `(20)` prefix covers 95% of the usage.

After these two indexes, our query time dropped from **2.8s to 320ms** with no other changes. Run `EXPLAIN SELECT ...` on the main `WP_Query` and you'll see `Using index` instead of `Using filesort`.

## Step 2: Pre-computed term counts via transient cache

In the filter sidebar you show `Adidas (142)`, `Nike (97)`, `Puma (38)`. If you compute that on every request, you're running a `COUNT(*)` through a JOIN on `postmeta` — and it stutters.

Compute it once and stash it in a transient:

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

And invalidate it only when something actually changes:

```php
add_action('woocommerce_update_product', function($product_id) {
  delete_transient('filter_counts_pa_brand');
  delete_transient('filter_counts_pa_color');
  // other attributes
});

add_action('woocommerce_product_set_stock', function($product) {
  // stock-based filter (in stock / out of stock)
  delete_transient('filter_counts_stock');
});
```

## Step 3: AJAX endpoint with debounce, not a full reload

WooCommerce's default filtering does a full page reload — the server has to re-render the header, footer, and sidebar all over again. Painful. Let's build an AJAX endpoint that returns only the product grid HTML and the new counts:

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

On the client side, a `300 ms` debounce so rapid clicking doesn't fire off pointless requests:

```js
let timer;
const onFilterChange = () => {
  clearTimeout(timer);
  timer = setTimeout(() => fetchProducts(getFilterState()), 300);
};
```

## Step 4: URL state via `history.pushState`

Users want to **share** a link to a filtered result. And to use the **Back button**. Push the state into the URL:

```js
function updateUrl(filterState) {
  const params = new URLSearchParams(filterState);
  history.pushState(filterState, '', `?${params}`);
}

window.addEventListener('popstate', (e) => {
  if (e.state) applyFilterState(e.state);
});
```

And on page load, read `URLSearchParams` and apply the state. Now you've got shareable links and a working Back button — no router required.

## Results and when to still consider ES

Real-world results on 18,000 products:

- **Before:** 4.2s filter response, 2.8s for the DB query alone.
- **After steps 1 + 2:** 720ms response.
- **After steps 3 + 4:** 280ms (and no page reload, an app-like feel).

When I'd still reach for Elasticsearch anyway:

1. **Full-text search** with typo tolerance and synonyms — MySQL FULLTEXT is feeble.
2. **Over 100,000 products** — the composite index stops scaling.
3. **Multilingual search** with morphology (Slovak inflection is hell).

Under 50,000 products you'll get by comfortably with the four steps above. Save Elasticsearch for the moment you've got a real reason for it — not just a feeling that "that's how it's supposed to be done."

---

**Related:** [INP under 200ms on WordPress](/en/blog/inp-pod-200ms-wordpress/) · [Core Web Vitals on a store: which pages to fix first](/en/blog/cwv-eshop-priorita/) · [Plugin diet: from 28 to 9 and the site sped up 60%](/en/blog/plugin-dieta-z-28-na-9/)
