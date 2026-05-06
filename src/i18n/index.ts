import skDict from './sk.json';
import enDict from './en.json';

export const LOCALES = ['sk', 'en'] as const;
export type Lang = typeof LOCALES[number];

const dictionaries: Record<Lang, Record<string, string>> = {
  sk: skDict,
  en: enDict,
};

export type TranslationKey = keyof typeof skDict;

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
  let value = dict[key as string];

  if (value === undefined) {
    console.warn(`[i18n] Missing key "${key}" for lang "${lang}"`);
    return key as string;
  }

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
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
