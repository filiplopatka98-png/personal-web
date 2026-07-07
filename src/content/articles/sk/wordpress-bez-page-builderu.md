---
title: "WordPress bez page builderu: prečo Elementor väčšinou len prekáža"
date: 2026-10-20
read: 8
tags: ["WordPress", "Performance"]
excerpt: "Page buildery ako Elementor pridávajú divy, CSS a JS na každú stránku. Ukazujem, prečo natívny block editor v roku 2026 stačí a ako web postaviť bez neho."
featured: false
---

Page buildery predávajú jeden sľub: postavíš si web bez kódu. A splnia ho — do prvého momentu, keď ti niekto zmeria Core Web Vitals alebo keď musíš po dvoch rokoch spraviť update. Vtedy zistíš, koľko tá pohodlnosť naozaj stála. V roku 2026 už WordPress natívne vie skoro všetko, na čo sme kedysi potrebovali Elementor či WPBakery — a vie to bez balastu. Poďme si povedať, prečo staviam takmer výhradne bez page builderu a ako na to.

## Čo page builder reálne pridá do stránky

Problém page builderov nie je estetický, je architektonický. Elementor a spol. renderujú vlastný layout engine, ktorý každú sekciu, stĺpec a widget obalí do vlastných `<div>`-ov. Tie divy nemajú žiadnu sémantickú hodnotu — existujú len preto, aby fungoval builder.

Číslo, ktoré to ilustruje: pre ekvivalentný layout generuje natívny block editor (Gutenberg) približne trikrát menej HTML a zhruba štyrikrát menej divov než Elementor. Elementor navyše na každú stránku ťahá CSS a JS pre **všetky** možné widgety, nie len tie, ktoré si použil — bežne 200 – 300 KB CSS plus JS aj na jednoduchej šablóne.

Prečo to vadí? Lebo prehliadač musí každý jeden ten element naparsovať, naštýlovať a vyrenderovať. Väčší a hlbšie zanorený DOM sa priamo prejaví v Core Web Vitals — konkrétne v [LCP nad 2,5 s](/blog/lcp-nad-2-5s-pricin/) a vo [výkone tretostranných a render-blocking skriptov](/blog/third-party-skripty-vykon/).

## Čísla, ktoré rozhodujú

Google od roku 2024 hodnotí web podľa Core Web Vitals a prahy sa nemenia. „Good" znamená:

- **LCP** pod 2,5 s (rýchlosť načítania hlavného obsahu)
- **INP** pod 200 ms (odozva na interakciu — od 2024 nahradilo FID)
- **CLS** pod 0,1 (vizuálna stabilita)

Dôležitý detail: Google meria na 75. percentile reálnych návštevníkov. Nestačí, aby to bolo rýchle na tvojom MacBooku — 75 % návštev musí byť „good", inak stránka neprejde. A INP je v roku 2026 najčastejšie padajúca metrika; podľa dostupných dát ho stále nespĺňa okolo 43 % webov. INP je pritom o JavaScripte — a práve JavaScriptu majú page buildery na rozdávanie.

Nehovorím, že s Elementorom sa zelené CWV dosiahnuť nedá. Dá — s critical CSS, deferovaným JS, redukciou DOM a cache pluginom ako WP Rocket sa optimalizovaný Elementor web dostane pod 2,5 s. Ale je to boj proti vlastnému nástroju a každý update buildera či doplnkov ti tú optimalizáciu vie znova rozbiť. To je údržbová záťaž, ktorú platíš navždy.

## Čo dnes vie natívny WordPress

Argument „bez buildera to neposkladám" už v roku 2026 neplatí. WordPress 7.0 vyšiel v máji 2026 a block editor (predtým projekt Gutenberg) medzitým dorástol do plnohodnotného site editora. Full Site Editing, block témy, `theme.json` na dizajnové tokeny, globálne štýly, patterny, template parts — layout aj typografiu naklikáš priamo v editore a výstupom je čistý HTML bez wrapper divov.

Kľúčový míľnik pre vývojárov prišiel s Block Bindings API vo WordPress 6.5 (apríl 2024). Umožňuje napojiť dynamické dáta — napríklad custom field — priamo na atribúty natívnych blokov (Paragraph, Heading, Button, Image) bez jediného pluginu navyše. Presne to, na čo sme kedysi ťahali ACF-blocks alebo builder shortcode.

Príklad — napojenie custom fieldu na paragraf priamo v markupe bloku:

