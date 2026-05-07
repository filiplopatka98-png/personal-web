---
title: "Migrácia React 18 → 19: čo skutočne pokazí build"
date: 2026-04-25
read: 8
tags: ["React", "TypeScript"]
excerpt: "Top 5 problémov pri upgrade na React 19 z reálneho 80k LOC projektu. Migration trvala 3 dni a polovica chýb prišla z dependencies, nie z vlastného kódu."
featured: false
---

React 19 vyšiel v decembri 2024 ako stable. Migroval som ho na 80k LOC projekte (eshop + admin dashboard). Migrácia trvala **3 pracovné dni** a poviem ti rovno: vlastný kód bol najmenší problém. Najviac mi vypálili **dependencies**.

## 1) `useTransition` má nový return signature

Najmenej dokumentovaná breaking change. V React 18:

```tsx
const [isPending, startTransition] = useTransition();

const onSubmit = () => {
  startTransition(() => {
    setData(newData);
  });
};
```

V React 19 môže `startTransition` prijať **async funkciu** a vráti `Promise`:

```tsx
const [isPending, startTransition] = useTransition();

const onSubmit = async () => {
  await startTransition(async () => {
    await saveToServer(newData);
    setData(newData);
  });
};
```

Compatibility je zachovaná pre sync verziu, ale **TypeScript types sa zmenili**:

```ts
// React 18
type StartTransition = (callback: () => void) => void;

// React 19
type StartTransition = (callback: () => void | Promise<void>) => void;
```

Ak máš striktný TS a niekde si si type explicitne extrahoval, padne ti compile.

## 2) `ref` ako prop — bez `forwardRef`

V React 19 je `forwardRef` **zbytočný** pre väčšinu prípadov. Stačí:

```tsx
function Button({ ref, ...props }) {
  return <button ref={ref} {...props} />;
}
```

Žiadny wrapper, žiadne `displayName` problémy. Krásne — kým neotvoríš `node_modules`.

**Polovica UI knižníc** stále interne používa `forwardRef` (Radix, Headless UI, react-aria). Spolupracuje s React 19, ale niektoré knižnice mali strict peer dependency `react@^18`. Pri `npm install react@19` ti hodí:

```text
npm error ERESOLVE could not resolve
npm error peer react@"^18.0.0" from @radix-ui/react-dialog
```

Riešenie: počkať na update knižnice (Radix updol v decembri 2024), alebo `npm install --legacy-peer-deps`. Ja som radšej čakal — `legacy-peer-deps` je technický dlh.

**Knižnice, kde som mal najviac issues:**

- `react-select@5.x` — fix v 5.9.0.
- `@dnd-kit/core@6.x` — fix v 6.3.0.
- `react-beautiful-dnd` — **deprecated**, prešiel som na `@hello-pangea/dnd`.
- `react-helmet` — taktiež **deprecated**, prešiel som na natívne `<title>` tagy v Next App Router.

## 3) Strict Mode `useEffect` double-fire — viditeľnejšie

V React 18 už existoval double-fire effect-ov v Strict Mode (dev only). V React 19 je to **trochu agresívnejšie** a odhalil mi 3 latentné bugy v projekte.

Príklad — analytics tracking:

```tsx
// pred React 19 to "fungovalo" (raz omylom, raz pre real)
useEffect(() => {
  trackPageView();
}, []);
```

V React 19 dev mode dostaneš **dva tracking eventy per page load**. V produkcii len jeden, ale teraz vidíš, že máš side effect bez cleanup-u, ktorý ide do trackeru bez idempotencie.

Fix:

```tsx
useEffect(() => {
  let cancelled = false;
  if (!cancelled) trackPageView();
  return () => { cancelled = true; };
}, []);
```

Lepší fix: presunúť tracking do route change handler-u namiesto effect-u v komponente. Ale to už je refactor.

## 4) TypeScript types update — `@types/react@19`

Najviac compile errors. Dva najväčšie:

**4a) `ReactElement` defaults sa zmenili.** V `@types/react@18` mal `ReactElement<P = any>` default `any`. V 19 je default `unknown`. Ak si v kóde mal:

```tsx
function renderItem(el: ReactElement) {
  return cloneElement(el, { className: "foo" });
}
```

Padlo: `Property 'className' does not exist on type 'unknown'`. Fix:

```tsx
function renderItem(el: ReactElement<{ className?: string }>) {
  return cloneElement(el, { className: "foo" });
}
```

V 80k LOC projekte som musel opraviť **17 miest**.

**4b) `JSX` namespace presunutý.** Bolo `JSX.Element`, teraz `React.JSX.Element`. TS ti to v 19 ešte vyrieši cez backward-compat shim, ale ak máš `@types/react@19` + `@types/react-dom@19`, niektoré IDE-čka cribbujú.

## 5) Server Actions `useActionState` rename

Posledné. V React 18.3 (RC) sa hook volal `useFormState` a importoval z `react-dom`:

```tsx
import { useFormState } from "react-dom";
```

V React 19 stable je to `useActionState` v `react`:

```tsx
import { useActionState } from "react";
```

Drobná zmena, ale codebase má často 20-30 form handlerov. Codemod existuje:

```bash
npx codemod react/19/replace-use-form-state
```

Beží ~20 sekúnd na 80k LOC projekte. Skontroluj diff manuálne — niekde sa zmení import-only (ok), niekde aj signature (potreba ručne overiť).

## Migration order, ktorý mi fungoval

3-dňový plán:

**Deň 1: Types first.**

```bash
npm install --save-dev @types/react@19 @types/react-dom@19
npx tsc --noEmit
```

Oprav všetky type errors. Ešte si neaktualizuj samotný `react`/`react-dom`. Toto je safe — len TS metadata.

**Deň 2: Code + dependencies.**

```bash
npm install react@19 react-dom@19
# spustí sa peer dep checker — vidíš čo sa pokašle
npm run build
npm test
```

Oprav alebo upgrade kompromitované deps. Spusti codemody:

```bash
npx codemod react/19/replace-use-form-state
npx codemod react/19/replace-reactdom-render
```

**Deň 3: Manual fixes.**

- `useTransition` async return value (ak používaš).
- Strict Mode effects audit.
- Manual test kritických flows (login, checkout, search).

Pri 80k LOC mi to dalo 3 ostré dni. Pri menšom projekte (10k LOC) to zvládneš za pol dňa.

## Výsledok

Po migrácii:

- **Bundle size**: -8 kB gzipped (React 19 má lepší tree-shaking).
- **Hydration speed**: +12 % (concurrent rendering improvements).
- **DX**: o 20 % menej boilerplate-u v form handleroch.
- **CI build time**: rovnaký.

Stálo to za to, ale počkal som **3 mesiace po release** kým som migroval — chcel som mať dependencies updated. Bol to správny call.

## TL;DR

React 19 migration na reálnom projekte = 3 dni pre senior dev. Vlastný kód je najmenší problém, najviac ti vypália dependencies s strict peer deps a TS type changes. Update v poradí: types → react → deps → manuálne fixy. Codemody šetria 30 % roboty. Počkaj 2-3 mesiace po stable release, kým sa dependencies stihnú updatnuť, inak sa zaplitneš v `--legacy-peer-deps`.
