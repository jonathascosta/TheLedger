import {
  ART_ARTISTS,
  ART_KINDS,
  ART_LOT_SECONDS,
  BOND_CAP_SECONDS,
  BOND_RATE,
  PARKS,
  PROPERTIES,
  PROPERTY_SALE,
  STARTUP_ASK,
  STARTUP_NAME_A,
  STARTUP_NAME_B,
  STARTUP_OUTCOMES,
  STARTUP_SECTORS,
} from '../data/assets.ts';
import {
  businessIncome,
  earn,
  hasPartner,
  spend,
  OK,
  type ActionResult,
} from '../economy/economy.ts';
import { createRng } from '../rng/rng.ts';
import type { GameState, StartupResult } from '../state/state.ts';

// ---- Bonds ----

export function bondRate(state: GameState): number {
  return BOND_RATE * (hasPartner(state, 'bondDesk') ? 2 : 1);
}

/** The most that can be lent: a few hours of business income. */
export function bondCap(state: GameState): number {
  return Math.max(1e6, businessIncome(state) * BOND_CAP_SECONDS);
}

export function lend(state: GameState, amount: number): ActionResult {
  const room = bondCap(state) - state.volume.bonds;
  const sum = Math.min(amount, room, state.volume.cash);
  if (!(sum > 0)) return { ok: false, reason: room <= 0 ? 'owned' : 'cash' };
  spend(state, sum);
  state.volume.bonds += sum;
  return OK;
}

export function withdraw(state: GameState): ActionResult {
  if (state.volume.bonds <= 0) return { ok: false, reason: 'none' };
  state.volume.cash += state.volume.bonds;
  state.volume.bonds = 0;
  return OK;
}

// ---- Real estate and energy ----

export function rentRate(state: GameState): number {
  const factor = hasPartner(state, 'estateAgent') ? 2 : 1;
  return PROPERTIES.filter((p) => state.volume.properties.includes(p.id)).reduce(
    (sum, p) => sum + p.rent * factor,
    0,
  );
}

export function parkRate(state: GameState): number {
  return PARKS.filter((p) => state.volume.parks.includes(p.id)).reduce((s, p) => s + p.income, 0);
}

export function buyProperty(state: GameState, id: string): ActionResult {
  const def = PROPERTIES.find((p) => p.id === id);
  if (!def) return { ok: false, reason: 'none' };
  if (state.volume.properties.includes(id)) return { ok: false, reason: 'owned' };
  if (!spend(state, def.price)) return { ok: false, reason: 'cash' };
  state.volume.properties.push(id);
  return OK;
}

export function sellProperty(state: GameState, id: string): ActionResult {
  const def = PROPERTIES.find((p) => p.id === id);
  if (!def || !state.volume.properties.includes(id)) return { ok: false, reason: 'none' };
  state.volume.properties = state.volume.properties.filter((p) => p !== id);
  state.volume.cash += def.price * PROPERTY_SALE;
  return OK;
}

export function buyPark(state: GameState, id: string): ActionResult {
  const def = PARKS.find((p) => p.id === id);
  if (!def) return { ok: false, reason: 'none' };
  if (state.volume.parks.includes(id)) return { ok: false, reason: 'owned' };
  if (!spend(state, def.price)) return { ok: false, reason: 'cash' };
  state.volume.parks.push(id);
  return OK;
}

// ---- Startups ----

export interface PitchInfo {
  name: string;
  sector: string;
  /** Seconds from investing to the result. */
  duration: number;
}

export function pitchInfo(state: GameState, index: number): PitchInfo {
  const rng = createRng(state.volume.seed).fork('startup').fork(String(index));
  return {
    name: rng.pick(STARTUP_NAME_A) + rng.pick(STARTUP_NAME_B),
    sector: rng.pick(STARTUP_SECTORS),
    duration: 180 + rng.int(421),
  };
}

function outcome(state: GameState, index: number): number {
  const rng = createRng(state.volume.seed).fork('startup').fork(String(index)).fork('outcome');
  let draw = rng.next();
  for (const o of STARTUP_OUTCOMES) {
    if (draw < o.p) return o.multiple;
    draw -= o.p;
  }
  return 0;
}

/** Offers the next pitch when none is open. */
export function nextPitch(state: GameState, worth: number): void {
  if (state.volume.startup) return;
  const index = state.volume.startupResults.length + 1;
  state.volume.startup = { index, ask: Math.max(1e7, worth * STARTUP_ASK), maturesAt: null };
}

