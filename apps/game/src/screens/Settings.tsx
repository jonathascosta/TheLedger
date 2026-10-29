import type { GameState, Lang } from '@ledger/engine';
import { useEffect, useState } from 'preact/hooks';
import { buyGold, restoreGold, type GoldStore } from '../gold/gold.ts';
import { setLang, deviceLang, t } from '../i18n/index.ts';
import { act, eraseSave } from '../store.ts';
import { platform } from '../platform/index.ts';
import { switchTab } from '../router.ts';
import { Page } from '../ui/Page.tsx';

export const VERSION = '0.1.0';

/** The Gold Edition: buy or restore it (iOS only; docs/PRODUCT.md, The Gold Edition). */
function GoldSection({ state, store }: { state: GameState; store: GoldStore }) {
  const [price, setPrice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    void store.price().then(setPrice);
  }, [store]);
  const run = async (task: () => Promise<string | null>): Promise<void> => {
    setBusy(true);
    setMessage(null);
    try {
      setMessage(await task());
    } finally {
      setBusy(false);
    }
  };
  const buy = (): Promise<void> =>
    run(async () => {
      const outcome = await buyGold(store, act);
      return outcome === 'failed' ? t('gold.failed') : null;
    });
  const restore = (): Promise<void> =>
    run(async () => {
      const owned = await restoreGold(store, act);
      return owned === null ? t('gold.offline') : owned ? t('gold.restored') : t('gold.notFound');
    });
  return (
    <div class="stack" style={{ gap: '8px' }}>
      <p class="caps">{t('gold.title')}</p>
      {state.meta.gold ? (
        <p class="hand profit" style={{ fontSize: '20px' }}>
          {t('gold.owned')}
        </p>
      ) : (
        <>
          <p class="hand" style={{ fontSize: '20px', lineHeight: 1.15 }}>
            {t('gold.pitch')}
          </p>
          <button
            type="button"
            class="stamp-btn green"
            style={{ alignSelf: 'flex-start' }}
            disabled={busy}
            onClick={() => void buy()}
          >
            {busy ? t('gold.busy') : price ? t('gold.buy', { price }) : t('gold.buyNoPrice')}
          </button>
        </>
      )}
      <button
        type="button"
        class="btn-link"
        style={{ alignSelf: 'flex-start' }}
        disabled={busy}
        onClick={() => void restore()}
      >
        {t('gold.restore')}
      </button>
      {message && (
        <p class="hand loss" role="status" style={{ fontSize: '18px' }}>
          {message}
        </p>
      )}
    </div>
  );
}

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
      {platform().gold && <GoldSection state={state} store={platform().gold!} />}
      {platform().privacy.required() && (
        <button
          type="button"
          class="btn"
          style={{ alignSelf: 'flex-start' }}
          onClick={() => void platform().privacy.show()}
        >
          {t('settings.privacy')}
        </button>
      )}
      <p class="tiny" style={{ marginTop: '24px' }}>
        {t('settings.about', { version: VERSION })}
      </p>
      <p class="tiny">{t('settings.credits')}</p>
    </Page>
  );
}
