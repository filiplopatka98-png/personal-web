---
title: "Image alt text z AI: úspora hodín, riziká pre SEO"
date: 2026-03-14
read: 7
tags: ["AI", "SEO", "Accessibility"]
excerpt: "Test troch vision modelov na 200 produktových fotkách: GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Flash. Kvalita, cena a SEO riziká, ktoré nesmieš prehliadnuť."
featured: false
---

Klient (módny eshop, ~3500 produktov) prišiel s problémom: 60 % obrázkov má prázdny `alt` atribút, zvyšok typu `IMG_4521.jpg`. Alt text je jedna z tých vecí, kde sa [prístupnosť a SEO prekrývajú](/blog/wcag-aa-80-20/) — dobrý popis pomáha aj čítaču obrazovky, aj vyhľadávaču. Manuálne písanie alt textov pre všetky = ~50 hodín práce. AI vision modely to spravia za víkend a $35.

Spustil som testovacie kolo na 200 reprezentatívnych fotkách (oblečenie, obuv, doplnky, lifestylové zábery) a porovnal tri modely. Tu sú výsledky a praktické závery — vrátane SEO rizík, ktoré nesmieš ignorovať.

## Nastavenie testu

200 produktových fotiek, ku každej ručne napísaný „ground truth" alt text od copywritera. Každý model dostal rovnaký prompt:

```
Generate alt text for an e-commerce product image.
Requirements:
- 50-125 characters
- Describe what is visible (color, type, style, material if obvious)
- No "Image of..." or "Picture of..." prefix
- No brand names unless clearly readable in image
- Accessibility-friendly (useful for screen reader users)

Return JSON: {"alt": "..."}
```

Modely:
- **GPT-4o** (`gpt-4o-2024-08-06`) — vizuálny štandard
- **Claude 3.5 Sonnet** (`claude-3-5-sonnet-20241022`) — verzia s vision od októbra 2024
- **Gemini 2.0 Flash** (`gemini-2.0-flash`) — najlacnejší, najrýchlejší

## Metodika hodnotenia

Ručný review každého výstupu na štyri kritériá (skóre 1 – 5):

1. **Presnosť** — popisuje skutočný obsah?
2. **Dĺžka** — trafí sa do rozpätia 50 – 125 znakov?
3. **Keyword stuffing** — vyhne sa formuláciám typu „best red dress for women shop online"?
4. **Prístupnosť** — je použiteľný pre čítač obrazovky (kontext, nielen vizuál)?

## Výsledky

| Model | Presnosť | Dĺžka OK | Bez stuffingu | Prístupnosť | Cena/obr. | Latencia |
|---|---|---|---|---|---|---|
| **Claude 3.5 Sonnet** | 4,6/5 | 92 % | 100 % | 4,4/5 | $0,012 | 1,8 s |
| **GPT-4o** | 4,3/5 | 78 % | 95 % | 4,1/5 | $0,014 | 1,4 s |
| **Gemini 2.0 Flash** | 3,7/5 | 85 % | 100 % | 3,5/5 | $0,002 | 0,6 s |

### Claude 3.5 Sonnet: víťaz v presnosti

