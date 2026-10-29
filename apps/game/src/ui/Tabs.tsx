import { isUnlocked, type GameState } from '@ledger/engine';
import { Icon } from '../art/Doodles.tsx';
import { t } from '../i18n/index.ts';
import { currentTab, switchTab, type Tab } from '../router.ts';

const TABS: readonly { id: Tab; color: string; icon: () => preact.JSX.Element }[] = [
  { id: 'ledger', color: 'var(--tab-ledger)', icon: Icon.ledger },
  { id: 'market', color: 'var(--tab-market)', icon: Icon.market },
  { id: 'portfolio', color: 'var(--tab-portfolio)', icon: Icon.portfolio },
  { id: 'achievements', color: 'var(--tab-achievements)', icon: Icon.achievements },
];

/** The notebook's index tabs. */
export function Tabs({ state }: { state: GameState }) {
  const tab = currentTab();
  return (
    <nav class="tabs" aria-label={t('tab.sections')}>
      {TABS.map(({ id, color, icon: I }) => {
        const dot = id === 'ledger' && state.volume.paper.unread && isUnlocked(state, 'stocks');
        return (
          <button
            key={id}
            type="button"
            class={tab === id ? 'tab on' : 'tab'}
            aria-current={tab === id ? 'page' : undefined}
            style={{ background: color }}
            onClick={() => switchTab(id)}
          >
            <I />
            {t(`tab.${id}`)}
            {dot && <span class="dot" />}
          </button>
        );
      })}
    </nav>
  );
}
