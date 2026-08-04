// Build-time pull of monitorix marketing data. Intended to run in the `prebuild` step
// (wired in a later task); daily refresh will come from a scheduled GitHub Action.
// On any error (no env / network / non-200) it KEEPS the existing committed src/data/monitorix.json
// so the build never breaks.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../src/data/monitorix.json');
const PROJECTS_DIR = join(__dirname, '../src/content/projects');

const BASE = process.env.PUBLIC_MONITORIX_URL;
const KEY = process.env.PUBLIC_MONITORIX_ANON_KEY;

// Keep in sync with src/utils/domain.ts (standalone script can't import TS).
const normalizeDomain = (s) =>
  s.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[/?#].*$/, '');

function loadExisting() {
  try { return JSON.parse(readFileSync(OUT, 'utf8')); }
  catch { return { agency: null, sites: {}, fetched_at: null }; }
}

function projectDomains() {
  const out = new Set();
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) {
        const m = readFileSync(p, 'utf8').match(/^url:\s*["']?([^"'\n]+)/m);
        if (m) out.add(normalizeDomain(m[1]));
      }
    }
  };
  try { walk(PROJECTS_DIR); } catch { /* no projects yet */ }
  return [...out];
}

async function rpc(fn, body) {
  const res = await fetch(`${BASE}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${KEY}` },
    body: JSON.stringify(body || {}),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`${fn} → HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const existing = loadExisting();
  if (!BASE || !KEY) {
    console.warn('[monitorix] PUBLIC_MONITORIX_URL/ANON_KEY not set — keeping existing monitorix.json');
    return;
  }
  const next = { agency: existing.agency, sites: { ...existing.sites }, fetched_at: existing.fetched_at };
  let ok = false;
  try { next.agency = await rpc('public_agency_stats'); ok = true; }
  catch (e) { console.warn('[monitorix] agency stats failed:', e.message); }
  for (const d of projectDomains()) {
    try { const perf = await rpc('public_site_perf', { p_domain: d }); if (perf) next.sites[d] = perf; ok = true; }
    catch (e) { console.warn(`[monitorix] perf ${d} failed:`, e.message); }
  }
  if (ok) next.fetched_at = new Date().toISOString();
  writeFileSync(OUT, JSON.stringify(next, null, 2) + '\n');
  console.log(`[monitorix] wrote ${OUT} (${Object.keys(next.sites).length} sites)`);
}

main();
