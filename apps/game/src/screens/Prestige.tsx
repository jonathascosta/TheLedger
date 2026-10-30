import {
  buyPartner,
  canRetire,
  eraClaimed,
  heirOf,
  LEGACY_BONUS,
  legacyClaim,
  retire,
  claimable,
  closeVolume,
  closingBonus,
  GOODWILL_BONUS,
  PARTNERS,
  type GameState,
} from '@ledger/engine';
import { useRef, useState } from 'preact/hooks';
import { Cover, coverFor } from '../art/Covers.tsx';
import { roman, t, tk } from '../i18n/index.ts';
import { sponsorsOffered, useWatching } from '../sponsor.ts';
import { act, grant } from '../store.ts';
import { go, switchTab } from '../router.ts';
import { Page } from '../ui/Page.tsx';
import { Sponsor } from '../ui/Sponsor.tsx';
import { moneyShort, percent, plain } from '../ui/format.ts';

export function Close({ state }: { state: GameState }) {
  const [sealed, setSealed] = useState<{ number: number; goodwill: number } | null>(null);
  // Confirmed, and the closing sponsor on offer before the seal.
  const [asking, setAsking] = useState(false);
  // The volume closes once, whatever a late ad answers.
  const closed = useRef(false);
  const watching = useWatching();
  const claim = claimable(state);
  const v = state.volume;
  if (sealed) {
    return (
      <Page>
        <h1 class="h1 center">{t('close.sealed', { roman: roman(sealed.number) })}</h1>
        <div style={{ position: 'relative', alignSelf: 'center', marginTop: '10px' }}>
          <Cover
            kind={coverFor(state.meta.shelf[state.meta.shelf.length - 1]?.peakNetWorth ?? 0)}
            title={t('app.title')}
            subtitle={`Vol. ${roman(sealed.number)}`}
            width={170}
          />
          <svg
            class="seal-in"
            aria-hidden="true"
            viewBox="0 0 100 100"
            width="90"
            height="90"
            style={{ position: 'absolute', right: '-30px', bottom: '20px' }}
          >
            <g filter="url(#wax)">
              <path
                d="M50 7 C63 6 71 13 80 18 C91 25 93 38 93 50 C94 63 88 74 80 82 C71 91 61 94 50 93 C37 94 26 89 19 81 C10 72 6 61 7 50 C6 37 12 26 20 19 C29 11 38 8 50 7Z"
                style={{ fill: 'var(--wax)' }}
              />
              <circle
                cx="50"
                cy="50"
                r="30"
                fill="none"
                style={{ stroke: 'rgba(0,0,0,0.3)' }}
                stroke-width="3"
              />
            </g>
            <text
              x="50"
              y="60"
              text-anchor="middle"
              font-family="IM Fell English, serif"
              font-size="28"
              style={{ fill: 'rgba(0,0,0,0.45)' }}
            >
              {roman(sealed.number)}
            </text>
          </svg>
        </div>
        <p
          class="hand profit center"
          style={{ fontWeight: 700, fontSize: '28px', marginTop: '18px' }}
        >
          {t('shelf.goodwill', { goodwill: plain(sealed.goodwill) })}
        </p>
        <button
          type="button"
          class="stamp-btn green"
          style={{ alignSelf: 'center' }}
          onClick={() => switchTab('ledger')}
        >
          {t('close.next', { roman: roman(sealed.number + 1) })}
        </button>
      </Page>
    );
  }
  const after = GOODWILL_BONUS * (state.meta.goodwill + claim);
  const seal = (sponsored: boolean): void => {
    if (closed.current) return;
    closed.current = true;
    const number = state.volume.number;
    const goodwill = (sponsored ? grant : act)((s) => closeVolume(s, Date.now(), sponsored));
    setSealed({ number, goodwill });
  };
  return (
    <Page>
      <h1 class="h1">{t('close.title')}</h1>
      <p class="hand" style={{ fontSize: '20px', lineHeight: 1.2 }}>
        {t('close.lead')}
      </p>
      <div class="stack" style={{ gap: '2px' }}>
        <p class="dotted">
          <span>{t('close.claim')}</span>
          <span class="leader" />
          <b class="profit">+{plain(claim)}</b>
        </p>
        <p class="dotted">
          <span>{t('close.held')}</span>
          <span class="leader" />
          <b>{plain(state.meta.goodwill)}</b>
        </p>
        <p class="dotted">
          <span>{t('close.after')}</span>
          <span class="leader" />
          <b>{t('close.bonus', { percent: percent(after, false) })}</b>
        </p>
      </div>
      <div style={{ alignSelf: 'center' }}>
        <Cover
          kind={coverFor(v.peakNetWorth)}
          title={t('app.title')}
          subtitle={`Vol. ${roman(v.number)}`}
          width={150}
        />
      </div>
      {claim > 0 && asking ? (
        <div class="stack" style={{ alignItems: 'center' }}>
          <Sponsor
            title={t('closing.sponsorTitle')}
            reward={t('closing.sponsorReward', { goodwill: plain(closingBonus(claim)) })}
            onEarned={() => seal(true)}
            onSkipped={() => seal(false)}
          />
          <button
            type="button"
            class="stamp-btn red"
            disabled={watching}
            onClick={() => seal(false)}
          >
            {t('closing.without')}
          </button>
        </div>
      ) : claim > 0 ? (
        <button
          type="button"
          class="stamp-btn red"
          style={{ alignSelf: 'center', marginTop: '10px' }}
          onClick={() => (sponsorsOffered() ? setAsking(true) : seal(false))}
        >
          {t('close.confirm')}
        </button>
      ) : (
        <p class="hand loss" style={{ fontSize: '20px' }}>
          {t('close.nothing')}
        </p>
      )}
    </Page>
  );
}

