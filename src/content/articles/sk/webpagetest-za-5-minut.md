---
title: "Ako čítať WebPageTest report za 5 minút"
date: 2025-09-25
read: 6
tags: ["Performance", "Core Web Vitals"]
excerpt: "Tri grafy, na ktoré sa vo WebPageTest reporte pozriem najprv — filmstrip, waterfall, connection view. Konkrétny postup od report URL po identifikáciu fixu."
featured: false
---

WebPageTest je jeden z najlepších bezplatných nástrojov na performance audit, ale jeho UI vyzerá ako z roku 2010 a report obsahuje 30+ tabuliek. Ja sa pri každom audite pozerám len na tri grafy — a vďaka nim viem za 5 minút identifikovať primárny problém. Tu je presný postup.

## Setup: ako nakonfigurovať test

Najprv zopár osvedčených nastavení testu, inak je report bezcenný:

- **Lokácia:** Frankfurt, Germany (najbližšie pre slovenských návštevníkov). Pre české projekty Praha (cez lokáciu `EC2 - Prague` alebo Linode Prague).
- **Prehliadač:** Chrome (default), mobil — Motorola G (gen 4) alebo iPhone 13, ak chceš realistický mobilný profil.
- **Pripojenie:** **4G** (9 Mbps down, 170 ms RTT). Nie cable, nie 4G LTE — 4G je realistický priemer pre slovenský vidiek.
- **Number of runs:** **3** (default). Medián z troch behov je tvoj reálny worst-case.
- **Capture Video:** **YES**. Bez videa nemáš filmstrip a tým strácaš 50 % insightu.
- **Repeat View:** **YES**. Druhé načítanie s teplou vyrovnávacou pamäťou ti povie, ako to pôjde vracajúcim sa návštevníkom.

Po teste dostaneš URL, napríklad `webpagetest.org/result/250915_AB_xyz/`. Otvor záložku „Median Run“.

## Graf 1: Filmstrip — kedy reálne vidím obsah

Prvý a najdôležitejší pohľad. Filmstrip ti ukáže snímky stránky každých 0,5 s. Vizualizuje **vnímaný výkon** — čo používateľ reálne vidí.

Skontroluj tri veci:

### 1. Kedy zmizne biele plátno?

Ak sú prvé 2 sekundy úplne biele, máš **render-blocking** problém. JS alebo CSS, ktoré blokujú prvé vykreslenie. V reporte hľadaj metriku „Start Render“ — ak je nad 2 s, máš čo opravovať.

### 2. Kedy sa vykreslí hero (LCP element)?

Hero obrázok by sa mal objaviť do 2,5 s. Ak nie, ideš do sekcie „LCP“ v reporte — tam dostaneš presný identifikátor elementu (CSS selektor + snímku s vyznačeným obrysom). Ak sa LCP opakovane drží nad 2,5 s, prejdi si [najčastejšie príčiny pomalého LCP v praxi](/blog/lcp-nad-2-5s-pricin/).

### 3. Hýbe sa layout počas načítania?

Vizuálne na filmstripe vidíš, ako obsah skáče — to je CLS. Ak je na snímke v `0,5 s` banner hore a na snímke v `1,0 s` je banner dole, máš shift. Klikni do „Visual Comparison“ pre porovnanie vedľa seba. Presne toto trápi väčšinu mobilných webov — pozri, [prečo dynamické bannery ničia layout na mobiloch](/blog/cls-mobil-banner/).

Filmstrip ti za 30 sekúnd povie, či máš problém s **vykresľovaním**, alebo s **layoutom**. To rozhoduje, kam ideš ďalej.

## Graf 2: Waterfall — čo sa sťahuje a v akom poradí

Druhý pohľad. Waterfall je horizontálny graf každého HTTP requestu — kedy začal, ako dlho trval a kde sú fázy DNS/TLS/TTFB/download.

Tri vzory, ktoré hľadám:

### Vzor A: Render-blocking JS/CSS na vrchu

Prvých 5 – 10 riadkov waterfallu je request 1 (HTML), request 2 – 4 (CSS), request 5+ (JS v `<head>`). Ak vidíš JS request bez atribútu `async`/`defer` (WPT to označí ikonkou), prehliadač čaká, kým sa stiahne a vykoná, skôr než pokračuje.

Konkrétny príklad: jQuery a `wp-emoji-release.min.js` v `<head>` blokujú vykreslenie. Fix: `defer` cez parameter `strategy` vo `wp_enqueue_script` (WP 6.3+).

