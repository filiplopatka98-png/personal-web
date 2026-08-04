/**
 * DOČASNÝ launch allowlist pre blog.
 *
 * Kým je `ARTICLE_ALLOWLIST` neprázdny, na webe sa zobrazujú IBA tieto články
 * (SK slug vrátane prefixu `sk/`). Ostatné sa negenerujú (404) a nikde sa
 * nelistujú. Skryté zostávajú v repo, len sa nepublikujú.
 *
 * OBNOVENIE CELÉHO BLOGU: nastav `ARTICLE_ALLOWLIST = null` (alebo prázdne pole).
 */
export const ARTICLE_ALLOWLIST: string[] | null = [
  'sk/checkout-konvertuje-9-uprav',
  'sk/lcp-nad-2-5s-pricin',
  'sk/headless-woo-nextjs-kedy',
  'en/checkout-konvertuje-9-uprav',
  'en/lcp-nad-2-5s-pricin',
  'en/headless-woo-nextjs-kedy',
  // 2026-08 — nové články (HPOS, Speculation Rules, CSS :has())
  'sk/woocommerce-hpos-migracia',
  'sk/speculation-rules-instant-navigacia',
  'sk/css-has-selektor-prakticky',
  'en/woocommerce-hpos-migracia',
  'en/speculation-rules-instant-navigacia',
  'en/css-has-selektor-prakticky',
  // 2026-08 — buyer-intent články (SK lokál + EN medzinárodne): cena, výber,
  // porovnania, proces — ťahajú klientov, nie devov.
  'sk/cenotvorba-eshop-models',
  'sk/woocommerce-vs-shopify',
  'sk/sk-platobne-brany-2026',
  'sk/discovery-call-30-minut',
  'sk/brief-3-tyzdne',
  'sk/hostingy-sk-vykon',
  'en/cenotvorba-eshop-models',
  'en/woocommerce-vs-shopify',
  'en/sk-platobne-brany-2026',
  'en/discovery-call-30-minut',
  'en/brief-3-tyzdne',
  'en/hostingy-sk-vykon',
  // 2026-08 — nové buyer-intent články (cena, výber technológie)
  'sk/kolko-stoji-web-eshop-2026',
  'sk/wordpress-alebo-web-na-mieru',
  'en/kolko-stoji-web-eshop-2026',
  'en/wordpress-alebo-web-na-mieru',
];

/** Vyfiltruje kolekciu článkov na povolené (ak je allowlist aktívny). */
export function visibleArticles<T extends { id: string }>(list: T[]): T[] {
  if (!ARTICLE_ALLOWLIST || ARTICLE_ALLOWLIST.length === 0) return list;
  const allow = new Set(ARTICLE_ALLOWLIST);
  return list.filter((a) => allow.has(a.id));
}
