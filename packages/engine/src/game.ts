import { AWAY_MAX_SECONDS, AWAY_MIN_SECONDS, awayReceipt } from './away/away.ts';
import { advanceBusinesses } from './economy/economy.ts';
import type { AwayReceipt, GameState } from './state/state.ts';

/** Net worth is sampled for the ink chart this often (game ms). */
export const SAMPLE_EVERY_MS = 10_000;
export const HISTORY_LENGTH = 180;
/** A single tick never advances more than this (s); longer gaps are absences. */
export const MAX_STEP_SECONDS = AWAY_MIN_SECONDS;

/** Cash plus every holding's value. Investments add to it (T3). */
export function netWorth(state: GameState): number {
  return state.volume.cash;
}

function sample(state: GameState, now: number): void {
  const v = state.volume;
  const worth = netWorth(state);
  v.peakNetWorth = Math.max(v.peakNetWorth, worth);
  while (now - v.lastSampleAt >= SAMPLE_EVERY_MS) {
    v.lastSampleAt += SAMPLE_EVERY_MS;
    v.history.push(worth);
  }
  if (v.history.length > HISTORY_LENGTH) v.history.splice(0, v.history.length - HISTORY_LENGTH);
}

/** Advances the game to `now` (ms). Steps are split so long gaps stay accurate. */
export function tick(state: GameState, now: number): void {
  let remaining = Math.max(0, (now - state.lastTick) / 1000);
  while (remaining > 0) {
    const dt = Math.min(remaining, 1);
    advanceBusinesses(state, dt);
    remaining -= dt;
  }
  state.lastTick = Math.max(state.lastTick, now);
  sample(state, now);
}

/**
 * Handles an absence: if the game was away longer than a minute, prepares the receipt (managed
 * businesses at the offline rate), lets unmanaged tills fill, and moves the clock to `now`.
 * Returns the receipt, also kept in `state.away` until collected.
 */
export function applyAway(state: GameState, now: number): AwayReceipt | null {
  const gap = (now - state.lastTick) / 1000;
  if (gap < AWAY_MIN_SECONDS) {
    tick(state, now);
    return null;
  }
  const seconds = Math.min(gap, AWAY_MAX_SECONDS);
  const receipt = awayReceipt(state, seconds);
  // Unmanaged tills fill (one cycle each); managed businesses earn through the receipt.
  const managers = state.volume.managers.slice();
  state.volume.managers = state.volume.managers.map(() => null);
  advanceBusinesses(state, seconds);
  state.volume.managers = managers;
  state.lastTick = now;
  state.volume.lastSampleAt = now;
  if (receipt.total > 0) state.away = receipt;
  return receipt.total > 0 ? receipt : null;
}
