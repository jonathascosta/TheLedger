import type { GameState, Lang } from '@ledger/engine';
import { useState } from 'preact/hooks';
import { setLang, deviceLang, t } from '../i18n/index.ts';
import { act, eraseSave } from '../store.ts';
import { switchTab } from '../router.ts';
import { Page } from '../ui/Page.tsx';

export const VERSION = '0.1.0';

export function Settings({ state }: { state: GameState }) {
  const [confirm, setConfirm] = useState(false);
  const choose = (lang: Lang | null): void => {
    act((s) => (s.settings.lang = lang));
    setLang(lang ?? deviceLang());
  };
  return (
    <Page>
      <h1 class="h1">{t('settings.title')}</h1>
      <p class="caps">{t('settings.language')}</p>
      <div class="row" style={{ gap: '4px' }}>
        {([null, 'en', 'pt'] as const).map((l) => (
          <button
            key={String(l)}
            type="button"
            class={state.settings.lang === l ? 'chip on' : 'chip'}
            aria-pressed={state.settings.lang === l}
            onClick={() => choose(l)}
          >
            {l === null ? t('settings.auto') : l === 'en' ? 'English' : 'Português'}
          </button>
        ))}
      </div>
      <div style={{ marginTop: '20px' }}>
        {confirm ? (
          <div class="stack">
            <p class="hand loss" style={{ fontSize: '20px' }}>
              {t('settings.eraseConfirm')}
            </p>
            <div class="row">
              <button
                type="button"
                class="stamp-btn red"
                onClick={() => {
                  eraseSave();
                  setConfirm(false);
                  switchTab('ledger');
                }}
              >
                {t('settings.eraseYes')}
              </button>
              <button type="button" class="btn alt" onClick={() => setConfirm(false)}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" class="btn" onClick={() => setConfirm(true)}>
            {t('settings.erase')}
          </button>
        )}
      </div>
      <p class="tiny" style={{ marginTop: '24px' }}>
        {t('settings.about', { version: VERSION })}
      </p>
      <p class="tiny">{t('settings.credits')}</p>
    </Page>
  );
}
