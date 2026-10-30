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
  /** A special order's unlock level of its business; other upgrades need the business open. */
  readonly level?: number;
}

const BUSINESS_UPGRADES_EACH = 8;

/** The special orders' unlock levels (PRODUCT.md, Upgrades): the café's, then everyone else's. */
export const ORDER_LEVELS: readonly (readonly number[])[] = [
  [300, 500, 800],
  [150, 250, 400],
];

/**
 * Each business's three order factors, the airline none: after its last order a business's next
 * level pays back about as fast as the airline's at the same spend and the same upgrades.
 */
export const ORDER_FACTORS: readonly (readonly number[])[] = [
  [8, 80, 80],
  [10, 90, 90],
  [7, 50, 50],
  [5, 30, 30],
  [3, 11, 11],
  [2.6, 7, 7],
  [2, 4.5, 4.5],
  [1.7, 3, 3],
  [1.4, 2, 2],
];

/** An order costs this many times the price of its business's unlock level. */
export const ORDER_PRICE = 5;

/** The unlock levels of a business's special orders. */
export function orderLevels(business: number): readonly number[] {
  return ORDER_LEVELS[business === 0 ? 0 : 1]!;
}

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
  ORDER_FACTORS.forEach((factors, business) => {
    const b = BUSINESSES[business]!;
    orderLevels(business).forEach((level, k) => {
      list.push({
        id: `order.${b.id}.${k}`,
        cost: b.baseCost * b.growth ** level * ORDER_PRICE,
        effect: { kind: 'business', business, factor: factors[k]! },
        level,
      });
    });
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
