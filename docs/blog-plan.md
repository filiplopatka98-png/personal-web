# Blog — publikačný plán + backlog tém

Stav k júlu 2026: **3 publikované** (checkout, LCP, headless) + **42 pripravených draftov**
(deep-edit + fakticheck hotové, EN preklady + crosslinky prebiehajú). Drafty sú za
`ARTICLE_ALLOWLIST` v `src/content/launch.ts` — publikuješ pridaním slugu (SK aj EN varianty),
alebo nastavením allowlistu na `null` (spustí všetky).

## Odporúčaná kadencia
- **2 články/týždeň** (utorok + štvrtok). Udržateľné pre freelancera, blog ostáva svieži,
  42 draftov vyjde za ~5 mesiacov. (Alternatíva: 3/týž → ~14 týždňov, ale náročnejšie na tempo.)
- Publikuj **v klastroch** (2–3 súvisiace články blízko seba) — crosslinky sa navzájom posilnia
  a Google vidí topic authority. Klastre prekladaj, nech je na blogu pestrosť.

## Poradie podľa priority (search intent × sila × klaster)
Najprv témy s vysokým search intentom a silným odlíšením; „advanced/niche" na koniec.

**Vlna 1 — Výkon + eshop základ (týždeň 1–3)** — najvyšší dopyt, tvoja core expertíza
1. woocommerce-vs-shopify — porovnávacie, vysoký objem hľadania
2. hostingy-sk-vykon — SK-špecifické, lokálny intent
3. plugin-dieta-z-28-na-9 — konkrétny výsledok, zdieľateľné
4. cwv-eshop-priorita · inp-pod-200ms-wordpress · server-response-200ms (perf klaster)
5. sk-platobne-brany-2026 — SK eshop intent
6. wp-bezpecnost-2026 — evergreen, vysoký dopyt

**Vlna 2 — WordPress + SEO (týždeň 4–7)**
7. wp-migracia-bez-vypadku · wp-theme-vyber-6-kriterii · acf-vs-metabox-vs-cf (WP klaster)
8. seo-checklist-co-pomaha · internal-linking-topic-clusters · local-seo-bratislava (SEO klaster)
9. schema-org-eshop-templates · faceted-filtre-bez-elasticsearch · doprava-sklad-pohoda (eshop klaster)
10. cenotvorba-eshop-models — biznis, dobre sa zdieľa

**Vlna 3 — Next.js / React / Astro (týždeň 8–11)** — pre technickejšie publikum
11. nextjs-app-vs-pages-router · nextjs-cache-revalidate · nextjs-form-actions (Next.js klaster)
12. react-19-migracia · server-components-5-veci · isr-namiesto-cron
13. astro-vs-nextjs-tabulka · astro-content-collections-mdx · astro-view-transitions-eshop (Astro klaster)
14. wp-rest-api-nextjs · headless prepojenie na už publikovaný headless-woo článok

**Vlna 4 — AI, prístupnosť, výkon detail, proces (týždeň 12–15)**
15. ai-search-pre-malu-firmu · ai-content-eeat · ai-alt-text-seo (AI klaster)
16. wcag-aa-80-20 · keyboard-only-test · focus-management-dialog (a11y klaster)
17. cls-mobil-banner · image-lazy-loading-native-vs-custom · bundle-audit-astro-nextjs · webpagetest-za-5-minut
18. brief-3-tyzdne · discovery-call-30-minut · gutenberg-blocks-marketeri · vercel-vs-cloudflare-vs-vps

## Mechanika publikovania
- Pridaj `sk/<slug>` **aj** `en/<slug>` do `ARTICLE_ALLOWLIST`, commit, deploy → článok je live v oboch jazykoch.
- Sitemap sa dogeneruje automaticky (`@astrojs/sitemap`); po väčšej dávke zváž re-submit v Search Console.
- Publikuj klaster naraz (v ten istý deň / týždeň), nech crosslinky nesmerujú na ešte-nepublikované (404).
- **TODO pri publikovaní `hostingy-sk-vykon` (16.7.):** vrátiť crosslink v `sk/lcp-nad-2-5s-pricin.md`, bod „Lepší hosting" — pôvodne odkazoval na hostingy, dočasne odstránený (LCP je už live, cieľ ešte nie).
- `article.next` (ďalší článok) sa generuje automaticky podľa dátumu — netreba riešiť.

