/**
 * Own inline form errors instead of the browser's validation bubbles.
 *
 * - Message sits right under the field, linked via aria-describedby and
 *   announced (aria-live) — never colour-only (icon + text).
 * - "Punish late, reward early": a field is checked on submit / Continue; once
 *   it has shown an error it re-validates on every input so the message
 *   disappears the moment the value is OK.
 */

export type Messages = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function errorId(el: HTMLElement): string {
  return `${el.id || el.getAttribute('name') || 'field'}-error`;
}

/** Container the message is placed after (the field wrapper, or the element itself). */
function anchorOf(el: HTMLElement): HTMLElement {
  return (el.closest('[data-field]') as HTMLElement | null) ?? el;
}

export function setFieldError(el: HTMLElement, message: string): void {
  const id = errorId(el);
  let msg = document.getElementById(id);
  if (!msg) {
    msg = document.createElement('p');
    msg.id = id;
    msg.className = 'field-error';
    msg.setAttribute('aria-live', 'polite');
    anchorOf(el).appendChild(msg);
  }
  msg.innerHTML = '';
  const icon = document.createElement('span');
  icon.className = 'field-error__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '!';
  msg.append(icon, document.createTextNode(message));
  el.setAttribute('aria-invalid', 'true');
  const described = new Set((el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
  described.add(id);
  el.setAttribute('aria-describedby', [...described].join(' '));
  anchorOf(el).classList.add('has-error');
}

export function clearFieldError(el: HTMLElement): void {
  const id = errorId(el);
  document.getElementById(id)?.remove();
  el.removeAttribute('aria-invalid');
  const rest = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter((x) => x && x !== id);
  if (rest.length) el.setAttribute('aria-describedby', rest.join(' '));
  else el.removeAttribute('aria-describedby');
  anchorOf(el).classList.remove('has-error');
}

/**
 * Validate one text/email/textarea field. Returns the error message or ''.
 * Message keys: `<name>Required`, `emailInvalid`, `<name>Short` (with {n}, {min}).
 */
export function fieldMessage(el: HTMLInputElement | HTMLTextAreaElement, m: Messages): string {
  const v = el.value.trim();
  const name = el.name;
  if (el.required && !v) return m[`${name}Required`] || m.required || '';
  if (v && el.type === 'email' && !EMAIL_RE.test(v)) return m.emailInvalid || '';
  const min = parseInt(el.getAttribute('minlength') || '0', 10);
  if (v && min > 0 && v.length < min) {
    return (m[`${name}Short`] || '').replace('{n}', String(v.length)).replace('{min}', String(min));
  }
  return '';
}

/** Validate a list of fields; shows/clears errors, returns the first invalid one. */
export function validateFields(
  fields: Array<HTMLInputElement | HTMLTextAreaElement>,
  m: Messages,
): HTMLInputElement | HTMLTextAreaElement | null {
  let first: HTMLInputElement | HTMLTextAreaElement | null = null;
  for (const el of fields) {
    const msg = fieldMessage(el, m);
    if (msg) {
      setFieldError(el, msg);
      first ??= el;
    } else {
      clearFieldError(el);
    }
  }
  return first;
}

/** After a field has shown an error, re-check it live while the user types. */
export function liveRevalidate(fields: Array<HTMLInputElement | HTMLTextAreaElement>, m: Messages): void {
  for (const el of fields) {
    el.addEventListener('input', () => {
      if (el.getAttribute('aria-invalid') !== 'true') return;
      const msg = fieldMessage(el, m);
      if (msg) setFieldError(el, msg);
      else clearFieldError(el);
    });
    // Blur is the moment to say "this e-mail looks wrong" — not mid-typing.
    el.addEventListener('blur', () => {
      if (!el.value.trim()) return;
      const msg = fieldMessage(el, m);
      if (msg) setFieldError(el, msg);
    });
  }
}

/** Read `data-msg-*` attributes from an element into a Messages map. */
export function readMessages(root: HTMLElement): Messages {
  const out: Messages = {};
  for (const [k, v] of Object.entries(root.dataset)) {
    if (k.startsWith('msg') && v) out[k.charAt(3).toLowerCase() + k.slice(4)] = v;
  }
  return out;
}

/** Scroll an element into view below the sticky header, respecting reduced motion. */
export function scrollIntoViewSoft(el: HTMLElement, offset = 96): void {
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  if (Math.abs(window.scrollY - top) < 8) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
}
