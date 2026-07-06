---
title: "Focus management v custom dialógoch — bez paniky"
date: 2026-03-04
read: 6
tags: ["Accessibility", "React"]
excerpt: "30 riadkov kódu pre plnohodnotný modal s focus trapom, obnovením focusu a zatvorením cez Escape. Plus kedy siahnuť po natívnom prvku dialog a kedy po vlastnom riešení."
featured: false
---

Vlastný modal v Reacte je miesto, kde prístupnosť najčastejšie zlyhá. Používateľ otvorí dialóg cez Tab, ale focus stále behá po pozadí. Stlačí Escape — nič. Zavrie dialóg — a focus skočí na začiatok stránky namiesto na pôvodné tlačidlo.

Toto je 30-riadkový vzor, ktorý sa postará o všetko. Plus kedy siahnuť po natívnom `<dialog>` namiesto vlastnej implementácie.

## 5 vecí, ktoré modal musí robiť

1. **Uložiť aktívny prvok** pred otvorením (vieš, kam vrátiš focus po zatvorení).
2. **Presunúť focus** na prvý zameriteľný prvok v dialógu (alebo na samotný dialóg).
3. **Uväzniť Tab/Shift+Tab** v rámci dialógu — nesmú odísť na pozadie.
4. **Escape** zatvorí dialóg.
5. **Obnoviť focus** na uložený prvok po zatvorení.

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

To je všetko. 30 riadkov kódu, žiadna knižnica.

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

`tabindex="-1"` na dialógu umožňuje programové zameranie (`dialogEl.focus()`), ale nezaradí ho do bežného poradia Tabu. Užitočné, keď v dialógu nie sú žiadne zameriteľné prvky (zriedkavé, ale stáva sa).

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

Hook sa stará o focus trap a obnovenie focusu. Komponent samostatne rieši Escape (lebo Escape nesúvisí s focus trapom). Cleanup funkcia v `useEffect` automaticky obnoví focus, keď sa `open` zmení na `false`.

## Natívny `<dialog>` — kedy ho použiť

HTML má natívny prvok `<dialog>`. Podpora v prehliadačoch: Chromium 37+, Firefox 98+, Safari 15.4+ (naprieč prehliadačmi od roku 2022). Pre nové projekty to funguje.

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

- Uväzní focus vnútri dialógu
- Pridá backdrop (pseudo-prvok `::backdrop`)
- Rieši Escape (spustí `cancel` event, a ak ho nezrušíš cez `preventDefault()`, dialóg sa zatvorí a spustí sa `close` event)
- Zablokuje pozadie ako inertné (screen reader ho preskočí)

`<form method="dialog">` + `<button value="...">` cez odoslanie zatvorí dialóg a `dialog.returnValue` bude mať hodnotu klinutého tlačidla. Žiadny JavaScript.

**Použi natívny `<dialog>`** keď:

- Podpora prehliadačov je pre tvojich používateľov v pohode (podľa štatistík z analytiky)
- Nepotrebuješ výrazne prispôsobenú animáciu otvárania/zatvárania
- Tvoj dizajnový systém nemá pevné konvencie pre markup modalu

**Použi vlastný div + hook** keď:

- Potrebuješ udržať stav naprieč React životným cyklom
- Chceš vlastné prechody pri otvorení/zatvorení (slide-in, scale, fade)
- Máš viac vrstvených dialógov s vlastnou logikou

V praxi: prvá voľba v roku 2026 je `<dialog>`. Vlastné riešenie je záloha len pre špecifické prípady použitia.

## Edge cases na ktoré nezabudni

**Dynamicky pridané zameriteľné prvky.** Ak v dialógu dopĺňaš obsah oneskorene (napr. stiahneš ho po otvorení), musíš po zmene znova načítať `focusables`. V Reacte to znamená znova spustiť hook, keď sa obsah zmení (závisí od konkrétnej UX).

**Vnorené dialógy.** Potvrdzovací dialóg vnútri hlavného dialógu. Obnovenie focusu funguje ako zásobník — každý si pamätá svoj `previousFocus`. Hook to zvláda správne pre každú inštanciu zvlášť, len pridaj `aria-modal="true"` na oba.

**Inertné pozadie pre screen reader.** Vlastný dialóg by mal pridať `aria-hidden="true"` na hlavný obsah alebo (lepšie) atribút `inert` na pozadie. Natívny `<dialog>` to robí automaticky.

```js
// Pri otvorení
document.querySelector("main").inert = true;
// Pri zavretí
document.querySelector("main").inert = false;
```

Atribút `inert` znemožní zameranie prvkov a screen reader ich ignoruje. Ušetrí ti starosti s `aria-hidden`.

## Súvisiace

- [Keyboard-only test za 10 minút](/blog/keyboard-only-test/) — najrýchlejší spôsob, ako odhalíš pokazený focus trap.
- [WCAG AA na malom webe: 80 % efekt za 20 % práce](/blog/wcag-aa-80-20/).
- Migruješ z Reactu 18 na 19? Pozri [čo skutočne pokazí build](/blog/react-19-migracia/) predtým, než budeš refaktorovať hooky ako tento.

## Externé linky

- [MDN: `<dialog>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog)
- [WAI-ARIA Authoring Practices: Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [a11y-dialog](https://github.com/KittyGiraudel/a11y-dialog) — osvedčená knižnica, ak chceš hotové riešenie

## TL;DR

5 vecí: ulož focus, presuň focus, uväzni Tab, zatvor cez Escape, obnov focus. 30 riadkov čistého JS alebo React hook `useFocusTrap`. Pre nové projekty si najprv pozri natívny `<dialog>` — focus trap, Escape aj inertné pozadie máš zadarmo. Vlastné riešenie je pre prípady, keď ti natívny dialóg nestačí (prechody, logika vnorených dialógov, udržanie stavu naprieč životným cyklom).
