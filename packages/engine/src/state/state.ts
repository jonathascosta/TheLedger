import { BUSINESSES } from '../data/businesses.ts';
import { INSTRUMENTS } from '../data/market.ts';
import { goldenGap, type CountedOffer } from '../data/sponsors.ts';
import type { Trait } from '../data/people.ts';
import type { Lang } from '../format/format.ts';

/** The save format's version; `migrate` brings older saves up to it. */
export const SAVE_VERSION = 2;

/** Version 2 renamed five businesses; their upgrades' ids follow the new names. */
const RENAMED_BUSINESSES: Readonly<Record<string, string>> = {
  pizza: 'print',
  cinema: 'insurance',
  club: 'shipyard',
  bank: 'railway',
  refinery: 'airline',
};

function renameUpgrade(id: string): string {
  const [business = '', rest] = id.split('.');
  const renamed = RENAMED_BUSINESSES[business];
  return renamed !== undefined && rest !== undefined ? `${renamed}.${rest}` : id;
}

export type BuyMode = 1 | 10 | 100 | 'max';

export interface BusinessState {
  /** Units owned; 0 means not opened. */
  level: number;
  /** Seconds into the current cycle. */
  progress: number;
  /** A finished cycle's revenue waiting to be collected (no manager). */
  till: number;
}

export interface Manager {
  name: string;
  trait: Trait;
  /** Seed of the pencil portrait's parts. */
  face: number;
  /** A headhunter's star: the trait counts twice. */
  star?: boolean;
}

export interface DeskState {
  /** Stamps on the current invoice (0–9). */
  stamps: number;
  /** Number of the current invoice. */
  invoice: number;
  /** Tally marks of the current combo. */
  combo: number;
  /** Game time (ms) of the last stamp. */
  lastStampAt: number;
  /** Value of the last stamp, for the floating "+$". */
  lastValue: number;
}

/** What the night shift earned while the player was away. */
export interface AwayLine {
  kind: 'business' | 'rent' | 'bonds' | 'energy';
  /** Business index, property or park id; empty for bonds. */
  id: string;
  amount: number;
}

export interface AwayReceipt {
  seconds: number;
  rate: number;
  lines: AwayLine[];
  total: number;
}

export interface Holding {
  units: number;
  /** Money paid for the units held (the cost basis). */
  cost: number;
}

export interface MarketState {
  /** Market ticks so far in this volume. */
  tick: number;
  /** Game time (ms) of the next market tick. */
  nextAt: number;
  prices: Record<string, number>;
  /** Fair values the prices return to. */
  fair: Record<string, number>;
  /** The last ticks' prices, oldest first. */
  history: Record<string, number[]>;
}

export interface StartupPitch {
  index: number;
  ask: number;
  /** Set when the player invests: when it matures (game ms). */
  maturesAt: number | null;
}

export interface StartupResult {
  index: number;
  stake: number;
  multiple: number;
}

export interface ArtPiece {
  /** Lot number (seeds its title and artist). */
  lot: number;
  paid: number;
  value: number;
}

export interface ArtLot {
  lot: number;
  price: number;
  /** Game time (ms) the lot closes and the next one comes up. */
  closesAt: number;
}

export interface PaperResult {
  choice: 'bold' | 'careful' | 'hold';
  /** Cash won (positive) or lost (negative). */
  delta: number;
}

export interface PaperState {
  /** Number of the current edition (0 before the first). */
  edition: number;
  /** Event id of the current edition. */
  event: string | null;
  /** Game time (ms) of the next edition. */
  nextAt: number;
  /** The answer to the current edition, if any. */
  answer: PaperResult | null;
  /** Editions not yet read (the Gazette's badge). */
  unread: boolean;
}

/** The golden invoice's schedule (PRODUCT.md, The front desk). */
export interface GoldenState {
  /** Golden invoices so far in this volume (seeds the next gap). */
  count: number;
  /** Game time (ms) the next one arrives. */
  nextAt: number;
  /** While one is on the desk: the game time (ms) it leaves. */
  until: number | null;
  /** Taken by a tap and not yet paid (a sponsor's ad may be playing). */
  taken: boolean;
}

/** The sponsors' timers and today's counts; kept when a volume closes. */
export interface SponsorState {
  /** The device's date the counts belong to (`YYYY-MM-DD`). */
  day: string;
  counts: Partial<Record<CountedOffer, number>>;
  /** Game time (ms) overtime ends. */
  overtimeUntil: number;
  /** Game time (ms) the banked sponsorship ends. */
  sponsoredUntil: number;
}

/** Everything that a closed volume resets. */
export interface Volume {
  number: number;
  seed: string;
  startedAt: number;
  cash: number;
  /** Money earned in this volume (counts toward goodwill). */
  earned: number;
  peakNetWorth: number;
  businesses: BusinessState[];
  managers: (Manager | null)[];
  upgrades: string[];
  desk: DeskState;
  /** Net worth sampled every 10 s, the last 180 samples (the ledger's ink chart). */
  history: number[];
  /** Game time (ms) of the last history sample. */
  lastSampleAt: number;
  market: MarketState;
  holdings: Record<string, Holding>;
  bonds: number;
  properties: string[];
  parks: string[];
  startup: StartupPitch | null;
  startupResults: StartupResult[];
  art: ArtPiece[];
  artLot: ArtLot | null;
  paper: PaperState;
  golden: GoldenState;
  /** Headhunts so far in this volume (seeds the candidates). */
  headhunts: number;
  /** The business whose candidate is a star, until hired or the next headhunt. */
  star: number | null;
}

