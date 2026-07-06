---
title: "Migrácia React 18 → 19: čo skutočne pokazí build"
date: 2026-04-25
read: 8
tags: ["React", "TypeScript"]
excerpt: "Top 5 problémov pri prechode na React 19 z reálneho 80k LOC projektu. Migrácia trvala 3 dni a polovica chýb prišla zo závislostí, nie z vlastného kódu."
featured: false
---

React 19 vyšiel ako stable 5. decembra 2024. Migroval som ho na 80k LOC projekte (eshop + admin dashboard). Migrácia trvala **3 pracovné dni** a poviem ti rovno: vlastný kód bol najmenší problém. Najviac mi zavarili **závislosti**.

## 1) `useTransition` má nový návratový typ

Najmenej zdokumentovaná breaking change. V React 18:

```tsx
const [isPending, startTransition] = useTransition();

const onSubmit = () => {
  startTransition(() => {
    setData(newData);
  });
};
```

V React 19 môže `startTransition` prijať **asynchrónnu funkciu** a vráti `Promise`:

```tsx
const [isPending, startTransition] = useTransition();

const onSubmit = async () => {
  await startTransition(async () => {
    await saveToServer(newData);
    setData(newData);
  });
};
```

Spätná kompatibilita je pre synchrónnu verziu zachovaná, ale **TypeScript typy sa zmenili**:

```ts
// React 18
type StartTransition = (callback: () => void) => void;

// React 19
type StartTransition = (callback: () => void | Promise<void>) => void;
```

Ak máš striktný TS a niekde si si typ explicitne extrahoval, padne ti kompilácia.

## 2) `ref` ako prop — bez `forwardRef`

V React 19 je `forwardRef` vo väčšine prípadov **zbytočný**. Stačí:

```tsx
function Button({ ref, ...props }) {
  return <button ref={ref} {...props} />;
}
```

Žiadny wrapper, žiadne problémy s `displayName`. Krásne — kým neotvoríš `node_modules`.

**Polovica UI knižníc** stále interne používa `forwardRef` (Radix, Headless UI, react-aria). S React 19 fungujú, ale niektoré knižnice mali striktnú peer dependency `react@^18`. Pri `npm install react@19` ti to hodí:

```text
npm error ERESOLVE could not resolve
npm error peer react@"^18.0.0" from @radix-ui/react-dialog
```

Riešenie: počkať na aktualizáciu knižnice (Radix pridal podporu React 19 koncom roka 2024), alebo `npm install --legacy-peer-deps`. Ja som radšej čakal — `legacy-peer-deps` je technický dlh.

**Knižnice, kde som mal najviac problémov:**

- `react-select@5.x` — fix v 5.9.0.
- `@dnd-kit/core@6.x` — fix v 6.3.0.
- `react-beautiful-dnd` — **deprecovaná**, prešiel som na `@hello-pangea/dnd`.
- `react-helmet` — takisto **deprecovaná**, prešiel som na natívne `<title>` tagy v Next App Routeri.

## 3) Strict Mode `useEffect` double-fire — viditeľnejší

V React 18 už dvojité spustenie efektov v Strict Mode existovalo (len v dev režime). V React 19 je to **o čosi agresívnejšie** a odhalilo mi to 3 latentné chyby v projekte.

Príklad — sledovanie návštevnosti (analytics):

```tsx
// pred React 19 to „fungovalo“ (raz omylom, raz naozaj)
useEffect(() => {
  trackPageView();
}, []);
```

V dev režime React 19 dostaneš **dva tracking eventy na jedno načítanie stránky**. V produkcii len jeden, ale teraz vidíš, že máš side effect bez cleanupu, ktorý posiela do trackera dáta bez idempotencie.

Oprava:

```tsx
useEffect(() => {
  let cancelled = false;
  if (!cancelled) trackPageView();
  return () => { cancelled = true; };
}, []);
```

Lepšia oprava: presunúť tracking do handlera zmeny route namiesto efektu v komponente. Ale to už je refaktoring.

## 4) Aktualizácia TypeScript typov — `@types/react@19`

Najviac chýb pri kompilácii. Dve najväčšie:

**4a) Predvolené hodnoty `ReactElement` sa zmenili.** V `@types/react@18` mal `ReactElement<P = any>` predvolené `any`. V 19 je predvolené `unknown`. Ak si v kóde mal:

```tsx
function renderItem(el: ReactElement) {
  return cloneElement(el, { className: "foo" });
}
```

Padlo to: `Property 'className' does not exist on type 'unknown'`. Oprava:

```tsx
function renderItem(el: ReactElement<{ className?: string }>) {
  return cloneElement(el, { className: "foo" });
}
```

V 80k LOC projekte som musel opraviť **17 miest**.

**4b) Menný priestor `JSX` už nie je globálny.** Bolo `JSX.Element`, teraz `React.JSX.Element`. React 19 odstránil globálny `JSX` namespace a presunul ho pod `React.JSX`, aby nezasahoval do globálnych typov. Ak máš `@types/react@19` + `@types/react-dom@19` a staré anotácie, niektoré IDE-čka začnú fňukať.

## 5) Premenovanie `useActionState` (Server Actions)

Posledné. Ak s [Server Actions a form actions v Next.js](/blog/nextjs-form-actions/) robíš naplno, táto zmena sa ťa dotkne najviac. V React 18.3 (RC) sa hook volal `useFormState` a importoval sa z `react-dom`:

```tsx
import { useFormState } from "react-dom";
```

V stabilnom React 19 je to `useActionState` v balíku `react`:

```tsx
import { useActionState } from "react";
```

Drobná zmena, ale codebase má často 20 – 30 form handlerov. Codemod existuje:

```bash
npx codemod react/19/replace-use-form-state
```

Beží ~20 sekúnd na 80k LOC projekte. Diff skontroluj manuálne — niekde sa zmení len import (ok), niekde aj signatúra (treba ručne overiť).

## Poradie migrácie, ktoré mi fungovalo

3-dňový plán:

**Deň 1: najprv typy.**

```bash
npm install --save-dev @types/react@19 @types/react-dom@19
npx tsc --noEmit
```

Oprav všetky typové chyby. Samotný `react`/`react-dom` ešte neaktualizuj. Toto je bezpečné — len TS metadáta.

**Deň 2: kód + závislosti.**

```bash
npm install react@19 react-dom@19
# spustí sa peer dep checker — vidíš, čo sa pokazí
npm run build
npm test
```

Oprav alebo aktualizuj problémové závislosti. Spusti codemody:

```bash
npx codemod react/19/replace-use-form-state
npx codemod react/19/replace-reactdom-render
```

**Deň 3: manuálne opravy.**

- Asynchrónna návratová hodnota `useTransition` (ak ho používaš).
- Audit efektov v Strict Mode.
- Manuálny test kritických flow (login, checkout, vyhľadávanie).

Pri 80k LOC mi to dalo 3 ostré dni. Pri menšom projekte (10k LOC) to zvládneš za pol dňa.

## Výsledok

Po migrácii:

- **Veľkosť bundle**: −8 kB gzipnuté (React 19 má lepší tree-shaking). Ak chceš z bundle vytiahnuť ešte viac, mám na to [postup na bundle audit](/blog/bundle-audit-astro-nextjs/).
- **Rýchlosť hydratácie**: +12 % (vylepšenia concurrent renderingu).
- **DX**: o 20 % menej boilerplate kódu vo form handleroch.
- **Čas CI buildu**: rovnaký.

Stálo to za to, ale počkal som **3 mesiace po vydaní**, kým som migroval — chcel som mať závislosti aktualizované. Bol to správny ťah.

## TL;DR

Migrácia na React 19 na reálnom projekte = 3 dni pre senior vývojára. Vlastný kód je najmenší problém, najviac ti zavaria závislosti so striktnými peer deps a zmeny TS typov. Aktualizuj v poradí: typy → react → závislosti → manuálne opravy. Codemody ušetria 30 % roboty. Počkaj 2 – 3 mesiace po stabilnom vydaní, kým sa závislosti stihnú aktualizovať, inak sa zamotáš v `--legacy-peer-deps`.

**Súvisiace:** [React Server Components: 5 vecí, ktoré ma prekvapili po roku](/blog/server-components-5-veci/) · [Next.js form actions: koniec API endpointov pre 80 % formulárov](/blog/nextjs-form-actions/)
