---
title: "Schema.org for a small eshop: ready-made JSON-LD templates"
date: 2026-04-09
read: 8
tags: ["SEO", "WooCommerce"]
excerpt: "Five ready-to-paste JSON-LD blocks — Product, BreadcrumbList, Organization, WebSite, LocalBusiness. Plus validation and the most common mistakes."
featured: false
---

Structured data for an eshop = rich results in the SERP = a higher CTR. In 2026, no eshop that's serious about this should be running without these five schema blocks. Here are ready-made templates you can copy and tweak to fit your project.

Everything is in JSON-LD (which Google prefers) and goes into the `<head>` via `<script type="application/ld+json">`. In WordPress, through the `wp_head` hook or via Yoast SEO Premium / Rank Math. In Astro or Next.js, straight into the `<head>`. If you want the bigger picture of where structured data sits, it's one item on my [technical SEO checklist that actually moves the needle](/en/blog/seo-checklist-co-pomaha/).

## 1. Product (on the product detail page)

```json
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Pánska bavlnená košeľa modrá",
  "image": [
    "https://example.sk/images/kosela-modra-1.jpg",
    "https://example.sk/images/kosela-modra-2.jpg",
    "https://example.sk/images/kosela-modra-detail.jpg"
  ],
  "description": "Pánska košeľa zo 100% bavlny, slim fit strih, dlhý rukáv. Vhodná na bežné aj formálne nosenie.",
  "sku": "KOSELA-MOD-M-001",
  "mpn": "KOSELA-MOD-M-001",
  "brand": {
    "@type": "Brand",
    "name": "Modulario"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://example.sk/produkt/kosela-modra/",
    "priceCurrency": "EUR",
    "price": "39.90",
    "priceValidUntil": "2026-12-31",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition",
    "seller": {
      "@type": "Organization",
      "name": "Modulario s.r.o."
    },
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingRate": {
        "@type": "MonetaryAmount",
        "value": "3.50",
        "currency": "EUR"
      },
      "shippingDestination": {
        "@type": "DefinedRegion",
        "addressCountry": "SK"
      },
      "deliveryTime": {
        "@type": "ShippingDeliveryTime",
        "businessDays": {
          "@type": "QuantitativeValue",
          "minValue": 1,
          "maxValue": 3
        }
      }
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.6",
    "reviewCount": "23"
  },
  "review": [
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "Peter K." },
      "datePublished": "2026-03-15",
      "reviewRating": { "@type": "Rating", "ratingValue": "5" },
      "reviewBody": "Sedí presne, materiál kvalitný."
    }
  ]
}
```

**Most common mistakes:**
- `priceCurrency` must be an ISO 4217 code (EUR, CZK, USD), not "€"
- `availability` must be one of the [enum values](https://schema.org/ItemAvailability) — `InStock`, `OutOfStock`, `PreOrder`
- `image` at least 1, ideally more — Google recommends supplying several aspect ratios: 16:9, 4:3, and 1:1
- `priceValidUntil` should be set for a sale price — that's how Google reads the discount as temporary. Watch out: a stale date from a long-finished sale signals to Google that the price no longer applies
- `aggregateRating` only if you have REAL reviews. Fake reviews in the schema = a manual penalty

## 2. BreadcrumbList (on all categories and products)

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Domov",
      "item": "https://example.sk/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Pánske oblečenie",
      "item": "https://example.sk/panske-oblecenie/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Košele",
      "item": "https://example.sk/panske-oblecenie/kosele/"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "Pánska bavlnená košeľa modrá"
    }
  ]
}
```

**Tip:** on the last item (the current page) you can omit the `item` URL — Google then uses the URL of the page itself. Including it is fine too, but I prefer to leave it off so the schema mirrors the visible breadcrumbs exactly.

## 3. Organization (on the homepage)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://example.sk/#organization",
  "name": "Modulario s.r.o.",
  "url": "https://example.sk",
  "logo": {
    "@type": "ImageObject",
    "url": "https://example.sk/logo.png",
    "width": 600,
    "height": 200
  },
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "telephone": "+421-2-12345678",
      "contactType": "customer service",
      "areaServed": "SK",
      "availableLanguage": ["Slovak", "Czech", "English"]
    }
  ],
  "sameAs": [
    "https://www.facebook.com/modulario",
    "https://www.instagram.com/modulario",
    "https://www.linkedin.com/company/modulario"
  ]
}
```

