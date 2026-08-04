---
title: "Speculation Rules API: takmer okamžitá navigácia aj na malom webe"
date: 2026-08-06
read: 7
tags: ["Performance"]
excerpt: "Prehliadač vie stiahnuť a vykresliť ďalšiu stránku ešte predtým, než na ňu klikneš — bez SPA, bez frameworku. Ukážem reálnu konfiguráciu Speculation Rules API, kde sú riziká a ako to nasadiť na WordPress aj statický web."
featured: false
---

Klasická predstava „rýchleho webu" je: optimalizuj obrázky, skráť TTFB, znič blokujúci JavaScript. To všetko platí, ale rieši to len prvé načítanie. Každá ďalšia navigácia — klik na produkt, na článok, na ďalšiu stránku výpisu — znova čaká na DNS, TCP, TLS, request a render. Speculation Rules API rieši práve toto: prehliadač stránku **stiahne a vyrenderuje ešte predtým, než na odkaz klikneš**, takže samotná navigácia pôsobí, akoby prebehla za nula milisekúnd.

Nie je to nová myšlienka — `<link rel="prefetch">` a nechvalne známy (a dnes deprecated) `<link rel="prerender">` tu boli roky. Rozdiel je, že Speculation Rules API to robí poriadne: deklaratívne JSON pravidlá, kontrola nad tým, kedy sa má prehliadač „stávkovať" na odkaz, a vstavané poistky proti plytvaniu batériou a dátami ([developer.chrome.com/docs/web-platform/prerender-pages](https://developer.chrome.com/docs/web-platform/prerender-pages)).

## Prefetch vs. prerender — nie je to to isté

API pozná dve akcie:

- **`prefetch`** stiahne dokument (a v niektorých prípadoch aj subresources) do pamäte, ale nič nevykresľuje. Je to bezpečnejšia, lacnejšia voľba — vhodná ako prvý krok takmer na každom webe.
- **`prerender`** ide ďalej: stránku skutočne otvorí v skrytom pozadí, spustí jej JavaScript a plne ju vyrenderuje. Keď potom klikneš, prehliadač len „prepne" na hotovú kartu. Tu je zisk najväčší, ale aj riziko — spustil si cudziu stránku vrátane jej vedľajších efektov skôr, než si na ňu naozaj prišiel ([developer.chrome.com/docs/web-platform/prerender-pages](https://developer.chrome.com/docs/web-platform/prerender-pages)).

