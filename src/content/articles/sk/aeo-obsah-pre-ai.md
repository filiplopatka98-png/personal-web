---
title: "AEO: ako pripraviť obsah, aby ťa citoval ChatGPT aj Google"
date: 2027-01-14
read: 8
tags: ["SEO", "AI"]
excerpt: "Answer Engine Optimization prakticky — štruktúra odpovedí, schema, ktorá ešte funguje, čerstvosť obsahu a prečo llms.txt zatiaľ nie je zázrak."
featured: false
---

Klasické SEO ťa dostane na prvú stránku Googlu. AEO — Answer Engine Optimization — ťa dostane do odpovede, ktorú ChatGPT, Perplexity alebo Google AI Overview vygeneruje ešte predtým, než používateľ na tú prvú stránku vôbec klikne. A to je dnes iná disciplína, než na akú sme boli zvyknutí.

Čísla hovoria jasne: Google AI Overviews sa v prvej polovici 2026 objavujú podľa metodiky rôznych meraní na **48 až 60 %** vyhľadávaní. To znamená, že pre polovicu dopytov je organický odkaz až *pod* odpoveďou, ktorú si používateľ prečíta ako prvú. Ak v tej odpovedi nie si citovaný, si neviditeľný — bez ohľadu na to, ako dobre rankuješ.

Poďme na to, čo v praxi reálne funguje a čo je zatiaľ hype.

## Odpoveď hneď v prvých vetách

Toto je najdôležitejšia jediná zmena v myslení. Answer engine nečíta stránku ako človek — extrahuje **pasáže**. Berie prvú vetu alebo dve z každej sekcie a rozhoduje, či odpovedajú na dopyt. Ak začínaš sekciu troma odsekmi kontextu a poučovania, model prejde na konkurenciu, ktorá odpovedala rovno.

Praktické pravidlo, ktoré vídam opakovane potvrdené: **daj jadro odpovede do prvých 40 až 60 slov sekcie**, až potom rozvíjaj. Každý `##` nadpis formuluj ako otázku alebo jasnú tému a hneď pod ním odpovedz. Sekcie drž v rozsahu zhruba 200 až 400 slov so zreteľnými sémantickými hranicami — nech každá dáva zmysel aj vytrhnutá z kontextu.

Prakticky to znamená invertovanú pyramídu, ktorú novinári poznajú desaťročia: záver hore, detaily dole. Pre bežný firemný blog to je bolestivá zmena návyku, ale je to jednorazová úprava šablóny myslenia, nie technológia.

## Schema, ktorá ešte dáva zmysel (a jedna, čo prekvapí)

Structured data je stále signál, ale krajina sa v 2026 posunula. **7. mája 2026 Google definitívne prestal zobrazovať FAQ rich results** v klasickom vyhľadávaní — tie rozbaľovacie otázky pod výsledkom sú preč. Veľa ľudí z toho vyvodilo, že `FAQPage` schema je mŕtva. Nie je.

`FAQPage` je stále validný typ na Schema.org a Google (aj ostatné enginy) ho naďalej **parsuje na pochopenie obsahu**. Perplexity, ChatGPT search, Gemini aj Google AI Overviews čítajú FAQ markup ako primárny signál pri extrakcii Q&A odpovedí. Stránky s čistou FAQ schémou bývajú v AI odpovediach citované nadpriemerne oproti tým istým informáciám podaným len ako súvislý text.

