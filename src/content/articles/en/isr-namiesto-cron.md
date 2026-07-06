---
title: "Next.js ISR as a cron replacement on small sites"
date: 2025-10-12
read: 6
tags: ["Next.js", "DevOps"]
excerpt: "A small site needs to refresh its data every hour, but you don't want to pay for cron infrastructure. ISR solves it for you — with a few caveats."
featured: false
---

A client had a Next.js portfolio site that pulled articles from a headless WordPress via the REST API. "I want it to refresh every hour, but I don't want to pay for GitHub Actions or a Vercel cron." OK. ISR does that for free.

## ISR in one paragraph

Incremental Static Regeneration is something only Next.js does in this exact form. **It generates the page statically at build time, but after a set interval it regenerates the page in the background** when a request comes in. Visitors always get static HTML (fast); the regeneration runs asynchronously after the response has been sent.

Two ways to trigger it:

1. **Time-based** — `export const revalidate = 3600` at the page level.
2. **On-demand** — `revalidatePath('/blog')` or `revalidateTag('posts')` from a route handler (a webhook).

If you want the full rundown of when to reach for each one, I wrote a whole piece on [Next.js cache: revalidate, tag, and path](/en/blog/nextjs-cache-revalidate/).

## Time-based ISR instead of a cron

The classic scenario: a blog feed that loads data from an external API and we want to refresh it once an hour. Without ISR you'd set up a cron that calls the API and stashes the result in a cache somewhere. With ISR:

```tsx
// app/blog/page.tsx
export const revalidate = 3600; // 1 hour

export default async function BlogPage() {
  const posts = await fetch("https://cms.example.com/wp-json/wp/v2/posts", {
    next: { revalidate: 3600 },
  }).then(r => r.json());

  return <PostList posts={posts} />;
}
```

The first request after the hour is up kicks off a regeneration. **The visitor still sees the old version while it runs** (no waiting). Once it finishes, the cache updates.

That's the fundamental difference from a cron: **ISR fires on a request, not on the clock**. If nobody hits the blog for 6 hours, the first visitor after those 6 hours instantly gets the old version and the regeneration runs in the background. That visitor still won't see the fresh data — the **second** visitor will.

## On-demand revalidation from a webhook

For the cases where a client publishes a new article and doesn't want to wait an hour, I add a webhook:

```tsx
// app/api/revalidate/route.ts
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
```

On the WordPress side I add a hook:

```php
add_action('publish_post', function($post_id) {
  wp_remote_post('https://my-site.com/api/revalidate', [
    'headers' => ['x-webhook-secret' => MY_SECRET],
    'body' => json_encode(['post_id' => $post_id]),
  ]);
});
```

After publishing in WordPress, `/blog` on production refreshes within 2 seconds. **No cron, no polling, no extra infrastructure of your own.** If you're wiring WordPress up to Next.js like this, my walkthrough of [using the WP REST API as a Next.js backend](/en/blog/wp-rest-api-nextjs/) covers the rest of the plumbing.

## When ISR isn't enough to replace a cron

ISR has hard limits. **Don't use it as a "scheduled job runner."**

Things ISR **can't** do:

1. **Side effects** — send an email, write to a database, call a third-party API. ISR regenerates the **view**, not business logic. There's no guarantee it even runs.
2. **Cold cache after a deploy** — after every deploy the cache is empty and the first request to each page regenerates it. With 200 pages that's 200 cold-start regenerations. The fix: a warm-up script that visits the most important pages after a deploy.
3. **A guarantee independent of traffic** — if nobody visits the page for a month, ISR **never runs**. A cron always runs.
4. **A precise time window** — ISR doesn't guarantee "exactly at 3:00 AM." It guarantees "1 hour after the last render, on the first request."

For side effects (an email digest, database cleanup, a batch import) you need a real cron. The options:

- **Vercel Cron Jobs** — available on all plans, but on the Hobby plan at most once a day; per-minute cadence only unlocks on the Pro plan ($20/month per user).
- **GitHub Actions** schedule — free up to 2,000 minutes/month on private repos (on public repos Actions is free).
- **Upstash QStash** — pay-per-request ($1 per 100k messages), with a free tier of 1,000 messages a day — cheap for small use cases.
- **Your own VPS with `cron`** — if you already have a VPS running for something else.

## A real example: a publishing flow through a WordPress CMS

The setup I run on 4 client projects:

1. WordPress as a headless CMS on a subdomain (`cms.klient.sk`).
2. A production Next.js site with ISR `revalidate: 3600` as a safety net.
3. A WP plugin calls `https://klient.sk/api/revalidate` on:
   - publishing/editing/deleting an article,
   - publishing/editing/deleting a page,
   - editing the menu (revalidates `/`),
   - changing the featured image (revalidates that specific page).

The client publishes an article → it's live 2 seconds later. No cron, no polling. **Extra hosting: 0 EUR.** One caveat, though: the Vercel Hobby plan is for personal, non-commercial projects only — the moment it's a paid client site, per Vercel's terms you're on the Pro plan ($20/month per user). So for small sites I usually host them elsewhere, or just bill the client for Pro up front. If you're weighing where to run it, I compared [Vercel vs Cloudflare Pages vs your own node](/en/blog/vercel-vs-cloudflare-vs-vps/) on both cost and performance.

## TL;DR

If you need to **refresh data every X hours** or **update on publish**, ISR does it for free. If you need a **scheduled task with side effects** (email, database writes), you need a real cron. For small sites ISR covers 90% of cases. Save the cron for the remaining 10%.
