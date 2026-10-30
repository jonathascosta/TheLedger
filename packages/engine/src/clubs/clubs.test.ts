import { describe, expect, it } from 'vitest';
import { CLUBS, MATCH_MS, WIN_PRIZE } from '../data/clubs.ts';
import { PARKS } from '../data/assets.ts';
import { applyAway, tick } from '../game.ts';
import { newGame, type GameState } from '../state/state.ts';
import { isUnlocked, netWorth } from '../worth.ts';
import { buyClub, clubOf, playMatchDay, sellClub, stars, strength } from './clubs.ts';

const T0 = 11_000_000;

function rich(): GameState {
  const s = newGame(T0);
  s.volume.cash = 1e16;
  s.volume.peakNetWorth = 1e16;
  return s;
}

describe('sports clubs', () => {
  it('open at $1 trillion of peak net worth', () => {
    const s = newGame(T0);
    s.volume.peakNetWorth = 9.9e11;
    expect(isUnlocked(s, 'clubs')).toBe(false);
    s.volume.peakNetWorth = 1e12;
    expect(isUnlocked(s, 'clubs')).toBe(true);
  });

  it('a club is bought at its value, counts in net worth, sells at 90%', () => {
    const s = rich();
    const def = CLUBS[0]!;
    const before = netWorth(s);
    expect(buyClub(s, def.id).ok).toBe(true);
    expect(netWorth(s)).toBeCloseTo(before);
    expect(buyClub(s, def.id)).toEqual({ ok: false, reason: 'owned' });
    expect(sellClub(s, def.id).ok).toBe(true);
    expect(s.volume.cash).toBeCloseTo(1e16 - def.price * 0.1);
  });

  it('a match day replays for a seed', () => {
    const a = rich();
    const b = rich();
    for (const s of [a, b]) for (const def of CLUBS.slice(0, 3)) buyClub(s, def.id);
    for (let day = 1; day <= 20; day++) {
      expect(playMatchDay(a, day)).toBe(playMatchDay(b, day));
    }
    expect(a.volume.clubs).toEqual(b.volume.clubs);
  });

  it('prizes and values stay in their bounds; the last five results are kept', () => {
    const s = rich();
    const def = CLUBS[1]!;
    buyClub(s, def.id);
    for (let day = 1; day <= 500; day++) {
      const paid = playMatchDay(s, day);
      expect([0, (def.price * WIN_PRIZE) / 3, def.price * WIN_PRIZE]).toContainEqual(
        expect.closeTo(paid, 0),
      );
      const club = clubOf(s, def);
      expect(club.value).toBeGreaterThanOrEqual(def.price * 0.5 - 1e-3);
      expect(club.value).toBeLessThanOrEqual(def.price * 4 + 1e-3);
    }
    expect(clubOf(s, def).results).toHaveLength(5);
  });

  it('an average club earns within 15% of half a park of its price over 10,000 match days', () => {
    // Across the six clubs and many volumes' strengths: the average of the prize per price.
    let ratio = 0;
    let n = 0;
    for (let volume = 0; volume < 40; volume++) {
      const s = rich();
      s.volume.seed = `vol:${volume}:x`;
      for (const def of CLUBS) buyClub(s, def.id);
      for (let day = 1; day <= 250; day++) {
        playMatchDay(s, day);
        // Each club weighs the same: its prize this match day over its price.
        for (const def of CLUBS) {
          const last = clubOf(s, def).results.at(-1);
          ratio += last === 'W' ? WIN_PRIZE : last === 'D' ? WIN_PRIZE / 3 : 0;
          n++;
        }
      }
    }
    const perMatchDay = ratio / n;
    const halfPark = (PARKS[0]!.income / PARKS[0]!.price) * (MATCH_MS / 1000) * 0.5;
    expect(Math.abs(perMatchDay - halfPark) / halfPark).toBeLessThan(0.15);
  });

  it('buying and selling back makes no money', () => {
    const s = rich();
    const def = CLUBS[0]!;
    buyClub(s, def.id);
    for (let day = 1; day <= 50; day++) playMatchDay(s, day);
    const cash = s.volume.cash;
    const prizes = s.volume.earned;
    sellClub(s, def.id);
    buyClub(s, def.id);
    expect(s.volume.cash).toBeLessThan(cash);
    expect(s.volume.earned).toBe(prizes);
  });

  it('match days come every 10 minutes of play and restart after an absence', () => {
    const s = rich();
    buyClub(s, CLUBS[0]!.id);
    tick(s, T0 + MATCH_MS - 1000);
    expect(s.volume.matchday.count).toBe(0);
    tick(s, T0 + MATCH_MS);
    expect(s.volume.matchday.count).toBe(1);
    applyAway(s, T0 + 5 * 3600_000);
    expect(s.volume.matchday.count).toBe(1);
    expect(s.volume.matchday.nextAt).toBe(T0 + 5 * 3600_000 + MATCH_MS);
  });

  it('strength draws stars from one to five', () => {
    const s = rich();
    for (const def of CLUBS) {
      const st = stars(strength(s, def.id));
      expect(st).toBeGreaterThanOrEqual(1);
      expect(st).toBeLessThanOrEqual(5);
    }
  });
});
