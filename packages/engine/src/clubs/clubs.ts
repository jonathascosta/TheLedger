import {
  CLUB_SALE,
  CLUBS,
  DRAW,
  LOSS_VALUE,
  MATCH_MS,
  RESULTS_KEPT,
  VALUE_MAX,
  VALUE_MIN,
  WIN_BASE,
  WIN_PER_STRENGTH,
  WIN_PRIZE,
  WIN_VALUE,
  type ClubDef,
} from '../data/clubs.ts';
import { OK, earn, spend, type ActionResult } from '../economy/economy.ts';
import { createRng } from '../rng/rng.ts';
import type { ClubState, GameState, MatchResult } from '../state/state.ts';

/** A club's strength (0 to 1), drawn from the volume's seed. */
export function strength(state: GameState, id: string): number {
  return createRng(state.volume.seed).fork('club').fork(id).next();
}

/** One to five stars for a strength. */
export function stars(s: number): number {
  return Math.min(5, 1 + Math.floor(s * 5));
}

/** A club's state in this volume: unowned at its price until it is bought. */
export function clubOf(state: GameState, def: ClubDef): ClubState {
  return state.volume.clubs[def.id] ?? { owned: false, value: def.price, results: [] };
}

/** What owned clubs are worth (they count in net worth at their value). */
export function clubsValue(state: GameState): number {
  return CLUBS.reduce((sum, def) => {
    const club = state.volume.clubs[def.id];
    return sum + (club?.owned ? club.value : 0);
  }, 0);
}

/** A club is bought at its current value (the price until it has played). */
export function buyClub(state: GameState, id: string): ActionResult {
  const def = CLUBS.find((c) => c.id === id);
  if (!def) return { ok: false, reason: 'none' };
  const club = clubOf(state, def);
  if (club.owned) return { ok: false, reason: 'owned' };
  if (!spend(state, club.value)) return { ok: false, reason: 'cash' };
  state.volume.clubs[id] = { ...club, owned: true };
  return OK;
}

/** Sold at 90% of its value; the value stays where it is. */
export function sellClub(state: GameState, id: string): ActionResult {
  const club = state.volume.clubs[id];
  if (!club?.owned) return { ok: false, reason: 'none' };
  club.owned = false;
  state.volume.cash += club.value * CLUB_SALE;
  return OK;
}

/** Plays match day `day` for every owned club (seeded); returns the prizes paid. */
export function playMatchDay(state: GameState, day: number): number {
  let paid = 0;
  const rng = createRng(state.volume.seed).fork('match').fork(String(day));
  for (const def of CLUBS) {
    const club = state.volume.clubs[def.id];
    if (!club?.owned) continue;
    const r = rng.fork(def.id).next();
    const win = WIN_BASE + WIN_PER_STRENGTH * strength(state, def.id);
    const result: MatchResult = r < win ? 'W' : r < win + DRAW ? 'D' : 'L';
    const prize =
      result === 'W' ? def.price * WIN_PRIZE : result === 'D' ? (def.price * WIN_PRIZE) / 3 : 0;
    if (result === 'W') club.value *= WIN_VALUE;
    if (result === 'L') club.value *= LOSS_VALUE;
    club.value = Math.min(def.price * VALUE_MAX, Math.max(def.price * VALUE_MIN, club.value));
    club.results = [...club.results, result].slice(-RESULTS_KEPT);
    earn(state, prize);
    paid += prize;
  }
  return paid;
}

/** Plays the match days due by `now` (in play only). */
export function advanceClubs(state: GameState, now: number): void {
  const m = state.volume.matchday;
  while (now >= m.nextAt) {
    m.count += 1;
    playMatchDay(state, m.count);
    m.nextAt += MATCH_MS;
  }
}

/** After an absence the match-day clock starts again: matches are played only in play. */
export function restartMatchDays(state: GameState, now: number): void {
  state.volume.matchday.nextAt = now + MATCH_MS;
}