Oficiálne odporúčanie Chrome tímu je začať s `prefetch`, overiť si, že to nič nerozbíja, a až potom časť pravidiel presunúť na agresívnejší `prerender` ([developer.chrome.com/docs/web-platform/implementing-speculation-rules](https://developer.chrome.com/docs/web-platform/implementing-speculation-rules)). Ak riešiš aj [LCP nad 2,5 sekundy](/blog/lcp-nad-2-5s-pricin/), toto je jedna z mála techník, ktorá LCP druhej stránky nezníži — ona ho prakticky vynuluje, lebo stránka je v momente kliknutia už hotová.

## Reálna konfigurácia: document rules + eagerness

Namiesto vypisovania konkrétnych URL (čo sa hodí len pre pár kľúčových stránok) sa vo väčšine projektov oplatí použiť **document rules** — pravidlo, ktoré sa vzťahuje na všetky odkazy vyhovujúce vzoru, s výnimkami:

```html
<script type="speculationrules">
{
  "prefetch": [
    {
      "where": {
        "and": [
          { "href_matches": "/*" },
          { "not": { "href_matches": "/kosik/*" } },
          { "not": { "href_matches": "/odhlasenie" } },
          { "not": { "selector_matches": ".no-prefetch" } }
        ]
      },
      "eagerness": "moderate"
    }
  ],
  "prerender": [
    {
      "where": {
        "and": [
          { "selector_matches": ".prerender" },
          { "not": { "href_matches": "/kosik/*" } }
        ]
      },
      "eagerness": "eager"
    }
  ]
}
</script>
```

`href_matches` používa syntax URL Pattern API, `selector_matches` beží nad CSS selektormi a `and`/`not` sa dajú kombinovať do ľubovoľne zložitých podmienok ([developer.chrome.com/docs/web-platform/implementing-speculation-rules](https://developer.chrome.com/docs/web-platform/implementing-speculation-rules)). V tomto príklade sa všetky odkazy okrem košíka a odhlásenia prefetchujú s miernou opatrnosťou, a odkazy s triedou `.prerender` (typicky hlavné CTA — „ďalší produkt", „pokračovať v čítaní") sa rovno prerenderujú agresívnejšie.

### Eagerness — kedy presne prehliadač „stávkuje"

Eagerness určuje, ako veľmi si musí byť prehliadač istý, že na odkaz klikneš, kým ho spustí:

- **`immediate`** — spustí sa hneď, ako prehliadač pravidlo uvidí. Toto je predvolená hodnota pre zoznamy URL (`urls: [...]`).
- **`eager`** — na desktope stačí **10 ms** podržania kurzora nad odkazom, na mobile sa spúšťa **50 ms** po tom, čo odkaz vstúpi do viewportu.
- **`moderate`** — na desktope **200 ms** hover alebo skorší `pointerdown`; na mobile zložitejšia heuristika okolo 500 ms po zastavení scrollu. Toto je predvolená hodnota pre document rules.
- **`conservative`** — spustí sa až na `pointerdown`/`touchstart`, teda tesne pred samotným kliknutím. Najnižšie riziko, ale aj najnižší zisk.

(Presné číselné hodnoty aj predvolené nastavenia potvrdzuje [developer.chrome.com/docs/web-platform/prerender-pages](https://developer.chrome.com/docs/web-platform/prerender-pages).) Chrome navyše limituje, koľko špekulácií môže bežať naraz — pri `immediate` je to až 50 prefetchov / 10 prerenderov, pri ostatných úrovniach eagerness len 2 naraz (FIFO, staršie sa rušia v prospech nových) — takže sa nedá „zahltiť" web desiatkami zbytočných requestov.

## Riziká, na ktoré sa oplatí pripraviť

Prerender nie je zadarmo. Tri veci, ktoré si musíš ustrážiť:

1. **Plytvanie.** Nie každý prerender sa premení na návštevu. Konzervatívnejšia eagerness a vylučovanie nestálych stránok (košík, platba, odhlásenie) drží plytvanie v rozumných medziach.
2. **Analytika sa spúšťa dvakrát.** Ak máš vlastný analytics kód naviazaný na `load` event, spustí sa už počas prerenderu — teda predtým, než si stránku niekto naozaj pozrel. Väčšie analytické a reklamné platformy už so speculation rules počítajú a view nezalogujú, kým sa stránka neaktivuje, ale vlastný kód si musíš ošetriť sám ([developer.chrome.com/docs/web-platform/implementing-speculation-rules](https://developer.chrome.com/docs/web-platform/implementing-speculation-rules)). Rieši to `document.prerendering` a event `prerenderingchange`:

```js
function sendPageView() {
  // tvoj analytics/GTM kód
}

if (document.prerendering) {
  document.addEventListener('prerenderingchange', sendPageView, { once: true });
} else {
  sendPageView();
}
```

3. **Vedľajšie efekty v JS.** Skript, ktorý pri načítaní pýta notifikácie, otvára fullscreen alebo spúšťa `alert()`, by na prerenderovanej stránke problém spôsobiť nemal — prehliadač takéto „intrusive" API automaticky odloží až po aktivácii, a ak sa odložiť nedá, prerender radšej zruší ([developer.chrome.com/docs/web-platform/prerender-pages](https://developer.chrome.com/docs/web-platform/prerender-pages)). Napriek tomu je dobrý zvyk kontrolovať `document.prerendering` pri akomkoľvek kóde, ktorý má vedľajšie efekty smerom von (weboové sockety, tretie strany) — pozri aj [analýzu dopadu third-party skriptov na výkon](/blog/third-party-skripty-vykon/), lebo práve cudzie skripty najčastejšie nevedia, že bežia v prerenderovanom kontexte.

## Cross-origin obmedzenia

Speculation Rules API je navrhnuté konzervatívne, čo sa týka cudzích domén:

- **Prefetch** naprieč doménami funguje, ale z privátnostných dôvodov len vtedy, keď v prehliadači nemáš pre cieľovú doménu uložené žiadne cookies.
- **Prerender** je defaultne obmedzený na rovnaký origin. Cross-origin, same-site prerender (napr. z `www.tvojweb.sk` na `shop.tvojweb.sk`) je možný, ale cieľová stránka sa naň musí sama prihlásiť hlavičkou `Supports-Loading-Mode: credentialed-prerender` ([developer.mozilla.org/.../Supports-Loading-Mode](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Supports-Loading-Mode)). Cross-site prerender (úplne iná doména) momentálne nie je možný.

Pre bežný jednodoménový eshop alebo blog to v praxi znamená: nastavuješ pravidlá len pre vlastné, interné odkazy — čo je aj presne ten prípad, kde má speculative loading najväčší zmysel.

## Ako to nasadiť

**Statický web (napr. Astro):** stačí pridať `<script type="speculationrules">` blok do layoutu — buď staticky, alebo generovaný podľa štruktúry stránky. Ak chceš mať zoznam pravidiel mimo HTML (napr. kvôli CDN), dá sa doručiť aj cez HTTP hlavičku `Speculation-Rules` namiesto inline scriptu, čo sa hodí, keď HTML negeneruje priamo tvoj server ([developer.chrome.com/docs/web-platform/prerender-pages](https://developer.chrome.com/docs/web-platform/prerender-pages)).

**WordPress:** tu je dobrá správa — nemusíš nič písať sám. Od verzia **6.8** je Speculative Loading súčasťou jadra, zapnuté defaultne pre neprihlásených návštevníkov (keď má web pekné permalinky), s konzervatívnym nastavením `prefetch` + `conservative` eagerness. Ak chceš agresívnejšie správanie, nainštaluj samostatný plugin **Speculative Loading** ([wordpress.org/plugins/speculation-rules](https://wordpress.org/plugins/speculation-rules/)), ktorý defaultne používa `prerender` + `moderate`. Konfigurovať sa dá cez filtre `wp_speculation_rules_configuration` (zmena módu/eagerness alebo úplné vypnutie) a `wp_speculation_rules_href_exclude_paths` (vylúčenie ciest — URL s query parametrami sú vylúčené automaticky). Konkrétne odkazy alebo bloky sa dajú vyňať aj cez CSS triedy `no-prefetch` / `no-prerender` priamo v editore ([make.wordpress.org/core — Speculative Loading in 6.8](https://make.wordpress.org/core/2025/03/06/speculative-loading-in-6-8/)).

## Progresívne vylepšenie, nie závislosť

Kľúčová vlastnosť tejto API je, že ak ju prehliadač nepozná, `<script type="speculationrules">` jednoducho ignoruje — žiadna chyba, žiadny fallback kód netreba. Plná podpora (prerender aj document rules s eagerness) je od **Chrome/Edge 109**, pričom `eagerness` a `where` pravidlá pribudli až v **Chrome/Edge 121**; staršie verzie 105–108 podporovali len obmedzený same-origin prerender ([developer.mozilla.org/.../Speculation_Rules_API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API)). Firefox to zatiaľ nepodporuje (k prefetch časti má „pozitívne stanovisko", ale nič neimplementoval), Safari ju od verzie **26.2** má za experimentálnym prepínačom, vypnutú defaultne ([developer.mozilla.org/.../Speculation_Rules_API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API)). Inými slovami: časť návštevníkov dostane okamžitú navigáciu, zvyšok normálnu — a nikto nič nestratí.

Ak si už nasadil [View Transitions v Astro](/blog/astro-view-transitions-eshop/), speculation rules sú prirodzený ďalší krok — View Transitions vyriešia plynulý *prechod* medzi stránkami, speculation rules vyriešia to, že dáta na ďalšiu stránku už čakajú skôr, než tranzícia vôbec začne. Spolu dávajú pocit natívnej aplikácie na bežnom serverovo-renderovanom webe. A keďže je to jedna z mála CWV optimalizácií, ktorá sa dá pridať bez zásahu do existujúceho kódu, patrí do každého [zoznamu priorít Core Web Vitals pre eshop](/blog/cwv-eshop-priorita/) niekde blízko vrchu — návratnosť pár riadkov JSON-u je tu nezvyčajne vysoká.
