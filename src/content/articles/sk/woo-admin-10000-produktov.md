---
title: "Woo administrácia pri 10 000+ produktoch: ako udržať admin rýchly"
date: 2026-09-17
read: 8
tags: ["WooCommerce", "Performance"]
excerpt: "Pri veľkom katalógu sa WooCommerce admin brzdí tam, kde nič necachuješ: postmeta JOINy, nabobtnaný autoload a Action Scheduler. Tu je, čo reálne pomáha."
featured: false
---

Front-end eshopu vieš schovať za cache. Admin nie. Zoznam produktov, editácia, hromadné úpravy, objednávky — to všetko beží cez plný WordPress + WooCommerce stack pri každom requeste, obchádza page cache a púšťa drahé dotazy do databázy. Pri 200 produktoch to nikto nerieši. Pri 10 000+ SKU sa z toho stane každodenný trapas: zoznam produktov sa načíta 5 sekúnd, hromadná úprava ceny spadne na timeout a klient ti píše, že „to celé zamrzlo".

Dobrá správa: vo väčšine prípadov nejde o hosting ani o „pomalý WordPress". Ide o štyri konkrétne miesta, kde sa škálovanie láme. Poďme po nich.

## postmeta JOINy sú prvý vinník

WooCommerce klasicky ukladá cenu, sklad, hodnotenie a SKU do `wp_postmeta` — jeden riadok na jednu hodnotu. Zoznam produktov v admine potom robí sériu JOINov na túto tabuľku, a tá pri 10 000 produktoch ľahko rastie do miliónov riadkov. Fulltextové vyhľadávanie SKU nad `wp_postmeta` vedelo na veľkom datasete trvať aj okolo 40 sekúnd.

Riešením sú **product lookup tabuľky** (`wc_product_meta_lookup`), ktoré WooCommerce zaviedol už v 3.6 (apríl 2019). Namiesto JOINu na `wp_postmeta` sa dotazy naviažu na normalizovanú lookup tabuľku, kde má produkt cenu, sklad a rating v jednom riadku. Ten istý SKU search, čo trval 40 sekúnd, spadol pod 1 sekundu.

Fungujú automaticky, ale po migrácii, importe alebo hromadnej úprave sa vedia rozsynchronizovať — vtedy sa v admine zobrazujú staré ceny alebo zlý stav skladu. Regeneráciu spustíš v **WooCommerce → Status → Tools → Update product lookup tables**, alebo cez WP-CLI:

```bash
wp wc tool run regenerate_product_lookup_tables --user=1
```

Toto je prvá vec, ktorú kontrolujem pri každom pomalom Woo admine. Bežne vídam eshopy, kde lookup tabuľky existujú, ale sú roky nezregenerované a databáza aj tak melie postmeta.

## Autoload: tichý žrút pamäte pri každom requeste

WordPress pri každom načítaní stránky — vrátane admin requestov — vytiahne všetky autoloadované `wp_options` jedným dotazom. Na nabobtnanom eshope to znamená niekoľko megabajtov dát z MySQL do PHP pri **každom** requeste. Woo ekosystém je tu hlavný páchateľ: veľa pluginov si do autoloadovaných options pchá transienty, konfiguráciu a cache. Najhoršie sú pozostatky po deaktivovaných pluginoch, ktoré po sebe neupratali.

Od WordPressu 6.6 (júl 2024) je to o niečo lepšie — options nad veľkostným prahom sa už defaultne neautoloadujú (default je 150 kB, laditeľné cez filter `wp_max_autoloaded_option_size`) a Site Health hlási kritickú chybu „Autoloaded options could affect performance", keď celkový autoload prekročí 800 kB. To 800 kB ber ako červenú čiaru.

Zmeraj to jedným SQL dotazom:

```sql
SELECT ROUND(SUM(LENGTH(option_value))/1024) AS autoload_kb, COUNT(*)
FROM wp_options WHERE autoload IN ('yes', 'on', 'auto-on');
```

Ak si nad 800 kB, nájdi najväčších vinníkov a zbav sa toho, čo tam nemá čo robiť — najmä osirotené options po starých pluginoch. Zároveň si over, či máš na `wp_options` index, ktorý pomáha týmto dotazom:

```sql
CREATE INDEX autoloadindex ON wp_options (autoload, option_name);
```

O tom, čo patrí do object cache namiesto autoloadu, som písal v článku o [Redis object cache na WordPresse](/blog/redis-object-cache-wordpress/) — pri veľkom katalógu je to jeden z najväčších pákových efektov.

## Action Scheduler: tabuľka, ktorá ticho rastie do miliónov

