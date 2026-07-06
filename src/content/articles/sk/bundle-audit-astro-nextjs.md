---
title: "Bundle audit pre Astro a Next.js: čo zmazať najprv"
date: 2026-03-15
read: 7
tags: ["Performance", "Astro", "Next.js"]
excerpt: "Reálny prípad zníženia initial JS zo 412 KB na 167 KB. Najčastejšie zdroje bloatu a presný postup auditu cez bundle-analyzer a vite-bundle-visualizer."
featured: false
---

JavaScript bundle býva najväčší vinník pomalého TTI a TBT. V auditoch sa mi za posledný rok opakuje ten istý zoznam vinníkov — štyri knižnice, ktoré v roku 2026 už nemajú právo žiť v moderných projektoch. Reálny prípad: Next.js SaaS dashboard, **412 KB initial JS → 167 KB** po audite. Tu je presný postup.

## Krok 1: zmeraj východiskový stav

### Next.js

```bash
ANALYZE=true npm run build
```

Predtým si nainštaluj `@next/bundle-analyzer` a uprav `next.config.js`:

```js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
});

module.exports = withBundleAnalyzer({
  // ...
});
```

Otvorí sa interaktívna treemapa. Hľadáš oranžovo-červené bloky — najväčšie moduly. Klikneš na ne a vidíš, ktoré knižnice ich pritiahli do bundle.

### Astro

Astro nemá oficiálny analyzer, ale `vite-bundle-visualizer` funguje skvele:

```bash
npx vite-bundle-visualizer
```

Otvorí sa HTML report s treemapou. Pre podrobnejšiu štatistiku:

```bash
astro build --verbose
```

V `dist/` máš samostatné chunky per route plus zdieľané spoločné chunky.

## Krok 2: top 4 vinníci, ktorých zabiješ najprv

### 1. moment.js (~290 KB minified so všetkými locales)

