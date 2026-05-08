/**
 * Generate device-mockup project screenshots.
 *
 * Usage:
 *   npm run shots <arg1> [arg2] ...
 *
 * Each <arg> is one of:
 *   URL                        → slug from hostname, both desktop + mobile
 *   SLUG=URL                   → custom slug, both desktop + mobile
 *   SLUG=URL::desktop          → custom slug, desktop only
 *   SLUG=URL::mobile           → custom slug, mobile only
 *
 * Examples:
 *   npm run shots https://www.grkatpo.sk/
 *   npm run shots profihouse-screen2=https://profihouse.sk/realizacie/::desktop
 *
 * Output:
 *   public/projects/<slug>-hero.png    (laptop mockup, 1600×1100 @ 1.5× DPR)
 *   public/projects/<slug>-mobile.png  (iPhone-ish mockup, 600×1100 @ 1.5× DPR)
 *
 * Workflow per (slug, url, mode):
 *   1. Headless Chrome navigates to URL at desktop or mobile viewport
 *   2. Tries to dismiss SK/EN cookie banners via known selectors + text match
 *   3. Waits 1.8s for animations + lazy images
 *   4. Captures viewport screenshot as PNG
 *   5. Composites into HTML mockup template (laptop or phone frame)
 *   6. Re-screenshots the composition at retina DPR
 *   7. Writes final PNG to public/projects/<slug>-{hero,mobile}.png
 *
 * Slug derivation: when not given via SLUG=, hostname is used
 * (www.grkatpo.sk → "grkatpo").
 */
import puppeteer from 'puppeteer';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const OUT_DIR = join(root, 'public/projects');

// ── Desktop / laptop ─────────────────────────────────────────────────────
// Final canvas dimensions — laptop is centered with enough padding that the
// drop-shadow filter has room to fade fully WITHIN the canvas (otherwise
// the shadow gets clipped at the canvas edge and the PNG looks like the
// shadow was cut off when displayed on the live site).
const DESKTOP_CANVAS_W = 1600;
const DESKTOP_CANVAS_H = 1200;
const DESKTOP_DPR = 1.5; // 2400×1800 final

// Captured viewport (this is what's visible in the laptop screen)
const DESKTOP_VIEWPORT_W = 1440;
const DESKTOP_VIEWPORT_H = 900;

// ── Mobile / phone ───────────────────────────────────────────────────────
// Same reasoning as above — the phone's drop-shadow is asymmetric (32px y
// offset + 50px blur = 82px below the frame), so the canvas needs extra
// bottom padding to avoid clipping.
const MOBILE_CANVAS_W = 600;
const MOBILE_CANVAS_H = 1250;
const MOBILE_DPR = 1.5; // 900×1875 final

// iPhone 14 Pro logical viewport (390×844), but capture extra height so
// content fills the screen area in mockup (object-fit cover crops top)
const MOBILE_VIEWPORT_W = 390;
const MOBILE_VIEWPORT_H = 844;

// ── Cookie banner dismissal ─────────────────────────────────────────────
const COOKIE_SELECTORS = [
  // Cookiebot
  '#CybotCookiebotDialogBodyLevelButtonAccept',
  '#CybotCookiebotDialogBodyButtonAccept',
  // CookieYes — most common SK plugin
  '.cky-btn-accept',
  '#cky-btn-accept',
  '[data-cky-tag="accept-button"]',
  // Real Cookie Banner (RCB) WP plugin
  '.rcb-btn-accept-all',
  // Generic patterns
  '.cookie-banner button',
  '.cookies button[id*="accept" i]',
  '#cookie-consent button.accept',
  '[data-cookie-accept]',
  'button[id*="accept-all" i]',
  'button[id*="acceptall" i]',
  'button[class*="accept-all" i]',
];

const COOKIE_TEXTS = [
  // Slovak — single-word + variants (CookieYes "PRIJAŤ", custom plugins)
  'prijať', 'prijat', 'súhlasím', 'súhlasim', 'rozumiem', 'povoliť všetky',
  'akceptovať všetko', 'akceptovat vsetko',
  'prijať všetky', 'prijat vsetky',
  'povoliť', 'povolit',
  // English
  'accept all', 'accept cookies', 'i accept', 'i agree', 'agree',
  'allow all', 'allow', 'got it',
  // Czech
  'souhlasím', 'přijmout vše', 'přijmout', 'rozumím',
];

