import { netWorth, type GameState, type Lang } from '@ledger/engine';
import { useEffect, useRef, useState } from 'preact/hooks';
import { buyGold, restoreGold, type GoldStore } from '../gold/gold.ts';
import { setLang, deviceLang, lang, roman, t } from '../i18n/index.ts';
import { setNotes } from '../notes/notes.ts';
import { decodeBackup, encodeBackup, type Decoded } from '../persist/backup.ts';
import { platform } from '../platform/index.ts';
import { act, eraseSave, game, restoreGame } from '../store.ts';
import { switchTab } from '../router.ts';
import { money } from '../ui/format.ts';
import { Page } from '../ui/Page.tsx';

export const VERSION = '0.1.0';

/** The Gold Edition: buy or restore it (iOS only; docs/PRODUCT.md, The Gold Edition). */
function GoldSection({ state, store }: { state: GameState; store: GoldStore }) {
  const [price, setPrice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; good: boolean } | null>(null);
  useEffect(() => {
    void store.price().then(setPrice);
  }, [store]);
  const run = async (
    task: () => Promise<{ text: string; good: boolean } | null>,
  ): Promise<void> => {
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
      if (outcome === 'failed') return { text: t('gold.failed'), good: false };
      if (outcome === 'pending') return { text: t('gold.pending'), good: true };
      return null;
    });
  const restore = (): Promise<void> =>
    run(async () => {
      const owned = await restoreGold(store, act);
      if (owned === null) return { text: t('gold.offline'), good: false };
      return owned
        ? { text: t('gold.restored'), good: true }
        : { text: t('gold.notFound'), good: false };
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
        <p
          class={message.good ? 'hand profit' : 'hand loss'}
          role="status"
          style={{ fontSize: '18px' }}
        >
          {message.text}
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
      <Backup />
      <div style={{ marginTop: '20px' }}>
        {confirm ? (
          <div class="stack">
            <p class="hand loss" style={{ fontSize: '20px' }}>
              {t('settings.eraseConfirm')}
            </p>
            <div class="row wrap">
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
      {platform().notes && (
        <div class="stack" style={{ gap: '6px' }}>
          <p class="caps">{t('notes.title')}</p>
          <div class="row" role="group" aria-label={t('notes.title')} style={{ gap: '4px' }}>
            {([true, false] as const).map((on) => (
              <button
                key={String(on)}
                type="button"
                class={(state.settings.notes === 'on') === on ? 'chip on' : 'chip'}
                aria-pressed={(state.settings.notes === 'on') === on}
                onClick={() => void setNotes(on)}
              >
                {on ? t('notes.on') : t('notes.off')}
              </button>
            ))}
          </div>
          {state.settings.notes === 'denied' && <p class="tiny">{t('notes.denied')}</p>}
        </div>
      )}
      {!state.meta.gold && platform().privacy.required() && (
        <button
          type="button"
          class="btn"
          style={{ alignSelf: 'flex-start' }}
          onClick={() => void platform().privacy.show()}
        >
          {t('settings.privacy')}
        </button>
      )}
      {state.settings.postits.length > 0 && (
        <button
          type="button"
          class="btn"
          style={{ alignSelf: 'flex-start' }}
          onClick={() => act((s) => (s.settings.postits = []))}
        >
          {t('postit.restore')}
        </button>
      )}
      <p class="tiny" style={{ marginTop: '24px' }}>
        {t('settings.about', { version: VERSION })}
      </p>
      <p class="tiny">{t('settings.credits')}</p>
    </Page>
  );
}

function madeOn(ms: number): string {
  return new Intl.DateTimeFormat(lang() === 'pt' ? 'pt-BR' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(ms);
}

/** Copy the backup code; restore from a pasted one after a preview and a confirmation. */
function Backup() {
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean | null>(null);
  const [pasted, setPasted] = useState('');
  const [decoded, setDecoded] = useState<Decoded | null>(null);
  const [restored, setRestored] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);
  const result = useRef<HTMLDivElement>(null);

  // The preview and its Restore button may open below the fold on a small phone.
  useEffect(() => {
    if (decoded) result.current?.scrollIntoView({ block: 'nearest' });
  }, [decoded]);

  const read = (): void => {
    try {
      setDecoded(decodeBackup(pasted, Date.now()));
    } catch {
      setDecoded({ ok: false, error: 'broken' });
    }
  };

  const copy = async (): Promise<void> => {
    const text = encodeBackup(game(), Date.now());
    setCode(text);
    setCopied(null);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // No clipboard (an old web view, or no permission): the player copies it by hand.
      setCopied(false);
      requestAnimationFrame(() => box.current?.select());
    }
  };

  const restore = (state: GameState): void => {
    restoreGame(state);
    setLang(state.settings.lang ?? deviceLang());
    setDecoded(null);
    setPasted('');
    setRestored(true);
  };

  return (
    <section class="stack" style={{ marginTop: '20px' }}>
      <p class="caps">{t('settings.backup')}</p>
      <p class="small">{t('settings.backupNote')}</p>
      <div>
        <button type="button" class="btn" onClick={() => void copy()}>
          {t('settings.copy')}
        </button>
      </div>
      {code !== null && (
        <>
          <textarea
            ref={box}
            class="code-box"
            readOnly
            rows={3}
            aria-label={t('settings.codeLabel')}
            value={code}
            onFocus={(e) => e.currentTarget.select()}
          />
          {copied !== null && (
            <p class="hand" role="status">
              {copied ? t('settings.copied') : t('settings.copyManual')}
            </p>
          )}
        </>
      )}
      <p class="caps" style={{ marginTop: '8px' }}>
        {t('settings.restore')}
      </p>
      <textarea
        class="code-box"
        rows={3}
        aria-label={t('settings.pasteLabel')}
        placeholder={t('settings.pasteLabel')}
        autoComplete="off"
        autoCapitalize="off"
        spellcheck={false}
        value={pasted}
        onInput={(e) => {
          setPasted(e.currentTarget.value);
          setDecoded(null);
          setRestored(false);
        }}
      />
      <div>
        <button type="button" class="btn alt" disabled={pasted.trim() === ''} onClick={read}>
          {t('settings.read')}
        </button>
      </div>
      {restored && (
        <p class="hand profit" role="status">
          {t('settings.restored')}
        </p>
      )}
      <div ref={result}>
        {decoded &&
          (decoded.ok ? (
            <div class="stack">
              <p class="hand" style={{ fontSize: '20px' }}>
                {t('settings.previewEra', {
                  era: roman(decoded.state.meta.era),
                  roman: roman(decoded.state.volume.number),
                  worth: money(netWorth(decoded.state)),
                  date: madeOn(decoded.madeAt),
                })}
              </p>
              <p class="hand loss" style={{ fontSize: '20px' }}>
                {t('settings.restoreConfirm')}
              </p>
              <div class="row wrap">
                <button type="button" class="stamp-btn red" onClick={() => restore(decoded.state)}>
                  {t('settings.restoreYes')}
                </button>
                <button type="button" class="btn alt" onClick={() => setDecoded(null)}>
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <p class="note" role="alert">
              {t(`settings.error.${decoded.error}`)}
            </p>
          ))}
      </div>
    </section>
  );
}
