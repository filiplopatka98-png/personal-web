---
title: "Ako vybrať WordPress theme bez ľútosti — 6 kritérií"
date: 2025-10-08
read: 7
tags: ["WordPress", "Performance"]
excerpt: "Šesť konkrétnych kritérií, ktoré pozerám pred kúpou WP themy. Bloat test, Woo kompatibilita, child theme support, update history, plugin dependencies, translation-ready."
featured: false
---

Klient mi minulý mesiac priniesol web na "len rýchlu opravu". Theme z ThemeForestu, top-seller, krásny demo. Po pol hodine v DevTools som mu povedal, že lacnejšie bude prerobiť to na inú themu, než to vyladiť. LCP 6.8s, 47 enqueued scriptov, jQuery 1.12 + jQuery Migrate, Slider Revolution naložený na každej stránke. Klasika.

Tomuto sa dá predísť. Mám 6 kritérií, ktorými prejdem každý kandidát ešte pred kúpou. Dvadsať minút práce ti ušetrí mesiace bolesti.

## 1. Bloat test na demo URL

Otvor [PageSpeed Insights](https://pagespeed.web.dev/) a hoď tam URL theme dema. Mobile, nie desktop — desktop ti všetko prikrášli. Hľadám:

- **Performance score > 80** (mobile, čistá inštalácia)
- **LCP < 2.5s**
- **Total Blocking Time < 200ms**
- **Page weight < 1.5 MB** (bez bannerových obrázkov môže byť nižšie)

Ak demo ledva dosiahne 60 na mobile, pamätaj, že ty tam ešte pridáš svoj content, GA, Hotjar, Cookiebot, Meta Pixel. Klesneš o 15–20 bodov. Theme musí mať z fabriky rezervu.

## 2. Woo kompatibilita s konkrétnou verziou

Toto je trap. Theme píše "WooCommerce compatible" v marketingu, ale changelog naposledy spomínal Woo 7.x a my sme v 9.4. Co kontrolujem:

- ChangeLog cez posledných 12 mesiacov — spomínal autor "Woo 9.x compatibility"?
- Test cart/checkout/account na demo — funguje to vôbec?
- Custom Woo templates v themes — `woocommerce/single-product.php` a podobne. Ak ich má, prepíše defaultné, a pri updatoch Woo môžu pukať.

Čistý theme bez Woo override-ov sa správa lepšie. Lebo Woo updatuje templates často, theme občas zaspí.

## 3. Child theme support out of the box

Open-and-shut: mal by mať buď zazipovaný child theme priamo v balíku, alebo sekciu v dokumentácii s "How to use child theme". Ak nie, autor počíta s tým, že robíš customizácie priamo v theme — a stratíš ich pri prvom update.

Test: stiahni demo zip, rozbaľ, hľadaj `*-child.zip` alebo aspoň `child-theme/` adresár. Ak nič — varovanie.

## 4. Update history posledných 12 mesiacov

Idem na changelog page (zvyčajne na produktovej stránke alebo v `readme.txt`). Sledujem:

- **Frekvencia releasov** — zdravé sú 6–10 releasov za rok. Ak posledný update bol pred 14 mesiacmi, theme je opustený.
- **Druh fixov** — sú to len "minor improvements", alebo aj reálne security fixy a Woo/WP kompatibilita?
- **GitHub aktivita**, ak je verejná — počet commitov, otvorené issues, response time autora.

Astra, Blocksy, Kadence — všetky publikujú changelog publicky a updatujú každé 3–6 týždňov. To je benchmark.

## 5. Bundled plugin dependencies — varovanie

Otvor demo a v Site Health (alebo cez `wp plugin list` ak máš prístup) pozri, čo theme inštaluje. Red flags:

- **Slider Revolution** ako required dependency — historicky problematické s CVE záznamami, ťažké JS, často neaktuálne.
- **WPBakery (Visual Composer)** — vendor lock, šialený shortcode bloat v DB, migrácia je peklo.
- **Ekceptional bundle s 8+ pluginmi** — každý dropá performance.

Čo akceptujem: Contact Form 7, ACF (Free), WP Forms Lite, Woo. Tie sú štandard.

```bash
# rýchly check cez WP-CLI ak vieš čo si stiahol
wp plugin list --status=active --field=name
```

## 6. Translation-ready (.po/.mo alebo Loco)

Pre slovenský/český web kritické. Hľadám:

- Adresár `languages/` v theme s `.pot` súborom
- Dokumentáciu k `load_theme_textdomain()`
- Kompatibilitu s [Loco Translate](https://wordpress.org/plugins/loco-translate/) alebo WPML

Ak theme tvrdí "fully translatable" ale .pot súbor chýba, znamená to, že developer hardcoduje anglické stringy do PHP. Preložiť to znamená forknúť každý template — bolesť, ktorú nikto nechce.

## Najčastejšie omyly pri výbere

- **"Páči sa mi demo, kúpime to."** — demo má profesionálne fotky, vyladený copywriting a ladné spacing. Tvoj klient nemá nič z toho. Pozri, ako theme vyzerá s reálnym contentom (krátkym titulkom, dlhým, bez featured image).
- **"Má 25 000 predajov, musí byť dobré."** — predaje merajú marketing, nie kvalitu kódu. Slider Revolution má tiež milióny inštalácií.
- **"Free verzia stačí."** — pre serióznu apku odporúčam Pro. Free verzie limit-ujú typography, layout options a často chýba support.

## Themes, ktoré spĺňajú všetkých 6 kritérií

Tri, ktoré mi opakovane fungujú:

1. **[Astra Pro](https://wpastra.com/)** — €59/y, lightweight (50 KB CSS base), výborná Woo integrácia, child theme priamo v download-e, weekly releases.
2. **[Blocksy Pro](https://creativethemes.com/blocksy/)** — €49/y, Gutenberg-first, najlepšie default styles z trojice, stale rastúca komunita.
3. **[Kadence Theme + Pro](https://www.kadencewp.com/)** — €129/y (pricier, ale zahŕňa blocks), výborný headers builder, dobrý Woo template editor.

Všetky tri prejdu PageSpeed nad 90 mobile na holej inštalácii. Žiadne required pluginy okrem ich vlastných (ktoré sú slušne kódované).

## TL;DR

Pred kúpou theme: PageSpeed mobile > 80, Woo verzia v changelog za posledných 6 mesiacov, child theme v balíku, > 6 releasov za rok, žiadny Slider Revolution/WPBakery, `.pot` súbor v `languages/`. Ak čokoľvek z toho zlyhá, hľadaj ďalej. Ušetríš si peniaze na refactor neskôr.
