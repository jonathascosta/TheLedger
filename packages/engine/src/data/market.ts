/**
 * Instruments that trade on the market tick (PRODUCT.md, Investments): stocks, commodities and
 * coins. Prices walk around a fair value that drifts; news shocks move both.
 */
export type InstrumentKind = 'stock' | 'commodity' | 'coin';

export interface InstrumentDef {
  readonly id: string;
  readonly kind: InstrumentKind;
  /** The app's strings name it (`instrument.<id>`); stocks also show the ticker. */
  readonly ticker: string;
  readonly sector: string;
  readonly start: number;
  /**
   * Fair value's drift per tick (log): about 0.5% to 1.5% an hour for stocks, flat for coins.
   * With the mean reversion, a price wanders about vol / sqrt(0.02) around its fair value, so a
   * short hold can lose.
   */
  readonly drift: number;
  /** Volatility per tick (log). */
  readonly vol: number;
  /** Dividend per second, as a fraction of the holding's value. */
  readonly dividend: number;
}

export const INSTRUMENTS: readonly InstrumentDef[] = [
  {
    id: 'nmtc',
    kind: 'stock',
    ticker: 'NMTC',
    sector: 'telecom',
    start: 120,
    drift: 1.5e-5,
    vol: 0.012,
    dividend: 1e-6,
  },
  {
    id: 'irnb',
    kind: 'stock',
    ticker: 'IRNB',
    sector: 'mining',
    start: 45,
    drift: 1e-5,
    vol: 0.015,
    dividend: 2e-6,
  },
  {
    id: 'gldc',
    kind: 'stock',
    ticker: 'GLDC',
    sector: 'food',
    start: 80,
    drift: 1e-5,
    vol: 0.008,
    dividend: 2e-6,
  },
  {
    id: 'nmbs',
    kind: 'stock',
    ticker: 'NMBS',
    sector: 'tech',
    start: 210,
    drift: 2e-5,
    vol: 0.02,
    dividend: 0,
  },
  {
    id: 'skyl',
    kind: 'stock',
    ticker: 'SKYL',
    sector: 'airline',
    start: 60,
    drift: 8e-6,
    vol: 0.016,
    dividend: 1e-6,
  },
  {
    id: 'patl',
    kind: 'stock',
    ticker: 'PATL',
    sector: 'oil',
    start: 95,
    drift: 1e-5,
    vol: 0.012,
    dividend: 3e-6,
  },
  {
    id: 'gold',
    kind: 'commodity',
    ticker: 'GOLD',
    sector: 'gold',
    start: 1800,
    drift: 6e-6,
    vol: 0.005,
    dividend: 0,
  },
  {
    id: 'oil',
    kind: 'commodity',
    ticker: 'OIL',
    sector: 'oil',
    start: 75,
    drift: 5e-6,
    vol: 0.014,
    dividend: 0,
  },
  {
    id: 'coffee',
    kind: 'commodity',
    ticker: 'COFFEE',
    sector: 'food',
    start: 2.1,
    drift: 5e-6,
    vol: 0.01,
    dividend: 0,
  },
  {
    id: 'pny',
    kind: 'coin',
    ticker: 'PNY',
    sector: 'crypto',
    start: 0.8,
    drift: 0,
    vol: 0.04,
    dividend: 0,
  },
  {
    id: 'hsh',
    kind: 'coin',
    ticker: 'HSH',
    sector: 'crypto',
    start: 140,
    drift: 0,
    vol: 0.035,
    dividend: 0,
  },
  {
    id: 'sdt',
    kind: 'coin',
    ticker: 'SDT',
    sector: 'crypto',
    start: 12_000,
    drift: 0,
    vol: 0.03,
    dividend: 0,
  },
];

export const INSTRUMENT_BY_ID: ReadonlyMap<string, InstrumentDef> = new Map(
  INSTRUMENTS.map((i) => [i.id, i]),
);

/** Seconds of game time between market ticks. */
export const MARKET_TICK_SECONDS = 5;
/** Price history kept per instrument, in ticks. */
export const PRICE_HISTORY = 120;
/** How fast a price returns to its fair value, per tick. */
export const MEAN_REVERSION = 0.01;

/** Asset classes and the peak net worth that opens each (PRODUCT.md, Investments). */
export type AssetClass =
  | 'businesses'
  | 'stocks'
  | 'bonds'
  | 'realEstate'
  | 'commodities'
  | 'crypto'
  | 'startups'
  | 'art'
  | 'energy'
  | 'clubs';

export const CLASS_UNLOCKS: readonly { readonly id: AssetClass; readonly at: number }[] = [
  { id: 'businesses', at: 0 },
  { id: 'stocks', at: 1e5 },
  { id: 'bonds', at: 1e6 },
  { id: 'realEstate', at: 1e7 },
  { id: 'commodities', at: 5e7 },
  { id: 'crypto', at: 2.5e8 },
  { id: 'startups', at: 1e9 },
  { id: 'art', at: 1e10 },
  { id: 'energy', at: 1e11 },
  { id: 'clubs', at: 1e12 },
];
