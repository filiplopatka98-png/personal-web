---
title: "Migrating React 18 → 19: what actually breaks your build"
date: 2026-04-25
read: 8
tags: ["React", "TypeScript"]
excerpt: "The top 5 problems I hit moving a real 80k LOC project to React 19. The migration took 3 days, and half the bugs came from dependencies, not my own code."
featured: false
---

React 19 shipped as stable on December 5, 2024. I migrated it on an 80k LOC project (e-shop + admin dashboard). The migration took **3 working days**, and I'll tell you straight up: my own code was the smallest problem. What burned me the most were the **dependencies**.

## 1) `useTransition` has a new return type

The least documented breaking change. In React 18:

```tsx
const [isPending, startTransition] = useTransition();

const onSubmit = () => {
  startTransition(() => {
    setData(newData);
  });
};
```

In React 19, `startTransition` can take an **async function** and returns a `Promise`:

```tsx
const [isPending, startTransition] = useTransition();

const onSubmit = async () => {
  await startTransition(async () => {
    await saveToServer(newData);
    setData(newData);
  });
};
```

Backward compatibility is preserved for the synchronous version, but the **TypeScript types changed**:

```ts
// React 18
type StartTransition = (callback: () => void) => void;

// React 19
type StartTransition = (callback: () => void | Promise<void>) => void;
```

If you run strict TS and extracted the type explicitly somewhere, your compilation will fail.

## 2) `ref` as a prop — no more `forwardRef`

In React 19, `forwardRef` is **unnecessary** in most cases. This is enough:

```tsx
function Button({ ref, ...props }) {
  return <button ref={ref} {...props} />;
}
```

No wrapper, no `displayName` headaches. Beautiful — until you open `node_modules`.

**Half the UI libraries** still use `forwardRef` internally (Radix, Headless UI, react-aria). They work with React 19, but some libraries had a strict peer dependency on `react@^18`. On `npm install react@19` you'll get:

```text
npm error ERESOLVE could not resolve
npm error peer react@"^18.0.0" from @radix-ui/react-dialog
```

The fix: wait for the library to update (Radix added React 19 support in late 2024), or run `npm install --legacy-peer-deps`. I chose to wait — `legacy-peer-deps` is tech debt.

**Libraries that gave me the most trouble:**

- `react-select@5.x` — fixed in 5.9.0.
- `@dnd-kit/core@6.x` — fixed in 6.3.0.
- `react-beautiful-dnd` — **deprecated**, I moved to `@hello-pangea/dnd`.
- `react-helmet` — also **deprecated**, I moved to native `<title>` tags in the Next App Router.

## 3) Strict Mode `useEffect` double-fire — more visible

The double-firing of effects in Strict Mode already existed in React 18 (dev mode only). In React 19 it's **a bit more aggressive**, and it surfaced 3 latent bugs in the project.

Example — page-view tracking (analytics):

```tsx
// before React 19 this "worked" (once by accident, once for real)
useEffect(() => {
  trackPageView();
}, []);
```

In dev mode with React 19 you get **two tracking events per page load**. In production only one, but now you can see you've got a side effect with no cleanup, sending data to your tracker without idempotency.

The fix:

```tsx
useEffect(() => {
  let cancelled = false;
  if (!cancelled) trackPageView();
  return () => { cancelled = true; };
}, []);
```

A better fix: move tracking into the route-change handler instead of an effect in the component. But that's already a refactor.

## 4) Updating the TypeScript types — `@types/react@19`

The biggest source of compile errors. The two worst:

**4a) `ReactElement` defaults changed.** In `@types/react@18`, `ReactElement<P = any>` defaulted to `any`. In 19 it defaults to `unknown`. If your code had:

```tsx
function renderItem(el: ReactElement) {
  return cloneElement(el, { className: "foo" });
}
```

it failed with: `Property 'className' does not exist on type 'unknown'`. The fix:

```tsx
function renderItem(el: ReactElement<{ className?: string }>) {
  return cloneElement(el, { className: "foo" });
}
```

In the 80k LOC project I had to fix **17 spots**.

**4b) The `JSX` namespace is no longer global.** It was `JSX.Element`, now it's `React.JSX.Element`. React 19 removed the global `JSX` namespace and moved it under `React.JSX` so it doesn't pollute your global types. If you have `@types/react@19` + `@types/react-dom@19` and old annotations, some IDEs will start whining.

## 5) Renaming `useActionState` (Server Actions)

Last one. If you're going all-in on [Server Actions and form actions in Next.js](/en/blog/nextjs-form-actions/), this change hits you the hardest. In React 18.3 (RC) the hook was called `useFormState` and imported from `react-dom`:

```tsx
import { useFormState } from "react-dom";
```

In stable React 19 it's `useActionState` in the `react` package:

```tsx
import { useActionState } from "react";
```

A small change, but a codebase often has 20–30 form handlers. There's a codemod:

```bash
npx codemod react/19/replace-use-form-state
```

It runs in ~20 seconds on an 80k LOC project. Check the diff manually — in some places only the import changes (fine), in others the signature does too (verify those by hand).

## The migration order that worked for me

A 3-day plan:

**Day 1: types first.**

```bash
npm install --save-dev @types/react@19 @types/react-dom@19
npx tsc --noEmit
```

Fix every type error. Don't upgrade `react`/`react-dom` yet. This is safe — it's just TS metadata.

**Day 2: code + dependencies.**

```bash
npm install react@19 react-dom@19
# the peer dep checker runs — you see what breaks
npm run build
npm test
```

Fix or upgrade the problem dependencies. Run the codemods:

```bash
npx codemod react/19/replace-use-form-state
npx codemod react/19/replace-reactdom-render
```

**Day 3: manual fixes.**

- The async return value of `useTransition` (if you use it).
- Audit your Strict Mode effects.
- Manually test the critical flows (login, checkout, search).

On 80k LOC this cost me 3 full days. On a smaller project (10k LOC) you'll knock it out in half a day.

## The result

After the migration:

- **Bundle size**: −8 kB gzipped (React 19 has better tree-shaking). If you want to squeeze even more out of your bundle, I've got a [walkthrough on running a bundle audit](/en/blog/bundle-audit-astro-nextjs/).
- **Hydration speed**: +12% (concurrent rendering improvements).
- **DX**: 20% less boilerplate in form handlers.
- **CI build time**: unchanged.

It was worth it, but I waited **3 months after release** before migrating — I wanted the dependencies caught up. It was the right call.

## TL;DR

Migrating to React 19 on a real project = 3 days for a senior developer. Your own code is the smallest problem; what burns you most are dependencies with strict peer deps and the TS type changes. Upgrade in this order: types → react → dependencies → manual fixes. Codemods save you 30% of the work. Wait 2–3 months after the stable release so dependencies have time to catch up, otherwise you'll get tangled in `--legacy-peer-deps`.

**Related:** [React Server Components: 5 things that surprised me after a year](/en/blog/server-components-5-veci/) · [Next.js form actions: the end of API endpoints for 80% of forms](/en/blog/nextjs-form-actions/)
