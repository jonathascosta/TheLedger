import { BUSINESSES } from '../data/businesses.ts';
import { NIGHT_OWL_OFFLINE } from '../data/people.ts';
import { businessRate, earn, hasPartner } from '../economy/economy.ts';
import type { AwayLine, AwayReceipt, GameState } from '../state/state.ts';

/** Absences shorter than this are a normal tick. */
export const AWAY_MIN_SECONDS = 60;
/** At most this much absence counts. */
export const AWAY_MAX_SECONDS = 12 * 3600;
export const OFFLINE_RATE = 0.1;

export function offlineRate(state: GameState): number {
  return OFFLINE_RATE + (hasPartner(state, 'nightManager') ? 0.15 : 0);
}

/** Extra lines (rents, bonds, parks) come from the investments; see game.ts. */
export type AwayExtras = (state: GameState, seconds: number, rate: number) => AwayLine[];

/** The receipt of an absence of `seconds` (already capped). */
export function awayReceipt(state: GameState, seconds: number, extras?: AwayExtras): AwayReceipt {
  const rate = offlineRate(state);
  const lines: AwayLine[] = [];
  for (let i = 0; i < BUSINESSES.length; i++) {
    const manager = state.volume.managers[i];
    if (!manager) continue;
    const r = rate + (manager.trait === 'nightOwl' ? NIGHT_OWL_OFFLINE : 0);
    const amount = businessRate(state, i) * seconds * r;
    if (amount > 0) lines.push({ kind: 'business', id: String(i), amount });
  }
  if (extras) lines.push(...extras(state, seconds, rate));
  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  return { seconds, rate, lines, total };
}

/** Adds the waiting receipt to the cash. */
export function collectAway(state: GameState): number {
  const receipt = state.away;
  if (!receipt) return 0;
  earn(state, receipt.total);
  state.away = null;
  return receipt.total;
}
