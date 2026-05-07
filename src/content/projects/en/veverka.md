---
name: Pekáreň Veverka
kind: "E-shop · WooCommerce"
year: "2025"
role: "Lead developer"
duration: "3 months"
client: "Pekáreň Veverka, s.r.o."
url: "pekarenveverka.sk"
accent: accent
order: 1
featured: true
brief: "Rebuild a slow WooCommerce store so it survives 2× Christmas traffic."
metrics:
  - { value: "+38%", label: "Q1 revenue" }
  - { value: "0.7s", label: "LCP mobile" }
  - { value: "100", label: "CWV score" }
process:
  - { title: "Audit & measure", duration: "2 weeks", desc: "Lighthouse, WebPageTest, server-side profiling via New Relic. Findings in Notion." }
  - { title: "Theme rebuild", duration: "6 weeks", desc: "Block theme, custom blocks for product listing, Tailwind utilities." }
  - { title: "Checkout & integrations", duration: "2 weeks", desc: "Custom checkout flow, Pohoda REST sync, Stripe." }
  - { title: "Deploy & monitoring", duration: "1 week", desc: "Cloudflare cache rules, Sentry, GA4 events." }
stack:
  - "WordPress 6.4"
  - "WooCommerce"
  - "PHP 8.2"
  - "Cloudflare"
  - "Pohoda REST"
  - "Tailwind"
---

A family bakery with 12 shops in Bratislava was stuck on a 3.8s LCP store that crumbled with every campaign. Goal: smooth mobile checkout and Pohoda inventory sync.

I rebuilt the theme as block-based, removed heavy plugins, rewrote checkout, and pushed everything behind Cloudflare. Stock pulls from Pohoda via REST every 5 min.

After two months in production, LCP stayed under 0.8s even with 4× traffic spikes, and Q1 revenue grew 38%.
