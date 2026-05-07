---
title: "Kedy vybrať Astro namiesto Next.js: rozhodovacia tabuľka"
date: 2025-11-08
read: 8
tags: ["Astro", "Next.js"]
excerpt: "8 osí, jedna tabuľka, žiadne zbytočné debaty na Twitteri. Astro pre marketing/blog/docs, Next pre app/dashboard. Kedy ich kombinovať a kedy si vybrať jeden."
featured: false
---

Klienti sa pýtajú: "Astro alebo Next?" Odpoviem otázkou — "Čo je to za projekt?". Odpoveď väčšinou rieši 70 % rozhodnutia. Pre zvyšných 30 % mám túto tabuľku.

## 8 rozhodovacích osí

| Os | Astro vyhráva keď | Next.js vyhráva keď |
|---|---|---|
| **Typ projektu** | Marketing site, blog, docs, portfolio, landing page | Dashboard, eshop s prihlásenými users, SaaS app |
| **Traffic profile** | Occasional návštevy, čítanie | Always-on, real-time, persistent state |
| **Tím skills** | HTML/CSS first, sprinkle JS | React-fluent tím, state management daily |
| **Deploy target** | Static CDN (Cloudflare Pages, Netlify) | Node server, edge functions, Vercel/AWS |
| **CMS integration** | Build-time fetch, regenerate na publish | Runtime fetch, ISR, on-demand revalidation |
| **Interactivity** | Sprinkled (search, modal, cart counter) | Heavy state (drag-drop, real-time, live UI) |
| **Budget / time** | < €5k, < 6 týždňov | > €15k, multi-month, dedikovaný tím |
| **Future scope** | Single site, predictable rast | Platform, multi-tenant, expanding features |

## Astro vyhráva — konkrétne projekty

**Marketing site pre B2B firmu (15 stránok).**
Build raz, deploy na CDN, žiadny server. JS bundle pod 30kB pre celú stránku. CWV LCP/INP budú zelené bez snahy. Klient pridá novú case study cez headless CMS (Sanity, Storyblok), webhook spustí rebuild, za 90s je live. Žiadny Node, žiadne Vercel cold starts.

**Developer blog (50–500 článkov).**
Content Collections + MDX = typesafe end-to-end (písal som [tu](/blog/astro-content-collections-mdx)). Build za 30s. Hostuje sa zadarmo na Cloudflare Pages alebo GitHub Pages.

**Docs site.**
Starlight (Astro template) je explicitne na to. Search, sidebar nav, syntax highlighting, dark mode — out of the box.

**Portfolio.**
Statický site, občas image-heavy. Astro `<Image />` s automatickým WebP/AVIF + responsive srcset = bez práce.

## Next.js vyhráva — konkrétne projekty

**SaaS dashboard.**
User je logged in, vidí svoje dáta, klika cez 30 obrazoviek za session. Server-side auth (Auth.js / Clerk), API routes, real-time updates (websockets alebo Server-Sent Events). Astro toto **vie**, ale Next je na to natívne stavané a tooling je 5× hlbší.

**Eshop s prihlásením + košíkom + checkout-om.**
WooCommerce headless front, ale zákazník má účet, history, wishlist, real-time inventory. ISR pre produktové stránky, dynamic checkout. Next.js App Router + React Server Components + Suspense streaming.

**Multi-tenant platform.**
Subdoména per klient, dynamic routing, edge auth. `middleware.ts` v Next je na to ideálny.

**Real-time features.**
Live chat, collaborative editing, presence indicators. Astro tie features integruje (cez `client:` directives), ale ekosystém Next + React má 10× viac knižníc na drag-drop, virtualization, animation orchestration.

## Hybrid — kedy a ako

Niekedy najlepšia odpoveď je "oba". Príklad z reálneho projektu:

- `https://klient.sk` — Astro marketing site (5 stránok, blog, docs)
- `https://app.klient.sk` — Next.js SaaS aplikácia
- `https://shop.klient.sk` — Astro front + Snipcart pre simple eshop

Subdomény, oddelené deploy, oddelený tooling. Marketing site je super rýchla (Astro), aplikácia je full-featured (Next), eshop má vlastné deploy cycle. Žiaden tím nemusí ovládať oboje — predaj/marketing edituje Astro repo, devs robia Next.

Náklady: dva CDN endpointy, dva domain DNS settings. To je všetko.

## Decision rule v 3 otázkach

1. **Užívateľ je prihlásený?** Áno → Next. Nie → pravdepodobne Astro.
2. **Stránka má heavy interaktivitu na > 50 % obrazovky?** Áno → Next. Nie → Astro.
3. **Deploy target Node/edge?** Áno → Next. Static CDN stačí → Astro.

Tri "Nie" odpovede = Astro. Tri "Áno" = Next. Mix = pozri na os ktorá rozhoduje konkrétne pre projekt (často budget alebo skills tímu).

## Náklady na server (rok)

Pre 10k MAU (mesačných users):

| Setup | Hosting | CDN | DB | Total / rok |
|---|---|---|---|---|
| Astro + Cloudflare Pages | €0 | €0 (free tier) | €0 (build-time fetch z CMS) | **~€60** (custom domain) |
| Astro + Vercel free | €0 | €0 | €0 | ~€60 |
| Next.js + Vercel Pro | €240 | included | €120 (Neon, Supabase) | ~€420 |
| Next.js + self-host VPS | €120 | €0 (Cloudflare proxy) | €60 | ~€240 |

Pre malú firmu cez Cloudflare Pages s Astro = prakticky free. Pre Next.js s Vercel Pro a databázou platí €420/rok minimum. Nie je to obrovské, ale za 5 rokov pri jednoduchom marketing site je to €2100 zbytočne.

## Čo nie je dôvod na rozhodnutie

- "React je trendy" — Astro robí React islands. Môžeš písať React komponenty kdekoľvek. Astro ti len nedrží React shell na celej stránke.
- "Next.js má lepšie SEO" — Nepravda. Astro generuje statické HTML, Next.js väčšinou tiež (App Router default je RSC + static), oba sú top na SEO. Záleží na obsahu, nie na frameworku.
- "Next.js vie hocičo" — Vie, ale ak nepotrebuješ servery a real-time, platíš za feature, ktorú nepoužiješ. Astro je 90 % funkcionality za 30 % komplexity pre content sites.

## TL;DR

Astro pre content (marketing, blog, docs, portfolio). Next.js pre app (dashboard, eshop s loginom, SaaS). Hybrid keď máš oboje (subdomény). Rozhodni cez 3 otázky: prihlásenie? heavy interaktivita? Node deploy? Tri "Nie" = Astro, tri "Áno" = Next.
