import { BUSINESSES } from './businesses.ts';

/**
 * Upgrades bought with cash, once per volume (PRODUCT.md, Upgrades). Ids are stable: the app's
 * strings name each one (`upgrade.<id>`).
 */
export type UpgradeEffect =
  | { readonly kind: 'business'; readonly business: number; readonly factor: number }
  | { readonly kind: 'all'; readonly factor: number }
  | { readonly kind: 'desk'; readonly factor: number };

export interface UpgradeDef {
  readonly id: string;
  readonly cost: number;
  readonly effect: UpgradeEffect;
}

const BUSINESS_UPGRADES_EACH = 8;

function build(): UpgradeDef[] {
  const list: UpgradeDef[] = [];
  BUSINESSES.forEach((b, business) => {
    for (let k = 0; k < BUSINESS_UPGRADES_EACH; k++) {
      list.push({
        id: `${b.id}.${k}`,
        cost: b.baseCost * 2500 * 40 ** k,
        effect: { kind: 'business', business, factor: 3 },
      });
    }
  });
  for (let k = 0; k < 6; k++) {
    list.push({ id: `all.${k}`, cost: 1e9 * 1000 ** k, effect: { kind: 'all', factor: 3 } });
  }
  for (let k = 0; k < 5; k++) {
    list.push({ id: `desk.${k}`, cost: 100 * 25 ** k, effect: { kind: 'desk', factor: 2 } });
  }
  return list.sort((a, b) => a.cost - b.cost);
}

/** Every upgrade, cheapest first. */
export const UPGRADES: readonly UpgradeDef[] = build();

export const UPGRADE_BY_ID: ReadonlyMap<string, UpgradeDef> = new Map(
  UPGRADES.map((u) => [u.id, u]),
);
