import { describe, it, expect } from 'vitest';
import { staticRoutes, getAltUrl, getStaticRoute } from './routes';

describe('staticRoutes', () => {
  it('exposes 6 top-level page keys (4 main + 2 legal)', () => {
    expect(Object.keys(staticRoutes)).toHaveLength(6);
    expect(Object.keys(staticRoutes).sort()).toEqual(
      ['blog', 'brief', 'imprint', 'privacy', 'services', 'work'].sort()
    );
  });

  it('every entry has both sk and en path', () => {
    for (const paths of Object.values(staticRoutes)) {
      expect(paths.sk).toMatch(/^\//);
      expect(paths.en).toMatch(/^\/en\//);
    }
  });
});

describe('getStaticRoute', () => {
  it('returns SK path for sk lang', () => {
    expect(getStaticRoute('work', 'sk')).toBe('/praca/');
  });

  it('returns EN path for en lang', () => {
    expect(getStaticRoute('work', 'en')).toBe('/en/work/');
  });
});

describe('getAltUrl', () => {
  it('maps SK home to EN home', () => {
    expect(getAltUrl('/', 'sk')).toBe('/en/');
  });

  it('maps EN home to SK home', () => {
    expect(getAltUrl('/en/', 'en')).toBe('/');
  });

  it('maps SK static page to EN equivalent', () => {
    expect(getAltUrl('/praca/', 'sk')).toBe('/en/work/');
    expect(getAltUrl('/ponuka/', 'sk')).toBe('/en/brief/');
  });

  it('maps EN static page to SK equivalent', () => {
    expect(getAltUrl('/en/work/', 'en')).toBe('/praca/');
    expect(getAltUrl('/en/brief/', 'en')).toBe('/ponuka/');
  });

  it('returns null for unknown path', () => {
    expect(getAltUrl('/totally-unknown/', 'sk')).toBeNull();
  });
});