---

# Backlog: 20 nových tém (relevantných, bez prekryvu s existujúcimi 45)

## Výkon (rozširuje perf klaster)
1. **TTFB pod 200 ms: kde sa reálne stráca čas** — server timing, DB, edge; deep-dive doplňujúci server-response článok.
2. **Font loading bez FOUT/FOIT: subset, preload, font-display v praxi** — konkrétny recept na fonty.
3. **Third-party skripty, ktoré ti zabíjajú výkon (a ako ich skrotiť)** — GTM, chaty, pixely; facade pattern, partytown.

## WordPress
4. **Object cache s Redisom na WordPresse: kedy sa oplatí a ako naň** — reálne čísla, setup.
5. **WP-CLI: 12 príkazov, ktoré ti ušetria hodiny** — praktický toolkit.
6. **Custom post types a taxonómie bez pluginu: kedy čo modelovať** — dátové modelovanie vo WP.
7. **WordPress bez page builderu: prečo a ako na to** — anti-Elementor, výkon + údržba.

## Next.js / React / Astro
8. **Next.js middleware prakticky: auth, geo, A/B, redirecty** — reálne use-casy.
9. **next/image vs vlastné riešenie: kedy sa oplatí čo** — nadväzuje na image-lazy-loading.
10. **Streaming a Suspense v App Routeri: rýchlejší dojem bez trikov** — UX výkon.
11. **Parallel a intercepting routes: na čo naozaj sú (a kedy netreba)** — pokročilé routovanie triezvo.

## Eshop / WooCommerce
12. **WooCommerce Checkout Blocks vs classic: prejsť alebo počkať?** — aktuálne rozhodnutie (2026).
13. **Rýchla Woo administrácia pri 10 000+ produktoch** — škálovanie adminu, nadväzuje na faceted-filtre.
14. **Abandoned cart recovery na WooCommerce bez drahých pluginov** — konverzný ťahák.

## SEO / AEO
15. **AEO: ako pripraviť obsah pre AI odpovede (ChatGPT, Perplexity, Google AI)** — veľmi aktuálne, on-brand.
16. **Sitemapy, ktoré Google naozaj prečíta — a časté chyby** — technické SEO.
17. **Programmatic SEO pre malé firmy: kedy dáva zmysel (a kedy je to spam)** — triezvy pohľad.

## Prístupnosť / dizajn
18. **Prístupné formuláre: chyby, ktoré robí 90 % webov** — nadväzuje na a11y klaster.
19. **Farebný kontrast a dizajn: splniť AA bez toho, aby to bolo škaredé** — praktický príbeh (aj z tohto webu).

## AI-for-web / proces
20. **Ako používam AI pri stavbe webov — a kde mu neverím** — osobný, dôveryhodný, podporuje „AI integrácie" službu.


---

# Exaktný plán publikácie (všetkých 62 + 3 už live)

Kadencia **2/týž (ut + št)**, štart **2026-07-14**. `[N]` = nová téma (treba napísať). Ostatné sú pripravené drafty.

