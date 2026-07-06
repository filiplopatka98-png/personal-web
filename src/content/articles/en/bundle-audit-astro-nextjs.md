---
title: "Bundle audit for Astro and Next.js: what to delete first"
date: 2026-03-15
read: 7
tags: ["Performance", "Astro", "Next.js"]
excerpt: "A real case of cutting initial JS from 412 KB down to 167 KB. The most common sources of bloat and an exact audit workflow using bundle-analyzer and vite-bundle-visualizer."
featured: false
---

The JavaScript bundle is usually the biggest culprit behind slow TTI and TBT. Over the past year, the same list of offenders keeps showing up in my audits — four libraries that in 2026 simply have no right to live in a modern project. A real case: a Next.js SaaS dashboard, **412 KB initial JS → 167 KB** after the audit. Here's the exact workflow.

## Step 1: measure the baseline

### Next.js

```bash
ANALYZE=true npm run build
```

First install `@next/bundle-analyzer` and tweak `next.config.js`:

```js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
});

module.exports = withBundleAnalyzer({
  // ...
});
```

An interactive treemap opens up. You're hunting for the orange-red blocks — the biggest modules. Click into them and you'll see which libraries dragged them into the bundle.

### Astro

Astro doesn't have an official analyzer, but `vite-bundle-visualizer` works great:

```bash
npx vite-bundle-visualizer
```

An HTML report with a treemap opens up. For more detailed stats:

```bash
astro build --verbose
```

In `dist/` you get separate per-route chunks plus shared common chunks.

## Step 2: the top 4 offenders to kill first

### 1. moment.js (~290 KB minified with all locales)

In 2026 there's no longer any reason to use moment.js. The maintainers [officially declared it a legacy project](https://momentjs.com/docs/#/-project-status/) in maintenance mode — no new features, and no work on bundle size, is coming. Replacements:

- **`date-fns`** — modular, tree-shakeable. You import only what you need.
- **`dayjs`** — 2 KB core, plugin system for extras. API-compatible with moment.
- **Native `Intl.DateTimeFormat`** — zero dependency, over 95% browser support.

```js
// Before — ~290 KB
import moment from 'moment';
moment(date).format('DD.MM.YYYY');

// After — 0 KB
new Intl.DateTimeFormat('sk-SK').format(new Date(date));
// → "15. 3. 2026"
```

For relative time ("3 hours ago") use `Intl.RelativeTimeFormat`. Also native, also zero dependency.

### 2. lodash — full import (~70 KB)

If you see `import _ from 'lodash'`, you've got roughly 70 KB in your bundle — even if all you use is `debounce` and `cloneDeep`.

```js
// BAD — ~70 KB
import _ from 'lodash';
_.debounce(fn, 300);

// BETTER — a few KB each
import debounce from 'lodash/debounce';
import cloneDeep from 'lodash/cloneDeep';

// BEST — native alternatives
const debounce = (fn, ms) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};
const cloneDeep = obj => structuredClone(obj); // over 94% browser support
```

`structuredClone` has been [native in every modern browser](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone) since March 2022. There's no reason to reach for lodash `cloneDeep`.

### 3. core-js polyfills in modern projects

If you're on Vite, Next.js 15+ or Astro, **you shouldn't have core-js at all**. These bundlers target modern browsers by default (Next.js, for example, targets Chrome/Edge 111+, Firefox 111+ and Safari 16.4+), so the polyfills aren't needed.

Check `package.json`:

```bash
npm ls core-js
```

If it's in there, it's probably because of `babel-preset-env` with the wrong `targets`. Fix:

```json
{
  "browserslist": [
    ">0.5%",
    "last 2 versions",
    "not dead",
    "not ie 11"
  ]
}
```

Drop IE11 and roughly 80 KB of polyfills disappear. In 2026 IE11 is dead anyway — Microsoft officially retired it on June 15, 2022.

### 4. multiple icon libraries at once

A classic in React/Next projects: someone added `react-icons`, later someone else added `lucide-react`, and for the admin panel yet another person pulled in `@heroicons/react`. The bundle ends up with three libraries for the same job. (Watch out for `react-icons` in particular — a wildcard import of an entire set like `import * as Icons from 'react-icons/fa'` disables tree-shaking and drags in hundreds of kilobytes.)

Audit it: `grep -r "from '@heroicons" src/` plus `grep -r "from 'react-icons" src/` plus `grep -r "from 'lucide-react" src/`. Consolidate down to one.

My preferred pick: **Lucide** — tree-shakeable, modern design, with its own `icon` component for Astro (`@lucide/astro`) and for Next (`lucide-react`).

```jsx
import { ChevronRight } from 'lucide-react'; // ~1 KB
```

For maximum savings: inline SVG as React/Astro components, generated from [Iconify](https://iconify.design/) or a Figma export. No runtime library, just plain SVG.

## Step 3: code splitting per route

In Next.js this happens automatically for the `app/` directory. Every `page.tsx` gets its own chunk plus shared common chunks. If your initial bundle is still large, you've probably imported a heavy library at the top level of a page instead of through `dynamic()`:

```jsx
// BAD — Chart.js in the initial bundle
import { Chart } from 'chart.js';

// GOOD — lazy load
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('@/components/Chart'), {
  ssr: false,
  loading: () => <ChartSkeleton />
});
```

In Astro it's even more aggressive (if you're still weighing which framework to pick at all, I've got a [decision table for Astro vs Next.js](/en/blog/astro-vs-nextjs-tabulka/)). By default it ships 0 KB of JS per route. Components hydrate only if they carry a `client:*` directive. The rule: use `client:visible` instead of `client:load` everywhere you can — the component hydrates only once it enters the viewport.

```astro
<HeavyChart client:visible data={data} />
```

## Step 4: before/after metrics

A real SaaS dashboard, Next.js 15.2:

| Metric | Before | After |
|---|---|---|
| Initial JS (gzipped) | 412 KB | 167 KB |
| First Load JS (Next dashboard) | 580 KB | 220 KB |
| TTI (Lighthouse mobile) | 4.8 s | 2.1 s |
| TBT | 920 ms | 280 ms |

Exactly what came off:

- moment.js → `Intl.DateTimeFormat` (−290 KB)
- lodash → 4 named imports plus native (−65 KB)
- core-js polyfills (updated browserslist) (−85 KB)
- 2× icon library → Lucide only (−45 KB)
- Chart.js → `dynamic()` import (−180 KB off initial)

## The workflow I actually run in an audit

1. **Analyzer** — `ANALYZE=true npm run build` or `vite-bundle-visualizer`.
2. **Top 5 modules** in the treemap — click, identify the source.
3. **Check `package.json`** for the usual suspects: moment, lodash, core-js, multiple icon libraries.
4. **`npm ls <package>`** for transitive dependencies — sometimes another plugin drags them in.
5. **Fix them one at a time**, rebuild, compare the treemap.

## TL;DR

A bundle audit isn't rocket science. You'll get 80% of the improvement by deleting four things: moment.js, the full lodash import, unnecessary polyfills, and multiple icon libraries at once. Another 15% comes from code splitting (`dynamic()` in Next, `client:visible` in Astro). The last 5% are boutique optimizations that almost nobody needs. Start with the analyzer, spot the big blocks, and work top-down.

**Related:** [LCP over 2.5s? 7 most common causes in practice](/en/blog/lcp-nad-2-5s-pricin/) · [How to read a WebPageTest report in 5 minutes](/en/blog/webpagetest-za-5-minut/)
