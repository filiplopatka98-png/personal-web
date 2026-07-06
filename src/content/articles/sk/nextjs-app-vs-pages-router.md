---
title: "Next.js App Router vs Pages Router v 2026: čo zostáva relevantné"
date: 2025-12-08
read: 7
tags: ["Next.js", "React"]
excerpt: "App Router je predvolený, Pages Router má zamrznuté funkcie, no stále je podporovaný. Kedy migrovať existujúci projekt a kedy radšej netrhať pavučinu."
featured: false
---

App Router vyšiel v Next.js 13 (október 2022, stabilný od 13.4 v máji 2023). Dnes je rok 2026 a ja stále otváram klientske projekty na Pages Routeri. Otázka **„máme migrovať?“** padne minimálne raz mesačne. Odpoveď je častejšie nie ako áno.

## Aký je stav v Next.js 16

- **App Router** — predvolený pre nové projekty od Next.js 13.4. Všetky nové funkcie (Server Components, Server Actions, Partial Prerendering / Cache Components) sú **len pre App Router**.
- **Pages Router** — podporovaný, dostáva opravy chýb a bezpečnostné záplaty, no **funkcie má zamrznuté**. Žiadne nové API. Vercel verejne deklaroval dlhodobú podporu naprieč viacerými major verziami, bez dátumu ukončenia.

Inými slovami: nový projekt → App Router. Existujúci stabilný Pages projekt bez nových požiadaviek → ostať a netrhať.

## Porovnanie funkcií

| Funkcia | Pages Router | App Router |
|---|---|---|
| Smerovanie podľa súborov | Áno | Áno (podľa zložiek) |
| Rozloženia (layouts) | `_app.js` (1 globálny) | Vnorené rozloženia |
| Server Components | Nie | Áno |
| Server Actions | Nie | Áno |
| Streaming + Suspense | Obmedzené | Plné |
| Middleware | Áno | Áno |
| API endpointy | `/api/*.ts` | Route handlers (`route.ts`) |
| `getStaticProps`/`getServerSideProps` | Áno | Nahradené async Server Components |
| ISR | `revalidate` v `getStaticProps` | `revalidate` export, `revalidateTag`, `revalidatePath` |

Najväčší rozdiel nie je v API, ale v **mentálnom modeli**. Pages Router = „stránka je React komponent so statickými alebo serverovými props“. App Router = „stránka je React strom, kde server a klient miešame na úrovni komponentov“.

## Cena migrácie — reálny prípad

Klient mal projekt na Next.js 12, **50 stránok**, vlastný `_app.js`, mix `getStaticProps` a `getServerSideProps`. Migrácia trvala **3 – 5 pracovných dní pre senior vývojára**:

- **Deň 1:** smerovanie — presun `pages/` → `app/`, prerobenie `_app.js` na koreňový `layout.tsx`.
- **Deň 2:** dáta — `getStaticProps` → async Server Component s `fetch`, `getServerSideProps` → dynamický Server Component.
- **Deň 3:** klientská interaktivita — pridanie `"use client"` do komponentov s `useState`/`useEffect`.
- **Deň 4:** API — `/api/*` ostali po starom (App Router funguje vedľa Pages routes), neskôr postupná migrácia na route handlers.
- **Deň 5:** testovanie, oprava hraničných prípadov (často správanie `next/link`, presun `useRouter` z `next/router` na `next/navigation`).

Ak má projekt **vlastný server** (`server.js`), prirátaj si ďalší deň. Ak má **i18n smerovanie** cez Pages Router, prirátaj **2 – 3 dni** — App Router rieši i18n iným modelom (cez middleware).

## Nástroje, ktoré pomáhajú

Vercel má codemody, ktoré ušetria 30 – 40 % manuálnej roboty:

```bash
npx @next/codemod@latest app-dir-runtime-config-experimental-edge .
npx @next/codemod@latest next-async-request-api .
npx @next/codemod@latest metadata-to-viewport-export .
```

A ESLint plugin upozorní na zastarané API:

```bash
npm i -D @next/eslint-plugin-next
```

Codemody nepokryjú všetko. Štruktúru smerovania a dátovú vrstvu si stále treba premyslieť ručne.

## Rozhodnutie v 4 otázkach

1. **Plánuješ Server Components alebo Server Actions?** Áno → migruj. Nie → otázka 2.
2. **Plánuješ multi-tenant layouty alebo nested loading states?** Áno → migruj. Nie → otázka 3.
3. **Plánuješ Partial Prerendering (PPR)?** Áno → migruj, je app-only. Nie → otázka 4.
4. **Trápi ťa niečo na Pages Routeri konkrétne?** Áno → vyrieš to lokálne. Nie → ostaň.

Ak je odpoveď na všetky 4 otázky NIE, **nemigruj**. Pages Router ti slúži. Migrácia bez konkrétneho dôvodu je proceduralizmus, nie engineering.

## Kedy ostať na Pages, aj keď je projekt aktívny

- **Interné admin nástroje** — dôležitá je rýchlosť vývoja, nie výkon ani SEO. Pages Router je predvídateľný.
- **Marketingové weby s vlastným serverom** — ak `server.js` rieši vlastnú autentifikáciu alebo logiku presmerovaní.
- **Weby s masívnou build-time generáciou cez `getStaticPaths`** (10-tisíc a viac stránok) — App Router generuje statické stránky iným modelom a môžeš naraziť na problémy s dĺžkou buildu.

## Kedy ísť do App Router agresívne

- **Nový projekt** — nemá zmysel začínať na technológii so zamrznutými funkciami.
- **Eshop alebo SaaS s personalizáciou** — Server Components a Server Actions ušetria kopu boilerplate kódu.
- **Tím so skúsenosťami s React 19 / RSC** — App Router je pre nich produktívnejší.

## Praktická hybridná stratégia

App Router a Pages Router **fungujú vedľa seba** v jednom projekte. Migrovať môžeš postupne:

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

Toto je **najlepšia stratégia migrácie** pre veľký projekt: postupne, route po route, bez veľkého resetu. Funguje to dobre, len si daj pozor na duplicitné cesty a globálny layout.

## TL;DR

Nový Next.js projekt → App Router, nemáš čo riešiť. Existujúci Pages projekt → migruj iba vtedy, ak potrebuješ Server Components, Server Actions alebo PPR. Inak ostaň. Cena migrácie na 50-stránkovom projekte je 3 – 5 dní plus riziko regresií. Ten čas radšej daj do Core Web Vitals alebo novej funkcie, ktorá prinesie biznisovú hodnotu.
