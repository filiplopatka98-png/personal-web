import { describe, it, expect } from 'vitest';
import { t, type Lang } from './index';

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
