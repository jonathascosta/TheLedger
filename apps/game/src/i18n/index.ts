import type { Lang } from '@ledger/engine';
import { en, type StringKey } from './en.ts';
import { pt } from './pt.ts';

export type { StringKey };

const TABLES: Record<Lang, Record<StringKey, string>> = { en, pt };

/** The device's language, English unless it is Portuguese. */
export function deviceLang(): Lang {
  const langs = typeof navigator === 'undefined' ? [] : navigator.languages;
  return langs.some((l) => l.toLowerCase().startsWith('pt')) ? 'pt' : 'en';
}

let current: Lang = 'en';

export function setLang(lang: Lang): void {
  current = lang;
  if (typeof document !== 'undefined')
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
}

export function lang(): Lang {
  return current;
}

/** A string in the current language, with `{name}` parameters filled in. */
export function t(key: StringKey, params?: Record<string, string | number>): string {
  const text = TABLES[current][key];
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
}

/** A key built at run time (`biz.${id}`); falls back to the key when it is missing. */
export function tk(key: string, params?: Record<string, string | number>): string {
  return key in en ? t(key as StringKey, params) : key;
}

const ROMAN: readonly [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

export function roman(n: number): string {
  let rest = n;
  let out = '';
  for (const [value, letters] of ROMAN) {
    while (rest >= value) {
      out += letters;
      rest -= value;
    }
  }
  return out;
}
