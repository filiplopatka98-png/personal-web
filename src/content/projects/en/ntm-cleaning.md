---
name: "ntmcleaning.sk"
kind: "Custom website · WordPress"
year: "2026"
role: "WordPress Developer"
duration: "2 weeks"
client: "NTM Cleaning"
url: "ntmcleaning.sk"
accent: accent2
order: 6
featured: false
brief: "A new website for a company that deep-cleans upholstery and car interiors at the customer's location. Mobile performance from 60 to 99, main content in 1.7 s instead of 11.4 s."
metrics:
  - value: "60 → 99"
    label: "mobile performance (PageSpeed)"
  - value: "11.4 → 1.7 s"
    label: "largest contentful paint on mobile"
  - value: "100"
    label: "accessibility, SEO and best practices"
stack:
  - "WordPress"
  - "Custom theme"
  - "Yoast SEO"
  - "Contact Form 7"
  - "Cloudflare Turnstile"
  - "GA4"
heroCaption: "homepage · phone and quote request within reach"
mobileCaption: "homepage on mobile"
secondaryCaption: "services, pricing and references on one page"
---

NTM Cleaning does deep cleaning of upholstery and carpets, leather care and interior car detailing at the customer's location across four regions of western Slovakia. The old website ran on a ready-made theme with the Elementor page builder, and on mobile its main content appeared after more than eleven seconds.

The new site is built on a custom WordPress theme without a page builder. Services, pricing, projects, counters, FAQ and contact sit on one page in a logical order. Subpages that only repeated the same text were dropped and the old URLs redirected, so nobody lands on a 404. The phone number and the free quote request are always within reach, and the form is protected by Cloudflare Turnstile. Business data for Google, a sitemap, Search Console and an llms.txt file were set up from day one; a submitted form is tracked in GA4.

I measured both versions with Google PageSpeed Insights on 12 November 2026. The old site is no longer public, so I ran it from a backup on a temporary address with its original database, no content changes and indexing disabled, and measured it three times (median shown; one outlier of 29.8 s was left out of the comparison). On mobile, performance rose from 60 to 99, main content from 11.4 to 1.7 s and layout shift from 0.132 to 0. On desktop the score is 100 versus 72. Accessibility rose from 85 to 100, and the new site also scores 100 for SEO and best practices. These are lab numbers; data from real visitors will come from Search Console.

The post-launch check showed that the favicon existed only as WebP (iOS does not use it as an icon) and the manifest was missing. I added all icon types: ICO, PNG in three sizes, apple-touch-icon and site.webmanifest.

"My website has been rebuilt from the ground up: clear and modern. I am thrilled with Filip's skill, speed, patience and above all his humanity." — Nikolas Kollár, NTM Cleaning (Google review)

<!-- Add 30- and 90-day results (7 Dec 2026, 3 Feb 2027): form and phone enquiries, Search Console impressions and clicks. -->
