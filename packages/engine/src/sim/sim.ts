import { BUSINESSES } from '../data/businesses.ts';
import { UPGRADES, type UpgradeDef } from '../data/upgrades.ts';
import { stamp } from '../desk/desk.ts';
import {
  businessIncome,
  businessRate,
  buyBusiness,
  buyUpgrade,
  collect,
  isAvailable,
  levelCost,
  managerCost,
} from '../economy/economy.ts';
import { tick } from '../game.ts';
import { hire } from '../managers/managers.ts';
import { shouldClose } from '../prestige/prestige.ts';
import { newGame, type GameState } from '../state/state.ts';
import { netWorth } from '../worth.ts';

/**
 * The simulated player (PRODUCT.md, Balance): it plays without breaks, collects every till each
 * second, stamps at a steady rate, hires managers and buys whatever pays back soonest. It ignores
 * investments, the paper and sponsors, so it measures the core economy. Deterministic: the game
 * draws from its seed and the player draws nothing.
 */
export interface SimOptions {
  /** Stamps a second (0 to stop stamping). */
  readonly tapsPerSecond?: number;
  /** Simulated seconds. */
  readonly seconds: number;
  /** Cash at the start, to test that a broken economy fails the bands. */
  readonly startCash?: number;
}

export interface SimResult {
  /** Seconds to reach each net worth mark, or null if never. */
  readonly reached: Readonly<Record<'million' | 'billion', number | null>>;
  /** Seconds until closing is first suggested, or null. */
  readonly closeAt: number | null;
  /** Share of all earnings that came from stamps. */
  readonly stampShare: number;
  readonly state: GameState;
}

const T0 = 1_700_000_000_000;

/** Seconds until a purchase pays for itself (Infinity when it adds nothing). */
function payback(cost: number, gain: number): number {
  return gain > 0 ? cost / gain : Infinity;
}

/** The income a business would add with one more level. */
function levelGain(state: GameState, business: number): number {
  const b = state.volume.businesses[business]!;
  const before = businessRate(state, business);
  b.level += 1;
  const after = businessRate(state, business);
  b.level -= 1;
  return after - before;
}

function upgradeGain(state: GameState, upgrade: UpgradeDef): number {
  const e = upgrade.effect;
  if (e.kind === 'business') return businessRate(state, e.business) * (e.factor - 1);
  if (e.kind === 'all') return businessIncome(state) * (e.factor - 1);
  return 0;
}

/** Buys the purchase that pays back soonest, while one is affordable; returns how many it made. */
function shop(state: GameState): number {
  let bought = 0;
  for (let guard = 0; guard < 200; guard++) {
    const v = state.volume;
    // Managers first, once they cost less than a minute of everything's income: then tills run
    // while the player is busy, as a player would hire them.
    const income = businessIncome(state);
    const manager = BUSINESSES.findIndex(
      (_, i) => v.businesses[i]!.level > 0 && !v.managers[i] && managerCost(state, i) <= v.cash,
    );
    if (manager >= 0 && managerCost(state, manager) <= income * 60) {
      hire(state, manager);
      bought++;
      continue;
    }
    let best: { cost: number; time: number; buy: () => void } | null = null;
    const consider = (cost: number, gain: number, buy: () => void): void => {
      const time = payback(cost, gain);
      // A purchase that never pays back is never chosen.
      if (cost <= v.cash && Number.isFinite(time) && (!best || time < best.time))
        best = { cost, time, buy };
    };
    for (let i = 0; i < BUSINESSES.length; i++) {
      if (!isAvailable(state, i)) continue;
      consider(levelCost(state, i, 1), levelGain(state, i), () => buyBusiness(state, i));
    }
    for (const u of UPGRADES) {
      if (v.upgrades.includes(u.id)) continue;
      if (u.effect.kind === 'business' && v.businesses[u.effect.business]!.level === 0) continue;
      // Desk upgrades: bought as soon as they cost less than a minute of income (a payback of
      // one second puts them ahead of nearly everything); never before.
      if (u.effect.kind === 'desk') {
        if (u.cost <= income * 60) consider(u.cost, u.cost, () => buyUpgrade(state, u.id));
        continue;
      }
      consider(u.cost, upgradeGain(state, u), () => buyUpgrade(state, u.id));
    }
    const chosen = best as { buy: () => void } | null;
    if (!chosen) break;
    chosen.buy();
    bought++;
  }
  return bought;
}

export function simulate(options: SimOptions): SimResult {
  const state = newGame(T0);
  state.settings.buyMode = 1;
  state.volume.cash = options.startCash ?? 0;
  const taps = options.tapsPerSecond ?? 1;
  const reached: { million: number | null; billion: number | null } = {
    million: null,
    billion: null,
  };
  let closeAt: number | null = null;
  let stamped = 0;
  for (let s = 1; s <= options.seconds; s++) {
    const now = T0 + s * 1000;
    tick(state, now);
    for (let k = 0; k < taps; k++)
      stamped += stamp(state, now - 1000 + ((k + 1) * 1000) / (taps + 1)).value;
    for (let i = 0; i < BUSINESSES.length; i++) collect(state, i);
    shop(state);
    const worth = netWorth(state);
    if (reached.million === null && worth >= 1e6) reached.million = s;
    if (reached.billion === null && worth >= 1e9) reached.billion = s;
    if (closeAt === null && shouldClose(state)) closeAt = s;
  }
  const earned = state.volume.earned;
  return { reached, closeAt, stampShare: earned > 0 ? stamped / earned : 0, state };
}