```php
wp_enqueue_script('jquery', '...', [], null, ['strategy' => 'defer']);
```

### Vzor B: Third-party domény pred prvým vykreslením

Hľadaj v stĺpci „Domain“ hostnames mimo svojej domény: `googletagmanager.com`, `connect.facebook.net`, `widget.tidio.co`, `ws.zoominfo.com`. Ak sú **pred** čiarou start render, blokujú vykreslenie.

WPT zobrazuje „Start Render“ ako zvislú žltú čiaru cez celý waterfall. Všetko naľavo od nej je problém.

### Vzor C: Neskoré requesty v dlhom chvoste

Čo trvá na konci? Často to bude analytics, tracking, retargeting. Ak má posledný request finish-time napríklad 12 s, aj keď LCP je v 2 s, znamená to, že hlavné vlákno je zaneprázdnené ešte dlho po LCP — používateľ nemôže plynulo scrollovať.

## Graf 3: Connection View — réžia DNS a TLS

Tretí pohľad, často prehliadaný. Connection View ukazuje **rozpad podľa spojenia** — koľko domén kontaktuješ a koľko času sa míňa na DNS lookup, TLS handshake a idle time.

Otvoríš ho cez záložku „Performance Review“ → „Connection View“.

Čo hľadám:

### Príliš veľa domén

Ak vidíš 15+ jedinečných spojení, máš third-party bordel. Každá doména = DNS lookup (~30 ms) + TLS handshake (~100 ms) navyše. 5 zbytočných domén = 650 ms latencie.

Fix: konsoliduj. Cloudflare Zaraz robí proxy pre tracking skripty (Google Analytics, Meta Pixel) — všetko ide cez tvoju doménu a beží na edge, nie v prehliadači. Fonty hostuj lokálne namiesto Google Fonts. Tidio chat sa nedá self-hostovať, ale aspoň ho predpripoj cez `<link rel="preconnect" href="https://widget.tidio.co">`.

### Idle time na hlavnom spojení

Ak má tvoja primárna doména v Connection View dlhý idle time medzi requestmi, znamená to, že server odpovedá pomaly (vysoké TTFB) alebo prehliadač čaká na vyriešenie stromu závislostí. Toto poukazuje na problém na serveri, nie na frontende — ako [dostať server response pod 200 ms cez cache, edge a prefetch](/blog/server-response-200ms/).

## Repeat View — vplyv cache

Po prvej trojke pozri záložku „Repeat View“. Druhé načítanie s teplou vyrovnávacou pamäťou by malo byť **dramaticky** rýchlejšie — ak nie je, nepoužívaš HTTP cache hlavičky správne.

Konkrétne signály: ak LCP v Repeat View nie je pod 1 s, máš na statike `Cache-Control: no-cache` alebo úplne chýbajúcu hlavičku `Cache-Control`.

Fix: v nginxe alebo `.htaccess`:

```nginx
location ~* \.(jpg|jpeg|png|webp|avif|svg|woff2|css|js)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}
```

Súbory s revíznym hashom (`app.4f3c2.js`) môžu mať `immutable` — prehliadač si ich už nikdy nevypýta odznova.

## 5-minútový postup: TL;DR

1. **Otvor report → Filmstrip.** Kedy zmizne biele plátno, kedy sa vykreslí hero. (60 s)
2. **Otvor Waterfall.** Render-blocking JS/CSS pred start render? Third-party pred LCP? (90 s)
3. **Otvor Connection View.** Príliš veľa domén? (45 s)
4. **Otvor záložku Repeat View.** Funguje teplá cache? (60 s)
5. **Identifikuj jeden najväčší problém** a oprav ho. Otestuj znova. (45 s)

Najčastejšie nálezy v poradí frekvencie:

- Hero obrázok bez `fetchpriority="high"` (vidno vo waterfalle — sťahuje sa neskoro)
- Render-blocking script tag v `<head>` bez `defer`
- Príliš veľa third-party domén pred prvým vykreslením
- Cookie banner, ktorý spôsobuje CLS (vidno na filmstripe ako náhly skok)

WebPageTest má 30 ďalších panelov, ktoré ti niekedy pomôžu (Bytes, Requests, Domains, Custom Metrics), ale v 90 % auditov ti tieto tri grafy stačia. Začni nimi, oprav najväčší problém, otestuj znova. Iterácia.
