/** Bonds, real estate, startups, art and energy (PRODUCT.md, Investments). */

/** Bond interest per second (1% an hour). */
export const BOND_RATE = 0.01 / 3600;
/** Bonds hold at most this many seconds of business income. */
export const BOND_CAP_SECONDS = 3 * 3600;

export interface PropertyDef {
  readonly id: string;
  readonly district: 'oldTown' | 'hilltop' | 'harbour' | 'riverLane';
  readonly price: number;
  /** Rent per second. */
  readonly rent: number;
}

const PROPERTY_IDS: readonly (readonly [string, PropertyDef['district']])[] = [
  ['cornerFlat', 'oldTown'],
  ['bluePlaza', 'riverLane'],
  ['oldMill', 'oldTown'],
  ['hilltopVilla', 'hilltop'],
  ['harbourLoft', 'harbour'],
  ['skyTower', 'hilltop'],
  ['grandArcade', 'riverLane'],
  ['lighthouse', 'harbour'],
];

export const PROPERTIES: readonly PropertyDef[] = PROPERTY_IDS.map(([id, district], i) => {
  const price = 1e7 * 3 ** i;
  return { id, district, price, rent: price * 0.002 };
});

/** Selling a property returns this share of its price. */
export const PROPERTY_SALE = 0.9;

export interface ParkDef {
  readonly id: string;
  readonly price: number;
  readonly income: number;
}

export const PARKS: readonly ParkDef[] = ['solarFarm', 'windFarm', 'hydroDam', 'offshoreWind'].map(
  (id, i) => {
    const price = 1e11 * 5 ** i;
    return { id, price, income: price * 0.0015 };
  },
);

/** Startup outcomes: probability and multiple of the stake. */
export const STARTUP_OUTCOMES: readonly { readonly p: number; readonly multiple: number }[] = [
  { p: 0.55, multiple: 0 },
  { p: 0.3, multiple: 1.5 },
  { p: 0.12, multiple: 4 },
  { p: 0.025, multiple: 10 },
  { p: 0.005, multiple: 100 },
];
/** A pitch asks this share of net worth. */
export const STARTUP_ASK = 0.02;
export const STARTUP_SECTORS: readonly string[] = [
  'foodDelivery',
  'robotics',
  'fintech',
  'biotech',
  'games',
  'spaceTravel',
  'greenEnergy',
  'petCare',
];
export const STARTUP_NAME_A: readonly string[] = [
  'Quick',
  'Blue',
  'Hyper',
  'Tiny',
  'Bright',
  'Neo',
  'Happy',
  'Orbit',
];
export const STARTUP_NAME_B: readonly string[] = [
  'ly',
  'Hub',
  'Labs',
  'Box',
  'io',
  'Nest',
  'Works',
  'Loop',
];

export const ART_KINDS: readonly string[] = [
  'composition',
  'portrait',
  'landscape',
  'stillLife',
  'seascape',
];
export const ART_ARTISTS: readonly string[] = [
  'E. Moravec',
  'L. Abreu',
  'C. Vantongerloo',
  'M. Ishikawa',
  'R. Delacroix-Hart',
  'T. Okafor',
  'A. Lindqvist',
  'P. Saldanha',
];
/** Seconds between auction lots. */
export const ART_LOT_SECONDS = 120;
