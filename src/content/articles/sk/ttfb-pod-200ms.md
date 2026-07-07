---
title: "TTFB pod 200 ms: kde sa reálne stráca čas"
date: 2026-08-04
read: 8
tags: ["Performance","Hosting"]
excerpt: "TTFB nie je jedno číslo, ale súčet piatich fáz. Ako ich rozbiť cez Server-Timing a Navigation Timing a zistiť, či je vinník DNS, TLS, DB alebo edge."
featured: false
---

„Máme pomalý web." Prvá vec, ktorú urobím, nie je optimalizácia — je to meranie. Lebo TTFB (Time to First Byte) nie je jedno číslo. Je to súčet piatich fáz a keď ho vidíš len ako `TTFB: 640 ms` v jednom stĺpci, nevieš vôbec, kam siahnuť. Môže to byť redirect, DNS, TLS handshake, čas na serveri alebo cache miss na edge. Každá z nich sa lieči úplne inak.

Tento článok je o rozbití TTFB na komponenty. Ak hľadáš hotové cache konfigurácie pre WordPress, mám o tom [samostatný text o server response time](/blog/server-response-200ms/). Tu ideme o úroveň nižšie — ako zistiť, *ktorú* vrstvu vôbec riešiť.

## Z čoho sa TTFB skladá

Podľa web.dev sa TTFB skladá z piatich fáz: redirect, štart service workera, DNS lookup, nadviazanie spojenia + TLS a napokon samotný request až po prvý bajt odpovede. Prahy sú jasné — **dobré TTFB je 0,8 s alebo menej, zlé je nad 1,8 s** (pri 75. percentile reálnych používateľov). Pozor: TTFB samotné *nie je* Core Web Vital. Je to diagnostická metrika. Ale je to strop tvojho LCP — ak server mlčí 800 ms, žiadnym frontendovým trikom nedostaneš [LCP pod 2,5 s](/blog/lcp-nad-2-5s-pricin/).

Cieľ „pod 200 ms" je pri statickom alebo dobre cachovanom obsahu úplne reálny. CDN edge vie vrátiť cachovanú stránku za 20–50 ms. Problém je, že tých 200 ms sa dá minúť na desiatich miestach a ty musíš vedieť ktoré.

## Krok 1: rozbi TTFB v prehliadači

Navigation Timing API máš zadarmo v každom prehliadači. Toto je surová verzia, ktorá ti ukáže jednotlivé fázy v milisekundách:

```js
new PerformanceObserver((list) => {
  const nav = list.getEntriesByType('navigation')[0];
  console.table({
    redirect:  nav.redirectEnd - nav.redirectStart,
    dns:       nav.domainLookupEnd - nav.domainLookupStart,
    tcp:       nav.connectEnd - nav.connectStart,
    tls:       nav.secureConnectionStart
                 ? nav.connectEnd - nav.secureConnectionStart : 0,
    ttfb:      nav.responseStart,
    server:    nav.responseStart - nav.requestStart,
  });
}).observe({ type: 'navigation', buffered: true });
```

`server` (rozdiel `responseStart − requestStart`) je čas, ktorý strávil požiadavka „vo vzduchu a na serveri" po nadviazaní spojenia. Ak je DNS 120 ms a TLS 90 ms, tvoj backend môže byť rýchly ako blesk a aj tak si nad 200 ms — vinníkom je sieť, nie kód.

Jeden dôležitý detail z roku 2025/2026: Chrome menil definíciu `responseStart`. Od Chrome 133 platí, že ak server pošle `103 Early Hints`, `responseStart` odráža ten skorý 103 response, nie finálne hlavičky. Takže po zapnutí Early Hints ti *reportované* TTFB klesne, aj keď server rovnako dlho počíta. Reálny čas na serveri meraj cez `finalResponseHeadersStart` alebo cez Server-Timing. Nedaj sa oklamať grafom, ktorý „zázračne" spadol.

## Krok 2: Server-Timing — jediný spôsob, ako vidieť dovnútra servera

Navigation Timing ti povie, že server bežal 380 ms. Nepovie ti, že z toho 300 ms bola jedna nešťastná SQL query. Na to je `Server-Timing` HTTP hlavička — štandard W3C, ktorý funguje vo všetkých major prehliadačoch a zobrazí sa aj v DevTools v záložke Network aj cez `PerformanceServerTiming` API.

Server ju pridá do odpovede a ty do nej nasypeš vlastné merania:

```
Server-Timing: db;dur=182;desc="MySQL", tpl;dur=94;desc="render", app;dur=41
```

V PHP to vieš vyskladať priamo z reálnych meraní — bez APM, bez extra závislostí:

