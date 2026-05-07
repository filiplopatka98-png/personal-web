---
title: "Headless WordPress + Next.js: when it's the right call"
date: 2026-02-15
read: 12
tags: ["Architecture", "WordPress", "Next.js"]
excerpt: "A decision matrix: when headless WP earns its complexity and when it doesn't."
featured: false
---

## Headless is trendy. But not for everyone.

Over the last year I've done three headless WP projects and four classic ones. Here's an honest look at when it pays off.

## When YES

The team has its own frontend developer who knows Next.js. Without that, every fix becomes a ticket that takes weeks.

The frontend needs things WordPress does poorly — complex animations, real-time data, multi-channel publishing (web + mobile app).

The client has a budget for DevOps. Headless = two deployments, two monitoring tools, double the failure modes.

## When NO

The client edits content themselves and wants to see the result immediately. Preview mode in headless works, but it's fragile.

The project is smaller than 10k monthly visits. ROI doesn't add up — instead of headless, go with a block theme + good cache.

## My matrix

Budget < €15k? Classic WP. Budget €15–40k? Block theme + custom blocks. Budget €40k+ and the team has a frontend dev? Headless starts to make sense.

## A stack that works

WordPress + WPGraphQL + Faust.js (or plain Next.js). Vercel for frontend, classic LAMP/Cloud for WP. Preview via secret token in query.

One tip: don't forget to set ISR revalidate short (60s) for lists and long (1h+) for details. Saves money and nerves.
