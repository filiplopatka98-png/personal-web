---
title: "Next.js App Router vs Pages Router v 2026: čo zostáva relevantné"
date: 2025-12-08
read: 7
tags: ["Next.js", "React"]
excerpt: "App Router je default, Pages Router feature-frozen ale stále supported. Kedy migrovať existujúci projekt a kedy radšej netrhať pavúčiu sieť."
featured: false
---

App Router vyšiel v Next 13 (október 2022). Dnes je 2026 a ja stále otváram klientske projekty na Pages Routeri. Otázka **"máme migrovať?"** padne minimálne raz mesačne. Odpoveď je častejšie nie ako áno.

## Status v Next.js 15.2

- **App Router** — default pre nové projekty od Next 13.4. Všetky nové features (Server Components, Server Actions, Partial Prerendering) sú **app-only**.
- **Pages Router** — supported, dostáva bug fixy a security patche, ale **feature-frozen**. Žiadne nové API. Vercel verejne deklaroval long-term support, žiadne deprecation date.

Inými slovami: nový projekt → App. Existujúci stable Pages projekt bez nových requirementov → ostať a netrhať.

## Feature parity check

| Feature | Pages Router | App Router |
|---|---|---|
| File-based routing | Áno | Áno (zložkový) |
| Layouts | `_app.js` (1 globálny) | Nested layouts |
| Server Components | Nie | Áno |
| Server Actions | Nie | Áno |
| Streaming + Suspense | Obmedzené | Plné |
| Middleware | Áno | Áno |
| API routes | `/api/*.ts` | Route handlers (`route.ts`) |
| `getStaticProps`/`getServerSideProps` | Áno | Nahradené async Server Components |
| ISR | `revalidate` v `getStaticProps` | `revalidate` export, `revalidateTag`, `revalidatePath` |

Najväčší rozdiel nie je v API, ale v **mental modeli**. Pages Router = "stránka je React komponent so statickými/server props". App Router = "stránka je React strom, kde server a klient miešame na úrovni komponentov".

## Migration cost — reálny case

Klient mal Next 12 projekt, **50 stránok**, custom `_app.js`, mix `getStaticProps` a `getServerSideProps`. Migrácia trvala **3-5 pracovných dní pre senior dev**:

- **Deň 1:** routing — presun `pages/` → `app/`, prerobenie `_app.js` na root `layout.tsx`.
- **Deň 2:** dáta — `getStaticProps` → async Server Component s `fetch`, `getServerSideProps` → dynamic Server Component.
- **Deň 3:** klient interaktivita — pridanie `"use client"` do komponentov s `useState`/`useEffect`.
- **Deň 4:** API — `/api/*` ostali pri starom (App Router pages funguje vedľa Pages routes), neskôr postupná migrácia na route handlers.
- **Deň 5:** testovanie, fix edge-cases (často `next/link` behavior, `useRouter` zmena z `next/router` na `next/navigation`).

Ak má projekt **custom server** (`server.js`), prirátaj si ďalší deň. Ak má **i18n routing** cez Pages Router, prirátaj **2-3 dni** — App Router i18n je iný model (middleware-based).

## Tooling, ktorý pomáha

Vercel má codemody, ktoré ušetria 30-40 % manuálnej roboty:

```bash
npx @next/codemod@latest app-dir-runtime-config-experimental-edge .
npx @next/codemod@latest next-async-request-api .
npx @next/codemod@latest metadata-to-viewport-export .
```

A ESLint plugin upozorní na deprecated API:

```bash
npm i -D eslint-plugin-next
```

Codemody nepokryjú všetko. Routing štruktúra a dáta layer si stále treba premyslieť ručne.

## Rozhodnutie v 4 otázkach

1. **Plánuješ Server Components alebo Server Actions?** Áno → migruj. Nie → otázka 2.
2. **Plánuješ multi-tenant layouty alebo nested loading states?** Áno → migruj. Nie → otázka 3.
3. **Plánuješ Partial Prerendering (PPR)?** Áno → migruj, je app-only. Nie → otázka 4.
4. **Trápi ťa niečo na Pages Routeri konkrétne?** Áno → vyrieš to lokálne. Nie → ostaň.

Ak na všetky 4 otázky NIE, **nemigruj**. Pages Router ti slúži. Migrácia bez konkrétneho dôvodu je proceduralizmus, nie engineering.

## Kedy ostať na Pages aj keď je projekt aktívny

- **Internal admin tools** — dôležitý je dev velocity, nie performance ani SEO. Pages Router je predvídateľný.
- **Marketing sajty s custom servrom** — ak `server.js` rieši custom auth alebo redirect logiku.
- **Weby s heavy `getStaticPaths` build-time generáciou** (10k+ stránok) — App Router static gen má iný model, môžeš naraziť na build time problémy.

## Kedy ísť do App Router agresívne

- **Nový projekt** — nemá zmysel začínať na feature-frozen technológii.
- **Eshop alebo SaaS s personalizáciou** — Server Components + Server Actions šetria masu boilerplate-u.
- **Tím s React 19 / RSC skills** — App Router je pre nich produktívnejší.

## Praktická hybrid stratégia

App Router a Pages Router **fungujú vedľa seba** v jednom projekte. Môžeš migrovať postupne:

```text
app/
  (new)/
    dashboard/page.tsx     ← nové stránky
  layout.tsx
pages/
  legacy-feature.tsx        ← staré ostávajú
  api/
    webhook.ts              ← API routes ostávajú
```

Toto je **najlepšia migration stratégia** pre veľký projekt: postupne, route po route, bez veľkého reset-u. Funguje to dobre, len si daj pozor na duplicitné cesty a globálny layout.

## TL;DR

Nový Next projekt → App Router, nemáš čo riešiť. Existujúci Pages projekt → migruj iba ak potrebuješ Server Components, Server Actions, alebo PPR. Inak ostaň. Migration cost na 50-stránkovom projekte je 3-5 dní + risk regressions. Ten čas radšej daj do CWV alebo nového feature-u, ktorý prinesie business hodnotu.
