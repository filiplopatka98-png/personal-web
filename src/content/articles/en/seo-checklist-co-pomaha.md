---
title: "The technical SEO checklist that actually moves the needle"
date: 2025-09-22
read: 8
tags: ["SEO", "Performance"]
excerpt: "20 items weighted by the Pareto principle. What gets you 80% of the effect, what's middling, and what's overmarketed noise."
featured: false
---

Most SEO checklists on the internet in 2026 are terrible — typically 80 items, of which 60 move nothing. After dozens of audits of various SK/CZ sites, I've narrowed it down to a list based on **what measurably moved organic traffic in Search Console**.

I'll split it into high-impact (fix this first), mid-impact (get to it over time), and low-impact (overmarketed, especially in Slovak SEO blogs).

## High-impact: 80% of the effect

### 1. Crawlability — robots.txt, sitemap, hreflang

If Google can't figure out what to crawl, nothing else helps. Check:

- `robots.txt` doesn't block what should be indexed (common fail: `Disallow: /wp-content/` blocks CSS/JS, which breaks render checks)
- `sitemap.xml` exists and is submitted in Search Console
- the sitemap contains only indexable URLs (no 301s, 404s, or noindex pages)
- `hreflang` if you have multiple languages — `<link rel="alternate" hreflang="sk-SK">`, and reciprocally

Audit: Search Console → Pages → "Why pages aren't indexed." Most common reasons: "Discovered – currently not indexed" (Google has no capacity or the signal is weak) or "Crawled – not indexed" (quality).

### 2. Core Web Vitals — LCP, INP

In 2026, CWV are a confirmed ranking signal for mobile. Targets:

- **LCP < 2.5 s** (Largest Contentful Paint)
- **INP < 200 ms** (Interaction to Next Paint, which replaced FID in March 2024)
- **CLS < 0.1** (Cumulative Layout Shift)

Search Console → Core Web Vitals report shows you field data. **Not lab data from Lighthouse** — field data comes from real users. (Note: the thresholds apply at the 75th percentile, so you have to hit a "good" score for 75% of visits.)

For a WordPress store we tuned this year: LCP 4.2 s → 1.6 s, organic traffic +28% over 6 weeks. Correlation, not causation, but we keep seeing the pattern. If you're deciding which pages to fix first, [prioritize by which store pages matter most](/en/blog/cwv-eshop-priorita/) rather than chasing every URL.

### 3. Structured data — Product, BreadcrumbList, Organization

JSON-LD schema for a store = rich results in the SERP = higher CTR. Minimum:

- `Product` with `Offer`, `AggregateRating`, `Review` (on the product detail page)
- `BreadcrumbList` (on every page except the homepage)
- `Organization` (homepage)

Validation: `validator.schema.org` + Google Rich Results Test. Search Console → Enhancements shows you whether Google is parsing it. If you don't want to hand-write it, [these ready-made JSON-LD templates](/en/blog/schema-org-eshop-templates/) cover the common store cases.

### 4. Canonical URLs

Without canonicals, you get duplicates. Products in WooCommerce + filter URLs (`?orderby=price&min_price=10`) = thousands of duplicate pages if you don't have a canonical.

```html
<link rel="canonical" href="https://example.sk/produkty/kosela-modra/">
```

In Yoast SEO you set it per page type. Check via Search Console → Pages → Indexed to make sure the same product isn't being indexed five times with different query parameters.

### 5. Title and meta description quality

Still underrated. The title is the strongest on-page signal right after the content itself. The meta description doesn't affect ranking directly, but it affects CTR — and CTR is a signal.

Rules:
- title: 50–60 characters, main keyword on the left, brand on the right
- meta description: 140–160 characters, value proposition, soft CTA
- unique for every page (Search Console flags duplicates)

## Mid-impact: fill in over time

### 6. Internal linking

Link within the body text (not just in the menu) to related pages. Anchor text is a signal. For a store: link from a blog article to product categories. For a service business: link from the homepage to all your key service pages. The cleanest way to do this at scale is [organizing internal links into topic clusters](/en/blog/internal-linking-topic-clusters/) instead of ad-hoc linking.

Audit: Screaming Frog → Internal links report. Pages with 0–1 internal links are "orphans" — Google may not crawl them often.

### 7. Image alt text and file name

The `alt` attribute is a signal for both accessibility and SEO. A file name like `IMG_4521.jpg` is worse than `cervena-kosela-pansky-bavlnena.jpg`. For a store with thousands of images, [see the article on AI-generated alt text](/en/blog/ai-alt-text-seo/).

### 8. Heading hierarchy

One `<h1>` per page. `<h2>`, `<h3>` in order. Not because "Google reads it" (in practice, minimal weight), but because of accessibility and the structure Google extracts when parsing.

### 9. HTTPS + HSTS

Baseline in 2026. No HTTPS = no-go. The HSTS header (`Strict-Transport-Security`) ensures the browser handles the redirect from http.

### 10. Mobile-friendliness

Google has indexed mobile-first since 2019. Test: Search Console → Mobile Usability. Most common fails: text under 12 px, tap targets under 44 px, missing viewport meta.

## Low-impact: overmarketed

### 11. Keyword density

A myth. In 2026 Google uses semantic understanding, not counting. Write naturally, use synonyms, context > repetition. "Optimize for keyword density" is advice from 2012.

### 12. Exact-match anchor text

The opposite — over-optimized anchor text (every link says exactly "cheap shirts Bratislava") is a spam signal. Mix in natural anchor text.

### 13. Schema markup beyond the basics

`HowTo`, `FAQ`, `Recipe`, `Course`... yes, sometimes they help. But they often just add complexity without a measurable payoff. Focus on the 5 key schemas (Product, BreadcrumbList, Organization, WebSite, LocalBusiness).

### 14. Meta keywords tag

Google has ignored it since 2009. So has Bing. A waste of time.

### 15. Priority + changefreq in the XML sitemap

Google [officially ignores them](https://developers.google.com/search/blog/2014/10/best-practices-for-xml-sitemaps-rssatom) when prioritizing crawl (it relies on `lastmod`). The default values are fine.

## Audit tools (2026)

| Tool | Price | Use |
|---|---|---|
| **Google Search Console** | free | baseline, must-have |
| **PageSpeed Insights** | free | CWV check |
| **Screaming Frog** | 245 EUR/year (free up to 500 URLs) | technical crawl |
| **Ahrefs** | 129 USD/mo Lite | competitor analysis, backlinks |
| **Sitebulb** | 13.50 USD/mo | alternative crawler with a nicer UI |
| **Bing Webmaster Tools** | free | occasionally catches things GSC won't show |

Start with Search Console. 80% of the insights are there for free.

## A real audit flow (1 hour for a small site)

1. Search Console → Coverage report → fix indexing problems
2. PageSpeed Insights for the top 5 URLs → CWV score
3. Screaming Frog crawl → broken links, missing titles, duplicate content
4. Spot-check 10 products → schema validation
5. Search Console → Performance → identify queries where you're at position 8–15 (low-hanging fruit for on-page tweaks)

## TL;DR

Out of 80 SEO checklist items, 5 actually move traffic: crawlability, CWV, structured data, canonicals, titles + descriptions. If you've got those in order, tackle the mid-impact tier. Ignore the low-impact stuff (keyword density, meta keywords, exotic schemas) — that's where you waste time. An audit via Search Console (free) is enough for 80% of SK/CZ sites.
