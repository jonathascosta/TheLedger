import { describe, expect, it } from 'vitest';
import { formatDuration, formatMoney, formatMoneyShort } from './format.ts';

describe('format', () => {
  it('writes money long and short in both languages', () => {
    expect(formatMoney(4_812_360, 'en')).toBe('$4.81 million');
    expect(formatMoney(4_812_360, 'pt')).toBe('$4,81 milhões');
    expect(formatMoney(1_200_000, 'pt')).toBe('$1,2 milhão');
    expect(formatMoney(812_360, 'en')).toBe('$812,360');
    expect(formatMoney(3.738, 'en')).toBe('$3.74');
    expect(formatMoneyShort(48_000, 'en')).toBe('$48K');
    expect(formatMoneyShort(1_200_000, 'en')).toBe('$1.2M');
    expect(formatMoneyShort(1_200_000, 'pt')).toBe('$1,2 mi');
    expect(formatMoneyShort(5e12, 'en')).toBe('$5T');
    expect(formatMoney(2e40, 'en')).toBe('$2e40');
    expect(formatMoneyShort(999_960, 'en')).toBe('$1M');
  });

  it('writes durations', () => {
    expect(formatDuration(45, 'en')).toBe('45 s');
    expect(formatDuration(4200, 'en')).toBe('1 h 10 min');
  });
});
