import { BUSINESSES, MANAGER_COST_FACTOR, MILESTONES, MIN_CYCLE } from '../data/businesses.ts';
import { GOODWILL_BONUS, type PartnerId } from '../data/partners.ts';
import { NEGOTIATOR_DISCOUNT, PERFECTIONIST_BONUS } from '../data/people.ts';
import { LEGACY_BONUS } from '../data/dynasty.ts';
import { GOLD_FACTOR, SPONSORSHIP_FACTOR, STAR_FACTOR } from '../data/sponsors.ts';
import { UPGRADE_BY_ID, type UpgradeDef } from '../data/upgrades.ts';
import type { GameState, Manager } from '../state/state.ts';

export type ActionResult =
  { ok: true } | { ok: false; reason: 'cash' | 'locked' | 'owned' | 'none' | 'limit' };

export const OK: ActionResult = { ok: true };

export function hasPartner(state: GameState, id: PartnerId): boolean {
  return state.meta.partners.includes(id);
}

/** Adds income: cash, the volume's earnings and the lifetime earnings that make goodwill. */
export function earn(state: GameState, amount: number): void {
  if (!(amount > 0)) return;
  state.volume.cash += amount;
  state.volume.earned += amount;
  state.meta.lifetimeEarnings += amount;
}

/** Spends cash if there is enough. */
export function spend(state: GameState, amount: number): boolean {
  if (amount > state.volume.cash + 1e-9 * Math.max(1, amount)) return false;
  state.volume.cash = Math.max(0, state.volume.cash - amount);
  return true;
}

export function goodwillMultiplier(state: GameState): number {
  return 1 + GOODWILL_BONUS * state.meta.goodwill;
}

/** The sponsorship's factor on business profit, at the game's current time. */
export function sponsorshipFactor(state: GameState): number {
  return state.lastTick < state.sponsors.sponsoredUntil ? SPONSORSHIP_FACTOR : 1;
}

/** A running trend's factor on a business's profit (PRODUCT.md, Trends); 1 otherwise. */
export function trendFactor(state: GameState, business: number): number {
  const t = state.volume.trend;
  return t.business === business && state.lastTick < t.until ? t.factor : 1;
}

/** Ends the running trend, if any. */
export function endTrend(state: GameState): void {
  const t = state.volume.trend;
  t.business = null;
  t.factor = 1;
  t.until = 0;
}

/** The dynasty's legacy factor on business profit (PRODUCT.md, The dynasty): +20% a point. */
export function legacyFactor(state: GameState): number {
  return 1 + LEGACY_BONUS * state.meta.legacy;
}

/** The Gold Edition's factor on business profit. */
export function goldFactor(state: GameState): number {
  return state.meta.gold ? GOLD_FACTOR : 1;
}

/** How many times a manager's trait counts: twice for a headhunter's star. */
export function traitWeight(manager: Manager | null | undefined): number {
  return manager?.star ? STAR_FACTOR : 1;
}

function upgradeFactors(state: GameState, business: number): number {
  let factor = 1;
  for (const id of state.volume.upgrades) {
    const def = UPGRADE_BY_ID.get(id);
    if (!def) continue;
    const e = def.effect;
    if ((e.kind === 'business' && e.business === business) || e.kind === 'all') factor *= e.factor;
  }
  return factor;
}

/** Number of milestones a level has passed. */
export function milestonesReached(level: number): number {
  return MILESTONES.filter((m) => level >= m).length;
}

/** The next milestone above a level, or null past the last. */
export function nextMilestone(level: number): number | null {
  return MILESTONES.find((m) => m > level) ?? null;
}

/** Seconds per cycle, and the profit factor from halvings past the shortest cycle. */
export function cycleOf(state: GameState, business: number): { seconds: number; extra: number } {
  const def = BUSINESSES[business]!;
  const speed = hasPartner(state, 'fastTills') ? 1.5 : 1;
  let seconds =
    def.cycle / speed / 2 ** milestonesReached(state.volume.businesses[business]!.level);
  let extra = 1;
  while (seconds < MIN_CYCLE) {
    seconds *= 2;
    extra *= 2;
  }
  return { seconds, extra };
}

/** Revenue of one cycle at the current level, with every multiplier. */
export function profitPerCycle(state: GameState, business: number): number {
  const level = state.volume.businesses[business]!.level;
  if (level === 0) return 0;
  const manager = state.volume.managers[business];
  const perfectionist =
    manager?.trait === 'perfectionist' ? 1 + (PERFECTIONIST_BONUS - 1) * traitWeight(manager) : 1;
  return (
    BUSINESSES[business]!.baseRevenue *
    level *
    upgradeFactors(state, business) *
    perfectionist *
    goodwillMultiplier(state) *
    sponsorshipFactor(state) *
    goldFactor(state) *
    legacyFactor(state) *
    trendFactor(state, business) *
    cycleOf(state, business).extra
  );
}

