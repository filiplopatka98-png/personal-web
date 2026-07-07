---
title: "AEO: How to Prep Content So ChatGPT and Google Cite You"
date: 2027-01-14
read: 8
tags: ["SEO", "AI"]
excerpt: "Answer Engine Optimization in practice — answer-first structure, the schema that still works, content freshness, and why llms.txt isn't magic yet."
featured: false
---

Classic SEO gets you onto Google's first page. AEO — Answer Engine Optimization — gets you into the answer that ChatGPT, Perplexity, or Google AI Overview generates before the user even clicks that first page. And that's a different discipline than the one we're used to.

The numbers are blunt: in the first half of 2026, depending on the measurement methodology, Google AI Overviews show up on **48% to 60%** of searches. That means for half of all queries, the organic link sits *below* the answer the user reads first. If you're not cited in that answer, you're invisible — no matter how well you rank.

Let's get into what actually works in practice and what's still hype.

## Answer in the first sentences

This is the single most important mindset shift. An answer engine doesn't read a page like a human — it extracts **passages**. It grabs the first sentence or two from each section and decides whether they answer the query. If you open a section with three paragraphs of context and throat-clearing, the model moves on to the competitor who answered straight away.

A rule I see confirmed over and over: **put the core of the answer in the first 40 to 60 words of a section**, then elaborate. Phrase each `##` heading as a question or a clear topic and answer it right underneath. Keep sections in the 200-to-400-word range with clear semantic boundaries — so each one makes sense even when pulled out of context.

In practice that's the inverted pyramid journalists have known for decades: conclusion up top, details below. For a typical company blog it's a painful habit to break, but it's a one-time template-of-thinking change, not a technology.

## The schema that still makes sense (and one surprise)

Structured data is still a signal, but the landscape shifted in 2026. **On May 7, 2026, Google permanently stopped showing FAQ rich results** in classic search — those expandable question dropdowns under a result are gone. Plenty of people concluded that `FAQPage` schema is dead. It isn't.

`FAQPage` is still a valid Schema.org type, and Google (along with the other engines) keeps **parsing it to understand content**. Perplexity, ChatGPT search, Gemini, and Google AI Overviews all read FAQ markup as a primary signal when extracting Q&A answers. Pages with clean FAQ schema tend to get cited in AI answers disproportionately more than the same information delivered as plain prose.

The trio I deploy on content pages in practice:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is Answer Engine Optimization?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "AEO is structuring content so AI engines like ChatGPT or Google AI Overview can extract it, trust it, and cite it as the answer to a user's question."
    }
  }]
}
```

Add `Article` (or `BlogPosting`) to identify the content type and metadata, and `BreadcrumbList` for topical hierarchy. Nothing exotic — verify with the [Rich Results Test](https://search.google.com/test/rich-results) and move on. And if you're on an ecommerce build, I've got ready-made [JSON-LD templates for a small store](/en/blog/schema-org-eshop-templates/) that follow the same logic.

## Freshness isn't cosmetic, it's a ranking factor

Engines favor new content more aggressively than classic Google does. Analyses of the sources AI cites show that URLs in AI answers are on average **noticeably younger** than those in traditional results — on the order of a quarter younger. The reason is logical: a model asked "what's the latest X" would rather grab an article from six months ago than one from four years ago.

That's why I put key pages on a quarterly refresh: new numbers, the current year in the copy, added paragraphs. And signal it visibly — keep the `dateModified` in your schema synced with the actual change:

```json
{
  "@type": "BlogPosting",
  "datePublished": "2026-03-01",
  "dateModified": "2027-01-14"
}
```

Don't fake it. Rewriting the date without a real content change is short-sighted — and combined with AI-generated filler you're inviting the exact problem I write about in [AI content vs Google E-E-A-T](/en/blog/ai-content-eeat/).

## Authority: you get cited when others cite you

A model doesn't invent trust — it infers it. Domains with profiles on review platforms (Trustpilot, G2, Capterra) and mentions on Reddit or Quora tend to get cited by ChatGPT many times more often than sites with no external footprint at all. It's not that the AI "goes there for the answer," but that these signals build an entity that can be trusted.

For a small business the takeaway is boring but true: **build a real presence off your own site**. Answer in relevant discussions, keep a proper Google Business Profile, earn a handful of independent mentions. It ties into what works for [local SEO in a mid-size city](/en/blog/local-seo-bratislava/) — an entity a machine can recognize and match is the foundation.

## llms.txt: nice idea, weak reality

You've surely heard of `llms.txt` — a file at the site root meant to hand AI crawlers a trimmed, clean overview of your content. Sounds great. The 2026 reality is soberer.

Adoption on the site side is around **10%** (an SE Ranking study across 300,000 domains), but on the crawler side it's near zero. In one analysis of half a billion AI bot visits over 90 days, **only 408 requests targeted `llms.txt`**. In July 2025 Google officially said it doesn't support it and doesn't plan to, comparing it to the long-dead keywords meta tag. Anthropic and Perplexity, on the other hand, say they do work with it.

My stance: deploy `llms.txt` **if you can generate it automatically** from the same sources as the site (a few hours of work, zero extra maintenance). Don't pour hours into it by hand. It's a low-risk bet on the future, not today's workhorse. A minimal useful file:

```markdown
# My Company

> A short description of what the company does.

## Key pages
- [Services](https://example.com/services): overview of the offering
- [Pricing](https://example.com/pricing): current prices
- [Contact](https://example.com/contact): where to find us
```

What you actually control is `robots.txt` — that's where you decide whether GPTBot, PerplexityBot, or Google-Extended even get in. Check that first.

## Where to start

AEO isn't a magical new channel — it's a more disciplined version of what good SEO always did: clear structure, credibility, freshness. The priorities are few and cheap:

1. **Rewrite section openers** so the answer lands in the first 40 to 60 words.
2. **Add `FAQPage`, `Article`, and `BreadcrumbList` schema** and verify with the Rich Results Test.
3. **Run a quarterly refresh** of key pages and honestly update `dateModified`.
4. **Build an external footprint** — reviews, mentions, GBP.
5. Do `llms.txt` only if it's free and automatic.

That's the whole thing. No $500-a-month tool replaces these basics — and once you've got them, the rest is just tuning. If you like working in structures, also see [internal linking via topic clusters](/en/blog/internal-linking-topic-clusters/); topical connectivity helps AI engines just as much as it helps the reader.
