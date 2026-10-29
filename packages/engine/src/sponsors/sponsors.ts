import {
  DAILY_LIMITS,
  GOLDEN_SECONDS,
  GOLDEN_SHOWN_MS,
  GOLDEN_SPONSORED_SECONDS,
  OVERTIME_FACTOR,
  OVERTIME_MS,
  SPONSORSHIP_MS,
  goldenGap,
  type CountedOffer,
} from '../data/sponsors.ts';
import { OK, businessIncome, earn, type ActionResult } from '../economy/economy.ts';
import { candidates } from '../managers/managers.ts';
import { createRng } from '../rng/rng.ts';
import type { GameState } from '../state/state.ts';

/**
 * The sponsors' rewards (PRODUCT.md, Sponsors). The app shows the ad (or, with the Gold Edition,
 * nothing) and calls these once the reward is earned; `day` is the device's date (`YYYY-MM-DD`),
 * which keys the daily limits.
 */

function counts(state: GameState, day: string): GameState['sponsors']['counts'] {
  const s = state.sponsors;
  if (s.day !== day) {
    s.day = day;
    s.counts = {};
  }
  return s.counts;
}

/** How many more times an offer can be taken today. */
export function offerLeft(state: GameState, offer: CountedOffer, day: string): number {
  const used = state.sponsors.day === day ? (state.sponsors.counts[offer] ?? 0) : 0;
  return Math.max(0, DAILY_LIMITS[offer] - used);
}

function count(state: GameState, offer: CountedOffer, day: string): boolean {
  if (offerLeft(state, offer, day) === 0) return false;
  const c = counts(state, day);
  c[offer] = (c[offer] ?? 0) + 1;
  return true;
}

const LIMIT: ActionResult = { ok: false, reason: 'limit' };

// Overtime

/** The stamp's factor at `now`: ×3 during overtime. */
export function overtimeFactor(state: GameState, now: number): number {
  return now < state.sponsors.overtimeUntil ? OVERTIME_FACTOR : 1;
}

/** Overtime starts, or runs 3 minutes longer if already on. */
export function startOvertime(state: GameState, now: number, day: string): ActionResult {
  if (!count(state, 'overtime', day)) return LIMIT;
  state.sponsors.overtimeUntil = Math.max(now, state.sponsors.overtimeUntil) + OVERTIME_MS;
  return OK;
}

// Sponsorship

/** Banked sponsorship left at `now` (ms). */
export function sponsorshipLeft(state: GameState, now: number): number {
  return Math.max(0, state.sponsors.sponsoredUntil - now);
}

/** A sponsor adds 4 hours to what is left. */
export function startSponsorship(state: GameState, now: number, day: string): ActionResult {
  if (!count(state, 'sponsorship', day)) return LIMIT;
  state.sponsors.sponsoredUntil = Math.max(now, state.sponsors.sponsoredUntil) + SPONSORSHIP_MS;
  return OK;
}

// The golden invoice

/** True while a golden invoice is on the desk. */
export function goldenOnDesk(state: GameState, now: number): boolean {
  const g = state.volume.golden;
  return g.until !== null && now < g.until;
}

function scheduleGolden(state: GameState, from: number): void {
  const g = state.volume.golden;
  g.count += 1;
  g.until = null;
  g.nextAt = from + goldenGap(state.volume.seed, g.count);
}

/** Brings the golden invoice in when it is due, and takes it away once its 30 seconds are up. */
export function advanceGolden(state: GameState, now: number): void {
  const g = state.volume.golden;
  if (g.until === null && now >= g.nextAt) g.until = g.nextAt + GOLDEN_SHOWN_MS;
  if (g.until !== null && now >= g.until) scheduleGolden(state, g.until);
}

/** After an absence, the next golden invoice is a full gap away: it only comes during play. */
export function restartGolden(state: GameState, now: number): void {
  const g = state.volume.golden;
  g.until = null;
  g.nextAt = now + goldenGap(state.volume.seed, g.count);
}

/** What the golden invoice pays, plain or with a sponsor. */
export function goldenValue(state: GameState, sponsored: boolean): number {
  return businessIncome(state) * (sponsored ? GOLDEN_SPONSORED_SECONDS : GOLDEN_SECONDS);
}

/**
 * The tap takes the golden invoice off the desk, so it waits while a sponsor's ad plays; the next
 * one is scheduled from now. Returns false when there is none to take.
 */
export function takeGolden(state: GameState, now: number): boolean {
  if (!goldenOnDesk(state, now)) return false;
  state.volume.golden.taken = true;
  scheduleGolden(state, now);
  return true;
}

/**
 * Pays the taken golden invoice: fifteen minutes with a sponsor (while today's allow), one
 * otherwise. Returns what it paid (0 when none was taken).
 */
export function payGolden(state: GameState, day: string, sponsored: boolean): number {
  const g = state.volume.golden;
  if (!g.taken) return 0;
  g.taken = false;
  const value = goldenValue(state, sponsored && count(state, 'golden', day));
  earn(state, value);
  return value;
}

// The headhunter

/** New candidates for every business without a manager, one of them a star. */
export function headhunt(state: GameState, day: string): ActionResult {
  const open = candidates(state);
  if (open.length === 0) return { ok: false, reason: 'none' };
  if (!count(state, 'headhunter', day)) return LIMIT;
  const v = state.volume;
  v.headhunts += 1;
  const rng = createRng(v.seed).fork('star').fork(String(v.headhunts));
  v.star = rng.pick(open).business;
  return OK;
}

// The Gold Edition

/** The app sets the Gold Edition from the store. */
export function setGold(state: GameState, owned: boolean): void {
  state.meta.gold = owned;
}
