import {
  formatDuration,
  formatMoney,
  formatMoneyShort,
  formatNumberLong,
  formatPercent,
  formatPlain,
} from '@ledger/engine';
import { lang } from '../i18n/index.ts';

/** Money in long form, in the current language. */
export const money = (v: number): string => formatMoney(v, lang());
/** Money in short form, for buttons. */
export const moneyShort = (v: number): string => formatMoneyShort(v, lang());
export const number = (v: number): string => formatNumberLong(v, lang());
export const plain = (v: number, decimals = 0): string => formatPlain(v, lang(), decimals);
export const duration = (s: number): string => formatDuration(s, lang());
export const percent = (f: number, signed = true): string => formatPercent(f, lang(), signed);

/** Units of an instrument: whole for shares, up to three decimals otherwise. */
export const units = (v: number): string => formatPlain(v, lang(), v < 100 ? 3 : 0);
