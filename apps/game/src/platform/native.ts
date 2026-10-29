import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { StatusBar, Style } from '@capacitor/status-bar';
import type { Storage } from '../persist/storage.ts';
import type { Platform } from './index.ts';

const KEY = 'theledger.save';

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
  return {
    storage,
    tap: () => void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined),
  };
}
