---
title: "Embeddings pre interný knowledge base: pgvector + Supabase"
date: 2026-02-18
read: 9
tags: ["AI", "DevOps"]
excerpt: "Semantic search nad firemnou Notion/Confluence bázou. Postgres + pgvector + OpenAI embeddings. Pre 10 000 dokumentov vychádza $7/mes celkom."
featured: true
---

Klient (B2B SaaS, ~40 ľudí) prišiel s otázkou: "Máme Confluence s 8 000 stránkami, nikto nič nenájde. Notion search je ako WordPress 2008." Pýtal sa na Glean ($30/user/mes = $1200/mes). Postavili sme to za víkend za $7/mes.

Stack: **Supabase** (Postgres + pgvector extension), **OpenAI text-embedding-3-small** ($0.02/1M tokens), **Next.js** search UI s edge function. Odporúčam ako baseline pre akýkoľvek interný knowledge base do ~50k dokumentov.

## Architektúra

```
[Confluence/Notion API] → [Ingestion job] → [Postgres + pgvector]
                                ↑                    ↓
                         [OpenAI embeddings]   [Next.js search UI]
                                                     ↓
                                          [Claude re-rank top 20→5]
```

Ingestion beží denne (cron), search je real-time. Každý dokument je rozdelený na chunks (500 tokens window, 50 token overlap), každý chunk má embedding.

## SQL schema

Najprv enable extension a vytvor tabuľky:

```sql
create extension if not exists vector;

create table documents (
    id bigserial primary key,
    source text not null,           -- 'confluence' | 'notion'
    source_id text not null,
    title text not null,
    url text,
    updated_at timestamptz not null,
    unique(source, source_id)
);

create table chunks (
    id bigserial primary key,
    document_id bigint references documents(id) on delete cascade,
    chunk_index int not null,
    content text not null,
    token_count int not null,
    embedding vector(1536) not null  -- text-embedding-3-small dim
);

-- HNSW index pre rýchly approximate nearest neighbor search
create index on chunks using hnsw (embedding vector_cosine_ops)
    with (m = 16, ef_construction = 64);

create index on chunks (document_id);
```

`vector(1536)` je dimenzia OpenAI `text-embedding-3-small`. HNSW index je rýchlejší než IVFFlat pre náš size, default parametry sú OK.

## Ingestion: chunking + embed

```ts
// scripts/ingest.ts
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { encoding_for_model } from 'tiktoken';

const openai = new OpenAI();
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const enc = encoding_for_model('text-embedding-3-small');

function chunkText(text: string, maxTokens = 500, overlap = 50): string[] {
    const tokens = enc.encode(text);
    const chunks: string[] = [];
    for (let i = 0; i < tokens.length; i += maxTokens - overlap) {
        const slice = tokens.slice(i, i + maxTokens);
        chunks.push(enc.decode(slice));
    }
    return chunks;
}

async function ingestDocument(doc: { id: string; title: string; body: string; url: string }) {
    const { data: dbDoc } = await supabase
        .from('documents')
        .upsert({
            source: 'confluence',
            source_id: doc.id,
            title: doc.title,
            url: doc.url,
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    // delete staré chunks
    await supabase.from('chunks').delete().eq('document_id', dbDoc.id);

    const chunks = chunkText(`${doc.title}\n\n${doc.body}`);

    // batch embeddings (OpenAI accepts up to 2048 inputs per request)
    const { data: embeddings } = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunks,
    });

    const rows = chunks.map((content, i) => ({
        document_id: dbDoc.id,
        chunk_index: i,
        content,
        token_count: enc.encode(content).length,
        embedding: embeddings[i].embedding,
    }));

    await supabase.from('chunks').insert(rows);
}
```

Pri 10k dokumentoch s priemerne 3 chunks = 30k embeddings. Cena: 30k × ~600 tokens × $0.02/1M = **$0.36** jednorázovo. Re-index každý týždeň = $0.36/týždeň.

## Search query

