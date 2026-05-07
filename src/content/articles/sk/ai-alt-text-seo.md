---
title: "Image alt text z AI: úspora hodín, riziká pre SEO"
date: 2026-03-14
read: 7
tags: ["AI", "SEO", "Accessibility"]
excerpt: "Test 3 vision modelov na 200 produktových fotkách: GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Flash. Quality, cena, SEO riziká."
featured: false
---

Klient (móda eshop, ~3500 produktov) prišiel s problémom: 60 % obrázkov má prázdny `alt` atribút, ostatné typu `IMG_4521.jpg`. Manuálne písanie alt textov pre všetky = ~50 hodín práce. AI vision modely to spravia za víkend a $35.

Spustil som testovacie kolo na 200 reprezentatívnych fotkách (oblečenie, obuv, doplnky, lifestyle shoty) a porovnal tri modely. Tu sú výsledky a praktické závery — vrátane SEO rizík, ktoré nesmieš ignorovať.

## Test setup

200 produktových fotiek, manually labeled "ground truth" alt text napísaný copywriterom. Každý model dostal rovnaký prompt:

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
- **GPT-4o** (`gpt-4o-2024-08-06`) — vision standard
- **Claude 3.5 Sonnet** (`claude-3-5-sonnet-20241022`) — vision od Oct 2024
- **Gemini 2.0 Flash** (`gemini-2.0-flash`) — najlacnejší, najrýchlejší

## Scoring metodika

Manuálny review každého výstupu na 4 kritériá (1-5 skóre):

1. **Accuracy** — popisuje skutočný obsah?
2. **Length** — v sweet spot 50-125 chars?
3. **Keyword stuffing** — vyhne sa "best red dress for women shop online"?
4. **Accessibility** — useful pre screen reader (kontext, nie len visual)?

## Výsledky

| Model | Accuracy | Length OK | No stuffing | Accessibility | Cena/img | Latency |
|---|---|---|---|---|---|---|
| **Claude 3.5 Sonnet** | 4.6/5 | 92 % | 100 % | 4.4/5 | $0.012 | 1.8s |
| **GPT-4o** | 4.3/5 | 78 % | 95 % | 4.1/5 | $0.014 | 1.4s |
| **Gemini 2.0 Flash** | 3.7/5 | 85 % | 100 % | 3.5/5 | $0.002 | 0.6s |

### Claude 3.5 Sonnet: víťaz na accuracy

- najlepšia presnosť popisu (typ produktu, materiál, farba)
- občas príliš stručný (pod 50 chars), default cca 70-90 chars
- nikdy nehallucinuje brand mená (✓)
- občas vynechá kontext ("model nesie..." vs len popis produktu)

Príklad output: `Tmavomodrý vlnený sveter s véčkovým výstrihom, ležérny strih`

### GPT-4o: rýchly, ale halucinuje

- najrýchlejší v tomto teste z modelov "kvalitnej vrstvy"
- občas pripísal **brand name z context cues** ("Nike running shoes" keď to bola generic shoe)
- 22 % výstupov bolo cez 125 chars — pridáva detaily, ktoré sú nadbytočné
- pri 5 fotkách sa "snažil byť poetický": "Elegant black dress that exudes sophistication" — useless

Príklad output: `Nike-style black running sneaker with white sole and laces, men's athletic footwear`
(realita: bola to neznáčková obuv)

### Gemini 2.0 Flash: cenový kráľ s kvalitatívnym kompromisom

- 6× lacnejší než Claude/GPT
- 3× rýchlejší
- accuracy klesla — popisy generické: "Black shoe with white sole" namiesto "Bežecká pánska obuv s tlmením"
- accessibility skóre najslabšie — chýba kontext (čo to je za typ produktu)

Pre **bulk batch** (10 000+ obrázkov) kde robíš review aj tak, je cena/perf pomer Gemini lákavý. Pre **production publishing** Claude.

## SEO riziká

Tu je miesto, kde to môže ublížiť. AI alt text **nikdy nepublikuj automaticky** bez review batch.

**Riziko 1: Halucinácia brand names** (videno hlavne u GPT-4o)
- Google vníma alt text ako signal o obsahu stránky
- Falošné brand mention = potenciálne miscategorization
- Worst case: trademark issue ak ti to napíše "Adidas" pri tvojom no-name produkte

**Riziko 2: Keyword stuffing**
- Aj keď v prompte zakážeš, niektoré modely občas pridajú "buy online" / "best price"
- Manual review odchytí

**Riziko 3: Generic = no SEO benefit**
- "Black shoe" je accessibility OK ale SEO bezhodnotné
- "Bežecká pánska obuv s tlmením" má product-relevant keywords + accessibility kontext

**Riziko 4: Duplicitné alt texty na podobných produktoch**
- 5 farebných variantov tej istej tričky → 5x rovnaký alt text
- Pridaj do promptu variantu (farbu) a SKU kontext

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

Prečo Slovak prompt? Klient eshop v SK → alt text v SK. Claude to zvláda bez problémov.

## Review fázy

1. **Generate** všetkých 3500 alt textov (~$45 cez Claude, ~3 hodiny batch)
2. **Auto-flag** — výstupy obsahujúce slová "Nike|Adidas|Apple|brand_X|...", > 125 chars, < 30 chars
3. **Manual review flagged subset** (~5-10 % obvykle) — 2 hodiny práce
4. **Spot-check 50 random** z neflagovaných — 30 min
5. **Deploy** cez WP REST API alebo SQL update

Total: ~6 hodín human time vs 50 hodín na ručné písanie. Cena: ~$45 API + ~6 h × €25/h = ~$200 vs €1250 manuálne.

## TL;DR

Claude 3.5 Sonnet je v 2026 najlepší vision model pre alt text generation — accuracy + brevity + bez halucinácií brand mien. GPT-4o je rýchlejší ale občas si vymýšľa. Gemini 2.0 Flash je 6× lacnejší pri ~80 % kvalite — dobrý pre batch s následným review. **Nikdy auto-publish.** Vždy flag suspicious + spot-check.
