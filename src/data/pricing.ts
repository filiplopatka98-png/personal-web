/**
 * Single source of truth for public prices (EUR). Calculator, brief, hero,
 * FAQ and service pages read from here — change a number once.
 * Public "from" prices follow the Google Business Profile.
 */
export type Lang = 'sk' | 'en';
export type ProjectType = 'web' | 'eshop';

export const PRICES = {
  web: 390,
  eshop: 1490,
  speed: 390,
  care: 39, // per month
  consultHour: 30,
} as const;

/** Add-ons: price per project type; `null` = not offered for that type. */
export interface Addon {
  key: string;
  price: Record<ProjectType, number | null>;
  from?: boolean; // "od" — final price depends on scope
  label: Record<Lang, string>;
}

export const ADDONS: Addon[] = [
  { key: 'multilang', price: { web: 150, eshop: 250 }, label: { sk: 'Ďalší jazyk (preklad dodáte vy)', en: 'Extra language (you supply the translation)' } },
  { key: 'blog', price: { web: 90, eshop: 90 }, label: { sk: 'Blog / aktuality', en: 'Blog / news' } },
  { key: 'booking', price: { web: 190, eshop: 190 }, from: true, label: { sk: 'Rezervačný alebo objednávkový systém', en: 'Booking or ordering system' } },
  { key: 'stock', price: { web: null, eshop: 190 }, from: true, label: { sk: 'Napojenie na sklad či účtovníctvo (SuperFaktúra, Pohoda…)', en: 'Stock or accounting integration' } },
  { key: 'migration', price: { web: 120, eshop: 250 }, label: { sk: 'Prenos z existujúceho webu (obsah + presmerovania)', en: 'Migration from an existing site (content + redirects)' } },
  { key: 'copy', price: { web: 120, eshop: 120 }, label: { sk: 'Texty na mieru (do 5 stránok)', en: 'Custom copy (up to 5 pages)' } },
  { key: 'inquiry', price: { web: 50, eshop: 50 }, label: { sk: 'Podrobný dopytový formulár', en: 'Detailed inquiry form' } },
  { key: 'calculator', price: { web: 90, eshop: 90 }, label: { sk: 'Orientačná cenová kalkulačka', en: 'Price estimate calculator' } },
  { key: 'configurator', price: { web: 200, eshop: 200 }, from: true, label: { sk: 'Konfigurátor na mieru', en: 'Custom configurator' } },
];

/** E-shop product count surcharge (bulk import). */
export const PRODUCT_COUNT: { key: string; add: number; label: Record<Lang, string> }[] = [
  { key: 'do50', add: 0, label: { sk: 'do 50', en: 'up to 50' } },
  { key: 'mid', add: 150, label: { sk: '50 – 500', en: '50–500' } },
  { key: 'large', add: 300, label: { sk: '500+', en: '500+' } },
];

/** [low, high] weeks; calculator adds +1 to high per 2 add-ons. */
export const WEEKS: Record<ProjectType, [number, number]> = {
  web: [2, 4],
  eshop: [4, 8],
};

/** "1 490 €" (sk) / "€1,490" (en) — non-breaking space as thousands separator. */
export function eur(n: number, lang: Lang): string {
  if (lang === 'en') return `€${n.toLocaleString('en-US')}`;
  return `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`;
}

/** "od 390 €" / "from €390" */
export function fromPrice(n: number, lang: Lang): string {
  return `${lang === 'sk' ? 'od' : 'from'} ${eur(n, lang)}`;
}
