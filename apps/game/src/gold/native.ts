import { NativePurchases } from '@capgo/native-purchases';
import { GOLD_PRODUCT, type BuyOutcome, type GoldStore } from './gold.ts';

/** The subset of the plugin (`@capgo/native-purchases`) the store uses. */
export interface PurchasesApi {
  getProduct(options: { productIdentifier: string }): Promise<{ product: { priceString: string } }>;
  purchaseProduct(options: { productIdentifier: string }): Promise<{ productIdentifier: string }>;
  getPurchases(options?: {
    onlyCurrentEntitlements?: boolean;
  }): Promise<{ purchases: readonly { productIdentifier: string; revocationDate?: string }[] }>;
  restorePurchases(): Promise<void>;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** The App Store through StoreKit (iOS only; docs/ARCHITECTURE.md, The Gold Edition). */
export class AppStoreGold implements GoldStore {
  private readonly api: PurchasesApi;

  constructor(api: PurchasesApi = NativePurchases) {
    this.api = api;
  }

  async price(): Promise<string | null> {
    try {
      return (await this.api.getProduct({ productIdentifier: GOLD_PRODUCT })).product.priceString;
    } catch {
      return null;
    }
  }

  async buy(): Promise<BuyOutcome> {
    try {
      const t = await this.api.purchaseProduct({ productIdentifier: GOLD_PRODUCT });
      return t.productIdentifier === GOLD_PRODUCT ? 'bought' : 'failed';
    } catch (error) {
      // The plugin's wordings: "User cancelled", "Transaction pending" (Ask to Buy).
      const text = message(error);
      return /cancel/i.test(text) ? 'cancelled' : /pending/i.test(text) ? 'pending' : 'failed';
    }
  }

  async owned(): Promise<boolean | null> {
    try {
      const { purchases } = await this.api.getPurchases({ onlyCurrentEntitlements: true });
      return purchases.some(
        (p) => p.productIdentifier === GOLD_PRODUCT && p.revocationDate === undefined,
      );
    } catch {
      return null;
    }
  }

  async restore(): Promise<boolean | null> {
    try {
      await this.api.restorePurchases();
    } catch {
      return null;
    }
    return this.owned();
  }
}