```php
$t0 = microtime(true);
// ... DB dotazy ...
$dbMs = (microtime(true) - $t0) * 1000;

header(sprintf('Server-Timing: db;dur=%.1f;desc="MySQL"', $dbMs), false);
```

A prečítať si to na strane klienta vieš takto:

```js
const nav = performance.getEntriesByType('navigation')[0];
for (const t of nav.serverTiming) {
  console.log(t.name, t.duration, t.description);
}
```

Toto je moment, keď sa hádanie mení na diagnostiku. Bežne vídam, že vývojár tri dni „optimalizuje šablónu", pričom 80 % TTFB zožerie jeden nešťastný `meta_query` bez indexu. Server-Timing ti to ukáže za desať sekúnd. Pár poznámok z praxe: hlavičku posielaj skôr, ako začneš streamovať telo odpovede, a pri cross-origin meraní potrebuješ ešte `Timing-Allow-Origin`, inak ti prehliadač hodnoty skryje.

## Krok 3: kde sa čas reálne stráca

Keď máš rozbité čísla, vinník býva v jednej z týchto vrstiev:

**Redirecty.** Každý redirect je celý round-trip navyše — často 100–300 ms. `http → https` a `bezwww → www` reťaz vie ľahko pridať dva. Rieši sa to `Strict-Transport-Security` (HSTS), ktorý prehliadaču povie, nech na HTTPS ide rovno a redirect na HTTP úplne preskočí.

**DNS a TLS.** Studený DNS lookup a plný TLS handshake sú desiatky milisekúnd, ktoré platíš len pri prvom spojení. HTTP/3 a TLS 1.3 (0-RTT resumption) ich výrazne skracujú — a to je jeden z najhmatateľnejších dôvodov, prečo pustiť traffic cez slušný CDN, nie priamo na origin.

**Čas na serveri.** Tu žije 90 % skutočných problémov: PHP bez opcache, chýbajúci object cache, N+1 dotazy, blocking volania na tretie strany priamo v request cykle. Server-Timing z kroku 2 ti presne ukáže pomer DB vs. render vs. appka.

**Cache miss na edge.** Ak jeden región sedí nad 500 ms a ostatné pod 50 ms, ten PoP jednoducho netrafil cache alebo ho routing posiela dlhou cestou. Kľúč je `stale-while-revalidate` — edge vráti používateľovi starú kópiu okamžite a čerstvú si dotiahne na pozadí, takže nikto nečaká na origin:

```
Cache-Control: public, max-age=0, must-revalidate
CDN-Cache-Control: public, s-maxage=60, stale-while-revalidate=300
```

Pri dynamickom obsahu, ktorý sa nedá cachovať na hodiny, funguje micro-caching — TTL 1–10 sekúnd. Origin vygeneruje odpoveď raz a edge ju rozdá všetkým requestom v tom okne. Na Nginxe to jeden server posunie z jednotiek na stovky requestov za sekundu.

## Krok 4: keď backend fakt musí počítať

Nie všetko sa dá odcachovať. Personalizovaná stránka, prihlásený používateľ, checkout — tam musí backend reálne pracovať a nejaký čas na serveri jednoducho bude. Vtedy pomáha `103 Early Hints`: server pošle skorý 103 response s `Link: preconnect`/`preload` na kritické zdroje ešte počas toho, čo dopočítava telo. Prehliadač medzitým otvorí spojenia a sťahuje CSS.

```
HTTP/2 103 Early Hints
Link: </styles/main.css>; rel=preload; as=style
Link: <https://fonts.example.com>; rel=preconnect
```

Podpora je slušná: Chrome/Edge 103+, Firefox 123+ (preconnect aj preload), Safari 17+ zatiaľ len preconnect. Funguje **len cez HTTP/2 alebo HTTP/3** a len pre navigačné requesty — cez HTTP/1.1 to zahoď rovno. Nie je to zázrak na TTFB ako také (server rovnako dlho počíta), ale skráti to čas do LCP tým, že vyplní „mŕtvy" čakací čas na serveri užitočnou prácou.

## Ako na to idem ja

Poradie je vždy rovnaké: **najprv meraj, potom optimalizuj.** Rozbi TTFB cez Navigation Timing, nasaď Server-Timing s aspoň troma značkami (`db`, `render`, `app`) a pozri sa na pomer. Až keď vidíš, kde je čas, sa rozhoduje: DB → index alebo cache; render → object cache; sieť → CDN, HTTP/3, HSTS; edge → `stale-while-revalidate`.

Väčšina „pomalých webov", ktoré vídam, nemá jeden veľký problém — má tri malé, ktoré sa sčítajú do 700 ms. A bez Server-Timing ich hádaš naslepo. S ním ich vidíš v DevTools za jeden reload. To je celé tajomstvo TTFB pod 200 ms: nie magický trik, ale to, že prestaneš hádať.
