---
title: "WP REST API ako backend pre Next.js: 4 kroky"
date: 2026-02-26
read: 7
tags: ["WordPress", "Next.js", "Headless"]
excerpt: "Praktický návod: JWT auth, CORS, ACF v REST a schema validation cez Zod. Plus revalidatePath cez webhook po publish — ISR ostane fresh bez over-fetching."
featured: false
---

Chceš WordPress ako CMS, ale frontend musí byť rýchly, type-safe a moderný. Klasická headless kombinácia: WP backend + Next.js App Router. V tomto návode prejdem 4 kroky, ktoré ma stáli najviac času, keď som ich robil prvýkrát — a ako to spraviť tak, aby si tým neprešiel ty.

Predpoklady: WP 6.4+, Next.js 15.2+, ACF Pro (alebo Meta Box).

## Krok 1: Auth — Application Passwords vs JWT

WordPress 5.6+ má **natívne Application Passwords**. Žiadny plugin. Toto je defaultná voľba pre väčšinu use cases.

Vygeneruj v `/wp-admin/profile.php` → Application Passwords → "Next.js frontend". Dostaneš 24-znakový string. Ulož ho do `.env.local`:

```bash
WP_API_URL=https://cms.firma.sk/wp-json
WP_USER=api-bot
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
```

V Next.js fetch:

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

**Kedy JWT** ([JWT Authentication for WP REST API](https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/)):

- ak frontend potrebuje **per-user auth** (logged-in members area)
- ak chceš token expirovať a refreshovať v session

Pre čisto čítací CMS-frontend stačí Application Passwords. JWT je overkill.

## Krok 2: CORS — pravdivý dôvod #1 prečo to nefunguje

WP defaultne neservuje CORS hlavičky pre cudzie origins. V dev na localhose to môže ísť (Next.js robí server-side fetch), ale v produkcii pri client-side fetch z `frontend.firma.sk` na `cms.firma.sk` ti prehliadač odmietne.

Pridaj do MU plugin (`/wp-content/mu-plugins/cors.php`):

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

**Whitelist origin-y, NIE wildcard `*`** — wildcard znemožní `Access-Control-Allow-Credentials: true`, čo pri auth-e potrebuješ.

## Krok 3: ACF v REST — `show_in_rest`

Defaultne ACF polia v `/wp-json/wp/v2/posts` **nevidíš**. Treba zapnúť per field group v ACF UI:

1. Custom Fields → Edit Field Group → "Show in REST API: Yes"
2. Zvoľ format: "Standard" pre raw values, "Light" pre podstatné

Po tomto sa polia objavia pod `acf` kľúčom:

```bash
curl https://cms.firma.sk/wp-json/wp/v2/posts/123 | jq '.acf'
```

Caveat — **image field** vracia raw attachment ID. Pre URL musíš extra request alebo zmeň format na "Image Object" v ACF settings.

Code-first cez `acf_add_local_field_group()` (to go-to pre version-controlled config):

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

## Krok 4: Schema validation v Next.js cez Zod

WordPress REST API ti vráti, čo si nastavil — ale to neznamená, že **vždy** ti to vráti. ACF field niekto vymaže, post type niekto premenuje, image attachment je zmazaný. Bez validácie ti potom Next.js v produkcii padne na `undefined.replace`.

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

V data-fetching layer:

```ts
// app/products/[slug]/page.tsx
import { wpFetch } from '@/lib/wp';
import { ProductSchema } from '@/lib/schemas';
import { notFound } from 'next/navigation';

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const raw = await wpFetch(`/wp/v2/product?slug=${params.slug}`);

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

`safeParse` ti dáva runtime safety bez throw. Pri zmene WP schémy uvidíš v `console.error` čo presne nesedí.

## Bonus: Webhook + revalidatePath po publish

Default `next: { revalidate: 3600 }` znamená 1 hodina lag. Pre produktové update-y nedostatočné. WP po publish môže zavolať Next.js API endpoint, ktorý revalidate-uje konkrétne paths.

Plugin pattern (MU plugin):

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

V Next.js (`app/api/revalidate/route.ts`):

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

Po stlačení Update v WP admin sa frontend updatuje za 1-2 sekundy. Klient si to **veľmi všíma**.

## TL;DR

Application Passwords pre auth, MU plugin pre CORS s whitelistom origins, `show_in_rest: true` na ACF field group level, Zod schema pre runtime validation, webhook → `revalidatePath` pre instant updates. S týmto setupom mám produkčný headless WP + Next.js stack, ktorý nepúšťa pri error-och a frontend ostáva fresh bez ISR lag. Najčastejšia chyba začiatočníkov: zabudnúť na CORS a všetko fixnúť `*` wildcard. Nerob to.
