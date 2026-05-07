---
title: "Vercel vs Cloudflare Pages vs vlastný node: cena + výkon"
date: 2025-09-25
read: 8
tags: ["Hosting", "Next.js", "DevOps"]
excerpt: "Identický Next.js portfolio site, deploy na 3 platformy. Mesačné faktúry, latencia z Bratislavy, cold starts a kde sú kompromisy."
featured: false
---

Klient sa pýtal: "Kam mám deploynúť Next.js portfolio? Vercel vie každý kamarát, Cloudflare je vraj zadarmo, alebo si zoženiem VPS?" Namiesto teoretického porovnania som spravil reálny test: **identický Next.js 15.2 site, 50 statických stránok + 10 dynamických routes, 100k MAU baseline**, deploy na všetky tri.

## Setup testu

Aplikácia: portfolio + blog + 3 jednoduché formuláre (Server Actions). Žiadny SQL, dáta z headless WP cez REST API. ISR `revalidate: 3600` na blog feed.

Test traffic: simulácia 100k MAU = ~3300 requests/day, peak 15 req/s. Robil som synthetic load 7 dní, sledoval som:

- Mesačnú faktúru (real, screenshot z dashboardu).
- Latencia z Bratislavy (z mojej linky, 3 merania denne).
- Cold start latency (deploy → prvý request).
- Bandwidth a build minutes.

## 1) Vercel

Plan: **Pro za €20/mes**. Hobby plan zadarmo NETESTOVAL som — má fair use limit 100 GB bandwidth ktorý by som pri 100k MAU prekročil.

**Mesačná faktúra:**

- Pro plan base: €20.
- Bandwidth (175 GB): zahnuté v €20 (Pro má 1TB).
- Function executions (300k): v limite (1M/mes).
- Build minutes (40 min): v limite (6000 min/mes).
- **Total: €20.**

**Latencia z Bratislavy:**

- Frankfurt edge (FRA1): **22-28 ms TTFB** pre statické stránky.
- ISR regenerácia: 380 ms (jeden hop do origin v eu-west).
- Server Action: 65 ms.

**Cold start:**

- Po deploy-i prvý request na dynamic route: **180-220 ms** cold start (Node.js function init).
- Ďalšie requests: 25-40 ms.
- Po 15 min idle: znovu cold.

**Plus:**
- Najlepšie DX, čo som zažil. `git push` → URL.
- Preview deploys per PR zadarmo.
- Image Optimization built-in.
- Analytics + Speed Insights.

**Mínus:**
- Cena rastie pri vyššom traffic-u (bandwidth €0.15/GB nad 1TB).
- Vendor lock-in na proprietárne features (Image Optimization, ISR cache).

## 2) Cloudflare Pages

Plan: **Free tier**. CF Pages free dáva 500 builds/mes a unlimited bandwidth pre statiku. Pre Next.js musíš použiť `@cloudflare/next-on-pages` adapter, ktorý transformuje Next na Workers (V8 runtime, NIE Node).

**Mesačná faktúra:**

- Pages: €0 (do 100k requests/day pre dynamic routes — som mal 3300/day, easily v limite).
- Workers: €0 (Free plan: 100k requests/day).
- KV (cache): €0 (10M reads/mes free).
- **Total: €0.**

**Latencia z Bratislavy:**

- Cloudflare anycast: **15-22 ms TTFB**. Najrýchlejšia z trojice.
- ISR-equivalent (cached na KV): 18 ms.
- Server Action (Worker): 45 ms.

**Cold start:**

- Workers majú **near-zero cold start** (V8 isolates spustia za ~5 ms). **Nemerateľné v praxi.** Toto je killer feature.

**Plus:**
- Najrýchlejšia globálne (300+ edge locations).
- Cena nepostojí ak nepoužívaš platené services (R2, D1).
- Workers cold start nie je téma.

**Mínus:**
- **Workers runtime nie je Node.js.** Niektoré npm packages nefungujú (čo používa `fs`, `crypto.createHash` API rozdiely, `Buffer` polyfilly). Asi 5 % balíkov mi padlo.
- `@cloudflare/next-on-pages` adapter je fungujúci ale občas behind Next.js — keď vyšiel Next 15.2, podpora prišla po týždni.
- ISR funguje, ale cez KV layer — debugging je menej priamy ako vo Vercel.
- Image Optimization nemáš zadarmo, musíš použiť Cloudflare Images (€5/mes) alebo external service.

## 3) VPS Hetzner + Coolify

Plan: **CX22 Hetzner** za €5.83/mes (2 vCPU, 4 GB RAM, 40 GB SSD, lokácia Helsinki). Coolify ako self-hosted Vercel-alike (€0, open source).

**Mesačná faktúra:**

- VPS: €5.83.
- Domény, SSL: zadarmo (Let's Encrypt cez Coolify).
- Cloudflare DNS + free CDN (orange cloud): €0.
- **Total: €5.83.**

**Latencia z Bratislavy:**

- Helsinki origin: **30-38 ms TTFB**.
- S Cloudflare CDN pred VPS-kom (orange cloud): **18-24 ms** (cache hit) / 35 ms (cache miss).

**Cold start:**

- Žiadny — Next.js beží ako persistent Node.js proces. **Always warm.**

**Plus:**
- Najlacnejšie pri raste — 1M MAU stojí stále €6/mes.
- Plný kontrola — môžem inštalovať čokoľvek (Redis, PostgreSQL, custom binaries).
- Žiadny vendor lock-in. Pre štátne projekty (DPP) niekedy nutné.

**Mínus:**
- **Maintenance overhead.** Backupy, security updates, monitoring. Cca 2-4 hodiny/mes.
- Single region — pre globálny audit nestačí (nutný CDN frontend).
- Žiadny preview deploy out-of-the-box (Coolify má branches ale nie tak hladké ako Vercel).
- Pri výpadku VPS nikto neopraví — tvoja zodpovednosť.

## Porovnanie v jednej tabuľke

| | Vercel Pro | Cloudflare Pages | Hetzner + Coolify |
|---|---|---|---|
| Cena/mes | €20 | €0 | €6 |
| TTFB Bratislava | 25 ms | 18 ms | 22 ms (s CDN) |
| Cold start | 180-220 ms | ~5 ms | 0 ms |
| DX | Top | Dobrá | Stredná (treba setup) |
| Image Opt | Built-in | €5/mes extra | self-host |
| Vendor lock | Vysoký | Stredný | Žiadny |
| Maintenance | 0h | 0h | 2-4h/mes |

## Komu odporučím čo

- **Solopreneur, prvý projekt, nechce sa starať**: Vercel Pro €20. Najjednoduchšie.
- **Hobby projekt / portfolio / malý web**: Cloudflare Pages free. Najlepší pomer cena/výkon.
- **Vyšší traffic (>500k MAU), kontrola, dlhodobo**: VPS + Coolify. €6/mes pri akomkoľvek scale.
- **Klient s GDPR požiadavkou na EU-only data**: VPS Hetzner Nemecko.
- **Tím s React/Next.js skills**: Vercel pre flow, Cloudflare ak treba šetriť.

## TL;DR

Najlacnejší výkonný hosting Next.js v 2026 je **Cloudflare Pages free**, ak ti netrápi runtime non-Node. Najlepší DX je stále **Vercel** za €20/mes. Najlacnejší pri scale je **VPS Hetzner + Coolify** za €6/mes ale platíš to časom na maintenance. Žiadna univerzálna odpoveď — záleží od projektu, tímu a toho, či chceš mať voľný víkend.
