import { createRng } from '../rng/rng.ts';

/** The sponsor offers (PRODUCT.md, Sponsors). */
export type SponsorOffer =
  'overtime' | 'golden' | 'audit' | 'sponsorship' | 'headhunter' | 'closing';

/** Offers limited per day, and their limits. */
export const DAILY_LIMITS = { overtime: 6, golden: 10, sponsorship: 3, headhunter: 3 } as const;
export type CountedOffer = keyof typeof DAILY_LIMITS;

/** Overtime: stamps pay this many times as much, for this long (ms). */
export const OVERTIME_FACTOR = 3;
export const OVERTIME_MS = 3 * 60_000;

/** Sponsorship: business profit ×2 for 4 hours a sponsor; taken again, the hours add up. */
export const SPONSORSHIP_FACTOR = 2;
export const SPONSORSHIP_MS = 4 * 3600_000;

/** The golden invoice: on the desk this long, every 5 to 10 minutes of play. */
export const GOLDEN_SHOWN_MS = 30_000;
export const GOLDEN_MIN_GAP_MS = 5 * 60_000;
export const GOLDEN_MAX_GAP_MS = 10 * 60_000;
/** Seconds of business income a golden invoice pays, plain and with a sponsor. */
export const GOLDEN_SECONDS = 60;
export const GOLDEN_SPONSORED_SECONDS = 15 * 60;

/** The closing sponsor's extra goodwill, as a share of the claim. */
export const CLOSING_BONUS = 0.1;

/** The Gold Edition's business profit factor. */
export const GOLD_FACTOR = 3;

/** A star manager's trait counts this many times. */
export const STAR_FACTOR = 2;

/** Gap (ms) before the `count`-th golden invoice of a volume, drawn from its seed. */
export function goldenGap(seed: string, count: number): number {
  const rng = createRng(seed).fork('golden').fork(String(count));
  return GOLDEN_MIN_GAP_MS + rng.int(GOLDEN_MAX_GAP_MS - GOLDEN_MIN_GAP_MS + 1);
}
