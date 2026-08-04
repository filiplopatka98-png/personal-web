import { describe, it, expect } from 'vitest';
import { normalizeDomain } from './domain';

describe('normalizeDomain', () => {
  it('strips protocol, www, path and query', () => {
    expect(normalizeDomain('https://www.Agrodielyvyder.SK/eshop?x=1')).toBe('agrodielyvyder.sk');
  });
  it('passes a bare domain through', () => {
    expect(normalizeDomain('agrodielyvyder.sk')).toBe('agrodielyvyder.sk');
  });
  it('handles http and trailing slash', () => {
    expect(normalizeDomain('http://foo.sk/')).toBe('foo.sk');
  });
});
