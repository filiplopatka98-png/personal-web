---
title: "Plugin diéta: z 28 na 9 a web zrýchlel o 60 %"
date: 2025-12-18
read: 8
tags: ["WordPress", "Performance"]
excerpt: "Audit pluginov na produkčnom WP. Z 28 aktívnych ostalo 9, PageSpeed mobile 32 → 78, TTFB 1.2s → 480ms. Konkrétne náhrady kódom v functions.php."
featured: false
---

Pluginy sú najjednoduchšia cesta ako pridať funkcionalitu do WordPressu. A najjednoduchšia cesta ako WordPress zničiť. Klient z B2B segmentu mi nedávno priniesol web s PageSpeed mobile **32**, TTFB **1.2 sekundy** a JS payload **612KB**. Po audite pluginov: **z 28 na 9**, bez straty funkcionality. PageSpeed **78**, TTFB **480ms**. Tu je metóda a konkrétne náhrady.

## Krok 1: zoznam všetkých pluginov + ich účel

Najprv zoznam. Bez výnimky každý plugin, čo robí, prečo bol nainštalovaný. Ak nikto nevie prečo tam je, prvá kandidatúra na vyhodenie.

Spustím `wp plugin list --format=csv > plugins.csv` cez WP-CLI a spravím tabuľku:

| Plugin | Účel | Frontend impact | Verdict |
|---|---|---|---|
| Yoast SEO Premium | SEO meta, sitemap | 18KB JS + admin bloat | Replace |
| Smush Pro | Image kompresia | 0KB FE, admin only | Replace |
| Contact Form 7 | Formulár | 35KB JS + 12KB CSS | Replace |
| WP Mail SMTP | SMTP routing | 0KB FE | Keep |
| WooCommerce | Eshop | core | Keep |
| WPBakery | Page builder | 240KB JS + 60KB CSS | **DELETE** |
| Slider Revolution | Slider | 180KB JS | **DELETE** |
| ... | ... | ... | ... |

Plugin sa zaradí do troch kategórií:

- **Essential** — bez tohoto stránka nefunguje (WooCommerce, WP Mail SMTP, ACF Pro)
- **Replaceable** — funkcionalita sa dá nahradiť 30 riadkami v `functions.php`
- **Dead** — nikto nevie načo to tam je, alebo dvojnásobnosť (3 SEO pluginy?)

## Krok 2: Dead — okamžite delete

V audite letelo 8 pluginov bez náhrady:

- **Hello Dolly** (default, totally unused)
- **Akismet** (bol unused, žiadne komentáre)
- 2× SEO pluginy ktoré dublovali Yoast
- Plugin pre social sharing (zobrazoval ikonky ktoré nikto neklikal — A/B test ukázal 0 % impact)
- Page builder ktorý bol nahradený Gutenberg-om pred rokom, ale ostal
- Dva analytics pluginy (GA4 plugin + Tag Manager plugin — stačí jeden)
- "WP Maintenance" plugin ktorý nikto nepoužíval

Delete: **-8 pluginov, -180KB JS, -50KB CSS**. Bez náhrady, bez práce.

## Krok 3: Replaceable — funkcionalita do kódu

Toto je jadro plugin diéty. 11 pluginov nahradených 200 riadkami kódu v `functions.php` (alebo v custom mu-plugin pre čistejšie versioning).

### Náhrada Yoast SEO (18KB JS + 80MB DB tables)

Yoast je excelentný plugin, ale 90 % jeho features (readability score, breadcrumbs, content analysis) klient vôbec nepoužíva. Reálne potrebuje: meta title, meta description, og:tags, canonical URL, basic sitemap.

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

// ACF field pre custom meta description
// (alebo classic meta_box ak nemáš ACF)
```

Sitemap: WP core má built-in `wp-sitemap.xml` od verzie 5.5. Žiadny plugin netreba. 30 riadkov + native sitemap = ekvivalent Yoast SEO Free pre 95 % use cases.

### Náhrada Smush (image kompresia)

Server-side WebP konverzia priamo v `image_make_intermediate_size` filter:

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

// V .htaccess — rewrite .jpg/.png → .webp pre WebP-capable browsers
```

Pre prácu s AVIF: PHP 8.1+ má `imageavif()` natívne. Ak server podporuje, ešte agresívnejšie kompresie.

### Náhrada Contact Form 7 (35KB JS + 12KB CSS)

CF7 je dinosaur. Native HTML form + jednoduchý PHP handler:

```php
// 30 riadkov pre kontaktný formulár
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

Bonus: native HTML5 validáciu robí browser, žiadny JS netreba. Spam: Cloudflare Turnstile (free) cez 5-riadkový widget.

## Krok 4: Essential — ostali

Po audite ostalo 9 pluginov:

1. WooCommerce (eshop core)
2. WP Mail SMTP (SMTP routing)
3. WP Rocket (page cache)
4. ACF Pro (custom fields, používané všade)
5. Stripe Payments for WooCommerce (platobná brána)
6. WooCommerce Slovak language pack (lokalizácia)
7. Two-Factor (2FA pre admin)
8. Limit Login Attempts Reloaded (security)
9. Custom plugin (klient-špecifické business logic)

Všetko reálne kritické pre fungovanie. Žiadny "nice to have", žiadny duplicate.

## Pred / po metriky

Identický server, identický obsah, len plugin set sa zmenil:

| Metrika | Pred (28 plug) | Po (9 plug) |
|---|---|---|
| PageSpeed mobile | 32 | 78 |
| LCP (mobile) | 4.2 s | 1.9 s |
| TBT | 1 480 ms | 380 ms |
| TTFB | 1.2 s | 480 ms |
| JS payload (initial) | 612 KB | 198 KB |
| CSS payload | 240 KB | 85 KB |
| MySQL queries / page | 124 | 38 |
| WP admin load | 4.8 s | 1.6 s |

Web zrýchlel o **60 % po PageSpeed score**, ale praktickejšie metriky (LCP, TTFB) sa zlepšili o 55–60 % tiež. Konverzia v eshope stúpla v ďalšom mesiaci o **18 %** (z 1.4 % na 1.65 %) — measurable revenue increase.

## Plugin diéta ako mesačný ritual

Po jednorazovom audite si nastav tri otázky pri **každom** novom plugin:

1. **Frontend impact?** — pozri si `view-source` po aktivácii. Pridal nejaký `<script>` alebo `<link>`? Koľko KB?
2. **Existuje natívna alternatíva?** — kontaktný formulár, SEO meta, image kompresia, share buttony — všetko sa dá v 30–80 riadkoch kódu.
3. **Aktívne udržiavaný?** — wordpress.org/plugins → "Last updated" a "Tested with". Ak posledný update je > 1 rok, zabudni.

Mesačná kontrola Plugin → Installed → triediť podľa "Last update" — koniec života pluginu vidíš okamžite.

## TL;DR

Plugin diéta nie je o minimalisme za každú cenu. Je o tom, že každý plugin platíš trikrát: za inštaláciu, za frontend bytes, za update overhead. Ak môžeš funkcionalitu nahradiť 30 riadkami v `functions.php`, urob to. Reálny dopad na produkčný WP shop: **PageSpeed 32 → 78, JS payload -68 %, konverzia +18 %**. Najlepší plugin je ten, ktorý si nainštaloval.
