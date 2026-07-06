---
title: "When to Pick Astro Over Next.js: A Decision Table"
date: 2025-11-08
read: 8
tags: ["Astro", "Next.js"]
excerpt: "8 axes, one table, none of the pointless Twitter debates. Astro for marketing, blogs, and docs; Next for the app and the dashboard. When to combine them and when to just pick one."
featured: false
---

Clients ask me: "Astro or Next?" I answer with a question — "What kind of project is it?" The answer usually settles 70% of the decision. For the remaining 30%, I have this table.

## 8 decision axes

| Axis | Astro wins when | Next.js wins when |
|---|---|---|
| **Project type** | Marketing site, blog, docs, portfolio, landing page | Dashboard, store with logged-in users, SaaS app |
| **Traffic profile** | Occasional visits, reading | Constant traffic, real-time, persistent state |
| **Team skills** | HTML/CSS first, JS only here and there | Team fluent in React, state management daily |
| **Deployment target** | Static CDN (Cloudflare Pages, Netlify) | Node server, edge functions, Vercel/AWS |
| **CMS integration** | Fetch at build, regenerate on publish | Fetch at runtime, ISR, on-demand revalidation |
| **Interactivity** | Occasional (search, modal, cart counter) | Heavy state (drag-and-drop, real-time, live UI) |
| **Budget / time** | < €5,000, < 6 weeks | > €15,000, several months, dedicated team |
| **Future scope** | One site, predictable growth | Platform, multi-tenant, features piling up |

## Astro wins — concrete projects

**Marketing site for a B2B company (15 pages).**
Build once, deploy to a CDN, no server. JS bundle under 30 KB for the whole site. LCP and INP from Core Web Vitals will go green without any effort. The client adds a new case study through a headless CMS (Sanity, Storyblok), a webhook triggers a rebuild, and it's live in 90 seconds. No Node, no cold starts on Vercel.

**Developer blog (50–500 articles).**
Content Collections + MDX = type safety end to end (I wrote about it [here](/en/blog/astro-content-collections-mdx)). Build in 30 seconds. Hosts for free on Cloudflare Pages or GitHub Pages.

**Documentation site.**
Starlight (an Astro template) is built for exactly this. Search, sidebar navigation, syntax highlighting, dark mode — all of it out of the box.

**Portfolio.**
A static site, often image-heavy. Astro's `<Image />` with automatic WebP/AVIF and responsive srcset = zero effort.

## Next.js wins — concrete projects

**SaaS dashboard.**
The user is logged in, sees their own data, and clicks through 30 screens in a single session. Server-side authentication (Auth.js / Clerk), API routes, real-time updates (websockets or Server-Sent Events). Astro **can** do this, but Next is built for it natively and there's 5× the tooling.

**Store with login, cart, and checkout.**
A headless frontend on top of WooCommerce, but the customer has an account, order history, a wishlist, and real-time stock status. ISR for product pages, dynamic checkout. Next.js App Router + React Server Components + streaming via Suspense. (I broke down [when a headless Woo + Next.js build actually pays off](/en/blog/headless-woo-nextjs-kedy) separately.)

**Multi-tenant platform.**
A subdomain per client, dynamic routing, authentication at the edge. `middleware.ts` in Next is made for this.

**Real-time features.**
Live chat, collaborative editing, presence indicators. Astro integrates these features too (via `client:` directives), but the Next + React ecosystem has 10× the libraries for drag-and-drop, virtualization, or animation orchestration.

## Hybrid — when and how

Sometimes the best answer is "both." An example from a real project:

- `https://client.com` — marketing site in Astro (5 pages, blog, docs)
- `https://app.client.com` — SaaS app in Next.js
- `https://shop.client.com` — Astro frontend + Snipcart for a simple store

Subdomains, separate deployments, separate tooling. The marketing site is blazing fast (Astro), the app is fully loaded (Next), and the store has its own deploy cycle. No single team has to know both — sales and marketing edit the Astro repo, the developers work in Next.

Cost: two CDN endpoints, two DNS domain configs. That's it.

## The decision rule in 3 questions

1. **Is the user logged in?** Yes → Next. No → probably Astro.
2. **Does the page have heavy interactivity on more than 50% of the screen?** Yes → Next. No → Astro.
3. **Are you deploying to Node/edge?** Yes → Next. A static CDN is enough → Astro.

Three "no" answers = Astro. Three "yes" = Next. A mix = look at the axis that actually decides the project (often budget or team skills).

## Server costs (per year)

For 10,000 monthly active users (MAU):

| Stack | Hosting | CDN | DB | Total / year |
|---|---|---|---|---|
| Astro + Cloudflare Pages | €0 | €0 (free tier) | €0 (fetch from CMS at build) | **~€60** (own domain) |
| Astro + Vercel free | €0 | €0 | €0 | ~€60 |
| Next.js + Vercel Pro | €240 | included | €120 (Neon, Supabase) | ~€420 |
| Next.js + own VPS | €120 | €0 (Cloudflare proxy) | €60 | ~€240 |

For a small business, Astro on Cloudflare Pages = practically free. With Next.js on Vercel Pro plus a database, you'll pay at least €420 a year. It's not a huge sum, but over 5 years on a plain marketing site that's €2,100 down the drain. (I ran the full [Vercel vs Cloudflare Pages vs your own node](/en/blog/vercel-vs-cloudflare-vs-vps) breakdown with real numbers.)

## What isn't a reason to decide

- "React is trendy" — Astro uses React islands. You can write React components anywhere. Astro just doesn't keep a React shell around the entire page.
- "Next.js has better SEO" — Not true. Astro generates static HTML, and Next.js mostly does too (App Router ships RSC + static rendering by default); both are top-tier for SEO. It depends on the content, not the framework.
- "Next.js can do anything" — It can, but if you don't need servers and real-time, you're paying for features you won't use. On content sites, Astro gives you 90% of the functionality at 30% of the complexity.

## TL;DR

Astro for content (marketing, blog, docs, portfolio). Next.js for the app (dashboard, store with login, SaaS). Hybrid when you have both (subdomains). Decide with 3 questions: login? heavy interactivity? Node deployment? Three "no" = Astro, three "yes" = Next.
