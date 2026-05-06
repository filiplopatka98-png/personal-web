import { describe, it, expect } from 'vitest';
import { staticRoutes, getAltUrl, getStaticRoute } from './routes';

describe('staticRoutes', () => {
  it('exposes 5 top-level page keys', () => {
    expect(Object.keys(staticRoutes)).toHaveLength(5);
    expect(Object.keys(staticRoutes).sort()).toEqual(
      ['about', 'blog', 'contact', 'projects', 'services'].sort()
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
    expect(getStaticRoute('about', 'sk')).toBe('/o-mne/');
  });

  it('returns EN path for en lang', () => {
    expect(getStaticRoute('about', 'en')).toBe('/en/about/');
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
    expect(getAltUrl('/o-mne/', 'sk')).toBe('/en/about/');
    expect(getAltUrl('/projekty/', 'sk')).toBe('/en/projects/');
  });

  it('maps EN static page to SK equivalent', () => {
    expect(getAltUrl('/en/about/', 'en')).toBe('/o-mne/');
    expect(getAltUrl('/en/blog/', 'en')).toBe('/blog/');
  });

  it('returns null for unknown path', () => {
    expect(getAltUrl('/totally-unknown/', 'sk')).toBeNull();
  });
});
