import type { AdProvider } from './ads.ts';

/** A listener handle, as Capacitor plugins return them. */
export interface ListenerHandle {
  remove(): Promise<void>;
}

/**
 * What the provider needs of the AdMob plugin (`@capacitor-community/admob`): load a rewarded ad,
 * show it, and hear how it ended.
 */
export interface AdMobApi {
  prepareRewardVideoAd(options: { adId: string }): Promise<unknown>;
  showRewardVideoAd(): Promise<unknown>;
  addListener(eventName: string, listener: () => void): Promise<ListenerHandle>;
}

/** The plugin's event names (its `RewardAdPluginEvents`). */
export const ADMOB_EVENTS = {
  dismissed: 'onRewardedVideoAdDismissed',
  failedToShow: 'onRewardedVideoAdFailedToShow',
  rewarded: 'onRewardedVideoAdReward',
} as const;

/**
 * Google's sample rewarded unit for iOS, which always serves test ads and never pays: the build
 * uses it until the owner's own unit is passed at build time (`VITE_ADMOB_REWARDED_ID`).
 */
export const TEST_REWARDED_UNIT = 'ca-app-pub-3940256099942544/1712485313';

export interface AdMobOptions {
  readonly unit: string;
  /**
   * Resolves when ads may load: the player's choices asked for and the SDK started
   * (`AdConsent.ready`). Called before every load, so a load after a failed one asks again.
   */
  readonly ready?: () => Promise<unknown>;
  /** How long a sponsor waits for an ad still loading before saying there is none. */
  readonly waitMs?: number;
  readonly onError?: (error: unknown) => void;
  /** The clock, in milliseconds, for the age of a loaded ad. */
  readonly now?: () => number;
}

const WAIT_MS = 6000;

/**
 * A loaded ad expires an hour after it loaded and can no longer show; one older than this is
 * loaded again before it is needed.
 */
export const MAX_AD_AGE_MS = 55 * 60_000;

/**
 * Rewarded ads from AdMob (docs/ARCHITECTURE.md, Sponsors), ported from Arrows. The next ad is
 * loaded ahead, so a sponsor shows at once, and the one after loads as soon as it closes. An ad
 * not loaded within `waitMs` is no ad (the promise rejects); a load that failed is tried again
 * within the same wait.
 */
export class AdMobAds implements AdProvider {
  readonly available = true;
  private readonly api: AdMobApi;
  private readonly unit: string;
  private readonly waitMs: number;
  private readonly onError: (error: unknown) => void;
  private readonly mayLoad: () => Promise<unknown>;
  private readonly now: () => number;
  private load: Promise<boolean> | null = null;
  /** When the waiting ad finished loading. */
  private loadedAt: number | null = null;
  private showing = false;

  constructor(api: AdMobApi, options: AdMobOptions) {
    this.api = api;
    this.unit = options.unit;
    this.waitMs = options.waitMs ?? WAIT_MS;
    this.onError = options.onError ?? (() => undefined);
    this.mayLoad = options.ready ?? (() => Promise.resolve());
    this.now = options.now ?? (() => Date.now());
  }

  /** Starts loading, so the first sponsor need not wait. */
  preload(): void {
    this.startLoad();
  }

  async showRewarded(): Promise<boolean> {
    // One ad at a time: a second tap while one shows earns nothing.
    if (this.showing) return false;
    this.showing = true;
    try {
      if (!(await this.ready())) throw new Error('No rewarded ad loaded');
      return await this.present();
    } finally {
      this.showing = false;
    }
  }

  private startLoad(): void {
    this.loadedAt = null;
    // Consent first, and the SDK started: before, the plugin's show calls would never answer.
    const attempt = this.mayLoad()
      .then(() => this.api.prepareRewardVideoAd({ adId: this.unit }))
      .then(
        () => {
          // Unless another load has taken this one's place meanwhile.
          if (this.load === attempt) this.loadedAt = this.now();
          return true;
        },
        (error: unknown) => {
          this.onError(error);
          return false;
        },
      );
    this.load = attempt;
  }

  private stale(): boolean {
    return this.loadedAt !== null && this.now() - this.loadedAt > MAX_AD_AGE_MS;
  }

  /** Whether an ad is loaded, waiting up to `waitMs`; a failed load is tried once more. */
  private async ready(): Promise<boolean> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const late = new Promise<'late'>((resolve) => {
      timer = setTimeout(() => resolve('late'), this.waitMs);
    });
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        if (this.load === null || this.stale()) this.startLoad();
        const loaded = await Promise.race([this.load!, late]);
        if (loaded !== false) return loaded === true;
        this.load = null;
      }
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Shows the loaded ad and resolves when it has gone, with whether the reward was earned. An ad
   * that could not show rejects. The next ad loads behind it.
   */
  private async present(): Promise<boolean> {
    this.load = null;
    this.loadedAt = null;
    const outcome: { earned: boolean; failure: Error | null } = { earned: false, failure: null };
    let finish: () => void = () => undefined;
    const gone = new Promise<void>((resolve) => (finish = resolve));
    const fail = (error: unknown): void => {
      outcome.failure ??= error instanceof Error ? error : new Error(String(error));
      this.onError(error);
      finish();
    };
    const handles = await Promise.all([
      this.api.addListener(ADMOB_EVENTS.dismissed, () => finish()),
      this.api.addListener(ADMOB_EVENTS.failedToShow, () =>
        fail(new Error('The rewarded ad failed to show')),
      ),
      this.api.addListener(ADMOB_EVENTS.rewarded, () => (outcome.earned = true)),
    ]);
    // Resolves only when the reward is earned; the dismissal ends the ad either way.
    this.api.showRewardVideoAd().then(() => (outcome.earned = true), fail);
    await gone;
    await Promise.all(handles.map((handle) => handle.remove().catch(this.onError)));
    this.startLoad();
    if (outcome.failure !== null && !outcome.earned) throw outcome.failure;
    return outcome.earned;
  }
}
