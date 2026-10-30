import { describe, expect, it } from 'vitest';
import { referenceSide } from './InkChart.tsx';

describe('the chart reference', () => {
  it('keeps a price paid a hair off the high or the low in range', () => {
    const inRange = { above: false, below: false };
    for (const value of [110 * (1 + 1e-15), 90 * (1 - 1e-15), 110, 90, 100])
      expect(referenceSide(value, 90, 110)).toEqual(inRange);
    // A partial sale's average, one ulp off.
    const x = 0.1 + 0.2;
    expect(referenceSide((3 * x) / 3, 0.1, x)).toEqual(inRange);
  });

  it('puts a price past the range on its edge', () => {
    expect(referenceSide(111, 90, 110)).toEqual({ above: true, below: false });
    expect(referenceSide(89, 90, 110)).toEqual({ above: false, below: true });
  });
});
