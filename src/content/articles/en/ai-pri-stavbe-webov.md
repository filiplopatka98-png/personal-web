---
title: "How I Use AI to Build Websites — and Where I Don't Trust It"
date: 2027-01-19
read: 8
tags: ["AI"]
excerpt: "Where AI genuinely saves me hours, where I keep it on a short leash, and where I don't let it near a project at all. No hype, verified numbers."
featured: false
---

AI is as much a part of my workflow today as the terminal. But I have no relationship with it — it's a tool, not a colleague. And like with any tool: I know what it's good for, and I know exactly where it can burn me. This is my honest take on where I let AI take the wheel when building websites, and where I keep it, at most, on the gas pedal while I steer.

## The tooling landscape in 2027 (and why it matters)

The market has settled around three approaches. **GitHub Copilot** is a pair programmer right inside your IDE; as of June 2026 all plans moved to usage-based billing with AI credits (Pro includes $15/month in credits). **Cursor** is an AI-native fork of VS Code, Pro at $20/month. **Claude Code** is an agentic tool in the terminal, Pro at $20/month (or $17 billed annually), Max from $100/month.

In practice most pros don't use a single tool but several — a common stack is an editor with inline suggestions for daily work plus an agentic tool for larger, multi-step tasks. I run something similar. One important context shift: the **Model Context Protocol (MCP)**, which Anthropic released in November 2024 as an open standard, has since become the de facto norm — in December 2025 it was donated to the Agentic AI Foundation under the Linux Foundation, and it runs across 10,000+ MCP servers in production. In practice that means an AI tool can now reach into your database, CMS, or issue tracker through one interface instead of N×M custom connectors.

## Where I let AI take the wheel

**Boilerplate and repetitive structure.** A custom post type, a register script, a Gutenberg block scaffold, TypeScript types from a JSON payload, basic tests. This is work where the "right answer" is known and verifiable at a glance. Here AI saves real hours every week.

**Refactoring with a clear brief.** When I know exactly what I want — "turn this callback into async/await, keep the error handling" — AI does it faster than I'd type it by hand. The key is that I can read the result and judge it instantly.

**First drafts of docs and comments.** README, JSDoc, commit messages. Not the final wording, but a decent draft I polish.

**Rubber-ducking.** When I'm stuck, explaining the problem to the AI often leads me to the answer before the AI even replies. Classic.

## Where I keep it on a short leash

This is everything where an "almost correct" answer is the most dangerous — because it passes at a glance and only fails in production.

**Performance decisions.** AI will happily hand you `<img loading="lazy">` on your LCP image — and that's exactly how it worsens your Largest Contentful Paint. Core Web Vitals thresholds are hard facts you need to know, not have the model guess: LCP good under 2.5 s, INP (which replaced FID in March 2024) good under 200 ms, CLS under 0.1. AI knows about them, but it doesn't know about your specific page — so I take the suggestion and measure it myself.

**Accessibility.** AI generates `aria-*` attributes with confidence, but half of them are either unnecessary or actively harmful (`aria-label` on a `<div>` with no role, redundant `role="button"` on a `<button>`). The reference point is WCAG 2.2 — a W3C Recommendation from October 2023, updated December 2024, and since October 21, 2025 also ISO/IEC 40500:2025. That's a standard I verify with a keyboard and a screen reader, not by trusting the model. More in [WCAG AA on a small site: 80% of the effect for 20% of the work](/en/blog/wcag-aa-80-20/).

**Security.** Input sanitization, nonces, capability checks in WordPress — here I read every line. AI tends to skip `wp_verify_nonce()` or escape on output "sometime later."

## Where I don't let it near the project at all

**Dependencies I didn't come up with myself.** This is the most concrete risk and I have hard data for it. At USENIX Security 2025 a team from UTSA, the University of Oklahoma, and Virginia Tech generated 2.23 million code samples across 16 models — and **19.7% contained at least one hallucinated package name**. Worse: when the same prompt was rerun ten times, 43% of hallucinated names reappeared on every single run. That's predictable, and therefore exploitable — it spawned an attack called **slopsquatting**, where someone registers a hallucinated name and waits for an AI to suggest it to someone.

So I have a rule: every `import`/`require` I don't recognize gets verified manually before it goes into `package.json`. A quick check before installing:

```bash
# Verifies the package actually exists on npm and since when
npm view react-codeshift 2>/dev/null \
  && echo "exists" \
  || echo "WARNING: package does not exist — don't add it blindly"
```

And in CI I lock the dependency tree so no "new friend" leaks into the build:

```bash
# lockfile must match; otherwise the build fails (not a silent install)
npm ci
```

**Architectural decisions.** Astro vs Next.js, headless vs monolith, when to use Server Components — these are decisions with a long tail of consequences that depend on the client's context, budget, and team. AI gives you the average of the internet; I need a decision for this project. If you're wrestling with that one, I have an [Astro vs Next.js decision table](/en/blog/astro-vs-nextjs-tabulka/).

**Final content that represents a client.** After March 2024 and August 2025, Google cracked down on scaled AI content with no E-E-A-T signals. I break it down in detail in [AI content vs Google E-E-A-T](/en/blog/ai-content-eeat/) — in short: AI draft yes, AI as author no.

## How I have it set up in practice

Two things make the biggest difference in output quality.

First, **context**. AI without your project's context guesses; with context it's far more accurate. In Claude Code that's what `CLAUDE.md` at the repo root is for — a conventions file loaded into every session. A short sample:

```markdown
# Conventions
- PHP 8.1, one class per file, `declare(strict_types=1)`.
- No new npm packages without my approval.
- Before "done": lint + full test suite green.
```

Second, **verification before "done"**. I don't consider any AI output finished until lint, tests, and — for UI — a visual check in the browser have run. The model loves to write "✅ fixed" even when the test is failing. Evidence before assertions, always.

## Bottom line: a tool, not an oracle

AI sped up my routine by maybe a third and freed up my head for the things it doesn't care about — architecture, performance, accessibility, the client relationship. Which is exactly where my added value is. I don't trust it on dependencies, on security, or on decisions with long consequences. And that's not distrust on principle — it's engineering hygiene. A tool that invents a nonexistent package one time in five simply earns the right to have every line read after it.
