---
title: "How to Pick a WordPress Theme Without Regret — 6 Criteria"
date: 2025-10-08
read: 7
tags: ["WordPress", "Performance"]
excerpt: "Six concrete criteria I run through before buying any WordPress theme: bloat test, Woo compatibility, child theme support, update history, plugin dependencies, and translation-ready. Twenty minutes of work that saves you months of pain."
featured: false
---

Last month a client brought me a site for a "quick little fix." A ThemeForest theme, top seller, gorgeous demo. Half an hour in DevTools later, I told him it'd be cheaper to rebuild it on a different theme than to tune this one. LCP 6.8s, 47 enqueued scripts, jQuery 1.12 + jQuery Migrate, Slider Revolution loaded on every single page. The classic.

This is avoidable. I have 6 criteria I run through for every candidate before I buy. Twenty minutes of work saves you months of pain.

## 1. Bloat test on the demo URL

Open [PageSpeed Insights](https://pagespeed.web.dev/) and drop in the theme demo URL. Mobile, not desktop — desktop flatters everything. Here's what I'm looking for:

- **Performance score > 80** (mobile, clean install)
- **LCP < 2.5s** (the threshold Google considers "good")
- **Total Blocking Time < 200ms** (the lab proxy for INP, where the "good" cutoff is also 200ms)
- **Page weight < 1.5 MB** (can be lower without banner images)

If the demo barely scrapes 60 on mobile, remember that *you're* still going to pile on your own content, GA, Hotjar, Cookiebot, Meta Pixel. You'll drop 15–20 points. The theme needs headroom straight out of the box.

## 2. Woo compatibility with a specific version

This is a trap. The theme's marketing says "WooCommerce compatible," but the changelog last mentioned Woo 7.x while we're on 10.x. What I check:

- Changelog for the last 12 months — did the author mention "Woo 10.x compatibility"?
- Test cart/checkout/account on the demo — does it even work?
- Custom Woo templates in the theme — `woocommerce/single-product.php` and friends. If it has them, they override the defaults and can break when Woo updates.

A clean theme with no Woo overrides behaves better. Woo updates its templates often, and themes sometimes fall asleep at the wheel. (If you're going down this road, a handful of [WooCommerce checkout micro-tweaks](/en/blog/checkout-konvertuje-9-uprav/) are worth knowing before you commit to a theme.)

## 3. Child theme support out of the box

Obvious one: it should ship either a zipped child theme right in the package, or a docs section like "How to use a child theme." If not, the author assumes you'll edit the theme directly — and you'll lose it all on the first update.

Test: download the demo zip, unpack it, look for `*-child.zip` or at least a `child-theme/` directory. If there's nothing — warning sign.

## 4. Update history over the last 12 months

I go to the changelog page (usually on the product page or in `readme.txt`). I watch for:

- **Release frequency** — 6–10 releases a year is healthy. If the last update was 14 months ago, the theme is abandoned.
- **Type of fixes** — are they just "minor improvements," or are there real security fixes and Woo/WP compatibility work?
- **GitHub activity**, if it's public — commit count, open issues, author response time.

Astra, Blocksy, Kadence — all publish their changelogs publicly and ship updates steadily throughout the year (Astra, for example, is on version 4.13.x as of July 2026). That's the benchmark.

## 5. Bundled plugin dependencies — warning

Open the demo and check Site Health (or `wp plugin list`, if you have access) to see what the theme installs. Red flags:

- **Slider Revolution** as a required dependency — historically problematic, with the longest CVE list among the big WP plugins (from the infamous 2014 hole all the way to the arbitrary file upload CVE-2026-6692 in 7.0.x), heavy JS, often out of date.
- **WPBakery (Visual Composer)** — vendor lock-in, insane shortcode bloat in the DB, migration is hell.
- **A bundle with 8+ plugins** — every one of them drags performance down.

What I'll accept: Contact Form 7, ACF (Free), WPForms Lite, Woo. Those are standard.

```bash
# quick check via WP-CLI, if you know what you downloaded
wp plugin list --status=active --field=name
```

If you inherit a site that's already buried under plugins, I've written up how I took one [from 28 plugins down to 9 and cut load time by 60%](/en/blog/plugin-dieta-z-28-na-9/).

## 6. Translation-ready (.po/.mo or Loco)

Critical for a Slovak/Czech site. What I look for:

- A `languages/` directory in the theme with a `.pot` file
- Documentation for `load_theme_textdomain()`
- Compatibility with [Loco Translate](https://wordpress.org/plugins/loco-translate/) or WPML

If a theme claims "fully translatable" but the `.pot` file is missing, it means the developer hardcodes English strings straight into PHP. Translating it then means forking every template — pain nobody wants.

## The most common mistakes when choosing

- **"I like the demo, let's buy it."** — the demo has professional photos, polished copywriting, and neat spacing. Your client has none of that. Look at how the theme behaves with real content (a short heading, a long one, no featured image).
- **"It has 25,000 sales, it must be good."** — sales measure marketing, not code quality. Slider Revolution has millions of installs too.
- **"The free version is enough."** — for a serious project I recommend Pro. Free versions limit typography and layout options and often lack support.

## Themes that pass all 6 criteria

Three that work for me over and over (prices approximate, licenses for 1 site, they change regularly):

1. **[Astra Pro](https://wpastra.com/)** — Astra Pro + AI from $99/year, lightweight (clean-install front-end payload under 50 KB), excellent Woo integration, child theme right in the download, actively updated.
2. **[Blocksy Pro](https://creativethemes.com/blocksy/)** — Personal from $49/year, Gutenberg-first, the best default styles of the three, a growing community.
3. **[Kadence](https://www.kadencewp.com/)** — Express plan from $69/year (higher plans add blocks and more tools), great header builder, solid Woo template editor.

All three clear PageSpeed above 90 on mobile on a bare install. No required plugins other than their own (which are decently coded).

## TL;DR

Before buying a theme: PageSpeed on mobile > 80, a current Woo version in the changelog within the last 6 months, child theme in the package, > 6 releases a year, no Slider Revolution/WPBakery, a `.pot` file in `languages/`. If any of that fails, keep looking. You'll save yourself the money on a later refactor.

Related: [7 most common causes of LCP over 2.5s](/en/blog/lcp-nad-2-5s-pricin/) · [plugin diet: from 28 to 9](/en/blog/plugin-dieta-z-28-na-9/)
