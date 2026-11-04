import { describe, it, expect } from 'vitest';
import { PRICES, eur, fillPrices, withPrices } from './pricing';

describe('fillPrices', () => {
  it('fills known tokens per language', () => {
    expect(fillPrices('od {eshop}', 'sk')).toBe(`od ${eur(PRICES.eshop, 'sk')}`);
    expect(fillPrices('from {care} / month', 'en')).toBe(`from ${eur(PRICES.care, 'en')} / month`);
  });
  it('leaves unknown tokens alone', () => {
    expect(fillPrices('{nope}', 'sk')).toBe('{nope}');
  });
  it('fills every copy field of a service', () => {
    const d = withPrices({ price: 'od {web}', tagline: 't', desc: '{consultHour}/h', includes: ['{careEshop}'], notFor: '{speed}' }, 'sk');
    expect(d.price).toBe(`od ${eur(PRICES.web, 'sk')}`);
    expect(d.desc).toBe(`${eur(PRICES.consultHour, 'sk')}/h`);
    expect(d.includes[0]).toBe(eur(PRICES.careEshop, 'sk'));
    expect(d.notFor).toBe(eur(PRICES.speed, 'sk'));
  });
});
