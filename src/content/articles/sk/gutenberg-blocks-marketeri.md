---
title: "Custom Gutenberg blocks pre marketérov, ktorí nepoznajú HTML"
date: 2026-02-04
read: 7
tags: ["WordPress", "UX"]
excerpt: "Ako dať marketing tímu možnosť stavať landing pages bez kódu. ACF Blocks, Block Patterns, Block Locking pre brand integrity, Reusable Blocks pre globálne CTAs."
featured: false
---

Marketing manažérka eshopu mi minulý mesiac napísala: "Filip, môžeme prosím spraviť tých 8 landing pages na Black Friday bez tvojho zásahu? Každý raz potrebujeme tvoj čas a my sme v strese." Fér požiadavka. Akurát si to vyžadovalo posunúť myslenie z "ja mu poskladám stránku" na "dám mu LEGO stavebnicu".

Tu je presný setup, ktorý funguje. Tím predtým nevedel HTML, dnes si stavajú kompletné kampaňové landing pages bez môjho dotyku.

## Cieľ — čo má vedieť non-tech marketér

Realisticky:

- pridať/odobrať sekcie (hero, USP grid, testimonials, CTA)
- meniť texty, nadpisy, obrázky
- meniť pozadie sekcie z preset palety
- pridať novú stránku v sieti šablón

Realisticky **nemá vedieť**:

- meniť padding/margin v px
- pridávať vlastné CSS triedy
- meniť globálne typography
- mazať brand-critical sekcie (footer, header)

Toto rozdelenie ti dá hranice návrhu. Všetko, čo nepatrí do prvej kategórie, sa dá zamknúť alebo skryť.

## 1. ACF Blocks — chrbát celého systému

Native Gutenberg blocks sú v Reactu. Pre marketing-friendly stavebnicu by si potreboval mať React dev neustále po ruke. Ja idem cez **ACF Blocks** — definujem block v PHP, render template je obyčajný PHP, edit interface je auto-generovaný formulár z ACF fields.

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

A v `blocks/hero/hero.php`:

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

ACF fields pre block: `headline` (text), `subheadline` (textarea), `cta_text` (text), `cta_url` (url), `background_image` (image), `color_theme` (select s dvomi voľbami: `dark` / `light`).

Marketér v Gutenbergu pridá block "Hero sekcia", uvidí formulár, vyplní polia, vidí preview. Žiadny HTML. Žiadny CSS. Žiadne padding nights.

Dôležité: **obmedzené možnosti farby**. Namiesto color picker poskytni `select` s 3-4 brand farbami. Marketing inak vyberie ružovú do dark theme firmy.

## 2. Block Patterns — pre-skladané sekcie

Patterns sú ready-made kompozície blokov. Marketér ich vloží jediným klikom.

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

Patterns category sa dá registrovať tiež:

```php
register_block_pattern_category('firma-patterns', [
    'label' => 'Firma — landing šablóny'
]);
```

Pre Black Friday kampaň som spravil 6 patterns: hero variants, USP grid, testimonial set, FAQ, dual-CTA, footer-form. Marketér ich naskladá za 4 minúty.

## 3. Block Locking — brand integrity

V WP 6.0+ Gutenberg má block locking nativne. Bez toho je problém — marketér z reflexu stlačí Delete na footer block, lebo sa mu nepáčil padding.

```html
<!-- wp:acf/footer {"lock":{"move":true,"remove":true}} /-->
```

Toto v editore zobrazí ikonku zámku. Block sa nedá zmazať ani presunúť. Edit interná polia ostáva otvorený.

Pre kombináciu lock-u celého template-u **+ povolených editovateľných častí**:

```html
<!-- wp:acf/hero {"lock":{"move":true,"remove":true}} /-->
<!-- wp:paragraph {"templateLock":false} -->
<p>Editovateľný popis pod hero...</p>
<!-- /wp:paragraph -->
```

## 4. Reusable Blocks pre globálne CTAs

CTA "Stiahni zadarmo PDF" je v 12 článkoch. Marketing chce zmeniť text na "Získaj checklist". Reusable block (alebo v WP 6.5+ "Synced Patterns") to rieši — zmena na jednom mieste sa propaguje všade.

V Block Editor → vyber blok → "Create pattern → Synced". Block dostane unikátne ID a všetky inštancie sa updatujú spolu.

**Caveat:** Synced pattern nemôže obsahovať dynamický content (post title, ACF fields), iba statický markup. Pre dynamický CTA použi ACF block s globálnym `option_field`.

## 5. Skrytie zbytočných blokov

Marketing nepotrebuje 80 default Gutenberg blokov. Audio, Verse, Cover (predklon ACF Hero) — len mätú. Skry ich:

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

Z 80 blokov sa redukuje na 12. Fokusovanejšie UI, menej omylov.

## 6. Tréning tímu

Po implementácii som natočil **1-hodinový video** (OBS Studio + Notion screen recording):

1. Login do `/wp-admin`
2. Pages → Add New
3. Použiť Pattern (Pattern picker UI)
4. Edit Hero — kde sú ACF polia
5. Pridať Synced CTA
6. Preview, Publish, Schedule
7. Kde nájdeš template starých kampaní (CPT)

Video v Notion s timestampami. Plus 1-page Notion guide so screenshotmi. Nikto sa po roku zatiaľ nespýtal "ako sa robí landing".

## Konkrétny projekt — výsledok

Eshop, 8 landing pages na Black Friday. Pred:
- Marketing pripraví copy + brief 2 dni
- Ja stavím každú stránku 4–6 hodín
- Total: ~40 hodín dev work

Po systéme:
- Marketing pripraví copy + naskladá z patterns
- 1 stránka ~30 minút self-service
- Total dev: 0 hodín, len iniciálny build patterns za ~12 hodín

Návratnosť investície po prvom kampaňovom cykle.

## TL;DR

ACF Blocks pre custom blocks, Block Patterns pre pre-built sekcie, Block Locking pre nepohnuteľné prvky, Synced Patterns pre globálne CTAs, restrict block types pre čisté UI. Plus 1h video tréning. Marketing tím získava autonómiu, ty získavaš čas. Brand ostáva konzistentný, lebo systém ti to vynúti.
