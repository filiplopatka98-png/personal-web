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
