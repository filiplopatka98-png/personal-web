---
title: "AI-Generated Image Alt Text: Hours Saved, SEO Risks Ahead"
date: 2026-03-14
read: 7
tags: ["AI", "SEO", "Accessibility"]
excerpt: "Testing three vision models on 200 product photos: GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Flash. Quality, cost, and the SEO risks you can't afford to overlook."
featured: false
---

A client (a fashion store, ~3,500 products) came to me with a problem: 60% of their images had an empty `alt` attribute, and the rest were the `IMG_4521.jpg` variety. Alt text is one of those things where [accessibility and SEO overlap](/en/blog/wcag-aa-80-20/) — a good description helps both the screen reader and the search engine. Writing alt text for all of them by hand = roughly 50 hours of work. AI vision models can do it over a weekend for $35.

I ran a test round on 200 representative photos (clothing, footwear, accessories, lifestyle shots) and compared three models. Here are the results and the practical takeaways — including the SEO risks you can't ignore.

## Test setup

200 product photos, each with a hand-written "ground truth" alt text from a copywriter. Every model got the same prompt:

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

Models:
- **GPT-4o** (`gpt-4o-2024-08-06`) — the visual benchmark
- **Claude 3.5 Sonnet** (`claude-3-5-sonnet-20241022`) — the vision-capable version from October 2024
- **Gemini 2.0 Flash** (`gemini-2.0-flash`) — the cheapest and fastest

## Scoring methodology

A manual review of every output against four criteria (scored 1–5):

1. **Accuracy** — does it describe the actual content?
2. **Length** — does it land in the 50–125 character range?
3. **Keyword stuffing** — does it avoid phrasings like "best red dress for women shop online"?
4. **Accessibility** — is it usable for a screen reader (context, not just visuals)?

## Results

| Model | Accuracy | Length OK | No stuffing | Accessibility | Cost/img | Latency |
|---|---|---|---|---|---|---|
| **Claude 3.5 Sonnet** | 4.6/5 | 92% | 100% | 4.4/5 | $0.012 | 1.8s |
| **GPT-4o** | 4.3/5 | 78% | 95% | 4.1/5 | $0.014 | 1.4s |
| **Gemini 2.0 Flash** | 3.7/5 | 85% | 100% | 3.5/5 | $0.002 | 0.6s |

### Claude 3.5 Sonnet: accuracy winner

- best description accuracy (product type, material, color)
- occasionally too terse (under 50 characters), usually around 70–90
- never invents brands (✓)
- sometimes drops context ("the model is wearing..." versus just describing the product)

Sample output: `Navy blue wool sweater with a V-neck, casual fit`

### GPT-4o: fast, but it hallucinates

- fastest of the "quality-tier" models in this test
- occasionally **assigned a brand based on indirect cues** ("Nike running shoes," when it was actually unbranded footwear)
- 22% of outputs ran over 125 characters — it adds redundant detail
- on five photos it "tried to get poetic": "Elegant black dress that exudes sophistication" — unusable

Sample output: `Nike-style black running sneaker with white sole and laces, men's athletic footwear`
(reality: it was unbranded footwear)

### Gemini 2.0 Flash: the price king with a quality tradeoff

- 6× cheaper than Claude/GPT
- 3× faster
- accuracy dropped — the descriptions are generic: "Black shoe with white sole" instead of "Cushioned men's running shoe"
- weakest accessibility score — it misses context (what kind of product this actually is)

For **bulk batches** (10,000+ images) where you're going to review everything anyway, Gemini's price-to-performance ratio is tempting. For **production publishing**, reach for Claude.

## SEO risks

This is where it can hurt you. **Never publish AI alt text automatically** without a batch review.

**Risk 1: Brand hallucination** (seen mostly with GPT-4o)
- Google treats alt text as a signal about the page content
- a false brand mention = potentially wrong categorization
- worst case: a trademark problem if it writes "Adidas" on an unbranded product

**Risk 2: Keyword stuffing**
- even when you forbid it in the prompt, some models occasionally sneak in "buy online" / "best price"
- a manual review catches this

**Risk 3: Generic descriptions = zero SEO value**
- "Black shoe" is fine for accessibility, but worthless for SEO
- "Cushioned men's running shoe" carries keywords relevant to the product plus context for accessibility
- alt text is just one line in a much bigger picture — see the [technical SEO checklist that actually moves the needle](/en/blog/seo-checklist-co-pomaha/)

**Risk 4: Duplicate alt text on similar products**
- 5 color variants of the same t-shirt → 5× the same alt text
- add the variant (color) and SKU context to the prompt

## Practical workflow

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

Why a Slovak-language prompt? The client's store is in Slovak → the alt text needs to be in Slovak. Claude handles it without any trouble.

## Review phases

1. **Generate** all 3,500 alt texts (~$45 via Claude, ~3 hours of batching)
2. **Auto-flag** — outputs containing words like "Nike|Adidas|Apple|brand_X|...", longer than 125 characters, shorter than 30 characters
3. **Manually check the flagged subset** (usually ~5–10%) — 2 hours of work
4. **Spot-check 50 random ones** from the unflagged pile — 30 minutes
5. **Deploy** via the WP REST API or a SQL update

Total: ~6 hours of human time versus 50 hours of writing by hand. Cost: ~$45 in API + ~6h × €25/h = ~$200 versus €1,250 doing it manually.

## TL;DR

Claude 3.5 Sonnet is, for me, the best vision model for generating alt text in 2026 — accuracy, brevity, and no brand hallucinations. GPT-4o is faster but occasionally makes things up. Gemini 2.0 Flash is 6× cheaper at ~80% of the quality — good for batches with a follow-up review. **Never publish automatically.** Always flag suspicious outputs and run spot-checks.

Related: [AI content vs Google E-E-A-T: what works and what doesn't](/en/blog/ai-content-eeat/) · [WCAG AA on a small site: 80% of the effect for 20% of the work](/en/blog/wcag-aa-80-20/) · [The technical SEO checklist that actually moves the needle](/en/blog/seo-checklist-co-pomaha/)
