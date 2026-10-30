import { ERA_STYLES, RETIRE_AT } from '../data/dynasty.ts';
import { FIRST_NAMES, SURNAMES } from '../data/people.ts';
import { collectAway } from '../away/away.ts';
import { OK, hasPartner, type ActionResult } from '../economy/economy.ts';
import { claimable, closeVolume } from '../prestige/prestige.ts';
import { createRng } from '../rng/rng.ts';
import { newVolume, type GameState } from '../state/state.ts';

/** Goodwill claimed in the era, counting what closing now would claim. */
export function eraClaimed(state: GameState): number {
  return state.meta.goodwillClaimed + claimable(state);
}

export function canRetire(state: GameState): boolean {
  return eraClaimed(state) >= RETIRE_AT;
}

/** Legacy points that retiring now would earn. */
export function legacyClaim(state: GameState): number {
  return Math.floor(Math.sqrt(Math.max(0, eraClaimed(state))));
}

/** The era's paper (1 to 4): eras past the fourth cycle. */
export function eraStyle(era: number): number {
  return ((Math.max(1, Math.floor(era)) - 1) % ERA_STYLES) + 1;
}

/** The head of the family in an era: a first name for the era and the family's surname. */
export function heirOf(state: GameState, era = state.meta.era): { first: string; surname: string } {
  const family = createRng(`family:${state.createdAt}`);
  const surname = family.pick(SURNAMES);
  const first = family.fork('era').fork(String(era)).pick(FIRST_NAMES);
  return { first, surname };
}

/**
 * The founder retires (PRODUCT.md, The dynasty): the current volume is closed first (no closing
 * sponsor, since goodwill held starts again; an uncollected receipt is collected), its claim counts, legacy
 * is earned and the era moves on. Goodwill, goodwill claimed, lifetime earnings and the volume
 * start again (Vol. I of the new era); legacy, the partners, achievements, the shelf, the Gold
 * Edition, the settings and the sponsors are kept. Returns the legacy earned.
 */
export function retire(state: GameState, now: number): ActionResult & { legacy?: number } {
  if (!canRetire(state)) return { ok: false, reason: 'locked' };
  collectAway(state);
  closeVolume(state, now);
  const earned = Math.floor(Math.sqrt(state.meta.goodwillClaimed));
  const meta = state.meta;
  meta.legacy += earned;
  meta.era += 1;
  meta.goodwill = 0;
  meta.goodwillClaimed = 0;
  meta.lifetimeEarnings = 0;
  state.volume = newVolume(1, now, hasPartner(state, 'headStart') ? 10_000 : 0);
  state.away = null;
  return { ...OK, legacy: earned };
}