V roku 2026 už neexistuje dôvod na moment.js. Autori ho [oficiálne označili ako legacy projekt](https://momentjs.com/docs/#/-project-status/) v režime údržby — nové funkcie ani riešenie veľkosti bundle už nepribudnú. Náhrada:

- **`date-fns`** — modulárny, tree-shakeable. Importuješ len to, čo potrebuješ.
- **`dayjs`** — 2 KB core, plugin systém pre extras. API kompatibilné s moment.
- **Natívny `Intl.DateTimeFormat`** — nulová závislosť, podpora v prehliadačoch nad 95 %.

```js
// Predtým — ~290 KB
import moment from 'moment';
moment(date).format('DD.MM.YYYY');

// Po — 0 KB
new Intl.DateTimeFormat('sk-SK').format(new Date(date));
// → "15. 3. 2026"
```

Na relatívny čas („pred 3 hodinami“) použiješ `Intl.RelativeTimeFormat`. Tiež natívne, tiež nulová závislosť.

### 2. lodash — celý import (~70 KB)

Ak vidíš `import _ from 'lodash'`, máš v bundle zhruba 70 KB. Aj keď používaš len `debounce` a `cloneDeep`.

```js
// ZLÉ — ~70 KB
import _ from 'lodash';
_.debounce(fn, 300);

// LEPŠIE — pár KB každý
import debounce from 'lodash/debounce';
import cloneDeep from 'lodash/cloneDeep';

// NAJLEPŠIE — natívne alternatívy
const debounce = (fn, ms) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};
const cloneDeep = obj => structuredClone(obj); // podpora v prehliadačoch nad 94 %
```

`structuredClone` je [natívne v každom modernom prehliadači](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone) od marca 2022. Žiadny dôvod na lodash `cloneDeep`.

### 3. core-js polyfilly v moderných projektoch

Ak používaš Vite, Next.js 15+ alebo Astro, **core-js by si mať nemal**. Tieto buildery štandardne cielia na moderné prehliadače (Next.js napríklad na Chrome/Edge 111+, Firefox 111+ a Safari 16.4+), takže polyfilly nie sú potrebné.

Skontroluj `package.json`:

```bash
npm ls core-js
```

Ak tam je, tak pravdepodobne kvôli `babel-preset-env` s nesprávnym `targets`. Fix:

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

Bez IE11 mizne zhruba 80 KB polyfillov. V roku 2026 už IE11 neexistuje — Microsoft ho oficiálne vypol 15. júna 2022.

### 4. viac icon knižníc naraz

Klasika React/Next projektov: niekto pridal `react-icons`, neskôr niekto `lucide-react`, a pre admin ešte niekto `@heroicons/react`. Bundle končí s tromi knižnicami pre to isté. (Pozor najmä na `react-icons` — pri wildcard importe celého setu `import * as Icons from 'react-icons/fa'` sa tree-shaking vypne a pritiahne to stovky kilobajtov.)

Audit: `grep -r "from '@heroicons" src/` plus `grep -r "from 'react-icons" src/` plus `grep -r "from 'lucide-react" src/`. Konsoliduj na jednu.

Moja preferovaná: **Lucide** — tree-shakeable, moderný dizajn, vlastný `icon` komponent aj pre Astro (`@lucide/astro`), aj pre Next (`lucide-react`).

```jsx
import { ChevronRight } from 'lucide-react'; // ~1 KB
```

Na maximálnu úsporu: SVG inline ako React/Astro komponenty, vygenerované z [Iconify](https://iconify.design/) alebo z Figma exportu. Žiadna runtime knižnica, len čisté SVG.

## Krok 3: code splitting per route

V Next.js sa to deje automaticky pre `app/` adresár. Každý `page.tsx` má vlastný chunk plus zdieľané spoločné chunky. Ak máš stále veľký initial bundle, pravdepodobne si naimportoval ťažkú knižnicu na top-level stránky namiesto cez `dynamic()`:

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

V Astro je to ešte agresívnejšie (ak práve zvažuješ, ktorý framework vôbec zvoliť, mám na to [rozhodovaciu tabuľku Astro vs Next.js](/blog/astro-vs-nextjs-tabulka/)). Štandardne 0 KB JS na route. Komponenty sa hydratujú, len ak majú direktívu `client:*`. Pravidlo: použi `client:visible` namiesto `client:load` všade, kde sa dá — komponent sa hydratuje až vtedy, keď je vo viewporte.

```astro
<HeavyChart client:visible data={data} />
```

## Krok 4: metriky pred/po

Reálny SaaS dashboard, Next.js 15.2:

| Metrika | Pred | Po |
|---|---|---|
| Initial JS (gzipped) | 412 KB | 167 KB |
| First Load JS (Next dashboard) | 580 KB | 220 KB |
| TTI (Lighthouse mobile) | 4,8 s | 2,1 s |
| TBT | 920 ms | 280 ms |

Konkrétne čo padlo:

- moment.js → `Intl.DateTimeFormat` (−290 KB)
- lodash → 4 named importy plus natívne (−65 KB)
- core-js polyfilly (update browserslist) (−85 KB)
- 2× icon knižnica → len Lucide (−45 KB)
- Chart.js → `dynamic()` import (−180 KB z initial)

## Postup, ktorý reálne robím v audite

1. **Analyzer** — `ANALYZE=true npm run build` alebo `vite-bundle-visualizer`.
2. **Top 5 modulov** v treemape — kliknem, identifikujem zdroj.
3. **Skontrolujem `package.json`** na obvyklých vinníkov: moment, lodash, core-js, viac icon knižníc.
4. **`npm ls <package>`** pre tranzitívne závislosti — niekedy ich pritiahne nejaký iný plugin.
5. **Postupne fixujem**, buildujem, porovnávam treemapu.

## TL;DR

Bundle audit nie je raketová veda. 80 % zlepšenia dosiahneš zmazaním štyroch vecí: moment.js, celý import lodash, zbytočné polyfilly a viac icon knižníc naraz. Ďalších 15 % cez code splitting (`dynamic()` v Next, `client:visible` v Astro). Posledných 5 % sú boutique optimalizácie, ktoré skoro nikto nepotrebuje. Začni analyzerom, identifikuj veľké bloky a postupuj zhora.

**Súvisiace:** [LCP nad 2.5s? 7 najčastejších príčin v praxi](/blog/lcp-nad-2-5s-pricin/) · [Ako čítať WebPageTest report za 5 minút](/blog/webpagetest-za-5-minut/)
