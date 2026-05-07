---
title: "AI chatbot s RAG na 200-stránkovom webe: ako to nepokaziť"
date: 2026-01-22
read: 8
tags: ["AI"]
excerpt: "Štyri najčastejšie failures pri RAG chatbotoch — bad chunking, chýbajúce citácie, žiadny fallback, žiadny eval. A ako ich riešiť."
featured: false
---

Tento rok som videl pristáť tri RAG chatboty na slovenských weboch. Dva z nich boli demo-able, ale produkčne nepoužiteľné. Halucinácie, citácie ukazujúce na neexistujúce stránky, "neviem" odpoveď absentovala. Tretí (čo som ladil ja) má retention 28 % po prvej query — biznis hodnota merateľná.

Tu sú štyri failure modes, ktoré som videl, a ako ich predísť.

## Failure 1: Bad chunking

Najčastejší fail. RAG kvalita stojí a padá na tom, **čo dostane LLM ako kontext**. Ak chunky narežeš zle, semantic search ti vráti irrelevantné kúsky.

**Čo nerobiť:**
- fixed-size chunking po znakoch (`text.slice(0, 500)`) — orežeš v polovici vety
- celý článok ako jeden chunk — embedding stratí granularitu, retrieval vráti všetko alebo nič
- bezohľad na štruktúru — jeden chunk obsahuje koniec sekcie A a začiatok sekcie B

**Čo robiť:**

```ts
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,         // ~500-600 tokens
    chunkOverlap: 100,
    separators: ['\n\n', '\n', '. ', ' ', ''], // try paragraph first
});

const chunks = await splitter.splitText(articleBody);
```

Pre štruktúrované dokumenty (markdown, HTML) použi `MarkdownTextSplitter` — rešpektuje nadpisy. Pre kód `RecursiveCharacterTextSplitter.fromLanguage('typescript', ...)`.

**Sweet spot pre slovenský/český web obsah:** 500–800 tokens chunk size, 50–100 overlap. Otestuj na 20 reálnych otázkach a meraj recall@5.

## Failure 2: Chýbajúce citácie

Chatbot povie "Naša politika reklamácií je 30 dní." Používateľ klikne... kam? Niekde. Stratí dôveru za sekundu. Aj keď je odpoveď správna.

**Riešenie:** každá faktická veta má citáciu na zdrojovú stránku. Implementácia:

```ts
const systemPrompt = `
Si asistent pre web XYZ. Odpovedaj LEN na základe poskytnutých sources.
Každú faktickú vetu označ citáciou v tvare [N], kde N je číslo zdroja.
Ak v sources niet odpoveď, povedz "V dostupných dokumentoch som odpoveď nenašiel."
NIKDY si nevymýšľaj.

Sources:
${sources.map((s, i) => `[${i + 1}] ${s.title} (${s.url})\n${s.content}`).join('\n\n---\n\n')}
`;
```

Frontend potom regex `/\[(\d+)\]/g` nahradí číslo linkom na source URL. Pre Vercel AI SDK máš `experimental_attachments` API ktoré to riadi natívne.

UX detail, ktorý mení všetko: zobraz **zdrojové karty pod odpoveďou** s thumbnailom + titulom. Používateľ vidí "OK, povedal to z týchto 3 stránok" a môže overiť. Trust score skáče.

## Failure 3: Žiadny fallback

LLM keď nemá kontext, halucinuje. RAG ti dáva ilúziu, že máš kontext — ale ak vector search nevráti nič relevantné (alebo vráti len nesúvisiaci shum), LLM aj tak niečo "odpovie".

**Riešenie 1:** similarity threshold. Ak top result má similarity < 0.5, povedz to.

```ts
const { data: chunks } = await supabase.rpc('search_chunks', {
    query_embedding,
    match_count: 5,
    similarity_threshold: 0.55,  // empiricky tuned
});

if (chunks.length === 0) {
    return {
        answer: "Na túto otázku v našej dokumentácii odpoveď nenájdem. Skús kontaktovať support na hello@xyz.sk alebo preformulovať otázku.",
        sources: [],
    };
}
```

**Riešenie 2:** explicitný "I don't know" v system prompte. Claude / GPT-4o sú v tom solídne, ak im to dovolíš (default tendency je "byť nápomocný" = halucinovať).

**Riešenie 3:** out-of-scope detection. Ak používateľ pýta niečo mimo doménu webu ("Aké je počasie v Bratislave?"), nepúšťaj to do RAG. Pre-filter intent classifier (lacný Haiku call): "Je táto otázka o produktoch/službách XYZ? yes/no".

## Failure 4: Žiadny eval framework

Spustil si chatbot v pondelok, fungoval. V piatok pribudli nové dokumenty, indexácia bežala, niečo sa zmenilo v kvalite — a ty to nevidíš. Žiadne metriky, žiadne dashboardy.

**Minimum viable eval:** 50 ground-truth Q&A párov, ktoré chatbot musí vedieť. Po každom deploy / re-index zbeháš a sleduješ skóre.

```ts
// eval.ts
const evalSet = [
    {
        q: "Aká je doba reklamácie?",
        expectedAnswer: "30 dní",
        expectedSources: ["/reklamacny-poriadok"],
    },
    // ... 49 ďalších
];

async function runEval() {
    let pass = 0;
    let citationPass = 0;
    for (const item of evalSet) {
        const res = await chatbot(item.q);
        if (res.answer.toLowerCase().includes(item.expectedAnswer.toLowerCase())) {
            pass++;
        }
        if (res.sources.some(s => item.expectedSources.some(es => s.url.includes(es)))) {
            citationPass++;
        }
    }
    console.log(`Answer recall: ${pass}/${evalSet.length}`);
    console.log(`Citation recall: ${citationPass}/${evalSet.length}`);
}
```

V CI to spusti pri každom merge do `main`. Threshold: pod 90 % = blok. Frameworky ktoré toto robia za teba: [Ragas](https://github.com/explodinggradients/ragas), [TruLens](https://www.trulens.org/), [DeepEval](https://github.com/confident-ai/deepeval).

## Bonus: hybrid search

Čisto semantic search prehliada exact match. Používateľ pýta "produkt 4521-X", semantic search vráti "podobné produkty"... ale nie ten konkrétny SKU. Riešenie: hybrid search (semantic + keyword BM25).

V Postgres cez `tsvector` + pgvector kombinácia, alebo cez Typesense / Weaviate ktoré majú hybrid out-of-box. Re-rank kombinuje skóre.

## Stack pre 2026

| Use case | Tool |
|---|---|
| Chunking | `RecursiveCharacterTextSplitter` (LangChain) |
| Embeddings | OpenAI `text-embedding-3-small` |
| Vector DB | pgvector (do 100k chunks) alebo Pinecone (vyššie) |
| LLM | Claude 3.5 Sonnet (kvalita) alebo GPT-4o-mini (cena) |
| Streaming UI | Vercel AI SDK |
| Eval | Ragas alebo custom 50 Q&A set |

## TL;DR

RAG chatbot ktorý funguje = dobre nachunkovaný, citácie pri každej vete, "neviem" keď fakt nevie, eval set v CI. Bez týchto štyroch vecí dostaneš demo. So všetkými štyrmi dostaneš nástroj, ktorý ľuďia reálne používajú a šetrí 30+ % support ticketov.
