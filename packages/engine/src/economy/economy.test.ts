import { describe, expect, it } from 'vitest';
import { applyAway, tick } from '../game.ts';
import { hire } from '../managers/managers.ts';
import { stamp } from '../desk/desk.ts';
import { collectAway } from '../away/away.ts';
import { newGame } from '../state/state.ts';
import { closeVolume } from '../prestige/prestige.ts';
import { UPGRADE_BY_ID } from '../data/upgrades.ts';
import {
  buyBusiness,
  buyOffer,
  businessIncome,
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

  it('opens a business with one level in every buy mode', () => {
    for (const mode of [10, 100, 'max'] as const) {
      const s = newGame(T0);
      s.settings.buyMode = mode;
      s.volume.cash = levelCost(s, 0, 1) * 50;
      expect(buyOffer(s, 0)).toEqual({ count: 1, cost: levelCost(s, 0, 1) });
      expect(buyBusiness(s, 0).ok).toBe(true);
      expect(s.volume.businesses[0]!.level).toBe(1);
    }
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
    const income = businessIncome(s);
    expect(value / income).toBeLessThanOrEqual(0.2);
    expect(value / income).toBeGreaterThan(0.1);
  });
});

describe('special orders', () => {
  const ORDER = 'order.cafe.0';
  const cost = UPGRADE_BY_ID.get(ORDER)!.cost;

  it('unlocks at its level and is bought once', () => {
    const s = newGame(T0);
    s.volume.cash = cost * 3;
    s.volume.businesses[0]!.level = 299;
    expect(buyUpgrade(s, ORDER)).toEqual({ ok: false, reason: 'locked' });
    s.volume.businesses[0]!.level = 300;
    expect(buyUpgrade(s, ORDER).ok).toBe(true);
    expect(buyUpgrade(s, ORDER)).toEqual({ ok: false, reason: 'owned' });
  });

  it('multiplies only its business, and goes with the volume', () => {
    const s = newGame(T0);
    s.volume.cash = cost;
    s.volume.businesses[0]!.level = 300;
    s.volume.businesses[1]!.level = 10;
    const cafe = businessRate(s, 0);
    const bakery = businessRate(s, 1);
    buyUpgrade(s, ORDER);
    expect(businessRate(s, 0)).toBeCloseTo(cafe * 8);
    expect(businessRate(s, 1)).toBe(bakery);
    closeVolume(s, T0 + 1);
    expect(s.volume.upgrades).toEqual([]);
  });

  it('is not discounted by a Negotiator', () => {
    const s = newGame(T0);
    s.volume.managers[0] = { name: 'Rosa M.', trait: 'negotiator', face: 1 };
    s.volume.businesses[0]!.level = 300;
    s.volume.cash = cost * 2;
    buyUpgrade(s, ORDER);
    expect(s.volume.cash).toBeCloseTo(cost);
  });

  it("after the café's last order, its next level pays back like the airline's", () => {
    const s = newGame(T0);
    s.volume.businesses[0]!.level = 800;
    s.volume.upgrades.push('order.cafe.0', 'order.cafe.1', 'order.cafe.2');
    // The airline's level whose price matches the café's next level.
    let airline = 1;
    while (levelCost(s, 9, 1) < levelCost(s, 0, 1)) s.volume.businesses[9]!.level = ++airline;
    const payback = (i: number): number => {
      const before = businessRate(s, i);
      s.volume.businesses[i]!.level++;
      const gain = businessRate(s, i) - before;
      s.volume.businesses[i]!.level--;
      return levelCost(s, i, 1) / gain;
    };
    const ratio = payback(0) / payback(9);
    expect(ratio).toBeGreaterThan(0.5);
    expect(ratio).toBeLessThan(2);
  });
});
