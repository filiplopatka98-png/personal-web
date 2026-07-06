---
title: "Next.js App Router vs Pages Router in 2026: What Still Matters"
date: 2025-12-08
read: 7
tags: ["Next.js", "React"]
excerpt: "App Router is the default, Pages Router has frozen features but is still supported. When to migrate an existing project — and when to leave well enough alone."
featured: false
---

App Router shipped in Next.js 13 (October 2022, stable as of 13.4 in May 2023). It's 2026 now and I'm still opening client projects on the Pages Router. The question **"should we migrate?"** comes up at least once a month. The answer is more often no than yes.

## Where things stand in Next.js 16

- **App Router** — the default for new projects since Next.js 13.4. Every new feature (Server Components, Server Actions, Partial Prerendering / Cache Components) is **App Router only**.
- **Pages Router** — supported, gets bug fixes and security patches, but its **features are frozen**. No new APIs. Vercel has publicly committed to long-term support across multiple major versions, with no end-of-life date.

In other words: new project → App Router. Existing, stable Pages project with no new requirements → stay put and don't touch it.

The mental-model shift here is really the same one you run into with [React Server Components](/en/blog/server-components-5-veci/) — that's what the whole App Router story is built on.

## Feature comparison

| Feature | Pages Router | App Router |
|---|---|---|
| File-based routing | Yes | Yes (folder-based) |
| Layouts | `_app.js` (1 global) | Nested layouts |
| Server Components | No | Yes |
| Server Actions | No | Yes |
| Streaming + Suspense | Limited | Full |
| Middleware | Yes | Yes |
| API endpoints | `/api/*.ts` | Route handlers (`route.ts`) |
| `getStaticProps`/`getServerSideProps` | Yes | Replaced by async Server Components |
| ISR | `revalidate` in `getStaticProps` | `revalidate` export, `revalidateTag`, `revalidatePath` |

The biggest difference isn't in the APIs — it's in the **mental model**. Pages Router = "a page is a React component with static or server props." App Router = "a page is a React tree where you mix server and client at the component level."

## The cost of migration — a real case

A client had a project on Next.js 12: **50 pages**, a custom `_app.js`, a mix of `getStaticProps` and `getServerSideProps`. The migration took **3–5 working days for a senior developer**:

- **Day 1:** routing — moving `pages/` → `app/`, reworking `_app.js` into a root `layout.tsx`.
- **Day 2:** data — `getStaticProps` → async Server Component with `fetch`, `getServerSideProps` → dynamic Server Component.
- **Day 3:** client interactivity — adding `"use client"` to components that use `useState`/`useEffect`.
- **Day 4:** API — `/api/*` stayed as-is (App Router runs alongside Pages routes), with a gradual migration to route handlers later.
- **Day 5:** testing, fixing edge cases (often `next/link` behavior, moving `useRouter` from `next/router` to `next/navigation`).

If the project has a **custom server** (`server.js`), add another day. If it has **i18n routing** through the Pages Router, add **2–3 days** — App Router handles i18n with a different model (via middleware).

## Tools that help

Vercel ships codemods that save 30–40% of the manual work:

```bash
npx @next/codemod@latest app-dir-runtime-config-experimental-edge .
npx @next/codemod@latest next-async-request-api .
npx @next/codemod@latest metadata-to-viewport-export .
```

And an ESLint plugin flags deprecated APIs:

```bash
npm i -D @next/eslint-plugin-next
```

Codemods don't cover everything. You still have to think through the routing structure and the data layer by hand. If you're doing this migration, it's a good moment to also line up your [React 18 → 19 upgrade](/en/blog/react-19-migracia/), since App Router leans hard on modern React.

## The decision in 4 questions

1. **Are you planning to use Server Components or Server Actions?** Yes → migrate. No → question 2.
2. **Are you planning multi-tenant layouts or nested loading states?** Yes → migrate. No → question 3.
3. **Are you planning Partial Prerendering (PPR)?** Yes → migrate, it's app-only. No → question 4.
4. **Is there something specific bugging you on the Pages Router?** Yes → fix it locally. No → stay.

If the answer to all 4 is NO, **don't migrate**. The Pages Router is serving you fine. Migrating without a concrete reason is proceduralism, not engineering.

## When to stay on Pages, even for an active project

- **Internal admin tools** — development speed matters here, not performance or SEO. The Pages Router is predictable.
- **Marketing sites with a custom server** — if `server.js` handles your own auth or redirect logic.
- **Sites with massive build-time generation via `getStaticPaths`** (10,000+ pages) — App Router generates static pages with a different model and you can run into build-time issues.

## When to go all-in on App Router

- **A new project** — there's no point starting on a technology with frozen features.
- **An e-commerce site or SaaS with personalization** — Server Components and Server Actions save a ton of boilerplate.
- **A team experienced with React 19 / RSC** — App Router is more productive for them.

## A practical hybrid strategy

App Router and Pages Router **run side by side** in a single project. You can migrate incrementally:

```text
app/
  (new)/
    dashboard/page.tsx     ← new pages
  layout.tsx
pages/
  legacy-feature.tsx        ← old ones stay
  api/
    webhook.ts              ← API routes stay
```

This is the **best migration strategy** for a big project: incrementally, route by route, no big-bang reset. It works well — just watch out for duplicate paths and the global layout.

## TL;DR

New Next.js project → App Router, no debate. Existing Pages project → migrate only if you need Server Components, Server Actions, or PPR. Otherwise stay. The migration cost on a 50-page project is 3–5 days plus the risk of regressions. Better to put that time into Core Web Vitals or a new feature that delivers business value.

Related: [React Server Components: 5 things that surprised me](/en/blog/server-components-5-veci/) · [Next.js cache: revalidate, tag, path](/en/blog/nextjs-cache-revalidate/) · [When to pick Astro instead of Next.js](/en/blog/astro-vs-nextjs-tabulka/)
