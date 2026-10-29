/**
 * Money and number formatting, in English and Brazilian Portuguese.
 *
 * Long form writes amounts in full up to a million and then with names
 * ("4.81 million", "4,81 milhões"); short form is for buttons ("$4.8M",
 * "$4,8 mi"). Past the decillions both fall back to scientific notation.
 */
export type Lang = 'en' | 'pt';

const LONG_EN = [
  'million',
  'billion',
  'trillion',
  'quadrillion',
  'quintillion',
  'sextillion',
  'septillion',
  'octillion',
  'nonillion',
  'decillion',
] as const;

const LONG_PT: readonly (readonly [string, string])[] = [
  ['milhão', 'milhões'],
  ['bilhão', 'bilhões'],
  ['trilhão', 'trilhões'],
  ['quatrilhão', 'quatrilhões'],
  ['quintilhão', 'quintilhões'],
  ['sextilhão', 'sextilhões'],
  ['septilhão', 'septilhões'],
  ['octilhão', 'octilhões'],
  ['nonilhão', 'nonilhões'],
  ['decilhão', 'decilhões'],
];

const SHORT_EN = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'] as const;
const SHORT_PT = ['mil', 'mi', 'bi', 'tri', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'] as const;

/** The largest amount written with a name; above it, scientific notation. */
const NAMED_LIMIT = 1e36;

function separators(lang: Lang): { group: string; decimal: string } {
  return lang === 'pt' ? { group: '.', decimal: ',' } : { group: ',', decimal: '.' };
}

/** Groups the integer part and keeps up to `decimals` decimals, trailing zeros trimmed. */
export function formatPlain(value: number, lang: Lang, decimals = 0): string {
  const { group, decimal } = separators(lang);
  const sign = value < 0 ? '-' : '';
  const fixed = Math.abs(value).toFixed(decimals);
  const [int = '0', frac = ''] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, group);
  const trimmed = frac.replace(/0+$/, '');
  return sign + grouped + (trimmed ? decimal + trimmed : '');
}

/** Three significant digits, at most two decimals. */
function significant(value: number, lang: Lang): string {
  const abs = Math.abs(value);
  const decimals = abs < 10 ? 2 : abs < 100 ? 1 : 0;
  return formatPlain(value, lang, decimals);
}

function scientific(value: number, lang: Lang): string {
  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const mantissa = value / 10 ** exponent;
  return `${formatPlain(mantissa, lang, 2)}e${exponent}`;
}

/** Below a thousand: up to two decimals; up to a million: whole units. */
function small(value: number, lang: Lang): string {
  return Math.abs(value) < 1000 ? formatPlain(value, lang, 2) : formatPlain(value, lang, 0);
}

/** True when a scaled value in [100, 1000) would print as 1000 (move up one unit). */
function roundsUp(scaled: number): boolean {
  return scaled >= 999.5;
}

/** A number in long form: "4,812,360", "4.81 million", "4,81 milhões". */
export function formatNumberLong(value: number, lang: Lang): string {
  if (!Number.isFinite(value)) return '∞';
  const abs = Math.abs(value);
  if (abs < 1e6) return small(value, lang);
  if (abs >= NAMED_LIMIT) return scientific(value, lang);
  let index = Math.floor(Math.log10(abs) / 3) - 2;
  if (roundsUp(abs / 10 ** ((index + 2) * 3))) index += 1;
  if (index >= LONG_EN.length) return scientific(value, lang);
  const scaled = value / 10 ** ((index + 2) * 3);
  const digits = significant(scaled, lang);
  if (lang === 'pt') {
    const [one, many] = LONG_PT[index]!;
    return `${digits} ${Math.abs(scaled) < 2 ? one : many}`;
  }
  return `${digits} ${LONG_EN[index]!}`;
}

/** A number in short form: "48K", "1.2M", "4,8 mi". */
export function formatNumberShort(value: number, lang: Lang): string {
  if (!Number.isFinite(value)) return '∞';
  const abs = Math.abs(value);
  if (abs < 1000) return formatPlain(value, lang, abs < 10 ? 2 : abs < 100 ? 1 : 0);
  if (abs >= NAMED_LIMIT) return scientific(value, lang);
  let index = Math.floor(Math.log10(abs) / 3) - 1;
  if (roundsUp(abs / 10 ** ((index + 1) * 3))) index += 1;
  if (index >= SHORT_EN.length) return scientific(value, lang);
  const scaled = value / 10 ** ((index + 1) * 3);
  const suffix = (lang === 'pt' ? SHORT_PT : SHORT_EN)[index]!;
  const digits = formatPlain(
    scaled,
    lang,
    Math.abs(scaled) < 10 ? 2 : Math.abs(scaled) < 100 ? 1 : 0,
  );
  return lang === 'pt' ? `${digits}\u00a0${suffix}` : `${digits}${suffix}`;
}

/** Money in long form: "$4,812,360", "$4.81 million". */
export function formatMoney(value: number, lang: Lang): string {
  const text = formatNumberLong(Math.abs(value), lang);
  return `${value < 0 ? '−' : ''}$${text}`;
}

/** Money in short form: "$48K", "$1.2M". */
export function formatMoneyShort(value: number, lang: Lang): string {
  const text = formatNumberShort(Math.abs(value), lang);
  return `${value < 0 ? '−' : ''}$${text}`;
}

/** A duration: "45 s", "3 min 12 s", "1 h 10 min", "2 d 4 h". */
export function formatDuration(seconds: number, _lang: Lang): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return s % 60 ? `${m} min ${s % 60} s` : `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
  const d = Math.floor(h / 24);
  return h % 24 ? `${d} d ${h % 24} h` : `${d} d`;
}

/** A percentage with a sign: "+4.2%", "−12%". */
export function formatPercent(fraction: number, lang: Lang, signed = true): string {
  const value = fraction * 100;
  const abs = Math.abs(value);
  const text = formatPlain(abs, lang, abs < 10 ? 1 : 0);
  const sign = !signed ? (value < 0 ? '−' : '') : value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${text}%`;
}
