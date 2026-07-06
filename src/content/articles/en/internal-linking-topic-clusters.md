---
title: "Internal Linking: Topic Clusters Without a Plugin"
date: 2025-10-12
read: 7
tags: ["SEO", "Process"]
excerpt: "Yoast Internal Linking and Link Whisper won't replace your own brain. On a small site (50–200 pages), manual topic cluster mapping is faster and more accurate than a plugin's guesswork."
featured: false
---

The "Internal Linking" feature in Yoast, or Link Whisper, recommends links based on word matches. It works like Ctrl+F with a nicer UI. On a small site (50–200 pages), you can do that work by hand in 2 hours and get a better result — because the plugin doesn't know which page is your **pillar page** and which is just a supporting piece.

## Why manual mapping wins

The plugin doesn't know:

- Which article has the strongest backlinks and should pass PageRank onward
- Which page converts and deserves internal links from high-traffic content
- Which anchor text you're already overusing (over-optimization)
- What the business intent of a page is (purchase intent vs. informational)

The plugin just matches a keyword. When you have 4 articles about "Core Web Vitals," the plugin starts cross-linking them in circles and your pillar page gets lost in the noise.

## Step 1: Audit your existing content

Build a simple spreadsheet — URL, title, primary keyword, type (pillar / cluster / supporting), publish date, monthly visits from GA4 or Plausible.

Group by topic. On a small site you're looking for **3–5 main topics**. You don't have more than that (and if you think you do, you probably don't). An example for a freelance dev's site:

- Performance (LCP, INP, bundle size)
- WordPress (themes, plugin selection, security)
- Headless (Astro, Next.js, CMS)
- Process (pricing, briefing, workflow)

Everything else is an outlier — either you file it under one of the topics, or you don't optimize it.

## Step 2: The pillar + cluster structure

For each topic, one **pillar page** (2000+ words, broad overview) and 5–10 **cluster articles** (narrow, in depth).

| Topic | Pillar page | Cluster (5–10 pieces) |
|---|---|---|
| Performance | "Core Web Vitals: the complete guide" | LCP over 2.5s, INP over 200ms, CLS on mobile, image lazy loading, bundle audit |
| WordPress | "WordPress for small business 2026" | theme selection, ACF vs Meta Box, multisite, migration with zero downtime |
| Headless | "Headless CMS: when yes and when no" | Astro vs Next.js, Astro content collections, headless Woo, view transitions |

The linking logic:

- Every cluster article links **to the pillar** (anchor = a variation of the topic keyword)
- The pillar links **to all cluster articles** (a "related topics" section or inline)
- Cluster articles link **to each other** when it makes contextual sense — never forced

## Step 3: Anchor text variation

This is where Link Whisper limps the most. It'll always recommend an exact-match anchor (boring, over-optimized). Google sees that.

A healthy split for cluster → pillar links:

- **Exact match** (max 30%): "Core Web Vitals," "WordPress for small business"
- **Partial match** (50%): "how to optimize Core Web Vitals," "a guide to picking a WordPress theme"
- **Branded / generic** (20%): "in this guide," "I wrote about it in more detail here," "the complete guide"

Generic anchors ("click here," "more here") **aren't bad**. They signal to Google that you're building links for people, not for the algorithm. Just don't let them make up more than 10%.

## Step 4: Maintenance — the quarterly review

Every 3 months, sit down for 60 minutes and:

1. **Broken links**: run `wget --spider -r -nd -nv -l 5 https://your-site.com 2>&1 | grep -B1 "broken"` or Screaming Frog's free version up to 500 URLs.
2. **New content**: integrate it into the map — where it links to, where you link to it from.
3. **Orphaned pages**: pages with no incoming internal links. In Search Console → Links → Internal, look for which important page is missing from the list or has the fewest links. That page is practically invisible to Google.
4. **Over-linked pillar**: if a pillar has more than 50 incoming internal links and your site has 80 pages, you're overdoing it.

## A real example: a blog with 60 articles

A client had 60 articles and no topic clusters. GSC showed ~800 organic visits per month, mostly to 3 articles (long-tail keywords they hit by accident).

After 6 weeks of manual reorganization:

- 4 pillar pages (each got an in-depth rewrite, +800 words)
- 56 cluster articles remapped (existing content — I wrote nothing new)
- A linking map in Notion (60 rows × what links where)

After 3 months: **~2100 organic visits**, and the pillar pages reached positions 4–8 for their target keywords. No new content, no backlink building — just better architecture.

## The tools that are enough

- **Notion / Google Sheets** — the map
- **Screaming Frog (free up to 500 URLs)** — crawl, broken links
- **Search Console** — Links → Internal (detecting orphan pages)
- **GA4 / Plausible** — page views, which pillar earns the traffic

No SEO plugin at 99 EUR/year. Really.

## TL;DR

At 50–200 pages, manual topic cluster mapping (pillar + 5–10 cluster articles) is more accurate than any plugin. 2 hours of audit, 4 hours of reorganization, a quarterly review. Anchor text variation 30/50/20. Save the plugin for sites with 5000+ pages, where doing it by hand no longer pays off.

**Related:** [technical SEO checklist that actually moves the needle](/en/blog/seo-checklist-co-pomaha/) · [which Core Web Vitals pages to fix first](/en/blog/cwv-eshop-priorita/) · [the 7 most common causes of LCP over 2.5s](/en/blog/lcp-nad-2-5s-pricin/).
