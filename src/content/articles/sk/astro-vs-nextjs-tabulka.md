---
title: "Kedy vybrať Astro namiesto Next.js: rozhodovacia tabuľka"
date: 2025-11-08
read: 8
tags: ["Astro", "Next.js"]
excerpt: "8 osí, jedna tabuľka, žiadne zbytočné debaty na Twitteri. Astro na marketing, blog a dokumentáciu, Next na aplikáciu a dashboard. Kedy ich kombinovať a kedy si vybrať jeden."
featured: false
---

Klienti sa pýtajú: „Astro alebo Next?" Odpoviem otázkou — „Čo je to za projekt?" Odpoveď väčšinou rieši 70 % rozhodnutia. Pre zvyšných 30 % mám túto tabuľku.

## 8 rozhodovacích osí

| Os | Astro vyhráva, keď | Next.js vyhráva, keď |
|---|---|---|
| **Typ projektu** | Marketingový web, blog, dokumentácia, portfólio, landing page | Dashboard, eshop s prihlásenými používateľmi, SaaS aplikácia |
| **Profil návštevnosti** | Občasné návštevy, čítanie | Neustála prevádzka, real-time, trvalý stav |
| **Zručnosti tímu** | Najprv HTML/CSS, JS len tu a tam | Tím zbehlý v Reacte, state management denne |
| **Cieľ nasadenia** | Statické CDN (Cloudflare Pages, Netlify) | Node server, edge funkcie, Vercel/AWS |
| **Napojenie na CMS** | Načítanie pri builde, regenerácia pri publikovaní | Načítanie za behu, ISR, revalidácia na požiadanie |
| **Interaktivita** | Miestami (vyhľadávanie, modál, počítadlo košíka) | Ťažký stav (drag-and-drop, real-time, živé UI) |
| **Rozpočet / čas** | < 5 000 €, < 6 týždňov | > 15 000 €, viac mesiacov, vyhradený tím |
| **Budúci rozsah** | Jeden web, predvídateľný rast | Platforma, multi-tenant, pribúdajúce funkcie |

## Astro vyhráva — konkrétne projekty

**Marketingový web pre B2B firmu (15 stránok).**
Zbuildíš raz, nasadíš na CDN, žiadny server. JS bundle pod 30 KB pre celú stránku. LCP aj INP z Core Web Vitals budú zelené bez námahy. Klient pridá novú prípadovú štúdiu cez headless CMS (Sanity, Storyblok), webhook spustí rebuild a za 90 s je online. Žiadny Node, žiadne studené štarty na Verceli.

**Vývojársky blog (50 – 500 článkov).**
Content Collections + MDX = typová bezpečnosť od začiatku do konca (písal som o tom [tu](/blog/astro-content-collections-mdx)). Build za 30 s. Hostuje sa zadarmo na Cloudflare Pages alebo GitHub Pages.

**Dokumentačný web.**
Starlight (šablóna pre Astro) je presne na to. Vyhľadávanie, bočná navigácia, zvýrazňovanie syntaxe, tmavý režim — všetko hneď v základe.

**Portfólio.**
Statický web, občas plný obrázkov. Astro `<Image />` s automatickým WebP/AVIF a responzívnym srcset = bez práce.

## Next.js vyhráva — konkrétne projekty

**SaaS dashboard.**
Používateľ je prihlásený, vidí svoje dáta, počas jednej relácie preklikáva 30 obrazoviek. Autentifikácia na strane servera (Auth.js / Clerk), API routes, aktualizácie v reálnom čase (websockety alebo Server-Sent Events). Astro toto **vie**, ale Next je na to stavaný natívne a nástrojov je 5× viac.

**Eshop s prihlásením, košíkom a pokladňou.**
Headless frontend nad WooCommerce, no zákazník má účet, históriu, wishlist a stav skladu v reálnom čase. ISR pre produktové stránky, dynamická pokladňa. Next.js App Router + React Server Components + streamovanie cez Suspense.

