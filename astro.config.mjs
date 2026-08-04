import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import rehypeExternalLinks from 'rehype-external-links';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// ── Sitemap <lastmod> map ────────────────────────────────────────────────
// @astrojs/sitemap omits <lastmod> by default. We parse `updated`/`date` from
// article frontmatter and feed it back via `serialize` so search + AI crawlers
// get a real freshness signal. Only matched URLs get a lastmod; others are
// left untouched. (Projects use `year`, not a date, so they get none — fine.)
const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = 'https://lopatka.sk';

function frontmatterISODate(file) {
  const src = readFileSync(file, 'utf8');
  const upd = src.match(/^updated:\s*['"]?(\d{4}-\d{2}-\d{2})/m);
  const pub = src.match(/^date:\s*['"]?(\d{4}-\d{2}-\d{2})/m);
  const d = upd?.[1] ?? pub?.[1];
  return d ? new Date(`${d}T00:00:00Z`).toISOString() : null;
}

const lastmodByUrl = {};
function mapContentDir(dir, toUrl) {
  let names;
  try { names = readdirSync(dir); } catch { return; }
  for (const name of names) {
    if (!/\.mdx?$/.test(name)) continue;
    const iso = frontmatterISODate(join(dir, name));
    if (iso) lastmodByUrl[toUrl(name.replace(/\.mdx?$/, ''))] = iso;
  }
}
const CONTENT = join(__dirname, 'src/content');
mapContentDir(join(CONTENT, 'articles/sk'), (s) => `${SITE}/blog/${s}/`);
mapContentDir(join(CONTENT, 'articles/en'), (s) => `${SITE}/en/blog/${s}/`);

// https://astro.build/config
export default defineConfig({
  site: 'https://lopatka.sk',
  base: '/',
  trailingSlash: 'always',

  // Markdown/MDX article bodies: every external (absolute-URL) link gets
  // rel="nofollow noopener noreferrer". Internal links are relative (/blog/…)
  // so they're left untouched. Keeps citation/source links from passing link
  // equity and hardens them (noopener/noreferrer). MDX inherits this config.
  markdown: {
    rehypePlugins: [
      [rehypeExternalLinks, { rel: ['nofollow', 'noopener', 'noreferrer'] }],
    ],
  },

  build: {
    format: 'directory',
    // Inline ALL CSS into HTML head — eliminates render-blocking external CSS
    // requests on first paint. Trade-off: bigger HTML (~10-30KB extra per page)
    // but fewer round-trips. Net positive for Lighthouse Performance score on
    // a static site with small CSS payload. Per Lighthouse: saves ~630ms on
    // mobile FCP. Default is 'auto' (only inlines stylesheets <4KB).
    inlineStylesheets: 'always',
  },

  i18n: {
    defaultLocale: 'sk',
    locales: ['sk', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  // Tailwind v4 is a Vite plugin now (the @astrojs/tailwind integration was
  // dropped in Astro 6+). Theme config lives in tailwind.config.mjs, loaded via
  // `@config` in src/styles/global.css.
  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    mdx(),
    // Exclude 404 pages from the sitemap (they carry a page-level noindex).
    // i18n emits <xhtml:link rel="alternate" hreflang> in the sitemap for pages
    // that share a path across locales (home, /blog/<slug> ↔ /en/blog/<slug>).
    // Translated static routes with different slugs (/praca/ vs /en/work/) don't
    // auto-pair here — those still rely on the reciprocal hreflang in <head>.
    sitemap({
      filter: (page) => !/\/404\/?$/.test(page),
      i18n: {
        defaultLocale: 'sk',
        locales: { sk: 'sk-SK', en: 'en-US' },
      },
      serialize(item) {
        const iso = lastmodByUrl[item.url];
        if (iso) item.lastmod = iso;
        return item;
      },
    }),
  ],
});