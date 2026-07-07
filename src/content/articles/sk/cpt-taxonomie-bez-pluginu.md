---
title: "Custom post types a taxonómie bez pluginu: dátový model rovno v kóde"
date: 2026-10-15
read: 8
tags: ["WordPress"]
excerpt: "Prečo registrujem custom post types a taxonómie kódom namiesto pluginu ako CPT UI — čistejší model, verzovanie v gite a plná kontrola nad REST API."
featured: false
---

Skoro každý netriviálny WordPress projekt skončí pri tom istom bode: „potrebujeme sekciu, ktorá nie je ani stránka, ani blogpost". Realizácie, produkty, členovia tímu, podujatia, recepty. A skoro každý tutoriál v tom momente povie: nainštaluj si CPT UI a naklikaj to.

Ja to robím inak. Custom post types (CPT) a taxonómie registrujem **kódom**, priamo v malom plugine. Nie preto, že by som mal alergiu na klikanie, ale preto, že dátový model je príliš dôležitý na to, aby žil v databáze mimo verzovania. Poďme si to rozobrať.

## Prečo nie CPT UI

CPT UI je fajn nástroj a na rýchly prototyp ho ani neodsudzujem. Problém je, čo sa stane potom. Konfigurácia CPT-čka žije v `wp_options` v databáze. To znamená:

- **Nie je vo verzovaní.** Keď mám lokál, staging a produkciu, dátový model sa mi rozíde. Na produkcii má niekto zapnutý archív, na stagingu nie, a nikto nevie prečo.
- **Nedá sa poriadne review-ovať.** Zmenu slugu alebo `show_in_rest` v gite vidím v diffe. Zmenu v adminovi cez CPT UI nevidí nikto.
- **Je to ďalší plugin.** V praxi bežne vídam weby s 25+ pluginmi, kde polovica sú takéto „pomocníčky". Každý plugin je útočná plocha aj réžia na každý request.

