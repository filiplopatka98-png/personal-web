import { describe, it, expect } from 'vitest';
import { t } from './index';
import skDict from './sk.json';
import enDict from './en.json';

describe('t() — i18n helper', () => {
  it('returns SK string for SK lang', () => {
    expect(t('nav.about', 'sk')).toBe('O mne');
  });

  it('returns EN string for EN lang', () => {
    expect(t('nav.about', 'en')).toBe('About');
  });

  it('returns key itself when key is missing (fail-loud)', () => {
    expect(t('nonexistent.key' as any, 'sk')).toBe('nonexistent.key');
  });

  it('interpolates {placeholder} variables', () => {
    expect(t('footer.copy', 'sk', { year: '2026' })).toBe('© 2026 Filip Lopatka');
    expect(t('footer.copy', 'en', { year: '2026' })).toBe('© 2026 Filip Lopatka');
  });

  it('leaves unknown placeholders untouched', () => {
    // when interpolating something other than {year}, leaves it alone
    const result = t('footer.copy', 'sk', { wrong: 'X' });
    expect(result).toBe('© {year} Filip Lopatka');
  });
});

describe('SK and EN dictionaries — parity', () => {
  it('have identical key sets (catches drift in either direction)', () => {
    const skKeys = Object.keys(skDict).sort();
    const enKeys = Object.keys(enDict).sort();
    expect(enKeys).toEqual(skKeys);
  });
});
