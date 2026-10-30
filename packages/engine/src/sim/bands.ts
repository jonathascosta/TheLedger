import type { SimResult } from './sim.ts';

/** The balance bands (PRODUCT.md, Balance), in seconds, for a steady player stamping once a second. */
export const BANDS = {
  million: [5 * 60, 25 * 60],
  billion: [30 * 60, 4 * 3600],
  close: [10 * 3600, 30 * 3600],
} as const;

/** The most of all earnings stamps may make, at four taps a second. */
export const MAX_STAMP_SHARE = 0.5;

/** The least share of the businesses' income per second the first four make at the first close. */
export const MIN_SMALL_SHARE = 0.2;

/** The marks outside their bands, in words; empty when the pace is right. */
export function outOfBands(steady: SimResult, fastTapper: SimResult): string[] {
  const out: string[] = [];
  const check = (
    name: string,
    value: number | null,
    [low, high]: readonly [number, number],
  ): void => {
    if (value === null || value < low || value > high)
      out.push(`${name}: ${value === null ? 'never' : `${value} s`} (band ${low}–${high} s)`);
  };
  check('$1 million', steady.reached.million, BANDS.million);
  check('$1 billion', steady.reached.billion, BANDS.billion);
  check('first close', steady.closeAt, BANDS.close);
  if (steady.smallShare === null || steady.smallShare < MIN_SMALL_SHARE)
    out.push(`small businesses at the first close: ${steady.smallShare?.toFixed(3) ?? 'never'}`);
  if (fastTapper.stampShare >= MAX_STAMP_SHARE)
    out.push(`stamps at 4 taps a second: ${fastTapper.stampShare.toFixed(3)} of earnings`);
  return out;
}
