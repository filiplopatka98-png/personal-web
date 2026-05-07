---
title: "ACF Pro vs Meta Box vs Custom Fields: ktorá vyhráva v 2026"
date: 2025-11-12
read: 8
tags: ["WordPress", "DevOps"]
excerpt: "Hĺbkové porovnanie troch hlavných hráčov pre custom polia v WordPresse. DX, performance, REST API, Block Editor, license cost. Plus odporúčanie kedy ktorý."
featured: false
---

Custom fields rieši v každom WordPress projekte. Keď ich má klient pol tucta, je jedno, ako to spravíš. Keď ich má 80 a polovica musí byť v REST API pre headless frontend, vyberáš si nástroje vážne.

Posledných 6 mesiacov som vedome striedal **ACF Pro**, **Meta Box** a holé **native Custom Fields** na rôznych projektoch, aby som mal čo najčerstvejšie čísla. Tu je verdikt.

## Ceny — startovacia čiara

| Nástroj | Cena | Platnosť |
|---|---|---|
| ACF Pro | €49 / 1 site, €149 / unlimited | ročne |
| Meta Box AIO | €69 / unlimited | ročne |
| Native Custom Fields | €0 | navždy |

Native je súčasť WP core, nič inštalovať netreba. ACF má free verziu na repository, ale Pro je nutnosť pre Repeater a Flexible Content. Meta Box má free [Meta Box](https://wordpress.org/plugins/meta-box/) na repo, ale serious DX je až s AIO bundle.

## Developer Experience (DX)

### ACF Pro

Ovládanie cez admin UI je najpriateľnejšie. Vytvoríš field group klikaním, exportuješ do PHP cez "Tools → Export Field Groups", commitneš do gitu. Vývojár-friendly aj pre developera, ktorý tam vbehne raz za rok.

```php
// jednoduché získanie field
$price = get_field('product_price');
$gallery = get_field('gallery'); // pole obrázkov
```

### Meta Box

Code-first prístup. Field groupy definuješ priamo v PHP cez `mb_register_field_group()` alebo cez Meta Box Builder (free). Verzionovanie je trivial — všetko je v PHP súboroch v themes/plugin.

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

Pre developera, ktorý žije v IDE, je toto rýchlejšie. Pre klienta, ktorý chce sám pridať pole — peklo.

### Native Custom Fields

Holé string key-value páry. Žiadny field type system, žiadna validácia, žiadny UI builder. `get_post_meta($id, 'price', true)`. Funkčné, ale klient ti zapíše do "price" hodnotu "asi 30 eur" a krv ti stoná v žilách.

**Verdikt DX:** ACF > Meta Box > Native pre tímy s ne-technickým klientom. Meta Box > ACF pre solo dev s gitom.

## Performance overhead — DB queries

Toto ma reálne zaujímalo, tak som spravil benchmark. Post type s 12 custom fields, 500 postov, listing page načítavajúca 20 postov so všetkými poľami.

| Nástroj | Queries na load | Page render time |
|---|---|---|
| Native (`get_post_meta`) | 22 | 145 ms |
| ACF Pro | 28 | 168 ms |
| Meta Box | 24 | 152 ms |

ACF pridáva ~6 dotazov navyše, lebo vnútorne fetchuje field group config + meta key mappings. Pri väčších listingoch to cítiš. Trick: `update_meta_cache($post_ids)` predohriať cache, alebo používať `get_field('xyz', false, false)` (bez format) tam, kde stačí raw value.

Meta Box má najtenší overhead, lebo hovorí priamo s `wp_postmeta` rovnako ako native API. Žiadna vlastná abstrakčná vrstva.

**Verdikt performance:** Meta Box ≈ Native > ACF Pro.

## REST API native exposure

Toto ma kedysi pálilo pri prvom headless projekte.

### ACF Pro

Bez setupu **nepublikuje** custom fields v `/wp-json/wp/v2/posts`. Treba zapnúť per field group ("Show in REST API: Yes" v UI) alebo použiť [ACF to REST API](https://wordpress.org/plugins/acf-to-rest-api/). V ACF 6.x je už natívne, ale s pasce: vracia raw value, ktorá pre image fields je len attachment ID, nie URL. Musíš si to dotransformovať alebo použiť Format = Image Object.

### Meta Box

REST API exposure je natívne, vrátane custom field types. Tiež `show_in_rest: true` per field group, ale defaultne formátuje hodnoty rozumnejšie (image vráti URL).

```bash
curl https://web.sk/wp-json/wp/v2/product/123 | jq '.meta.price'
```

### Native

`register_post_meta()` s `'show_in_rest' => true` a hotovo. Žiadny tretí nástroj. Najčistejšie, najpredvídateľnejšie.

```php
register_post_meta('product', 'price', [
    'type' => 'number',
    'single' => true,
    'show_in_rest' => true,
]);
```

**Verdikt REST:** Native > Meta Box > ACF.

## Block Editor — custom blocks

Tu sa trojica rozchádza výrazne.

### ACF Blocks

Definuješ block PHP-only, render template = klasický WP template. Editácia v Gutenbergu cez ACF formuláre. Pre PHP devov a pre klientov je to ideál — nemusíš sa učiť React.

```php
acf_register_block_type([
    'name' => 'hero',
    'title' => 'Hero sekcia',
    'render_template' => 'blocks/hero.php',
    'category' => 'design',
]);
```

### MB Blocks

Súčasť Meta Box AIO. Podobný PHP-first prístup, syntax trochu iná. Funkčný, ale komunita menšia, takže menej code samples a Stack Overflow odpovedí.

### Native

Native blocks = React + JSX + `@wordpress/scripts` + `block.json`. Plný výkon, ale výrazne dlhší development time pre simple bloky. Pre marketing-friendly bloky overkill.

**Verdikt Block Editor:** ACF > Meta Box >> Native (pre PHP-centric tímy).

## Multi-site license cost pre klientov

Ak robíš agentúru s 30+ klientmi:

- **ACF Pro Unlimited:** €149/y, použiteľné na všetky weby agentúry. Najekonomickejšie pri 4+ projektoch.
- **Meta Box AIO:** €69/y už unlimited. Cenovo najlepšie.
- **Native:** zadarmo, ale rýchlo nasadíš tým 60 hodín do custom UI a validácie.

Meta Box vyhráva license cost o míľu.

## Tabuľka — sumarizácia

| Kritérium | ACF Pro | Meta Box | Native |
|---|---|---|---|
| Cena (unlimited) | €149/y | €69/y | €0 |
| DX (UI builder) | Excellent | Good | Žiadny |
| DX (code-first) | Good | Excellent | Manual |
| Performance | Slušná | Najlepšia | Najlepšia |
| REST API | OK (s konfigom) | Native | Native |
| Block Editor | Excellent (PHP) | Good (PHP) | React only |
| Komunita / docs | Veľká | Stredná | Núdzova |

## Čo používam ja

- **Klient s ne-technickým tímom + výhradne admin UI:** ACF Pro. Komfort pre marketing tím a moja produktivita.
- **Headless projekt s Next.js frontendom:** Meta Box. REST exposure natívne, performance, low overhead.
- **Internal tool, 2-3 polia, jeden developer:** Native + `register_post_meta`. Žiadne plugin dependencies.

## TL;DR

ACF vyhráva DX a Block Editor. Meta Box vyhráva performance, REST API, license cost. Native vyhráva minimalizmus a predvídateľnosť. V 2026 sú všetky traja seriózni hráči a otázka je len, čo je tvoj use case. Vyhni sa hľadaniu "the one" — používaj nástroj podľa projektu.
