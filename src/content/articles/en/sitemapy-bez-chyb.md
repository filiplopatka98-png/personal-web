---
title: "Sitemaps Google Actually Reads"
date: 2026-09-03
read: 8
tags: ["SEO"]
excerpt: "Google ignores priority and changefreq, and only trusts lastmod if you earn it. A practical guide to error-free sitemaps that actually help crawlers."
featured: false
---

A sitemap is one of those things that looks trivial — install a plugin, it spits out XML, you submit it to Search Console, done. Except in most audits I run, that "done" sitemap hurts Google more than it helps. It's full of 404s, redirects, `noindex` pages, hundreds of tag archives, and `<priority>1.0</priority>` on every single URL. Google takes exactly nothing useful out of that.

Let's walk through it so the sitemap does its actual job: **tell crawlers quickly and reliably which canonical URLs exist and when they genuinely changed.**

## What Google reads from a sitemap and what it ignores

This is the most important part of the whole article, because nearly everyone gets it wrong. Google [officially states in its documentation](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) that it **ignores `<priority>` and `<changefreq>`**. Not "weighs them less" — ignores them entirely. Gary Illyes from Google repeated it for years: the fields got so abused (everyone set every page to `priority` 1.0) that the signal lost all value.

What Google actually uses is `<lastmod>` — with a catch. The exact wording: it uses the value "if it's consistently and verifiably accurate" (for example, by comparing it against the page's real last modification). In other words: if you slap today's date on `lastmod` at every crawl to look "fresh," Google will figure it out and stop trusting you — and then it ignores even your correct `lastmod` values.

Practical takeaway: **`lastmod` must reflect a real change to the main content.** Not a year bump in the footer, not a recalculated comment count. A genuine edit to the text, structured data, or internal links.

## The lastmod format — where "Couldn't fetch" comes from

`lastmod` has to be in [W3C Datetime format](https://www.w3.org/TR/NOTE-datetime). Google tightened the rules: if you omit the time, it defaults to midnight UTC. If you include a time, you **must also include a timezone** — otherwise it's an error. An invalid date or wrong format also throws an error. Future dates, on the other hand, Google no longer treats as an error (that changed).

Valid examples:

```xml
<lastmod>2026-09-03</lastmod>
<lastmod>2026-09-03T14:30:00+02:00</lastmod>
<lastmod>2026-09-03T12:30:00Z</lastmod>
```

Invalid (and a typical source of Search Console trouble):

```xml
<!-- time without a zone -->
<lastmod>2026-09-03T14:30:00</lastmod>
<!-- local format -->
<lastmod>9/3/2026</lastmod>
```

If you generate the sitemap with your own code, in JavaScript `new Date().toISOString()` always returns a valid UTC format with a trailing `Z` — the safe choice.

## Limits you have to respect

A single sitemap has a hard limit of **50,000 URLs or 50 MB uncompressed** — whichever comes first. When you exceed it, you split the content into multiple sitemaps and join them with a **sitemap index**. That's also XML, but instead of pages it lists the individual sitemaps (and it has the same 50,000-entry limit itself).

You then submit **only the index** to Search Console — Google discovers the rest on its own.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/sitemap-posts.xml</loc>
    <lastmod>2026-09-03</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemap-products.xml</loc>
    <lastmod>2026-09-03</lastmod>
  </sitemap>
</sitemapindex>
```

The file must be **UTF-8**, and the URLs inside must be **absolute and fully qualified** (`https://example.com/product`, not `/product`). Google crawls URLs exactly as written in the sitemap — so a typo in the protocol or domain equals an unindexed page.

## Only canonical, indexable URLs belong in a sitemap

This is the single most common mistake I see. A sitemap is a list of URLs you **want** in the index. That dictates what doesn't belong in it:

- pages with `noindex`
- redirects (301/302) — put the destination URL there, not the one that redirects
- 404s and other error states
- non-canonical variants (parameters, `?utm=`, filters) — include only the canonical version
- pages blocked in `robots.txt`

The last point is a subtle conflict: if a URL is in the sitemap and also blocked in `robots.txt`, you're giving Google contradictory signals — "crawl this" versus "don't come here." In Search Console it ends up as a warning, and the page doesn't get indexed. Pick one or the other.

On multilingual sites the sitemap also carries `hreflang` via `xhtml:link`. It has to be **reciprocal** — if the EN version points to SK, SK has to point back to EN, otherwise Google throws it out. I cover this in more depth in the piece on the [technical SEO checklist that actually helps](/en/blog/seo-checklist-co-pomaha/).

## WordPress: Yoast handles it well, but verify

If the site runs on WordPress with Yoast, the sitemap lives at `/sitemap_index.xml` and it's a decently built thing. Yoast automatically **excludes `noindex` pages** and adds an `X-Robots-Tag: noindex, follow` HTTP header to the whole sitemap — so Google doesn't index the sitemap itself as a page but reads it normally. That's the correct behavior.

What to check by hand: Yoast generates a separate sitemap for each post type and taxonomy by default. On a typical company site I often find `sitemap-category.xml` and `sitemap-post_tag.xml` in the index, stuffed with thin archives. If those archives shouldn't be in the index, set them to `noindex` in Yoast — they drop out of the sitemap too. Don't try to remove them with a filter while leaving them indexable; that's just another flavor of the same conflict.

## Next.js: generate the sitemap from code

In the App Router (Next.js 16 at the time of writing) you have a native `app/sitemap.ts` file. You export a default function that returns an array of URLs — the type is `MetadataRoute.Sitemap`. This generates the sitemap from the same data as your pages, so it never drifts out of sync.

```ts
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://example.com',
      lastModified: new Date(),
    },
    {
      url: 'https://example.com/blog',
      lastModified: new Date('2026-09-03'),
    },
  ]
}
```

For large catalogs (over 50,000 URLs) you use `generateSitemaps`, which splits the array into chunks of 50,000. Watch one detail that changed in Next.js 16: **`id` is now a Promise** you have to `await`.

```ts
import type { MetadataRoute } from 'next'

export async function generateSitemaps() {
  return [{ id: 0 }, { id: 1 }, { id: 2 }]
}

export default async function sitemap({
  id,
}: {
  id: Promise<string>
}): Promise<MetadataRoute.Sitemap> {
  const start = Number(await id) * 50000
  const products = await getProducts(start, start + 50000)
  return products.map((p) => ({
    url: `https://example.com/product/${p.slug}`,
    lastModified: p.updatedAt,
  }))
}
```

Note that `lastModified` comes from `p.updatedAt` — the real edit date in the database. That's exactly what Google wants from `lastmod`.

## A quick review routine

When I go over a sitemap in an audit, I run through this:

A sitemap helps Google discover URLs, but crawl budget and authority are distributed by internal linking — worth handling in parallel; more in the piece on [internal linking with topic clusters](/en/blog/internal-linking-topic-clusters/).

1. `curl -sI https://example.com/sitemap.xml` — does it return `200` and `Content-Type: application/xml`? (Not HTML, not `404`.)
2. Open the sitemap and take a sample of 10 URLs — do they all return `200`, no 301s or `noindex`?
3. Search Console → Sitemaps — status "Success," and does the "Discovered URLs" count match expectations?
4. Search Console → Pages — how many of the submitted URLs are actually indexed? A big gap means a content-quality problem, not a sitemap one.
5. Are `<priority>` and `<changefreq>` in the XML? If so, just delete them — you shrink the file and lose nothing.

A sitemap isn't a ranking tool and it won't index content Google doesn't want. It's just a clean, trustworthy list. Keep it accurate — correct `lastmod`, only canonical indexable URLs, no `robots.txt` conflicts — and Google starts taking it seriously. That's the whole point.
