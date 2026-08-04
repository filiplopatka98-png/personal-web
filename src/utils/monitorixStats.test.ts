import { describe, it, expect } from 'vitest';
import {
  coerceAgencyStats, coerceSitePerf, hasAgencyStats, formatUptime, formatCompact, formatLcp,
} from './monitorixStats';

describe('coerceAgencyStats', () => {
  it('returns null for null/non-object', () => {
    expect(coerceAgencyStats(null)).toBeNull();
    expect(coerceAgencyStats('x')).toBeNull();
  });
  it('coerces numeric fields', () => {
    const a = coerceAgencyStats({ sites_monitored: '12', avg_uptime_30d: '99.94', checks_total: 2400000 });
    expect(a?.sites_monitored).toBe(12);
    expect(a?.avg_uptime_30d).toBe(99.94);
  });
});

describe('coerceSitePerf', () => {
  it('returns null for null/non-object', () => {
    expect(coerceSitePerf(null)).toBeNull();
    expect(coerceSitePerf('x')).toBeNull();
  });
  it('coerces numeric fields and sets missing to null', () => {
    const perf = coerceSitePerf({ performance_score: '98', lcp_ms: 1180, uptime_30d: '99.9' });
    expect(perf?.performance_score).toBe(98);
    expect(perf?.lcp_ms).toBe(1180);
    expect(perf?.uptime_30d).toBe(99.9);
    expect(perf?.seo).toBeNull();
    expect(perf?.accessibility).toBeNull();
  });
});

describe('hasAgencyStats', () => {
  it('false when null or zero sites', () => {
    expect(hasAgencyStats(null)).toBe(false);
    expect(hasAgencyStats(coerceAgencyStats({ sites_monitored: 0 }))).toBe(false);
  });
  it('true when sites_monitored > 0', () => {
    expect(hasAgencyStats(coerceAgencyStats({ sites_monitored: 3 }))).toBe(true);
  });
});

describe('formatters', () => {
  it('formatUptime null-safe with unit', () => {
    expect(formatUptime(null)).toBeNull();
    expect(formatUptime(99.9)).toContain('%');
  });
  it('formatCompact shrinks large numbers', () => {
    expect(formatCompact(2400000).length).toBeLessThan('2400000'.length);
  });
  it('formatLcp converts ms to seconds', () => {
    expect(formatLcp(1180)).toContain('s');
    expect(formatLcp(null)).toBeNull();
  });
});
