import { PARTNERS, type PartnerId } from '../data/partners.ts';
import { OK, hasPartner, type ActionResult } from '../economy/economy.ts';
import { newVolume, type GameState } from '../state/state.ts';

/** Goodwill earned in total from lifetime earnings (PRODUCT.md, Closing the volume). */
export function goodwillTotal(lifetimeEarnings: number): number {
  return Math.floor(150 * Math.sqrt(Math.max(0, lifetimeEarnings) / 1e13));
}

/** Goodwill that closing the volume now would claim. */
export function claimable(state: GameState): number {
  return Math.max(0, goodwillTotal(state.meta.lifetimeEarnings) - state.meta.goodwillClaimed);
}

/** The pencilled note: closing would at least double the goodwill held, and claim 10 or more. */
export function shouldClose(state: GameState): boolean {
  const claim = claimable(state);
  return claim >= 10 && claim >= state.meta.goodwill;
}

/** Closes the volume: claims goodwill, shelves the book and opens the next volume. */
export function closeVolume(state: GameState, now: number): number {
  const claim = claimable(state);
  const v = state.volume;
  state.meta.goodwill += claim;
  state.meta.goodwillClaimed += claim;
  state.meta.shelf.push({
    number: v.number,
    peakNetWorth: v.peakNetWorth,
    goodwill: claim,
    closedAt: now,
  });
  state.volume = newVolume(v.number + 1, now, hasPartner(state, 'headStart') ? 10_000 : 0);
  state.away = null;
  return claim;
}

export function buyPartner(state: GameState, id: PartnerId): ActionResult {
  const def = PARTNERS.find((p) => p.id === id);
  if (!def) return { ok: false, reason: 'none' };
  if (hasPartner(state, id)) return { ok: false, reason: 'owned' };
  if (state.meta.goodwill < def.cost) return { ok: false, reason: 'cash' };
  state.meta.goodwill -= def.cost;
  state.meta.partners.push(id);
  return OK;
}
