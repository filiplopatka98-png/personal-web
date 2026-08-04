export interface AgencyStats {
  sites_monitored: number;
  avg_uptime_30d: number | null;
  avg_uptime_90d: number | null;
  checks_total: number;
  incidents_resolved: number;
  avg_response_ms: number | null;
  monitoring_since: string | null;
}

export interface SitePerf {
  performance_score: number | null;
  accessibility: number | null;
  seo: number | null;
  lcp_ms: number | null;
  uptime_30d: number | null;
  measured_at: string | null;
}

export interface MonitorixData {
  agency: AgencyStats | null;
  sites: Record<string, SitePerf>;
  fetched_at: string | null;
}

const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : null;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

export function coerceAgencyStats(raw: unknown): AgencyStats | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  return {
    sites_monitored: num(r.sites_monitored) ?? 0,
    avg_uptime_30d: num(r.avg_uptime_30d),
    avg_uptime_90d: num(r.avg_uptime_90d),
    checks_total: num(r.checks_total) ?? 0,
    incidents_resolved: num(r.incidents_resolved) ?? 0,
    avg_response_ms: num(r.avg_response_ms),
    monitoring_since: typeof r.monitoring_since === 'string' ? r.monitoring_since : null,
  };
}

export function coerceSitePerf(raw: unknown): SitePerf | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  return {
    performance_score: num(r.performance_score),
    accessibility: num(r.accessibility),
    seo: num(r.seo),
    lcp_ms: num(r.lcp_ms),
    uptime_30d: num(r.uptime_30d),
    measured_at: typeof r.measured_at === 'string' ? r.measured_at : null,
  };
}

export function hasAgencyStats(a: AgencyStats | null): a is AgencyStats {
  return !!a && a.sites_monitored > 0;
}

export function formatUptime(pct: number | null, locale = 'sk'): string | null {
  if (pct == null) return null;
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(pct) + ' %';
}

// Default locale is intentionally 'en' — Slovak compact "2,4 mil." is longer and would fail length tests; callers pass explicit locale if needed.
export function formatCompact(n: number, locale = 'en'): string {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export function formatLcp(ms: number | null, locale = 'sk'): string | null {
  if (ms == null) return null;
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(ms / 1000) + ' s';
}
