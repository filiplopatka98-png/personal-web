---
title: "Plugin diéta: z 28 na 9 a web zrýchlel o 60 %"
date: 2025-12-18
read: 8
tags: ["WordPress", "Performance"]
excerpt: "Audit pluginov na produkčnom WP. Z 28 aktívnych ostalo 9, PageSpeed mobile 32 → 78, TTFB 1,2 s → 480 ms. Konkrétne náhrady kódom v functions.php."
featured: false
---

Pluginy sú najjednoduchšia cesta, ako pridať do WordPressu funkcionalitu. A najjednoduchšia cesta, ako WordPress zničiť. Klient z B2B segmentu mi nedávno priniesol web s PageSpeed mobile **32**, TTFB **1,2 sekundy** a JS payloadom **612 KB**. Po audite pluginov: **z 28 na 9**, bez straty funkcionality. PageSpeed **78**, TTFB **480 ms**. Tu je metóda a konkrétne náhrady.

## Krok 1: zoznam všetkých pluginov a ich účel

Najprv zoznam. Bez výnimky každý plugin — čo robí a prečo bol nainštalovaný. Ak nikto nevie, prečo tam je, je to prvý kandidát na vyhodenie.

Cez WP-CLI spustím `wp plugin list --format=csv > plugins.csv` a spravím tabuľku:

| Plugin | Účel | Frontend dopad | Verdikt |
|---|---|---|---|
| Yoast SEO Premium | SEO meta, sitemap | 18 KB JS + admin bloat | Nahradiť |
| Smush Pro | Kompresia obrázkov | 0 KB FE, len admin | Nahradiť |
| Contact Form 7 | Formulár | 35 KB JS + 12 KB CSS | Nahradiť |
| WP Mail SMTP | SMTP routing | 0 KB FE | Ponechať |
| WooCommerce | Eshop | core | Ponechať |
| WPBakery | Page builder | 240 KB JS + 60 KB CSS | **ZMAZAŤ** |
| Slider Revolution | Slider | 180 KB JS | **ZMAZAŤ** |
| ... | ... | ... | ... |

Plugin sa zaradí do jednej z troch kategórií:

- **Nevyhnutný** — bez tohto stránka nefunguje (WooCommerce, WP Mail SMTP, ACF Pro).
- **Nahraditeľný** — funkcionalita sa dá nahradiť 30 riadkami v `functions.php`.
- **Mŕtvy** — nikto nevie, načo tam je, alebo je zdvojený (3 SEO pluginy?).

## Krok 2: mŕtve — okamžite zmazať

V audite vyletelo 8 pluginov bez náhrady:

- **Hello Dolly** (predvolený, úplne nepoužívaný).
- **Akismet** (nepoužívaný, žiadne komentáre).
- 2× SEO pluginy, ktoré dublovali Yoast.
- Plugin na social sharing (zobrazoval ikonky, ktoré nikto neklikal — A/B test ukázal 0 % dopad).
- Page builder, ktorý bol pred rokom nahradený Gutenbergom, ale ostal.
- Dva analytické pluginy (GA4 plugin + Tag Manager plugin — stačí jeden).
- Plugin „WP Maintenance“, ktorý nikto nepoužíval.

Zmazať: **−8 pluginov, −180 KB JS, −50 KB CSS**. Bez náhrady, bez práce.

## Krok 3: nahraditeľné — funkcionalita do kódu

Toto je jadro plugin diéty. 11 pluginov nahradených 200 riadkami kódu v `functions.php` (alebo v samostatnom mu-plugine pre čistejšie verziovanie).

### Náhrada Yoast SEO (18 KB JS + 80 MB DB tabuliek)

Yoast je excelentný plugin, ale 90 % jeho funkcií (readability score, breadcrumbs, content analysis) klient vôbec nepoužíva. Reálne potrebuje: meta title, meta description, og:tagy, canonical URL a základnú sitemapu.

