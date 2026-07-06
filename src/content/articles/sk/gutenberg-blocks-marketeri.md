---
title: "Custom Gutenberg blocks pre marketérov, ktorí nepoznajú HTML"
date: 2026-02-04
read: 7
tags: ["WordPress", "UX"]
excerpt: "Ako dať marketingovému tímu možnosť stavať landing pages bez kódu. ACF Blocks, Block Patterns, Block Locking pre brand integritu a Synced Patterns pre globálne CTA."
featured: false
---

Marketingová manažérka eshopu mi minulý mesiac napísala: „Filip, môžeme prosím spraviť tých 8 landing pages na Black Friday bez tvojho zásahu? Zakaždým potrebujeme tvoj čas a sme v strese.“ Férová požiadavka. Akurát si vyžadovala posunúť myslenie z „ja im poskladám stránku“ na „dám im LEGO stavebnicu“.

Tu je presný setup, ktorý funguje. Tím predtým nevedel HTML, dnes si stavia kompletné kampaňové landing pages bez môjho dotyku.

Výber nástroja na custom polia tu rozhoduje — tú voľbu som rozobral zvlášť v [ACF Pro vs Meta Box vs Custom Fields](/blog/acf-vs-metabox-vs-cf/). Pre tento build je chrbticou ACF Blocks.

## Cieľ — čo má vedieť non-tech marketér

Realisticky:

- pridať/odobrať sekcie (hero, USP grid, testimonials, CTA)
- meniť texty, nadpisy, obrázky
- meniť pozadie sekcie z preset palety
- pridať novú stránku v sieti šablón

Realisticky **nemá vedieť**:

- meniť padding/margin v px
- pridávať vlastné CSS triedy
- meniť globálnu typografiu
- mazať brand-critical sekcie (footer, header)

Toto rozdelenie ti dá hranice návrhu. Všetko, čo nepatrí do prvej kategórie, sa dá zamknúť alebo skryť.

## 1. ACF Blocks — chrbtica celého systému

Natívne Gutenberg blocks sú v Reacte. Pre stavebnicu prívetivú k marketérom by si potreboval mať React vývojára neustále po ruke. Ja idem cez **ACF Blocks** — blok zadefinujem v PHP, render template je obyčajné PHP a editačné rozhranie je auto-generovaný formulár z ACF polí.

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

Pozn.: `acf_register_block_type()` od ACF 6.0 platí za legacy — nové bloky sa odporúča registrovať cez natívny WordPress `register_block_type()` s `block.json`. Staré bloky fungujú ďalej, tak to tu nechávam pre čitateľnosť, ale v novom projekte už idem cez `block.json`.

ACF polia pre blok: `headline` (text), `subheadline` (textarea), `cta_text` (text), `cta_url` (url), `background_image` (image), `color_theme` (select s dvomi voľbami: `dark` / `light`).

Marketér v Gutenbergu pridá blok „Hero sekcia“, uvidí formulár, vyplní polia a vidí preview. Žiadne HTML. Žiadne CSS. Žiadne padding nights.

Dôležité: **obmedzené možnosti farby**. Namiesto color pickera poskytni `select` s 3 – 4 brand farbami. Marketing inak vyberie ružovú do dark theme firmy.

## 2. Block Patterns — vopred poskladané sekcie

Patterns sú hotové kompozície blokov. Marketér ich vloží jediným klikom.

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

Kategóriu patterns sa dá registrovať tiež:

```php
register_block_pattern_category('firma-patterns', [
    'label' => 'Firma — landing šablóny'
]);
```

Pre Black Friday kampaň som spravil 6 patterns: hero varianty, USP grid, testimonial set, FAQ, dual-CTA a footer-form. Marketér ich naskladá za 4 minúty.

## 3. Block Locking — brand integrita

Block locking má Gutenberg natívne od WP 5.9 (vizuálne ovládanie v editore pribudlo v 6.0). Bez neho je problém — marketér z reflexu stlačí Delete na footer block, lebo sa mu nepáčil padding.

```html
<!-- wp:acf/footer {"lock":{"move":true,"remove":true}} /-->
```

Toto v editore zobrazí ikonku zámku. Blok sa nedá zmazať ani presunúť, no editácia jeho polí ostáva otvorená.

Pre kombináciu zámku celej šablóny **+ povolených editovateľných častí**:

```html
<!-- wp:acf/hero {"lock":{"move":true,"remove":true}} /-->
<!-- wp:paragraph {"templateLock":false} -->
<p>Editovateľný popis pod hero...</p>
<!-- /wp:paragraph -->
```

## 4. Synced Patterns pre globálne CTA

CTA „Stiahni zadarmo PDF“ je v 12 článkoch. Marketing chce zmeniť text na „Získaj checklist“. Reusable block (od WP 6.3 premenovaný na „Synced Pattern“) to rieši — zmena na jednom mieste sa prejaví všade.

V Block Editore → vyber blok → „Create pattern → Synced“. Blok dostane unikátne ID a všetky inštancie sa aktualizujú spolu.

**Háčik:** Synced pattern nemôže obsahovať dynamický obsah (post title, ACF polia), iba statický markup. Pre dynamické CTA použi ACF blok s globálnym `option` poľom.

## 5. Skrytie zbytočných blokov

Marketing nepotrebuje takmer stovku predvolených Gutenberg blokov. Audio, Verse, Cover (predchodca ACF Hero) — len mätú. Skry ich:

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

Z desiatok blokov sa výber zredukuje na 12. Sústredenejšie UI, menej omylov. Je to ten istý inštinkt ako pri dobrej [plugin diéte](/blog/plugin-dieta-z-28-na-9/) — menej plochy, menej vecí, čo sa môže pokaziť.

## 6. Tréning tímu

Po implementácii som natočil **hodinové video** (OBS Studio + nahrávka obrazovky do Notionu):

1. Prihlásenie do `/wp-admin`
2. Pages → Add New
3. Použitie Patternu (Pattern picker UI)
4. Editácia Hero — kde sú ACF polia
5. Pridanie Synced CTA
6. Preview, Publish, Schedule
7. Kde nájdeš šablóny starých kampaní (CPT)

Video v Notione s timestampami. Plus jednostranový Notion guide so screenshotmi. Nikto sa za rok zatiaľ nespýtal „ako sa robí landing“.

## Konkrétny projekt — výsledok

Eshop, 8 landing pages na Black Friday. Predtým:
- Marketing pripraví copy + brief: 2 dni
- Ja stavím každú stránku 4 – 6 hodín
- Spolu: ~40 hodín dev roboty

Po systéme:
- Marketing pripraví copy + naskladá ho z patterns
- 1 stránka ~30 minút self-service
- Dev spolu: 0 hodín, len úvodný build patterns za ~12 hodín

Návratnosť investície po prvom kampaňovom cykle.

## TL;DR

ACF Blocks na vlastné bloky, Block Patterns na hotové sekcie, Block Locking na nepohnuteľné prvky, Synced Patterns na globálne CTA, obmedzenie typov blokov pre čisté UI. Plus hodinový video tréning. Marketingový tím získava autonómiu, ty získavaš čas. Brand ostáva konzistentný, lebo ti to systém vynúti.

**Súvisiace:** [Ako vybrať WordPress theme bez ľútosti — 6 kritérií](/blog/wp-theme-vyber-6-kriterii/) · [Plugin diéta: z 28 na 9](/blog/plugin-dieta-z-28-na-9/)
