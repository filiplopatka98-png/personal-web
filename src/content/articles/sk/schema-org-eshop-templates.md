---
title: "Schema.org pre malý eshop: hotové JSON-LD šablóny"
date: 2026-04-09
read: 8
tags: ["SEO", "WooCommerce"]
excerpt: "Päť hotových JSON-LD blokov na skopírovanie — Product, BreadcrumbList, Organization, WebSite, LocalBusiness. Plus validácia a najčastejšie chyby."
featured: false
---

Štruktúrované dáta pre eshop = rich results v SERPe = vyšší CTR. V roku 2026 by žiadny eshop, ktorý to myslí vážne, nemal byť bez týchto piatich schema blokov. Tu sú hotové šablóny, ktoré si môžeš skopírovať a doladiť pod svoj projekt.

Všetko je vo formáte JSON-LD (ktorý Google preferuje) a vkladá sa do `<head>` cez `<script type="application/ld+json">`. Vo WordPresse cez hook `wp_head` alebo cez Yoast SEO Premium / Rank Math. V Astre či Next.js priamo do `<head>`. Ak chceš väčší obraz, kam štruktúrované dáta zapadajú, sú jednou položkou v mojom [technickom SEO checkliste, ktorý ozaj merateľne pomáha](/blog/seo-checklist-co-pomaha/).

## 1. Product (na detail produktu)

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

**Najčastejšie chyby:**
- `priceCurrency` musí byť kód podľa ISO 4217 (EUR, CZK, USD), nie „€“
- `availability` musí byť jedna z [enum hodnôt](https://schema.org/ItemAvailability) — `InStock`, `OutOfStock`, `PreOrder`
- `image` aspoň 1, ideálne viac — Google odporúča dodať viac pomerov strán: 16:9, 4:3 aj 1:1
- `priceValidUntil` uveď pri akciovej cene — Google tak číta zľavu ako dočasnú. Pozor: neaktuálny dátum z dávno skončenej akcie signalizuje Googlu, že cena už neplatí
- `aggregateRating` len ak máš REÁLNE recenzie. Vymyslené recenzie v schéme = ručná penalizácia

## 2. BreadcrumbList (na všetkých kategóriách aj produktoch)

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

**Tip:** pri poslednej položke (aktuálna stránka) môžeš `item` URL vynechať — Google vtedy použije URL samotnej stránky. Uviesť ju je tiež v poriadku, ale ja ju radšej vynechávam, nech schéma presne kopíruje viditeľné omrvinky.

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

Pole `sameAs` je dôležité — prepája entitu v „knowledge graphe“ naprieč sociálnymi platformami. Google to používa na potvrdenie identity značky.

## 4. WebSite so SearchAction (na homepage)

Toto Google používa pre **sitelinks searchbox** — vyhľadávacie pole priamo v SERPe pod výsledkom tvojej homepage.

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

`urlTemplate` musí ukazovať na tvoju existujúcu vyhľadávaciu URL. Pri WooCommerce je predvolená `?s={search_term_string}&post_type=product`.

## 5. LocalBusiness (ak máš kamennú predajňu)

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

`@type` zvoľ čo najšpecifickejší z použiteľných — `ClothingStore`, `BookStore`, `ElectronicsStore`. Ak nič nesedí, siahni po `Store` alebo `LocalBusiness`. Ak máš kamennú predajňu, tento blok prirodzene ladí s prácou na Google Business Profile — viac o tom rozpisujem v článku o [local SEO pre Bratislavu a čo robí rozdiel v 2026](/blog/local-seo-bratislava/).

## Validation

Vždy over cez **dva** nástroje:

1. **[validator.schema.org](https://validator.schema.org)** — syntax + odporúčané polia
2. **[Google Rich Results Test](https://search.google.com/test/rich-results)** — či to Google parsuje a aký typ rich result vidí

Na priebežné sledovanie: **Google Search Console** (reporty štruktúrovaných dát nájdeš v sekcii *Shopping* / *Vylepšenia*) zobrazí, koľko stránok má rozpoznaný schema typ a koľko má chyby. Pri väčšom rozsahu (eshop s 5000 produktmi) je to kľúčové.

## WordPress / WooCommerce setup

**Voľba A: Yoast SEO Premium** — generuje `Product`, `BreadcrumbList`, `Organization`, `WebSite` automaticky. 118,80 EUR/rok (bez DPH, na jednu doménu). Pre 90 % WooCommerce eshopov stačí.

**Voľba B: Rank Math** — free plán má veľa schema funkcií (18 predvolených typov + vlastné JSON-LD). Rank Math PRO stojí 71,88 EUR/rok (5,99 EUR/mesiac účtované ročne).

**Voľba C: vlastné riešenie** cez hook `wp_head`, ak máš špecifické potreby:

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

Flag `JSON_UNESCAPED_SLASHES` je dôležitý — bez neho dostaneš escapované lomítka v URL, čo Google parser síce akceptuje, ale v DOM inspektore to vyzerá škaredo.

## TL;DR

Päť schema typov pokrýva 95 % potrieb eshopu: Product, BreadcrumbList, Organization, WebSite, LocalBusiness. Hotové JSON-LD šablóny vyššie sú pripravené na produkciu. Kľúčové chyby, na ktoré si dať pozor: kód meny podľa ISO, enum pre `availability`, `priceValidUntil` pri akcii a žiadne vymyslené recenzie. Pred nasadením validuj cez schema.org + Google Rich Results Test.

Súvisiace: [technické SEO checklist, ktorý ozaj merateľne pomáha](/blog/seo-checklist-co-pomaha/) · [Core Web Vitals na eshope: ktoré stránky riešiť ako prvé](/blog/cwv-eshop-priorita/)
