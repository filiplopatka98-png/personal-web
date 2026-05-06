---
slugKey: ai-integrations
lang: sk
title: AI integrácie
longTitle: AI integrácie, ktoré reálne pracujú
icon: ai
order: 3
priceFrom: "od 800 €"
typicalTime: "2-4 týždne"
ctaLabel: Pokecať o tom
included:
  - OpenAI / Anthropic API integrácia s rate limitingom
  - Custom RAG (retrieval-augmented generation) nad tvojou znalostnou bázou
  - Streaming responses pre lepšie UX
  - Audit log + cost tracking
  - Fallback na človeka po N neúspešných pokusoch
  - GDPR-friendly setup (žiadne posielanie osobných údajov tretím stranám bez súhlasu)
notFor: "Ak chceš AI „len preto, že je trendy\" — najprv si položme otázku, či ti reálne ušetrí čas alebo zlepší skúsenosť klientov. AI nie je magická pilulka."
---

V poslednom roku som integroval OpenAI alebo Anthropic API do 5+ projektov. Najčastejšie use cases: chatboty (zákaznícka podpora, FAQ assistant), generovanie produktových popisov, automatická kategorizácia obsahu, prompt-based search nad internou databázou.

Pre custom RAG implementácie používam Astro + Vercel KV / Supabase pgvector pre embeddings. Streaming responses cez fetch streams alebo SSE — používateľ vidí prvé slová odpovede do 800 ms, plnú odpoveď do 3-5 sekúnd. Bez streamingu je AI chat nepoužiteľný (čakanie 10s na odpoveď zničí UX).

Cost tracking je kritický. Každý request loguje token usage, model variant, latency, success/failure status. Mesačné limity na klientov + per-IP rate limiting cez Upstash alebo Redis. Audit log v databáze pre compliance — najmä pre healthcare a finančných klientov je toto must-have.

Pre kvalitu výstupu kladiem dôraz na tri veci: prompt engineering (testovanie 20+ variantov pred shippingom), model selection (GPT-4o pre kvalitu, GPT-4o-mini pre cenu, Claude Haiku pre rýchlosť), fallback logic (keď AI 3× po sebe nevie odpovedať, predáva človeku).
