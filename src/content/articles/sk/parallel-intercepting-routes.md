---
title: "Parallel a intercepting routes v Next.js: na čo naozaj sú"
date: 2026-11-19
read: 8
tags: ["Next.js"]
excerpt: "Dva pokročilé routovacie vzory z App Routera bez hype. Kedy dávajú zmysel, ako fungujú a prečo ich väčšina projektov vlastne nepotrebuje."
featured: false
---

Parallel a intercepting routes patria medzi tie funkcie App Routera, o ktorých sa píše veľa a používajú sa málo. Znejú exoticky, demá vyzerajú efektne a človek má pocit, že bez nich robí Next.js zle. Realita je triezvejšia: sú to dva úzko špecializované nástroje, ktoré riešia konkrétne problémy. Ak ten problém nemáš, nepotrebuješ ich.

Píšem to na základe dokumentácie k Next.js 16 (aktuálna stabilná verzia je v čase písania 16.2.7). Oba vzory sú v App Routeri od jeho stabilizácie a odvtedy sa API v podstate nemenilo — takže to, čo tu popisujem, platí naprieč Next.js 13 až 16.

## Parallel routes: viac stránok v jednom layoute

Parallel routes ti dovolia vykresliť viacero stránok súčasne v tom istom layoute, pričom každá má **vlastnú navigáciu, loading a error stav**. Definujú sa cez tzv. sloty — priečinky s prefixom `@`.

Kľúčový detail, ktorý ľudí mätie: **slot nie je route segment a neovplyvňuje URL**. Priečinok `@analytics/views` sa v URL zobrazí len ako `/views`. Slot sa layoutu odovzdá ako prop.

```tsx
// app/layout.tsx
export default function Layout({
  children,
  team,
  analytics,
}: {
  children: React.ReactNode
  team: React.ReactNode
  analytics: React.ReactNode
}) {
  return (
    <>
      {children}
      {team}
      {analytics}
    </>
  )
}
```

Priečinky `@team` a `@analytics` sa stanú prop-mi `team` a `analytics`. `children` je implicitný slot — nemusíš mať priečinok `@children`, `app/page.js` je jeho ekvivalent.

Na čo je to dobré v praxi? Na sekcie, kde sa reálne mení viac nezávislých oblastí naraz a chceš im dať vlastné streamovanie a error boundary — dashboardy, feedy, split-view administrácie. Typický príklad je conditional rendering podľa role bez toho, aby si duplikoval layout:

```tsx
// app/dashboard/layout.tsx
import { checkUserRole } from '@/lib/auth'

export default function Layout({
  user,
  admin,
}: {
  user: React.ReactNode
  admin: React.ReactNode
}) {
  const role = checkUserRole()
  return role === 'admin' ? admin : user
}
```

Dôvod, prečo sa oplatí ísť cez sloty a nie cez obyčajný podmienený JSX: **každý slot sa streamuje nezávisle**. Admin panel s ťažkými dátami nezablokuje vykreslenie zvyšku. To je reálna hodnota pre [streaming a Suspense v App Routeri](/blog/streaming-suspense-app-router/) — nie kozmetika.

## Prečo parallel routes bolia: `default.js`

Toto je miesto, kde väčšina ľudí narazí, a stojí za to to povedať nahlas. Next.js si počas klientskej (soft) navigácie pamätá aktívny stav každého slotu. Ale pri **hard navigácii** — refresh, priamy vstup cez URL — už tento stav nevie obnoviť pre sloty, ktoré nezodpovedajú aktuálnej URL.

Čo sa stane? Next.js vykreslí `default.js` daného slotu. A ak `default.js` neexistuje, **vyhodí 404**. Nie prázdno, nie ignore — celá stránka spadne na 404.

```tsx
// app/@analytics/default.tsx
export default function Default() {
  return null
}
```

V praxi to znamená, že `default.js` musíš pridať **na každej úrovni**, kde by slot mohol ostať bez zhody — vrátane implicitného `children`. Toto je najčastejšia príčina záhadných 404-iek pri parallel routes a je zdokumentovaná priamo v Next.js (chybová hláška `slot-missing-default`). Keď to raz pochopíš, prestane to byť mystické. Kým to nepochopíš, stráca sa na tom pol dňa.

Druhý háčik: ak dáš `@slot` do JSX layoutu, ale slot nemá zhodu na danej trase, musíš mať pripravený fallback (`default.js` alebo stránku vracajúcu `null`), inak sa buď zobrazí staré, alebo padne 404.

## Intercepting routes: načítaj cudziu trasu v aktuálnom layoute

Intercepting routes riešia iný problém: chceš zobraziť obsah nejakej trasy **bez toho, aby si používateľa preplol do iného kontextu**. Klasika je fotka v galérii — klikneš a otvorí sa modal cez feed, ale URL sa zmení na `/photo/123`, takže sa dá zdieľať.

