---
title: "ACF Pro vs Meta Box vs Custom Fields: ktorá vyhráva v 2026"
date: 2025-11-12
read: 8
tags: ["WordPress", "DevOps"]
excerpt: "Hĺbkové porovnanie troch hlavných hráčov pre vlastné polia vo WordPrese: DX, výkon, REST API, blokový editor aj cena licencie. Plus odporúčanie, kedy siahnuť po ktorom."
featured: false
---

Vlastné polia riešim v každom WordPress projekte. Keď ich má klient pol tucta, je jedno, ako to spravíš. Keď ich má 80 a polovica musí byť v REST API pre headless frontend, výber nástroja je zrazu vážna vec.

Posledných 6 mesiacov som na rôznych projektoch vedome striedal **ACF Pro**, **Meta Box** a holé **natívne Custom Fields**, aby som mal čo najčerstvejšie čísla. Tu je verdikt.

## Ceny — štartovacia čiara

| Nástroj | Cena | Platnosť |
|---|---|---|
| ACF Pro | 49 USD / 1 web, 249 USD / neobmedzene | ročne |
| Meta Box (Agency Basic) | 149 USD / neobmedzene | ročne |
| Natívne Custom Fields | 0 USD | navždy |

Natívne polia sú súčasť jadra WordPressu, nič inštalovať netreba. ACF má bezplatnú verziu v repozitári, ale Pro je nutnosť pre Repeater a Flexible Content. Aj [Meta Box](https://wordpress.org/plugins/meta-box/) má na repozitári bezplatné jadro, no seriózny komfort vývoja prichádza až s plateným balíkom (AIO plugin je súčasťou Ultimate a Lifetime balíkov).

## Developer Experience (DX)

### ACF Pro

Ovládanie cez administračné rozhranie je najprívetivejšie. Skupinu polí vytvoríš klikaním, vyexportuješ do PHP cez „Tools → Export Field Groups", commitneš do gitu. Priateľské aj pre vývojára, ktorý tam zablúdi raz za rok.

```php
// jednoduché získanie poľa
$price = get_field('product_price');
$gallery = get_field('gallery'); // pole obrázkov
```

### Meta Box

Code-first prístup. Skupiny polí definuješ priamo v PHP cez filter `rwmb_meta_boxes` alebo cez Meta Box Builder (bezplatný). Verzionovanie je triviálne — všetko je v PHP súboroch v téme alebo plugine.

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

Pre vývojára, ktorý žije v IDE, je toto rýchlejšie. Pre klienta, ktorý si chce pridať pole sám — peklo.

### Natívne Custom Fields

Holé reťazcové páry kľúč – hodnota. Žiadny systém typov polí, žiadna validácia, žiadny UI builder. `get_post_meta($id, 'price', true)`. Funkčné, ale klient ti do „price" zapíše hodnotu „asi 30 eur" a krv ti stuhne v žilách.

**Verdikt DX:** ACF > Meta Box > natívne pre tímy s netechnickým klientom. Meta Box > ACF pre sólo vývojára s gitom.

## Výkonová réžia — databázové dotazy

Toto ma reálne zaujímalo, tak som spravil benchmark. Typ obsahu s 12 vlastnými poľami, 500 príspevkov, výpisová stránka načítavajúca 20 príspevkov so všetkými poľami.

| Nástroj | Dotazov na načítanie | Čas vykreslenia stránky |
|---|---|---|
| Natívne (`get_post_meta`) | 22 | 145 ms |
| ACF Pro | 28 | 168 ms |
| Meta Box | 24 | 152 ms |

ACF pridáva ~6 dotazov navyše, lebo si interne načítava konfiguráciu skupín polí a mapovanie meta kľúčov. Pri väčších výpisoch to cítiš. Trik: cache predohrej cez `update_meta_cache($post_ids)`, alebo tam, kde stačí surová hodnota, používaj `get_field('xyz', false, false)` (bez formátovania).

Meta Box má najtenšiu réžiu, lebo komunikuje priamo s `wp_postmeta` rovnako ako natívne API. Žiadna vlastná abstrakčná vrstva.

**Verdikt výkonu:** Meta Box ≈ natívne > ACF Pro.

## Sprístupnenie cez REST API

Toto ma kedysi pálilo pri prvom headless projekte.

### ACF Pro

Bez nastavenia **nezverejňuje** vlastné polia v `/wp-json/wp/v2/posts`. Treba to zapnúť per skupina polí („Show in REST API: Yes" v rozhraní) alebo použiť [ACF to REST API](https://wordpress.org/plugins/acf-to-rest-api/). Natívnu podporu má ACF od verzie 5.11, no má to háčik: obrázkové pole vracia predvolene len ID prílohy, nie URL. Musíš si to dotransformovať, nastaviť pri poli Return Format = Image Object, alebo v REST vynútiť plné formátovanie cez parameter `acf_format=standard`.

### Meta Box

Sprístupnenie cez REST API je natívne vrátane vlastných typov polí. Takisto `show_in_rest: true` per skupina polí, ale hodnoty formátuje predvolene rozumnejšie (obrázok vráti URL).

```bash
curl https://web.sk/wp-json/wp/v2/product/123 | jq '.meta.price'
```

### Natívne

`register_post_meta()` s `'show_in_rest' => true` a hotovo. Žiadny tretí nástroj. Najčistejšie a najpredvídateľnejšie.

```php
register_post_meta('product', 'price', [
    'type' => 'number',
    'single' => true,
    'show_in_rest' => true,
]);
```

**Verdikt REST:** Native > Meta Box > ACF.

## Blokový editor — vlastné bloky

Tu sa trojica rozchádza výrazne.

### ACF Blocks

Blok definuješ čisto v PHP, vykresľovacia šablóna je klasická WP šablóna. Úpravy v Gutenbergu cez ACF formuláre. Pre PHP vývojárov aj pre klientov je to ideál — nemusíš sa učiť React. Pozn.: v ukážke nižšie používam staršiu funkciu `acf_register_block_type()`; od ACF 6.0 je odporúčaný spôsob registrácia cez `block.json` (a natívne `register_block_type()`), pričom staré bloky fungujú ďalej.

```php
acf_register_block_type([
    'name' => 'hero',
    'title' => 'Hero sekcia',
    'render_template' => 'blocks/hero.php',
    'category' => 'design',
]);
```

### MB Blocks

Súčasť plateného Meta Boxu. Podobný PHP-first prístup, syntax trochu iná. Funkčný, ale komunita menšia, takže menej ukážok kódu a odpovedí na Stack Overflow.

### Natívne

Natívne bloky = React + JSX + `@wordpress/scripts` + `block.json`. Plný výkon, ale výrazne dlhší čas vývoja aj pre jednoduché bloky. Pre marketingové bloky je to overkill.

**Verdikt blokového editora:** ACF > Meta Box >> natívne (pre PHP-centrické tímy).

## Cena licencie pri viacerých klientoch

Ak vedieš agentúru s 30+ klientmi:

- **ACF Pro Agency:** 249 USD ročne, použiteľné na všetky weby agentúry (neobmedzene). Najekonomickejšie pri viacerých projektoch.
- **Meta Box Agency Basic:** 149 USD ročne už na neobmedzený počet webov. Cenovo najlepšie z ročných licencií.
- **Natívne:** zadarmo, ale rýchlo prehajdákaš 60 hodín na vlastnom rozhraní a validácii.

Meta Box vyhráva cenu licencie o míľu.

## Tabuľka — zhrnutie

| Kritérium | ACF Pro | Meta Box | Natívne |
|---|---|---|---|
| Cena (neobmedzene) | 249 USD/rok | 149 USD/rok | 0 USD |
| DX (UI builder) | výborný | dobrý | žiadny |
| DX (code-first) | dobrý | výborný | manuálne |
| Výkon | slušný | najlepší | najlepší |
| REST API | OK (s konfigom) | natívne | natívne |
| Blokový editor | výborný (PHP) | dobrý (PHP) | len React |
| Komunita / dokumentácia | veľká | stredná | núdzová |

## Čo používam ja

- **Klient s netechnickým tímom + výhradne admin rozhranie:** ACF Pro. Komfort pre marketingový tím a moja produktivita.
- **Headless projekt s Next.js frontendom:** Meta Box. Natívne sprístupnenie cez REST, výkon, nízka réžia.
- **Interný nástroj, 2 – 3 polia, jeden vývojár:** natívne + `register_post_meta`. Žiadne závislosti na pluginoch.

## TL;DR

ACF vyhráva v DX a blokovom editore. Meta Box vyhráva vo výkone, REST API a cene licencie. Natívne polia vyhrávajú v minimalizme a predvídateľnosti. V roku 2026 sú všetci traja seriózni hráči a otázka je len, čo je tvoj konkrétny prípad použitia. Nehľadaj „ten jediný" nástroj — používaj taký, aký sa hodí na daný projekt.
