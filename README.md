# Filip Lopatka — Personal Web

Osobný web a portfólio. Astro + Tailwind, statický deploy na GitHub Pages.

**Live:** https://lopatka.sk

## Lokálne spustenie

Vyžaduje Node 20 LTS (`.nvmrc`).

```bash
npm install
npm run dev
```

Server na `http://localhost:4321/`.

## Príkazy

| Príkaz | Akcia |
|---|---|
| `npm run dev` | Spustí dev server s hot reload |
| `npm run build` | Postaví produkčný `dist/` |
| `npm run preview` | Preview produkčného buildu |
| `npm test` | Spustí Vitest unit testy |
| `npx astro check` | TypeScript + Astro typecheck |

## Štruktúra

```
src/
├── content/       # markdown — projekty, články, services (testimoniály sú v komponente)
├── components/    # Astro komponenty
├── layouts/       # BaseLayout (jediný layout)
├── pages/         # routy — SK root, EN pod /en/
├── i18n/          # SK + EN UI texty
├── utils/         # JSON-LD helpers, service catalog, item list
└── styles/        # tokeny + global CSS
```

## Deploy

Push na `main` → GitHub Actions → GitHub Pages. Workflow: `.github/workflows/deploy.yml`.

## Tech stack

- [Astro 4](https://astro.build) — static site generator
- [Tailwind CSS 3](https://tailwindcss.com) — utility-first styling
- TypeScript strict
- Self-hosted fonts (Instrument Serif / Geist / Geist Mono)
- Bilingválne SK + EN, default lokál SK bez prefixu
