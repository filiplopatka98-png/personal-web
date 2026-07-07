---
title: "Sitemapy, ktoré Google naozaj prečíta"
date: 2026-09-03
read: 8
tags: ["SEO"]
excerpt: "Priority a changefreq Google ignoruje, lastmod používa len ak mu veríš. Praktický návod na sitemapy bez chýb, ktoré crawlerom naozaj pomôžu."
featured: false
---

Sitemap je jedna z tých vecí, ktoré vyzerajú triviálne — pridáš plugin, vygeneruje sa XML, odošleš do Search Console, hotovo. Lenže vo väčšine auditov, ktoré robím, práve tá „hotová" sitemapa Googlu skôr škodí, než pomáha. Obsahuje 404-ky, presmerovania, `noindex` stránky, stovky tagových archívov a `<priority>1.0</priority>` na každej URL. Google si z toho vezme presne nič užitočné.

Poďme si to prejsť tak, aby sitemapa robila to, čo má: **rýchlo a spoľahlivo povedať crawlerom, ktoré kanonické URL existujú a kedy sa naozaj zmenili.**

## Čo Google z sitemapy číta a čo ignoruje

Toto je najdôležitejšia časť celého článku, lebo tu robí chybu skoro každý. Google [oficiálne v dokumentácii](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) uvádza, že **`<priority>` a `<changefreq>` ignoruje**. Nie „im dáva menšiu váhu" — ignoruje ich úplne. Gary Illyes z Googlu to opakoval roky: polia sa natoľko zneužívali (každý web dal všetkým stránkam `priority` 1,0), že signál stratil akúkoľvek hodnotu.

Čo Google reálne používa, je `<lastmod>` — ale s podmienkou. Cituje sa to takto: hodnotu použije, „ak je konzistentne a overiteľne presná" (napríklad porovnaním s reálnou poslednou zmenou stránky). Inými slovami: ak dáš `lastmod` na dnešný dátum pri každom crawle, aby si vyzeral „čerstvo", Google to odhalí a prestane ti veriť — potom ignoruje aj korektné `lastmod`.

Praktický záver: **`lastmod` musí odrážať skutočnú zmenu hlavného obsahu.** Nie zmenu roku v pätičke, nie prepočítaný počet komentárov. Reálnu editáciu textu, štruktúrovaných dát alebo interných odkazov.

## Formát lastmod — kde vzniká „Couldn't fetch"

