import { Capacitor } from '@capacitor/core';
import { NO_ADS, wantsTestAds, type AdProvider } from '../ads/ads.ts';
import { DebugAds } from '../ads/debug.ts';
import type { GoldStore } from '../gold/gold.ts';
import type { NotesApi } from '../notes/notes.ts';
import { webStorage, type Storage } from '../persist/storage.ts';

/** What differs between the website and the iPhone app. */
export interface Platform {
  storage: Storage;
  /** A light tap of the haptic engine (a stamp, a purchase). */
  tap(): void;
  /** The sponsors' ads: AdMob on iOS, none on the website (the test card with `?ads=test`). */
  ads: AdProvider;
  /** Google's form to change the player's choices about ads, where the law asks for one. */
  privacy: { required(): boolean; show(): Promise<void> };
  /** The App Store, for the Gold Edition; none on the website. */
  gold: GoldStore | null;
  /** Notes from the night shift (local notifications); none on the website. */
  notes: NotesApi | null;
}

const web: Platform = {
  storage: webStorage,
  tap: () => undefined,
  ads:
    typeof location !== 'undefined' && wantsTestAds(location.search)
      ? new DebugAds(document)
      : NO_ADS,
  privacy: { required: () => false, show: () => Promise.resolve() },
  gold: null,
  notes: null,
};

let current: Platform = web;

export function platform(): Platform {
  return current;
}

/** Loads the native platform on iOS; the website keeps the web one. */
export async function initPlatform(): Promise<Platform> {
  if (Capacitor.isNativePlatform()) {
    const native = await import('./native.ts');
    current = await native.createNativePlatform();
  }
  return current;
}