```html
<!-- wp:paragraph {
  "metadata": {
    "bindings": {
      "content": {
        "source": "core/post-meta",
        "args": { "key": "cena_od" }
      }
    }
  }
} -->
<p>Placeholder, prepíše sa hodnotou z post-meta</p>
<!-- /wp:paragraph -->
```

Aby bol field vôbec dostupný pre bindings, treba ho registrovať s `show_in_rest`:

```php
add_action('init', function () {
    register_post_meta('page', 'cena_od', [
        'type'         => 'string',
        'single'       => true,
        'show_in_rest' => true,
    ]);
});
```

Ak potrebuješ vlastný dátový zdroj (nie post-meta), zaregistruješ ho cez `register_block_bindings_source()` a doplníš hodnotu v PHP. Žiadny frontend JS builderu, len natívny WordPress.

## Ako staviam web bez buildera

V praxi to má pár krokov, ktoré sa oplatí držať.

**1. Block téma, nie klasická.** Začínam od čistej block témy so `theme.json`. Dizajnové rozhodnutia — farby, typografická škála, spacing — žijú v jednom súbore a sú konzistentné naprieč celým webom. Žiadny „theme options" panel s 400 nastaveniami.

```json
{
  "version": 3,
  "settings": {
    "color": {
      "palette": [
        { "slug": "brand", "color": "#0b5", "name": "Brand" },
        { "slug": "ink",   "color": "#111", "name": "Ink" }
      ]
    },
    "typography": {
      "fontSizes": [
        { "slug": "base", "size": "1rem",   "name": "Base" },
        { "slug": "lg",   "size": "1.5rem", "name": "Large" }
      ]
    }
  }
}
```

**2. Patterny namiesto klonovania sekcií.** Opakovateľné bloky obsahu (hero, CTA, cenník) uložím ako patterny. Marketér ich vloží a prepíše text — bez toho, aby videl HTML. Ak potrebuješ, aby si vlastné bloky klikali aj ľudia bez znalosti kódu, pozri [custom Gutenberg blocks pre marketérov](/blog/gutenberg-blocks-marketeri/).

**3. Custom post types a taxonómie bez pluginu.** Referencie, produkty, tím — to všetko vieš zaregistrovať pár riadkami v kóde. Postup som rozpísal v [CPT a taxonómie bez pluginu](/blog/cpt-taxonomie-bez-pluginu/).

**4. Dynamický obsah cez Block Bindings alebo natívne dynamické bloky.** Namiesto builder shortcodov použiješ post-meta bindings alebo Query Loop. Ak riešiš, kam s vlastnými poľami, porovnal som možnosti v [ACF Pro vs Meta Box vs Custom Fields](/blog/acf-vs-metabox-vs-cf/).

## Kedy má page builder zmysel

Aby to nevyznelo ako dogma — sú situácie, kde builder obhájim. Ak klient chce **sám** vizuálne skladať zložité landing pages, meniť layout od základu a nikto z tímu nesiahne na kód, tak Elementor môže dávať zmysel. Cena za to je výkon a údržba a treba ju povedať nahlas dopredu.

Rovnako: prebrať existujúci Elementor web a nasilu ho prepisovať do block témy zvyčajne nemá ekonomiku. Vtedy skôr optimalizujem to, čo je — zapnem „Optimized DOM Output" a „Optimized Asset Loading", vyhodím nepoužívané widgety a animácie a nasadím cache. To je ale hasenie, nie riešenie.

## Záver: pohodlie dnes, dlh zajtra

Page builder je pôžička. Zaplatíš ňou rýchly rozbeh a splácaš ju každý mesiac vo forme pomalších stránok, väčšieho DOM-u a krehkých updatov. V roku 2026 už natívny WordPress vie postaviť čistý, rýchly a udržiavateľný web bez tejto pôžičky — block témy, `theme.json`, patterny a Block Bindings API pokryjú drvivú väčšinu toho, na čo sme kedysi builder potrebovali.

Moje pravidlo je jednoduché: builder len vtedy, keď ho klient reálne bude sám denne používať. Vo všetkých ostatných prípadoch staviam bez neho — a web aj klient sú z toho po roku šťastnejší. Ak už builder na webe máš a rieši sa výkon, začni [plugin diétou](/blog/plugin-dieta-z-28-na-9/); zvyčajne je to najrýchlejšia cesta k merateľnému zlepšeniu.
