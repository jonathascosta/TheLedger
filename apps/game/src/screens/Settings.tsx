import { netWorth, type GameState, type Lang } from '@ledger/engine';
import { useEffect, useRef, useState } from 'preact/hooks';
import { setLang, deviceLang, lang, roman, t } from '../i18n/index.ts';
import { decodeBackup, encodeBackup, type Decoded } from '../persist/backup.ts';
import { act, eraseSave, game, restoreGame } from '../store.ts';
import { switchTab } from '../router.ts';
import { money } from '../ui/format.ts';
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
      <Backup />
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
                {t('settings.preview', {
                  roman: roman(decoded.state.volume.number),
                  worth: money(netWorth(decoded.state)),
                  date: madeOn(decoded.madeAt),
                })}
              </p>
              <p class="hand loss" style={{ fontSize: '20px' }}>
                {t('settings.restoreConfirm')}
              </p>
              <div class="row">
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
