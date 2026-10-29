import { newGame, setGold, type GameState } from '@ledger/engine';

/** The Gold Edition's product id in App Store Connect (docs/STORE.md). */
export const GOLD_PRODUCT = 'theledger.gold';

export type BuyOutcome = 'bought' | 'cancelled' | 'pending' | 'failed';

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

/** A new game that keeps this device's Gold Edition (erasing keeps it; docs/PRODUCT.md). */
export function newGameKeepingGold(previous: GameState, now: number): GameState {
  const next = newGame(now);
  next.meta.gold = previous.meta.gold;
  return next;
}

/**
 * Whether a saved game (its text) holds the Gold Edition: then the app starts no ads at launch,
 * so a Gold player is never asked for ad consent or tracking.
 */
export function goldInSave(text: string | null): boolean {
  if (!text) return false;
  try {
    return (JSON.parse(text) as { meta?: { gold?: unknown } } | null)?.meta?.gold === true;
  } catch {
    return false;
  }
}

/** Bumped by every purchase or restore: a launch check that answers later is stale. */
let decided = 0;

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
  const before = decided;
  const owned = await store.owned().catch(() => null);
  // A purchase or a restore meanwhile answered more recently.
  if (decided !== before) return;
  act((s) => applyOwnership(s, owned));
}

/** Buys the Gold Edition; sets the flag only when the store says it was bought. */
export async function buyGold(
  store: GoldStore,
  act: (fn: (s: GameState) => void) => void,
): Promise<BuyOutcome> {
  const outcome = await store.buy().catch((): BuyOutcome => 'failed');
  if (outcome === 'bought') {
    decided++;
    act((s) => setGold(s, true));
  }
  return outcome;
}

/** Restore purchases: the store's answer stands, unless it does not answer. */
export async function restoreGold(
  store: GoldStore,
  act: (fn: (s: GameState) => void) => void,
): Promise<boolean | null> {
  const owned = await store.restore().catch(() => null);
  if (owned !== null) decided++;
  act((s) => applyOwnership(s, owned));
  return owned;
}