Definujú sa cez konvenciu podobnú relatívnym cestám, ale **na route segmentoch, nie na súborovom systéme**:

- `(.)` — zhoda na **rovnakej úrovni**
- `(..)` — o **úroveň vyššie**
- `(..)(..)` — o **dve úrovne vyššie**
- `(...)` — od **rootu** `app`

Podstata je táto dvojrežimovosť: pri klientskej navigácii Next.js trasu **zachytí** a vykreslí ju ako overlay v aktuálnom layoute. Pri refreshi alebo priamom vstupe cez URL sa **žiadne zachytenie nekoná** a trasa sa vykreslí ako plnohodnotná stránka. Jeden a ten istý súbor, dve správania podľa typu navigácie.

## Kde to spolu dáva zmysel: modal, ktorý sa dá zdieľať

Klasický a v podstate jediný „učebnicový“ dôvod, prečo tieto dva vzory kombinovať, je modal s deep linkingom. To, čo tým reálne získaš:

- obsah modalu je **zdieľateľný cez URL**,
- **refresh nezavrie modal** (respektíve otvorí plnú stránku toho istého obsahu),
- **späť modal zavrie** namiesto skoku o dve stránky dozadu,
- **dopredu ho zase otvorí**.

Toto sú presne tie veci, ktoré pri ručne robenom modale cez `useState` musíš dopisovať a väčšinou to niekde tečie.

Štruktúra podľa oficiálnej dokumentácie: máš reálnu stránku `app/login/page.tsx`, slot `@auth` s `default.tsx` vracajúcim `null` (aby modal nebol vidno, keď nie je aktívny), a zachytávajúci priečinok `@auth/(.)login/page.tsx`:

```tsx
// app/@auth/(.)login/page.tsx
import { Modal } from '@/app/ui/modal'
import { Login } from '@/app/ui/login'

export default function Page() {
  return (
    <Modal>
      <Login />
    </Modal>
  )
}
```

Dôležitý detail: cesta k segmentu `login` používa `(.)`, nie `(..)`, hoci v súborovom strome je `@auth/(.)login` „hlbšie“. Prečo? Lebo `@auth` je slot, a konvencia sa počíta na route segmentoch — sloty sa do nej **nerátajú**. `login` je tak len o jednu segmentovú úroveň vyššie.

Modal sa zatvára cez `router.back()`:

```tsx
// app/ui/modal.tsx
'use client'

import { useRouter } from 'next/navigation'

export function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  return (
    <>
      <button onClick={() => router.back()}>Zavrieť</button>
      <div>{children}</div>
    </>
  )
}
```

A ešte jedna vec, na ktorú sa zabúda: keď z modalu odnavigúješ inam než cez `back()`, slot `@auth` musí mať s čím spárovať, inak ostane vidno. Riešenie je catch-all slot `@auth/[...catchAll]/page.tsx` vracajúci `null`. Bez neho sa modal pri klientskej navigácii jednoducho neschová.

## Kedy to (ne)použiť

Môj triezvy postoj po tom, čo som cez to prešiel na reálnych projektoch:

**Parallel routes** siahni, keď máš v jednom layoute viac naozaj nezávislých oblastí, ktoré chceš streamovať a ošetrovať samostatne. Dashboard s panelmi, ktoré sa načítavajú rôzne rýchlo. Conditional layout podľa role. Ak len chceš mať v stránke dva komponenty vedľa seba, **nepotrebuješ sloty** — potrebuješ dva komponenty.

**Intercepting routes** dávajú zmysel v podstate len na overlaye, ktoré majú mať vlastnú, zdieľateľnú URL: modal s fotkou, „quick view“ produktu, login modal so samostatnou `/login` stránkou. Ak modal nemá mať URL — potvrdzovací dialóg, filter, nastavenia — je to over-engineering. Vtedy stačí obyčajný dialóg a poriadny [focus management](/blog/focus-management-dialog/), lebo tie vzory ti prístupnosť **nevyriešia** — modal cez route je stále len `<div>`, o `role`, `aria-modal` a focus trap sa musíš postarať sám.

A pozor na cenu: parallel routes menia mentálny model routovania, pridávajú `default.js` súbory a robia debugging menej priamočiarym. Na malom webe to nie je výhra. Ak práve zvažuješ App vs Pages Router alebo [Astro namiesto Next.js](/blog/astro-vs-nextjs-tabulka/), tieto dva vzory nie sú argument pre ani proti — sú to špecializované nástroje, nie dôvod výberu frameworku.

Zhrnuté: parallel a intercepting routes sú dobre navrhnuté a na svoj účel elegantné. Len ten účel je užší, než by sa z demo videí zdalo. Použi ich, keď riešiš presne ten problém, ktorý riešia. Inak si ušetríš `default.js` bolesti.