Trojica, ktorú v praxi nasadzujem na obsahové stránky:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Čo je Answer Engine Optimization?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "AEO je príprava obsahu tak, aby ho AI enginy ako ChatGPT či Google AI Overview dokázali extrahovať, dôverovať mu a citovať ho ako odpoveď na otázku používateľa."
    }
  }]
}
```

K tomu `Article` (respektíve `BlogPosting`) na identifikáciu typu a metadát a `BreadcrumbList` na topickú hierarchiu. Nič exotické — over si to cez [Rich Results Test](https://search.google.com/test/rich-results) a nechaj tak. A ak riešiš eshop, mám pripravené [JSON-LD šablóny pre malý eshop](/blog/schema-org-eshop-templates/), ktoré nadväzujú na to isté.

## Čerstvosť nie je kozmetika, je to rankingový faktor

Enginy uprednostňujú nový obsah agresívnejšie než klasický Google. Analýzy zdrojov, ktoré AI cituje, ukazujú, že URL v AI odpovediach sú v priemere **výrazne mladšie** než tie v tradičných výsledkoch — rádovo o štvrtinu. Dôvod je logický: model, ktorý má odpovedať „aké je najnovšie X", si radšej zoberie článok spred pol roka než spred štyroch rokov.

Preto na kľúčové stránky nasadzujem kvartálny refresh: nové čísla, aktuálny rok v texte, doplnené odseky. A viditeľne to signalizuj — udržiavaj `dateModified` v schéme synchronizované s reálnou zmenou:

```json
{
  "@type": "BlogPosting",
  "datePublished": "2026-03-01",
  "dateModified": "2027-01-14"
}
```

Nefalšuj to. Prepísať dátum bez reálnej zmeny obsahu je krátkozraké — a v kombinácii s AI-generovaným balastom si koleduješ o problém, o ktorom píšem v [AI content vs Google E-E-A-T](/blog/ai-content-eeat/).

## Autorita: citujú ťa, keď citujú aj iní

Model si nevymýšľa dôveru — odvodzuje ju. Domény s profilmi na hodnotiacich platformách (Trustpilot, G2, Capterra) a so spomienkami na Reddite či Quore bývajú v ChatGPT citované mnohonásobne častejšie než weby bez akejkoľvek externej stopy. Nie je to preto, že by tam AI „chodila po odpoveď", ale preto, že tieto signály tvoria entitu, ktorej sa dá dôverovať.

Pre malú SK firmu z toho plynie nudná, ale pravdivá rada: **buduj reálnu prítomnosť mimo vlastného webu**. Odpovedaj v relevantných diskusiách, maj poriadny Google Business Profile, získaj zopár nezávislých zmienok. Súvisí to s tým, čo funguje pri [local SEO pre Bratislavu](/blog/local-seo-bratislava/) — entita, ktorú vie stroj rozpoznať a spárovať, je základ.

## llms.txt: pekná myšlienka, slabá realita

Určite si počul o `llms.txt` — súbor v koreni webu, ktorý má AI crawlerom naservírovať skrátený, čistý prehľad obsahu. Znie to skvele. Realita v 2026 je triezvejšia.

Adopcia na strane webov je okolo **10 %** (štúdia SE Ranking na 300-tisíc doménach), ale na strane crawlerov je to takmer nula. V jednej analýze pol miliardy AI bot návštev za 90 dní **cielilo na `llms.txt` len 408 requestov**. Google v júli 2025 oficiálne povedal, že ho nepodporuje a neplánuje, a prirovnal ho k dávno mŕtvemu keywords meta tagu. Anthropic a Perplexity naopak deklarujú, že s ním pracujú.

Môj postoj: `llms.txt` **nasaď, ak ho vieš vygenerovať automaticky** z rovnakých zdrojov ako web (pár hodín práce, nulová údržba navyše). Neinvestuj doň hodiny ručne. Je to nízkorizikový bet na budúcnosť, nie dnešný ťahúň. Minimálny zmysluplný súbor:

```markdown
# Moja firma

> Krátky opis toho, čo firma robí.

## Kľúčové stránky
- [Služby](https://example.sk/sluzby): prehľad ponuky
- [Cenník](https://example.sk/cennik): aktuálne ceny
- [Kontakt](https://example.sk/kontakt): kde nás nájdeš
```

Naopak, čo naozaj kontroluješ, je `robots.txt` — tam sa rozhoduje, či GPTBot, PerplexityBot či Google-Extended vôbec smú dnu. To si over ako prvé.

## Kde začať

AEO nie je nový magický kanál — je to disciplinovanejšia verzia toho, čo dobré SEO robilo vždy: jasná štruktúra, dôveryhodnosť, čerstvosť. Priorít je málo a sú lacné:

1. **Prepíš úvody sekcií** tak, aby odpoveď padla v prvých 40 až 60 slovách.
2. **Doplň `FAQPage`, `Article` a `BreadcrumbList` schemu** a over cez Rich Results Test.
3. **Zaveď kvartálny refresh** kľúčových stránok a poctivo aktualizuj `dateModified`.
4. **Buduj externú stopu** — recenzie, zmienky, GBP.
5. `llms.txt` len ak je zadarmo automaticky.

To je celé. Žiadny nástroj za 500 € mesačne ti tieto základy nenahradí — a keď ich máš, ostatné je už len ladenie. Kto rád v štruktúrach, pozri aj [internal linking cez topic clusters](/blog/internal-linking-topic-clusters/); AI enginom pomáha topická previazanosť rovnako ako čitateľovi.