```php
// functions.php — základné SEO meta tagy
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

// ACF pole pre custom meta description
// (alebo klasický meta_box, ak nemáš ACF)
```

Sitemapa: WP core má vstavaný `wp-sitemap.xml` od verzie 5.5. Žiadny plugin netreba. 30 riadkov + natívna sitemapa = ekvivalent Yoast SEO Free pre 95 % prípadov.

### Náhrada Smush (kompresia obrázkov)

Server-side konverzia do WebP priamo cez filter `image_make_intermediate_size`:

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

// V .htaccess — rewrite .jpg/.png → .webp pre prehliadače, ktoré WebP podporujú
```

Pre prácu s AVIF: PHP 8.1+ má funkciu `imageavif()` natívne. Ak ju server podporuje, dá sa komprimovať ešte agresívnejšie.

### Náhrada Contact Form 7 (35 KB JS + 12 KB CSS)

CF7 je dinosaurus. Natívny HTML formulár + jednoduchý PHP handler:

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

Bonus: natívnu HTML5 validáciu spraví prehliadač, žiadny JS netreba. Spam: Cloudflare Turnstile (zadarmo) cez 5-riadkový widget.

## Krok 4: nevyhnutné — ostali

Po audite ostalo 9 pluginov:

1. WooCommerce (jadro eshopu).
2. WP Mail SMTP (SMTP routing).
3. WP Rocket (page cache).
4. ACF Pro (custom polia, používané všade).
5. Stripe Payments for WooCommerce (platobná brána).
6. WooCommerce Slovak language pack (lokalizácia).
7. Two-Factor (2FA pre admin).
8. Limit Login Attempts Reloaded (bezpečnosť).
9. Vlastný plugin (klientská business logika).

Všetko reálne kritické pre fungovanie. Žiadny „nice to have“, žiadny duplikát.

## Metriky pred a po

Identický server, identický obsah, zmenila sa len sada pluginov:

| Metrika | Pred (28 plug.) | Po (9 plug.) |
|---|---|---|
| PageSpeed mobile | 32 | 78 |
| LCP (mobile) | 4,2 s | 1,9 s |
| TBT | 1 480 ms | 380 ms |
| TTFB | 1,2 s | 480 ms |
| JS payload (initial) | 612 KB | 198 KB |
| CSS payload | 240 KB | 85 KB |
| MySQL queries / stránka | 124 | 38 |
| Načítanie WP adminu | 4,8 s | 1,6 s |

Web zrýchlil o **60 % podľa PageSpeed skóre**, ale praktickejšie metriky (LCP, TTFB) sa zlepšili tiež — o 55 až 60 %. Konverzia v eshope stúpla v ďalšom mesiaci o **18 %** (z 1,4 % na 1,65 %) — merateľný nárast tržieb.

## Plugin diéta ako mesačný rituál

Po jednorazovom audite si pri **každom** novom plugine polož tri otázky:

1. **Frontend dopad?** — pozri si `view-source` po aktivácii. Pridal nejaký `<script>` alebo `<link>`? Koľko KB?
2. **Existuje natívna alternatíva?** — kontaktný formulár, SEO meta, kompresia obrázkov, share buttony — všetko sa dá vyriešiť v 30 až 80 riadkoch kódu.
3. **Je aktívne udržiavaný?** — wordpress.org/plugins → „Last updated“ a „Tested with“. Ak je posledný update starší ako rok, zabudni naň.

Mesačná kontrola cez Pluginy → Nainštalované, triedenie podľa „Last update“ — koniec života pluginu vidíš okamžite.

## TL;DR

Plugin diéta nie je o minimalizme za každú cenu. Je o tom, že za každý plugin platíš trikrát: za inštaláciu, za frontend bajty a za réžiu updatov. Ak môžeš funkcionalitu nahradiť 30 riadkami v `functions.php`, urob to. Reálny dopad na produkčný WP shop: **PageSpeed 32 → 78, JS payload −68 %, konverzia +18 %**. Najlepší plugin je ten, ktorý si nenainštaloval.
