---
title: "WP REST API as a Backend for Next.js: 4 Steps"
date: 2026-02-26
read: 7
tags: ["WordPress", "Next.js", "Headless"]
excerpt: "A practical walkthrough: authentication, CORS, ACF in REST, and schema validation with Zod. Plus revalidatePath via a webhook after publishing — so your ISR stays fresh without needless refetching."
featured: false
---

You want WordPress as your CMS, but the frontend has to be fast, type-safe, and modern. The classic headless combo: a WP backend plus the Next.js App Router. In this guide I'll walk through the 4 steps that cost me the most time the first time around — and show you how to do it so you can skip that pain.

Prerequisites: WP 6.4+, Next.js 15.2+, ACF Pro (or Meta Box). If you're still weighing whether headless is even worth it, check out [when headless Woo + Next.js pays off (and when it doesn't)](/en/blog/headless-woo-nextjs-kedy/).

## Step 1: Auth — Application Passwords vs JWT

WordPress 5.6+ ships with **native Application Passwords**. No plugin. This is the default choice for most use cases.

Generate them in `/wp-admin/profile.php` → Application Passwords → "Next.js frontend". You'll get a 24-character string (WP shows it to you in six groups of four characters — the spaces are ignored during verification). Store it in `.env.local`:

```bash
WP_API_URL=https://cms.firma.sk/wp-json
WP_USER=api-bot
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
```

The Next.js fetch:

```ts
// lib/wp.ts
const auth = Buffer.from(
  `${process.env.WP_USER}:${process.env.WP_APP_PASSWORD}`
).toString('base64');

export async function wpFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${process.env.WP_API_URL}${path}`, {
    ...init,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
    next: { revalidate: 3600 }, // ISR 1h default
  });
  if (!res.ok) throw new Error(`WP fetch failed: ${res.status}`);
  return res.json();
}
```

**When to use JWT** ([JWT Authentication for WP REST API](https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/)):

- when the frontend needs **per-user authentication** (a members' area with login)
- when you want tokens to expire and get refreshed within a session

For a read-only CMS frontend, Application Passwords are enough. JWT is needless overkill.

## Step 2: CORS — the #1 reason it doesn't work

By default, WordPress doesn't send CORS headers for foreign origins. In local development it may work anyway (Next.js fetches on the server side), but in production, when you fetch from the browser on `frontend.firma.sk` against `cms.firma.sk`, the browser blocks you.

Add this to an MU plugin (`/wp-content/mu-plugins/cors.php`):

```php
<?php
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        $allowed_origins = [
            'https://firma.sk',
            'https://staging.firma.sk',
        ];
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if (in_array($origin, $allowed_origins, true)) {
            header("Access-Control-Allow-Origin: {$origin}");
        }
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Authorization, Content-Type');

        return $value;
    });
}, 15);
```

**Whitelist your origins, do NOT use the wildcard `*`** — with `Access-Control-Allow-Credentials: true` the browser rejects the wildcard `*`, so when you authenticate you have to return the specific origin explicitly.

## Step 3: ACF in REST — `show_in_rest`

By default you **can't see** ACF fields in `/wp-json/wp/v2/posts`. You have to turn it on per field group in the ACF UI: Custom Fields → Edit Field Group → flip "Show in REST API" to "Yes". (If you're still deciding what to manage fields with in the first place, I compared [ACF Pro vs Meta Box vs Custom Fields](/en/blog/acf-vs-metabox-vs-cf/).)

After this, the fields show up under the `acf` key:

```bash
curl https://cms.firma.sk/wp-json/wp/v2/posts/123 | jq '.acf'
```

Watch out for the **image field** — in the default `light` format it returns only the attachment ID. For the full object with a URL, add the `?acf_format=standard` parameter to the request (the `standard` format runs values through `acf_format_value()`, so the image field expands into a URL, dimensions, and thumbnail sizes). Careful, don't confuse this with the field's own return format in ACF (Image Array / Image URL / Image ID) — that's a different setting than the REST formatting.

Code-first via `acf_add_local_field_group()` (my go-to choice for keeping config in version control):

```php
acf_add_local_field_group([
    'key' => 'group_product_meta',
    'title' => 'Produkt meta',
    'fields' => [
        [
            'key' => 'field_price',
            'label' => 'Cena',
            'name' => 'price',
            'type' => 'number',
            'rest_format' => 'standard',
        ],
    ],
    'location' => [[['param' => 'post_type', 'operator' => '==', 'value' => 'product']]],
    'show_in_rest' => 1,
]);
```

## Step 4: Schema validation in Next.js with Zod

The WordPress REST API returns what you configured — but that doesn't mean it will **always** return it. Someone deletes an ACF field, someone renames a post type, someone deletes an image attachment. Without validation, Next.js then crashes in production on `undefined.replace`.

```ts
// lib/schemas.ts
import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.number(),
  slug: z.string(),
  title: z.object({
    rendered: z.string(),
  }),
  acf: z.object({
    price: z.coerce.number(),
    description: z.string().nullable(),
    gallery: z.array(z.object({
      url: z.string().url(),
      alt: z.string(),
    })).default([]),
  }),
});

