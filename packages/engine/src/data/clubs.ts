/** The sports clubs (PRODUCT.md, Investments): six fictional football clubs. */
export interface ClubDef {
  readonly id: string;
  readonly price: number;
}

export const CLUBS: readonly ClubDef[] = [
  'millbrook',
  'harbour',
  'northgate',
  'redfield',
  'ironbridge',
  'royalAlder',
].map((id, i) => ({ id, price: 1e12 * 4 ** i }));

/** A match day every 10 minutes of play. */
export const MATCH_MS = 10 * 60_000;
/** Win odds: 0.30 + 0.30 × strength; a draw 0.25; a loss otherwise. */
export const WIN_BASE = 0.3;
export const WIN_PER_STRENGTH = 0.3;
export const DRAW = 0.25;
/** A win pays this share of the club's price; a draw a third of it. */
export const WIN_PRIZE = 0.85;
/** Value after a win and after a loss, bounded to half and four times the price. */
export const WIN_VALUE = 1.04;
export const LOSS_VALUE = 0.97;
export const VALUE_MIN = 0.5;
export const VALUE_MAX = 4;
/** Clubs sell at this share of their value. */
export const CLUB_SALE = 0.9;
/** Results kept for the row of W, D and L. */
export const RESULTS_KEPT = 5;
