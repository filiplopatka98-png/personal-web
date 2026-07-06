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
];

/** Vyfiltruje kolekciu článkov na povolené (ak je allowlist aktívny). */
export function visibleArticles<T extends { slug: string }>(list: T[]): T[] {
  if (!ARTICLE_ALLOWLIST || ARTICLE_ALLOWLIST.length === 0) return list;
  const allow = new Set(ARTICLE_ALLOWLIST);
  return list.filter((a) => allow.has(a.slug));
}