Registrácia kódom je pritom pár riadkov. Oficiálna dokumentácia to rieši funkciou [`register_post_type()`](https://developer.wordpress.org/reference/functions/register_post_type/), ktorá je vo WordPress jadre od verzie 2.9. Žiadny plugin nepotrebuješ — potrebuješ len správne miesto, kam kód dať.

## Kam kód patrí: mini-plugin, nie functions.php

Toto je hill, na ktorom zomriem: **CPT nikdy nedávaj do `functions.php` témy.** Keď klient o rok vymení tému, príde o celý dátový model — post typy prestanú byť registrované a jeho realizácie „zmiznú" (dáta v DB zostanú, ale nezobrazia sa). Dátový model nie je vec vzhľadu, patrí do pluginu.

Stačí jeden súbor v `wp-content/plugins/nazov-projektu-core/nazov-projektu-core.php`:

```php
<?php
/**
 * Plugin Name: Projekt Core
 * Description: Dátový model — CPT a taxonómie.
 */

declare( strict_types = 1 );

add_action( 'init', 'projekt_register_post_types' );

function projekt_register_post_types(): void {
	register_post_type( 'realizacia', [
		'labels'       => [
			'name'          => 'Realizácie',
			'singular_name' => 'Realizácia',
			'add_new_item'  => 'Pridať realizáciu',
		],
		'public'       => true,
		'has_archive'  => true,
		'menu_icon'    => 'dashicons-portfolio',
		'supports'     => [ 'title', 'editor', 'thumbnail', 'excerpt' ],
		'show_in_rest' => true,
		'rewrite'      => [ 'slug' => 'realizacie' ],
	] );
}
```

Dôležité detaily, ktoré si treba postrážiť, lebo ich API vyžaduje:

- **Registruj na hooku `init`, nie skôr.** Dokumentácia to hovorí explicitne: registrácia post typu sa nesmie hooknúť pred akciou `init`. Skôr WordPress ešte nemá pripravené prostredie.
- **Kľúč post typu má max 20 znakov**, len malé písmená, čísla, pomlčky a podčiarkovníky. Vyhni sa aj rezervovaným kľúčom jadra (`post`, `page`, `attachment`, `revision`…).
- **`show_in_rest => true` nie je voliteľné.** Blokový editor (Gutenberg) beží nad REST API, takže bez tohto flagu sa ti CPT síce zaregistruje, ale bude sa editovať v starom Classic editore. Toto je najčastejšia chyba, ktorú v cudzom kóde vídam.

## Taxonómie: kategórie pre tvoj vlastný obsah

Taxonómia je spôsob, ako obsah triediť. WordPress má zabudované dve — kategórie (hierarchické) a štítky (ploché). Pre vlastný obsah si spravíš vlastnú cez [`register_taxonomy()`](https://developer.wordpress.org/reference/functions/register_taxonomy/).

Kľúčové rozhodnutie je `hierarchical`: `true` sa správa ako kategórie (rodič–dieťa, checkboxy), `false` ako štítky (plocho, voľné pridávanie). Pre „typ realizácie" alebo „lokalitu" chceš zvyčajne hierarchické.

```php
add_action( 'init', 'projekt_register_taxonomies' );

function projekt_register_taxonomies(): void {
	register_taxonomy( 'typ-realizacie', [ 'realizacia' ], [
		'labels'            => [
			'name'          => 'Typy realizácií',
			'singular_name' => 'Typ realizácie',
		],
		'hierarchical'      => true,
		'show_in_rest'      => true,
		'show_admin_column' => true,
		'rewrite'           => [ 'slug' => 'typ' ],
	] );
}
```

Tri parametre, ktoré robia rozdiel v praxi:

- **`show_in_rest => true`** — presne ako pri CPT. Bez neho sa panel taxonómie v bočnom paneli blokového editora vôbec nezobrazí, lebo Gutenberg ho ťahá cez REST.
- **`show_admin_column => true`** — pridá stĺpec do zoznamu príspevkov v admine. Maličkosť, ktorá klientovi ušetrí kopu klikania, keď filtruje obsah.
- **Kľúč taxonómie má max 32 znakov** (viac ako CPT), tie isté pravidlá na znaky.

Poradie registrácie nie je kritické — dôležité je, aby oboje bežalo na `init`. Väzbu medzi CPT a taxonómiou deklaruješ druhým argumentom `register_taxonomy()` (pole post typov). Ak registruješ taxonómiu skôr než CPT, môžeš pre istotu doplniť aj `register_taxonomy_for_object_type()`.

## Rewrite pravidlá: jediná vec, ktorá ťa potrápi

Toto je klasika, na ktorej sa spáli každý. Po pridaní CPT alebo taxonómie s vlastným `rewrite` slugom dostávaš na nových URL **404**, hoci obsah existuje. WordPress si totiž cachuje pravidlá prepisovania URL a nové nezaregistruje sám.

Rýchly fix pri vývoji: v adminovi choď do *Nastavenia → Trvalé odkazy* a klikni Uložiť. Nič nemeníš, len tým vynútiš prepočet pravidiel.

Do produkcie to ale nedávaj natvrdo. `flush_rewrite_rules()` je drahá operácia a **nikdy** ju nevolaj na každom requeste (v `init`). Správne miesto je aktivačný hook pluginu — spustí sa raz, pri aktivácii:

```php
register_activation_hook( __FILE__, function (): void {
	projekt_register_post_types();
	projekt_register_taxonomies();
	flush_rewrite_rules();
} );
```

Všimni si, že v aktivačnom hooku musíš CPT aj taxonómie najprv zaregistrovať — v tom momente `init` ešte nezbehol, takže pravidlá by inak nemal z čoho prepočítať.

## Model si nechaj čitateľný pre AI aj REST klientov

Ešte jeden argument za kód. Keď je dátový model deklaratívny a vo verzovaní, dá sa nad ním rozumne stavať. `show_in_rest => true` ti otvorí endpoint `/wp-json/wp/v2/realizacia`, ktorý použiješ ako backend pre [Next.js frontend cez WP REST API](/blog/wp-rest-api-nextjs/) alebo pre [headless WooCommerce setup](/blog/headless-woo-nextjs-kedy/). To s konfiguráciou zaklikanou v adminovi nikdy nedosiahneš tak čisto.

A keď už raz máš CPT, takmer vždy k nemu budeš chcieť vlastné polia. Tu sa oplatí vopred rozhodnúť medzi nástrojmi — porovnanie [ACF Pro, Meta Box a natívnych polí](/blog/acf-vs-metabox-vs-cf/) ti ušetrí zlé rozhodnutie, ktoré sa neskôr ťažko vracia. A ak sa ti počet pluginov vymkol z rúk, takáto konsolidácia do vlastného core pluginu je presne to, čo pomáha pri [plugin diéte](/blog/plugin-dieta-z-28-na-9/).

## Zhrnutie

Custom post types a taxonómie bez pluginu nie sú o šetrení jedného CPT UI. Sú o tom, že **dátový model patrí do kódu** — verzovaný, review-ovateľný, konzistentný naprieč prostrediami. Pár desiatok riadkov v mini-plugine ti dá kontrolu, ktorú si kliknutím v adminovi nikdy nekúpiš. Registruj na `init`, nezabudni na `show_in_rest`, flushni rewrite pravidlá len pri aktivácii — a máš čistý základ, na ktorom sa dobre stavia ďalej.