async function dismissCookies(page) {
  // Try CSS selectors first
  for (const sel of COOKIE_SELECTORS) {
    try {
      const el = await page.$(sel);
      if (el) {
        await el.click().catch(() => {});
        return `selector: ${sel}`;
      }
    } catch { /* ignore */ }
  }

  // Fallback: find button/link by visible text (case-insensitive)
  const clicked = await page.evaluate((texts) => {
    const candidates = Array.from(
      document.querySelectorAll('button, a, [role="button"], input[type="submit"]'),
    );
    for (const el of candidates) {
      const txt = (el.textContent || el.value || '').trim().toLowerCase();
      for (const target of texts) {
        if (txt === target || (txt.length < 40 && txt.includes(target))) {
          el.click();
          return target;
        }
      }
    }
    return null;
  }, COOKIE_TEXTS);

  return clicked ? `text: "${clicked}"` : null;
}

// ── Site screenshot capture ─────────────────────────────────────────────
const DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

async function captureWebsite(browser, url, mode) {
  const isMobile = mode === 'mobile';
  const page = await browser.newPage();
  await page.setViewport({
    width: isMobile ? MOBILE_VIEWPORT_W : DESKTOP_VIEWPORT_W,
    height: isMobile ? MOBILE_VIEWPORT_H : DESKTOP_VIEWPORT_H,
    deviceScaleFactor: 2,
    isMobile,
    hasTouch: isMobile,
  });
  await page.setUserAgent(isMobile ? MOBILE_UA : DESKTOP_UA);

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (e) {
    // Slow sites — keep going, may still have rendered enough
    console.warn(`  ⚠ slow load (${mode}): ${e.message.split('\n')[0]}`);
  }

  // Cookie dismissal
  const dismissed = await dismissCookies(page);
  if (dismissed) console.log(`  → cookies dismissed [${mode}] (${dismissed})`);

  // Settle: post-cookie animations, lazy images, fonts
  await new Promise((r) => setTimeout(r, 1800));

  const buffer = await page.screenshot({ type: 'png', fullPage: false });
  await page.close();
  return buffer;
}

// ── Laptop mockup composition ───────────────────────────────────────────
// Padding leaves enough breathing room for the drop-shadow to fade out
// fully within the canvas:
//   shadow extents: -14px (top) → +86px (bottom) → ±50px (sides) from the
//                   .laptop element edges
//   padding 100/90/110: gives ~120/120/130 clearance — plenty.
function laptopMockupHtml(dataUrl) {
  return `<!DOCTYPE html>
<html><head><style>
  html, body { margin: 0; padding: 0; background: transparent; }
  body {
    width: ${DESKTOP_CANVAS_W}px;
    height: ${DESKTOP_CANVAS_H}px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 100px 90px 110px;
    box-sizing: border-box;
  }
  .laptop {
    position: relative;
    width: 100%;
    filter: drop-shadow(0 36px 50px rgba(20, 20, 20, 0.32))
            drop-shadow(0 8px 14px rgba(0, 0, 0, 0.18));
  }
  .laptop-screen {
    background: linear-gradient(to bottom, #1f1f1f 0%, #161616 100%);
    border-radius: 18px;
    padding: 24px 14px 14px;
    position: relative;
    box-shadow:
      inset 0 0 0 1px rgba(255,255,255,0.04),
      inset 0 -2px 0 rgba(0,0,0,0.4);
  }
  .laptop-camera {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #4a4a4a;
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.5);
  }
  .laptop-screenshot {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 10;
    object-fit: cover;
    object-position: top center;
    border-radius: 4px;
    background: #fff;
  }
  .laptop-base {
    height: 14px;
    margin: 0 -28px;
    background:
      linear-gradient(to bottom,
        #2a2a2a 0%,
        #1f1f1f 35%,
        #131313 70%,
        #050505 100%);
    border-radius: 0 0 12px 12px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
    position: relative;
  }
  /* Trackpad hint / hinge groove */
  .laptop-base::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 160px;
    height: 5px;
    background: linear-gradient(to bottom, #0b0b0b, #1a1a1a);
    border-radius: 0 0 8px 8px;
  }
</style></head><body>
<div class="laptop">
  <div class="laptop-screen">
    <div class="laptop-camera"></div>
    <img class="laptop-screenshot" src="${dataUrl}" />
  </div>
  <div class="laptop-base"></div>
</div>
</body></html>`;
}

