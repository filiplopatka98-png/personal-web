---
title: "Next.js middleware prakticky: auth, geo a A/B bez zbytočností"
date: 2026-11-05
read: 8
tags: ["Next.js"]
excerpt: "Reálne use-casy middlewaru v Next.js: optimistický auth, geo-presmerovanie a A/B testy. Plus čo sa zmenilo v Next.js 16 s premenovaním na proxy."
featured: false
---

Middleware v Next.js je jedna z tých vecí, ktoré ľudia buď nepoužívajú vôbec, alebo do nich napchajú polovicu aplikácie a potom sa čudujú, prečo im každý request pomaly nabieha. Pravda je niekde uprostred. Beží pred dokončením requestu, takže sa hodí na presne tri veci: prepísať alebo presmerovať request, sahať na hlavičky a cookies, a robiť rýchle rozhodnutia na základe toho, kto a odkiaľ prišiel. Nič viac.

A rovno na začiatok najdôležitejšia zmena: v **Next.js 16** (vyšiel 21. októbra 2025) sa `middleware.ts` premenoval na `proxy.ts`. Ak štartuješ nový projekt v 2026, píšeš proxy, nie middleware. Poďme na to poriadne.

## Čo sa zmenilo v Next.js 16: middleware → proxy

Vercel súbor premenoval, aby bolo jasnejšie, čo vlastne robí — sedí ako sieťová vrstva pred aplikáciou, nie ako express-style middleware reťaz. Konkrétne:

- `middleware.ts` → `proxy.ts` (v roote projektu alebo v `src/`, na úrovni `app`)
- exportovaná funkcia sa volá `proxy` namiesto `middleware`
- config flagy s `middleware` v názve sa tiež premenovali — napr. `skipMiddlewareUrlNormalize` je teraz `skipProxyUrlNormalize`

Najpodstatnejší rozdiel je runtime. **Proxy beží na Node.js runtime a nedá sa to prekonfigurovať.** Edge runtime v `proxy` nie je podporovaný — ak ho naozaj potrebuješ, musíš zatiaľ zostať pri `middleware.ts`, ktorý je označený ako deprecated a časom zmizne. Pre 90 % projektov je Node.js runtime dobrá správa: konečne môžeš importovať bežné Node knižnice bez tanca okolo edge obmedzení.

Migráciu netreba robiť ručne. Codemod to spraví za teba:

```bash
npx @next/codemod@canary upgrade latest
```

Premenuje súbor, premenuje funkciu aj tie config flagy. Ja by som ho odporúčal aj keď migruješ manuálne kvôli niečomu inému — nech si na to nezabudneš.

Zvyšok článku píšem v terminológii `proxy`, ale všetko platí rovnako, ak si ešte na 15-ke s `middleware`. API `NextRequest`/`NextResponse` je identické.

## Matcher: nespúšťaj proxy na každom requeste

Prvá chyba, ktorú bežne vídam: proxy beží na úplne všetkom vrátane statických assetov a obrázkov. Zbytočná réžia na každom `.png`. Rieši to `config.matcher`:

