import { describe, expect, it } from 'vitest';
import { buildServiceCatalog, isMonthlyPrice, parseStartingPrice } from './serviceCatalog';
import type { Service } from '../content/schemas';

const base: Service = {
  order: 1,
  name: 'X',
  price: 'od 600 €',
  duration: '2 týždne',
  tagline: 'Tagline',
  desc: 'Description text',
  featured: false,
  recurring: false,
  includes: ['a'],
};
const opts = { name: 'Služby', orgId: 'https://lopatka.sk/#org', inLanguage: 'sk-SK' };

describe('serviceCatalog prices', () => {
  it('parses monthly prices', () => {
    expect(parseStartingPrice('od 39 € / mesiac')).toBe(39);
    expect(parseStartingPrice('from €39 / month')).toBe(39);
  });

  it('detects monthly prices only', () => {
    expect(isMonthlyPrice('od 39 € / mesiac')).toBe(true);
    expect(isMonthlyPrice('from €39 / month')).toBe(true);
    expect(isMonthlyPrice('od 2 000 €')).toBe(false);
    expect(isMonthlyPrice('od 300 €')).toBe(false);
  });

  it('emits a monthly UnitPriceSpecification and a one-off PriceSpecification', () => {
    const ld = buildServiceCatalog(
      [base, { ...base, name: 'Údržba', price: 'od 39 € / mesiac' }],
      opts,
    ) as { itemListElement: { priceSpecification: Record<string, unknown> }[] };
    expect(ld.itemListElement[0].priceSpecification).toEqual({
      '@type': 'PriceSpecification', minPrice: 600, priceCurrency: 'EUR',
    });
    expect(ld.itemListElement[1].priceSpecification).toEqual({
      '@type': 'UnitPriceSpecification', minPrice: 39, priceCurrency: 'EUR', unitCode: 'MON',
    });
  });
});
