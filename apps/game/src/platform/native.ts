import { AdMob } from '@capacitor-community/admob';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AdMobAds, TEST_REWARDED_UNIT } from '../ads/admob.ts';
import { AdConsent } from '../ads/consent.ts';
import type { Storage } from '../persist/storage.ts';
import type { Platform } from './index.ts';

const KEY = 'theledger.save';

/** A plugin call that fails is reported and never stops the game. */
function report(error: unknown): void {
  console.warn('The Ledger:', error);
}

/** The owner's rewarded unit when the build passes one, Google's test unit otherwise. */
const REWARDED_UNIT =
  import.meta.env.VITE_ADMOB_REWARDED_ID === undefined ||
  import.meta.env.VITE_ADMOB_REWARDED_ID === ''
    ? TEST_REWARDED_UNIT
    : import.meta.env.VITE_ADMOB_REWARDED_ID;

/**
 * The iPhone app: the save lives in the app's preferences (not the web view's storage, which iOS
 * may clear), haptics on taps, a dark status bar over the paper.
 */
export async function createNativePlatform(): Promise<Platform> {
  const { value } = await Preferences.get({ key: KEY });
  let cached = value;
  const storage: Storage = {
    load: () => cached,
    save(text) {
      cached = text;
      void Preferences.set({ key: KEY, value: text });
    },
    erase() {
      cached = null;
      void Preferences.remove({ key: KEY });
    },
  };
  void StatusBar.setStyle({ style: Style.Light }).catch(() => undefined);
  // The player's choices about ads first, then the SDK; the first ad loads once it has started
  // (asking again when a sponsor is tapped, if that failed). The game never waits for any of it.
  const consent = new AdConsent(AdMob, report);
  const ads = new AdMobAds(AdMob, {
    unit: REWARDED_UNIT,
    ready: () => consent.ready(),
    onError: report,
  });
  ads.preload();
  return {
    storage,
    tap: () => void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined),
    ads,
    privacy: {
      required: () => consent.privacyOptionsRequired,
      show: () => consent.showPrivacyOptions(),
    },
  };
}
