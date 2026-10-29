import { BUSINESSES } from '../data/businesses.ts';
import { FIRST_NAMES, SURNAME_INITIALS, TRAITS } from '../data/people.ts';
import { managerCost, spend, type ActionResult, OK } from '../economy/economy.ts';
import { createRng } from '../rng/rng.ts';
import type { GameState, Manager } from '../state/state.ts';

export interface Candidate extends Manager {
  business: number;
  /** Years of experience, for the CV line. */
  years: number;
  cost: number;
}

/** The classifieds' candidate for a business, drawn from the volume's seed. */
export function candidateFor(state: GameState, business: number): Candidate {
  const rng = createRng(state.volume.seed).fork('managers').fork(String(business));
  return {
    business,
    name: `${rng.pick(FIRST_NAMES)} ${rng.pick(SURNAME_INITIALS)}.`,
    trait: rng.pick(TRAITS),
    face: rng.int(1_000_000),
    years: 2 + rng.int(25),
    cost: managerCost(state, business),
  };
}

/** Candidates for every open business without a manager. */
export function candidates(state: GameState): Candidate[] {
  const list: Candidate[] = [];
  for (let i = 0; i < BUSINESSES.length; i++) {
    if (state.volume.businesses[i]!.level > 0 && !state.volume.managers[i]) {
      list.push(candidateFor(state, i));
    }
  }
  return list;
}

export function hire(state: GameState, business: number): ActionResult {
  if (state.volume.businesses[business]!.level === 0) return { ok: false, reason: 'locked' };
  if (state.volume.managers[business]) return { ok: false, reason: 'owned' };
  const c = candidateFor(state, business);
  if (!spend(state, c.cost)) return { ok: false, reason: 'cash' };
  state.volume.managers[business] = { name: c.name, trait: c.trait, face: c.face };
  return OK;
}
