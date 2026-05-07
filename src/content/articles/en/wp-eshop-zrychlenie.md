---
title: "How I cut a WP store's LCP from 4s to 0.9s"
date: 2026-04-15
read: 8
tags: ["Performance", "WordPress", "WooCommerce"]
excerpt: "An audit that found three hidden plants and one useless quiz. The exact steps, numbers and mistakes."
featured: true
---

## Starting point: 3.8s LCP and panic

The client called me on the Wednesday before Christmas. Store crashing, cart can't complete, mobile shows a blank page for 4 seconds. I opened Search Console — Core Web Vitals red on 78% of URLs.

I started with measurement, not code. WebPageTest from Bratislava, mobile 4G, throttling. Three runs, median. That's the number we care about.

## Three hidden plants

The "Pretty WhatsApp Button" plugin was loading the entire Tailwind CDN. 280 kB of CSS for one button. Threw it out, wrote 30 lines of custom code.

Second — old galleries via Slick.js. Three copies of jQuery in the DOM. Replaced Slick with native CSS scroll-snap, jQuery vanished.

Third — product photos via Cloudinary, but no `f_auto`. They were serving JPGs instead of AVIF/WebP. One URL template tweak — 60% fewer bytes.

## Cache and CDN

Killed WP Rocket because it was doing more harm than good (TTI was bouncing because of defer JS). Replaced it with a clean Cloudflare cache rule for HTML: `Cache-Control: s-maxage=300, stale-while-revalidate=86400`.

Statics go through Cloudflare with `cache everything`, dynamic endpoints bypass.

## Result

LCP mobile 0.9s, desktop 0.4s. Q1 revenue +38%. The client sleeps better now.

Biggest lesson: 80% of performance problems are bad plugins. 15% bad cache. 5% the rest.
