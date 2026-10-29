import { describe, expect, it } from 'vitest';
import { applyAway, tick } from '../game.ts';
import { hire } from '../managers/managers.ts';
import { stamp } from '../desk/desk.ts';
import { collectAway } from '../away/away.ts';
import { newGame } from '../state/state.ts';
import {
  buyBusiness,
  businessRate,
  buyUpgrade,
  collect,
  cycleOf,
  levelCost,
  maxAffordable,
  profitPerCycle,
} from './economy.ts';

const T0 = 1_000_000;

describe('economy', () => {
  it('opens the café with two stamps and collects its till', () => {
    const s = newGame(T0);
    stamp(s, T0);
    stamp(s, T0 + 100);
    expect(s.volume.cash).toBeGreaterThanOrEqual(4);
    expect(buyBusiness(s, 0).ok).toBe(true);
    tick(s, T0 + 1500);
    expect(s.volume.businesses[0]!.till).toBe(1);
    expect(collect(s, 0).ok).toBe(true);
    expect(s.volume.businesses[0]!.till).toBe(0);
  });

  it('sums level costs geometrically and finds the max affordable', () => {
    const s = newGame(T0);
    s.volume.cash = 1e6;
    const n = maxAffordable(s, 0);
    expect(levelCost(s, 0, n)).toBeLessThanOrEqual(1e6);
    expect(levelCost(s, 0, n + 1)).toBeGreaterThan(1e6);
  });

  it('halves the cycle at milestones and triples profit with an upgrade', () => {
    const s = newGame(T0);
    s.volume.businesses[1]!.level = 25;
    expect(cycleOf(s, 1).seconds).toBeCloseTo(1.5);
    const before = profitPerCycle(s, 1);
    s.volume.cash = 1e12;
    expect(buyUpgrade(s, 'bakery.0').ok).toBe(true);
    expect(profitPerCycle(s, 1)).toBeCloseTo(before * 3);
  });

  it('a manager earns the same over one long tick as over many short ones', () => {
    const a = newGame(T0);
    const b = newGame(T0);
    for (const s of [a, b]) {
      s.volume.cash = 1e9;
      s.volume.businesses[2]!.level = 30;
      hire(s, 2);
    }
    tick(a, T0 + 50_000);
    for (let t = 100; t <= 50_000; t += 100) tick(b, T0 + t);
    expect(a.volume.cash).toBeCloseTo(b.volume.cash, 0);
  });

  it('prints a receipt for an absence and caps it at 12 hours', () => {
    const s = newGame(T0);
    s.volume.cash = 1e9;
    s.volume.businesses[0]!.level = 10;
    hire(s, 0);
    const cash = s.volume.cash;
    const receipt = applyAway(s, T0 + 48 * 3600_000);
    expect(receipt?.seconds).toBe(12 * 3600);
    const owl = s.volume.managers[0]!.trait === 'nightOwl' ? 0.15 : 0;
    expect(receipt?.total).toBeCloseTo(businessRate(s, 0) * 12 * 3600 * (receipt!.rate + owl), 0);
    const second = applyAway(s, T0 + 48 * 3600_000 + 180_000);
    expect(second!.total).toBeGreaterThan(receipt!.total);
    expect(s.away!.seconds).toBe(12 * 3600 + 180);
    const total = s.away!.total;
    collectAway(s);
    expect(s.volume.cash).toBeCloseTo(cash + total, 0);
    tick(s, T0 + 48 * 3600_000 + 180_100);
    expect(s.volume.cash).toBeLessThan(cash + total + 20);
  });
});

describe('the front desk stays a boost', () => {
  it('pays at most a fifth of a second of income per stamp, fully upgraded at full combo', () => {
    const s = newGame(T0);
    s.volume.businesses.forEach((b, i) => (b.level = 100 - i * 8));
    s.volume.upgrades = ['desk.0', 'desk.1', 'desk.2', 'desk.3', 'desk.4'];
    let value = 0;
    for (let i = 0; i < 20; i++) value = stamp(s, T0 + i * 100).value;
    const income =
      businessRate(s, 0) +
      s.volume.businesses.reduce((sum, _, i) => sum + (i > 0 ? businessRate(s, i) : 0), 0);
    expect(value / income).toBeLessThanOrEqual(0.2);
    expect(value / income).toBeGreaterThan(0.1);
  });
});
