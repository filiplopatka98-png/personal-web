---
title: "Ako vybrať WordPress theme bez ľútosti — 6 kritérií"
date: 2025-10-08
read: 7
tags: ["WordPress", "Performance"]
excerpt: "Šesť konkrétnych kritérií, ktoré prejdem pred kúpou WordPress themy: bloat test, Woo kompatibilita, child theme support, update history, plugin dependencies a translation-ready. Dvadsať minút práce, ktoré ti ušetria mesiace bolesti."
featured: false
---

Klient mi minulý mesiac priniesol web na „len rýchlu opravu". Theme z ThemeForestu, top-seller, krásne demo. Po pol hodine v DevTools som mu povedal, že lacnejšie bude prerobiť to na inú themu, než to vyladiť. LCP 6,8 s, 47 enqueued scriptov, jQuery 1.12 + jQuery Migrate, Slider Revolution načítaný na každej stránke. Klasika.

Tomuto sa dá predísť. Mám 6 kritérií, ktorými prejdem každého kandidáta ešte pred kúpou. Dvadsať minút práce ti ušetrí mesiace bolesti.

## 1. Bloat test na demo URL

Otvor [PageSpeed Insights](https://pagespeed.web.dev/) a hoď tam URL theme dema. Mobil, nie desktop — desktop ti všetko prikrášli. Hľadám:

- **Performance score > 80** (mobil, čistá inštalácia)
- **LCP < 2,5 s** (prahová hodnota, ktorú Google považuje za „good")
- **Total Blocking Time < 200 ms** (lab proxy pre INP, kde je „good" hranica tiež 200 ms)
- **Page weight < 1,5 MB** (bez bannerových obrázkov môže byť nižšia)

Ak demo ledva dosiahne 60 na mobile, pamätaj, že ty tam ešte pridáš svoj content, GA, Hotjar, Cookiebot, Meta Pixel. Klesneš o 15 – 20 bodov. Theme musí mať z fabriky rezervu.

## 2. Woo kompatibilita s konkrétnou verziou

Toto je trap. Theme píše „WooCommerce compatible" v marketingu, ale changelog naposledy spomínal Woo 7.x a my sme na 10.x. Čo kontrolujem:

- Changelog za posledných 12 mesiacov — spomínal autor „Woo 10.x compatibility"?
- Test cart/checkout/account na demo — funguje to vôbec?
- Custom Woo templates v theme — `woocommerce/single-product.php` a podobne. Ak ich má, prepíšu defaultné a pri updatoch Woo môžu pukať.

Čistá theme bez Woo override-ov sa správa lepšie. Woo totiž aktualizuje templates často a theme občas zaspí. (Ak ideš touto cestou, oplatí sa poznať [pár mikro-úprav WooCommerce checkoutu](/blog/checkout-konvertuje-9-uprav/) ešte predtým, než sa upíšeš konkrétnej theme.)

## 3. Child theme support out of the box

Jasná vec: mal by mať buď zazipovaný child theme priamo v balíku, alebo sekciu v dokumentácii typu „How to use child theme". Ak nie, autor počíta s tým, že robíš úpravy priamo v theme — a stratíš ich pri prvom update.

Test: stiahni demo zip, rozbaľ, hľadaj `*-child.zip` alebo aspoň adresár `child-theme/`. Ak nič — varovanie.

## 4. Update history posledných 12 mesiacov

Idem na changelog page (zvyčajne na produktovej stránke alebo v `readme.txt`). Sledujem:

- **Frekvencia releasov** — zdravé je 6 – 10 releasov za rok. Ak posledný update bol pred 14 mesiacmi, theme je opustený.
- **Druh fixov** — sú to len „minor improvements", alebo aj reálne security fixy a Woo/WP kompatibilita?
- **GitHub aktivita**, ak je verejná — počet commitov, otvorené issues, čas odozvy autora.

Astra, Blocksy, Kadence — všetky publikujú changelog verejne a aktualizujú sa v priebehu roka pravidelne (Astra je napríklad v júli 2026 na verzii 4.13.x). To je benchmark.

## 5. Bundled plugin dependencies — varovanie

Otvor demo a v Site Health (alebo cez `wp plugin list`, ak máš prístup) pozri, čo theme inštaluje. Red flags:

- **Slider Revolution** ako required dependency — historicky problematický, s najdlhším zoznamom CVE spomedzi veľkých WP pluginov (od povestnej diery z roku 2014 až po arbitrary file upload CVE-2026-6692 v 7.0.x), ťažké JS, často neaktuálny.
- **WPBakery (Visual Composer)** — vendor lock, šialený shortcode bloat v DB, migrácia je peklo.
- **Bundle s 8+ pluginmi** — každý zráža performance.

Čo akceptujem: Contact Form 7, ACF (Free), WPForms Lite, Woo. Tie sú štandard.

```bash
# rýchly check cez WP-CLI, ak vieš, čo si stiahol
wp plugin list --status=active --field=name
```

Ak zdedíš web už zavalený pluginmi, spísal som, ako som jeden dostal [z 28 pluginov na 9 a zrýchlil ho o 60 %](/blog/plugin-dieta-z-28-na-9/).

## 6. Translation-ready (.po/.mo alebo Loco)

Pri slovenskom/českom webe kritické. Hľadám:

- Adresár `languages/` v theme s `.pot` súborom
- Dokumentáciu k `load_theme_textdomain()`
- Kompatibilitu s [Loco Translate](https://wordpress.org/plugins/loco-translate/) alebo WPML

Ak theme tvrdí „fully translatable", ale `.pot` súbor chýba, znamená to, že developer hardcoduje anglické stringy priamo do PHP. Preložiť to potom znamená forknúť každý template — bolesť, ktorú nikto nechce.

## Najčastejšie omyly pri výbere

- **„Páči sa mi demo, kúpime to."** — demo má profesionálne fotky, vyladený copywriting a ladný spacing. Tvoj klient nemá nič z toho. Pozri, ako theme vyzerá s reálnym contentom (s krátkym titulkom, s dlhým, bez featured image).
- **„Má 25 000 predajov, musí byť dobré."** — predaje merajú marketing, nie kvalitu kódu. Slider Revolution má tiež milióny inštalácií.
- **„Free verzia stačí."** — pri serióznom projekte odporúčam Pro. Free verzie obmedzujú typografiu a layout options a často v nich chýba support.

## Themes, ktoré spĺňajú všetkých 6 kritérií

Tri, ktoré mi opakovane fungujú (ceny orientačne, licencie na 1 web, pravidelne sa menia):

1. **[Astra Pro](https://wpastra.com/)** — Astra Pro + AI od 99 USD/rok, lightweight (front-end payload čistej inštalácie pod 50 KB), výborná Woo integrácia, child theme priamo v download-e, aktívne aktualizovaná.
2. **[Blocksy Pro](https://creativethemes.com/blocksy/)** — Personal od 49 USD/rok, Gutenberg-first, najlepšie default styles z trojice, stále rastúca komunita.
3. **[Kadence](https://www.kadencewp.com/)** — plán Express od 69 USD/rok (vyššie plány pridávajú blocks a ďalšie nástroje), výborný header builder, dobrý Woo template editor.

Všetky tri prejdú PageSpeed nad 90 na mobile na holej inštalácii. Žiadne required pluginy okrem ich vlastných (ktoré sú slušne kódované).

## TL;DR

Pred kúpou theme: PageSpeed na mobile > 80, aktuálna Woo verzia v changelogu za posledných 6 mesiacov, child theme v balíku, > 6 releasov za rok, žiadny Slider Revolution/WPBakery, `.pot` súbor v `languages/`. Ak čokoľvek z toho zlyhá, hľadaj ďalej. Ušetríš si peniaze na neskorší refactor.

Súvisiace: [7 najčastejších príčin LCP nad 2,5 s](/blog/lcp-nad-2-5s-pricin/) · [plugin diéta: z 28 na 9](/blog/plugin-dieta-z-28-na-9/)
