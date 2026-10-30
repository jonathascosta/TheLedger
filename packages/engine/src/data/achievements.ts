/**
 * Achievements (PRODUCT.md, Achievements). Names and descriptions live in the app's strings
 * (`ach.<id>.name`, `ach.<id>.desc`); `style` picks the stamp or seal it is drawn as.
 */
export type AchievementStyle = 'stamp' | 'seal' | 'diamond' | 'box';

export interface AchievementDef {
  readonly id: string;
  readonly style: AchievementStyle;
  /** Shown as "???" until earned. */
  readonly secret?: boolean;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'firstBusiness', style: 'stamp' },
  { id: 'allBusinesses', style: 'seal' },
  { id: 'level25', style: 'box' },
  { id: 'level100', style: 'box' },
  { id: 'level500', style: 'seal' },
  { id: 'firstManager', style: 'stamp' },
  { id: 'allManagers', style: 'seal' },
  { id: 'firstUpgrade', style: 'box' },
  { id: 'upgrades25', style: 'diamond' },
  { id: 'million', style: 'stamp' },
  { id: 'billion', style: 'stamp' },
  { id: 'trillion', style: 'seal' },
  { id: 'quadrillion', style: 'seal' },
  { id: 'stamps100', style: 'box' },
  { id: 'stamps1000', style: 'box' },
  { id: 'combo20', style: 'diamond' },
  { id: 'firstShare', style: 'stamp' },
  { id: 'soldAtTop', style: 'stamp' },
  { id: 'nervesOfSteel', style: 'seal' },
  { id: 'firstBond', style: 'box' },
  { id: 'firstProperty', style: 'diamond' },
  { id: 'landlord', style: 'seal' },
  { id: 'firstCoin', style: 'box' },
  { id: 'firstStartup', style: 'diamond' },
  { id: 'unicorn', style: 'seal' },
  { id: 'firstArt', style: 'diamond' },
  { id: 'firstPark', style: 'diamond' },
  { id: 'collector', style: 'seal' },
  { id: 'reader', style: 'box' },
  { id: 'firstVolume', style: 'seal' },
  { id: 'fiveVolumes', style: 'seal' },
  { id: 'heir', style: 'seal' },
  { id: 'firstPartner', style: 'stamp' },
  { id: 'insomniac', style: 'box', secret: true },
  { id: 'cafeTycoon', style: 'diamond', secret: true },
  { id: 'gambler', style: 'stamp', secret: true },
];
