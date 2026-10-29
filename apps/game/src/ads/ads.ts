/**
 * Where sponsors come from (docs/PRODUCT.md, Sponsors): rewarded ads only, never an ad the
 * player did not ask for. The iOS app puts AdMob here (`admob.ts`); the website has none, except
 * the test card (`debug.ts`) when opened with `?ads=test`, for the end-to-end tests.
 */
export interface AdProvider {
  /** Whether sponsors are offered at all on this platform. */
  readonly available: boolean;
  /**
   * A rewarded ad. Resolves with whether the player earned the reward (watched to the end);
   * rejects when no ad could be shown.
   */
  showRewarded(): Promise<boolean>;
}

/** The website: no sponsors. */
export const NO_ADS: AdProvider = {
  available: false,
  showRewarded: () => Promise.resolve(false),
};

/** Whether the page asks for the test card (`?ads=test`). */
export function wantsTestAds(search: string): boolean {
  return new URLSearchParams(search).get('ads') === 'test';
}
