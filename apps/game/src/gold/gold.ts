import { setGold, type GameState } from '@ledger/engine';

/** The Gold Edition's product id in App Store Connect (docs/STORE.md). */
export const GOLD_PRODUCT = 'theledger.gold';

export type BuyOutcome = 'bought' | 'cancelled' | 'failed';

/**
 * What the game needs of the store (docs/PRODUCT.md, The Gold Edition). `owned` answers null when
 * the store cannot be reached: the flag in the save then stands.
 */
export interface GoldStore {
  /** The price as the store writes it ("US$ 4.99"), or null when unknown. */
  price(): Promise<string | null>;
  buy(): Promise<BuyOutcome>;
  /** Whether the purchase is owned; null when the store does not answer. */
  owned(): Promise<boolean | null>;
  /** Asks the store to bring back past purchases, then answers like `owned`. */
  restore(): Promise<boolean | null>;
}

/** Applies the store's answer to the save: removed only on a definite no (a refund). */
export function applyOwnership(state: GameState, owned: boolean | null): void {
  if (owned === null) return;
  setGold(state, owned);
}

/** At launch: the store confirms the flag kept in the save. */
export async function confirmAtLaunch(
  store: GoldStore,
  act: (fn: (s: GameState) => void) => void,
): Promise<void> {
  const owned = await store.owned().catch(() => null);
  act((s) => applyOwnership(s, owned));
}

/** Buys the Gold Edition; sets the flag only when the store says it was bought. */
export async function buyGold(
  store: GoldStore,
  act: (fn: (s: GameState) => void) => void,
): Promise<BuyOutcome> {
  const outcome = await store.buy().catch((): BuyOutcome => 'failed');
  if (outcome === 'bought') act((s) => setGold(s, true));
  return outcome;
}

/** Restore purchases: the store's answer stands, unless it does not answer. */
export async function restoreGold(
  store: GoldStore,
  act: (fn: (s: GameState) => void) => void,
): Promise<boolean | null> {
  const owned = await store.restore().catch(() => null);
  act((s) => applyOwnership(s, owned));
  return owned;
}
