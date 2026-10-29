import { newGame, type GameState } from '@ledger/engine';
import { describe, expect, it } from 'vitest';
import { buyGold, confirmAtLaunch, GOLD_PRODUCT, restoreGold, type GoldStore } from './gold.ts';
import { AppStoreGold, type PurchasesApi } from './native.ts';

/** A store the test drives: what it answers, or that it does not answer. */
function fakeStore(answer: { owned?: boolean | null; buy?: 'bought' | 'cancelled' | 'failed' }) {
  const store: GoldStore = {
    price: () => Promise.resolve('$4.99'),
    buy: () => Promise.resolve(answer.buy ?? 'bought'),
    owned: () =>
      answer.owned === null
        ? Promise.reject(new Error('offline'))
        : Promise.resolve(answer.owned ?? false),
    restore: () => Promise.resolve(answer.owned ?? false),
  };
  return store;
}

function game(gold: boolean): { state: GameState; act: (fn: (s: GameState) => void) => void } {
  const state = newGame(1_000);
  state.meta.gold = gold;
  return { state, act: (fn) => fn(state) };
}

describe('the Gold Edition', () => {
  it('buying sets the flag; a cancelled or failed purchase does not', async () => {
    for (const [answer, gold] of [
      ['bought', true],
      ['cancelled', false],
      ['failed', false],
    ] as const) {
      const g = game(false);
      expect(await buyGold(fakeStore({ buy: answer }), g.act)).toBe(answer);
      expect(g.state.meta.gold).toBe(gold);
    }
  });

  it('restore brings it back when the store has it', async () => {
    const g = game(false);
    expect(await restoreGold(fakeStore({ owned: true }), g.act)).toBe(true);
    expect(g.state.meta.gold).toBe(true);
  });

  it('a launch offline keeps the flag; a definite no (a refund) removes it', async () => {
    const offline = game(true);
    await confirmAtLaunch(fakeStore({ owned: null }), offline.act);
    expect(offline.state.meta.gold).toBe(true);
    const refunded = game(true);
    await confirmAtLaunch(fakeStore({ owned: false }), refunded.act);
    expect(refunded.state.meta.gold).toBe(false);
    const confirmed = game(false);
    await confirmAtLaunch(fakeStore({ owned: true }), confirmed.act);
    expect(confirmed.state.meta.gold).toBe(true);
  });
});

describe('the App Store adapter', () => {
  function api(overrides: Partial<PurchasesApi>): PurchasesApi {
    return {
      getProduct: () => Promise.resolve({ product: { priceString: 'R$ 24,90' } }),
      purchaseProduct: () => Promise.resolve({ productIdentifier: GOLD_PRODUCT }),
      getPurchases: () => Promise.resolve({ purchases: [] }),
      restorePurchases: () => Promise.resolve(),
      ...overrides,
    };
  }

  it('reads ownership from the current entitlements, refunds excluded', async () => {
    const owned = new AppStoreGold(
      api({
        getPurchases: () => Promise.resolve({ purchases: [{ productIdentifier: GOLD_PRODUCT }] }),
      }),
    );
    expect(await owned.owned()).toBe(true);
    const revoked = new AppStoreGold(
      api({
        getPurchases: () =>
          Promise.resolve({
            purchases: [{ productIdentifier: GOLD_PRODUCT, revocationDate: '2026-10-01' }],
          }),
      }),
    );
    expect(await revoked.owned()).toBe(false);
    const offline = new AppStoreGold(api({ getPurchases: () => Promise.reject(new Error('net')) }));
    expect(await offline.owned()).toBeNull();
  });

  it('tells a cancelled purchase from a failed one', async () => {
    const cancel = new AppStoreGold(
      api({ purchaseProduct: () => Promise.reject(new Error('User cancelled')) }),
    );
    expect(await cancel.buy()).toBe('cancelled');
    const fail = new AppStoreGold(api({ purchaseProduct: () => Promise.reject(new Error('x')) }));
    expect(await fail.buy()).toBe('failed');
    expect(await new AppStoreGold(api({})).buy()).toBe('bought');
    expect(await new AppStoreGold(api({})).price()).toBe('R$ 24,90');
  });
});
