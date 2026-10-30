import { describe, expect, it } from 'vitest';
import { buyUnits, sellUnits } from './market/market.ts';
import {
  buyPartner,
  claimable,
  closeVolume,
  earningsFor,
  goodwillTotal,
  nextGoodwill,
} from './prestige/prestige.ts';
import { answer } from './paper/paper.ts';
import { migrate, newGame } from './state/state.ts';
import { tick } from './game.ts';

const T0 = 5_000_000;

describe('world', () => {
  it("carries the renamed businesses' upgrades into a version 2 save", () => {
    const old = newGame(T0);
    old.version = 1;
    old.volume.upgrades = ['cafe.0', 'pizza.1', 'cinema.3', 'refinery.7', 'all.0', 'desk.2'];
    const save = migrate(JSON.parse(JSON.stringify(old)), T0);
    expect(save?.version).toBe(2);
    expect(save?.volume.upgrades).toEqual([
      'cafe.0',
      'print.1',
      'insurance.3',
      'airline.7',
      'all.0',
      'desk.2',
    ]);
  });

  it('fills the folded post-its of a save without them, and drops a malformed list', () => {
    const old = JSON.parse(JSON.stringify(newGame(T0))) as { settings: Record<string, unknown> };
    delete old.settings.postits;
    expect(migrate(old, T0)?.settings.postits).toEqual([]);
    old.settings.postits = 'bonds';
    expect(migrate(old, T0)?.settings.postits).toEqual([]);
    old.settings.postits = ['bonds', 7, null, 'art'];
    expect(migrate(old, T0)?.settings.postits).toEqual(['bonds', 'art']);
  });

  it('measures the way to the next goodwill point', () => {
    const s = newGame(T0);
    s.meta.lifetimeEarnings = earningsFor(10) + (earningsFor(11) - earningsFor(10)) / 4;
    const next = nextGoodwill(s);
    expect(goodwillTotal(s.meta.lifetimeEarnings)).toBe(10);
    expect(next.span).toBeCloseTo(earningsFor(11) - earningsFor(10));
    expect(next.into / next.span).toBeCloseTo(0.25);
    expect(next.left / next.span).toBeCloseTo(0.75);
    expect(goodwillTotal(s.meta.lifetimeEarnings + next.left * 1.0000001)).toBe(11);
  });

  it('keeps a known buy mode and replaces a garbage one with x1', () => {
    for (const mode of [1, 10, 100, 'max'] as const) {
      const old = newGame(T0);
      old.settings.buyMode = mode;
      expect(migrate(JSON.parse(JSON.stringify(old)), T0)?.settings.buyMode).toBe(mode);
    }
    for (const garbage of ['foo', -3, 2.5, 0, null]) {
      const old = JSON.parse(JSON.stringify(newGame(T0))) as { settings: Record<string, unknown> };
      old.settings.buyMode = garbage;
      expect(migrate(old, T0)?.settings.buyMode).toBe(1);
    }
  });

  it('replays the same market for the same volume', () => {
    const a = newGame(T0);
    const b = newGame(T0);
    tick(a, T0 + 600_000);
    for (let t = 1000; t <= 600_000; t += 1000) tick(b, T0 + t);
    expect(a.volume.market.prices).toEqual(b.volume.market.prices);
    expect(a.volume.market.tick).toBe(121);
  });

  it('counts only trading profit as earnings', () => {
    const s = newGame(T0);
    s.volume.cash = 1000;
    buyUnits(s, 'nmtc', 5);
    s.volume.market.prices.nmtc = 200;
    const sale = sellUnits(s, 'nmtc', 5);
    expect(sale.profit).toBeCloseTo(400);
    expect(s.volume.earned).toBeCloseTo(400);
    expect(s.volume.cash).toBeCloseTo(1400);
  });

  it('claims goodwill, keeps the meta and resets the volume', () => {
    const s = newGame(T0);
    expect(goodwillTotal(1e15)).toBe(150);
    s.meta.lifetimeEarnings = 4e15;
    s.volume.cash = 1e12;
    s.meta.achievements.million = T0;
    expect(claimable(s)).toBe(300);
    expect(closeVolume(s, T0 + 1)).toBe(300);
    expect(s.volume.number).toBe(2);
    expect(s.volume.cash).toBe(0);
    expect(s.meta.goodwill).toBe(300);
    expect(s.meta.achievements.million).toBe(T0);
    expect(s.meta.shelf).toHaveLength(1);
    expect(claimable(s)).toBe(0);
    expect(buyPartner(s, 'headStart').ok).toBe(true);
    closeVolume(s, T0 + 2);
    expect(s.volume.cash).toBe(10_000);
  });

  it('brings the paper once stocks open and answers it once', () => {
    const s = newGame(T0);
    s.volume.peakNetWorth = 2e5;
    s.volume.cash = 1e5;
    tick(s, T0 + 60_000);
    expect(s.volume.paper.edition).toBe(1);
    expect(s.volume.paper.event).toBe('satellite');
    expect(answer(s, 'careful').ok).toBe(true);
    expect(answer(s, 'bold').ok).toBe(false);
  });
});