The `sameAs` field matters — it links the entity in the "knowledge graph" across social platforms. Google uses it to confirm the brand's identity.

## 4. WebSite with SearchAction (on the homepage)

Google uses this for the **sitelinks searchbox** — a search field directly in the SERP under your homepage result.

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://example.sk",
  "name": "Modulario",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://example.sk/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

`urlTemplate` must point at your existing search URL. In WooCommerce, the default is `?s={search_term_string}&post_type=product`.

## 5. LocalBusiness (if you have a brick-and-mortar store)

```json
{
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  "@id": "https://example.sk/#store",
  "name": "Modulario flagship store Bratislava",
  "image": "https://example.sk/store-photo.jpg",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Obchodná 25",
    "addressLocality": "Bratislava",
    "postalCode": "81106",
    "addressCountry": "SK"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 48.149123,
    "longitude": 17.107456
  },
  "telephone": "+421905123456",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
      "opens": "10:00",
      "closes": "19:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Saturday",
      "opens": "10:00",
      "closes": "14:00"
    }
  ],
  "url": "https://example.sk"
}
```

Pick the most specific usable `@type` you can — `ClothingStore`, `BookStore`, `ElectronicsStore`. If nothing fits, fall back to `Store` or `LocalBusiness`. If you run a physical shop, this block pairs naturally with your Google Business Profile work — I go deeper on that in [local SEO for Bratislava, and what actually makes a difference in 2026](/en/blog/local-seo-bratislava/).

## Validation

Always verify with **two** tools:

1. **[validator.schema.org](https://validator.schema.org)** — syntax + recommended fields
2. **[Google Rich Results Test](https://search.google.com/test/rich-results)** — whether Google parses it and what type of rich result it sees

For ongoing monitoring: **Google Search Console** (you'll find the structured-data reports under *Shopping* / *Enhancements*) shows how many pages have a recognized schema type and how many have errors. At larger scale (an eshop with 5,000 products), that's essential.

## WordPress / WooCommerce setup

**Option A: Yoast SEO Premium** — generates `Product`, `BreadcrumbList`, `Organization`, and `WebSite` automatically. EUR 118.80/year (excl. VAT, for a single domain). Enough for 90% of WooCommerce eshops.

**Option B: Rank Math** — the free plan has a lot of schema features (18 predefined types + custom JSON-LD). Rank Math PRO costs EUR 71.88/year (EUR 5.99/month billed annually).

**Option C: a custom solution** via the `wp_head` hook, if you have specific needs:

```php
add_action('wp_head', function() {
    if (is_product()) {
        global $product;
        $schema = [
            '@context' => 'https://schema.org/',
            '@type' => 'Product',
            'name' => $product->get_name(),
            'sku' => $product->get_sku(),
            'image' => wp_get_attachment_url($product->get_image_id()),
            'description' => $product->get_short_description(),
            'offers' => [
                '@type' => 'Offer',
                'price' => $product->get_price(),
                'priceCurrency' => 'EUR',
                'availability' => $product->is_in_stock()
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
                'url' => get_permalink($product->get_id()),
            ],
        ];
        echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_SLASHES) . '</script>';
    }
});
```

The `JSON_UNESCAPED_SLASHES` flag matters — without it you get escaped slashes in URLs, which Google's parser does accept, but it looks ugly in the DOM inspector.

## TL;DR

Five schema types cover 95% of an eshop's needs: Product, BreadcrumbList, Organization, WebSite, LocalBusiness. The ready-made JSON-LD templates above are production-ready. The key mistakes to watch for: ISO currency codes, the enum for `availability`, `priceValidUntil` on a sale, and no fake reviews. Before you ship, validate through schema.org + the Google Rich Results Test.

Related: [technical SEO checklist that actually moves the needle](/en/blog/seo-checklist-co-pomaha/) · [Core Web Vitals on an eshop: which pages to fix first](/en/blog/cwv-eshop-priorita/)
