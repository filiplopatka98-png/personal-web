---
title: "Streaming a Suspense v App Routeri: rýchlejší dojem bez trikov"
date: 2026-11-17
read: 8
tags: ["Next.js", "React"]
excerpt: "Ako v Next.js App Routeri cez loading.js a Suspense poslať obsah po častiach — a nenechať používateľa čakať na najpomalší dopyt v stránke."
featured: false
---

Klasické serverové renderovanie má jednu nepríjemnú vlastnosť: server nepošle ani bajt HTML, kým nemá celý dokument. Jeden pomalý databázový dopyt alebo externé API a celá stránka stojí. Používateľ pozerá na biele okno, aj keď hlavička, navigácia a layout sú dávno pripravené.

Streaming to obracia. Server odošle to, čo už má, a zvyšok „dostrimuje“ po tom, ako sa dopočíta. V Next.js App Routeri na to netreba žiadny trik ani knižnicu navyše — je to zabudované do frameworku. Píšem to podľa oficiálnej [dokumentácie k streamingu](https://nextjs.org/docs/app/guides/streaming), ktorá bola naposledy aktualizovaná 23. júna 2026 pre Next.js 16.2.

## Ako to vlastne funguje

React server renderer produkuje HTML po kúskoch, ktoré sú zarovnané s `<Suspense>` hranicami. Next.js to v App Routeri zapája cez [chunked transfer encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Transfer-Encoding) — teda odosielanie odpovede po častiach, tak ako sú hotové.

Kľúčový pojem je **statický shell**: všetko, čo sa vyrenderuje predtým, než sa vyrieši akákoľvek asynchrónna práca — layouty, navigácia a fallbacky tvojich `<Suspense>` hraníc. Tento shell letí ku klientovi okamžite. Browser ho vykreslí a používateľ má na čo pozerať, kým sa dynamický obsah dopočítava.

Každá `<Suspense>` hranica je nezávislý streamovací bod — komponenty v rôznych hraniciach sa doriešia a dostrimujú samostatne, neblokujú sa navzájom.

## Najlacnejší štart: loading.js

Ak nemáš čas ladiť jednotlivé hranice, začni s `loading.js`. Súbor daj vedľa `page.js` a Next.js automaticky obalí obsah stránky do `<Suspense>` a použije tvoj komponent ako fallback.

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
      <div className="h-4 w-full bg-gray-200 rounded mb-2" />
      <div className="h-4 w-full bg-gray-200 rounded mb-2" />
      <div className="h-4 w-2/3 bg-gray-200 rounded" />
    </div>
  )
}
```

Za scénou to znamená: layout sa vykreslí ako súčasť statického shellu, skeleton sa zobrazí okamžite ako Suspense fallback, a keď sa stránka dorieši, jej HTML nahradí skeleton.

Je to dobré tam, kde nie je čo zmysluplné ukázať, kým nemáš dáta. Ale nie je to zadarmo — celá stránka spadne do jedného veľkého skeletonu. Preto to bežne beriem len ako prvý krok.

## Kam to naozaj smeruje: granulárny Suspense

Skutočný zisk je v tom, keď fallbacky posunieš dole do konkrétnych sekcií. Statický shell tak obsahuje viac reálneho obsahu a každá pomalá sekcia si strimuje sama. Keď viac komponentov robí asynchrónnu prácu, obal každý do vlastnej `<Suspense>` hranice.

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react'
import { Revenue } from './revenue'
import { RecentOrders } from './recent-orders'
import { Recommendations } from './recommendations'

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <div className="grid grid-cols-2 gap-4">
        <Suspense fallback={<p>Načítavam tržby…</p>}>
          <Revenue />
        </Suspense>
        <Suspense fallback={<p>Načítavam objednávky…</p>}>
          <RecentOrders />
        </Suspense>
      </div>
      <Suspense fallback={<p>Načítavam odporúčania…</p>}>
        <Recommendations />
      </Suspense>
    </div>
  )
}
```

Ak sa `Revenue` dorieši za 200 ms, `RecentOrders` za 1 s a `Recommendations` za 3 s, používateľ vidí každú sekciu hneď, ako sú jej dáta hotové. `<h1>` je pritom v shelli — dôležité pre LCP, o tom nižšie.

## Trik číslo jedna: netlač dynamiku hore

Toto je asi najčastejšia chyba, ktorú vídam. Ak v layoute alebo na vrchu stránky urobíš `await` na `params`, `searchParams`, `cookies()`, `headers()` alebo na dáta, **všetko pod tým bodom sa stane dynamickým** a nemôže byť súčasťou statického shellu. Celý ten skvelý streaming si tým zabiješ.

Riešenie: promise nepýtaj hore, ale posuň ho dole do komponentu, ktorý ho naozaj potrebuje, a tam ho vyrieš vnútri `<Suspense>`.

