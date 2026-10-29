import {
  buyPartner,
  claimable,
  closeVolume,
  closingBonus,
  GOODWILL_BONUS,
  PARTNERS,
  type GameState,
} from '@ledger/engine';
import { useState } from 'preact/hooks';
import { Cover, coverFor } from '../art/Covers.tsx';
import { roman, t, tk } from '../i18n/index.ts';
import { sponsorsOffered } from '../sponsor.ts';
import { act, grant } from '../store.ts';
import { switchTab } from '../router.ts';
import { Page } from '../ui/Page.tsx';
import { Sponsor } from '../ui/Sponsor.tsx';
import { moneyShort, percent, plain } from '../ui/format.ts';

export function Close({ state }: { state: GameState }) {
  const [sealed, setSealed] = useState<{ number: number; goodwill: number } | null>(null);
  // Confirmed, and the closing sponsor on offer before the seal.
  const [asking, setAsking] = useState(false);
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
          />
          <button type="button" class="stamp-btn red" onClick={() => seal(false)}>
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

export function Partners({ state }: { state: GameState }) {
  const gw = state.meta.goodwill;
  return (
    <Page>
      <h1 class="h1">{t('partners.title')}</h1>
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
  return (
    <Page>
      <h1 class="h1">{t('shelf.title')}</h1>
      {shelf.length === 0 && (
        <p class="hand" style={{ fontSize: '20px' }}>
          {t('shelf.empty')}
        </p>
      )}
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
        {shelf.map((e) => (
          <div
            key={e.number}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
          >
            <Cover
              kind={coverFor(e.peakNetWorth)}
              title={t('app.title')}
              subtitle={t('shelf.volume', { roman: roman(e.number) })}
              width={80}
            />
          </div>
        ))}
        <div style={{ opacity: 0.55 }}>
          <Cover
            kind={coverFor(state.volume.peakNetWorth)}
            title={t('app.title')}
            subtitle={t('shelf.volume', { roman: roman(state.volume.number) })}
            width={80}
          />
        </div>
      </div>
      <div class="stack" style={{ gap: '2px' }}>
        {shelf.map((e) => (
          <p key={e.number} class="dotted">
            <span>{t('shelf.volume', { roman: roman(e.number) })}</span>
            <span class="leader" />
            <span>
              {t('shelf.peak', { amount: moneyShort(e.peakNetWorth) })} ·{' '}
              <b class="profit">{t('shelf.goodwill', { goodwill: plain(e.goodwill) })}</b>
            </span>
          </p>
        ))}
        <p class="dotted muted">
          <span>{t('shelf.current', { roman: roman(state.volume.number) })}</span>
          <span class="leader" />
          <span>{t('shelf.peak', { amount: moneyShort(state.volume.peakNetWorth) })}</span>
        </p>
      </div>
    </Page>
  );
}
