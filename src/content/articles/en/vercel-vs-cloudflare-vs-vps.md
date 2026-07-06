---
title: "Vercel vs Cloudflare Pages vs your own node: cost + performance"
date: 2025-09-25
read: 8
tags: ["Hosting", "Next.js", "DevOps"]
excerpt: "The same Next.js portfolio site, deployed to three platforms. Real monthly invoices, latency from Bratislava, cold starts, and where the trade-offs hide."
featured: false
---

A client asked me: "Where should I deploy my Next.js portfolio? Everybody's buddy knows Vercel, Cloudflare is supposedly free, or should I grab a VPS?" Instead of a theoretical comparison, I ran a real test: **the identical Next.js 15.2 site, 50 static pages + 10 dynamic routes, baseline 100,000 MAU**, deployed to all three platforms.

## Test setup

The app: portfolio + blog + 3 simple forms (Server Actions). No SQL, data pulled from a headless WordPress via the REST API. [ISR](/en/blog/isr-namiesto-cron/) with `revalidate: 3600` on the blog feed.

Test traffic: a simulation of 100,000 MAU = ~3,300 requests per day, peaking at 15 req/s. I ran a synthetic load for 7 days and tracked:

- The monthly invoice (the real one, screenshot from the dashboard).
- Latency from Bratislava (over my own line, 3 measurements a day).
- Cold-start latency (deploy → first request).
- Bandwidth and build minutes.

## 1) Vercel

Plan: **Pro at €20/mo**. I did NOT test the free Hobby plan — it has a fair-use limit of 100 GB of bandwidth, which I'd blow past at 100,000 MAU.

**Monthly invoice:**

- Pro plan base: €20.
- Bandwidth (175 GB): included in the €20 (Pro comes with 1 TB).
- Function executions (300k): within the limit (1M/mo).
- Build minutes (40 min): within the limit (6,000 min/mo).
- **Total: €20.**

**Latency from Bratislava:**

- Frankfurt edge (FRA1): **22–28 ms TTFB** for static pages.
- ISR regeneration: 380 ms (one hop to the origin in eu-west).
- Server Action: 65 ms.

**Cold start:**

- After a deploy, the first request to a dynamic route: **180–220 ms** cold start (Node.js function init).
- Subsequent requests: 25–40 ms.
- After 15 min of inactivity: cold again.

**Pros:**
- The best DX I've ever experienced. `git push` → URL.
- Preview deploys for every PR, free.
- Image Optimization built in.
- Analytics + Speed Insights.

**Cons:**
- Cost climbs as traffic grows (bandwidth is €0.15/GB above 1 TB).
- Vendor lock-in on proprietary features (Image Optimization, ISR cache).

## 2) Cloudflare Pages

Plan: **Free tier**. CF Pages free gives you 500 builds/mo and unlimited bandwidth for static assets. For Next.js I used the `@cloudflare/next-on-pages` adapter at the time, which transforms Next into Workers (V8 runtime, NOT Node). (Note: that adapter is now deprecated — Cloudflare has since moved to the OpenNext adapter for Workers, which already supports a Node.js runtime too.)

**Monthly invoice:**

- Pages: €0 (up to 100,000 requests per day for dynamic routes — I had 3,300 a day, comfortably within the limit).
- Workers: €0 (Free plan: 100,000 requests per day).
- KV (cache): €0 (10M reads/mo free).
- **Total: €0.**

**Latency from Bratislava:**

- Cloudflare anycast: **15–22 ms TTFB**. The fastest of the three.
- ISR equivalent (cached in KV): 18 ms.
- Server Action (Worker): 45 ms.

**Cold start:**

- Workers have **almost zero cold start** (V8 isolates spin up in ~5 ms). **Not measurable in practice.** This is the killer feature.

**Pros:**
- Fastest globally (330+ edge locations).
- Cost doesn't climb as long as you don't use paid services (R2, D1).
- Worker cold start is a non-issue.

**Cons:**
- **The Workers runtime is not Node.js.** Some npm packages don't work (the ones that use `fs`, the API differences in `crypto.createHash`, `Buffer` polyfills). Roughly 5% of my packages broke.
- The `@cloudflare/next-on-pages` adapter works, but it sometimes lags behind Next.js — when Next 15.2 dropped, support landed a week later.
- ISR works, but through a KV layer — debugging is less direct than on Vercel.
- You don't get Image Optimization for free — you have to use Cloudflare Images (usage-based, roughly $5 per 100,000 stored images + $1 per 100,000 delivered) or an external service.

## 3) VPS Hetzner + Coolify

Plan: **Hetzner CX22** at €3.79/mo (2 vCPU, 4 GB RAM, 40 GB SSD, Helsinki location). Coolify as a self-hosted alternative to Vercel (€0, open source).

**Monthly invoice:**

- VPS: €3.79.
- Domains, SSL: free (Let's Encrypt via Coolify).
- Cloudflare DNS + free CDN (orange cloud): €0.
- **Total: €3.79.**

**Latency from Bratislava:**

- Helsinki origin: **30–38 ms TTFB**.
- With the Cloudflare CDN in front of the VPS (orange cloud): **18–24 ms** (cache hit) / 35 ms (cache miss).

**Cold start:**

- None — Next.js runs as a persistent Node.js process. **Always warm.**

**Pros:**
- Cheapest as you scale — even 1M MAU still costs ~€4/mo.
- Full control — I can install anything (Redis, PostgreSQL, custom binaries).
- No vendor lock-in. For government projects (DPP) it's sometimes a requirement.

**Cons:**
- **Maintenance overhead.** Backups, security updates, monitoring. Roughly 2–4 hours/mo.
- One region — not enough for a global audience (you need a CDN in front).
- No preview deploys out of the box (Coolify has branches, but not as smoothly as Vercel).
- If the VPS goes down, nobody's going to fix it for you — that's on you.

## Everything in one table

| | Vercel Pro | Cloudflare Pages | Hetzner + Coolify |
|---|---|---|---|
| Cost/mo | €20 | €0 | ~€4 |
| TTFB Bratislava | 25 ms | 18 ms | 22 ms (with CDN) |
| Cold start | 180–220 ms | ~5 ms | 0 ms |
| DX | Top | Good | Medium (needs setup) |
| Image Opt | built in | usage-based extra | self-host |
| Vendor lock | High | Medium | None |
| Maintenance | 0 h | 0 h | 2–4 h/mo |

## Who I'd recommend what to

- **Solopreneur, first project, doesn't want the hassle**: Vercel Pro at €20. Simplest option.
- **Hobby project / portfolio / small site**: Cloudflare Pages free. Best price/performance ratio.
- **Higher traffic (>500,000 MAU), control, long-term**: VPS + Coolify. ~€4/mo at any scale.
- **Client with a GDPR requirement for EU-only data**: VPS Hetzner Germany.
- **A team experienced with React/Next.js**: Vercel for the flow, Cloudflare if you need to save money.

## TL;DR

The cheapest high-performance Next.js hosting in 2026 is **Cloudflare Pages free**, if the non-Node runtime doesn't bother you. The best DX still belongs to **Vercel** at €20/mo. The cheapest at scale is a **VPS Hetzner + Coolify** at just under €4/mo, but you pay for it in time spent on maintenance. There's no universal answer — it depends on the project, the team, and whether you want your weekend free.

**Related:** [realistic hosting-performance numbers for SK](/en/blog/hostingy-sk-vykon/), [getting server response time under 200ms](/en/blog/server-response-200ms/), and [when to pick Astro instead of Next.js](/en/blog/astro-vs-nextjs-tabulka/).
