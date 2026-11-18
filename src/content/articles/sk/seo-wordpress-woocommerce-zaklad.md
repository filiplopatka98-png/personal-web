---
title: "SEO pre WordPress a WooCommerce: technický základ, ktorý treba mať v poriadku"
date: 2026-11-18
read: 7
tags: ["SEO", "WooCommerce", "WordPress"]
excerpt: "SEO optimalizácia WordPressu a WooCommerce e-shopu: duplicitné URL z filtrov, indexácia, presmerovania po migrácii a rýchlosť. Postup z reálnych e-shopov."
metaDescription: "SEO optimalizácia WordPress a WooCommerce: filtre a duplicity, kanonické adresy, sitemap, presmerovania po migrácii a rýchlosť. Praktický postup."
featured: false
faq:
  - q: "Je WordPress dobrý na SEO?"
    a: "Áno, ale základ nastavenie nerobí samo. Treba SEO plugin (Yoast alebo Rank Math), čisté trvalé odkazy, rozumnú sitemap, rýchle hostovanie a kontrolu, čo všetko sa indexuje."
  - q: "Čo je pri WooCommerce SEO najčastejší problém?"
    a: "Duplicitné a zbytočné adresy: filtre a radenie (?orderby, ?min_price), variácie, tagy a stránkovanie. Google ich zistí a prehľadáva namiesto dôležitých kategórií a produktov."
  - q: "Mám pri migrácii e-shopu presmerovať všetko na úvodnú stránku?"
    a: "Nie. Staré adresy presmeruj 301 na ich nový ekvivalent. Ak ekvivalent neexistuje (zrušená značka, vyradený produkt), vráť 410, nie hromadné presmerovanie na úvodnú stránku."
  - q: "Koľko stojí SEO audit WooCommerce e-shopu?"
    a: "Základný audit malého webu (do približne 10 stránok) robím za 99 €. E-shopy s väčším katalógom sú na ponuku podľa rozsahu."
---

Pri WordPresse a WooCommerce nie je SEO problém „málo textu", ale **kontrola toho, čo všetko Google vidí**. E-shop vie vygenerovať tisíce adries, ktoré nikto nehľadá, a tie potom konkurujú kategóriám a produktom, na ktorých zarábaš. Toto je poradie, v akom to prechádzam na reálnych e-shopoch. Všeobecný postup nájdeš v [návode na SEO optimalizáciu](/blog/seo-optimalizacia-webu-navod/), tu je len to, čo je špecifické pre WordPress a WooCommerce.

## 1. Over, čo je v indexe

Začni v Search Console: *Indexovanie → Stránky*. Pozri, ktoré typy adries tam sú a ktoré chýbajú. Na e-shope často nájdeš v indexe filtre, radenie a tagy, zatiaľ čo dôležitá kategória čaká v stave „Zistené, momentálne neindexované". Ak máš nový alebo čerstvo migrovaný web, je takých adries veľa a nie je to chyba obsahu, ale prehľadávania.

## 2. Odstráň duplicity z filtrov a radenia

WooCommerce pridáva parametre ako `?orderby=price`, `?min_price=10` alebo `?filter_farba=modra`. Každá kombinácia je pre Google nová adresa.

- Skontroluj, že filtre a radenie majú **canonical na čistú kategóriu** (SEO plugin to zvyčajne rieši, ale overiť treba).
- Ak používaš AJAX filtre, over, čo sa po kliknutí zapisuje do URL.
- Do `robots.txt` nedávaj `Disallow` na parametre naslepo: Google potom nevidí canonical ani `noindex` a adresu môže aj tak zobraziť.
- Košík, pokladňa a môj účet nemajú byť v indexe. Yoast aj Rank Math to zvyčajne nastavia, ale pozri výsledok v zdrojovom kóde.

## 3. Kategórie sú dôležitejšie než produkty

Ľudia hľadajú „kožené tašky", nie konkrétny kód produktu. Kategória je preto zvyčajne najsilnejšia stránka e-shopu. Dostane vlastný title, metaopis a úvodný text nad produktmi (nie 2 000 znakov pod nimi, kde ho nikto nečíta). Prázdne a duplicitné tagy radšej vypni z indexu.

## 4. Sitemap len s tým, čo chceš v Google

Do sitemap patria indexovateľné adresy: produkty, kategórie, stránky, články. Nepatria tam tagy, prílohy, autorské archívy ani adresy s `noindex`. Po zmene si skontroluj, že všetky adresy v sitemap vracajú 200 a majú správnu kanonickú adresu.

## 5. Migrácia: presmerovania rozhodujú

Najdrahšia SEO chyba pri e-shope je migrácia bez presmerovaní. Pri e-shope s veľkým katalógom, ktorý som prenášal z OpenCartu na WooCommerce, vyšlo z množiny zhruba 180 tisíc zozbieraných adries okolo 107 tisíc pravidiel. Z toho som riešil toto:

- **301** pre adresy, ktoré majú nový ekvivalent,
- **410** pre zrušené značky a adresy bez náhrady,
- **nie 301 na úvodnú stránku** pre všetko, čo sa nenašlo: Google takéto presmerovanie často berie ako „soft 404",
- útočné adresy (náhodné parametre, spam) preskočiť, nie presmerovávať.

Pri menšej migrácii platí rovnaký princíp: najprv mapa starých adries, potom presmerovania, potom až spustenie.

## 6. Rýchlosť berie SEO aj predaj

Pomalý e-shop prepadáva pri mobilnom LCP a ľudia z neho odchádzajú skôr, než niečo kúpia. Najčastejšie príčiny sú obrázky bez rozmerov, veľa pluginov a slabé hostovanie. Rozbor je v článku [LCP nad 2,5 s: príčiny](/blog/lcp-nad-2-5s-pricin/) a o výbere hostingu v článku [Hostingy na Slovensku: výkon](/blog/hostingy-sk-vykon/). Pozor aj na cache: ak sa pri každej aktualizácii vymaže celá a nenaplní sa naspäť, návštevník dostane pomalú stránku. Pri jednom klientskom webe sa celá cache mazala denne kvôli automatickým aktualizáciám prekladov. Opravil sa nie obsah, ale nastavenie obnovy.

## 7. Štruktúrované dáta a drobtová navigácia

Produkt s cenou a dostupnosťou (`Product`) a drobtová navigácia (`BreadcrumbList`) pomáhajú Googlu pochopiť stránku a zlepšujú zobrazenie vo výsledkoch. SEO plugin ich zvyčajne generuje, otestuj ich v Rich Results Test a v Search Console.

## 8. Meraj po týždňoch, nie po dňoch

Po úprave sleduj v Search Console počet indexovaných adries, zobrazenia a CTR. Prvé efekty sa zvyčajne ukážu po 3 až 6 mesiacoch, u nových domén neskôr.

## Chceš to prejsť na svojom e-shope?

Základný SEO audit malého webu (do približne 10 stránok) robím za **99 €**: indexácia, technické chyby, tituly a metaopisy a prioritizovaný zoznam úloh. Opravy podľa auditu po hodinách (30 €/h) s odhadom vopred, e-shopy s väčším katalógom na ponuku. Ceny sú v [ponuke služieb](/sluzby/) a súvisiace náklady v článku [Koľko stojí SEO optimalizácia](/blog/kolko-stoji-seo-optimalizacia/).
