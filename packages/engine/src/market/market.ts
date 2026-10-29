import {
  INSTRUMENT_BY_ID,
  INSTRUMENTS,
  MARKET_TICK_SECONDS,
  MEAN_REVERSION,
  PRICE_HISTORY,
  type InstrumentDef,
} from '../data/market.ts';
import type { Shock } from '../data/events.ts';
import { artTick } from '../assets/assets.ts';
import { earn, spend, OK, type ActionResult } from '../economy/economy.ts';
import { createRng } from '../rng/rng.ts';
import type { GameState } from '../state/state.ts';

export function price(state: GameState, id: string): number {
  return state.volume.market.prices[id] ?? INSTRUMENT_BY_ID.get(id)?.start ?? 0;
}

export function unitsHeld(state: GameState, id: string): number {
  return state.volume.holdings[id]?.units ?? 0;
}

/** Value of every instrument held. */
export function instrumentsValue(state: GameState, kind?: InstrumentDef['kind']): number {
  let total = 0;
  for (const [id, h] of Object.entries(state.volume.holdings)) {
    const def = INSTRUMENT_BY_ID.get(id);
    if (!def || (kind && def.kind !== kind)) continue;
    total += h.units * price(state, id);
  }
  return total;
}

/** One market tick: every price takes a seeded step around its drifting fair value. */
export function marketTick(state: GameState): void {
  const m = state.volume.market;
  m.tick += 1;
  const rng = createRng(state.volume.seed).fork('market').fork(String(m.tick));
  for (const def of INSTRUMENTS) {
    const fair = (m.fair[def.id] ?? def.start) * Math.exp(def.drift);
    const current = m.prices[def.id] ?? def.start;
    const step = def.vol * rng.normal() + MEAN_REVERSION * Math.log(fair / current);
    const next = Math.max(current * Math.exp(step), def.start * 1e-4);
    m.fair[def.id] = fair;
    m.prices[def.id] = next;
    const history = (m.history[def.id] ??= []);
    history.push(next);
    if (history.length > PRICE_HISTORY) history.splice(0, history.length - PRICE_HISTORY);
  }
  artTick(state);
}

/** Runs the market ticks due by `now`; dividends on what is held. */
export function advanceMarket(state: GameState, now: number, dt: number): void {
  const m = state.volume.market;
  let guard = 0;
  while (now >= m.nextAt && guard < 20_000) {
    marketTick(state);
    m.nextAt += MARKET_TICK_SECONDS * 1000;
    guard++;
  }
  if (guard >= 20_000) m.nextAt = now + MARKET_TICK_SECONDS * 1000;
  let dividends = 0;
  for (const [id, h] of Object.entries(state.volume.holdings)) {
    const def = INSTRUMENT_BY_ID.get(id);
    if (def && def.dividend > 0) dividends += h.units * price(state, id) * def.dividend * dt;
  }
  earn(state, dividends);
}

/** A news shock: the price moves at once, the fair value moves by half (the effect fades). */
export function applyShocks(state: GameState, shocks: readonly Shock[]): void {
  const m = state.volume.market;
  for (const shock of shocks) {
    for (const def of INSTRUMENTS) {
      if (def.id !== shock.target && def.kind !== shock.target) continue;
      const shocked = (m.prices[def.id] ?? def.start) * shock.factor;
      m.prices[def.id] = shocked;
      m.fair[def.id] = (m.fair[def.id] ?? def.start) * Math.sqrt(shock.factor);
      const history = m.history[def.id];
      if (history && history.length > 0) history[history.length - 1] = shocked;
    }
  }
}

/** How many units the cash buys. */
export function affordableUnits(state: GameState, id: string): number {
  const p = price(state, id);
  if (p <= 0) return 0;
  const def = INSTRUMENT_BY_ID.get(id);
  const units = state.volume.cash / p;
  return def?.kind === 'stock' ? Math.floor(units) : Math.floor(units * 1000) / 1000;
}

export function buyUnits(state: GameState, id: string, units: number): ActionResult {
  if (!(units > 0)) return { ok: false, reason: 'none' };
  const cost = units * price(state, id);
  if (!spend(state, cost)) return { ok: false, reason: 'cash' };
  const h = (state.volume.holdings[id] ??= { units: 0, cost: 0 });
  h.units += units;
  h.cost += cost;
  return OK;
}

export interface SaleResult {
  ok: boolean;
  proceeds: number;
  profit: number;
  /** The price was the highest of the kept history. */
  atTop: boolean;
}

export function sellUnits(state: GameState, id: string, units: number): SaleResult {
  const h = state.volume.holdings[id];
  if (!h || h.units <= 0 || !(units > 0))
    return { ok: false, proceeds: 0, profit: 0, atTop: false };
  const sold = Math.min(units, h.units);
  const p = price(state, id);
  const proceeds = sold * p;
  const basis = h.cost * (sold / h.units);
  h.units -= sold;
  h.cost -= basis;
  if (h.units <= 1e-9) {
    const { [id]: _gone, ...rest } = state.volume.holdings;
    state.volume.holdings = rest;
  }
  const profit = proceeds - basis;
  // The basis comes back as cash; only the profit is earnings.
  state.volume.cash += Math.min(proceeds, basis);
  if (profit > 0) earn(state, profit);
  const history = state.volume.market.history[id] ?? [];
  const atTop = history.length >= 30 && p >= Math.max(...history) * 0.999 && profit > 0;
  return { ok: true, proceeds, profit, atTop };
}
