/** The ten businesses of PRODUCT.md, in the order they open. Names live in the app's strings. */
export interface BusinessDef {
  readonly id: string;
  /** Cost of the first level. */
  readonly baseCost: number;
  /** Each level costs this much more than the last. */
  readonly growth: number;
  /** Revenue of one cycle per level, before multipliers. */
  readonly baseRevenue: number;
  /** Seconds per cycle, before milestones. */
  readonly cycle: number;
}

export const BUSINESSES: readonly BusinessDef[] = [
  { id: 'cafe', baseCost: 4, growth: 1.07, baseRevenue: 1, cycle: 1 },
  { id: 'bakery', baseCost: 60, growth: 1.15, baseRevenue: 60, cycle: 3 },
  { id: 'laundry', baseCost: 720, growth: 1.14, baseRevenue: 540, cycle: 6 },
  { id: 'pizza', baseCost: 8_640, growth: 1.13, baseRevenue: 4_320, cycle: 12 },
  { id: 'taxi', baseCost: 103_680, growth: 1.12, baseRevenue: 51_840, cycle: 24 },
  { id: 'hotel', baseCost: 1_244_160, growth: 1.11, baseRevenue: 622_080, cycle: 96 },
  { id: 'cinema', baseCost: 14_929_920, growth: 1.1, baseRevenue: 7_464_960, cycle: 384 },
  { id: 'club', baseCost: 179_159_040, growth: 1.09, baseRevenue: 89_579_520, cycle: 1_536 },
  { id: 'bank', baseCost: 2_149_908_480, growth: 1.08, baseRevenue: 1_074_954_432, cycle: 6_144 },
  {
    id: 'refinery',
    baseCost: 25_798_901_760,
    growth: 1.07,
    baseRevenue: 29_668_737_024,
    cycle: 36_000,
  },
];

/** Levels at which a business's cycle time halves. */
export const MILESTONES: readonly number[] = [
  25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000,
];

/** The shortest cycle; past it, a halving doubles profit instead. */
export const MIN_CYCLE = 0.1;

/** A manager costs this many times the business's base cost. */
export const MANAGER_COST_FACTOR = 250;
