import { BUSINESSES } from '../data/businesses.ts';
import type { Trait } from '../data/people.ts';
import type { Lang } from '../format/format.ts';

/** The save format's version; `migrate` brings older saves up to it. */
export const SAVE_VERSION = 1;

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
}

export interface ShelfEntry {
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
}

export interface Settings {
  /** Null follows the device. */
  lang: Lang | null;
  buyMode: BuyMode;
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
}

export function newVolume(number: number, now: number, startCash = 0): Volume {
  return {
    number,
    seed: `vol:${number}:${now}`,
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
    },
    settings: { lang: null, buyMode: 1 },
    away: null,
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
  // Version 1 is the first: fill any field a development build may have missed.
  const fresh = newGame(now);
  const volume = { ...newVolume(save.volume.number, now), ...save.volume };
  return {
    ...fresh,
    ...save,
    version: SAVE_VERSION,
    volume,
    meta: { ...fresh.meta, ...save.meta },
    settings: { ...fresh.settings, ...save.settings },
  };
}
