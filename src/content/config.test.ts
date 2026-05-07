import { describe, it, expect } from 'vitest';
import { projectSchema, articleSchema, serviceSchema } from './schemas';

describe('projectSchema', () => {
  it('accepts a valid project', () => {
    const valid = {
      name: 'Pekáreň Veverka',
      kind: 'E-shop · WooCommerce',
      year: '2025',
      role: 'Lead developer',
      duration: '3 mesiace',
      client: 'Pekáreň Veverka, s.r.o.',
      accent: 'accent',
      brief: 'Prerobiť pomalý WooCommerce eshop.',
      metrics: [{ value: '+38%', label: 'tržby Q1' }],
      process: [{ title: 'Audit', duration: '2 týždne', desc: 'Lighthouse + WPT.' }],
      stack: ['WordPress', 'WooCommerce'],
    };
    expect(() => projectSchema.parse(valid)).not.toThrow();
  });

  it('rejects invalid accent', () => {
    const invalid = {
      name: 'X', kind: 'X', year: '2025', role: 'X', duration: 'X', client: 'X',
      accent: 'wrongcolor', brief: 'long enough brief',
    };
    expect(() => projectSchema.parse(invalid)).toThrow();
  });

  it('defaults featured to false', () => {
    const result = projectSchema.parse({
      name: 'X', kind: 'X', year: '2025', role: 'X', duration: 'X', client: 'X',
      brief: 'long enough brief',
    });
    expect(result.featured).toBe(false);
  });

  it('defaults accent to "accent"', () => {
    const result = projectSchema.parse({
      name: 'X', kind: 'X', year: '2025', role: 'X', duration: 'X', client: 'X',
      brief: 'long enough brief',
    });
    expect(result.accent).toBe('accent');
  });
});

describe('articleSchema', () => {
  it('coerces date string to Date', () => {
    const result = articleSchema.parse({
      title: 'Test article',
      date: '2026-04-15',
      excerpt: 'a long excerpt here',
    });
    expect(result.date).toBeInstanceOf(Date);
  });

  it('defaults read time to 5', () => {
    const result = articleSchema.parse({
      title: 'X',
      date: '2026-04-15',
      excerpt: 'long enough excerpt',
    });
    expect(result.read).toBe(5);
  });

  it('rejects too-short excerpt', () => {
    expect(() => articleSchema.parse({
      title: 'X',
      date: '2026-04-15',
      excerpt: 'short',
    })).toThrow();
  });
});

describe('serviceSchema', () => {
  it('requires non-empty includes array', () => {
    const invalid = {
      name: 'X', price: 'X', duration: 'X', tagline: 'X',
      desc: 'long enough description', includes: [],
    };
    expect(() => serviceSchema.parse(invalid)).toThrow();
  });

  it('accepts notFor as optional', () => {
    const result = serviceSchema.parse({
      name: 'X', price: 'X', duration: 'X', tagline: 'X',
      desc: 'long enough description', includes: ['one item'],
    });
    expect(result.notFor).toBeUndefined();
  });

  it('defaults featured to false', () => {
    const result = serviceSchema.parse({
      name: 'X', price: 'X', duration: 'X', tagline: 'X',
      desc: 'long enough description', includes: ['x'],
    });
    expect(result.featured).toBe(false);
  });
});