`lastmod` musí byť v [W3C Datetime formáte](https://www.w3.org/TR/NOTE-datetime). Google pravidlá spresnil: ak vynecháš čas, defaultne sa berie polnoc UTC. Ak čas uvedieš, **musíš uviesť aj časovú zónu** — inak je to chyba. Nevalidný dátum alebo zlý formát tiež hodí chybu. Budúce dátumy naopak Google už netoleruje ako chybu (to sa zmenilo).

Validné príklady:

```xml
<lastmod>2026-09-03</lastmod>
<lastmod>2026-09-03T14:30:00+02:00</lastmod>
<lastmod>2026-09-03T12:30:00Z</lastmod>
```

Nevalidné (a typický zdroj problémov v Search Console):

```xml
<!-- čas bez zóny -->
<lastmod>2026-09-03T14:30:00</lastmod>
<!-- lokálny formát -->
<lastmod>3. 9. 2026</lastmod>
```

Ak generuješ sitemapu vlastným kódom, v JavaScripte ti `new Date().toISOString()` vráti vždy validný UTC formát s `Z` na konci — bezpečná voľba.

## Limity, ktoré musíš rešpektovať

Jedna sitemapa má tvrdý limit **50 000 URL alebo 50 MB nekomprimovane** — podľa toho, čo príde skôr. Keď to prekročíš, rozdelíš obsah do viacerých sitemap a spojíš ich cez **sitemap index**. Ten je tiež XML, ale namiesto stránok listuje jednotlivé sitemapy (a sám má rovnaký limit 50 000 položiek).

Do Search Console potom odosielaš **len index** — Google si zvyšné sitemapy dohľadá sám.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.sk/sitemap-posts.xml</loc>
    <lastmod>2026-09-03</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.sk/sitemap-products.xml</loc>
    <lastmod>2026-09-03</lastmod>
  </sitemap>
</sitemapindex>
```

Súbor musí byť **UTF-8** a URL v ňom **absolútne a plne kvalifikované** (`https://example.sk/produkt`, nie `/produkt`). Google crawluje URL presne tak, ako sú v sitemape napísané — takže preklep v protokole alebo doméne = neindexovaná stránka.

## Do sitemapy patria len kanonické, indexovateľné URL

Toto je najčastejšia chyba, ktorú vídam. Sitemapa má byť zoznam URL, ktoré **chceš** mať v indexe. Z toho plynie, čo do nej nepatrí:

- stránky s `noindex`
- presmerovania (301/302) — daj tam cieľovú URL, nie tú, čo presmeruje
- 404 a iné chybové stavy
- nekanonické varianty (parametre, `?utm=`, filtre) — daj len kanonickú verziu
- stránky blokované v `robots.txt`

Posledný bod je subtílny konflikt: ak URL v sitemape zároveň blokuješ v `robots.txt`, dávaš Googlu protichodný signál — „crawluj to" verzus „nechoď sem". V Search Console to skončí ako varovanie a stránka sa neindexuje. Buď jeden alebo druhý.

Pri viacjazyčných weboch má sitemapa aj `hreflang` cez `xhtml:link`. Musí byť **recipročný** — ak SK verzia ukazuje na EN, EN musí ukazovať späť na SK, inak to Google zahodí. Túto tému rozoberám podrobnejšie v článku o [technickom SEO checkliste, ktorý naozaj pomáha](/blog/seo-checklist-co-pomaha/).

## WordPress: Yoast to rieši dobre, ale over si to

Ak beží web na WordPresse s Yoastom, sitemapa je na `/sitemap_index.xml` a je to slušne spravená vec. Yoast automaticky **vynecháva `noindex` stránky** a k celej sitemape pridáva HTTP hlavičku `X-Robots-Tag: noindex, follow` — čiže samotnú sitemapu Google neindexuje ako stránku, ale číta ju normálne. To je správne správanie.

Čo si over ručne: Yoast štandardne generuje samostatné sitemapy pre každý post type a taxonómiu. Na bežnom firemnom webe tak často vidím v indexe `sitemap-category.xml` a `sitemap-post_tag.xml` plné tenkých archívov. Ak tie archívy nemajú byť v indexe, nastav ich na `noindex` v Yoaste — vypadnú aj zo sitemapy. Nesnaž sa ich mazať filtrom a nechať indexovateľné; to je len iná forma toho istého konfliktu.

## Next.js: generuj sitemapu z kódu

V App Routeri (Next.js 16 v čase písania) máš natívny súbor `app/sitemap.ts`. Exportuješ default funkciu, ktorá vráti pole URL — typ `MetadataRoute.Sitemap`. Sitemapa sa tým generuje z tých istých dát ako stránky, takže sa nikdy nerozsynchronizuje.

```ts
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://example.sk',
      lastModified: new Date(),
    },
    {
      url: 'https://example.sk/blog',
      lastModified: new Date('2026-09-03'),
    },
  ]
}
```

Pri veľkých katalógoch (nad 50 000 URL) použiješ `generateSitemaps`, ktorá pole rozdelí na časti po 50 000. Pozor na jeden detail, ktorý sa v Next.js 16 zmenil: **`id` je teraz Promise**, ktorý musíš `await`-nuť.

```ts
import type { MetadataRoute } from 'next'

export async function generateSitemaps() {
  return [{ id: 0 }, { id: 1 }, { id: 2 }]
}

export default async function sitemap({
  id,
}: {
  id: Promise<string>
}): Promise<MetadataRoute.Sitemap> {
  const start = Number(await id) * 50000
  const products = await getProducts(start, start + 50000)
  return products.map((p) => ({
    url: `https://example.sk/produkt/${p.slug}`,
    lastModified: p.updatedAt,
  }))
}
```

Všimni si, že `lastModified` beriem z `p.updatedAt` — z reálneho dátumu úpravy v databáze. Presne to Google od `lastmod` chce.

## Rýchly kontrolný postup

Keď preberám sitemapu na audite, idem cez toto:

Sitemapa Googlu pomáha objaviť URL, ale samotný crawl budgetu a autoritu rozdeľuje interné prelinkovanie — na to je dobré myslieť súbežne, viac v článku o [internom linkingu cez topic clustery](/blog/internal-linking-topic-clusters/).

1. `curl -sI https://example.sk/sitemap.xml` — vracia `200` a `Content-Type: application/xml`? (Nie HTML, nie `404`.)
2. Otvor sitemapu a zober vzorku 10 URL — všetky vracajú `200`, žiadne 301 ani `noindex`?
3. Search Console → Sitemaps — status „Success", počet „Discovered URLs" sedí s očakávaním?
4. Search Console → Pages — koľko z odoslaných je reálne indexovaných? Veľký rozdiel = problém s kvalitou obsahu, nie so sitemapou.
5. Sú v XML `<priority>` a `<changefreq>`? Ak áno, pokojne ich zmaž — zmenšíš súbor a nič nestratíš.

Sitemapa nie je rankingový nástroj a nezaindexuje ti obsah, ktorý Google nechce. Je to len čistý, dôveryhodný zoznam. Keď ho udržíš presný — správne `lastmod`, len kanonické indexovateľné URL, žiadne konflikty s `robots.txt` — Google ho začne brať vážne. A to je celý zmysel.
