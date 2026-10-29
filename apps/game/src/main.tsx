import '@fontsource/caveat/500.css';
import '@fontsource/caveat/700.css';
import '@fontsource/courier-prime/400.css';
import '@fontsource/courier-prime/700.css';
import '@fontsource/im-fell-english/400.css';
import '@fontsource/im-fell-english/400-italic.css';
import './theme.css';
import './app.css';
import { Capacitor } from '@capacitor/core';
import { render } from 'preact';
import { App } from './App.tsx';
import { deviceLang, setLang } from './i18n/index.ts';
import { confirmAtLaunch } from './gold/gold.ts';
import { act, boot, game } from './store.ts';
import { initPlatform } from './platform/index.ts';
import { paintGrain } from './ui/grain.ts';

const { storage, gold } = await initPlatform();
boot(storage);
// The store confirms the Gold Edition kept in the save; the game does not wait for it.
if (gold) void confirmAtLaunch(gold, act);
setLang(game().settings.lang ?? deviceLang());
paintGrain();
render(<App />, document.getElementById('app')!);

// Offline play on the website (the iOS app ships its files and needs no service worker).
if (
  'serviceWorker' in navigator &&
  location.protocol === 'https:' &&
  !Capacitor.isNativePlatform()
) {
  void navigator.serviceWorker.register('./sw.js').catch(() => undefined);
}
