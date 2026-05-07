---
title: "Focus management v custom dialógoch — bez paniky"
date: 2026-03-04
read: 6
tags: ["Accessibility", "React"]
excerpt: "30 LOC pre full-featured modal s focus trap, restore a Escape close. Plus kedy si vybrať natívny dialog element a kedy custom riešenie."
featured: false
---

Custom modal v Reacte je miesto, kde A11y najčastejšie zlyhá. User otvorí dialog Tab-om, ale focus stále behá po pozadí. Stlačí Escape — nič. Zavrie dialog — focus skočí na začiatok stránky a nie na pôvodné tlačidlo.

Toto je 30-riadkový vzor, ktorý všetko handluje. Plus kedy si vybrať natívny `<dialog>` namiesto rolling-your-own.

## 5 vecí, ktoré modal musí robiť

1. **Save active element** pred otvorením (vieš, kam vrátiš focus po zavretí).
2. **Move focus** na first focusable inside dialog (alebo dialog samotný).
3. **Trap Tab/Shift+Tab** v rámci dialogu — nesmú odísť na pozadie.
4. **Escape** zavrie dialog.
5. **Restore focus** na uložený element po zavretí.

Plus ARIA: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` na nadpis.

## Vanilla JS verzia

```js
function openDialog(dialogEl) {
  const previousFocus = document.activeElement;
  dialogEl.hidden = false;

  const focusables = dialogEl.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  (first || dialogEl).focus();

  function handleKey(e) {
    if (e.key === "Escape") {
      closeDialog();
    } else if (e.key === "Tab") {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function closeDialog() {
    dialogEl.hidden = true;
    document.removeEventListener("keydown", handleKey);
    previousFocus?.focus();
  }

  document.addEventListener("keydown", handleKey);
  return closeDialog;
}
```

To je všetko. 30 LOC, žiadny library.

ARIA markup v HTML:

```html
<div
  id="my-dialog"
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  hidden
  tabindex="-1"
>
  <h2 id="dialog-title">Potvrdiť objednávku</h2>
  <p>Naozaj chceš pokračovať?</p>
  <button>Áno</button>
  <button>Nie</button>
</div>
```

`tabindex="-1"` na dialog umožňuje programové focus-nutie (`dialogEl.focus()`), ale nezaradí ho do bežného Tab order-u. Užitočné, keď v dialogu nie sú žiadne focusable elementy (rare, ale stáva sa).

## React hook `useFocusTrap`

```tsx
import { useEffect, useRef } from "react";

export function useFocusTrap(active: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    previousFocusRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    const focusables = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    (first || container).focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      previousFocusRef.current?.focus();
    };
  }, [active]);

  return containerRef;
}
```

Použitie:

```tsx
function ConfirmDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      tabIndex={-1}
    >
      <h2 id="dialog-title">Potvrdiť</h2>
      <button onClick={onClose}>Áno</button>
      <button onClick={onClose}>Nie</button>
    </div>
  );
}
```

Hook handluje focus trap + restore. Komponent zvlášť handluje Escape (lebo Escape nesúvisí s focus trap-om). Cleanup function v `useEffect` automaticky restore-uje focus, keď sa `open` zmení na `false`.

## Native `<dialog>` element — kedy ho použiť

HTML má natívny `<dialog>` element. Browser support: Chromium 37+, Firefox 98+, Safari 15.4+ (od 2022). Pre nové projekty to funguje.

```html
<dialog id="my-dialog">
  <h2>Potvrdiť</h2>
  <form method="dialog">
    <button value="confirm">Áno</button>
    <button value="cancel">Nie</button>
  </form>
</dialog>

<button onclick="document.getElementById('my-dialog').showModal()">
  Otvoriť
</button>
```

`showModal()` automaticky:

- Trapne focus
- Pridá backdrop (`::backdrop` pseudo-element)
- Handluje Escape (zavrie + emit `close` event)
- Inertne pozadie (`inert` attribute, screen reader to neprečíta)

`<form method="dialog">` + `<button value="...">` cez submit zavrie dialog a `dialog.returnValue` má hodnotu klikutého tlačidla. Žiadny JavaScript.

**Použí native `<dialog>`** keď:

- Browser support je OK pre tvojich users (stats z analytics)
- Nepotrebuješ heavily customizovaný open/close animation
- Tvoj design system nemá pevné konvencie pre modal markup

**Použí custom div + hook** keď:

- Potrebuješ persist state cez React lifecycles
- Custom open/close transitions (slide-in, scale, fade)
- Multiple stacked dialógy s vlastnou logikou

V praxi: prvý reach v 2026 je `<dialog>`. Custom riešenie je fallback len pre špecifické use cases.

## Edge cases na ktoré nezabudni

**Dynamicky pridané focusable elementy.** Ak v dialogu lazy-loaduješ obsah (napr. fetch po otvorení), musíš re-query `focusables` po update-e. V Reacte to znamená re-runnúť hook keď sa content zmení (závisí od konkrétnej UX).

**Nested dialógy.** Confirm dialog vnútri main dialogu. Stack focus restore — každý si pamätá svoj `previousFocus`. Hook to handle-uje correctly per inštanciu, len pridaj `aria-modal="true"` na obe.

**Inert pozadie pre screen reader.** Custom dialóg by mal pridať `aria-hidden="true"` na main content alebo (lepšie) `inert` attribute na pozadie. Native `<dialog>` to robí automaticky.

```js
// Pri otvorení
document.querySelector("main").inert = true;
// Pri zavretí
document.querySelector("main").inert = false;
```

`inert` attribute znemožní focusovať a screen reader to ignoruje. Šetrí ti starosti s `aria-hidden`.

## Externé linky

- [MDN: `<dialog>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog)
- [WAI-ARIA Authoring Practices: Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [a11y-dialog](https://github.com/KittyGiraudel/a11y-dialog) — battle-tested library ak chceš drop-in

## TL;DR

5 vecí: save focus, move focus, trap Tab, Escape close, restore focus. 30 LOC vanilla alebo `useFocusTrap` React hook. Pre nové projekty si najprv pozri natívny `<dialog>` element — má focus trap + Escape + inert pozadie zadarmo. Custom riešenie je pre prípady, keď ti native dialog nestačí (transitions, nested logic, lifecycle persist).