| # | Dátum | Slug | Nová? |
|---|---|---|---|
| 1 | 2026-07-14 | woocommerce-vs-shopify |  |
| 2 | 2026-07-16 | hostingy-sk-vykon |  |
| 3 | 2026-07-21 | plugin-dieta-z-28-na-9 |  |
| 4 | 2026-07-23 | cwv-eshop-priorita |  |
| 5 | 2026-07-28 | inp-pod-200ms-wordpress |  |
| 6 | 2026-07-30 | server-response-200ms |  |
| 7 | 2026-08-04 | ttfb-pod-200ms | 🆕 |
| 8 | 2026-08-06 | sk-platobne-brany-2026 |  |
| 9 | 2026-08-11 | wp-bezpecnost-2026 |  |
| 10 | 2026-08-13 | wp-migracia-bez-vypadku |  |
| 11 | 2026-08-18 | wp-theme-vyber-6-kriterii |  |
| 12 | 2026-08-20 | acf-vs-metabox-vs-cf |  |
| 13 | 2026-08-25 | seo-checklist-co-pomaha |  |
| 14 | 2026-08-27 | internal-linking-topic-clusters |  |
| 15 | 2026-09-01 | local-seo-bratislava |  |
| 16 | 2026-09-03 | sitemapy-bez-chyb | 🆕 |
| 17 | 2026-09-08 | schema-org-eshop-templates |  |
| 18 | 2026-09-10 | faceted-filtre-bez-elasticsearch |  |
| 19 | 2026-09-15 | doprava-sklad-pohoda |  |
| 20 | 2026-09-17 | woo-admin-10000-produktov | 🆕 |
| 21 | 2026-09-22 | woo-checkout-blocks-vs-classic | 🆕 |
| 22 | 2026-09-24 | abandoned-cart-woocommerce | 🆕 |
| 23 | 2026-09-29 | cenotvorba-eshop-models |  |
| 24 | 2026-10-01 | brief-3-tyzdne |  |
| 25 | 2026-10-06 | discovery-call-30-minut |  |
| 26 | 2026-10-08 | redis-object-cache-wordpress | 🆕 |
| 27 | 2026-10-13 | wp-cli-12-prikazov | 🆕 |
| 28 | 2026-10-15 | cpt-taxonomie-bez-pluginu | 🆕 |
| 29 | 2026-10-20 | wordpress-bez-page-builderu | 🆕 |
| 30 | 2026-10-22 | gutenberg-blocks-marketeri |  |
| 31 | 2026-10-27 | nextjs-app-vs-pages-router |  |
| 32 | 2026-10-29 | nextjs-cache-revalidate |  |
| 33 | 2026-11-03 | nextjs-form-actions |  |
| 34 | 2026-11-05 | nextjs-middleware-prakticky | 🆕 |
| 35 | 2026-11-10 | react-19-migracia |  |
| 36 | 2026-11-12 | server-components-5-veci |  |
| 37 | 2026-11-17 | streaming-suspense-app-router | 🆕 |
| 38 | 2026-11-19 | parallel-intercepting-routes | 🆕 |
| 39 | 2026-11-24 | isr-namiesto-cron |  |
| 40 | 2026-11-26 | nextimage-vs-vlastne | 🆕 |
| 41 | 2026-12-01 | astro-vs-nextjs-tabulka |  |
| 42 | 2026-12-03 | astro-content-collections-mdx |  |
| 43 | 2026-12-08 | astro-view-transitions-eshop |  |
| 44 | 2026-12-10 | wp-rest-api-nextjs |  |
| 45 | 2026-12-15 | font-loading-fout-foit | 🆕 |
| 46 | 2026-12-17 | third-party-skripty-vykon | 🆕 |
| 47 | 2026-12-22 | cls-mobil-banner |  |
| 48 | 2026-12-24 | image-lazy-loading-native-vs-custom |  |
| 49 | 2026-12-29 | bundle-audit-astro-nextjs |  |
| 50 | 2026-12-31 | webpagetest-za-5-minut |  |
| 51 | 2027-01-05 | ai-search-pre-malu-firmu |  |
| 52 | 2027-01-07 | ai-content-eeat |  |
| 53 | 2027-01-12 | ai-alt-text-seo |  |
| 54 | 2027-01-14 | aeo-obsah-pre-ai | 🆕 |
| 55 | 2027-01-19 | ai-pri-stavbe-webov | 🆕 |
| 56 | 2027-01-21 | programmatic-seo-male-firmy | 🆕 |
| 57 | 2027-01-26 | wcag-aa-80-20 |  |
| 58 | 2027-01-28 | keyboard-only-test |  |
| 59 | 2027-02-02 | focus-management-dialog |  |
| 60 | 2027-02-04 | pristupne-formulare | 🆕 |
| 61 | 2027-02-09 | kontrast-dizajn-aa | 🆕 |
| 62 | 2027-02-11 | vercel-vs-cloudflare-vs-vps |  |

**Publikuj klaster naraz** (rovnaký týždeň) nech crosslinky nemieria na nepublikované. Posledný článok vyjde **2027-02-11**.
