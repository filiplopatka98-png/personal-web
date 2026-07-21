import { describe, it, expect } from 'vitest';
import { staticRoutes, getStaticRoute } from './routes';

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
