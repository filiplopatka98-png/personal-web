---
title: "Custom Gutenberg Blocks for Marketers Who Don't Know HTML"
date: 2026-02-04
read: 7
tags: ["WordPress", "UX"]
excerpt: "How to give a marketing team the ability to build landing pages without code. ACF Blocks, Block Patterns, Block Locking for brand integrity, and Synced Patterns for global CTAs."
featured: false
---

The marketing manager of an eshop messaged me last month: "Filip, can we please build those 8 Black Friday landing pages without you touching anything? Every single time we need your time and it stresses us out." A fair ask. It just required shifting my thinking from "I'll assemble the page for them" to "I'll hand them a LEGO set."

Here's the exact setup that works. The team didn't know HTML before; today they build complete campaign landing pages without me lifting a finger.

Choosing your custom-fields tool matters here — I've broken that decision down separately in [ACF Pro vs Meta Box vs Custom Fields](/en/blog/acf-vs-metabox-vs-cf/). For this build, ACF Blocks is the backbone.

## The goal — what a non-tech marketer should be able to do

Realistically:

- add/remove sections (hero, USP grid, testimonials, CTA)
- change text, headings, images
- change a section's background from a preset palette
- add a new page in the template network

Realistically they should **not** be able to:

- change padding/margin in px
- add custom CSS classes
- change global typography
- delete brand-critical sections (footer, header)

This split gives you your design boundaries. Anything that doesn't belong in the first bucket can be locked or hidden.

## 1. ACF Blocks — the backbone of the whole system

Native Gutenberg blocks are built in React. For a marketer-friendly building kit you'd need a React developer permanently on call. I go through **ACF Blocks** instead — I define the block in PHP, the render template is plain PHP, and the editing interface is a form auto-generated from ACF fields.

```php
// functions.php alebo MU plugin
acf_register_block_type([
    'name' => 'hero',
    'title' => 'Hero sekcia',
    'description' => 'Veľký nadpis + obrázok pozadia + CTA tlačidlo',
    'category' => 'firma-bloky',
    'icon' => 'cover-image',
    'keywords' => ['hero', 'header', 'banner'],
    'render_template' => 'blocks/hero/hero.php',
    'enqueue_style' => get_template_directory_uri() . '/blocks/hero/hero.css',
    'supports' => [
        'align' => ['full'],
        'mode' => false,
        'jsx' => true,
    ],
]);
```

And in `blocks/hero/hero.php`:

```php
<?php
$headline = get_field('headline');
$subheadline = get_field('subheadline');
$cta_text = get_field('cta_text');
$cta_url = get_field('cta_url');
$bg_image = get_field('background_image');
$theme = get_field('color_theme'); // dark / light
?>

<section class="firma-hero firma-hero--<?php echo esc_attr($theme); ?>"
         style="background-image:url('<?php echo esc_url($bg_image['sizes']['large']); ?>');">
    <div class="firma-hero__inner">
        <h1><?php echo esc_html($headline); ?></h1>
        <?php if ($subheadline): ?>
            <p class="firma-hero__sub"><?php echo esc_html($subheadline); ?></p>
        <?php endif; ?>
        <?php if ($cta_text && $cta_url): ?>
            <a href="<?php echo esc_url($cta_url); ?>" class="firma-btn firma-btn--primary">
                <?php echo esc_html($cta_text); ?>
            </a>
        <?php endif; ?>
    </div>
</section>
```

Note: as of ACF 6.0, `acf_register_block_type()` counts as legacy — new blocks are recommended to be registered via the native WordPress `register_block_type()` with `block.json`. Old blocks keep working, so I'm leaving this here for readability, but on a new project I already go through `block.json`.

ACF fields for the block: `headline` (text), `subheadline` (textarea), `cta_text` (text), `cta_url` (url), `background_image` (image), `color_theme` (select with two options: `dark` / `light`).

In Gutenberg, the marketer adds the "Hero sekcia" block, sees a form, fills in the fields, and gets a preview. No HTML. No CSS. No padding nightmares.

Important: **limit the color options**. Instead of a color picker, hand them a `select` with 3–4 brand colors. Otherwise marketing will pick hot pink for a dark-theme company.

## 2. Block Patterns — pre-assembled sections

Patterns are ready-made compositions of blocks. The marketer inserts one with a single click.