Každá objednávka, e-mail, webhook, synchronizácia produktov aj analytika beží cez Action Scheduler a zapíše si riadok do `wp_actionscheduler_actions`. Riadok tam ostane aj po dobehnutí úlohy. Aj 50 objednávok denne vie znamenať 500 – 750 nových riadkov denne, teda 180 000 – 270 000 riadkov za rok len z objednávok. Na rušnom eshope tá tabuľka dosiahne milióny riadkov, indexy nabobtnajú a stránka **Scheduled Actions** v admine sa stane nepoužiteľnou. Horšie — spomalí sa spracovanie nových úloh, takže objednávky, webhooky aj e-maily meškajú.

Tu je dobrá správa z leta 2026: **Action Scheduler 4.0.0** (17. jún 2026, súčasť WooCommerce 11.0) prerobil upratovanie. Cleanup teraz beží ako samostatná denná úloha o 3:00 miestneho času, maže v dávkach po minimálne 250 akciách a nie je už na kritickej ceste spracovania — takže dokáže dobehnúť aj obrovské tabuľky. Neúspešné akcie sa mažú po 3 mesiacoch. Vyžaduje WordPress 6.8+.

Ak potrebuješ kratšiu retenciu dokončených akcií, uprav ju filtrom (predvolene 30 dní):

```php
add_filter( 'action_scheduler_retention_period', function () {
    return 7 * DAY_IN_SECONDS;
} );
```

Pri jednorazovom upratovaní historickej záťaže na starom eshope pomôže cielený SQL — ale rob to na zálohovanej DB a mimo špičky:

```sql
DELETE FROM wp_actionscheduler_actions
WHERE status IN ('complete', 'failed', 'canceled')
  AND scheduled_date_gmt < DATE_SUB(NOW(), INTERVAL 60 DAY);
```

## HPOS zapni — ale pri veľkom katalógu s rozvahou

High-Performance Order Storage (HPOS) presúva objednávky z `wp_posts`/`wp_postmeta` do vlastných, na Woo dotazy optimalizovaných tabuliek. Čísla, ktoré Woo uvádza: až **5× rýchlejšie vytváranie objednávky**, až **1,5× rýchlejší checkout** a hľadanie objednávky až **40× rýchlejšie**. Pri veľkom katalógu s veľa objednávkami je to najväčší admin-side skok, aký dostaneš „zadarmo".

Háčik je v migrácii. Nespoliehaj sa na plánované joby — pri veľkom počte objednávok pusti sync cez CLI a odmeraj si, ako dlho beží (Woo uvádza testovací obchod s 9 miliónmi objednávok, kde finálna migrácia trvala približne týždeň):

```bash
wp wc hpos sync
wp wc hpos verify_cot_data --verbose
```

Postup: v **WooCommerce → Settings → Advanced → Features** najprv nechaj „Use the WordPress posts tables" a zapni synchronizáciu, nechaj CLI dobehnúť, over integritu, a až potom prepni na „Use the WooCommerce orders tables". Kompatibilný režim vypni až nakoniec. Toto nikdy nerob prvýkrát na produkcii — najprv staging, odmeraj čas, potom produkcia mimo špičky.

## Čo ešte reálne pomáha

Pár vecí, ktoré pri veľkom katalógu vídam ako rozdiel medzi „ide to" a „netrp":

- **Object cache (Redis).** Admin obchádza page cache, ale object cache mu odľahčí opakované DB dotazy. Detaily v článku vyššie.
- **Audit admin-heavy pluginov.** SEO a analytika, čo hookujú do `save_post` alebo do zoznamu produktov, vedia každú hromadnú úpravu spomaliť násobne. [Plugin diéta](/blog/plugin-dieta-z-28-na-9/) sa oplatí aj kvôli adminu, nielen front-endu.
- **PHP memory a `max_input_vars`.** Hromadné úpravy a veľké importy potrebujú priestor; default 128 M pri 10 000 produktoch nestačí.
- **Ak už DB vyslovene bolí, zváž headless front-end** a offload návštevníckej záťaže — ale to je iná liga a rieši sa až keď máš vyššie štyri body pod palcom. Kedy to dáva zmysel som rozobral v [headless Woo + Next.js](/blog/headless-woo-nextjs-kedy/).

Pri veľkom katalógu neexistuje jeden magický prepínač. Ale keď v tomto poradí prejdeš lookup tabuľky → autoload → Action Scheduler → HPOS, väčšinu bolesti odstrániš skôr, než vôbec začneš uvažovať o výmene hostingu.
