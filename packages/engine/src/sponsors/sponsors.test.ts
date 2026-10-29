import { describe, expect, it } from 'vitest';
import { GOLDEN_SHOWN_MS, OVERTIME_MS, SPONSORSHIP_MS, goldenGap } from '../data/sponsors.ts';
import { collectAway } from '../away/away.ts';
import { businessIncome, levelCost, profitPerCycle } from '../economy/economy.ts';
import { applyAway, tick } from '../game.ts';
import { candidates, hire } from '../managers/managers.ts';
import { claimable, closeVolume } from '../prestige/prestige.ts';
import { stamp } from '../desk/desk.ts';
import { migrate, newGame, type GameState } from '../state/state.ts';
import {
  goldenOnDesk,
  headhunt,
  offerLeft,
  payGolden,
  setGold,
  startOvertime,
  startSponsorship,
  takeGolden,
} from './sponsors.ts';

const T0 = 7_000_000;
const DAY = '2026-10-29';

/** A game with the café and the bakery open and a manager at the café. */
function running(): GameState {
  const s = newGame(T0);
  s.volume.businesses[0] = { level: 50, progress: 0, till: 0 };
  s.volume.businesses[1] = { level: 20, progress: 0, till: 0 };
  s.volume.managers[0] = { name: 'Rosa M.', trait: 'perfectionist', face: 1 };
  return s;
}

