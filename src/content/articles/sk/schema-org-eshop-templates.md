---
title: "Schema.org pre malý eshop: hotové JSON-LD šablóny"
date: 2026-04-09
read: 8
tags: ["SEO", "WooCommerce"]
excerpt: "Päť hotových JSON-LD blokov na copy-paste — Product, BreadcrumbList, Organization, WebSite, LocalBusiness. Plus validation a common pitfalls."
featured: false
---

Structured data pre eshop = rich results v SERPe = vyšší CTR. V 2026 by žiadny serious eshop nemal byť bez týchto piatich schema blokov. Tu sú hotové šablóny, ktoré si môžeš copy-paste-núť a doladiť pod svoj projekt.

Všetko je vo formáte JSON-LD (Google preferred), ktorý sa vkladá do `<head>` cez `<script type="application/ld+json">`. Pre WordPress cez `wp_head` hook alebo Yoast SEO Premium / RankMath. Pre Astro/Next.js do `<head>` priamo.

## 1. Product (na product detail page)

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

**Common pitfalls:**
- `priceCurrency` musí byť ISO 4217 (EUR, CZK, USD), nie "€"
- `availability` jeden z [enum hodnôt](https://schema.org/ItemAvailability) — `InStock`, `OutOfStock`, `PreOrder`
- `image` aspoň 1, ideálne viac — Google preferuje 16:9 + 4:3 + 1:1
- `priceValidUntil` povinne ak máš sale price — bez toho Google nezobrazí rich price
- `aggregateRating` len ak máš REÁLNE recenzie. Fake reviews v schema = manual penalty

## 2. BreadcrumbList (na všetkých kategóriách + produktoch)

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

**Pitfall:** posledná položka (current page) NEMÁ mať `item` URL. Google to chce takto, inak warning v Search Console.

## 3. Organization (na homepage)

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

`sameAs` array je dôležitý — linkuje "knowledge graph" entity naprieč sociálnymi platformami. Google to používa pre brand identity confidence.

## 4. WebSite so SearchAction (na homepage)

Toto Google používa pre **sitelinks search box** — search box priamo v SERPe pod tvojím homepage výsledkom.

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

`urlTemplate` musí ukazovať na tvoju existujúcu search URL. Pre WooCommerce default `?s={query}&post_type=product`.

## 5. LocalBusiness (ak máš kamenné)

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

`@type` zvol najšpecifickejší aplikovateľný — `ClothingStore`, `BookStore`, `ElectronicsStore`. Ak nič nesedí, fallback `Store` alebo `LocalBusiness`.

## Validation

Vždy preveríš cez **dva** nástroje:

1. **[validator.schema.org](https://validator.schema.org)** — syntax + recommended fields
2. **[Google Rich Results Test](https://search.google.com/test/rich-results)** — či to Google parsuje a aký rich result type vidí

Pre live monitoring: **Google Search Console → Enhancements** zobrazí, koľko stránok má detected schema typ a koľko má errors. Critical pri scale (eshop s 5000 produktov).

## WordPress / WooCommerce setup

**Voľba A: Yoast SEO Premium** — generuje `Product`, `BreadcrumbList`, `Organization`, `WebSite` automaticky. €99/rok. Pre 90 % WooCommerce eshopov stačí.

**Voľba B: RankMath** — free plan má veľa schema features. Premium €59/rok.

**Voľba C: Custom** cez `wp_head` hook ak máš špecifické needs:

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

`JSON_UNESCAPED_SLASHES` flag je dôležitý — bez neho dostaneš escaped URLs, čo Yoast/Google parser akceptuje, ale je škaredé na DOM inspect.

## TL;DR

Päť schema typov pokrýva 95 % eshop potrieb: Product, BreadcrumbList, Organization, WebSite, LocalBusiness. Hotové JSON-LD šablóny vyššie sú production-ready. Kľúčové pitfalls: ISO currency code, `availability` enum, `priceValidUntil` pri sale, žiadne fake reviews. Validuj cez schema.org + Google Rich Results Test pred deploy.
