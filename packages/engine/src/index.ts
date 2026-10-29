export { createRng, cyrb53 } from './rng/rng.ts';
export type { Rng, Seed } from './rng/rng.ts';

export {
  formatDuration,
  formatMoney,
  formatMoneyShort,
  formatNumberLong,
  formatNumberShort,
  formatPercent,
  formatPlain,
} from './format/format.ts';
export type { Lang } from './format/format.ts';

export { BUSINESSES, MILESTONES } from './data/businesses.ts';
export type { BusinessDef } from './data/businesses.ts';
export { UPGRADES, UPGRADE_BY_ID } from './data/upgrades.ts';
export type { UpgradeDef, UpgradeEffect } from './data/upgrades.ts';
export { TRAITS } from './data/people.ts';
export type { Trait } from './data/people.ts';
export { PARTNERS, GOODWILL_BONUS } from './data/partners.ts';
export type { PartnerDef, PartnerId } from './data/partners.ts';

export { SAVE_VERSION, migrate, newGame, newVolume } from './state/state.ts';
export type {
  AwayLine,
  AwayReceipt,
  BusinessState,
  BuyMode,
  DeskState,
  GameState,
  Manager,
  Meta,
  Settings,
  ShelfEntry,
  Volume,
} from './state/state.ts';

export {
  businessIncome,
  businessRate,
  buyBusiness,
  buyOffer,
  buyUpgrade,
  collect,
  cycleOf,
  earn,
  goodwillMultiplier,
  hasPartner,
  isAvailable,
  levelCost,
  managerCost,
  maxAffordable,
  milestonesReached,
  nextMilestone,
  profitPerCycle,
} from './economy/economy.ts';
export type { ActionResult } from './economy/economy.ts';

export {
  COMBO_WINDOW_MS,
  STAMPS_PER_INVOICE,
  comboMultiplier,
  currentCombo,
  stamp,
  stampBase,
} from './desk/desk.ts';
export type { StampResult } from './desk/desk.ts';

export { candidateFor, candidates, hire } from './managers/managers.ts';
export type { Candidate } from './managers/managers.ts';

export { AWAY_MAX_SECONDS, collectAway, offlineRate } from './away/away.ts';

export { applyAway, netWorth, tick } from './game.ts';
