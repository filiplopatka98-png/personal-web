---
slugKey: ai-integrations
lang: en
title: AI integrations
longTitle: AI integrations that actually work
icon: ai
order: 3
priceFrom: "from €800"
typicalTime: "2-4 weeks"
ctaLabel: Let's chat about it
included:
  - OpenAI / Anthropic API integration with rate limiting
  - Custom RAG (retrieval-augmented generation) over your knowledge base
  - Streaming responses for better UX
  - Audit log + cost tracking
  - Fallback to a human after N failed attempts
  - GDPR-friendly setup (no sending personal data to third parties without consent)
notFor: "If you want AI \"just because it's trendy\" — let's first ask whether it'll really save you time or improve your customers' experience. AI isn't a magic pill."
---

In the last year, I've integrated OpenAI or Anthropic APIs into 5+ projects. Most common use cases: chatbots (customer support, FAQ assistant), product description generation, automated content categorization, prompt-based search over an internal database.

For custom RAG implementations I use Astro + Vercel KV / Supabase pgvector for embeddings. Streaming responses via fetch streams or SSE — the user sees the first words of the response within 800ms, the full answer within 3-5 seconds. Without streaming, AI chat is unusable (a 10s wait for a response wrecks UX).

Cost tracking is critical. Every request logs token usage, model variant, latency, success/failure status. Monthly limits per client + per-IP rate limiting via Upstash or Redis. Audit log in the database for compliance — especially for healthcare and financial clients, this is a must-have.

For output quality I focus on three things: prompt engineering (testing 20+ variants before shipping), model selection (GPT-4o for quality, GPT-4o-mini for cost, Claude Haiku for speed), fallback logic (when AI fails 3 times in a row, hand off to a human).
