---
title: "Focus management in custom dialogs — without the panic"
date: 2026-03-04
read: 6
tags: ["Accessibility", "React"]
excerpt: "30 lines of code for a full-featured modal with a focus trap, focus restoration, and Escape-to-close. Plus when to reach for the native dialog element and when to roll your own."
featured: false
---

A custom modal in React is where accessibility fails most often. The user opens the dialog with Tab, but focus keeps roaming around the background. They hit Escape — nothing. They close the dialog — and focus jumps to the top of the page instead of back to the original button.

Here's a 30-line pattern that handles all of it. Plus when to reach for the native `<dialog>` instead of your own implementation.

## The 5 things a modal has to do

1. **Save the active element** before opening (so you know where to send focus back after closing).
2. **Move focus** to the first focusable element in the dialog (or to the dialog itself).
3. **Trap Tab/Shift+Tab** inside the dialog — they must not escape to the background.
4. **Escape** closes the dialog.
5. **Restore focus** to the saved element after closing.

Plus ARIA: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` on the heading.

## Vanilla JS version

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

That's the whole thing. 30 lines of code, no library.

ARIA markup in HTML:

```html
<div
  id="my-dialog"
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  hidden
  tabindex="-1"
>
  <h2 id="dialog-title">Confirm order</h2>
  <p>Are you sure you want to continue?</p>
  <button>Yes</button>
  <button>No</button>
</div>
```

`tabindex="-1"` on the dialog allows programmatic focus (`dialogEl.focus()`) but keeps it out of the normal Tab order. Handy when the dialog has no focusable elements at all (rare, but it happens).

## The React hook `useFocusTrap`

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

Usage:

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
      <h2 id="dialog-title">Confirm</h2>
      <button onClick={onClose}>Yes</button>
      <button onClick={onClose}>No</button>
    </div>
  );
}
```

The hook takes care of the focus trap and focus restoration. The component handles Escape on its own (because Escape has nothing to do with the focus trap). The cleanup function in `useEffect` automatically restores focus when `open` flips to `false`.

## The native `<dialog>` — when to use it

HTML has a native `<dialog>` element. Browser support: Chromium 37+, Firefox 98+, Safari 15.4+ (cross-browser since 2022). For new projects, it just works.

```html
<dialog id="my-dialog">
  <h2>Confirm</h2>
  <form method="dialog">
    <button value="confirm">Yes</button>
    <button value="cancel">No</button>
  </form>
</dialog>

<button onclick="document.getElementById('my-dialog').showModal()">
  Open
</button>
```

`showModal()` automatically:

- Traps focus inside the dialog
- Adds a backdrop (the `::backdrop` pseudo-element)
- Handles Escape (fires a `cancel` event, and unless you cancel it with `preventDefault()`, the dialog closes and a `close` event fires)
- Marks the background as inert (screen readers skip over it)

`<form method="dialog">` + `<button value="...">` closes the dialog on submit, and `dialog.returnValue` holds the value of the clicked button. No JavaScript.

**Use the native `<dialog>`** when:

- Browser support is fine for your users (based on your analytics)
- You don't need a heavily customized open/close animation
- Your design system has no fixed conventions for modal markup

**Use a custom div + hook** when:

- You need to persist state across React's lifecycle
- You want custom open/close transitions (slide-in, scale, fade)
- You have multiple stacked dialogs with their own logic

In practice: the first choice in 2026 is `<dialog>`. A custom solution is a fallback only for specific use cases.

## Edge cases not to forget

**Dynamically added focusable elements.** If you add content to the dialog late (e.g. you fetch it after opening), you have to re-read `focusables` after the change. In React that means re-running the hook when the content changes (depends on the specific UX).

**Nested dialogs.** A confirmation dialog inside the main dialog. Focus restoration works like a stack — each one remembers its own `previousFocus`. The hook handles this correctly for each instance separately; just add `aria-modal="true"` to both.

**Inert background for screen readers.** A custom dialog should add `aria-hidden="true"` to the main content or (better) the `inert` attribute on the background. The native `<dialog>` does this automatically.

```js
// On open
document.querySelector("main").inert = true;
// On close
document.querySelector("main").inert = false;
```

The `inert` attribute makes elements unfocusable, and screen readers ignore them. It saves you the hassle of `aria-hidden`.

## Related

- [Keyboard-only testing in 10 minutes](/en/blog/keyboard-only-test/) — the fastest way to catch a broken focus trap.
- [WCAG AA on a small site: 80% of the effect for 20% of the work](/en/blog/wcag-aa-80-20/).
- Migrating from React 18 to 19? See [what actually breaks the build](/en/blog/react-19-migracia/) before you refactor hooks like this one.

## External links

- [MDN: `<dialog>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog)
- [WAI-ARIA Authoring Practices: Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [a11y-dialog](https://github.com/KittyGiraudel/a11y-dialog) — a battle-tested library if you want a ready-made solution

## TL;DR

5 things: save focus, move focus, trap Tab, close on Escape, restore focus. 30 lines of plain JS or the React hook `useFocusTrap`. For new projects, look at the native `<dialog>` first — you get the focus trap, Escape, and inert background for free. A custom solution is for the cases where the native dialog isn't enough (transitions, nested-dialog logic, persisting state across the lifecycle).
