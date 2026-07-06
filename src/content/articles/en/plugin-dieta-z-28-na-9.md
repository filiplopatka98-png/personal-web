---
title: "Plugin diet: from 28 to 9, and the site got 60% faster"
date: 2025-12-18
read: 8
tags: ["WordPress", "Performance"]
excerpt: "A plugin audit on a production WP site. From 28 active plugins down to 9, PageSpeed mobile 32 → 78, TTFB 1.2s → 480ms. Concrete replacements with code in functions.php."
featured: false
---

Plugins are the easiest way to add functionality to WordPress. And the easiest way to wreck it. A client from the B2B space recently brought me a site with PageSpeed mobile **32**, a TTFB of **1.2 seconds**, and a JS payload of **612 KB**. After the plugin audit: **from 28 down to 9**, with zero loss of functionality. PageSpeed **78**, TTFB **480 ms**. Here's the method and the concrete replacements.

## Step 1: list every plugin and its purpose

First, the list. Every single plugin, no exceptions — what it does and why it was installed. If nobody knows why it's there, it's the first candidate for the chopping block.

I run `wp plugin list --format=csv > plugins.csv` through WP-CLI and build a table:

| Plugin | Purpose | Frontend impact | Verdict |
|---|---|---|---|
| Yoast SEO Premium | SEO meta, sitemap | 18 KB JS + admin bloat | Replace |
| Smush Pro | Image compression | 0 KB FE, admin only | Replace |
| Contact Form 7 | Form | 35 KB JS + 12 KB CSS | Replace |
| WP Mail SMTP | SMTP routing | 0 KB FE | Keep |
| WooCommerce | Store | core | Keep |
| WPBakery | Page builder | 240 KB JS + 60 KB CSS | **DELETE** |
| Slider Revolution | Slider | 180 KB JS | **DELETE** |
| ... | ... | ... | ... |

Each plugin lands in one of three buckets:

- **Essential** — the site doesn't work without it (WooCommerce, WP Mail SMTP, ACF Pro).
- **Replaceable** — the functionality can be replaced with 30 lines in `functions.php`.
- **Dead** — nobody knows what it's for, or it's a duplicate (3 SEO plugins?).

## Step 2: dead weight — delete immediately

The audit flushed out 8 plugins with no replacement needed:

- **Hello Dolly** (the default, completely unused).
- **Akismet** (unused, no comments).
- 2× SEO plugins that duplicated Yoast.
- A social sharing plugin (it rendered icons nobody clicked — an A/B test showed 0% impact).
- A page builder that had been replaced by Gutenberg a year earlier but stuck around.
- Two analytics plugins (a GA4 plugin + a Tag Manager plugin — one is enough).
- A "WP Maintenance" plugin nobody used.

Delete: **−8 plugins, −180 KB JS, −50 KB CSS.** No replacement, no work.

## Step 3: replaceable — move the functionality into code

This is the heart of the plugin diet. 11 plugins replaced with 200 lines of code in `functions.php` (or in a standalone mu-plugin for cleaner versioning).

### Replacing Yoast SEO (18 KB JS + 80 MB of DB tables)

Yoast is an excellent plugin, but the client doesn't use 90% of its features (readability score, breadcrumbs, content analysis) at all. What they actually need: meta title, meta description, og: tags, canonical URL, and a basic sitemap.

```php
// functions.php — basic SEO meta tags
add_action('wp_head', function() {
  if (is_singular()) {
    $desc = get_post_meta(get_the_ID(), '_meta_description', true)
            ?: wp_trim_words(get_the_excerpt(), 30, '...');
    $title = get_the_title() . ' | ' . get_bloginfo('name');
    $url = get_permalink();
    $img = get_the_post_thumbnail_url(null, 'large') ?: get_template_directory_uri() . '/og-default.jpg';

    echo '<title>' . esc_html($title) . '</title>';
    echo '<meta name="description" content="' . esc_attr($desc) . '">';
    echo '<link rel="canonical" href="' . esc_url($url) . '">';
    echo '<meta property="og:title" content="' . esc_attr($title) . '">';
    echo '<meta property="og:description" content="' . esc_attr($desc) . '">';
    echo '<meta property="og:image" content="' . esc_url($img) . '">';
    echo '<meta property="og:url" content="' . esc_url($url) . '">';
    echo '<meta property="og:type" content="article">';
    echo '<meta name="twitter:card" content="summary_large_image">';
  }
}, 5);

// ACF field for a custom meta description
// (or a classic meta_box if you don't have ACF)
```

Sitemap: WP core has a built-in `wp-sitemap.xml` since version 5.5. No plugin needed. 30 lines + the native sitemap = the equivalent of Yoast SEO Free for 95% of cases. If you want to go deeper here, see my [technical SEO checklist that actually moves the needle](/en/blog/seo-checklist-co-pomaha/).

### Replacing Smush (image compression)

Server-side conversion to WebP straight through the `image_make_intermediate_size` filter:

```php
add_filter('image_make_intermediate_size', function($filename) {
  if (!function_exists('imagewebp')) return $filename;

  $info = pathinfo($filename);
  $ext = strtolower($info['extension'] ?? '');
  if (!in_array($ext, ['jpg', 'jpeg', 'png'])) return $filename;

  $webp = $info['dirname'] . '/' . $info['filename'] . '.webp';

  if ($ext === 'png') {
    $img = imagecreatefrompng($filename);
  } else {
    $img = imagecreatefromjpeg($filename);
  }

  imagewebp($img, $webp, 82);
  imagedestroy($img);

  return $filename;
});

// In .htaccess — rewrite .jpg/.png → .webp for browsers that support WebP
```

For AVIF: PHP 8.1+ ships `imageavif()` natively. If your server supports it, you can compress even more aggressively.

### Replacing Contact Form 7 (35 KB JS + 12 KB CSS)

CF7 is a dinosaur. A native HTML form + a simple PHP handler:

```php
// 30 lines for a contact form
add_action('admin_post_nopriv_contact_send', 'handle_contact');
add_action('admin_post_contact_send', 'handle_contact');

function handle_contact() {
  if (!wp_verify_nonce($_POST['_nonce'], 'contact_form')) wp_die('Invalid');

  $name = sanitize_text_field($_POST['name'] ?? '');
  $email = sanitize_email($_POST['email'] ?? '');
  $msg = sanitize_textarea_field($_POST['message'] ?? '');

  if (!$name || !is_email($email) || !$msg) {
    wp_redirect(add_query_arg('contact', 'error', wp_get_referer()));
    exit;
  }

  $sent = wp_mail(
    get_option('admin_email'),
    'Kontakt z webu: ' . $name,
    "Od: $name <$email>\n\n$msg",
    'Reply-To: ' . $email
  );

  wp_redirect(add_query_arg('contact', $sent ? 'ok' : 'error', wp_get_referer()));
  exit;
}
```

```html
<form method="POST" action="<?= admin_url('admin-post.php') ?>">
  <input type="hidden" name="action" value="contact_send">
  <?php wp_nonce_field('contact_form', '_nonce'); ?>
  <input name="name" required>
  <input name="email" type="email" required>
  <textarea name="message" required></textarea>
  <button type="submit">Odoslať</button>
</form>
```

Bonus: the browser handles native HTML5 validation, no JS required. Spam: Cloudflare Turnstile (free) via a 5-line widget.

## Step 4: essential — the survivors

After the audit, 9 plugins remained:

1. WooCommerce (the store core).
2. WP Mail SMTP (SMTP routing).
3. WP Rocket (page cache).
4. ACF Pro (custom fields, used everywhere).
5. Stripe Payments for WooCommerce (payment gateway).
6. WooCommerce Slovak language pack (localization).
7. Two-Factor (2FA for admin).
8. Limit Login Attempts Reloaded (security).
9. A custom plugin (client business logic).

All genuinely critical to keeping things running. No "nice to haves," no duplicates. The last two are part of the minimum set I keep on every install — more on that in [the WP security minimum that actually protects you in 2026](/en/blog/wp-bezpecnost-2026/).

## Metrics before and after

Identical server, identical content — only the plugin set changed:

| Metric | Before (28 plug.) | After (9 plug.) |
|---|---|---|
| PageSpeed mobile | 32 | 78 |
| LCP (mobile) | 4.2 s | 1.9 s |
| TBT | 1,480 ms | 380 ms |
| TTFB | 1.2 s | 480 ms |
| JS payload (initial) | 612 KB | 198 KB |
| CSS payload | 240 KB | 85 KB |
| MySQL queries / page | 124 | 38 |
| WP admin load | 4.8 s | 1.6 s |

The site got **60% faster by PageSpeed score**, but the more practical metrics (LCP, TTFB) improved too — by 55 to 60%. If LCP is still your bottleneck after a diet like this, it's usually one of a handful of usual suspects — see [LCP over 2.5s? the 7 most common causes in practice](/en/blog/lcp-nad-2-5s-pricin/). Store conversion climbed **18%** the following month (from 1.4% to 1.65%) — a measurable bump in revenue.

## The plugin diet as a monthly ritual

After the one-time audit, ask three questions of **every** new plugin:

1. **Frontend impact?** — check `view-source` after activation. Did it add a `<script>` or `<link>`? How many KB?
2. **Is there a native alternative?** — contact form, SEO meta, image compression, share buttons — all of it can be solved in 30 to 80 lines of code.
3. **Is it actively maintained?** — wordpress.org/plugins → "Last updated" and "Tested with." If the last update is more than a year old, forget it.

A monthly check via Plugins → Installed, sorted by "Last update" — you'll spot a plugin's end of life immediately.

## TL;DR

The plugin diet isn't about minimalism for its own sake. It's about the fact that you pay for every plugin three times over: for the install, for the frontend bytes, and for the update overhead. If you can replace the functionality with 30 lines in `functions.php`, do it. Real-world impact on a production WP shop: **PageSpeed 32 → 78, JS payload −68%, conversion +18%**. The best plugin is the one you never installed.

Related: [INP under 200ms on WordPress — what actually helped](/en/blog/inp-pod-200ms-wordpress/).
