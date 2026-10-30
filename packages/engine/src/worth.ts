import { artValue, parksValue, propertiesValue } from './assets/assets.ts';
import { CLASS_UNLOCKS, type AssetClass } from './data/market.ts';
import { clubsValue } from './clubs/clubs.ts';
import { instrumentsValue } from './market/market.ts';
import type { GameState } from './state/state.ts';

/** Cash plus every holding's value (businesses count through their income, not here). */
export function netWorth(state: GameState): number {
  const v = state.volume;
  return (
    v.cash +
    instrumentsValue(state) +
    v.bonds +
    propertiesValue(state) +
    parksValue(state) +
    (v.startup?.maturesAt != null ? v.startup.ask : 0) +
    artValue(state) +
    clubsValue(state)
  );
}

/** Whether an asset class is open in this volume. */
export function isUnlocked(state: GameState, id: AssetClass): boolean {
  const at = CLASS_UNLOCKS.find((c) => c.id === id)?.at ?? Infinity;
  return state.volume.peakNetWorth >= at;
}

/** Value held in each class, for the portfolio's pie. Businesses: an hour of their income. */
export function classValues(state: GameState, businessHour: number): Record<AssetClass, number> {
  const v = state.volume;
  return {
    businesses: businessHour,
    stocks: instrumentsValue(state, 'stock'),
    bonds: v.bonds,
    realEstate: propertiesValue(state),
    commodities: instrumentsValue(state, 'commodity'),
    crypto: instrumentsValue(state, 'coin'),
    startups: v.startup?.maturesAt != null ? v.startup.ask : 0,
    art: artValue(state),
    energy: parksValue(state),
    clubs: clubsValue(state),
  };
}
