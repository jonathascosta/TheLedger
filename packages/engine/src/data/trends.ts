/** Trends (PRODUCT.md, Trends): one small business the talk of the town for a while. */

/** A trend every 25 minutes of play. */
export const TREND_EVERY_MS = 25 * 60_000;
/** A trend lasts 5 minutes. */
export const TREND_MS = 5 * 60_000;
/** The trend's factor, before its cap. */
export const TREND_FACTOR = 50;
/** The least factor, whatever the cap. */
export const TREND_MIN_FACTOR = 2;
/** At most this many past trends keep their business from being drawn again. */
export const TREND_RECENT = 5;
