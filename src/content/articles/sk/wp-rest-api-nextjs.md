---
title: "WP REST API ako backend pre Next.js: 4 kroky"
date: 2026-02-26
read: 7
tags: ["WordPress", "Next.js", "Headless"]
excerpt: "Praktický návod: autentifikácia, CORS, ACF v REST a validácia schémy cez Zod. Plus revalidatePath cez webhook po publikovaní — ISR ostane čerstvé bez zbytočného načítavania."
featured: false
---

Chceš WordPress ako CMS, ale frontend musí byť rýchly, typovo bezpečný a moderný. Klasická headless kombinácia: WP backend + Next.js App Router. V tomto návode prejdem 4 kroky, ktoré ma prvýkrát stáli najviac času — a ukážem, ako to spraviť tak, aby si sa tomu vyhol.

Predpoklady: WP 6.4+, Next.js 15.2+, ACF Pro (alebo Meta Box).

## Krok 1: Auth — Application Passwords vs JWT

WordPress 5.6+ má **natívne Application Passwords**. Žiadny plugin. Toto je predvolená voľba pre väčšinu prípadov použitia.

Vygeneruj ich v `/wp-admin/profile.php` → Application Passwords → „Next.js frontend“. Dostaneš 24-znakový reťazec (WP ti ho zobrazí v šiestich skupinách po štyroch znakoch — medzery sa pri overovaní ignorujú). Ulož ho do `.env.local`:

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

- ak frontend potrebuje **autentifikáciu per používateľ** (členská sekcia s prihlásením)
- ak chceš token nechať vypršať a obnovovať ho v rámci session

Pre čisto čítací CMS-frontend stačia Application Passwords. JWT je zbytočný overkill.

## Krok 2: CORS — dôvod č. 1, prečo to nefunguje

WordPress predvolene neposiela CORS hlavičky pre cudzie origins. V lokálnom vývoji to môže fungovať (Next.js robí fetch na strane servera), ale v produkcii pri fetchi z prehliadača z `frontend.firma.sk` na `cms.firma.sk` ťa prehliadač zablokuje.

Pridaj do MU pluginu (`/wp-content/mu-plugins/cors.php`):

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

**Origins daj na whitelist, NIE wildcard `*`** — s `Access-Control-Allow-Credentials: true` prehliadač wildcard `*` odmietne, takže konkrétny origin musíš pri autentifikácii vrátiť explicitne.

## Krok 3: ACF v REST — `show_in_rest`

Predvolene ACF polia v `/wp-json/wp/v2/posts` **nevidíš**. Treba to zapnúť per field group v ACF UI: Custom Fields → Edit Field Group → prepni „Show in REST API“ na „Yes“.

Po tomto sa polia objavia pod kľúčom `acf`:

```bash
curl https://cms.firma.sk/wp-json/wp/v2/posts/123 | jq '.acf'
```

Pozor na **image field** — v predvolenom formáte `light` vracia iba ID prílohy. Pre plný objekt s URL pridaj do requestu parameter `?acf_format=standard` (formát `standard` prepustí hodnoty cez `acf_format_value()`, takže image field sa rozbalí na URL, rozmery a veľkosti náhľadov). Pozor, nezamieňaj to s return formátom samotného poľa v ACF (Image Array / Image URL / Image ID) — to je iné nastavenie než formátovanie v REST.

Code-first cez `acf_add_local_field_group()` (moja go-to voľba pre konfiguráciu vo verziovaní):

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

## Krok 4: Validácia schémy v Next.js cez Zod

WordPress REST API ti vráti, čo si nastavil — ale to neznamená, že to **vždy** aj vráti. Niekto vymaže ACF pole, niekto premenuje post type, niekto zmaže obrázkovú prílohu. Bez validácie ti potom Next.js v produkcii padne na `undefined.replace`.

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

`safeParse` ti dáva bezpečnosť za behu bez vyhadzovania výnimky. Pri zmene WP schémy uvidíš v `console.error` presne to, čo nesedí.

## Bonus: Webhook + revalidatePath po publikovaní

Predvolené `next: { revalidate: 3600 }` znamená až hodinové oneskorenie. Pri produktových zmenách je to nedostatočné. WP po publikovaní môže zavolať Next.js API endpoint, ktorý revaliduje konkrétne cesty.

Vzor pluginu (MU plugin):

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

Po stlačení Update vo WP admine sa frontend aktualizuje za 1 – 2 sekundy. Klient si to **veľmi všíma**.

## TL;DR

Application Passwords na autentifikáciu, MU plugin pre CORS s whitelistom origins, `show_in_rest: true` na úrovni ACF field group, Zod schéma na validáciu za behu, webhook → `revalidatePath` pre okamžité aktualizácie. S týmto setupom mám produkčný headless WP + Next.js stack, ktorý sa pri chybách nezosype a frontend ostáva čerstvý bez ISR oneskorenia. Najčastejšia chyba začiatočníkov: zabudnúť na CORS a potom to „opraviť“ wildcardom `*`. Nerob to.
