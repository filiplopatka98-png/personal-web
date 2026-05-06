import skDict from './sk.json';
import enDict from './en.json';

export const LOCALES = ['sk', 'en'] as const;
export type Lang = typeof LOCALES[number];

export type TranslationKey = keyof typeof skDict;

/**
 * SK is the canonical key source. Typing EN as Record<TranslationKey, string>
 * makes the TS compiler complain at this assignment if en.json drifts out
 * of sync — catching missing translations at build time, not runtime.
 */
const dictionaries: Record<Lang, Record<TranslationKey, string>> = {
  sk: skDict,
  en: enDict,
};

/**
 * Translate a key. If key is missing, returns the key itself (fail-loud).
 * Supports {placeholder} interpolation.
 */
export function t(
  key: TranslationKey,
  lang: Lang,
  vars?: Record<string, string | number>
): string {
  const dict = dictionaries[lang];
  let value = dict[key];

  if (value === undefined) {
    console.warn(`[i18n] Missing key "${key}" for lang "${lang}"`);
    return key as string;
  }

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replaceAll(`{${k}}`, String(v));
    }
  }

  return value;
}

/**
 * Returns true if `lang` is a supported locale.
 */
export function isLang(lang: string): lang is Lang {
  return (LOCALES as readonly string[]).includes(lang);
}
