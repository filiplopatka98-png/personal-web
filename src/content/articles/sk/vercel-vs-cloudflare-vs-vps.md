---
title: "Vercel vs Cloudflare Pages vs vlastný node: cena + výkon"
date: 2025-09-25
read: 8
tags: ["Hosting", "Next.js", "DevOps"]
excerpt: "Identická Next.js portfólio stránka, nasadená na tri platformy. Reálne mesačné faktúry, latencia z Bratislavy, cold starty a kde sú kompromisy."
featured: false
---

Klient sa pýtal: „Kam mám nasadiť Next.js portfólio? Vercel pozná každý kamarát, Cloudflare je vraj zadarmo, alebo si zoženiem VPS?“ Namiesto teoretického porovnania som spravil reálny test: **identická Next.js 15.2 stránka, 50 statických stránok + 10 dynamických routes, baseline 100 000 MAU**, nasadená na všetky tri platformy.

## Setup testu

Aplikácia: portfólio + blog + 3 jednoduché formuláre (Server Actions). Žiadny SQL, dáta z headless WordPressu cez REST API. [ISR](/blog/isr-namiesto-cron/) `revalidate: 3600` na blog feed.

Testovacia prevádzka: simulácia 100 000 MAU = ~3300 requestov denne, peak 15 req/s. Púšťal som syntetický load 7 dní a sledoval som:

- Mesačnú faktúru (reálnu, screenshot z dashboardu).
- Latenciu z Bratislavy (z mojej linky, 3 merania denne).
- Latenciu cold startu (deploy → prvý request).
- Bandwidth a build minúty.

## 1) Vercel

Plán: **Pro za 20 €/mes**. Hobby plán zadarmo som NETESTOVAL — má fair-use limit 100 GB bandwidthu, ktorý by som pri 100 000 MAU prekročil.

**Mesačná faktúra:**

- Pro plán base: 20 €.
- Bandwidth (175 GB): zahrnuté v 20 € (Pro má 1 TB).
- Function executions (300k): v limite (1 M/mes).
- Build minúty (40 min): v limite (6000 min/mes).
- **Spolu: 20 €.**

**Latencia z Bratislavy:**

- Frankfurt edge (FRA1): **22 – 28 ms TTFB** pre statické stránky.
- ISR regenerácia: 380 ms (jeden hop do originu v eu-west).
- Server Action: 65 ms.

**Cold start:**

- Po nasadení prvý request na dynamickú route: **180 – 220 ms** cold start (init Node.js funkcie).
- Ďalšie requesty: 25 – 40 ms.
- Po 15 min nečinnosti: znova cold.

**Plus:**
- Najlepšie DX, aké som zažil. `git push` → URL.
- Preview deploye pre každý PR zadarmo.
- Image Optimization zabudovaný.
- Analytics + Speed Insights.

**Mínus:**
- Cena rastie pri vyššej prevádzke (bandwidth 0,15 €/GB nad 1 TB).
- Vendor lock-in na proprietárne funkcie (Image Optimization, ISR cache).

## 2) Cloudflare Pages

Plán: **Free tier**. CF Pages free dáva 500 buildov/mes a neobmedzený bandwidth pre statiku. Pre Next.js som vtedy použil adaptér `@cloudflare/next-on-pages`, ktorý transformuje Next na Workers (V8 runtime, NIE Node). (Pozn.: tento adaptér je dnes deprecatnutý — Cloudflare odvtedy prešiel na adaptér OpenNext pre Workers, ktorý už podporuje aj Node.js runtime.)

**Mesačná faktúra:**

- Pages: 0 € (do 100 000 requestov denne pre dynamické routes — mal som 3300 denne, hravo v limite).
- Workers: 0 € (Free plán: 100 000 requestov denne).
- KV (cache): 0 € (10 M čítaní/mes zadarmo).
- **Spolu: 0 €.**

**Latencia z Bratislavy:**

- Cloudflare anycast: **15 – 22 ms TTFB**. Najrýchlejšia z trojice.
- ISR ekvivalent (cachnuté v KV): 18 ms.
- Server Action (Worker): 45 ms.

**Cold start:**

- Workers majú **takmer nulový cold start** (V8 isolates sa spustia za ~5 ms). **V praxi nemerateľné.** Toto je killer feature.

**Plus:**
- Najrýchlejšia globálne (330+ edge lokalít).
- Cena nestúpne, ak nepoužívaš platené služby (R2, D1).
- Cold start Workerov nie je téma.

