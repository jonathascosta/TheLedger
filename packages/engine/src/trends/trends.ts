import { BUSINESSES } from '../data/businesses.ts';
import {
  TREND_EVERY_MS,
  TREND_FACTOR,
  TREND_MIN_FACTOR,
  TREND_MS,
  TREND_RECENT,
} from '../data/trends.ts';
import { businessRate, endTrend } from '../economy/economy.ts';
import { createRng } from '../rng/rng.ts';
import type { GameState } from '../state/state.ts';

/**
 * The business trend number `count` takes, or null when nothing is open: drawn among the lower
 * half by income, skipping the businesses of the recent trends (PRODUCT.md, Trends).
 */
export function drawTrend(state: GameState, count: number): number | null {
  const opened = BUSINESSES.map((_, i) => i).filter((i) => state.volume.businesses[i]!.level > 0);
  if (opened.length === 0) return null;
  const rates = new Map(opened.map((i) => [i, businessRate(state, i)]));
  // Lowest income first; ties broken by order.
  const ranked = [...opened].sort((a, b) => rates.get(a)! - rates.get(b)! || a - b);
  const window = Math.min(TREND_RECENT, Math.floor(opened.length / 2));
  const recent = new Set(window > 0 ? state.volume.trend.recent.slice(-window) : []);
  const half = Math.max(1, Math.floor(opened.length / 2));
  const pool = ranked.slice(0, half).filter((i) => !recent.has(i));
  if (pool.length === 0) return ranked.find((i) => !recent.has(i)) ?? ranked[0]!;
  const r = createRng(state.volume.seed).fork('trend').fork(String(count)).next();
  return pool[Math.floor(r * pool.length)]!;
}

/** Starts trend number `count` at `at` (game ms). */
function startTrend(state: GameState, count: number, at: number): void {
  const t = state.volume.trend;
  endTrend(state);
  const business = drawTrend(state, count);
  if (business === null) return;
  const own = businessRate(state, business);
  const best = Math.max(...BUSINESSES.map((_, i) => businessRate(state, i)));
  const cap = own > 0 ? best / own : TREND_FACTOR;
  t.business = business;
  t.factor = Math.max(TREND_MIN_FACTOR, Math.min(TREND_FACTOR, cap));
  t.until = at + TREND_MS;
  t.recent = [...t.recent, business].slice(-TREND_RECENT);
}

/** Ends a trend whose time is up and starts the ones due by `now` (in play only). */
export function advanceTrends(state: GameState, now: number): void {
  const t = state.volume.trend;
  if (t.business !== null && now >= t.until) endTrend(state);
  while (now >= t.nextAt) {
    t.count += 1;
    const at = t.nextAt;
    t.nextAt += TREND_EVERY_MS;
    startTrend(state, t.count, at);
    if (now >= t.until) endTrend(state);
  }
}

/** After an absence or a restore: a running trend ends and the clock starts again from now. */
export function restartTrends(state: GameState, now: number): void {
  endTrend(state);
  state.volume.trend.nextAt = now + TREND_EVERY_MS;
}
