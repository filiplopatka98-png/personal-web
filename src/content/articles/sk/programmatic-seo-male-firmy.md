---
title: "Programmatic SEO pre malé firmy: kedy dáva zmysel a kedy je to spam"
date: 2027-01-21
read: 8
tags: ["SEO"]
excerpt: "Generovanie stoviek stránok z dát vie priviesť traffic aj zabiť doménu. Kde je hranica medzi užitočným programmatic SEO a scaled content abuse."
featured: false
---

Programmatic SEO znie pre malú firmu ako sen: napíšeš jednu šablónu, napojíš dataset a máš 500 stránok, ktoré zbierajú long-tail dopyty. V praxi to typicky skončí jedným z dvoch spôsobov — buď máš stabilný prílev organiky, alebo ti Google doménu prepadne o 60 – 90 % zo dňa na deň. Rozdiel medzi tými dvoma scenármi nie je náhoda a nie je to ani o „kvalite copywritingu". Je to o tom, či každá stránka nesie reálnu, unikátnu hodnotu z dát — alebo len prehadzuješ premenné v šablóne.

Poďme si to prejsť triezvo. Kedy programmatic SEO dáva zmysel pre malú firmu a kedy si tým kopeš hrob.

## Čo Google reálne trestá (a čo nie)

Dôležité rozlíšenie: Google **netrestá programmatic SEO ako techniku**. Trestá *scaled content abuse*. To je jeho vlastný pojem a definícia je pomerne konkrétna:

> „Scaled content abuse is when many pages are generated for the primary purpose of manipulating search rankings and not helping users."