**Mínus:**
- **Workers runtime nie je Node.js.** Niektoré npm balíky nefungujú (tie, čo používajú `fs`, rozdiely v API `crypto.createHash`, polyfilly `Buffer`). Asi 5 % balíkov mi padlo.
- Adaptér `@cloudflare/next-on-pages` funguje, ale občas zaostáva za Next.js — keď vyšiel Next 15.2, podpora prišla po týždni.
- ISR funguje, ale cez vrstvu KV — debugovanie je menej priame ako na Verceli.
- Image Optimization nemáš zadarmo — musíš použiť Cloudflare Images (usage-based, cca 5 $ za 100 000 uložených obrázkov + 1 $ za 100 000 doručených) alebo externú službu.

## 3) VPS Hetzner + Coolify

Plán: **Hetzner CX22** za 3,79 €/mes (2 vCPU, 4 GB RAM, 40 GB SSD, lokalita Helsinki). Coolify ako self-hosted alternatíva k Vercelu (0 €, open source).

**Mesačná faktúra:**

- VPS: 3,79 €.
- Domény, SSL: zadarmo (Let's Encrypt cez Coolify).
- Cloudflare DNS + free CDN (orange cloud): 0 €.
- **Spolu: 3,79 €.**

**Latencia z Bratislavy:**

- Helsinki origin: **30 – 38 ms TTFB**.
- S Cloudflare CDN pred VPS-kom (orange cloud): **18 – 24 ms** (cache hit) / 35 ms (cache miss).

**Cold start:**

- Žiadny — Next.js beží ako perzistentný Node.js proces. **Vždy warm.**

**Plus:**
- Najlacnejšie pri raste — aj 1 M MAU stojí stále ~4 €/mes.
- Plná kontrola — môžem nainštalovať čokoľvek (Redis, PostgreSQL, vlastné binárky).
- Žiadny vendor lock-in. Pri štátnych projektoch (DPP) niekedy nutnosť.

**Mínus:**
- **Réžia s údržbou.** Zálohy, bezpečnostné aktualizácie, monitoring. Cca 2 – 4 hodiny/mes.
- Jeden región — pre globálne publikum nestačí (treba CDN pred tým).
- Žiadny preview deploy out-of-the-box (Coolify má branche, ale nie tak hladko ako Vercel).
- Pri výpadku VPS ho nikto neopraví — je to tvoja zodpovednosť.

## Porovnanie v jednej tabuľke

| | Vercel Pro | Cloudflare Pages | Hetzner + Coolify |
|---|---|---|---|
| Cena/mes | 20 € | 0 € | ~4 € |
| TTFB Bratislava | 25 ms | 18 ms | 22 ms (s CDN) |
| Cold start | 180 – 220 ms | ~5 ms | 0 ms |
| DX | Top | Dobrá | Stredná (treba setup) |
| Image Opt | zabudovaný | usage-based extra | self-host |
| Vendor lock | Vysoký | Stredný | Žiadny |
| Údržba | 0 h | 0 h | 2 – 4 h/mes |

## Komu odporučím čo

- **Solopreneur, prvý projekt, nechce sa starať**: Vercel Pro 20 €. Najjednoduchšie.
- **Hobby projekt / portfólio / malý web**: Cloudflare Pages free. Najlepší pomer cena/výkon.
- **Vyššia prevádzka (>500 000 MAU), kontrola, dlhodobo**: VPS + Coolify. ~4 €/mes pri akomkoľvek scale.
- **Klient s GDPR požiadavkou na EU-only dáta**: VPS Hetzner Nemecko.
- **Tím so skúsenosťami s Reactom/Next.js**: Vercel pre flow, Cloudflare ak treba šetriť.

## TL;DR

Najlacnejší výkonný hosting Next.js v roku 2026 je **Cloudflare Pages free**, ak ti neprekáža non-Node runtime. Najlepšie DX má stále **Vercel** za 20 €/mes. Najlacnejší pri scale je **VPS Hetzner + Coolify** za necelé 4 €/mes, ale platíš to časom stráveným na údržbe. Žiadna univerzálna odpoveď — záleží od projektu, tímu a od toho, či chceš mať voľný víkend.

**Súvisiace:** [realistické čísla o výkone SK hostingov](/blog/hostingy-sk-vykon/), [server response time pod 200ms](/blog/server-response-200ms/) a [kedy vybrať Astro namiesto Next.js](/blog/astro-vs-nextjs-tabulka/).