```tsx
// app/dashboard/layout.tsx
import { Suspense } from 'react'
import { Nav } from './nav'
import { UserMenu } from './user-menu'
import { cookies } from 'next/headers'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies() // spustíme prácu, ale neawaitujeme

  return (
    <div>
      <Nav>
        <Suspense fallback={<p>Načítavam používateľa…</p>}>
          <UserMenu cookiePromise={cookieStore} />
        </Suspense>
      </Nav>
      {children}
    </div>
  )
}
```

Tu sa `<Nav>` aj `{children}` vykreslia ako statický shell, lebo layout nič neawaituje. Suspenduje sa len `<UserMenu>`, keď si vyrieši cookie. Keby layout hore zavolal `await cookies()`, celý by sa zablokoval.

## Web Vitals: čo streaming reálne zlepší a čo pokazí

Tu sa oplatí byť presný, lebo streaming nie je čarovná palička na všetky metriky. Prahy [Core Web Vitals](https://web.dev/articles/vitals) sa v 2026 nezmenili: LCP dobré pod 2,5 s, INP pod 200 ms, CLS pod 0,1. TTFB nie je Core Web Vital, ale bežná odporúčaná hranica je pod 200 ms.

**TTFB a FCP** — bez streamingu server čaká na všetky dáta, takže TTFB sa rovná najpomalšiemu dopytu. So streamingom pošle shell hneď a TTFB klesne na čas vyrenderovania layoutov a fallbackov. To je ten „rýchlejší dojem bez trikov“.

**LCP** — pozor, tu sa dá streamingom ublížiť. Ak je tvoj LCP prvok (hero obrázok, hlavný nadpis) vnútri Suspense hranice, nevykreslí sa, kým sa hranica nedorieši. LCP prvky drž **mimo** alebo **nad** Suspense hranicami. Pri obrázkoch použi `preload` prop na `next/image` — vloží `<link rel="preload">` do `<head>`, takže browser začne sťahovať obrázok už z prvého chunku. Ak LCP naháňaš aj inde, mám na to samostatný text o [siedmich najčastejších príčinách LCP nad 2,5 s](/blog/lcp-nad-2-5s-pricin/).

**CLS** — keď fallback nahradí obsah inej veľkosti, layout sa preskočí. Skeletony navrhuj tak, aby mali **rovnaké rozmery** ako finálny obsah, prípadne rezervuj miesto cez `min-height`. Inak si vyrobíš presne ten [layout shift, ktorý ničí mobil](/blog/cls-mobil-banner/).

**INP** — streaming zapína selektívnu hydratáciu. Každá `<Suspense>` hranica je hydratačná jednotka, takže React nehydratuje celú stránku jedným blokujúcim priechodom, ale po častiach, ktoré uvoľňujú hlavné vlákno. To pomáha responzivite.

## Kde ti to prax pokazí

Streaming vyzerá skvele na `localhost`, ale medzi serverom a klientom je ešte infraštruktúra, ktorá vie odpoveď zbufferovať a celý efekt zabiť:

- **Reverse proxy** (Nginx a spol.) štandardne bufferuje. Vypni to hlavičkou `X-Accel-Buffering: no`.
- **CDN** niektoré bufferujú celú odpoveď, kým ju pošlú ďalej — over si u poskytovateľa podporu chunked odpovedí.
- **Serverless** — nie každé prostredie streaming podporuje. AWS Lambda vyžaduje explicitne zapnutý response streaming mode; Vercel to zvláda natívne.
- **Kompresia** — gzip/brotli si drží dáta, kým má čo komprimovať, čo môže pridať latenciu k prvému viditeľnému chunku.

Že odpoveď naozaj tečie po častiach, over v Chrome DevTools: v Network tabe pri dokumente pozri „Timing“ — skorý TTFB a dlhá fáza „Content Download“ znamenajú, že to strimuje. Alebo si pusti krátky skript s `fetch` a `Accept-Encoding: identity`, aby ti kompresia nezbufferovala chunky.

## Jedna HTTP pasca na záver

Keď streaming začne, hlavičky vrátane status kódu sú už odoslané a **nedajú sa zmeniť**. Ak `notFound()` padne uprostred streamu, Next.js už nevie vrátiť 404 — namiesto toho vstrekne `<meta name="robots" content="noindex">`. Preto rýchlu existenčnú kontrolu a `notFound()` daj **pred** akýkoľvek `await` alebo `<Suspense>`, ak chceš reálny HTTP status.

To je celé. Žiadna magická knižnica, žiadny trik — len rozumné rozloženie hraníc a disciplína netlačiť dynamiku hore. Ak ešte len rozhoduješ medzi App a Pages Routerom, pozri si [porovnanie, čo v 2026 zostáva relevantné](/blog/nextjs-app-vs-pages-router/) — plný streaming je jeden z hlavných dôvodov, prečo dnes staviam nové projekty na App Routeri.
