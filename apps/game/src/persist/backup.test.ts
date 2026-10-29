import { createHmac, createHash } from 'node:crypto';
import { newGame, SAVE_VERSION, tick, type GameState } from '@ledger/engine';
import { describe, expect, it } from 'vitest';
import { decodeBackup, encodeBackup } from './backup.ts';
import { hmacSha256, sha256 } from './sha256.ts';

const T0 = 1_750_000_000_000;
const hex = (bytes: Uint8Array): string => Buffer.from(bytes).toString('hex');

/** A game some minutes in, with a manager, holdings and histories. */
function played(): GameState {
  const state = newGame(T0);
  const v = state.volume;
  v.cash = 12_345.67;
  v.earned = 50_000;
  v.businesses[0] = { level: 25, progress: 0.4, till: 0 };
  v.managers[0] = { name: 'Rosa Müller', trait: 'perfectionist', face: 7 };
  v.upgrades.push('cafe.1');
  for (let s = 1; s <= 600; s++) tick(state, T0 + s * 1000);
  v.holdings.nmtc = { units: 3, cost: 300 };
  state.meta.goodwill = 4;
  state.meta.achievements.firstBusiness = T0 + 1000;
  return state;
}

describe('sha256 and hmac', () => {
  it('match Node for every length around the block edges', () => {
    for (const length of [0, 1, 55, 56, 63, 64, 65, 119, 120, 1000]) {
      const data = new Uint8Array(length).map((_, i) => (i * 31 + 7) & 255);
      expect(hex(sha256(data))).toBe(createHash('sha256').update(data).digest('hex'));
      for (const keyLength of [3, 64, 100]) {
        const key = new Uint8Array(keyLength).map((_, i) => i);
        expect(hex(hmacSha256(key, data))).toBe(
          createHmac('sha256', key).update(data).digest('hex'),
        );
      }
    }
  });

  it('gives the RFC 4231 test vector', () => {
    const key = new Uint8Array(20).fill(0x0b);
    expect(hex(hmacSha256(key, new TextEncoder().encode('Hi There')))).toBe(
      'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7',
    );
  });
});

describe('the backup code', () => {
  it('round-trips the game, without the histories', () => {
    const state = played();
    const code = encodeBackup(state, T0 + 700_000);
    expect(code).toMatch(/^LEDGER1\.[\w-]+\.[\w-]+$/);
    expect(code).not.toContain('Rosa');
    const decoded = decodeBackup(code, T0 + 800_000);
    if (!decoded.ok) throw new Error(decoded.error);
    expect(decoded.madeAt).toBe(T0 + 700_000);
    const { history: _h, market: m1, ...volume } = state.volume;
    const { history: _h2, market: m2, ...restored } = decoded.state.volume;
    expect(restored).toEqual(volume);
    expect({ ...m2, history: undefined }).toEqual({ ...m1, history: undefined });
    expect(decoded.state.meta).toEqual(state.meta);
    expect(decoded.state.settings).toEqual(state.settings);
    expect(decoded.state.lastTick).toBe(state.lastTick);
    // The histories start again from now.
    for (const [id, prices] of Object.entries(decoded.state.volume.market.history))
      expect(prices).toEqual([m1.prices[id]]);
    expect(decoded.state.volume.history).toHaveLength(1);
    expect(decoded.state.volume.history[0]).toBeGreaterThan(0);
  });

  it('survives spaces and line breaks', () => {
    const code = encodeBackup(played(), T0);
    const wrapped = ` ${code.slice(0, 40)}\n${code.slice(40, 90)} \r\n${code.slice(90)}\n`;
    expect(decodeBackup(wrapped, T0).ok).toBe(true);
  });

  it('refuses a changed character', () => {
    const code = encodeBackup(played(), T0);
    for (const at of [8, 20, Math.floor(code.length / 2), code.length - 5]) {
      const char = code[at] === 'A' ? 'B' : 'A';
      const changed = code.slice(0, at) + char + code.slice(at + 1);
      expect(decodeBackup(changed, T0)).toEqual({ ok: false, error: 'signature' });
    }
  });

  it('refuses a cut code', () => {
    const code = encodeBackup(played(), T0);
    for (const length of [10, 100, code.length - 50, code.length - 1]) {
      const decoded = decodeBackup(code.slice(0, length), T0);
      expect(decoded.ok).toBe(false);
    }
    expect(decodeBackup(code.slice(0, code.length - 1), T0)).toEqual({
      ok: false,
      error: 'signature',
    });
  });

  it('refuses what is not a code', () => {
    expect(decodeBackup('', T0)).toEqual({ ok: false, error: 'format' });
    expect(decodeBackup('{"version":2}', T0)).toEqual({ ok: false, error: 'format' });
    expect(decodeBackup('LEDGER0.abc.def', T0)).toEqual({ ok: false, error: 'format' });
  });

  it('refuses a code from a newer version of the game', () => {
    const newer = played();
    newer.version = SAVE_VERSION + 1;
    expect(decodeBackup(encodeBackup(newer, T0), T0)).toEqual({ ok: false, error: 'version' });
    expect(decodeBackup('LEDGER2.abc.def', T0)).toEqual({ ok: false, error: 'version' });
  });

  it('loads a code made by an older version, through migrate', () => {
    const old = played();
    old.version = 1;
    old.volume.upgrades = ['pizza.1'];
    const decoded = decodeBackup(encodeBackup(old, T0), T0);
    if (!decoded.ok) throw new Error(decoded.error);
    expect(decoded.state.version).toBe(SAVE_VERSION);
    expect(decoded.state.volume.upgrades).toEqual(['print.1']);
  });

  it('leaves the Gold Edition out', () => {
    const state = played();
    (state.meta as { gold?: boolean }).gold = true;
    const decoded = decodeBackup(encodeBackup(state, T0), T0);
    if (!decoded.ok) throw new Error(decoded.error);
    expect('gold' in decoded.state.meta).toBe(false);
    // Encoding left the game itself untouched.
    expect((state.meta as { gold?: boolean }).gold).toBe(true);
    expect(state.volume.history.length).toBeGreaterThan(1);
  });
});