**Multi-tenant platforma.**
Subdoména na klienta, dynamický routing, autentifikácia na edge. `middleware.ts` v Nexte je na to ako stvorený.

**Funkcie v reálnom čase.**
Živý chat, kolaboratívne editovanie, indikátory prítomnosti. Astro tieto funkcie integruje (cez direktívy `client:`), ale ekosystém Next + React má 10× viac knižníc na drag-and-drop, virtualizáciu či orchestráciu animácií.

## Hybrid — kedy a ako

Niekedy je najlepšia odpoveď „oba". Príklad z reálneho projektu:

- `https://klient.sk` — marketingový web v Astre (5 stránok, blog, dokumentácia)
- `https://app.klient.sk` — SaaS aplikácia v Next.js
- `https://shop.klient.sk` — frontend v Astre + Snipcart na jednoduchý eshop

Subdomény, oddelené nasadenie, oddelené nástroje. Marketingový web je super rýchly (Astro), aplikácia má plnú výbavu (Next) a eshop má vlastný cyklus nasadzovania. Žiadny tím nemusí ovládať oboje — predaj a marketing editujú repozitár v Astre, vývojári robia v Nexte.

Náklady: dva CDN endpointy, dve DNS nastavenia domén. To je všetko.

## Rozhodovacie pravidlo v 3 otázkach

1. **Je používateľ prihlásený?** Áno → Next. Nie → pravdepodobne Astro.
2. **Má stránka ťažkú interaktivitu na viac ako 50 % obrazovky?** Áno → Next. Nie → Astro.
3. **Nasadzuje sa na Node/edge?** Áno → Next. Stačí statické CDN → Astro.

Tri odpovede „nie" = Astro. Tri „áno" = Next. Mix = pozri sa na os, ktorá o projekte rozhoduje konkrétne (často rozpočet alebo zručnosti tímu).

## Náklady na server (za rok)

Pre 10-tisíc mesačných používateľov (MAU):

| Zostava | Hosting | CDN | DB | Spolu / rok |
|---|---|---|---|---|
| Astro + Cloudflare Pages | 0 € | 0 € (free tier) | 0 € (načítanie z CMS pri builde) | **~60 €** (vlastná doména) |
| Astro + Vercel free | 0 € | 0 € | 0 € | ~60 € |
| Next.js + Vercel Pro | 240 € | v cene | 120 € (Neon, Supabase) | ~420 € |
| Next.js + vlastný VPS | 120 € | 0 € (Cloudflare proxy) | 60 € | ~240 € |

Pre malú firmu cez Cloudflare Pages s Astrom = prakticky zadarmo. Za Next.js s Vercel Pro a databázou zaplatíš minimálne 420 € ročne. Nie je to obrovská suma, ale za 5 rokov pri jednoduchom marketingovom webe je to 2 100 € zbytočne.

## Čo nie je dôvod na rozhodnutie

- „React je trendy" — Astro používa React islands. Môžeš písať React komponenty kdekoľvek. Astro ti len nedrží React shell na celej stránke.
- „Next.js má lepšie SEO" — Nepravda. Astro generuje statické HTML, Next.js väčšinou tiež (App Router má v základe RSC + statické renderovanie), oba sú na SEO špička. Záleží na obsahu, nie na frameworku.
- „Next.js vie hocičo" — Vie, ale ak nepotrebuješ servery a real-time, platíš za funkcie, ktoré nevyužiješ. Astro dá pri obsahových weboch 90 % funkčnosti za 30 % zložitosti.

## TL;DR

Astro na obsah (marketing, blog, dokumentácia, portfólio). Next.js na aplikáciu (dashboard, eshop s prihlásením, SaaS). Hybrid, keď máš oboje (subdomény). Rozhodni sa cez 3 otázky: prihlásenie? ťažká interaktivita? nasadenie na Node? Tri „nie" = Astro, tri „áno" = Next.
