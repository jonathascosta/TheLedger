/**
 * The morning paper's events (PRODUCT.md, The morning paper). Headlines and copy live in the
 * app's strings (`event.<id>.*`); here are their effects on the market.
 */
export interface Shock {
  /** An instrument id, or a kind ('stock', 'commodity', 'coin') for all of that kind. */
  readonly target: string;
  readonly factor: number;
}

export interface EventDef {
  readonly id: string;
  readonly shocks: readonly Shock[];
  /** A crash: holding steady earns "Nerves of steel". */
  readonly crash?: boolean;
}

export const EVENTS: readonly EventDef[] = [
  { id: 'satellite', shocks: [{ target: 'nmtc', factor: 1.15 }] },
  {
    id: 'tanker',
    shocks: [
      { target: 'oil', factor: 1.18 },
      { target: 'patl', factor: 1.1 },
      { target: 'skyl', factor: 0.88 },
    ],
  },
  {
    id: 'mineStrike',
    shocks: [
      { target: 'irnb', factor: 0.85 },
      { target: 'gold', factor: 1.05 },
    ],
  },
  {
    id: 'cocoaBlight',
    shocks: [
      { target: 'gldc', factor: 0.9 },
      { target: 'coffee', factor: 1.12 },
    ],
  },
  { id: 'cloudOutage', shocks: [{ target: 'nmbs', factor: 0.88 }] },
  { id: 'airlineMerger', shocks: [{ target: 'skyl', factor: 1.2 }] },
  { id: 'cryptoMania', shocks: [{ target: 'coin', factor: 1.3 }] },
  { id: 'cryptoBan', shocks: [{ target: 'coin', factor: 0.7 }] },
  {
    id: 'rateCut',
    shocks: [
      { target: 'stock', factor: 1.06 },
      { target: 'gold', factor: 0.97 },
    ],
  },
  {
    id: 'crash',
    crash: true,
    shocks: [
      { target: 'stock', factor: 0.7 },
      { target: 'coin', factor: 0.8 },
      { target: 'gold', factor: 1.08 },
    ],
  },
  {
    id: 'goldRush',
    shocks: [
      { target: 'gold', factor: 1.12 },
      { target: 'irnb', factor: 1.1 },
    ],
  },
  {
    id: 'techBoom',
    shocks: [
      { target: 'nmbs', factor: 1.18 },
      { target: 'nmtc', factor: 1.08 },
    ],
  },
  {
    id: 'frost',
    shocks: [
      { target: 'coffee', factor: 1.2 },
      { target: 'gldc', factor: 0.95 },
    ],
  },
  {
    id: 'touristSummer',
    shocks: [
      { target: 'skyl', factor: 1.1 },
      { target: 'oil', factor: 1.04 },
    ],
  },
];

/** Seconds of game time between editions. */
export const EDITION_SECONDS = 240;

export type ChoiceId = 'bold' | 'careful' | 'hold';

/** The coupons: a share of cash staked, and the outcomes. */
export const CHOICES: Readonly<
  Record<Exclude<ChoiceId, 'hold'>, { stake: number; pWin: number; win: number; lose: number }>
> = {
  bold: { stake: 0.1, pWin: 0.55, win: 1.4, lose: 0.75 },
  careful: { stake: 0.05, pWin: 0.9, win: 1.08, lose: 0.95 },
};