export function investStartup(state: GameState, now: number): ActionResult {
  const pitch = state.volume.startup;
  if (!pitch || pitch.maturesAt !== null) return { ok: false, reason: 'none' };
  if (!spend(state, pitch.ask)) return { ok: false, reason: 'cash' };
  pitch.maturesAt = now + pitchInfo(state, pitch.index).duration * 1000;
  return OK;
}

/** Passes on the open pitch; the next one is offered. */
export function passStartup(state: GameState): ActionResult {
  const pitch = state.volume.startup;
  if (!pitch || pitch.maturesAt !== null) return { ok: false, reason: 'none' };
  state.volume.startupResults.push({ index: pitch.index, stake: 0, multiple: 0 });
  state.volume.startup = null;
  return OK;
}

/** Settles a matured startup; returns its result. */
export function settleStartup(state: GameState, now: number): StartupResult | null {
  const pitch = state.volume.startup;
  if (!pitch || pitch.maturesAt === null || now < pitch.maturesAt) return null;
  const multiple = outcome(state, pitch.index);
  const payout = pitch.ask * multiple;
  state.volume.cash += Math.min(payout, pitch.ask);
  if (payout > pitch.ask) earn(state, payout - pitch.ask);
  const result = { index: pitch.index, stake: pitch.ask, multiple };
  state.volume.startupResults.push(result);
  state.volume.startup = null;
  return result;
}

// ---- Art ----

export interface LotInfo {
  kind: string;
  number: number;
  artist: string;
}

export function lotInfo(state: GameState, lot: number): LotInfo {
  const rng = createRng(state.volume.seed).fork('art').fork(String(lot));
  return { kind: rng.pick(ART_KINDS), number: 1 + rng.int(40), artist: rng.pick(ART_ARTISTS) };
}

/** Puts the next lot up when the last one closed. */
export function advanceAuction(state: GameState, now: number, worth: number): void {
  const lot = state.volume.artLot;
  if (lot && now < lot.closesAt) return;
  const next = (lot?.lot ?? 0) + 1;
  const rng = createRng(state.volume.seed).fork('art').fork(String(next)).fork('price');
  const price = Math.max(1e10, worth * (0.01 + rng.next() * 0.04));
  state.volume.artLot = { lot: next, price, closesAt: now + ART_LOT_SECONDS * 1000 };
}

export function buyArt(state: GameState): ActionResult {
  const lot = state.volume.artLot;
  if (!lot) return { ok: false, reason: 'none' };
  if (state.volume.art.some((a) => a.lot === lot.lot)) return { ok: false, reason: 'owned' };
  if (!spend(state, lot.price)) return { ok: false, reason: 'cash' };
  state.volume.art.push({ lot: lot.lot, paid: lot.price, value: lot.price });
  return OK;
}

/** Art values creep up with noise, once per market tick. */
export function artTick(state: GameState): void {
  const rng = createRng(state.volume.seed).fork('artValue').fork(String(state.volume.market.tick));
  for (const piece of state.volume.art) piece.value *= Math.exp(0.0008 + 0.01 * rng.normal());
}

/** Sells a piece at auction: 80% to 130% of its value. */
export function sellArt(state: GameState, lot: number): { ok: boolean; proceeds: number } {
  const index = state.volume.art.findIndex((a) => a.lot === lot);
  if (index < 0) return { ok: false, proceeds: 0 };
  const piece = state.volume.art[index]!;
  const rng = createRng(state.volume.seed).fork('artSale').fork(String(lot));
  const proceeds = piece.value * (0.8 + rng.next() * 0.5);
  state.volume.art.splice(index, 1);
  state.volume.cash += Math.min(proceeds, piece.paid);
  if (proceeds > piece.paid) earn(state, proceeds - piece.paid);
  return { ok: true, proceeds };
}

export function artValue(state: GameState): number {
  return state.volume.art.reduce((s, a) => s + a.value, 0);
}

export function propertiesValue(state: GameState): number {
  return PROPERTIES.filter((p) => state.volume.properties.includes(p.id)).reduce(
    (s, p) => s + p.price,
    0,
  );
}

export function parksValue(state: GameState): number {
  return PARKS.filter((p) => state.volume.parks.includes(p.id)).reduce((s, p) => s + p.price, 0);
}

/** Per-second income from rents, parks and bonds (not businesses). */
export function passiveRate(state: GameState): number {
  return rentRate(state) + parkRate(state) + state.volume.bonds * bondRate(state);
}
