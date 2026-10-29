/** Partners bought with goodwill (PRODUCT.md, Closing the volume). */
export type PartnerId =
  | 'nightManager'
  | 'stampMaker'
  | 'headStart'
  | 'oldFriends'
  | 'bondDesk'
  | 'insider'
  | 'fastTills'
  | 'estateAgent';

export interface PartnerDef {
  readonly id: PartnerId;
  readonly cost: number;
}

export const PARTNERS: readonly PartnerDef[] = [
  { id: 'nightManager', cost: 10 },
  { id: 'stampMaker', cost: 15 },
  { id: 'headStart', cost: 25 },
  { id: 'oldFriends', cost: 50 },
  { id: 'bondDesk', cost: 60 },
  { id: 'insider', cost: 75 },
  { id: 'fastTills', cost: 150 },
  { id: 'estateAgent', cost: 200 },
];

/** Each goodwill point held adds this to business profit. */
export const GOODWILL_BONUS = 0.02;