/** Average income of one business per second. */
export function businessRate(state: GameState, business: number): number {
  const profit = profitPerCycle(state, business);
  return profit === 0 ? 0 : profit / cycleOf(state, business).seconds;
}

/** Income per second of all the businesses, as if every till were collected. */
export function businessIncome(state: GameState): number {
  let total = 0;
  for (let i = 0; i < BUSINESSES.length; i++) total += businessRate(state, i);
  return total;
}

function priceFactor(state: GameState, business: number): number {
  const manager = state.volume.managers[business];
  return manager?.trait === 'negotiator' ? 1 - (1 - NEGOTIATOR_DISCOUNT) * traitWeight(manager) : 1;
}

/** Cost of the next `count` levels of a business. */
export function levelCost(state: GameState, business: number, count: number): number {
  const def = BUSINESSES[business]!;
  const level = state.volume.businesses[business]!.level;
  const first = def.baseCost * def.growth ** level * priceFactor(state, business);
  return (first * (def.growth ** count - 1)) / (def.growth - 1);
}

/** How many levels the cash buys, at most. */
export function maxAffordable(state: GameState, business: number): number {
  const def = BUSINESSES[business]!;
  const level = state.volume.businesses[business]!.level;
  const first = def.baseCost * def.growth ** level * priceFactor(state, business);
  const n = Math.floor(
    Math.log((state.volume.cash * (def.growth - 1)) / first + 1) / Math.log(def.growth),
  );
  return Math.max(0, n);
}

/** Whether a business can be bought: the first one always, the others once the previous is open. */
export function isAvailable(state: GameState, business: number): boolean {
  return business === 0 || state.volume.businesses[business - 1]!.level > 0;
}

/** What the buy button buys (opening a business too): the mode's levels, or Max's. */
export function buyOffer(state: GameState, business: number): { count: number; cost: number } {
  const mode = state.settings.buyMode;
  const count = mode === 'max' ? Math.max(1, maxAffordable(state, business)) : mode;
  return { count, cost: levelCost(state, business, count) };
}

export function buyBusiness(state: GameState, business: number): ActionResult {
  if (!isAvailable(state, business)) return { ok: false, reason: 'locked' };
  const { count, cost } = buyOffer(state, business);
  if (!spend(state, cost)) return { ok: false, reason: 'cash' };
  state.volume.businesses[business]!.level += count;
  return OK;
}

/** Collects a full till; the next cycle starts. */
export function collect(state: GameState, business: number): ActionResult {
  const b = state.volume.businesses[business]!;
  if (b.till <= 0) return { ok: false, reason: 'none' };
  earn(state, b.till);
  b.till = 0;
  b.progress = 0;
  return OK;
}

export function managerCost(state: GameState, business: number): number {
  const half = hasPartner(state, 'oldFriends') ? 0.5 : 1;
  return BUSINESSES[business]!.baseCost * MANAGER_COST_FACTOR * half;
}

/** Whether an upgrade can be bought now: its business is open, or at a special order's level. */
export function upgradeUnlocked(state: GameState, def: UpgradeDef): boolean {
  if (def.effect.kind !== 'business') return true;
  return state.volume.businesses[def.effect.business]!.level >= (def.level ?? 1);
}

export function buyUpgrade(state: GameState, id: string): ActionResult {
  const def = UPGRADE_BY_ID.get(id);
  if (!def) return { ok: false, reason: 'none' };
  if (state.volume.upgrades.includes(id)) return { ok: false, reason: 'owned' };
  if (!upgradeUnlocked(state, def)) return { ok: false, reason: 'locked' };
  if (!spend(state, def.cost)) return { ok: false, reason: 'cash' };
  state.volume.upgrades.push(id);
  return OK;
}

/**
 * Advances every business by `dt` seconds: managed ones run on, the others fill their till.
 * With `onlyUnmanaged`, managed businesses are left alone (an absence pays them by receipt).
 */
export function advanceBusinesses(state: GameState, dt: number, onlyUnmanaged = false): void {
  for (let i = 0; i < BUSINESSES.length; i++) {
    const b = state.volume.businesses[i]!;
    if (b.level === 0) continue;
    if (onlyUnmanaged && state.volume.managers[i]) continue;
    const { seconds } = cycleOf(state, i);
    if (state.volume.managers[i]) {
      if (b.till > 0) {
        earn(state, b.till);
        b.till = 0;
      }
      b.progress += dt;
      const cycles = Math.floor(b.progress / seconds);
      if (cycles > 0) {
        b.progress -= cycles * seconds;
        earn(state, cycles * profitPerCycle(state, i));
      }
    } else if (b.till === 0) {
      b.progress += dt;
      if (b.progress >= seconds) {
        b.progress = seconds;
        b.till = profitPerCycle(state, i);
      }
    }
  }
}