```php
function firma_register_patterns() {
    register_block_pattern(
        'firma/landing-cta-block',
        [
            'title' => 'Landing — CTA blok s pozadím',
            'description' => 'Centered CTA so sub-headline, vhodné na koniec landing page',
            'categories' => ['firma-patterns'],
            'content' => '<!-- wp:acf/hero {"data":{"headline":"Pripravený začať?","cta_text":"Zaregistrovať sa","color_theme":"dark"}} /-->'
                       . '<!-- wp:spacer {"height":"60px"} --><div style="height:60px" aria-hidden="true" class="wp-block-spacer"></div><!-- /wp:spacer -->',
        ]
    );
}
add_action('init', 'firma_register_patterns');
```

The pattern category can be registered too:

```php
register_block_pattern_category('firma-patterns', [
    'label' => 'Firma — landing šablóny'
]);
```

For the Black Friday campaign I built 6 patterns: hero variants, USP grid, a testimonial set, FAQ, a dual-CTA, and a footer-form. The marketer stacks them up in 4 minutes.

## 3. Block Locking — brand integrity

Block locking has been native to Gutenberg since WP 5.9 (the visual controls in the editor arrived in 6.0). Without it you've got a problem — the marketer reflexively hits Delete on the footer block because they didn't like the padding.

```html
<!-- wp:acf/footer {"lock":{"move":true,"remove":true}} /-->
```

This shows a lock icon in the editor. The block can't be deleted or moved, but editing its fields stays open.

For a combination of locking the whole template **plus allowing editable parts**:

```html
<!-- wp:acf/hero {"lock":{"move":true,"remove":true}} /-->
<!-- wp:paragraph {"templateLock":false} -->
<p>Editovateľný popis pod hero...</p>
<!-- /wp:paragraph -->
```

## 4. Synced Patterns for global CTAs

The "Download the free PDF" CTA lives in 12 articles. Marketing wants to change the text to "Get the checklist." A reusable block (renamed to "Synced Pattern" in WP 6.3) solves this — a change in one place shows up everywhere.

In the Block Editor → select the block → "Create pattern → Synced." The block gets a unique ID and every instance updates together.

**The catch:** a Synced Pattern can't contain dynamic content (post title, ACF fields), only static markup. For a dynamic CTA, use an ACF block with a global `option` field.

## 5. Hiding blocks you don't need

Marketing doesn't need the nearly one hundred default Gutenberg blocks. Audio, Verse, Cover (the predecessor to the ACF Hero) — they just cause confusion. Hide them:

```php
function firma_disable_unused_blocks($allowed_blocks, $editor_context) {
    if (!empty($editor_context->post)) {
        return [
            'core/paragraph',
            'core/heading',
            'core/image',
            'core/list',
            'core/buttons',
            'core/columns',
            'core/spacer',
            'acf/hero',
            'acf/usp-grid',
            'acf/testimonials',
            'acf/cta',
            'acf/faq',
            'acf/footer',
        ];
    }
    return $allowed_blocks;
}
add_filter('allowed_block_types_all', 'firma_disable_unused_blocks', 10, 2);
```

The choice drops from dozens of blocks down to 12. A more focused UI, fewer mistakes. This is the same instinct behind a good [plugin diet](/en/blog/plugin-dieta-z-28-na-9/) — less surface area, less to go wrong.

## 6. Training the team

After the implementation I recorded an **hour-long video** (OBS Studio + a screen recording into Notion):

1. Logging into `/wp-admin`
2. Pages → Add New
3. Using a Pattern (the Pattern picker UI)
4. Editing the Hero — where the ACF fields are
5. Adding a Synced CTA
6. Preview, Publish, Schedule
7. Where to find templates from past campaigns (CPT)

The video lives in Notion with timestamps. Plus a one-page Notion guide with screenshots. Nobody has asked "how do I build a landing page" in a year.

## The actual project — the result

An eshop, 8 Black Friday landing pages. Before:
- Marketing prepares copy + brief: 2 days
- I build each page in 4–6 hours
- Total: ~40 hours of dev work

After the system:
- Marketing prepares copy + stacks it from patterns
- 1 page ~30 minutes self-service
- Dev total: 0 hours, just the initial pattern build at ~12 hours

The investment paid for itself after the first campaign cycle.

## TL;DR

ACF Blocks for custom blocks, Block Patterns for ready-made sections, Block Locking for immovable elements, Synced Patterns for global CTAs, and limiting the block types for a clean UI. Plus an hour of video training. The marketing team gains autonomy, you get your time back. The brand stays consistent because the system enforces it for you.

**Related:** [Choosing a WordPress theme without regrets — 6 criteria](/en/blog/wp-theme-vyber-6-kriterii/) · [The plugin diet: from 28 to 9](/en/blog/plugin-dieta-z-28-na-9/)
