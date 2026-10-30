import { migrate, newGame, type GameState } from '@ledger/engine';
import { describe, expect, it } from 'vitest';
import { notes, outOfQuiet, reconcile, shouldAsk } from './schedule.ts';

/** A local time today (device clock), so quiet hours are tested whatever the time zone. */
function at(hour: number, minute = 0, day = 0): number {
  const d = new Date(2026, 9, 30 + day, hour, minute, 0, 0);
  return d.getTime();
}

function game(now: number): GameState {
  const s = newGame(now);
  s.lastTick = now;
  return s;
}

describe('notes from the night shift', () => {
  it('none without a reason', () => {
    expect(notes(game(at(12)), at(12))).toEqual([]);
  });

  it('the receipt is full 12 hours after leaving, only when something earns away', () => {
    const s = game(at(9));
    s.volume.businesses[0] = { level: 5, progress: 0, till: 0 };
    s.volume.managers[0] = { name: 'Rosa M.', trait: 'perfectionist', face: 1 };
    expect(notes(s, at(9))).toEqual([{ kind: 'receipt', at: at(21) }]);
    const bonds = game(at(9));
    bonds.volume.bonds = 1e6;
    expect(notes(bonds, at(9)).map((n) => n.kind)).toEqual(['receipt']);
  });

  it('the sponsorship ends, if at least ten minutes away', () => {
    const s = game(at(10));
    s.sponsors.sponsoredUntil = at(13);
    expect(notes(s, at(10))).toEqual([{ kind: 'sponsorship', at: at(13) }]);
    s.sponsors.sponsoredUntil = at(10, 9);
    expect(notes(s, at(10))).toEqual([]);
  });

  it('tills full when the slowest unmanaged till fills, if at least five minutes away', () => {
    const s = game(at(10));
    // The hotel's cycle is 96 s: too soon. The cinema's (384 s) and the shipyard's are longer.
    s.volume.businesses[5] = { level: 1, progress: 0, till: 0 };
    expect(notes(s, at(10))).toEqual([]);
    s.volume.businesses[7] = { level: 1, progress: 0, till: 0 };
    expect(notes(s, at(10))).toEqual([{ kind: 'tills', at: at(10) + 1536_000 }]);
  });

  it('quiet hours move a note to 8:00', () => {
    expect(outOfQuiet(at(23, 30))).toBe(at(8, 0, 1));
    expect(outOfQuiet(at(3))).toBe(at(8));
    expect(outOfQuiet(at(8))).toBe(at(8));
    expect(outOfQuiet(at(21, 59))).toBe(at(21, 59));
    expect(outOfQuiet(at(22))).toBe(at(8, 0, 1));
    expect(outOfQuiet(at(7, 59))).toBe(at(8));
  });

  it('notes are an hour apart, then out of the quiet hours', () => {
    const s = game(at(20));
    s.volume.managers[0] = { name: 'Rosa M.', trait: 'perfectionist', face: 1 };
    s.volume.businesses[0] = { level: 5, progress: 0, till: 0 };
    s.volume.businesses[7] = { level: 1, progress: 0, till: 0 };
    s.sponsors.sponsoredUntil = at(20, 20);
    // Sponsorship 20:20; tills 20:25:36 → 21:20; receipt 8:00 (12 h after 20:00) → stays 8:00.
    expect(notes(s, at(20))).toEqual([
      { kind: 'sponsorship', at: at(20, 20) },
      { kind: 'tills', at: at(21, 20) },
      { kind: 'receipt', at: at(8, 0, 1) },
    ]);
    // A chain pushed into the night lands at 8:00.
    s.sponsors.sponsoredUntil = at(21, 30);
    const chain = notes(s, at(20));
    // Tills 20:25:36; the sponsorship 21:30 is over an hour after; the receipt at 8:00.
    expect(chain.map((n) => n.at)).toEqual([at(20) + 1536_000, at(21, 30), at(8, 0, 1)]);
  });

  it('a note pushed into the quiet hours by the spacing lands at 8:00', () => {
    const s = game(at(21, 20));
    s.volume.businesses[7] = { level: 1, progress: 0, till: 0 };
    s.sponsors.sponsoredUntil = at(21, 31);
    // Sponsorship 21:31; tills 21:45:36 → 22:31, in the quiet hours → 8:00.
    expect(notes(s, at(21, 20))).toEqual([
      { kind: 'sponsorship', at: at(21, 31) },
      { kind: 'tills', at: at(8, 0, 1) },
    ]);
  });

  it('permission is asked at a hire or at a launch with a manager, once', () => {
    const s = game(at(10));
    expect(shouldAsk(s)).toBe(false);
    s.volume.managers[0] = { name: 'Rosa M.', trait: 'perfectionist', face: 1 };
    expect(shouldAsk(s)).toBe(true);
    s.settings.notes = 'off';
    expect(shouldAsk(s)).toBe(false);
  });

  it('an old save, from before the notes, has not been asked', () => {
    const old = JSON.parse(JSON.stringify(game(at(10)))) as { settings: Record<string, unknown> };
    delete old.settings.notes;
    expect(migrate(old, at(10))?.settings.notes).toBe('unasked');
  });

  it('the setting follows what iOS allows now', () => {
    expect(reconcile('on', 'denied')).toBe('denied');
    expect(reconcile('on', 'prompt')).toBe('unasked');
    expect(reconcile('denied', 'granted')).toBe('on');
    expect(reconcile('on', 'granted')).toBe('on');
    expect(reconcile('off', 'granted')).toBe('off');
    expect(reconcile('unasked', 'denied')).toBe('unasked');
  });
});