```ts
// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // ...logika
  return NextResponse.next()
}

export const config = {
  matcher: [
    // všetko okrem interných ciest, API a statických súborov
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

Matcher berie string alebo pole a podporuje aj plné regex vzory. Používaj ho vždy — je to najlacnejší výkonnostný zisk, aký v proxy dostaneš. Čím užší matcher, tým menej requestov musí cez proxy prejsť.

## Use-case 1: optimistický auth

Toto je najčastejší dôvod, prečo ľudia siahnu po proxy — a zároveň miesto, kde to najčastejšie robia zle. Dokumentácia Next.js to hovorí jasne: **proxy nie je session management ani autorizačné riešenie.** Hodí sa na *optimistický check* — teda rýchle „máš vôbec cookie? nie? tak marš na login" — nie na overovanie, či je session naozaj platná.

Prečo? Lebo proxy nemá byť pomalé. Nemá tam byť volanie do databázy na každom requeste. Overenie session (dotaz do DB, kontrola expirácie) patrí do server komponentu alebo data access vrstvy, kde ho aj tak potrebuješ. Proxy len odstrihne zjavne neprihláseného návštevníka skôr, než sa vôbec začne renderovať chránená stránka.

```ts
// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get('session')?.value

  const isProtected = pathname.startsWith('/dashboard')

  if (isProtected && !session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

Všimni si, čo tu **nie je**: žiadne `await db.session.find(...)`, žiadne overenie podpisu tokenu proti tajomstvu, žiadne fetchovanie profilu. Len „existuje cookie". Skutočné overenie prebehne až v `/dashboard`, kde stránka aj tak číta session cez data access vrstvu. Táto dvojvrstvová logika je odporúčaný vzor priamo z Next.js dokumentácie o autentifikácii.

Ešte drobnosť, ktorá kôli pár znakom robí neplechu: `fetch` s `cache`, `next.revalidate` alebo `next.tags` v proxy **nemá žiadny efekt.** Ak si zvyknutý na cache-ovaný fetch z komponentov, tu na teba nepočká.

## Use-case 2: geo-presmerovanie

Klasika pre eshop, ktorý predáva do viacerých krajín, alebo web s jazykovými mutáciami. Chceš návštevníka zo Slovenska pustiť na `/sk`, z Česka na `/cz` a zvyšok na default.

Tu je dôležitý detail, o ktorý sa veľa ľudí popáli: **`request.geo` a `request.ip` už na `NextRequest` neexistujú.** Vercel ich odstránil v Next.js 15 s odôvodnením, že to bola fakticky Vercel-špecifická vec a nemala byť súčasťou frameworku. Ak deployuješ na Vercel, geolokáciu ťaháš z balíčka `@vercel/functions`:

```ts
// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { geolocation } from '@vercel/functions'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // už presmerovaný alebo statický súbor? nič nerob
  if (pathname.startsWith('/sk') || pathname.startsWith('/cz')) {
    return NextResponse.next()
  }

  const { country } = geolocation(request)

  const locale = country === 'CZ' ? 'cz' : 'sk'
  return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url))
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
```

Ak nie si na Verceli, geolokáciu ti musí dodať tvoj hosting alebo CDN cez hlavičku (Cloudflare posiela `CF-IPCountry`, iné majú svoje). Vtedy si ju prečítaš cez `request.headers.get('cf-ipcountry')`. Nespoliehaj sa na to, že ti niekto naservíruje krajinu zadarmo — to je práve to, čo Vercel odstránením `request.geo` chcel povedať.

Jedna praktická poznámka k UX: automatické geo-presmerovanie vie naštvať. Čech na dovolenke v Chorvátsku dostane chorvátsku mutáciu, hoci chce česky. V praxi typicky kombinujem geo len ako *prvý odhad* a nechávam používateľa jednoducho prepnúť jazyk — a voľbu si pamätám v cookie, ktorú v proxy skontrolujem skôr než geo.

## Use-case 3: A/B testy a experimenty

Tretí legitímny use-case, ktorý Next.js dokumentácia priamo spomína: prepísanie na rôzne stránky podľa A/B testu. Princíp je čistý — návštevníkovi raz priradíš variant, uložíš do cookie a proxy ho potom transparentne rewrituje na správnu verziu. URL v prehliadači zostane rovnaké, mení sa len to, čo sa naservíruje.

```ts
// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== '/') {
    return NextResponse.next()
  }

  // priraď variant raz a drž ho v cookie
  let variant = request.cookies.get('ab-variant')?.value
  if (variant !== 'a' && variant !== 'b') {
    variant = Math.random() < 0.5 ? 'a' : 'b'
  }

  const url = request.nextUrl.clone()
  url.pathname = `/home-${variant}` // /home-a alebo /home-b

  const response = NextResponse.rewrite(url)
  response.cookies.set('ab-variant', variant, {
    maxAge: 60 * 60 * 24 * 30, // 30 dní
  })
  return response
}

export const config = {
  matcher: ['/'],
}
```

Rozdiel medzi `rewrite` a `redirect` je tu kľúčový. `redirect` pošle prehliadaču 3xx a URL sa zmení — návštevník vidí, že skončil na `/home-a`. `rewrite` naservíruje obsah inej cesty, ale URL zostane `/`. Pre A/B test chceš `rewrite`, aby test bol pre používateľa neviditeľný.

Cookie je tu podstatná: bez nej by sa variant losoval pri každom requeste a ten istý človek by videl striedavo A aj B. To ti rozbije celé meranie. Priradíš raz, držíš 30 dní.

## Kde proxy nepatrí

Aby toho nebolo málo — pár vecí, ktoré do proxy nedávaj, aj keď to technicky ide:

- **Pomalý fetch dát.** Dokumentácia to hovorí explicitne: proxy nie je na pomalé načítanie dát. Každá milisekunda tu zdržuje úplne každý request.
- **Plná autorizácia.** Optimistický check áno, rozhodovanie o právach na základe DB nie.
- **Ťažká logika.** Ak riešiš viac než presmerovanie, hlavičky a jednoduché rozhodnutie, pýtaj sa, či to nepatrí do [App Routera a server komponentov](/blog/nextjs-app-vs-pages-router/) alebo do [server actions](/blog/nextjs-form-actions/).

Proxy je skalpel, nie švajčiarsky nožík. Tri use-casy hore — auth check, geo, A/B — pokrývajú drvivú väčšinu toho, na čo ho reálne budeš potrebovať. Ak sa ti proxy začne rozrastať, je to takmer vždy signál, že logika patrí inam. A ak riešiš cache a revalidáciu okolo toho, pozri sa na [rozdiely medzi revalidate, tag a path](/blog/nextjs-cache-revalidate/) — to je iná vrstva a mieša sa s proxy až prekvapivo často.
