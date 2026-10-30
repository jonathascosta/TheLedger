import { describe, expect, it } from 'vitest';
import { TREND_EVERY_MS, TREND_FACTOR, TREND_MS } from '../data/trends.ts';
import { bondCap } from '../assets/assets.ts';
import { businessRate } from '../economy/economy.ts';
import { applyAway, tick } from '../game.ts';
import { migrate, newGame, type GameState } from '../state/state.ts';
import { advanceTrends, drawTrend, restartTrends } from './trends.ts';

const T0 = 1_750_000_000_000;

/** A game with every business open, the café lowest and the airline highest. */
function opened(count = 10): GameState {
  const s = newGame(T0);
  for (let i = 0; i < count; i++) s.volume.businesses[i]!.level = 10;
  s.volume.managers = s.volume.managers.map((_, i) =>
    i < count ? { name: 'M', trait: 'perfectionist', face: 1 } : null,
  );
  return s;
}

/** The businesses by income, lowest first. */
function ranked(s: GameState): number[] {
  return s.volume.businesses
    .map((_, i) => i)
    .filter((i) => s.volume.businesses[i]!.level > 0)
    .sort((a, b) => businessRate(s, a) - businessRate(s, b) || a - b);
}

describe('trends', () => {
  it('come 25 minutes into the volume and replay for a seed', () => {
    const a = opened();
    const b = opened();
    advanceTrends(a, T0 + TREND_EVERY_MS - 1);
    expect(a.volume.trend.business).toBeNull();
    advanceTrends(a, T0 + TREND_EVERY_MS);
    advanceTrends(b, T0 + TREND_EVERY_MS);
    expect(a.volume.trend.business).not.toBeNull();
    expect(a.volume.trend).toEqual(b.volume.trend);
    expect(a.volume.trend.until).toBe(T0 + TREND_EVERY_MS + TREND_MS);
  });

  it('take an opened business of the lower half, and none of the recent ones', () => {
    const s = opened();
    const order = ranked(s);
    const half = order.slice(0, 5);
    const drawn: number[] = [];
    for (let k = 1; k <= 40; k++) {
      advanceTrends(s, T0 + k * TREND_EVERY_MS);
      drawn.push(s.volume.trend.business!);
    }
    // Five recent trends out of a lower half of five: when all five had one, the draw takes the
    // next business up (the sixth), and never a recent one.
    for (let k = 0; k < drawn.length; k++) {
      const recent = drawn.slice(Math.max(0, k - 5), k);
      expect(recent).not.toContain(drawn[k]);
      if (half.every((i) => recent.includes(i))) expect(drawn[k]).toBe(order[5]);
      else expect(half).toContain(drawn[k]);
    }
  });

  it('with a small ledger, wait for half the opened businesses, then go up', () => {
    const s = opened(4);
    // Two opened at the bottom, a window of two: the draw alternates over the four.
    s.volume.trend.recent = [ranked(s)[0]!, ranked(s)[1]!];
    expect(drawTrend(s, 1)).toBe(ranked(s)[2]);
    const one = opened(1);
    one.volume.trend.recent = [0];
    expect(drawTrend(one, 1)).toBe(0);
    expect(drawTrend(newGame(T0), 1)).toBeNull();
  });

  it('multiply the business by 50, capped at the best business, at least 2', () => {
    const s = opened();
    advanceTrends(s, T0 + TREND_EVERY_MS);
    const t = s.volume.trend;
    const best = Math.max(...ranked(s).map((i) => (i === t.business ? 0 : businessRate(s, i))));
    const own = businessRate(s, t.business!) / t.factor;
    expect(t.factor).toBe(Math.max(2, Math.min(TREND_FACTOR, best / own)));
    // The café and the bakery at level 10: the bakery makes 20 times the café, so the cap binds.
    const two = opened(2);
    const cafe = businessRate(two, 0);
    const bakery = businessRate(two, 1);
    advanceTrends(two, T0 + TREND_EVERY_MS);
    expect(two.volume.trend.business).toBe(0);
    expect(two.volume.trend.factor).toBeCloseTo(bakery / cafe);
    expect(two.volume.trend.factor).toBeGreaterThan(2);
    expect(two.volume.trend.factor).toBeLessThan(TREND_FACTOR);
    // A single business is its own best: the cap is 1, so the factor is the least, ×2.
    const one = opened(1);
    advanceTrends(one, T0 + TREND_EVERY_MS);
    expect(one.volume.trend.factor).toBe(2);
  });

  it('end after five minutes, in play', () => {
    const s = opened();
    tick(s, T0 + TREND_EVERY_MS);
    const business = s.volume.trend.business!;
    const during = businessRate(s, business);
    for (let t = 1; t <= 300; t++) tick(s, T0 + TREND_EVERY_MS + t * 1000);
    expect(s.volume.trend.business).toBeNull();
    expect(businessRate(s, business)).toBeLessThan(during);
  });

  it('end at an absence, and the receipt does not carry them', () => {
    const s = opened();
    tick(s, T0 + TREND_EVERY_MS);
    expect(s.volume.trend.business).not.toBeNull();
    const control = JSON.parse(JSON.stringify(s)) as GameState;
    control.volume.trend.business = null;
    const later = T0 + TREND_EVERY_MS + 3600_000;
    const receipt = applyAway(s, later);
    const expected = applyAway(control, later);
    expect(receipt?.total).toBe(expected?.total);
    expect(s.volume.trend.business).toBeNull();
    expect(s.volume.trend.nextAt).toBe(later + TREND_EVERY_MS);
  });

  it('are left out of the bond cap', () => {
    const s = opened();
    const before = bondCap(s);
    advanceTrends(s, T0 + TREND_EVERY_MS);
    s.lastTick = T0 + TREND_EVERY_MS;
    expect(bondCap(s)).toBeCloseTo(before);
  });

  it('a damaged save gets sane values', () => {
    const s = opened();
    const damaged = JSON.parse(JSON.stringify(s)) as { volume: Record<string, unknown> };
    damaged.volume.trend = { nextAt: null, recent: 'x', business: 42, factor: 'z', count: -3 };
    const loaded = migrate(damaged, T0)!;
    expect(loaded.volume.trend).toEqual({
      count: 0,
      nextAt: T0 + TREND_EVERY_MS,
      business: null,
      factor: 1,
      until: 0,
      recent: [],
    });
    damaged.volume.trend = { business: 1.5, recent: [0, 'a', 12, 3, null] };
    const mixed = migrate(damaged, T0)!;
    expect(mixed.volume.trend.business).toBeNull();
    expect(mixed.volume.trend.recent).toEqual([0, 3]);
    tick(loaded, T0 + 1000);
    expect(loaded.volume.trend.count).toBe(0);
  });

  it('stay in the save, and an old save loads without them', () => {
    const s = opened();
    tick(s, T0 + TREND_EVERY_MS);
    const saved = migrate(JSON.parse(JSON.stringify(s)), T0 + TREND_EVERY_MS + 10_000)!;
    expect(saved.volume.trend).toEqual(s.volume.trend);
    const old = JSON.parse(JSON.stringify(s)) as { volume: Record<string, unknown> };
    delete old.volume.trend;
    const loaded = migrate(old, T0)!;
    expect(loaded.volume.trend.business).toBeNull();
    expect(loaded.volume.trend.nextAt).toBe(T0 + TREND_EVERY_MS);
    restartTrends(saved, T0);
    expect(saved.volume.trend.business).toBeNull();
  });
});
