import { UPGRADES } from '@ledger/engine';
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
});
