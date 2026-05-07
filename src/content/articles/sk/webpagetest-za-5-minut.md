---
title: "Ako čítať WebPageTest report za 5 minút"
date: 2025-09-25
read: 6
tags: ["Performance", "Core Web Vitals"]
excerpt: "Tri grafy v WebPageTest reporte na ktoré sa pozrieš najprv — filmstrip, waterfall, connection view. Konkrétny postup od report URL po identifikáciu fixu."
featured: false
---

WebPageTest je jeden z najlepších free toolov pre performance audit, ale jeho UI je z roku 2010 a report obsahuje 30+ tabuliek. Ja sa pri každom audite pozerám len na tri grafy — a vďaka nim viem za 5 minút identifikovať primárny problém. Tu je presný postup.

## Setup: ako konfigurovať test

Najprv good practice pre konfiguráciu testu, inak je report bezcenný:

- **Lokácia:** Frankfurt, Germany (najbližšie pre SK návštevníkov). Pre Czech projekty Praha (cez `EC2 - Prague` location alebo Linode Prague).
- **Browser:** Chrome (default), Mobile - Motorola G (gen 4) alebo iPhone 13 ak chceš realistic mobile profile.
- **Connection:** **4G** (9 Mbps down, 170ms RTT). Nie cable, nie 4G LTE — 4G je realistic Slovak rural average.
- **Number of runs:** **3** (default). Median run je tvoj reálny worst-case.
- **Capture Video:** **YES**. Bez videa nemáš filmstrip a tým strácaš 50 % insightu.
- **Repeat View:** **YES**. Druhý load s warm cache ti povie ako pôjdu return visitors.

Po teste dostaneš URL napríklad `webpagetest.org/result/250915_AB_xyz/`. Otvor "Median Run" tab.

## Graf 1: Filmstrip — kedy reálne vidím obsah

Prvý a najdôležitejší pohľad. Filmstrip ti ukáže screenshoty stránky každých 0.5s. Visualizuje **percieved performance** — čo user reálne vidí.

Skontroluj tri veci:

### 1. Kedy zmizne biele plátno?

Ak sú prvé 2 sekundy úplne biele, máš **render-blocking** problém. JS alebo CSS ktoré blokujú first paint. V reporte hľadaj "Start Render" metric — ak je >2s, máš čo opravovať.

### 2. Kedy paint-uje hero (LCP element)?

Hero obrázok by sa mal objaviť do 2.5s. Ak nie, ideš do "LCP" sekcie reportu — tam dostaneš presný element identifier (CSS selector + screenshot s outline).

### 3. Hýbe sa layout počas loadu?

Vizuálne na filmstrip-e vidíš ako sa obsah skáče — to je CLS. Ak v `0.5s` snímke je banner hore a v `1.0s` snímke je banner dole, máš shift. Click do "Visual Comparison" pre side-by-side.

Filmstrip ti za 30 sekúnd povie či máš **rendering** alebo **layout** problém. To rozhoduje kam ideš ďalej.

## Graf 2: Waterfall — čo sa sťahuje a v akom poradí

Druhý pohľad. Waterfall je horizontálny graf každého HTTP requestu — kedy začal, ako dlho trval, kde sú DNS/TLS/TTFB/download fázy.

Tri patterns ktoré hľadám:

### Pattern A: Render-blocking JS/CSS na top

Prvé 5–10 riadkov waterfall-u sú request 1 (HTML), request 2–4 (CSS), request 5+ (JS v `<head>`). Ak vidíš JS request bez `async`/`defer` attribute (ikonka v WPT to označí), browser čaká kým sa stiahne a vykoná predtým než pokračuje.

Konkrétny príklad: jQuery a `wp-emoji-release.min.js` v `<head>` blokujú render. Fix: `defer` cez `wp_enqueue_script` strategy parameter (WP 6.3+).

```php
wp_enqueue_script('jquery', '...', [], null, ['strategy' => 'defer']);
```

### Pattern B: Third-party domains pred first paint

Hľadaj v "Domain" stĺpci hostnames mimo svojej domény: `googletagmanager.com`, `connect.facebook.net`, `widget.tidio.co`, `ws.zoominfo.com`. Ak sú **pred** start render čiarou, blokujú render.

WPT zobrazuje "Start Render" ako vertikálnu žltú čiaru cez celý waterfall. Všetko vľavo od nej je problém.

### Pattern C: Long tail late requests

Čo trvá na konci? Často to bude analytics, tracking, retargeting. Ak má posledný request finish-time napr. 12s, aj keď LCP je v 2s, znamená to že main thread je busy ďaleko po LCP — užívateľ nemôže scrollovať plynulo.

## Graf 3: Connection View — DNS a TLS overhead

Tretí pohľad, často prehliadaný. Connection View ukazuje **per-connection** breakdown — koľko domén kontaktuješ a koľko času sa míňa na DNS lookup, TLS handshake, idle time.

Otvoríš ho cez "Performance Review" → "Connection View" tab.

Čo hľadám:

### Príliš veľa domén

Ak vidíš 15+ unique connections, máš third-party bordel. Každý domain = DNS lookup (~30ms) + TLS handshake (~100ms) navyše. 5 zbytočných domén = 650ms latency.

Fix: konsoliduj. Cloudflare Zaraz robí proxy pre tracking scripts (Google Analytics, Meta Pixel) — všetko ide cez tvoju doménu. Hostuj fonty self-hosted namiesto Google Fonts. Tidio chat sa nedá self-hostovať, ale aspoň ho preloadni cez `<link rel="preconnect" href="https://widget.tidio.co">`.

### Idle time na main connection

Ak má tvoja primárna doména v Connection View dlhý idle time medzi requestmi, znamená to že server odpovedá pomaly (vysoké TTFB) alebo browser čaká na resolution dependency tree. Toto poukazuje na server problém, nie frontend.

## Repeat View — cache impact

Po prvej trojke pozri "Repeat View" tab. Druhý load s warm cache by mal byť **dramaticky** rýchlejší — ak nie je, nepoužívaš HTTP cache headers correctly.

Concrete signs: ak Repeat View LCP nie je < 1s, máš `Cache-Control: no-cache` na statike alebo missing `Cache-Control` header celkovo.

Fix: v nginx alebo `.htaccess`:

```nginx
location ~* \.(jpg|jpeg|png|webp|avif|svg|woff2|css|js)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}
```

Files s revision hash (`app.4f3c2.js`) môžu mať `immutable` — browser ich nikdy nepýta odznova.

## 5-minútový postup: TL;DR

1. **Open report → Filmstrip.** Kedy zmizne biele plátno, kedy paint hero. (60s)
2. **Open Waterfall.** Render-blocking JS/CSS pred start render? Third-party pred LCP? (90s)
3. **Open Connection View.** Príliš veľa domén? (45s)
4. **Open Repeat View tab.** Warm cache funguje? (60s)
5. **Identifikuj jeden najväčší problém** a fixni ho. Re-test. (45s)

Najčastejšie nálezy v poradí frekvencie:

- Hero obrázok bez `fetchpriority="high"` (visible vo waterfall — sťahuje sa neskoro)
- Render-blocking script tag v `<head>` bez `defer`
- Príliš veľa third-party domén pred first paint
- Cookie banner ktorý CLS-uje (visible na filmstrip ako náhly skok)

WebPageTest má 30 ďalších paneľov ktoré ti niekedy pomôžu (Bytes, Requests, Domains, Custom Metrics), ale v 90 % auditov ti tieto tri grafy stačia. Začni nimi, fix-ni najväčší problém, re-testuj. Iterácia.