// ── Phone mockup composition (iPhone 14 Pro-ish) ────────────────────────
// Asymmetric padding: more on the bottom because drop-shadow is
//   drop-shadow(0 32px 50px ...) → 82px below the phone, only ~18px above.
// 90/70/130 gives ~120/120/160 clearance — well clear of the canvas edge.
function phoneMockupHtml(dataUrl) {
  return `<!DOCTYPE html>
<html><head><style>
  html, body { margin: 0; padding: 0; background: transparent; }
  body {
    width: ${MOBILE_CANVAS_W}px;
    height: ${MOBILE_CANVAS_H}px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 90px 70px 130px;
    box-sizing: border-box;
  }
  .phone {
    position: relative;
    width: 460px;
    height: 968px;
    filter:
      drop-shadow(0 32px 50px rgba(20, 20, 20, 0.32))
      drop-shadow(0 6px 12px rgba(0, 0, 0, 0.18));
  }
  .phone-frame {
    width: 100%;
    height: 100%;
    background:
      linear-gradient(135deg, #2a2a2a 0%, #161616 50%, #2a2a2a 100%);
    border-radius: 58px;
    padding: 14px;
    box-sizing: border-box;
    position: relative;
    box-shadow:
      inset 0 0 0 1.5px rgba(255, 255, 255, 0.08),
      inset 0 0 0 4px #050505;
  }
  /* Dynamic island (iPhone 14 Pro+ pill) */
  .phone-island {
    position: absolute;
    top: 28px;
    left: 50%;
    transform: translateX(-50%);
    width: 124px;
    height: 32px;
    background: #050505;
    border-radius: 18px;
    z-index: 2;
  }
  .phone-screenshot {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    border-radius: 44px;
    background: #fff;
  }
</style></head><body>
<div class="phone">
  <div class="phone-frame">
    <div class="phone-island"></div>
    <img class="phone-screenshot" src="${dataUrl}" />
  </div>
</div>
</body></html>`;
}

async function composeMockup(browser, screenshotBuffer, mode) {
  const isMobile = mode === 'mobile';
  const W = isMobile ? MOBILE_CANVAS_W : DESKTOP_CANVAS_W;
  const H = isMobile ? MOBILE_CANVAS_H : DESKTOP_CANVAS_H;
  const dpr = isMobile ? MOBILE_DPR : DESKTOP_DPR;

  const page = await browser.newPage();
  await page.setViewport({
    width: W,
    height: H,
    deviceScaleFactor: dpr,
  });

  const dataUrl = `data:image/png;base64,${screenshotBuffer.toString('base64')}`;
  const html = isMobile ? phoneMockupHtml(dataUrl) : laptopMockupHtml(dataUrl);
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const final = await page.screenshot({
    type: 'png',
    omitBackground: true,
    clip: { x: 0, y: 0, width: W, height: H },
  });
  await page.close();
  return final;
}

// ── Slug helper ─────────────────────────────────────────────────────────
function slugFromUrl(url) {
  const u = new URL(url);
  return u.hostname.replace(/^www\./, '').split('.')[0];
}

// ── Argument parsing ────────────────────────────────────────────────────
// Each arg form: URL | SLUG=URL | SLUG=URL::desktop | SLUG=URL::mobile
function parseJob(arg) {
  let payload = arg;
  let modes = ['desktop', 'mobile'];

  // Mode suffix detection — uses `::` to avoid clashing with `https://`.
  if (payload.endsWith('::desktop')) {
    payload = payload.slice(0, -'::desktop'.length);
    modes = ['desktop'];
  } else if (payload.endsWith('::mobile')) {
    payload = payload.slice(0, -'::mobile'.length);
    modes = ['mobile'];
  }

  // Slug override: split on FIRST `=` only (URL may not contain `=`).
  const eq = payload.indexOf('=');
  let slug, url;
  if (eq !== -1 && !/^https?:\/\//i.test(payload)) {
    slug = payload.slice(0, eq);
    url = payload.slice(eq + 1);
  } else {
    url = payload;
    slug = slugFromUrl(payload);
  }
  return { slug, url, modes };
}

// ── Main ────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/build-project-screenshots.mjs <arg1> [arg2] ...');
    console.error('  arg = URL | SLUG=URL | SLUG=URL::desktop | SLUG=URL::mobile');
    process.exit(1);
  }

  const jobs = args.map(parseJob);

  await mkdir(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const { slug, url, modes } of jobs) {
    console.log(`📸 ${slug} ← ${url} [${modes.join(', ')}]`);

    for (const mode of modes) {
      try {
        const screenshot = await captureWebsite(browser, url, mode);
        const final = await composeMockup(browser, screenshot, mode);
        const suffix = mode === 'desktop' ? 'hero' : 'mobile';
        const outPath = join(OUT_DIR, `${slug}-${suffix}.png`);
        await writeFile(outPath, final);
        const kb = Math.round(final.length / 1024);
        console.log(`  ✓ ${outPath} (${kb} KB)`);
      } catch (e) {
        console.error(`  ✗ ${slug} ${mode}: ${e.message}`);
      }
    }
  }

  await browser.close();
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
