import { describe, expect, it } from 'vitest';
import { closeVolume } from '../prestige/prestige.ts';
import { businessIncome } from '../economy/economy.ts';
import { migrate, newGame, type GameState } from '../state/state.ts';
import { tick } from '../game.ts';
import { canRetire, eraClaimed, eraStyle, heirOf, legacyClaim, retire } from './dynasty.ts';

const T0 = 9_000_000;

/** A game whose lifetime earnings make `claim` goodwill claimable now. */
function withClaim(claim: number): GameState {
  const s = newGame(T0);
  // goodwill = floor(150 * sqrt(L / 1e15))  →  L = (claim / 150)^2 * 1e15, a little more.
  s.meta.lifetimeEarnings = (claim / 150) ** 2 * 1e15 * 1.0001;
  s.volume.businesses[0] = { level: 25, progress: 0, till: 0 };
  return s;
}

describe('the dynasty', () => {
  it('Retire opens at 1,000 claimed in the era, counting what closing now would claim', () => {
    expect(canRetire(withClaim(999))).toBe(false);
    const ready = withClaim(1000);
    expect(eraClaimed(ready)).toBe(1000);
    expect(canRetire(ready)).toBe(true);
    // Part claimed already, part pending: the same.
    const split = withClaim(1000);
    closeVolume(split, T0);
    expect(split.meta.goodwillClaimed).toBe(1000);
    expect(canRetire(split)).toBe(true);
  });

  it('legacy is floor(sqrt(claimed)): 31 at 1,000, 44 at 2,000', () => {
    expect(legacyClaim(withClaim(1000))).toBe(31);
    expect(legacyClaim(withClaim(2000))).toBe(44);
  });

  it('retiring closes the volume, keeps what the heir keeps, starts the rest again', () => {
    const s = withClaim(1000);
    s.meta.partners = ['fastTills', 'headStart'];
    s.meta.gold = true;
    s.meta.achievements = { firstBusiness: T0 };
    s.sponsors = {
      day: '2026-10-30',
      counts: { overtime: 2 },
      overtimeUntil: 0,
      sponsoredUntil: T0 + 1e6,
    };
    s.away = {
      seconds: 100,
      rate: 0.1,
      lines: [{ kind: 'bonds', id: '', amount: 500 }],
      total: 500,
    };
    const result = retire(s, T0 + 1000);
    expect(result).toEqual({ ok: true, legacy: 31 });
    expect(s.meta.era).toBe(2);
    expect(s.meta.legacy).toBe(31);
    expect(s.meta.goodwill).toBe(0);
    expect(s.meta.goodwillClaimed).toBe(0);
    expect(s.meta.lifetimeEarnings).toBe(0);
    expect(s.meta.partners).toEqual(['fastTills', 'headStart']);
    expect(s.meta.gold).toBe(true);
    expect(s.meta.achievements.firstBusiness).toBe(T0);
    expect(s.sponsors.counts.overtime).toBe(2);
    expect(s.sponsors.sponsoredUntil).toBe(T0 + 1e6);
    expect(s.meta.shelf).toEqual([expect.objectContaining({ era: 1, number: 1 })]);
    expect(s.volume.number).toBe(1);
    expect(s.volume.cash).toBe(10_000); // Head start, kept as a partner.
    expect(s.away).toBeNull();
    // The heir earns the achievement on the next tick.
    tick(s, T0 + 2000);
    expect(s.meta.achievements.heir).toBeDefined();
  });

  it('legacy is its own factor on business profit: ×(1 + 0.2 × legacy)', () => {
    const s = withClaim(0);
    const before = businessIncome(s);
    s.meta.legacy = 31;
    expect(businessIncome(s)).toBeCloseTo(before * 7.2);
  });

  it('cannot retire before the threshold', () => {
    const s = withClaim(500);
    expect(retire(s, T0)).toEqual({ ok: false, reason: 'locked' });
    expect(s.meta.era).toBe(1);
  });

  it('the family keeps its surname; each era has its head; eras cycle every four', () => {
    const s = newGame(T0);
    const founder = heirOf(s, 1);
    const heir = heirOf(s, 2);
    expect(heir.surname).toBe(founder.surname);
    expect(heirOf(s, 2)).toEqual(heir);
    expect([1, 2, 3, 4, 5, 6, 9].map(eraStyle)).toEqual([1, 2, 3, 4, 1, 2, 1]);
  });

  it('an old save loads as era I with no legacy, and its shelf as era I', () => {
    const old = JSON.parse(JSON.stringify(newGame(T0))) as { meta: Record<string, unknown> };
    delete old.meta.era;
    delete old.meta.legacy;
    old.meta.shelf = [{ number: 1, peakNetWorth: 5, goodwill: 3, closedAt: T0 }];
    const s = migrate(old, T0)!;
    expect(s.meta.era).toBe(1);
    expect(s.meta.legacy).toBe(0);
    expect(s.meta.shelf[0]!.era ?? 1).toBe(1);
  });
});
