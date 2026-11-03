/**
 * Per-page Open Graph image generation.
 *
 * Renders a title-templated 1200×630 card (B2 light: white, Archivo, yellow
 * footer band and circle — matches src/assets/og-default.svg) to
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
  // B2 light (11/2026): white card, Archivo ExtraBold title, yellow footer band,
  // one yellow circle as the brand mark. Fonts: src/assets/og-fonts (static TTF —
  // resvg can't read woff2 or pick variable-font instances).
  const len = title.length;
  const fontSize = len > 70 ? 58 : len > 46 ? 68 : 80;
  const lineHeight = Math.round(fontSize * 1.02);
  const maxChars = Math.floor(860 / (fontSize * 0.52));
  const lines = wrapTitle(title, maxChars, 4);
  const blockHeight = lines.length * lineHeight;
  let y = Math.round(150 + (330 - blockHeight) / 2) + fontSize * 0.8;

  const titleTspans = lines
    .map((line) => {
      const t = `<text x="${MARGIN_X}" y="${Math.round(y)}" font-family="Archivo OG" font-weight="800" font-size="${fontSize}" fill="#0A0A0A" letter-spacing="${-(fontSize * 0.035).toFixed(1)}">${escapeXml(line)}</text>`;
      y += lineHeight;
      return t;
    })
    .join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#FFFFFF"/>
  <circle cx="1090" cy="120" r="170" fill="#FED23E"/>
  <circle cx="${MARGIN_X + 11}" cy="98" r="11" fill="#FED23E"/>
  <text x="${MARGIN_X + 34}" y="106" font-family="Archivo OG" font-weight="600" font-size="22" fill="#0A0A0A" letter-spacing="1.5">${escapeXml(eyebrow)}</text>
  ${titleTspans}
  <rect y="530" width="${WIDTH}" height="100" fill="#FED23E"/>
  <text x="${MARGIN_X}" y="590" font-family="Archivo OG" font-weight="600" font-size="24" fill="#0A0A0A">${escapeXml(footer)}</text>
  <text x="${WIDTH - MARGIN_X}" y="590" font-family="Archivo OG" font-weight="800" font-size="26" fill="#0A0A0A" text-anchor="end">${escapeXml(url)}</text>
</svg>`;
}

let cachedFontFiles: string[] | null = null;
function fontFiles(): string[] {
  if (cachedFontFiles) return cachedFontFiles;
  const dir = join(process.cwd(), 'src/assets/og-fonts');
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
      defaultFontFamily: 'Archivo OG',
    },
  });
  const png = resvg.render().asPng();
  // Return a plain ArrayBuffer (valid Response BodyInit) sliced to the exact
  // byte range — avoids Node Buffer / ArrayBufferLike typing friction.
  return png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer;
}
