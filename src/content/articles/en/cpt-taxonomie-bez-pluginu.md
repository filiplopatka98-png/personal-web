---
title: "Custom Post Types and Taxonomies Without a Plugin: Your Data Model in Code"
date: 2026-10-15
read: 8
tags: ["WordPress"]
excerpt: "Why I register custom post types and taxonomies in code instead of a plugin like CPT UI — a cleaner model, versioned in git, and full control over the REST API."
featured: false
---

Almost every non-trivial WordPress project hits the same wall: "we need a section that's neither a page nor a blog post." Case studies, products, team members, events, recipes. And almost every tutorial at that moment says: install CPT UI and click it together.

I do it differently. I register custom post types (CPTs) and taxonomies **in code**, directly inside a small plugin. Not because I'm allergic to clicking, but because the data model is far too important to live in the database, outside version control. Let's break it down.

## Why not CPT UI

CPT UI is a fine tool, and for a quick prototype I won't even judge you for it. The problem is what happens next. A CPT's configuration lives in `wp_options` in the database. That means:

- **It's not in version control.** Between local, staging, and production, the data model drifts. Production has the archive turned on, staging doesn't, and nobody knows why.
- **You can't really review it.** A change to a slug or `show_in_rest` shows up in a git diff. A change made in the admin via CPT UI is invisible to everyone.
- **It's yet another plugin.** In practice I regularly see sites with 25+ plugins, half of them these little "helpers." Every plugin is attack surface plus overhead on every request.

Meanwhile, registration in code is a handful of lines. The official docs handle it with [`register_post_type()`](https://developer.wordpress.org/reference/functions/register_post_type/), which has been in WordPress core since version 2.9. You don't need a plugin — you just need the right place to put the code.

## Where the code belongs: a mini-plugin, not functions.php

This is the hill I'll die on: **never put CPTs in your theme's `functions.php`.** When the client swaps themes a year later, they lose the entire data model — the post types stop being registered and their case studies "vanish" (the data stays in the DB, it just isn't displayed). The data model isn't a presentation concern; it belongs in a plugin.

A single file in `wp-content/plugins/project-core/project-core.php` is enough:

```php
<?php
/**
 * Plugin Name: Project Core
 * Description: Data model — CPTs and taxonomies.
 */

declare( strict_types = 1 );

add_action( 'init', 'projekt_register_post_types' );

function projekt_register_post_types(): void {
	register_post_type( 'realizacia', [
		'labels'       => [
			'name'          => 'Case studies',
			'singular_name' => 'Case study',
			'add_new_item'  => 'Add case study',
		],
		'public'       => true,
		'has_archive'  => true,
		'menu_icon'    => 'dashicons-portfolio',
		'supports'     => [ 'title', 'editor', 'thumbnail', 'excerpt' ],
		'show_in_rest' => true,
		'rewrite'      => [ 'slug' => 'case-studies' ],
	] );
}
```

Important details to watch, because the API requires them:

- **Register on the `init` hook, not earlier.** The docs say it explicitly: post type registration must not be hooked before the `init` action. Any earlier and WordPress doesn't have its environment ready.
- **The post type key maxes out at 20 characters**, lowercase letters, numbers, dashes, and underscores only. Also avoid core's reserved keys (`post`, `page`, `attachment`, `revision`…).
- **`show_in_rest => true` is not optional.** The block editor (Gutenberg) runs on the REST API, so without this flag your CPT still registers but edits in the old Classic editor. This is the single most common mistake I see in other people's code.

## Taxonomies: categories for your own content

A taxonomy is how you sort content. WordPress ships with two — categories (hierarchical) and tags (flat). For custom content you build your own with [`register_taxonomy()`](https://developer.wordpress.org/reference/functions/register_taxonomy/).

The key decision is `hierarchical`: `true` behaves like categories (parent–child, checkboxes), `false` like tags (flat, free-form adding). For "case study type" or "location" you usually want hierarchical.

```php
add_action( 'init', 'projekt_register_taxonomies' );

function projekt_register_taxonomies(): void {
	register_taxonomy( 'typ-realizacie', [ 'realizacia' ], [
		'labels'            => [
			'name'          => 'Case study types',
			'singular_name' => 'Case study type',
		],
		'hierarchical'      => true,
		'show_in_rest'      => true,
		'show_admin_column' => true,
		'rewrite'           => [ 'slug' => 'type' ],
	] );
}
```

Three parameters that make the practical difference:

- **`show_in_rest => true`** — exactly like the CPT. Without it, the taxonomy panel in the block editor sidebar won't show up at all, because Gutenberg pulls it over REST.
- **`show_admin_column => true`** — adds a column to the post list in the admin. A small thing that saves the client a lot of clicking when they filter content.
- **The taxonomy key maxes out at 32 characters** (more than a CPT), same character rules.

Registration order isn't critical — what matters is that both run on `init`. You declare the link between a CPT and a taxonomy via the second argument of `register_taxonomy()` (an array of post types). If you register the taxonomy before the CPT, you can add `register_taxonomy_for_object_type()` to be safe.

## Rewrite rules: the one thing that will bite you

This is a classic everyone burns on. After adding a CPT or a taxonomy with a custom `rewrite` slug, you get a **404** on the new URLs even though the content exists. WordPress caches its URL rewrite rules and won't register the new ones on its own.

The quick fix during development: in the admin go to *Settings → Permalinks* and hit Save. You change nothing — you just force a recompute of the rules.

Don't hardcode that into production, though. `flush_rewrite_rules()` is an expensive operation and you should **never** call it on every request (in `init`). The right place is the plugin's activation hook — it runs once, on activation:

```php
register_activation_hook( __FILE__, function (): void {
	projekt_register_post_types();
	projekt_register_taxonomies();
	flush_rewrite_rules();
} );
```

Notice that inside the activation hook you have to register the CPT and taxonomies first — at that moment `init` hasn't fired yet, so otherwise there'd be nothing to recompute the rules from.

## Keep the model readable for AI and REST clients too

One more argument for code. When the data model is declarative and in version control, you can build on it sensibly. `show_in_rest => true` opens the `/wp-json/wp/v2/realizacia` endpoint, which you use as a backend for a [Next.js frontend over the WP REST API](/en/blog/wp-rest-api-nextjs/) or for a [headless WooCommerce setup](/en/blog/headless-woo-nextjs-kedy/). You'll never achieve that as cleanly with configuration clicked together in the admin.

And once you have a CPT, you'll almost always want custom fields on it. It pays to decide on the tooling up front — a comparison of [ACF Pro, Meta Box, and native fields](/en/blog/acf-vs-metabox-vs-cf/) saves you a bad decision that's hard to walk back later. And if your plugin count has gotten out of hand, consolidating into your own core plugin like this is exactly what helps with a [plugin diet](/en/blog/plugin-dieta-z-28-na-9/).

## Wrapping up

Custom post types and taxonomies without a plugin aren't about saving one CPT UI install. They're about the fact that **the data model belongs in code** — versioned, reviewable, consistent across environments. A few dozen lines in a mini-plugin buy you control you can never get by clicking in the admin. Register on `init`, don't forget `show_in_rest`, flush rewrite rules only on activation — and you have a clean foundation that's easy to build on.
