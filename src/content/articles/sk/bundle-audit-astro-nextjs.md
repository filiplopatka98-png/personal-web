---
title: "Bundle audit pre Astro a Next.js: čo zmazať najprv"
date: 2026-03-15
read: 7
tags: ["Performance", "Astro", "Next.js"]
excerpt: "Reálny prípad zníženia initial JS z 412KB na 167KB. Najčastejšie zdroje bloatu, postup auditu cez bundle-analyzer a vite-bundle-visualizer."
featured: false
---

JavaScript bundle je často najväčší vinník pomalého TTI a TBT. V auditoch sa mi za posledný rok opakuje rovnaký zoznam vinníkov — 4 knižnice ktoré v 2026 už nemajú právo žiť v moderných projektoch. Reálny prípad: Next.js 15 SaaS dashboard, **412KB initial JS → 167KB** po auditu. Tu je presný postup.

## Krok 1: zmeraj východiskový stav

### Next.js

```bash
ANALYZE=true npm run build
```

Predtým si nainštaluj `@next/bundle-analyzer` a v `next.config.js`:

```js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
});

module.exports = withBundleAnalyzer({
  // ...
});
```

Otvorí sa interaktívna treemap. Hľadáš oranžovo-červené bloky — najväčšie moduly. Klikneš na ne, vidíš ktoré knižnice ich pretiahli do bundle.

### Astro

Astro nemá oficiálny analyzer, ale `vite-bundle-visualizer` funguje skvele:

```bash
npx vite-bundle-visualizer
```

Otvorí sa HTML report s treemap. Pre verbose statistiku:

```bash
astro build --verbose
```

V `dist/` máš samostatné chunks per route + shared common chunks.

## Krok 2: top 4 vinníci, ktorých zabiješ najprv

### 1. moment.js (290KB minified)

V 2026 už neexistuje dôvod pre moment.js. Maintainers ho [oficiálne označili ako legacy](https://momentjs.com/docs/#/-project-status/). Náhrada:

- **`date-fns`** — modular, tree-shakeable. Importuješ len čo potrebuješ.
- **`dayjs`** — 2KB core, plugin systém pre extras. API kompatibilné s moment.
- **Native `Intl.DateTimeFormat`** — zero dependency, browser support 95%+.

```js
// Predtým — 290KB
import moment from 'moment';
moment(date).format('DD.MM.YYYY');

// Po — 0KB
new Intl.DateTimeFormat('sk-SK').format(new Date(date));
// → "15. 3. 2026"
```

Pre relative time ("pred 3 hodinami") použiš `Intl.RelativeTimeFormat`. Tiež natívne, tiež zero deps.

### 2. lodash full import (75KB)

Ak vidíš `import _ from 'lodash'`, máš v bundle 75KB. Aj keď používaš len `debounce` a `cloneDeep`.

```js
// ZLÉ — 75KB
import _ from 'lodash';
_.debounce(fn, 300);

// LEPŠIE — ~3KB každý
import debounce from 'lodash/debounce';
import cloneDeep from 'lodash/cloneDeep';

// NAJLEPŠIE — native alternatívy
const debounce = (fn, ms) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};
const cloneDeep = obj => structuredClone(obj); // browser support 96%+
```

`structuredClone` je [native v každom modernom browseri](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone) od 2022. Žiadny dôvod pre lodash deepClone.

### 3. core-js polyfilly v moderných projektoch

Ak používaš Vite, Next.js 15+, alebo Astro, **core-js by si nemal mať**. Tieto buildery default-ne targetujú modern ES2020+ a polyfilly nie sú potrebné.

Skontroluj `package.json`:

```bash
npm ls core-js
```

Ak je tam, je tam pravdepodobne kvôli `babel-preset-env` s nesprávnym `targets`. Fix:

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

Bez IE11 mizne ~80KB polyfillov. V 2026 IE11 už neexistuje — Microsoft ho vypol v 2022.

### 4. Multiple icon libraries

Klasika React/Next projektov: niekto pridal `react-icons` (300KB ak naimportuješ celé), niekto neskôr `lucide-react`, niekto pre admin `@heroicons/react`. Bundle končí s 3 knižnicami pre to isté.

Audit: `grep -r "from '@heroicons" src/` + `grep -r "from 'react-icons" src/` + `grep -r "from 'lucide-react" src/`. Konsoliduj na jednu.

Moja preferovaná: **Lucide** — tree-shakeable, modern dizajn, vlastný `icon` komponent v Astro/Next.

```jsx
import { ChevronRight } from 'lucide-react'; // ~1KB
```

Pre maximálny šetrenie: SVG inline ako React/Astro komponenty, generované z [Iconify](https://iconify.design/) alebo Figma exportu. Žiadna runtime knižnica, len plain SVG.

## Krok 3: code splitting per route

V Next.js sa to deje automaticky pre `app/` directory. Každý `page.tsx` má svoj chunk + shared common chunks. Ak máš stále veľký initial bundle, pravdepodobne si naimportoval ťažkú knižnicu na page top-level namiesto `dynamic()`:

```jsx
// ZLÉ — Chart.js v initial bundle
import { Chart } from 'chart.js';

// DOBRÉ — lazy load
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('@/components/Chart'), {
  ssr: false,
  loading: () => <ChartSkeleton />
});
```

V Astro je to ešte agresívnejšie. Default-ne 0KB JS na route. Komponenty sa hydratujú len ak majú `client:*` direktívu. Pravidlo: použi `client:visible` namiesto `client:load` všade kde je to možné — komponent sa hydratuje až keď je v viewport.

```astro
<HeavyChart client:visible data={data} />
```

## Krok 4: pred/po metriky

Reálny SaaS dashboard, Next.js 15.2:

| Metrika | Pred | Po |
|---|---|---|
| Initial JS (gzipped) | 412 KB | 167 KB |
| First Load JS (Next dashboard) | 580 KB | 220 KB |
| TTI (Lighthouse mobile) | 4.8 s | 2.1 s |
| TBT | 920 ms | 280 ms |

Konkrétne čo padlo:

- moment.js → `Intl.DateTimeFormat` (-290 KB)
- lodash → 4 named imports + native (-65 KB)
- core-js polyfilly (browserslist update) (-85 KB)
- 2× icon library → Lucide only (-45 KB)
- Chart.js → `dynamic()` import (-180 KB z initial)

## Postup ktorý reálne robím v audite

1. **Analyzer** — `ANALYZE=true npm run build` alebo `vite-bundle-visualizer`.
2. **Top 5 modulov** v treemap — kliknem, identifikujem source.
3. **Skontrolujem `package.json`** na obvyklých vinníkov: moment, lodash, core-js, multiple icon libs.
4. **`npm ls <package>`** pre transitive dependencies — niekedy ich pretiahne nejaký iný plugin.
5. **Postupne fix-ujem**, build-ujem, porovnávam treemap.

## TL;DR

Bundle audit nie je raketová veda. 80 % zlepšenia dosiahneš zmazaním 4 vecí: moment.js, lodash full import, zbytočné polyfilly, multiple icon libraries. Ďalších 15 % cez code splitting (`dynamic()` v Next, `client:visible` v Astro). Posledných 5 % sú boutique optimalizácie ktoré skoro nikto nepotrebuje. Začni analyzerom, identifikuj veľké bloky, postupuj zhora.
