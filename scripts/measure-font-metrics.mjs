/**
 * Measure metric-matched fallback descriptors for the self-hosted web fonts.
 *
 *   node scripts/measure-font-metrics.mjs
 *
 * For each web font (loaded from its woff2) and its intended system fallback,
 * we measure the font bounding box + average advance in a headless Chromium
 * canvas, then compute `size-adjust` / `ascent-override` / `descent-override`
 * so a fallback @font-face occupies the SAME space as the web font — which
 * removes the layout shift when the web font swaps in (CLS).
 *
 * One-shot dev tool (like build-og-image.mjs): paste the printed @font-face
 * blocks into src/styles/fonts.css. No runtime dependency is added.
 */
import puppeteer from 'puppeteer';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fontsDir = join(__dirname, '..', 'public/fonts');

// web font file → { family, fallback (a local system font), weight, style }
const FONTS = [
  { file: 'instrument-serif.woff2', family: 'Instrument Serif', fallback: 'Georgia', weight: 400, style: 'normal' },
  { file: 'geist-regular.woff2', family: 'Geist', fallback: 'Arial', weight: 400, style: 'normal' },
];

const SAMPLE = 'Hxbdfghjklpqy ABCDEFGKM áäčďéíĺľňóôŕšťúýž 0123456789';
const S = 1000; // measure at a big size for precision

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();

const results = [];
for (const f of FONTS) {
  const b64 = readFileSync(join(fontsDir, f.file)).toString('base64');
  const m = await page.evaluate(async ({ b64, family, fallback, sample, size }) => {
    const face = new FontFace(`__m_${family}`, `url(data:font/woff2;base64,${b64}) format('woff2')`);
    await face.load();
    document.fonts.add(face);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    function measure(fam) {
      ctx.font = `${size}px ${fam}`;
      const t = ctx.measureText(sample);
      return { asc: t.fontBoundingBoxAscent, desc: t.fontBoundingBoxDescent, width: t.width };
    }
    return { web: measure(`__m_${family}`), fb: measure(fallback) };
  }, { b64, family: f.family, fallback: f.fallback, sample: SAMPLE, size: S });

  const sizeAdjust = m.web.width / m.fb.width;
  const ascentOverride = (m.web.asc / S) / sizeAdjust;
  const descentOverride = (m.web.desc / S) / sizeAdjust;
  results.push({ ...f, sizeAdjust, ascentOverride, descentOverride });
}

await browser.close();

const pct = (n) => `${(n * 100).toFixed(2)}%`;
for (const r of results) {
  console.log(`\n/* ${r.family} → metric-matched ${r.fallback} fallback */`);
  console.log(`@font-face {
  font-family: '${r.family} Fallback';
  src: local('${r.fallback}');
  font-weight: ${r.weight};
  font-style: ${r.style};
  size-adjust: ${pct(r.sizeAdjust)};
  ascent-override: ${pct(r.ascentOverride)};
  descent-override: ${pct(r.descentOverride)};
  line-gap-override: 0%;
}`);
}
