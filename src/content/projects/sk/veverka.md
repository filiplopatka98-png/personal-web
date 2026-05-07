---
name: Pekáreň Veverka
kind: "E-shop · WooCommerce"
year: "2025"
role: "Lead developer"
duration: "3 mesiace"
client: "Pekáreň Veverka, s.r.o."
url: "pekarenveverka.sk"
accent: accent
order: 1
featured: true
brief: "Prerobiť pomalý WooCommerce eshop tak, aby zvládal dvojnásobnú návštevnosť počas Vianoc."
metrics:
  - { value: "+38%", label: "tržby Q1" }
  - { value: "0.7s", label: "LCP mobil" }
  - { value: "100", label: "CWV score" }
process:
  - { title: "Audit & meranie", duration: "2 týždne", desc: "Lighthouse, WebPageTest, server-side profiling cez New Relic. Zistenia v Notion." }
  - { title: "Prestavba témy", duration: "6 týždňov", desc: "Block theme, vlastné bloky pre product listing, Tailwind utilities." }
  - { title: "Checkout & integrácie", duration: "2 týždne", desc: "Custom checkout flow, Pohoda REST sync, Stripe." }
  - { title: "Nasadenie & monitoring", duration: "1 týždeň", desc: "Cloudflare cache rules, Sentry, GA4 events." }
stack:
  - "WordPress 6.4"
  - "WooCommerce"
  - "PHP 8.2"
  - "Cloudflare"
  - "Pohoda REST"
  - "Tailwind"
---

Klient — rodinná pekáreň s 12 prevádzkami v Bratislave — bojoval s pomalým eshopom (3.8s LCP), ktorý padal pri každej kampani. Cieľom bola plynulá objednávka cez mobil a integrácia s ich Pohodou.

Prerobil som tému na blokový dizajn, vyhodil ťažké pluginy, prepísal checkout a nasadil Cloudflare cache. Skladové stavy ťahám cez REST priamo z Pohody, raz za 5 minút.

Po dvoch mesiacoch v produkcii sa LCP držalo pod 0.8s aj pri 4× nárastoch návštevnosti, a tržby v Q1 narástli o 38 %.
