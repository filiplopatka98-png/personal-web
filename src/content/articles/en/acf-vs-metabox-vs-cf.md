---
title: "ACF Pro vs Meta Box vs Custom Fields: Which Wins in 2026"
date: 2025-11-12
read: 8
tags: ["WordPress", "DevOps"]
excerpt: "A deep comparison of the three main players for custom fields in WordPress: DX, performance, REST API, block editor, and license cost. Plus a recommendation on when to reach for which."
featured: false
---

I deal with custom fields on every WordPress project. When a client has half a dozen of them, it doesn't matter how you build it. When they have 80 and half of them have to be in the REST API for a headless frontend, picking the right tool suddenly becomes a serious matter.

For the last 6 months I've deliberately rotated between **ACF Pro**, **Meta Box**, and bare native **Custom Fields** across different projects, so I'd have the freshest numbers possible. Here's the verdict.

## Pricing — the starting line

| Tool | Price | Term |
|---|---|---|
| ACF Pro | $49 / 1 site, $249 / unlimited | yearly |
| Meta Box (Agency Basic) | $149 / unlimited | yearly |
| Native Custom Fields | $0 | forever |

Native fields are part of WordPress core — nothing to install. ACF has a free version in the repository, but Pro is a must for Repeater and Flexible Content. [Meta Box](https://wordpress.org/plugins/meta-box/) also has a free core in the repository, but real development comfort only arrives with the paid bundle (the AIO plugin ships as part of the Ultimate and Lifetime bundles).

## Developer Experience (DX)

### ACF Pro

The admin-UI workflow is the friendliest of the bunch. You build a field group by clicking, export it to PHP via "Tools → Export Field Groups," and commit it to git. It's welcoming even for a developer who wanders in there once a year.

```php
// simple field retrieval
$price = get_field('product_price');
$gallery = get_field('gallery'); // array of images
```

### Meta Box

A code-first approach. You define field groups directly in PHP via the `rwmb_meta_boxes` filter or through Meta Box Builder (free). Version control is trivial — everything lives in PHP files in your theme or plugin.

```php
add_filter('rwmb_meta_boxes', function($meta_boxes) {
    $meta_boxes[] = [
        'title' => 'Produkt detaily',
        'post_types' => 'product',
        'fields' => [
            ['id' => 'price', 'name' => 'Cena', 'type' => 'number'],
        ],
    ];
    return $meta_boxes;
});
```

For a developer who lives in an IDE, this is faster. For a client who wants to add a field themselves — pure hell.

### Native Custom Fields

Bare key–value string pairs. No field-type system, no validation, no UI builder. `get_post_meta($id, 'price', true)`. It works, but the client will type "about 30 bucks" into your "price" field and your blood will run cold.

**DX verdict:** ACF > Meta Box > native for teams with a non-technical client. Meta Box > ACF for a solo developer with git.

## Performance overhead — database queries

This one genuinely interested me, so I ran a benchmark. A post type with 12 custom fields, 500 posts, an archive page loading 20 posts with all their fields.

| Tool | Queries per load | Page render time |
|---|---|---|
| Native (`get_post_meta`) | 22 | 145 ms |
| ACF Pro | 28 | 168 ms |
| Meta Box | 24 | 152 ms |

ACF adds ~6 extra queries because it internally loads the field-group configuration and the meta-key mapping. On larger archives you feel it. The trick: warm the cache with `update_meta_cache($post_ids)`, or wherever the raw value is enough, use `get_field('xyz', false, false)` (no formatting).

Meta Box has the thinnest overhead because it talks to `wp_postmeta` directly, the same way the native API does. No custom abstraction layer.

**Performance verdict:** Meta Box ≈ native > ACF Pro.

## Exposure via the REST API

This one used to burn me on my first headless project. If you're building a [WP REST API as the backend for Next.js](/en/blog/wp-rest-api-nextjs/), your field-tool choice heavily affects how many transformations you'll end up writing on the frontend.

### ACF Pro

Out of the box it **does not expose** custom fields in `/wp-json/wp/v2/posts`. You have to enable it per field group ("Show in REST API: Yes" in the UI) or use [ACF to REST API](https://wordpress.org/plugins/acf-to-rest-api/). ACF has had native support since version 5.11, but there's a catch: an image field returns only the attachment ID by default, not the URL. You have to transform it yourself, set Return Format = Image Object on the field, or force full formatting in REST via the `acf_format=standard` parameter.

### Meta Box

REST API exposure is native, including custom field types. Same `show_in_rest: true` per field group, but it formats the values more sensibly by default (an image returns a URL).

```bash
curl https://web.sk/wp-json/wp/v2/product/123 | jq '.meta.price'
```

### Native

`register_post_meta()` with `'show_in_rest' => true` and you're done. No third-party tool. The cleanest and most predictable.

```php
register_post_meta('product', 'price', [
    'type' => 'number',
    'single' => true,
    'show_in_rest' => true,
]);
```

**REST verdict:** Native > Meta Box > ACF.

## Block editor — custom blocks

Here the three diverge sharply.

### ACF Blocks

You define the block purely in PHP, and the render template is a classic WP template. Editing happens in Gutenberg through ACF forms. For PHP developers and clients alike it's ideal — you don't have to learn React. This is exactly the approach I use when I build [custom Gutenberg blocks for marketers](/en/blog/gutenberg-blocks-marketeri/) who don't know HTML. Note: in the example below I use the older `acf_register_block_type()` function; since ACF 6.0 the recommended way is registration via `block.json` (and native `register_block_type()`), while old blocks keep working.

```php
acf_register_block_type([
    'name' => 'hero',
    'title' => 'Hero sekcia',
    'render_template' => 'blocks/hero.php',
    'category' => 'design',
]);
```

### MB Blocks

Part of paid Meta Box. A similar PHP-first approach, slightly different syntax. It works, but the community is smaller, so there are fewer code samples and Stack Overflow answers.

### Native

Native blocks = React + JSX + `@wordpress/scripts` + `block.json`. Full power, but a significantly longer development time even for simple blocks. For marketing blocks it's overkill.

**Block editor verdict:** ACF > Meta Box >> native (for PHP-centric teams).

## License cost across multiple clients

If you run an agency with 30+ clients:

- **ACF Pro Agency:** $249 per year, usable on all of the agency's sites (unlimited). The most economical option across multiple projects.
- **Meta Box Agency Basic:** $149 per year for an unlimited number of sites. The best-priced yearly license.
- **Native:** free, but you'll quickly blow through 60 hours on your own UI and validation.

Meta Box wins on license cost by a mile.

## Table — summary

| Criterion | ACF Pro | Meta Box | Native |
|---|---|---|---|
| Price (unlimited) | $249/yr | $149/yr | $0 |
| DX (UI builder) | excellent | good | none |
| DX (code-first) | good | excellent | manual |
| Performance | decent | best | best |
| REST API | OK (with config) | native | native |
| Block editor | excellent (PHP) | good (PHP) | React only |
| Community / docs | large | medium | scarce |

## What I use

- **Client with a non-technical team + admin UI only:** ACF Pro. Comfort for the marketing team and my own productivity.
- **Headless project with a Next.js frontend:** Meta Box. Native REST exposure, performance, low overhead. (Whether headless is even worth it, I break down in [Headless Woo + Next.js: When It's Worth It](/en/blog/headless-woo-nextjs-kedy/).)
- **Internal tool, 2–3 fields, single developer:** native + `register_post_meta`. No plugin dependencies.

## TL;DR

ACF wins on DX and the block editor. Meta Box wins on performance, REST API, and license cost. Native fields win on minimalism and predictability. In 2026 all three are serious players, and the only real question is what your specific use case is. Don't hunt for "the one" tool — use the one that fits the project at hand.
