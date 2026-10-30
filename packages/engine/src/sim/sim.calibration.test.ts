import { beforeAll, describe, expect, it } from 'vitest';
import { BANDS, outOfBands } from './bands.ts';
import { simulate, type SimResult } from './sim.ts';

const HORIZON = BANDS.close[1];

describe('the balance bands (PRODUCT.md, Balance)', () => {
  let steady: SimResult;
  let fastTapper: SimResult;
  beforeAll(() => {
    steady = simulate({ seconds: HORIZON, tapsPerSecond: 1 });
    fastTapper = simulate({ seconds: HORIZON, tapsPerSecond: 4 });
  });

  it('a steady player keeps the pace', () => {
    expect(outOfBands(steady, fastTapper)).toEqual([]);
  });

  it('the simulation replays exactly', () => {
    const again = simulate({ seconds: 3600, tapsPerSecond: 1 });
    const first = simulate({ seconds: 3600, tapsPerSecond: 1 });
    expect(again.state.volume.cash).toBe(first.state.volume.cash);
    expect(again.reached).toEqual(first.reached);
  });

  it('the small businesses need the special orders', () => {
    const without = simulate({ seconds: HORIZON, tapsPerSecond: 1, noOrders: true });
    expect(outOfBands(without, fastTapper).some((line) => line.startsWith('small'))).toBe(true);
  });

  it('a pace too fast fails the bands', () => {
    // A game that starts with a billion in cash reaches the money marks far too soon.
    const broken = simulate({ seconds: 3600, tapsPerSecond: 1, startCash: 1e9 });
    const out = outOfBands(broken, fastTapper);
    expect(out.some((line) => line.startsWith('$1 million'))).toBe(true);
    expect(out.some((line) => line.startsWith('$1 billion'))).toBe(true);
  });
});
