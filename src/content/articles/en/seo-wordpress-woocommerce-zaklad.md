---
title: "SEO for WordPress and WooCommerce: the technical foundation to get right"
date: 2026-11-18
read: 7
tags: ["SEO", "WooCommerce", "WordPress"]
excerpt: "SEO for WordPress and WooCommerce stores: duplicate URLs from filters, indexing, redirects after a migration and speed. A process from real stores."
metaDescription: "SEO for WordPress and WooCommerce: filters and duplicates, canonical URLs, sitemaps, redirects after migration and speed. A practical process."
featured: false
faq:
  - q: "Is WordPress good for SEO?"
    a: "Yes, but the foundation does not set itself up. You need an SEO plugin (Yoast or Rank Math), clean permalinks, a sensible sitemap, fast hosting and a check on what actually gets indexed."
  - q: "What is the most common WooCommerce SEO problem?"
    a: "Duplicate and unnecessary URLs: filters and sorting (?orderby, ?min_price), variations, tags and pagination. Google finds them and crawls them instead of your important categories and products."
  - q: "Should I redirect everything to the homepage when migrating a store?"
    a: "No. Redirect old URLs with a 301 to their new equivalent. If there is no equivalent (a discontinued brand or product), return a 410 rather than mass-redirecting to the homepage."
  - q: "How much does a WooCommerce SEO audit cost?"
    a: "I do a basic audit of a small website (up to about 10 pages) for €99. Stores with a larger catalogue are quoted by scope."
---

With WordPress and WooCommerce the SEO problem is rarely "too little text". It is **control over what Google can see**. A store can generate thousands of URLs nobody searches for, and they compete with the categories and products that actually earn money. This is the order in which I go through real stores. For the general process see the [SEO optimization guide](/en/blog/seo-optimalizacia-webu-navod/); here is only what is specific to WordPress and WooCommerce.

## 1. Check what is in the index

Start in Search Console: *Indexing → Pages*. See which types of URLs are there and which are missing. On a store you often find filters, sorting and tags in the index while an important category waits as "Discovered, currently not indexed". On a new or freshly migrated site there are many such URLs, and it is a crawling problem, not a content problem.

## 2. Remove duplicates from filters and sorting

WooCommerce adds parameters such as `?orderby=price`, `?min_price=10` or `?filter_color=blue`. Every combination is a new URL to Google.

- Check that filters and sorting have a **canonical pointing to the clean category** (an SEO plugin usually handles it, but verify).
- If you use AJAX filters, check what gets written to the URL after a click.
- Do not add a blanket `Disallow` for parameters in `robots.txt`: Google then cannot see the canonical or `noindex` and may still show the URL.
- Cart, checkout and my account should stay out of the index. Yoast and Rank Math usually set that, but look at the page source.

## 3. Categories matter more than products

People search for "leather bags", not a product code. A category is usually the strongest page of a store. Give it its own title, meta description and a short intro above the products (not 2,000 characters below them where nobody reads it). Empty and duplicate tags are better kept out of the index.

## 4. A sitemap with only what you want in Google

The sitemap should hold indexable URLs: products, categories, pages, articles. Tags, attachments, author archives and `noindex` URLs do not belong there. After a change, check that every URL in the sitemap returns 200 and has the right canonical.

## 5. Migration: redirects decide everything

The most expensive SEO mistake on a store is a migration without redirects. On a large-catalogue store I moved from OpenCart to WooCommerce, roughly 180 thousand collected URLs turned into about 107 thousand rules. Here is what I did:

- **301** for URLs that have a new equivalent,
- **410** for discontinued brands and URLs without a replacement,
- **no 301 to the homepage** for everything not found: Google often treats that as a "soft 404",
- skip attack URLs (random parameters, spam) instead of redirecting them.

For a smaller migration the same principle holds: first a map of old URLs, then redirects, then launch.

## 6. Speed costs both SEO and sales

A slow store fails on mobile LCP and people leave before buying. The usual causes are images without dimensions, too many plugins and weak hosting. The breakdown is in [LCP over 2.5 s: causes](/en/blog/lcp-nad-2-5s-pricin/) and hosting is covered in [Slovak hosting: performance](/en/blog/hostingy-sk-vykon/). Watch the cache too: if every update clears all of it and it does not refill, the visitor gets a slow page. On one client site the whole cache was being cleared daily because of automatic translation updates. The fix was not the content but the purge settings.

## 7. Structured data and breadcrumbs

A product with price and availability (`Product`) and breadcrumbs (`BreadcrumbList`) help Google understand the page and improve how it appears in results. An SEO plugin usually generates them; test them in the Rich Results Test and in Search Console.

## 8. Measure in weeks, not days

After a change, watch the number of indexed URLs, impressions and CTR in Search Console. First effects usually show after 3 to 6 months, later for new domains.

## Want to go through your own store?

I do a basic SEO audit of a small website (up to about 10 pages) for **€99**: indexing, technical errors, titles and meta descriptions and a prioritised task list. Fixes based on the audit are billed hourly (€30/h) with an estimate upfront; stores with a larger catalogue are quoted. Prices are on the [services page](/en/services/) and related costs in [How much SEO costs](/en/blog/kolko-stoji-seo-optimalizacia/).
