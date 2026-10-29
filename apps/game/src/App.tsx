import { ACHIEVEMENTS, type GameState } from '@ledger/engine';
import { useEffect, useState } from 'preact/hooks';
import { t, tk } from './i18n/index.ts';
import { useRoute, type Route } from './router.ts';
import { act, useGame } from './store.ts';
import { Achievements } from './screens/Achievements.tsx';
import { Away } from './screens/Away.tsx';
import { Business } from './screens/Business.tsx';
import { Art, Bonds, Energy, Estate, Startups } from './screens/Classes.tsx';
import { Classifieds } from './screens/Classifieds.tsx';
import { Desk } from './screens/Desk.tsx';
import { Gazette } from './screens/Gazette.tsx';
import { Ledger } from './screens/Ledger.tsx';
import { Instrument, Market } from './screens/Market.tsx';
import { Portfolio } from './screens/Portfolio.tsx';
import { Close, Partners, Shelf } from './screens/Prestige.tsx';
import { Settings } from './screens/Settings.tsx';
import { Upgrades } from './screens/Upgrades.tsx';
import { Defs } from './ui/Defs.tsx';
import { Tabs } from './ui/Tabs.tsx';

function Screen({ route, state }: { route: Route; state: GameState }) {
  switch (route.name) {
    case 'ledger':
      return <Ledger state={state} />;
    case 'desk':
      return <Desk state={state} />;
    case 'business':
      return <Business state={state} index={route.index} />;
    case 'upgrades':
      return <Upgrades state={state} />;
    case 'classifieds':
      return <Classifieds state={state} />;
    case 'gazette':
      return <Gazette state={state} />;
    case 'market':
      return <Market state={state} kind={route.kind} />;
    case 'instrument':
      return <Instrument state={state} id={route.id} />;
    case 'portfolio':
      return <Portfolio state={state} />;
    case 'bonds':
      return <Bonds state={state} />;
    case 'estate':
      return <Estate state={state} />;
    case 'startups':
      return <Startups state={state} />;
    case 'art':
      return <Art state={state} />;
    case 'energy':
      return <Energy state={state} />;
    case 'achievements':
      return <Achievements state={state} />;
    case 'close':
      return <Close state={state} />;
    case 'partners':
      return <Partners state={state} />;
    case 'shelf':
      return <Shelf state={state} />;
    case 'settings':
      return <Settings state={state} />;
  }
}

/** Announces new achievements, one at a time, with a stamp. */
function Toast({ state }: { state: GameState }) {
  const [showing, setShowing] = useState<string | null>(null);
  const next = state.fresh[0] ?? null;
  useEffect(() => {
    if (next && !showing) setShowing(next);
  }, [next, showing]);
  useEffect(() => {
    if (!showing) return;
    const timer = setTimeout(() => {
      act((s) => {
        if (s.fresh[0] === showing) s.fresh.shift();
      });
      setShowing(null);
    }, 2600);
    return () => clearTimeout(timer);
  }, [showing]);
  if (!showing || !ACHIEVEMENTS.some((a) => a.id === showing)) return null;
  return (
    <div class="toast" role="status" key={showing}>
      {t('achievements.earned', { name: tk(`ach.${showing}.name`) })}
    </div>
  );
}

export function App() {
  const state = useGame();
  const route = useRoute();
  const newsprint = route.name === 'gazette' || route.name === 'classifieds';
  return (
    <div class={newsprint ? 'page newsprint' : 'page'}>
      <Defs />
      <Screen key={JSON.stringify(route)} route={route} state={state} />
      <Tabs state={state} />
      {state.away && <Away receipt={state.away} />}
      <Toast state={state} />
    </div>
  );
}
