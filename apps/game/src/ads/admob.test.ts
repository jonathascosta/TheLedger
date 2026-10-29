import { RewardAdPluginEvents } from '@capacitor-community/admob';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ADMOB_EVENTS, AdMobAds, MAX_AD_AGE_MS, TEST_REWARDED_UNIT } from './admob.ts';
import type { AdMobApi, ListenerHandle } from './admob.ts';

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
} {
  let resolve: (value: T) => void = () => undefined;
  let reject: (error: Error) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function settle(): Promise<void> {
  for (let i = 0; i < 20; i++) await Promise.resolve();
}

/** The plugin as the provider sees it: loads and shows that the test drives. */
class FakeAdMob implements AdMobApi {
  readonly prepared: string[] = [];
  readonly loads: ReturnType<typeof deferred<unknown>>[] = [];
  shows = 0;
  readonly listeners = new Map<string, Set<() => void>>();
  show = deferred<unknown>();

  prepareRewardVideoAd(options: { adId: string }): Promise<unknown> {
    this.prepared.push(options.adId);
    const load = deferred<unknown>();
    this.loads.push(load);
    return load.promise;
  }

  showRewardVideoAd(): Promise<unknown> {
    this.shows++;
    return this.show.promise;
  }

  addListener(eventName: string, listener: () => void): Promise<ListenerHandle> {
    const set = this.listeners.get(eventName) ?? new Set();
    set.add(listener);
    this.listeners.set(eventName, set);
    return Promise.resolve({
      remove: () => {
        set.delete(listener);
        return Promise.resolve();
      },
    });
  }

  emit(eventName: string): void {
    for (const listener of [...(this.listeners.get(eventName) ?? [])]) listener();
  }

  get listening(): number {
    return [...this.listeners.values()].reduce((sum, set) => sum + set.size, 0);
  }

  loadLast(): void {
    this.loads.at(-1)!.resolve(undefined);
  }
}

describe('AdMobAds', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('listens to the plugin’s own event names', () => {
    expect(ADMOB_EVENTS.dismissed).toBe(RewardAdPluginEvents.Dismissed);
    expect(ADMOB_EVENTS.failedToShow).toBe(RewardAdPluginEvents.FailedToShow);
    expect(ADMOB_EVENTS.rewarded).toBe(RewardAdPluginEvents.Rewarded);
  });

  it('loads ahead once the SDK has started, and nothing before', async () => {
    const api = new FakeAdMob();
    const started = deferred<undefined>();
    new AdMobAds(api, { unit: TEST_REWARDED_UNIT, ready: () => started.promise }).preload();
    await settle();
    expect(api.prepared).toEqual([]);
    started.resolve(undefined);
    await settle();
    expect(api.prepared).toEqual([TEST_REWARDED_UNIT]);
  });

  it('earns the reward only when the ad says so, resolves on dismissal, loads the next', async () => {
    const api = new FakeAdMob();
    const ads = new AdMobAds(api, { unit: 'u' });
    ads.preload();
    await settle();
    api.loadLast();
    const watched = ads.showRewarded();
    await settle();
    expect(api.shows).toBe(1);
    api.emit(ADMOB_EVENTS.rewarded);
    api.emit(ADMOB_EVENTS.dismissed);
    await expect(watched).resolves.toBe(true);
    expect(api.listening).toBe(0);
    expect(api.prepared).toHaveLength(2);

    // Closed early: no reward.
    api.loadLast();
    api.show = deferred();
    const skipped = ads.showRewarded();
    await settle();
    api.emit(ADMOB_EVENTS.dismissed);
    await expect(skipped).resolves.toBe(false);
  });

  it('a second tap while an ad shows earns nothing', async () => {
    const api = new FakeAdMob();
    const ads = new AdMobAds(api, { unit: 'u' });
    ads.preload();
    await settle();
    api.loadLast();
    const first = ads.showRewarded();
    await expect(ads.showRewarded()).resolves.toBe(false);
    await settle();
    api.emit(ADMOB_EVENTS.dismissed);
    await expect(first).resolves.toBe(false);
  });

  it('rejects when no ad loads in time, or when it fails to show', async () => {
    const api = new FakeAdMob();
    const ads = new AdMobAds(api, { unit: 'u', waitMs: 1000 });
    const late = ads.showRewarded();
    const check = expect(late).rejects.toThrow('No rewarded ad');
    await vi.advanceTimersByTimeAsync(1000);
    await check;

    api.loadLast();
    await settle();
    const failing = ads.showRewarded();
    await settle();
    api.emit(ADMOB_EVENTS.failedToShow);
    await expect(failing).rejects.toThrow('failed to show');
  });

  it('tries a failed load once more within the same wait', async () => {
    const api = new FakeAdMob();
    const ads = new AdMobAds(api, { unit: 'u' });
    const watched = ads.showRewarded();
    await settle();
    api.loads[0]!.reject(new Error('no fill'));
    await settle();
    expect(api.prepared).toHaveLength(2);
    api.loadLast();
    await settle();
    api.emit(ADMOB_EVENTS.rewarded);
    api.emit(ADMOB_EVENTS.dismissed);
    await expect(watched).resolves.toBe(true);
  });

  it('loads again an ad older than an ad lasts before showing it', async () => {
    const api = new FakeAdMob();
    let clock = 0;
    const ads = new AdMobAds(api, { unit: 'u', now: () => clock });
    ads.preload();
    await settle();
    api.loadLast();
    await settle();
    clock = MAX_AD_AGE_MS + 1;
    const watched = ads.showRewarded();
    await settle();
    expect(api.prepared).toHaveLength(2);
    expect(api.shows).toBe(0);
    api.loadLast();
    await settle();
    api.emit(ADMOB_EVENTS.dismissed);
    await expect(watched).resolves.toBe(false);
  });
});
