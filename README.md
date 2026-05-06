# Filip Lopatka — Personal Web

Osobný web a portfólio. Astro + Tailwind, statický deploy na GitHub Pages.

**Live:** https://filiplopatka98-png.github.io/personal-web/

## Lokálne spustenie

Vyžaduje Node 20 LTS (`.nvmrc`).

```bash
npm install
npm run dev
```

Server na `http://localhost:4321/personal-web/`.

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
├── content/       # markdown — projekty, články, services, testimoniály
├── components/    # Astro komponenty
├── layouts/       # BaseLayout, BlogLayout, ProjectLayout
├── pages/         # routy — SK root, EN pod /en/
├── i18n/          # SK + EN UI texty
└── styles/        # tokeny + global CSS
```

## Deploy

Push na `main` → GitHub Actions → GitHub Pages. Workflow: `.github/workflows/deploy.yml`.

## Tech stack

- [Astro 4](https://astro.build) — static site generator
- [Tailwind CSS 3](https://tailwindcss.com) — utility-first styling
- TypeScript strict
- Self-hosted variable fonts (Fraunces / Inter / JetBrains Mono)
- Bilingválne SK + EN, default lokál SK bez prefixu
