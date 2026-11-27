---
title: "SEO Audit: What It Includes, What It Costs and How to Judge an Offer (2026)"
date: 2026-11-27
read: 6
tags: ["SEO"]
excerpt: "What an SEO audit should contain, what it costs in Slovakia and how to tell a real audit from a tool export. Plus a free 30-minute check in Search Console."
metaDescription: "SEO audit: what it must include, prices in Slovakia (EUR 100 to 250) and how to spot a real one. Plus a free 30-minute check of your site in Search Console."
featured: false
faq:
  - q: "What should an SEO audit include?"
    a: "At minimum: indexing (which pages Google sees and which it does not, and why), technical errors, titles and meta descriptions, internal links and a task list ordered by impact. If the output has no specific URLs and no order of steps, it is just a tool export."
  - q: "How much does an SEO audit cost?"
    a: "According to public price lists of Slovak providers on 27 November 2026: from about EUR 100 for a technical audit and from EUR 150 excluding VAT for an audit alone. A package with fixes, keyword research and a roadmap is EUR 249. Larger sites and online stores are quoted individually. I do an audit of a small site from EUR 99."
  - q: "Can I do an SEO audit for free?"
    a: "The basics, yes. Google Search Console shows which pages are indexed, which are not and why, and which queries your site appears for. The data comes straight from Google and is free. What it does not replace is the judgement about what to fix first."
  - q: "Is an audit from an automatic tool enough?"
    a: "As a starting point, yes; as a deliverable, no. A tool finds errors but cannot judge which ones matter for your site. The value is in a task list with priorities and an estimate of the work."
  - q: "What does 'Discovered - currently not indexed' mean?"
    a: "Google found the URL but has not crawled it yet. According to Google's documentation this does not have to mean a problem on your site. On a new site with few links it is a common state."
---

Offers for an SEO audit range from free to hundreds of euros, and at first glance they all look the same. The difference is not the price but what you get in your hands: a list of tasks, or a PDF with charts from a tool. Here is what a proper audit should contain, what it costs in Slovakia and how to do the basics yourself in half an hour.

## What an SEO audit should contain

An audit answers one question: **why does Google not show me where it should?** So it has four parts:

1. **Indexing.** Which pages Google sees and which it does not. This comes first, because a page outside the index will not appear for anything, however good the text.
2. **Technical state.** Response codes (200, 404, redirects), canonical URLs, sitemap, robots.txt, speed. More on speed in the article [site speed vs. SEO](/en/blog/seo-rychlost-webu-poradie/).
3. **Content and titles.** Does every important page have its own title and description? Does it target what people actually search for?
4. **A task list ordered by impact.** Specific URLs, what to change on them and in what order. Without this the audit is not finished.

An audit is good when, after reading it, you know what to do on Monday morning. If all you know is that "the site has 143 errors", it is not.

## What an SEO audit costs in Slovakia

I looked at the public price lists of Slovak providers on 27 November 2026. The spread is wide:

| What is included | Price (public price lists) |
|---|---|
| Quick technical audit | free to EUR 100 |
| Audit (technical, content, structure) | from EUR 150 excl. VAT |
| Audit + fixes + keyword research + roadmap | EUR 249 one-off |
| Audit of a larger site or online store | quoted individually |

The numbers are indicative and apply to small sites. Two things to watch. First, the same word "audit" covers work of very different scope: sometimes it is only analysis, sometimes it includes fixes. Second, prices with and without VAT get mixed. A non-VAT payer like me invoices without it; a VAT payer adds 23%.

My audit of a small site (up to about 10 pages) starts at EUR 99. Fixes after the audit are hourly, EUR 30 per hour with an hour estimate upfront. How the price comes together overall is in the article [SEO optimization cost](/en/blog/kolko-stoji-seo-optimalizacia/), and the offer is on the [services](/en/services/) page.

## How to judge an offer

Before you order, ask four things:

- **What exactly will I get?** A task list with URLs, or a tool report?
- **Are fixes included?** If not, what will they cost and who does them?
- **Who does the audit?** So that you are not talking to a salesperson who only sells it.
- **Does it promise a ranking in Google?** Nobody can guarantee first place. Anyone who promises it is not telling the truth.

## My example: auditing my own site

When I started watching this site in Search Console, it was clean technically: 109 URLs in the sitemap, all returned 200, none had noindex and the canonical URLs matched. And yet most of the site was outside Google: 86 URLs had the status **"Discovered - currently not indexed"**.

According to [Google's documentation](https://support.google.com/webmasters/answer/7440203?hl=en) this means Google found the URL but has not crawled it yet, and it need not be a problem on the site. The site was new and had few links from outside. The diagnosis was therefore "the technical side is fine, Google needs a reason to come". What helped was manually requesting indexing of the important URLs in the URL Inspection tool, plus new articles. Today Search Console reports 38 indexed pages and the site appears for 116 different queries, against 5 queries at the start. Clicks are still few, so it is not a success yet, only the right direction.

The lesson for an audit: tell apart whether the problem is on your site or whether the ball is in Google's court. The first gets fixed; the second takes patience and links.

## A basic audit in 30 minutes, free

All you need is Google Search Console (free, you have to verify the domain):

1. **Indexing → Pages.** How many pages are indexed and how many are not. Open the reasons. "Discovered - not indexed" and "Crawled - not indexed" are different things. The second means Google saw the page and decided not to include it, which according to its documentation is not necessarily an error, but for important pages it is worth a look.
2. **URL Inspection.** Paste the URLs of your most important pages (services, price list, best articles). "URL is on Google" means it can appear, not that it will. If it is not on Google, request indexing.
3. **Sitemap.** Check that it is submitted and that it does not contain URLs that do not belong there (redirects, 404s).
4. **Performance → Queries.** What do you already appear for and on which pages? Few clicks with many impressions means a weak title or description.
5. **A list.** Write down 5 to 10 tasks and order them by how many pages they affect.

If this yields more than a handful of tasks and you do not know where to start, that is when an audit from a specialist pays off. A more detailed procedure is in the [SEO optimization guide](/en/blog/seo-optimalizacia-webu-navod/), and for WordPress in the article [SEO for WordPress and WooCommerce](/en/blog/seo-wordpress-woocommerce-zaklad/).

## Summary

An SEO audit is good when it ends with a list of specific tasks with priorities, not with a count of errors found. Prices for a small site in Slovakia are roughly EUR 100 to 250, depending on scope. You can do the basics for free in Search Console, and only then does it make sense to decide whether you need help.
