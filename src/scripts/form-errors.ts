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

/* ---------- E-mail typo suggestion ("Did you mean …@gmail.com?") ---------- */

const COMMON_DOMAINS = [
  'gmail.com', 'centrum.sk', 'azet.sk', 'zoznam.sk', 'post.sk', 'posta.sk', 'pobox.sk', 'atlas.sk',
  'seznam.cz', 'centrum.cz', 'outlook.com', 'outlook.sk', 'hotmail.com', 'live.com',
  'yahoo.com', 'icloud.com', 'me.com', 'proton.me', 'protonmail.com',
];

function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      // transposition (gmial → gmail)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/** Returns a corrected address when the domain looks like a typo of a common one. */
export function suggestEmail(value: string): string | null {
  const v = value.trim().toLowerCase();
  const at = v.lastIndexOf('@');
  if (at < 1) return null;
  const local = v.slice(0, at);
  const domain = v.slice(at + 1);
  if (!domain || COMMON_DOMAINS.includes(domain)) return null;
  let best: string | null = null;
  let bestD = Infinity;
  for (const c of COMMON_DOMAINS) {
    const dd = distance(domain, c);
    if (dd < bestD) { bestD = dd; best = c; }
  }
  // Missing dot / missing TLD (gmailcom, gmail) count as a typo too.
  const limit = domain.length <= 8 ? 1 : 2;
  if (best && bestD > 0 && bestD <= limit) return `${local}@${best}`;
  const bare = COMMON_DOMAINS.find((c) => c.replace('.', '') === domain || c.split('.')[0] === domain);
  return bare ? `${local}@${bare}` : null;
}

/**
 * On blur, offer a one-click fix under an e-mail field. `template` contains
 * `{email}`, e.g. "Mysleli ste {email}?".
 */
export function attachEmailSuggest(input: HTMLInputElement, template: string): void {
  if (!template) return;
  const anchor = anchorOf(input);
  const id = `${input.id || input.name}-suggest`;
  const remove = () => document.getElementById(id)?.remove();
  input.addEventListener('input', remove);
  input.addEventListener('blur', () => {
    remove();
    const fix = suggestEmail(input.value);
    if (!fix) return;
    const p = document.createElement('p');
    p.id = id;
    p.className = 'field-suggest';
    p.setAttribute('aria-live', 'polite');
    const [before, after = ''] = template.split('{email}');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'field-suggest__btn';
    btn.textContent = fix;
    btn.addEventListener('click', () => {
      input.value = fix;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      clearFieldError(input);
      remove();
      input.focus();
    });
    p.append(document.createTextNode(before), btn, document.createTextNode(after));
    anchor.appendChild(p);
  });
}

/* ---------- Draft persistence (sessionStorage, best-effort) ---------- */

type Draft = Record<string, string>;

/** Restore saved field values into a form. Returns the saved extra state (e.g. step). */
export function restoreDraft(form: HTMLFormElement, key: string): Draft | null {
  let draft: Draft | null = null;
  try { draft = JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { return null; }
  if (!draft) return null;
  for (const [name, value] of Object.entries(draft)) {
    if (name.startsWith('__')) continue;
    const els = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(`[name="${CSS.escape(name)}"]`);
    els.forEach((el) => {
      if (el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox')) el.checked = el.value === value;
      else el.value = value;
    });
  }
  return draft;
}

/** Save the form on every change; `extra()` adds non-field state (e.g. current step). */
export function persistDraft(form: HTMLFormElement, key: string, extra?: () => Draft): () => void {
  const save = () => {
    const out: Draft = {};
    new FormData(form).forEach((v, k) => { if (k !== 'botcheck' && typeof v === 'string' && v) out[k] = v; });
    Object.assign(out, extra?.() ?? {});
    try { sessionStorage.setItem(key, JSON.stringify(out)); } catch { /* storage unavailable */ }
  };
  form.addEventListener('input', save);
  form.addEventListener('change', save);
  return save;
}

export function clearDraft(key: string): void {
  try { sessionStorage.removeItem(key); } catch { /* ignore */ }
}