describe('sponsors', () => {
  it('overtime triples stamps for three minutes, adds up, and stops at six a day', () => {
    const s = running();
    const plain = stamp(s, T0).value;
    expect(startOvertime(s, T0 + 5_000, DAY).ok).toBe(true);
    // Stamps far apart keep the combo at one tally, so values compare.
    expect(stamp(s, T0 + 10_000).value).toBeCloseTo(plain * 3);
    expect(startOvertime(s, T0 + 20_000, DAY).ok).toBe(true);
    expect(s.sponsors.overtimeUntil).toBe(T0 + 5_000 + 2 * OVERTIME_MS);
    expect(stamp(s, T0 + 5_000 + 2 * OVERTIME_MS).value).toBeCloseTo(plain);
    for (let i = 0; i < 4; i++) expect(startOvertime(s, T0, DAY).ok).toBe(true);
    expect(offerLeft(s, 'overtime', DAY)).toBe(0);
    expect(startOvertime(s, T0, DAY)).toEqual({ ok: false, reason: 'limit' });
    // A new day, a new count.
    expect(startOvertime(s, T0, '2026-10-30').ok).toBe(true);
    expect(offerLeft(s, 'overtime', '2026-10-30')).toBe(5);
  });

  it('the sponsorship doubles business profit, banks hours, and stops at three a day', () => {
    const s = running();
    const before = businessIncome(s);
    expect(startSponsorship(s, T0, DAY).ok).toBe(true);
    expect(businessIncome(s)).toBeCloseTo(before * 2);
    startSponsorship(s, T0, DAY);
    startSponsorship(s, T0, DAY);
    expect(s.sponsors.sponsoredUntil).toBe(T0 + 3 * SPONSORSHIP_MS);
    expect(startSponsorship(s, T0, DAY).ok).toBe(false);
  });

  it('pays an absence twice for the part the sponsorship covered', () => {
    const plain = running();
    const sponsored = running();
    startSponsorship(sponsored, T0, DAY);
    // Away eight hours: the first four sponsored.
    const a = applyAway(plain, T0 + 8 * 3600_000)!;
    const b = applyAway(sponsored, T0 + 8 * 3600_000)!;
    const line = (r: typeof a) => r.lines.find((l) => l.kind === 'business')!.amount;
    expect(line(b)).toBeCloseTo(line(a) * 1.5);
    // The audit pays the receipt twice.
    const cash = sponsored.volume.cash;
    expect(collectAway(sponsored, true)).toBeCloseTo(b.total * 2);
    expect(sponsored.volume.cash).toBeCloseTo(cash + b.total * 2);
  });

  it('the golden invoice comes on the seed, waits for the ad, and pays one or fifteen minutes', () => {
    const s = running();
    const due = s.volume.golden.nextAt;
    expect(due - T0).toBe(goldenGap(s.volume.seed, 0));
    expect(due - T0).toBeGreaterThanOrEqual(5 * 60_000);
    expect(due - T0).toBeLessThanOrEqual(10 * 60_000);
    tick(s, due - 1000);
    expect(goldenOnDesk(s, due - 1000)).toBe(false);
    tick(s, due + 1000);
    expect(goldenOnDesk(s, due + 1000)).toBe(true);
    expect(takeGolden(s, due + 1000)).toBe(true);
    // The ad plays past the 30 seconds; the taken invoice still pays.
    tick(s, due + GOLDEN_SHOWN_MS + 5000);
    const income = businessIncome(s);
    expect(payGolden(s, DAY, true)).toBeCloseTo(income * 900);
    expect(payGolden(s, DAY, true)).toBe(0);
    expect(offerLeft(s, 'golden', DAY)).toBe(9);
    // A missed one leaves after 30 seconds and the next is scheduled.
    const next = s.volume.golden.nextAt;
    tick(s, next + 1000);
    tick(s, next + GOLDEN_SHOWN_MS + 1000);
    expect(goldenOnDesk(s, next + GOLDEN_SHOWN_MS + 1000)).toBe(false);
    expect(s.volume.golden.count).toBe(2);
  });

  it('the golden invoice pays its plain minute once the sponsored ones are spent', () => {
    const s = running();
    s.sponsors = { day: DAY, counts: { golden: 10 }, overtimeUntil: 0, sponsoredUntil: 0 };
    const due = s.volume.golden.nextAt;
    tick(s, due + 1);
    takeGolden(s, due + 1);
    expect(payGolden(s, DAY, true)).toBeCloseTo(businessIncome(s) * 60);
  });

  it('the golden schedule replays for a seed', () => {
    expect(goldenGap('vol:1:5', 3)).toBe(goldenGap('vol:1:5', 3));
    expect(new Set([0, 1, 2, 3, 4].map((n) => goldenGap('vol:1:5', n))).size).toBeGreaterThan(1);
  });

  it('the headhunter brings new candidates and a star whose trait counts twice', () => {
    const s = running();
    const before = candidates(s).map((c) => c.name);
    expect(headhunt(s, DAY).ok).toBe(true);
    const after = candidates(s);
    expect(after.map((c) => c.name)).not.toEqual(before);
    const star = after.find((c) => c.star)!;
    expect(star.business).toBe(s.volume.star);
    // Replays for the same seed and count.
    const again = running();
    headhunt(again, DAY);
    expect(again.volume.star).toBe(s.volume.star);
    // A hired star keeps the star, and its trait counts twice.
    s.volume.cash = 1e12;
    const plainCost = levelCost(s, star.business, 1);
    const plainProfit = profitPerCycle(s, star.business);
    expect(hire(s, star.business).ok).toBe(true);
    expect(s.volume.managers[star.business]?.star).toBe(true);
    expect(s.volume.star).toBeNull();
    if (star.trait === 'perfectionist') {
      expect(profitPerCycle(s, star.business)).toBeCloseTo(plainProfit * 1.2);
    } else if (star.trait === 'negotiator') {
      expect(levelCost(s, star.business, 1)).toBeCloseTo(plainCost * 0.8);
    }
    // No business left without a manager: no headhunter.
    const full = newGame(T0);
    expect(headhunt(full, DAY)).toEqual({ ok: false, reason: 'none' });
  });

  it('star traits: perfectionist +20%, negotiator −20%, night owl +30 points', () => {
    const base = running();
    const star = running();
    star.volume.managers[0] = { name: 'Rosa M.', trait: 'perfectionist', face: 1, star: true };
    expect(profitPerCycle(star, 0) / profitPerCycle(base, 0)).toBeCloseTo(1.2 / 1.1);
    base.volume.managers[0] = { name: 'Rosa M.', trait: 'negotiator', face: 1 };
    star.volume.managers[0] = { name: 'Rosa M.', trait: 'negotiator', face: 1, star: true };
    expect(levelCost(star, 0, 1) / levelCost(base, 0, 1)).toBeCloseTo(0.8 / 0.9);
    base.volume.managers[0] = { name: 'Rosa M.', trait: 'nightOwl', face: 1 };
    star.volume.managers[0] = { name: 'Rosa M.', trait: 'nightOwl', face: 1, star: true };
    const line = (s: GameState) =>
      applyAway(s, T0 + 3600_000)!.lines.find((l) => l.kind === 'business')!.amount;
    expect(line(star) / line(base)).toBeCloseTo(0.4 / 0.25);
  });

  it('the closing sponsor adds 10% held, not claimed, so later claims stay the same', () => {
    const plain = newGame(T0);
    const sponsored = newGame(T0);
    for (const s of [plain, sponsored]) s.meta.lifetimeEarnings = 1e17;
    const claim = claimable(plain);
    expect(closeVolume(plain, T0)).toBe(claim);
    expect(closeVolume(sponsored, T0, true)).toBe(claim + Math.ceil(claim * 0.1));
    expect(sponsored.meta.goodwill).toBe(plain.meta.goodwill + Math.ceil(claim * 0.1));
    expect(sponsored.meta.goodwillClaimed).toBe(plain.meta.goodwillClaimed);
    for (const s of [plain, sponsored]) s.meta.lifetimeEarnings = 4e17;
    expect(claimable(sponsored)).toBe(claimable(plain));
  });

  it('overtime and the sponsorship survive closing a volume', () => {
    const s = running();
    startOvertime(s, T0, DAY);
    startSponsorship(s, T0, DAY);
    closeVolume(s, T0);
    expect(s.sponsors.overtimeUntil).toBe(T0 + OVERTIME_MS);
    expect(s.sponsors.sponsoredUntil).toBe(T0 + SPONSORSHIP_MS);
  });

  it('the Gold Edition triples business profit', () => {
    const s = running();
    const before = businessIncome(s);
    setGold(s, true);
    expect(businessIncome(s)).toBeCloseTo(before * 3);
  });

  it('a save from before the sponsors loads with their defaults', () => {
    const old = JSON.parse(JSON.stringify(running())) as Record<string, unknown>;
    delete old.sponsors;
    const volume = old.volume as Record<string, unknown>;
    delete volume.golden;
    delete volume.headhunts;
    delete volume.star;
    delete (old.meta as Record<string, unknown>).gold;
    const s = migrate(old, T0)!;
    expect(s.sponsors.sponsoredUntil).toBe(0);
    expect(s.volume.golden.taken).toBe(false);
    expect(s.volume.headhunts).toBe(0);
    expect(s.meta.gold).toBe(false);
    tick(s, T0 + 1000);
    expect(businessIncome(s)).toBeGreaterThan(0);
  });
});
