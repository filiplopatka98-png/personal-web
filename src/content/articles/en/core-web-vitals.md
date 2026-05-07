---
title: "Core Web Vitals for small businesses"
date: 2026-01-15
read: 6
tags: ["SEO", "Performance", "Beginner"]
excerpt: "What CWV are, why they matter even with low traffic, and three quick wins."
featured: false
---

## Core Web what?

Three metrics from Google: LCP (how fast the main content loads), INP (how fast it responds to a click), CLS (whether the page jumps around during load).

They affect SEO ranking. And more importantly — they affect conversion. Slow page = people leave.

## Three quick wins

### 1. Turn on image lazy loading

WordPress does this automatically since version 5.5 for below-fold images. Check `loading="lazy"` in HTML. If it's missing, you've got a plugin disabling it.

### 2. Drop unnecessary plugins

Open admin → Plugins. Count them. If >15, it's probably cleanup time. Every plugin = potential script in HTML.

### 3. Use cache

WP Rocket or W3 Total Cache. Or even better, Cloudflare at the DNS level — does 80% of the work for free.

## How to measure

PageSpeed Insights (pagespeed.web.dev) tells you what to fix. Search Console tells you how it evolves over time. Watch both.
