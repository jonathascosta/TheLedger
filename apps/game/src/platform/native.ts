import { AdMob } from '@capacitor-community/admob';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AdMobAds, TEST_REWARDED_UNIT } from '../ads/admob.ts';
import { AdConsent } from '../ads/consent.ts';
import { goldInSave } from '../gold/gold.ts';
import { AppStoreGold } from '../gold/native.ts';
import type { NotesApi } from '../notes/notes.ts';
import type { Storage } from '../persist/storage.ts';
import type { Platform } from './index.ts';

const KEY = 'theledger.save';

/** A plugin call that fails is reported and never stops the game. */
function report(error: unknown): void {
  console.warn('The Ledger:', error);
}

/** Notes from the night shift through iOS local notifications. */
const notes: NotesApi = {
  async request() {
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  },
  async schedule(list) {
    if (list.length === 0) return;
    await LocalNotifications.schedule({
      notifications: list.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        schedule: { at: new Date(n.at) },
      })),
    });
  },
  async clear() {
    await LocalNotifications.cancel({ notifications: [{ id: 1 }, { id: 2 }, { id: 3 }] });
    await LocalNotifications.removeAllDeliveredNotifications();
  },
  async check() {
    const { display } = await LocalNotifications.checkPermissions();
    return display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'prompt';
  },
};

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
  // A Gold player sees no ad: nothing starts (no consent form, no tracking prompt, no SDK) unless
  // an ad is needed later, after the store has removed the flag.
  if (!goldInSave(value)) ads.preload();
  return {
    storage,
    tap: () => void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined),
    ads,
    privacy: {
      required: () => consent.privacyOptionsRequired,
      show: () => consent.showPrivacyOptions(),
    },
    gold: new AppStoreGold(),
    notes,
  };
}