Kľúčové sú tri veci v tej vete: *many pages*, *primary purpose manipulating rankings*, *not helping users*. Google v [oficiálnych spam politikách](https://developers.google.com/search/docs/essentials/spam-policies) explicitne dodáva, že je jedno, či obsah vyrobil človek alebo automat — hodnotí sa výsledok, nie proces. Táto politika prišla s [marcovým core update-om a novými spam politikami v roku 2024](https://developers.google.com/search/blog/2024/03/core-update-spam-policies) a odvtedy sa enforcement len sprísňoval.

Čo to znamená prakticky? Zoberme dva reálne, dobre známe príklady programmatic SEO, ktoré fungujú roky:

- **Zapier** má tisíce stránok typu „Connect Slack to Google Sheets" — jednu pre každú kombináciu appiek. Každá cieli na konkrétny long-tail dopyt a nesie reálny obsah o tom, ako presne tá integrácia funguje.
- **Nomadlist** generuje stránku pre každé mesto: cena života, rýchlosť internetu, bezpečnosť, počasie, komunita — všetko z databázy. Žiadne dve mestá nemajú rovnaký obsah.

Toto Google netrestá, lebo za každou stránkou je unikátny dátový bod, ktorý používateľ reálne hľadá. Problém nastáva, keď medzi 500 stránkami je jediný rozdiel podmena mesta v inak identickej vete.

## Test na jednu otázku

Mám na to jeden filter, ktorý používam skôr než čokoľvek napíšem do šablóny:

> Keby som tie stránky vygeneroval a niekto ich čítal ako celok — pridáva každá z nich niečo, čo ostatné nemajú?

Ak je odpoveď „len iné mesto/farbu/veľkosť v tej istej vete", stop. To je presne to, čo Google v politike označuje ako obsah generovaný „bez pridania hodnoty pre používateľov". Nezáleží, či to napísala AI alebo šablónový engine.

Bežne vídam, že malé firmy si zmýlia *rozmnoženie kľúčových slov* s *pokrytím reálnych dopytov*. „Inštalatér Bratislava", „Inštalatér Košice", „Inštalatér Žilina" na troch takmer identických stránkach — to je červená vlajka. Naopak stránka pre každú službu s reálnym cenníkom, časom výjazdu a fotkami z danej lokality hodnotu nesie.

## Kedy to pre malú firmu dáva zmysel

Programmatic SEO má zmysel len vtedy, keď máš **štruktúrovaný dataset s reálnou hodnotou na riadok**. Konkrétne scenáre, kde to funguje:

- **Eshop s veľkým katalógom** — kategórie, filtre, kombinácie „produkt + použitie". Tu je dataset prirodzený: produkty už existujú.
- **Lokálne služby s reálne odlišnými lokalitami** — ale len ak máš k lokalite naozaj unikátny obsah (referencie, ceny, dojazd), nie tri slová prehodené.
- **Porovnávače a nástroje** — „X vs Y", kalkulačky, tabuľky s aktuálnymi dátami.
- **Dokumentácia a integrácie** — presne Zapier model.

Ak nemáš dataset, nemáš programmatic SEO — máš len šablónu, do ktorej dopĺňaš vodu. A tú Google [ako scaled content abuse pozná](https://developers.google.com/search/docs/essentials/spam-policies) čoraz lepšie.

Ešte jedna vec: programmatic SEO **nenahrádza technický základ**. Ak ti tie stránky nemajú kanonické URL, sitemapu a slušný render, žiadny objem to nezachráni. Predtým než niečo generuješ, [prejdi si, čo z technického SEO reálne merateľne pomáha](/blog/seo-checklist-co-pomaha/).

## Ako to postaviť bez toho, aby ti to vybuchlo

Základ je oddeliť **dáta** od **šablóny**. Dataset drž v niečom, čo vieš spravovať — Airtable, tabuľka, JSON, databáza. Šablóna berie riadok a renderuje stránku. Kľúč je, aby šablóna **nútila** unikátne polia, nie aby ich mala voliteľné.

V Astro to vyzerá zhruba takto — Content Collection so schémou, ktorá vynúti povinné dátové polia:

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const lokality = defineCollection({
  type: 'data',
  schema: z.object({
    mesto: z.string(),
    dojazd_min: z.number(),          // reálna hodnota, nie výplň
    cena_od_eur: z.number(),
    referencie: z.array(z.string()).min(1), // aspoň 1 referencia
    popis: z.string().min(120),       // núti reálny text
  }),
});

export const collections = { lokality };
```

Tá `.min(1)` na referenciách a `.min(120)` na popise sú tam schválne — ak nemáš čím naplniť reálny obsah, build zlyhá. To je feature, nie bug. Núti ťa to negenerovať prázdne stránky. Typesafe prístup od dát po šablónu si vieš pozrieť podrobnejšie v článku o [Astro Content Collections a MDX](/blog/astro-content-collections-mdx/).

Samotná stránka potom cez `getStaticPaths` vyrobí jednu URL na riadok:

```astro
---
// src/pages/sluzby/[mesto].astro
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const lokality = await getCollection('lokality');
  return lokality.map((entry) => ({
    params: { mesto: entry.id },
    props: { data: entry.data },
  }));
}

const { data } = Astro.props;
---
<h1>Inštalatér {data.mesto}</h1>
<p>Dojazd do {data.dojazd_min} min. Ceny od {data.cena_od_eur} €.</p>
<!-- reálne referencie z datasetu, nie lorem ipsum -->
```

Toto je celý technický základ. Ťažká práca nie je v kóde — je v datasete. Ak nevieš na každý riadok dodať reálnu hodnotu, radšej ubli počet stránok, než aby si škáloval prázdno.

## Nekŕm tým Google naraz

Ešte poznámka k dávkovaniu. Ak zrazu publikuješ 500 stránok cez noc, dávaš tým Googlu jasný signál „scaled". Publikuj po dávkach, sleduj v Search Console indexáciu a kvalitu (pomery „Crawled – not indexed" ti povedia, či Google obsah považuje za slabý), a ak vidíš, že sa veľká časť stránok neindexuje, je to spätná väzba — nie dôvod pridať ďalších 500.

A sitemapa musí obsahovať len to, čo naozaj chceš indexovať. Generované stránky, ktoré nenesú hodnotu, do nej [vôbec nepatria](/blog/sitemapy-bez-chyb/).

## Pozor na cudzí web (site reputation abuse)

Osobitná pasca: publikovať generovaný obsah na cudzej silnej doméne, aby si sa zviezol na jej autorite. Google to volá *site reputation abuse* a od [novembra 2024 platí sprísnená verzia](https://developers.google.com/search/blog/2024/11/site-reputation-abuse) — je jedno, či ten obsah máš pod dohľadom alebo nie. Ak nesie tretiu stranu a zneužíva ranking signály hostiteľa, je to porušenie. Pre malú firmu to znamená: nekupuj si „balík 100 článkov na známom portáli" ako skratku. To nie je programmatic SEO, to je parasite SEO a manuálne akcie zaň už schytali aj veľkí vydavatelia.

## Zhrnutie

Programmatic SEO nie je ani zázrak, ani spam — je to nástroj, ktorý zosilní to, čo mu dáš. Dáš mu reálny dataset s hodnotou na riadok, dostaneš traffic. Dáš mu prázdnu šablónu s podmenou premenných, dostaneš prepad. Pre väčšinu malých firiem platí jednoduché pravidlo: **ak nevieš na každú stránku napísať jednu vetu, ktorú by ostatné stránky nemali, nerob to.** Radšej desať skvelých stránok než tisíc, ktoré ti Google odstrihne pri najbližšom spam update.
