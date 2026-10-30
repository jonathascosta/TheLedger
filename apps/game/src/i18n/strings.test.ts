import { BUSINESSES, UPGRADES } from '@ledger/engine';
import { describe, expect, it } from 'vitest';
import { en } from './en.ts';
import { pt } from './pt.ts';

describe('the strings', () => {
  it('name every upgrade and special order in both languages', () => {
    const missing = UPGRADES.flatMap((u) =>
      [en, pt].filter((table) => !(`upgrade.${u.id}` in table)).map(() => u.id),
    );
    expect(missing).toEqual([]);
  });

  it('have a trend headline for every business in both languages', () => {
    const missing = BUSINESSES.flatMap((b) =>
      [en, pt].filter((table) => !(`trend.${b.id}` in table)).map(() => b.id),
    );
    expect(missing).toEqual([]);
  });
});
