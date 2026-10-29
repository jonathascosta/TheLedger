import '@fontsource/caveat/500.css';
import '@fontsource/caveat/700.css';
import '@fontsource/courier-prime/400.css';
import '@fontsource/courier-prime/700.css';
import '@fontsource/im-fell-english/400.css';
import '@fontsource/im-fell-english/400-italic.css';
import './theme.css';
import './app.css';
import { render } from 'preact';
import { App } from './App.tsx';
import { deviceLang, setLang } from './i18n/index.ts';
import { boot, game } from './store.ts';
import { paintGrain } from './ui/grain.ts';

boot();
setLang(game().settings.lang ?? deviceLang());
paintGrain();
render(<App />, document.getElementById('app')!);
