import { ACHIEVEMENTS } from '../data/achievements.ts';
import { INSTRUMENT_BY_ID } from '../data/market.ts';
import { PROPERTIES } from '../data/assets.ts';
import type { GameState } from '../state/state.ts';

function holdsKind(state: GameState, kind: string): boolean {
  return Object.keys(state.volume.holdings).some((id) => INSTRUMENT_BY_ID.get(id)?.kind === kind);
}

/** Achievements that follow from the state; the others are granted by actions. */
const CHECKS: Readonly<Record<string, (s: GameState) => boolean>> = {
  firstBusiness: (s) => s.volume.businesses.some((b) => b.level > 0),
  allBusinesses: (s) => s.volume.businesses.every((b) => b.level > 0),
  level25: (s) => s.volume.businesses.some((b) => b.level >= 25),
  level100: (s) => s.volume.businesses.some((b) => b.level >= 100),
  level500: (s) => s.volume.businesses.some((b) => b.level >= 500),
  firstManager: (s) => s.volume.managers.some((m) => m !== null),
  allManagers: (s) => s.volume.managers.every((m) => m !== null),
  firstUpgrade: (s) => s.volume.upgrades.length > 0,
  upgrades25: (s) => s.volume.upgrades.length >= 25,
  million: (s) => s.volume.peakNetWorth >= 1e6,
  billion: (s) => s.volume.peakNetWorth >= 1e9,
  trillion: (s) => s.volume.peakNetWorth >= 1e12,
  quadrillion: (s) => s.volume.peakNetWorth >= 1e15,
  stamps100: (s) => s.meta.totalStamps >= 100,
  stamps1000: (s) => s.meta.totalStamps >= 1000,
  combo20: (s) => s.meta.bestCombo >= 20,
  firstShare: (s) => holdsKind(s, 'stock'),
  firstBond: (s) => s.volume.bonds > 0,
  firstProperty: (s) => s.volume.properties.length > 0,
  landlord: (s) => s.volume.properties.length >= PROPERTIES.length,
  firstCoin: (s) => holdsKind(s, 'coin'),
  firstStartup: (s) =>
    s.volume.startupResults.some((r) => r.stake > 0) || s.volume.startup?.maturesAt != null,
  firstArt: (s) => s.volume.art.length > 0,
  firstPark: (s) => s.volume.parks.length > 0,
  chairman: (s) => Object.values(s.volume.clubs).some((c) => c.owned),
  collector: (s) =>
    s.volume.businesses.some((b) => b.level > 0) &&
    holdsKind(s, 'stock') &&
    s.volume.bonds > 0 &&
    s.volume.properties.length > 0 &&
    holdsKind(s, 'commodity') &&
    holdsKind(s, 'coin') &&
    s.volume.startup?.maturesAt != null &&
    s.volume.art.length > 0 &&
    s.volume.parks.length > 0,
  reader: (s) => s.meta.editionsAnswered >= 10,
  firstVolume: (s) => s.meta.shelf.length >= 1,
  fiveVolumes: (s) => s.meta.shelf.length >= 5,
  heir: (s) => s.meta.era >= 2,
  firstPartner: (s) => s.meta.partners.length > 0,
  cafeTycoon: (s) => (s.volume.businesses[0]?.level ?? 0) >= 1000,
};

/** Grants an achievement (once); it is queued for the app to announce. */
export function grant(state: GameState, id: string, now: number): boolean {
  if (state.meta.achievements[id] !== undefined) return false;
  if (!ACHIEVEMENTS.some((a) => a.id === id)) return false;
  state.meta.achievements[id] = now;
  state.fresh.push(id);
  return true;
}

/** Checks every state-based achievement; returns the new ones. */
export function checkAchievements(state: GameState, now: number): string[] {
  const earned: string[] = [];
  for (const [id, check] of Object.entries(CHECKS)) {
    if (state.meta.achievements[id] === undefined && check(state) && grant(state, id, now)) {
      earned.push(id);
    }
  }
  return earned;
}
