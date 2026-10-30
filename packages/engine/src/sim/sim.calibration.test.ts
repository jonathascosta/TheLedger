import { describe, expect, it } from 'vitest';
import { BANDS, outOfBands } from './bands.ts';
import { simulate } from './sim.ts';

const HORIZON = BANDS.close[1];

describe('the balance bands (PRODUCT.md, Balance)', () => {
  const steady = simulate({ seconds: HORIZON, tapsPerSecond: 1 });
  const fastTapper = simulate({ seconds: HORIZON, tapsPerSecond: 4 });

  it('a steady player keeps the pace', () => {
    expect(outOfBands(steady, fastTapper)).toEqual([]);
  });

  it('the simulation replays exactly', () => {
    const again = simulate({ seconds: 3600, tapsPerSecond: 1 });
    const first = simulate({ seconds: 3600, tapsPerSecond: 1 });
    expect(again.state.volume.cash).toBe(first.state.volume.cash);
    expect(again.reached).toEqual(first.reached);
  });

  it('a broken economy fails the bands', () => {
    // A game that starts with a billion in cash reaches the marks far too soon.
    const broken = simulate({ seconds: 3600, tapsPerSecond: 1, startCash: 1e9 });
    expect(outOfBands(broken, fastTapper)).not.toEqual([]);
  });
});
