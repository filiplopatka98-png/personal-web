---
name: "krivosik.sk"
kind: "Custom website · WordPress"
year: "2026"
role: "WordPress Developer · ongoing maintenance"
duration: "2 days build + ongoing"
client: "Ľubomír Krivošík"
url: "krivosik.sk"
accent: accent
order: 29
featured: true
brief: "A new website for an earthworks and excavation company: a form next to the map, Google reviews on the site and enquiry tracking. Mobile performance from 79 to 95, first paint in 1.0 s instead of 3.4 s."
metrics:
  - value: "79 → 95"
    label: "mobile performance (PageSpeed)"
  - value: "3.4 → 1.0 s"
    label: "first contentful paint (FCP) on mobile"
  - value: "80 → 0 ms"
    label: "total blocking time (TBT) on mobile"
stack:
  - "WordPress"
  - "Custom theme"
  - "Yoast SEO"
  - "Contact Form 7"
  - "Cloudflare Turnstile"
  - "Complianz"
  - "GA4"
heroCaption: "homepage · services and phone in the hero section"
mobileCaption: "homepage on mobile"
secondaryCaption: "project detail · pool excavation and build"
---

### Starting point

Zemné práce Krivošík is a family company from Veľké Kostoľany. It does earthworks and excavation, landscaping, concreting and demolition for households, companies and municipalities, and prepares quotes free of charge. I have been building its website since 2021 and still maintain it.

The old site ran on an off-the-shelf theme with a page builder. It worked, but it had three weaknesses: a slow mobile experience, no form and no tracking of enquiries. People could call, but the company did not know how many visits actually led to that.

### What was done

- A custom WordPress theme without a page builder, with only what the page actually uses.
- A form next to the map, protected from spam without an annoying captcha (Cloudflare Turnstile), sent to the company e-mail.
- A custom carousel of Google reviews, an About section with a photo and numbers, and a new order of sections.
- FAQ with structured data, a new sitemap, redirects for old URLs and an llms.txt file.
- A cookie banner in the site's design and GA4 with `generate_lead` and `contact` events, so enquiries from the site can be tracked.
- A complete set of site icons.

### Result

Comparison in Google PageSpeed Insights, 12 November 2026, the old site in the morning and the new one after launch:

- mobile performance: 79 → 95
- first contentful paint (FCP) on mobile: 3.4 s → 1.0 s
- total blocking time (TBT) on mobile: 80 ms → 0 ms
- Speed Index on mobile: 6.9 s → 3.0 s
- mobile accessibility: 91 → 99
- SEO and best practices: 100 on both versions

What did not improve: desktop was already at the top end (97 → 96) and the largest contentful paint (LCP) on mobile only dropped from 3.4 s to 2.9 s, still above the 2.5 s Google considers good. These are lab numbers; I will add data from real visitors once Search Console has collected it.