/** The pencilled line on how close the founder is to retiring (or that Retire is open). */
function RetireProgress({ state }: { state: GameState }) {
  return (
    <p class="hand muted" style={{ fontSize: '19px' }}>
      {canRetire(state)
        ? t('retire.isOpen')
        : t('retire.progress', { claimed: plain(eraClaimed(state)) })}
    </p>
  );
}

/** Rows of the shelf, one per era: its books and, for the current era, the open volume. */
function EraRows({
  state,
  eras,
  width = 44,
}: {
  state: GameState;
  eras: number[];
  width?: number;
}) {
  return (
    <div class="stack" style={{ gap: '6px' }}>
      {eras.map((era) => {
        const heir = heirOf(state, era);
        const books = state.meta.shelf.filter((e) => (e.era ?? 1) === era);
        return (
          <div key={era} class="stack" style={{ gap: '4px' }}>
            <p class="caps">
              {t('shelf.era', { era: roman(era), name: `${heir.first} ${heir.surname}` })}
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                alignItems: 'flex-end',
                borderBottom: '5px solid var(--sticker-warm)',
                paddingBottom: '3px',
              }}
            >
              {books.map((e) => (
                <Cover
                  key={e.number}
                  kind={coverFor(e.peakNetWorth)}
                  title={t('app.title')}
                  subtitle={t('shelf.volume', { roman: roman(e.number) })}
                  width={width}
                />
              ))}
              {era === state.meta.era && (
                <div style={{ opacity: 0.55 }}>
                  <Cover
                    kind={coverFor(state.volume.peakNetWorth)}
                    title={t('app.title')}
                    subtitle={t('shelf.volume', { roman: roman(state.volume.number) })}
                    width={width}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Retire, on the Partners page once it is open (docs/PRODUCT.md, The dynasty). */
function RetireCard({ state }: { state: GameState }) {
  if (!canRetire(state)) return <RetireProgress state={state} />;
  const legacy = legacyClaim(state);
  return (
    <button
      type="button"
      class="index-card"
      style={{ textAlign: 'left' }}
      onClick={() => go({ name: 'retire' })}
    >
      <p class="h3">{t('retire.title')}</p>
      <p class="hand" style={{ fontSize: '19px', lineHeight: 1.15 }}>
        {t('retire.cardLead', {
          legacy: plain(legacy),
          factor: plain(1 + LEGACY_BONUS * (state.meta.legacy + legacy), 1),
        })}
      </p>
    </button>
  );
}

/** Retiring: what the heir gets, then the ceremony. */
export function Retire({ state }: { state: GameState }) {
  const [done, setDone] = useState<{ era: number; legacy: number } | null>(null);
  const once = useRef(false);
  if (done) {
    const heir = heirOf(state, done.era);
    return (
      <Page>
        <h1 class="h1 center">{t('retire.begins', { era: roman(done.era) })}</h1>
        <div style={{ position: 'relative', alignSelf: 'center', marginTop: '10px' }}>
          <Cover
            kind="leather"
            title={t('app.title')}
            subtitle={t('common.era', { era: roman(done.era - 1) })}
            width={170}
          />
          <svg
            class="seal-in"
            aria-hidden="true"
            viewBox="0 0 120 30"
            width="150"
            height="38"
            style={{
              position: 'absolute',
              left: '10px',
              bottom: '40px',
              transform: 'rotate(-18deg)',
            }}
          >
            <g style={{ stroke: 'var(--ink)' }} stroke-width="2" stroke-linejoin="round">
              <path d="M6 15 L86 9 L104 15 L86 21 Z" style={{ fill: 'var(--ink)' }} />
              <path d="M104 15 L116 15" />
              <path d="M24 13.5 L24 16.5" style={{ stroke: 'var(--gold)' }} />
            </g>
          </svg>
        </div>
        <p
          class="hand profit center"
          style={{ fontWeight: 700, fontSize: '26px', marginTop: '18px' }}
        >
          {heir.first} {heir.surname} · {t('retire.legacyEarned', { legacy: plain(done.legacy) })}
        </p>
        <EraRows state={state} eras={[done.era - 1, done.era]} />
        <button
          type="button"
          class="stamp-btn green"
          style={{ alignSelf: 'center' }}
          onClick={() => switchTab('ledger')}
        >
          {t('retire.open')}
        </button>
      </Page>
    );
  }
  if (!canRetire(state)) {
    return (
      <Page>
        <h1 class="h1">{t('retire.title')}</h1>
        <RetireProgress state={state} />
      </Page>
    );
  }
  const legacy = legacyClaim(state);
  const heir = heirOf(state, state.meta.era + 1);
  const confirm = (): void => {
    if (once.current) return;
    once.current = true;
    const era = state.meta.era + 1;
    const result = act((s) => retire(s, Date.now()));
    if (result.ok) setDone({ era, legacy: result.legacy ?? legacy });
  };
  return (
    <Page>
      <h1 class="h1">{t('retire.title')}</h1>
      <p class="hand" style={{ fontSize: '20px', lineHeight: 1.2 }}>
        {t('retire.lead')}
      </p>
      <div class="stack" style={{ gap: '2px' }}>
        <p class="dotted">
          <span>{t('retire.legacy')}</span>
          <span class="leader" />
          <b class="profit">+{plain(legacy)}</b>
        </p>
        <p class="dotted">
          <span>{t('retire.factor')}</span>
          <span class="leader" />
          <b>×{plain(1 + LEGACY_BONUS * (state.meta.legacy + legacy), 1)}</b>
        </p>
        <p class="dotted">
          <span>{t('retire.heir')}</span>
          <span class="leader" />
          <b>
            {heir.first} {heir.surname}
          </b>
        </p>
      </div>
      <p class="small">{t('retire.keeps')}</p>
      <button
        type="button"
        class="stamp-btn red"
        style={{ alignSelf: 'center', marginTop: '10px' }}
        onClick={confirm}
      >
        {t('retire.confirm')}
      </button>
    </Page>
  );
}

export function Partners({ state }: { state: GameState }) {
  const gw = state.meta.goodwill;
  return (
    <Page>
      <h1 class="h1">{t('partners.title')}</h1>
      <RetireCard state={state} />
      <p class="small">{t('partners.subtitle')}</p>
      <p class="hand profit" style={{ fontWeight: 700, fontSize: '23px' }}>
        {t('partners.goodwill', {
          amount: plain(gw),
          percent: percent(gw * GOODWILL_BONUS, false),
        })}
      </p>
      <div class="stack" style={{ gap: '10px' }}>
        {PARTNERS.map((p, i) => {
          const owned = state.meta.partners.includes(p.id);
          return (
            <div
              key={p.id}
              class="index-card row"
              style={{ transform: `rotate(${i % 2 ? 0.8 : -0.6}deg)` }}
            >
              <div class="grow">
                <p class="h3">{tk(`partner.${p.id}.name`)}</p>
                <p class="tiny">{tk(`partner.${p.id}.desc`)}</p>
              </div>
              {owned ? (
                <p class="hand profit" style={{ fontSize: '21px' }}>
                  ✓ {t('partners.yours')}
                </p>
              ) : (
                <button
                  type="button"
                  class="btn"
                  disabled={gw < p.cost}
                  onClick={() => act((s) => buyPartner(s, p.id))}
                >
                  {t('partners.hire', { cost: p.cost })}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Page>
  );
}

export function Shelf({ state }: { state: GameState }) {
  const shelf = state.meta.shelf;
  const eras = [...new Set([...shelf.map((e) => e.era ?? 1), state.meta.era])].sort(
    (a, b) => a - b,
  );
  const book = (number: number, peak: number, open = false) => (
    <div
      key={number}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        opacity: open ? 0.55 : 1,
      }}
    >
      <Cover
        kind={coverFor(peak)}
        title={t('app.title')}
        subtitle={t('shelf.volume', { roman: roman(number) })}
        width={80}
      />
    </div>
  );
  return (
    <Page>
      <h1 class="h1">{t('shelf.title')}</h1>
      {shelf.length === 0 && (
        <p class="hand" style={{ fontSize: '20px' }}>
          {t('shelf.empty')}
        </p>
      )}
      {eras.map((era) => {
        const heir = heirOf(state, era);
        return (
          <div key={era} class="stack" style={{ gap: '6px' }}>
            <p class="caps">
              {t('shelf.era', { era: roman(era), name: `${heir.first} ${heir.surname}` })}
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '14px',
                alignItems: 'flex-end',
                borderBottom: '6px solid var(--sticker-warm)',
                paddingBottom: '4px',
              }}
            >
              {shelf.filter((e) => (e.era ?? 1) === era).map((e) => book(e.number, e.peakNetWorth))}
              {era === state.meta.era && book(state.volume.number, state.volume.peakNetWorth, true)}
            </div>
            <div class="stack" style={{ gap: '2px' }}>
              {shelf
                .filter((e) => (e.era ?? 1) === era)
                .map((e) => (
                  <p key={e.number} class="dotted">
                    <span>{t('shelf.volume', { roman: roman(e.number) })}</span>
                    <span class="leader" />
                    <span>
                      {t('shelf.peak', { amount: moneyShort(e.peakNetWorth) })} ·{' '}
                      <b class="profit">{t('shelf.goodwill', { goodwill: plain(e.goodwill) })}</b>
                    </span>
                  </p>
                ))}
              {era === state.meta.era && (
                <p class="dotted muted">
                  <span>{t('shelf.current', { roman: roman(state.volume.number) })}</span>
                  <span class="leader" />
                  <span>{t('shelf.peak', { amount: moneyShort(state.volume.peakNetWorth) })}</span>
                </p>
              )}
            </div>
          </div>
        );
      })}
      <RetireProgress state={state} />
    </Page>
  );
}
