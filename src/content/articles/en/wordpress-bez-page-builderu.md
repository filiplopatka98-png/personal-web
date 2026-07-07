---
title: "WordPress without a page builder: why Elementor mostly just gets in the way"
date: 2026-10-20
read: 8
tags: ["WordPress", "Performance"]
excerpt: "Page builders like Elementor pile divs, CSS, and JS onto every page. Here's why the native block editor is enough in 2026 — and how to build without one."
featured: false
---

Page builders sell one promise: you'll build a site without code. And they deliver on it — right up until someone measures your Core Web Vitals, or until you have to run an update two years later. That's when you find out what all that convenience actually cost. In 2026, WordPress natively does almost everything we once needed Elementor or WPBakery for — and it does it without the bloat. So let's talk about why I build almost exclusively without a page builder, and how.

## What a page builder actually adds to a page

The problem with page builders isn't aesthetic, it's architectural. Elementor and friends run their own layout engine that wraps every section, column, and widget in its own `<div>`s. Those divs carry no semantic value — they exist purely so the builder works.

Here's the number that makes it concrete: for an equivalent layout, the native block editor (Gutenberg) generates roughly three times less HTML and about four times fewer divs than Elementor. On top of that, Elementor loads CSS and JS for **every** possible widget on every page, not just the ones you used — commonly 200–300 KB of CSS plus JS even on a lean template.

Why does it matter? Because the browser has to parse, style, and render every single one of those elements. A larger, more deeply nested DOM shows up directly in Core Web Vitals — specifically in [LCP over 2.5s](/en/blog/lcp-nad-2-5s-pricin/) and in the [cost of third-party and render-blocking scripts](/en/blog/third-party-skripty-vykon/).

## The numbers that decide it

Since 2024, Google grades sites on Core Web Vitals, and the thresholds haven't moved. "Good" means:

- **LCP** under 2.5s (how fast the main content loads)
- **INP** under 200ms (interaction responsiveness — it replaced FID in 2024)
- **CLS** under 0.1 (visual stability)

An important detail: Google measures at the 75th percentile of real visitors. It's not enough that the site feels fast on your MacBook — 75% of visits have to be "good," or the page fails. And in 2026 INP is the most commonly failed metric; per the available data, around 43% of sites still don't meet it. INP is all about JavaScript — and JavaScript is exactly what page builders have to spare.

I'm not saying you can't hit green CWV with Elementor. You can — with critical CSS, deferred JS, DOM reduction, and a cache plugin like WP Rocket, an optimized Elementor site gets under 2.5s. But it's a fight against your own tool, and every builder or add-on update can break that optimization again. That's a maintenance tax you pay forever.

## What native WordPress can do today

The "I can't put it together without a builder" argument no longer holds in 2026. WordPress 7.0 shipped in May 2026, and the block editor (formerly the Gutenberg project) has grown into a full-blown site editor. Full Site Editing, block themes, `theme.json` for design tokens, global styles, patterns, template parts — you click together layout and typography right in the editor, and the output is clean HTML with no wrapper divs.

The key milestone for developers arrived with the Block Bindings API in WordPress 6.5 (April 2024). It lets you connect dynamic data — a custom field, say — directly to the attributes of native blocks (Paragraph, Heading, Button, Image) without a single extra plugin. Exactly what we used to reach for ACF blocks or builder shortcodes to do.

Example — binding a custom field to a paragraph right in the block markup:

```html
<!-- wp:paragraph {
  "metadata": {
    "bindings": {
      "content": {
        "source": "core/post-meta",
        "args": { "key": "price_from" }
      }
    }
  }
} -->
<p>Placeholder, gets replaced by the post-meta value</p>
<!-- /wp:paragraph -->
```

For the field to be available to bindings at all, register it with `show_in_rest`:

```php
add_action('init', function () {
    register_post_meta('page', 'price_from', [
        'type'         => 'string',
        'single'       => true,
        'show_in_rest' => true,
    ]);
});
```

If you need a custom data source (not post-meta), you register it via `register_block_bindings_source()` and supply the value in PHP. No builder frontend JS — just native WordPress.

## How I build a site without a builder

In practice it comes down to a handful of steps worth sticking to.

**1. A block theme, not a classic one.** I start from a clean block theme with `theme.json`. Design decisions — colors, the typographic scale, spacing — live in a single file and stay consistent across the whole site. No "theme options" panel with 400 settings.

```json
{
  "version": 3,
  "settings": {
    "color": {
      "palette": [
        { "slug": "brand", "color": "#0b5", "name": "Brand" },
        { "slug": "ink",   "color": "#111", "name": "Ink" }
      ]
    },
    "typography": {
      "fontSizes": [
        { "slug": "base", "size": "1rem",   "name": "Base" },
        { "slug": "lg",   "size": "1.5rem", "name": "Large" }
      ]
    }
  }
}
```

**2. Patterns instead of cloning sections.** Reusable content blocks (hero, CTA, pricing) I save as patterns. A marketer drops one in and overwrites the text — without ever seeing the HTML. If you need people who don't know code to click together your own blocks, see [custom Gutenberg blocks for marketers](/en/blog/gutenberg-blocks-marketeri/).

**3. Custom post types and taxonomies without a plugin.** Case studies, products, team — all of it you can register in a few lines of code. I walked through the how in [CPTs and taxonomies without a plugin](/en/blog/cpt-taxonomie-bez-pluginu/).

**4. Dynamic content via Block Bindings or native dynamic blocks.** Instead of builder shortcodes you use post-meta bindings or a Query Loop. If you're deciding where to put your custom fields, I compared the options in [ACF Pro vs Meta Box vs Custom Fields](/en/blog/acf-vs-metabox-vs-cf/).

## When a page builder does make sense

So this doesn't come off as dogma — there are cases where I'll defend a builder. If a client wants to visually assemble complex landing pages **themselves**, rebuild the layout from scratch, and nobody on the team will touch code, then Elementor can make sense. The price is performance and maintenance, and you have to say that out loud up front.

Likewise: taking an existing Elementor site and force-porting it into a block theme usually doesn't pencil out. In that case I'd rather optimize what's there — turn on "Optimized DOM Output" and "Optimized Asset Loading," rip out unused widgets and animations, and add caching. But that's firefighting, not a fix.

## The takeaway: convenience now, debt later

A page builder is a loan. You pay for a fast start with it and you service the debt every month in the form of slower pages, a bigger DOM, and brittle updates. In 2026, native WordPress can already build a clean, fast, maintainable site without that loan — block themes, `theme.json`, patterns, and the Block Bindings API cover the vast majority of what we once needed a builder for.

My rule is simple: a builder only when the client will genuinely use it themselves, day to day. In every other case I build without one — and a year later both the site and the client are happier for it. If you already have a builder on the site and performance is the problem, start with a [plugin diet](/en/blog/plugin-dieta-z-28-na-9/); it's usually the fastest path to a measurable improvement.
