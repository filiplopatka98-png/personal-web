/**
 * Per-page Open Graph image generation.
 *
 * Renders a title-templated 1200×630 card (matching src/assets/og-default.svg
 * — warm bg, terracotta blobs, Instrument Serif title, mono eyebrow/footer) to
 * PNG via @resvg/resvg-js. Used by the /og/**.png.ts endpoints, which Astro
 * prerenders to static files at build time (no runtime dependency, works on
 * GitHub Pages).
 */
import { Resvg } from '@resvg/resvg-js';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const WIDTH = 1200;
const HEIGHT = 630;
const MARGIN_X = 80;
const TITLE_MAX_WIDTH = 1040;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Greedy word-wrap to at most `maxChars` per line, capped at `maxLines`. */
function wrapTitle(title: string, maxChars: number, maxLines: number): string[] {
  const words = title.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    } else {
      current = candidate;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  // If the title overflowed maxLines, add an ellipsis to the last line.
  const consumed = lines.join(' ').split(/\s+/).length;
  if (consumed < words.length && lines.length) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/[.,;:]?$/, '…');
  }
  return lines;
}

interface OgOptions {
  /** Small mono eyebrow, e.g. "BLOG · FILIP LOPATKA". */
  eyebrow: string;
  /** Main title (will be wrapped). */
  title: string;
  /** Mono footer line, e.g. "Web developer · WordPress · SK". */
  footer: string;
  /** Right-aligned mono URL, defaults to lopatka.sk. */
  url?: string;
}

export function buildOgSvg({ eyebrow, title, footer, url = 'lopatka.sk' }: OgOptions): string {
  // Scale the title down as it gets longer so long headlines still fit.
  const len = title.length;
  const fontSize = len > 70 ? 60 : len > 46 ? 72 : 84;
  const lineHeight = Math.round(fontSize * 1.12);
  const maxChars = Math.floor(TITLE_MAX_WIDTH / (fontSize * 0.46));
  const lines = wrapTitle(title, maxChars, 4);
  const blockHeight = lines.length * lineHeight;
  // Vertically center the title block in the area between eyebrow and footer.
  let y = Math.round((HEIGHT - blockHeight) / 2) + fontSize * 0.4 + 20;

  const titleTspans = lines
    .map((line) => {
      const t = `<text x="${MARGIN_X}" y="${Math.round(y)}" font-family="Instrument Serif, Georgia, serif" font-size="${fontSize}" fill="#1F1813" font-weight="400" letter-spacing="-2">${escapeXml(line)}</text>`;
      y += lineHeight;
      return t;
    })
    .join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#F4ECE0"/>
  <defs>
    <filter id="blur1" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="55"/></filter>
    <filter id="blur2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="45"/></filter>
  </defs>
  <ellipse cx="990" cy="150" rx="240" ry="240" fill="#D2693A" opacity="0.5" filter="url(#blur1)"/>
  <ellipse cx="880" cy="380" rx="160" ry="160" fill="#E8A33D" opacity="0.4" filter="url(#blur2)"/>
  <text x="${MARGIN_X}" y="110" font-family="Geist Mono, ui-monospace, monospace" font-size="20" fill="#1F1813" fill-opacity="0.6" letter-spacing="2.5">${escapeXml(eyebrow)}</text>
  ${titleTspans}
  <text x="${MARGIN_X}" y="555" font-family="Geist Mono, ui-monospace, monospace" font-size="22" fill="#1F1813" fill-opacity="0.5" letter-spacing="1">${escapeXml(footer)}</text>
  <text x="${WIDTH - MARGIN_X}" y="555" font-family="Geist Mono, ui-monospace, monospace" font-size="22" fill="#1F1813" fill-opacity="0.5" letter-spacing="1" text-anchor="end">${escapeXml(url)}</text>
</svg>`;
}

let cachedFontFiles: string[] | null = null;
function fontFiles(): string[] {
  if (cachedFontFiles) return cachedFontFiles;
  const dir = join(process.cwd(), 'public/fonts');
  cachedFontFiles = readdirSync(dir)
    .filter((f) => /\.(woff2|ttf|otf)$/.test(f))
    .map((f) => join(dir, f));
  return cachedFontFiles;
}

export function renderOgPng(svg: string): ArrayBuffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
    font: {
      fontFiles: fontFiles(),
      loadSystemFonts: true,
      defaultFontFamily: 'Georgia',
    },
  });
  const png = resvg.render().asPng();
  // Return a plain ArrayBuffer (valid Response BodyInit) sliced to the exact
  // byte range — avoids Node Buffer / ArrayBufferLike typing friction.
  return png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer;
}