- najlepšia presnosť popisu (typ produktu, materiál, farba)
- občas príliš stručný (pod 50 znakov), zvyčajne cca 70 – 90 znakov
- nikdy si nevymýšľa značky (✓)
- občas vynechá kontext („model má na sebe..." verzus len popis produktu)

Príklad výstupu: `Tmavomodrý vlnený sveter s véčkovým výstrihom, ležérny strih`

### GPT-4o: rýchly, ale halucinuje

- najrýchlejší v tomto teste z modelov „kvalitnej vrstvy"
- občas pripísal **značku podľa nepriamych indícií** („Nike running shoes", hoci šlo o neznačkovú obuv)
- 22 % výstupov malo cez 125 znakov — pridáva nadbytočné detaily
- pri piatich fotkách sa „snažil byť poetický": „Elegant black dress that exudes sophistication" — nepoužiteľné

Príklad výstupu: `Nike-style black running sneaker with white sole and laces, men's athletic footwear`
(realita: bola to neznačková obuv)

### Gemini 2.0 Flash: cenový kráľ s kompromisom v kvalite

- 6× lacnejší než Claude/GPT
- 3× rýchlejší
- presnosť klesla — popisy sú generické: „Black shoe with white sole" namiesto „Bežecká pánska obuv s tlmením"
- najslabšie skóre v prístupnosti — chýba kontext (o aký typ produktu ide)

Pre **hromadné dávky** (10 000+ obrázkov), kde tak či tak robíš review, je pomer ceny a výkonu u Gemini lákavý. Pre **produkčné publikovanie** siahni po Claude.

## SEO riziká

Tu je miesto, kde to môže ublížiť. AI alt text **nikdy nepublikuj automaticky** bez dávkového review.

**Riziko 1: Halucinácia značiek** (videné hlavne u GPT-4o)
- Google vníma alt text ako signal o obsahu stránky
- falošná zmienka o značke = potenciálne nesprávne zaradenie
- najhorší prípad: problém s ochrannou známkou, ak ti to pri neznačkovom produkte napíše „Adidas"

**Riziko 2: Keyword stuffing**
- aj keď to v prompte zakážeš, niektoré modely občas pridajú „buy online" / „best price"
- ručný review to odchytí

**Riziko 3: Generický popis = žiadny SEO prínos**
- „Black shoe" je z hľadiska prístupnosti OK, ale pre SEO bezcenné
- „Bežecká pánska obuv s tlmením" má kľúčové slová relevantné pre produkt aj kontext pre prístupnosť
- alt text je len jeden riadok v širšom obraze — pozri [technické SEO checklist, ktorý ozaj merateľne pomáha](/blog/seo-checklist-co-pomaha/)

**Riziko 4: Duplicitné alt texty na podobných produktoch**
- 5 farebných variantov toho istého trička → 5× rovnaký alt text
- pridaj do promptu variant (farbu) a kontext SKU

## Praktický workflow

```ts
// scripts/generate-alt-texts.ts
import Anthropic from '@anthropic-ai/sdk';
import fs from 'node:fs/promises';

const anthropic = new Anthropic();

async function altForImage(imagePath: string, productContext: { name: string; color: string; sku: string }) {
    const imageData = await fs.readFile(imagePath);
    const base64 = imageData.toString('base64');

    const res = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        messages: [{
            role: 'user',
            content: [
                {
                    type: 'image',
                    source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
                },
                {
                    type: 'text',
                    text: `Generate alt text for this product image.
Context: Product "${productContext.name}", color: ${productContext.color}, SKU: ${productContext.sku}.

Requirements:
- 50-125 characters in Slovak
- Include product type, color, material/style if visible
- No brand names, no "buy online" phrases
- Useful for screen reader users

Return JSON: {"alt": "..."}`,
                },
            ],
        }],
    });

    const text = res.content[0].text;
    const json = JSON.parse(text);
    return json.alt;
}
```

Prečo prompt v slovenčine? Klientov eshop je v SK → alt text v SK. Claude to zvláda bez problémov.

## Fázy review

1. **Vygeneruj** všetkých 3500 alt textov (~$45 cez Claude, ~3 hodiny dávkovania)
2. **Automaticky označ** — výstupy obsahujúce slová „Nike|Adidas|Apple|značka_X|...", dlhšie ako 125 znakov, kratšie ako 30 znakov
3. **Ručne skontroluj označenú podmnožinu** (zvyčajne ~5 – 10 %) — 2 hodiny práce
4. **Namátkovo skontroluj 50 náhodných** z neoznačených — 30 minút
5. **Nasaď** cez WP REST API alebo SQL update

Spolu: ~6 hodín ľudského času oproti 50 hodinám ručného písania. Cena: ~$45 za API + ~6 h × €25/h = ~$200 oproti €1250 manuálne.

## TL;DR

Claude 3.5 Sonnet je pre mňa v roku 2026 najlepší vision model na generovanie alt textov — presnosť, stručnosť a žiadne halucinácie značiek. GPT-4o je rýchlejší, ale občas si vymýšľa. Gemini 2.0 Flash je 6× lacnejší pri ~80 % kvalite — dobrý na dávky s následným review. **Nikdy nepublikuj automaticky.** Vždy označ podozrivé výstupy a rob namátkové kontroly.

Súvisiace: [AI content vs Google E-E-A-T: čo ide a čo nie](/blog/ai-content-eeat/) · [WCAG AA na malom webe: 80 % efekt za 20 % práce](/blog/wcag-aa-80-20/) · [Technické SEO checklist, ktorý ozaj merateľne pomáha](/blog/seo-checklist-co-pomaha/)