```sql
-- Funkcia v Postgres
create or replace function search_chunks(
    query_embedding vector(1536),
    match_count int default 20,
    similarity_threshold float default 0.5
)
returns table (
    chunk_id bigint,
    document_id bigint,
    title text,
    url text,
    content text,
    similarity float
)
language sql
as $$
    select
        c.id as chunk_id,
        c.document_id,
        d.title,
        d.url,
        c.content,
        1 - (c.embedding <=> query_embedding) as similarity
    from chunks c
    join documents d on d.id = c.document_id
    where 1 - (c.embedding <=> query_embedding) > similarity_threshold
    order by c.embedding <=> query_embedding
    limit match_count;
$$;
```

Operátor `<=>` je cosine distance v pgvector. `1 - distance = similarity`. Threshold 0.5 odfiltruje irrelevantný shum.

## Next.js edge handler

```ts
// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'edge';

const openai = new OpenAI();
const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
    const { query } = await req.json();

    // 1. Embed query
    const embRes = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
    });
    const queryEmbedding = embRes.data[0].embedding;

    // 2. Vector search top 20
    const { data: candidates } = await supabase.rpc('search_chunks', {
        query_embedding: queryEmbedding,
        match_count: 20,
        similarity_threshold: 0.5,
    });

    // 3. LLM re-rank top 5
    const rerank = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 500,
        messages: [{
            role: 'user',
            content: `Otázka: "${query}"\n\nKandidáti:\n${
                candidates.map((c, i) => `[${i}] ${c.title}: ${c.content.slice(0, 200)}`).join('\n')
            }\n\nVráť JSON pole indexov 5 najrelevantnejších kandidátov, zoradené od najlepšieho. Format: {"indices": [3, 1, 7, 0, 12]}`
        }],
    });

    const { indices } = JSON.parse(rerank.content[0].text);
    const top = indices.map((i: number) => candidates[i]);

    return NextResponse.json({ results: top });
}
```

## Latency budget

| Krok | Čas |
|---|---|
| Query embedding (OpenAI) | ~80 ms |
| pgvector search (10k chunks) | ~30 ms |
| Network round-trip | ~50 ms |
| **Vector search total** | **~160 ms** |
| Claude Haiku re-rank | ~600 ms |
| **S re-rankom total** | **~760 ms** |

Pre interný tool kde používateľ pýta "ako resetnem heslo" je 800ms akceptovateľné. Pre customer-facing search by si re-rank vynechal alebo cachoval.

## Reálne náklady na 10 000 dokumentov

| Položka | $/mes |
|---|---|
| Supabase Pro | $25 (alebo Free pre malé use cases) |
| OpenAI embeddings (re-index týždenný) | ~$1.50 |
| Claude Haiku re-rank (~5000 queries) | ~$3 |
| Vercel hosting (edge) | $0 (Hobby) |
| **Total** | **~$7-30/mes** |

Glean by ten istý use case stál $1200/mes. 100× rozdiel pri kvalite, ktorá je pre 95 % "kde nájdem X" otázok porovnateľná.

## Gotchas

1. **HNSW index rebuild** trvá. Pri 100k+ chunks plánuj ingestion v pozadí a use `concurrent` flag.
2. **Embedding model upgrade** = re-index všetkého. Vyber model premyslene. `text-embedding-3-small` je sweet spot pre cenu/kvalitu v 2026.
3. **Slovensko-český obsah** — OpenAI multilingválne embeddings fungujú prekvapivo dobre. Cross-lingual search ("ako vyplniť dovolenku" nájde aj český doc o "jak vyplnit dovolenou") funguje out of the box.
4. **RLS na Supabase** — ak ingestuješ confidential dokumenty, nezabudni policy `auth.uid() in (select user_id from doc_access where doc_id = document_id)`.

## TL;DR

pgvector + Supabase + OpenAI embeddings je v 2026 default stack pre lacný semantic search. 10k dokumentov, $7/mes, latency pod 800ms. Začni bez re-ranku, pridaj keď meriaš relevance regression. Glean a Algolia AI Search sú overpriced pre 80 % use-casov.
