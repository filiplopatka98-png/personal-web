---
title: "Website speed and SEO: what really affects your Google ranking"
date: 2026-11-19
read: 7
tags: ["SEO", "Performance", "Core Web Vitals"]
excerpt: "Does website speed affect Google rankings? What is true about Core Web Vitals, why a PageSpeed score of 100 is not the goal and what to fix first."
metaDescription: "Website speed and SEO: how Google uses Core Web Vitals, why not to chase 100 in PageSpeed and in what order to fix LCP, server and images."
featured: false
faq:
  - q: "Is page speed a Google ranking factor?"
    a: "Yes, but not the only one and not the strongest. Google uses Core Web Vitals in its ranking systems, but according to its own guidance it is not a single signal and the relevance of the content matters more. Good speed helps most where several pages have similarly relevant content."
  - q: "What are good Core Web Vitals values?"
    a: "LCP within 2.5 seconds, INP within 200 milliseconds and CLS within 0.1, measured at the 75th percentile of real visits. The values come from data of real users, not from a single test."
  - q: "Should I aim for 100 in PageSpeed Insights?"
    a: "No. The score is a summary of a lab test and is not what Google uses for ranking. What matters are the real LCP, INP and CLS values. Once you are past the 'good' threshold, further speed-ups usually do not move your ranking."
  - q: "What should I speed up first?"
    a: "First measure real data in Search Console and find the worst group of pages. Then the hero image (LCP), server response and heavy third-party scripts usually help the most."
---

Short answer: **website speed does affect ranking, but weakly and at a narrow margin**. A slow site will not drop in the results because of one extra second. But a slow site loses visitors before they read what you offer, and that is the reason to care about speed. Here is what is confirmed and what is a myth.

## What Google says

In its guidance Google states that **Core Web Vitals are used by its ranking systems**. It also says there is no single signal, but a group of signals around the overall experience of a page, and that good results in Search Console or in third-party tools do not guarantee a top position. Other page experience aspects do not directly raise ranking, according to the same guidance. The relevance of the content matters more for ranking.

In practice: if two pages are equally good in content, the faster one may come out ahead. If one is clearly better in content, it wins even when it is slower.

## What is actually measured

Core Web Vitals are three numbers:

- **LCP** (when the main content appears): within 2.5 s,
- **INP** (how quickly the site reacts to clicks): within 200 ms,
- **CLS** (content jumping while loading): within 0.1.

The **75th percentile of real visits** is evaluated, meaning what most people experience on an ordinary phone, not a test from your desk on fast wifi. That is why you should look at *Search Console → Core Web Vitals* rather than a one-off test.

## Why not to chase 100 in PageSpeed

The PageSpeed Insights score comes from a lab test (Lighthouse) and combines several metrics into one number. Google does not use this number for ranking, but **real user data**. So a site can have 95 points and a poor real LCP (because many visitors have a weak connection), or 70 points and still pass Core Web Vitals.

Once a site is in the green, further speed-ups usually do not move ranking. Time is better spent on content and indexing. For a new site that Google has not even crawled yet, speed is secondary.

## Where speed helps most

1. **Mobile LCP on important pages.** It is most often ruined by a large hero image without `fetchpriority`, a slow server or blocking JavaScript. A breakdown of causes is in the article [LCP over 2.5 s: causes](/en/blog/lcp-nad-2-5s-pricin/).
2. **Server response and hosting.** A slow server delays everything else and needlessly slows down crawling too. Benchmark numbers are in the article [Hosting in Slovakia: performance](/en/blog/hostingy-sk-vykon/).
3. **Stores and pages where people pay.** A slow cart and product page cost revenue before they cost positions. Together with the technical foundation I go through it in the article [SEO for WordPress and WooCommerce](/en/blog/seo-wordpress-woocommerce-zaklad/).

## The order of steps

1. **Measure real data.** Search Console → Core Web Vitals. Find the page groups marked "Poor" or "Needs improvement" and pick those with traffic.
2. **Fix the biggest thing.** Usually the image at the top of the page (size, format, `fetchpriority`), then the server and cache, then third-party scripts.
3. **Verify after the change.** Real data updates with a delay of several weeks, so verify the change in a test first and then in Search Console.
4. **Stop at green.** Once you pass the thresholds, work on content and indexing.

## An example from practice

On the WooCommerce store natur-life.sk I moved the mobile score of the product page from 27 to 83 points. Page size dropped by 52 to 73 % and server response is 120 to 250 ms. Neither the theme nor the site was rewritten: it was images, scripts and cache settings. The whole process is in the [case study](/en/work/natur-life/). I did not promise or measure Google ranking there: the goal was a faster purchase. That is also how I look at speed now: as a condition, not a shortcut to the first position.

## Want to know where you stand?

I do a basic SEO audit of a small website (up to about 10 pages) for **€99**: indexing, technical errors including speed, titles and meta descriptions and a prioritised task list. Speeding up a website or store on its own starts at €390 depending on the audit; more in the article [How much a website and store cost](/en/blog/kolko-stoji-web-eshop-2026/) and on the [services page](/en/services/). If you are starting out, read the [SEO optimization guide](/en/blog/seo-optimalizacia-webu-navod/) first.
