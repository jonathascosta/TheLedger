import { UPGRADE_BY_ID } from '../data/upgrades.ts';
import { businessIncome, earn, hasPartner } from '../economy/economy.ts';
import { overtimeFactor } from '../sponsors/sponsors.ts';
import type { GameState } from '../state/state.ts';

/** Taps closer than this keep the combo going. */
export const COMBO_WINDOW_MS = 1200;
export const COMBO_MAX = 20;
export const STAMPS_PER_INVOICE = 10;

/** The combo's multiplier for a number of tally marks. */
export function comboMultiplier(combo: number): number {
  return combo >= 15 ? 2 : combo >= 10 ? 1.75 : combo >= 5 ? 1.5 : 1;
}

/** The combo as it stands at `now` (it lapses after a pause). */
export function currentCombo(state: GameState, now: number): number {
  const desk = state.volume.desk;
  return now - desk.lastStampAt <= COMBO_WINDOW_MS ? desk.combo : 0;
}

function deskFactor(state: GameState): number {
  let factor = hasPartner(state, 'stampMaker') ? 3 : 1;
  for (const id of state.volume.upgrades) {
    const def = UPGRADE_BY_ID.get(id);
    if (def?.effect.kind === 'desk') factor *= def.effect.factor;
  }
  return factor;
}

/** A stamp pays this share of the income per second (PRODUCT.md, The front desk). */
export const STAMP_SHARE = 0.003;
/** The least a stamp pays, before the desk upgrades. */
export const STAMP_FLOOR = 2;

/** What one stamp pays before the combo. */
export function stampBase(state: GameState): number {
  return Math.max(STAMP_FLOOR, businessIncome(state) * STAMP_SHARE) * deskFactor(state);
}

export interface StampResult {
  value: number;
  combo: number;
  /** True when this stamp filled the invoice. */
  invoiceDone: boolean;
}

/** Stamps the invoice on the desk. */
export function stamp(state: GameState, now: number): StampResult {
  const desk = state.volume.desk;
  const combo = Math.min(COMBO_MAX, currentCombo(state, now) + 1);
  const value = stampBase(state) * comboMultiplier(combo) * overtimeFactor(state, now);
  earn(state, value);
  desk.combo = combo;
  desk.lastStampAt = now;
  desk.lastValue = value;
  desk.stamps += 1;
  state.meta.totalStamps += 1;
  state.meta.bestCombo = Math.max(state.meta.bestCombo, combo);
  const invoiceDone = desk.stamps >= STAMPS_PER_INVOICE;
  if (invoiceDone) {
    desk.stamps = 0;
    desk.invoice += 1;
  }
  return { value, combo, invoiceDone };
}