export type Product = z.infer<typeof ProductSchema>;

export const ProductsSchema = z.array(ProductSchema);
```

In the data-fetching layer:

```ts
// app/products/[slug]/page.tsx
import { wpFetch } from '@/lib/wp';
import { ProductSchema } from '@/lib/schemas';
import { notFound } from 'next/navigation';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const raw = await wpFetch(`/wp/v2/product?slug=${slug}`);

  if (!raw.length) notFound();

  const parsed = ProductSchema.safeParse(raw[0]);
  if (!parsed.success) {
    console.error('WP schema mismatch:', parsed.error.format());
    notFound();
  }

  const product = parsed.data;

  return (
    <article>
      <h1>{product.title.rendered}</h1>
      <p>{product.acf.price.toFixed(2)} €</p>
    </article>
  );
}
```

`safeParse` gives you runtime safety without throwing an exception. When the WP schema changes, `console.error` shows you exactly what doesn't line up.

## Bonus: Webhook + revalidatePath after publishing

The default `next: { revalidate: 3600 }` means up to an hour of lag. For product changes that's not good enough. After publishing, WP can call a Next.js API endpoint that revalidates specific paths. I broke down the differences between `revalidate`, `tag`, and `path` in the post on [Next.js cache: revalidate, tag, path](/en/blog/nextjs-cache-revalidate/).

A sample plugin (MU plugin):

```php
<?php
add_action('save_post_product', function($post_id, $post) {
    if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) return;
    if ($post->post_status !== 'publish') return;

    $payload = [
        'slug' => $post->post_name,
        'type' => 'product',
    ];

    wp_remote_post('https://firma.sk/api/revalidate', [
        'headers' => [
            'Authorization' => 'Bearer ' . NEXT_REVALIDATE_TOKEN,
            'Content-Type' => 'application/json',
        ],
        'body' => json_encode($payload),
        'timeout' => 5,
    ]);
}, 10, 2);
```

In Next.js (`app/api/revalidate/route.ts`):

```ts
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.REVALIDATE_TOKEN}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { slug, type } = await req.json();

  if (type === 'product') {
    revalidatePath(`/products/${slug}`);
    revalidatePath('/products');
  }

  return NextResponse.json({ ok: true, revalidated: [`/products/${slug}`] });
}
```

Once you hit Update in the WP admin, the frontend updates in 1–2 seconds. Clients **absolutely notice** that.

## TL;DR

Application Passwords for auth, an MU plugin for CORS with a whitelist of origins, `show_in_rest: true` at the ACF field group level, a Zod schema for runtime validation, webhook → `revalidatePath` for instant updates. With this setup I've got a production headless WP + Next.js stack that doesn't fall apart on errors and keeps the frontend fresh without ISR lag. The most common beginner mistake: forgetting about CORS and then "fixing" it with a wildcard `*`. Don't do that.
