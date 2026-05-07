/**
 * Build og:image PNG from src/assets/og-default.svg.
 *
 * Run manually after editing the SVG:
 *   npm run og
 *
 * Output: public/og-default.png (1200×630). Commit the PNG.
 *
 * Why a one-shot script and not a build hook: regen is rare (only when the
 * brand visuals change), and we want the PNG checked into git so social
 * crawlers find a stable URL without runtime dependencies on the GH Pages
 * deploy.
 */
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const svgPath = join(root, 'src/assets/og-default.svg');
const fontsDir = join(root, 'public/fonts');
const outPath = join(root, 'public/og-default.png');

const svg = readFileSync(svgPath, 'utf8');

// Load every woff2 in public/fonts so resvg can resolve Instrument Serif and
// Geist Mono (named in the SVG via font-family). System fallback (Georgia,
// monospace) kicks in if a glyph is missing — which would only happen for
// extended Latin we don't use here.
const fontFiles = readdirSync(fontsDir)
  .filter((f) => f.endsWith('.woff2') || f.endsWith('.ttf') || f.endsWith('.otf'))
  .map((f) => join(fontsDir, f));

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: {
    fontFiles,
    loadSystemFonts: true,
    defaultFontFamily: 'Georgia',
  },
});

const pngData = resvg.render().asPng();
writeFileSync(outPath, pngData);
console.log(`✓ wrote ${outPath} (${pngData.length} bytes)`);
