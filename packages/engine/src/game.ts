import { checkAchievements, grant } from './achievements/achievements.ts';
import {
  advanceAuction,
  bondRate,
  nextPitch,
  parkRate,
  passiveRate,
  rentRate,
  settleStartup,
} from './assets/assets.ts';
import { AWAY_MAX_SECONDS, AWAY_MIN_SECONDS, awayReceipt } from './away/away.ts';
import { advanceBusinesses, earn } from './economy/economy.ts';
import { advanceMarket } from './market/market.ts';
import { advancePaper } from './paper/paper.ts';
import type { AwayLine, AwayReceipt, GameState } from './state/state.ts';
import { isUnlocked, netWorth } from './worth.ts';

/** Net worth is sampled for the ink chart this often (game ms). */
export const SAMPLE_EVERY_MS = 10_000;
export const HISTORY_LENGTH = 180;

function sample(state: GameState, now: number): void {
  const v = state.volume;
  const worth = netWorth(state);
  v.peakNetWorth = Math.max(v.peakNetWorth, worth);
  while (now - v.lastSampleAt >= SAMPLE_EVERY_MS) {
    v.lastSampleAt += SAMPLE_EVERY_MS;
    v.history.push(worth);
  }
  if (v.history.length > HISTORY_LENGTH) v.history.splice(0, v.history.length - HISTORY_LENGTH);
}

/** The world around the businesses: market, paper, startups, auctions. */
function advanceWorld(state: GameState, now: number, dt: number): void {
  advanceMarket(state, now, dt);
  const worth = netWorth(state);
  if (isUnlocked(state, 'stocks')) advancePaper(state, now);
  else state.volume.paper.nextAt = Math.max(state.volume.paper.nextAt, now + 30_000);
  if (isUnlocked(state, 'startups')) {
    const result = settleStartup(state, now);
    if (result && result.multiple >= 100) grant(state, 'unicorn', now);
    nextPitch(state, worth);
  }
  if (isUnlocked(state, 'art')) advanceAuction(state, now, worth);
}

/**
 * Advances the game to `now` (ms). Steps are split so long gaps stay accurate. Gaps of a minute or
 * more are absences: the app routes them through `applyAway`.
 */
export function tick(state: GameState, now: number): void {
  const total = Math.max(0, (now - state.lastTick) / 1000);
  let remaining = total;
  while (remaining > 0) {
    const dt = Math.min(remaining, 1);
    advanceBusinesses(state, dt);
    earn(state, passiveRate(state) * dt);
    remaining -= dt;
  }
  advanceWorld(state, now, total);
  state.lastTick = Math.max(state.lastTick, now);
  sample(state, now);
  checkAchievements(state, now);
}

function awayExtras(state: GameState, seconds: number, rate: number): AwayLine[] {
  const lines: AwayLine[] = [];
  const rent = rentRate(state) * seconds * rate;
  if (rent > 0) lines.push({ kind: 'rent', id: '', amount: rent });
  const bonds = state.volume.bonds * bondRate(state) * seconds * rate;
  if (bonds > 0) lines.push({ kind: 'bonds', id: '', amount: bonds });
  const parks = parkRate(state) * seconds * rate;
  if (parks > 0) lines.push({ kind: 'energy', id: '', amount: parks });
  return lines;
}

/**
 * Handles an absence: if the game was away longer than a minute, prepares the receipt (managed
 * businesses, rents, bonds and parks at the offline rate), lets unmanaged tills fill, moves the
 * market on and the clock to `now`. Returns the receipt, also kept in `state.away` until
 * collected.
 */
export function applyAway(state: GameState, now: number): AwayReceipt | null {
  const gap = (now - state.lastTick) / 1000;
  if (gap < AWAY_MIN_SECONDS) {
    tick(state, now);
    return null;
  }
  const seconds = Math.min(gap, AWAY_MAX_SECONDS);
  const receipt = awayReceipt(state, seconds, awayExtras);
  // Unmanaged tills fill (one cycle each); managed businesses earn through the receipt.
  advanceBusinesses(state, seconds, true);
  // The market moves on for the counted time; editions and lots restart from now.
  state.volume.market.nextAt = Math.max(state.volume.market.nextAt, now - seconds * 1000);
  advanceMarket(state, now, 0);
  state.volume.paper.nextAt = Math.max(state.volume.paper.nextAt, now + 30_000);
  state.lastTick = now;
  state.volume.lastSampleAt = now;
  if (seconds >= AWAY_MAX_SECONDS) grant(state, 'insomniac', now);
  if (receipt.total > 0) state.away = state.away ? mergeReceipts(state.away, receipt) : receipt;
  advanceWorld(state, now, 0);
  checkAchievements(state, now);
  return receipt.total > 0 ? state.away : null;
}

/** An uncollected receipt and a new one become one: nothing earned is lost. */
function mergeReceipts(a: AwayReceipt, b: AwayReceipt): AwayReceipt {
  const lines = a.lines.map((l) => ({ ...l }));
  for (const line of b.lines) {
    const same = lines.find((l) => l.kind === line.kind && l.id === line.id);
    if (same) same.amount += line.amount;
    else lines.push({ ...line });
  }
  return { seconds: a.seconds + b.seconds, rate: b.rate, lines, total: a.total + b.total };
}

export { netWorth };
