---
title: "AI prvý draft + ľudský review: translate workflow ktorý funguje"
date: 2025-12-03
read: 7
tags: ["AI", "Process"]
excerpt: "Z 8 hodín na 2 hodiny per article s lepšou konzistenciou. Tool stack a workflow pre web copy translate SK → EN/DE bez stratenej kvality."
featured: false
---

Klient (B2B SaaS, slovenská firma s expanziou do DACH) mal 60 stránok webu v SK a potrebovali EN + DE. Translation agency: €0.12/slovo × ~25 000 slov × 2 jazyky = €6000 a 6 týždňov. Postavili sme AI-first workflow, ktorý to spravil za €180 a 9 dní s porovnateľnou kvalitou na review.

Tu je celý stack a process. Nie "AI nahradí prekladateľov" — skôr "AI urobí 80 % roboty, človek dorobí kritických 20 %".

## Tool stack

### Layer 1: Prvý draft

**Voľba A: DeepL Pro API** (€8.99/mes Starter, €20.49 Advanced)
- Konzistentne dobrá kvalita pre EN/DE z SK
- Glossary support (terminology lock)
- Formal/informal toggle
- Slabšie pre marketing copy s tonalitou — "korporátnejšie"

**Voľba B: Claude 3.5 Sonnet API** (~$3/1M input tokens)
- Lepší pre nuanced marketing copy, idiomy, tonalitu
- Custom system prompt s glossary inline
- Pomalší (sekundy/page), ale paralelizovateľné
- Cena: 25k slov × 2 jazyky ≈ $1 total

V praxi pre tento projekt sme použili **Claude pre marketing pages** (homepage, landing pages, hero copy) a **DeepL pre dokumentaci a feature pages** (technické, štruktúrované, kde DeepL boduje konzistenciou).

### Layer 2: Glossary

JSON file s brand terms, product names, idiomy, prefered translations:

```json
{
    "brand": {
        "Modulario": "Modulario",
        "Spotreba app": "Spotreba app"
    },
    "terms": {
        "sk": {
            "odberné miesto": {
                "en": "metering point",
                "de": "Zählpunkt"
            },
            "spotreba": {
                "en": "consumption",
                "de": "Verbrauch"
            },
            "odpočet": {
                "en": "meter reading",
                "de": "Zählerablesung"
            }
        }
    },
    "do_not_translate": ["DevOps", "API", "CI/CD", "Bratislava"],
    "tone": {
        "en": "Direct, technical, no corporate fluff. Address as 'you'.",
        "de": "Sachlich, technisch, mit 'Sie' ansprechen."
    }
}
```

Pri Claude prompte ho injectneš do system message:

```ts
const systemPrompt = `
Si profesionálny prekladateľ SK → ${targetLang}.

Glossary (vždy použi tieto preklady):
${JSON.stringify(glossary.terms.sk, null, 2)}

Do not translate: ${glossary.do_not_translate.join(', ')}

Tone: ${glossary.tone[targetLang]}

Vráť LEN preložený text. Žiadny komentár, žiadne "Here is the translation:".
Zachovaj markdown formátovanie.
`;
```

### Layer 3: CMS integrácia

Pre WordPress klientov používam custom plugin, ktorý pridá tlačidlo "Translate to EN/DE" na post edit screen. Output ide do parallel post (cez WPML alebo Polylang).

Pre Astro/Next.js (markdown content) custom skript:

```ts
// scripts/translate-articles.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import matter from 'gray-matter';

const anthropic = new Anthropic();
const SOURCE_DIR = 'src/content/articles/sk';
const TARGET_DIR = 'src/content/articles/en';

async function translateFile(filename: string) {
    const sourcePath = path.join(SOURCE_DIR, filename);
    const targetPath = path.join(TARGET_DIR, filename);

    // skip if already translated
    try {
        await fs.access(targetPath);
        console.log(`Skip ${filename} (exists)`);
        return;
    } catch {}

    const raw = await fs.readFile(sourcePath, 'utf-8');
    const { data: frontmatter, content } = matter(raw);

    const res = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: 'user', content }],
    });

    const translatedContent = res.content[0].text;
    const translatedTitle = await translateString(frontmatter.title);
    const translatedExcerpt = await translateString(frontmatter.excerpt);

    const output = matter.stringify(translatedContent, {
        ...frontmatter,
        title: translatedTitle,
        excerpt: translatedExcerpt,
    });

    await fs.writeFile(targetPath, output);
    console.log(`Translated ${filename}`);
}

const files = await fs.readdir(SOURCE_DIR);
for (const f of files) {
    if (f.endsWith('.md')) await translateFile(f);
}
```

## Workflow

1. **Klient píše SK** ako jediná source of truth
2. **Skript prebehne v noci** (GitHub Action cron) — preloží nové/zmenené stránky
3. **Output ide do Git PR** — `[AI Translate] Update EN+DE translations`
4. **Reviewer (native speaker freelancer, ~€20/h)** prejde diff, spraví edits, merge

Ten reviewer step je nezbytný. Nie pre "AI prekladá zle" dôvod — kvalita je často OK — ale pre tonalitu, idiomatic flow a brand consistency. Native speaker za 30 min checkne to, čo by od nuly písal 4 hodiny.

## Quality measurement

BLEU score v 2026 nestačí. Použi manual review checklist:

- [ ] **Terminológia** — brand a product mená podľa glossary
- [ ] **Tonalita** — formal/informal podľa target lokality
- [ ] **Idiomatic flow** — žiadne kalky ("I made the homework")
- [ ] **Cultural fit** — meny, dátumy, mená miest
- [ ] **CTA konkrétnosť** — "Vyskúšaj zadarmo" → "Try for free" vs "Get started" (test)
- [ ] **SEO terms** — keyword research v target language, nie literal preklad

## Reálne čísla z projektu

| | Pred (agency) | Po (AI + review) |
|---|---|---|
| **Per article** | 8 h prekladateľa | 1.5 h AI + 30 min review |
| **Cost** | €240 (2 jazyky) | €15 + €0.30 API |
| **Lead time** | 2-3 dni | 1 deň |
| **Konzistencia** | Stredná (3 freelanceri) | Vysoká (1 glossary) |
| **Update flow** | Re-quote → 1 týž | Auto na push |

Celý projekt: €180 vs €6000. To nie je preklep.

## Kde AI workflow zlyháva

- **Právne/medical texty** — ostávame pri certifikovaných prekladateľoch
- **Marketingové headlines s kreatívnym word-play** — AI urobí preklad, nie creative adaptation
- **Veľmi malé jazyky** — pre HU/RO/SR Claude funguje, pre kombinácie typu SK→FI očakávaj viac review
- **Klient ktorý chce "exact match" feeling** — AI preferred má často iný štýl, čo niektorých rozhodí

## TL;DR

AI translate prvý draft + ľudský review je v 2026 default workflow pre web copy. 8 → 2 hodiny per article, 30× lacnejšie, lepšia konzistencia (jeden glossary). Daj si pozor na: glossary disciplinu, native speaker review, NIE auto-publish. Pre legal/medical zostaň pri agency.