export interface ShelfEntry {
  /** The era the volume was closed in (1 for saves from before the dynasty). */
  era?: number;
  number: number;
  peakNetWorth: number;
  goodwill: number;
  closedAt: number;
}

/** Everything that survives closing a volume. */
export interface Meta {
  goodwill: number;
  goodwillClaimed: number;
  lifetimeEarnings: number;
  partners: string[];
  /** Achievement id → game time it was earned. */
  achievements: Record<string, number>;
  shelf: ShelfEntry[];
  totalStamps: number;
  bestCombo: number;
  editionsAnswered: number;
  /** The Gold Edition (PRODUCT.md): set by the app from the store. */
  gold: boolean;
  /** The dynasty (PRODUCT.md): the era (1 for the founder) and the legacy points earned. */
  era: number;
  legacy: number;
}

export interface Settings {
  /** Null follows the device. */
  lang: Lang | null;
  buyMode: BuyMode;
  /**
   * Notes from the night shift (PRODUCT.md, Away from the game): not asked yet, on, off, or
   * declined in iOS (the switch then points to the iPhone's Settings).
   */
  notes: 'unasked' | 'on' | 'off' | 'denied';
}

export interface GameState {
  version: number;
  createdAt: number;
  /** Game time (ms) of the last tick. */
  lastTick: number;
  volume: Volume;
  meta: Meta;
  settings: Settings;
  /** An absence receipt waiting to be collected. */
  away: AwayReceipt | null;
  /** Achievements earned but not yet announced. */
  fresh: string[];
  sponsors: SponsorState;
}

export function newVolume(number: number, now: number, startCash = 0): Volume {
  const seed = `vol:${number}:${now}`;
  return {
    number,
    seed,
    startedAt: now,
    cash: startCash,
    earned: 0,
    peakNetWorth: startCash,
    businesses: BUSINESSES.map(() => ({ level: 0, progress: 0, till: 0 })),
    managers: BUSINESSES.map(() => null),
    upgrades: [],
    desk: { stamps: 0, invoice: 1, combo: 0, lastStampAt: 0, lastValue: 0 },
    history: [startCash],
    lastSampleAt: now,
    market: {
      tick: 0,
      nextAt: now,
      prices: Object.fromEntries(INSTRUMENTS.map((i) => [i.id, i.start])),
      fair: Object.fromEntries(INSTRUMENTS.map((i) => [i.id, i.start])),
      history: Object.fromEntries(INSTRUMENTS.map((i) => [i.id, [i.start]])),
    },
    holdings: {},
    bonds: 0,
    properties: [],
    parks: [],
    startup: null,
    startupResults: [],
    art: [],
    artLot: null,
    paper: { edition: 0, event: null, nextAt: now + 60_000, answer: null, unread: false },
    golden: { count: 0, nextAt: now + goldenGap(seed, 0), until: null, taken: false },
    headhunts: 0,
    star: null,
  };
}

export function newGame(now: number): GameState {
  return {
    version: SAVE_VERSION,
    createdAt: now,
    lastTick: now,
    volume: newVolume(1, now),
    meta: {
      goodwill: 0,
      goodwillClaimed: 0,
      lifetimeEarnings: 0,
      partners: [],
      achievements: {},
      shelf: [],
      totalStamps: 0,
      bestCombo: 0,
      editionsAnswered: 0,
      gold: false,
      era: 1,
      legacy: 0,
    },
    settings: { lang: null, buyMode: 1, notes: 'unasked' },
    away: null,
    fresh: [],
    sponsors: { day: '', counts: {}, overtimeUntil: 0, sponsoredUntil: 0 },
  };
}

/**
 * Brings a save up to the current version. Unknown or broken input gives null, and the app
 * starts a new game.
 */
export function migrate(raw: unknown, now: number): GameState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const save = raw as Partial<GameState>;
  if (typeof save.version !== 'number' || save.version > SAVE_VERSION) return null;
  if (!save.volume || !save.meta) return null;
  // Fill any field a development build may have missed.
  const fresh = newGame(now);
  const volume = { ...newVolume(save.volume.number, now), ...save.volume };
  // Nested records are filled field by field, so a partial one keeps working.
  const seed = typeof volume.seed === 'string' ? volume.seed : `vol:${volume.number}:${now}`;
  const golden = save.volume.golden as Partial<GoldenState> | undefined;
  volume.golden = {
    count: 0,
    nextAt: now + goldenGap(seed, golden?.count ?? 0),
    until: null,
    taken: false,
    ...golden,
  };
  if (save.version < 2 && Array.isArray(volume.upgrades)) {
    volume.upgrades = (volume.upgrades as unknown[])
      .filter((id): id is string => typeof id === 'string')
      .map(renameUpgrade);
  }
  return {
    ...fresh,
    ...save,
    version: SAVE_VERSION,
    volume,
    meta: { ...fresh.meta, ...save.meta },
    sponsors: {
      ...fresh.sponsors,
      ...save.sponsors,
      counts: { ...save.sponsors?.counts },
    },
    settings: { ...fresh.settings, ...save.settings },
  };
}
