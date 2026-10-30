import { BUSINESSES, candidates, headhunt, hire, offerLeft, type GameState } from '@ledger/engine';
import { Portrait } from '../art/Portrait.tsx';
import { t, tk } from '../i18n/index.ts';
import { sponsorsOffered, today } from '../sponsor.ts';
import { askIfDue } from '../notes/notes.ts';
import { act, grant } from '../store.ts';
import { Page } from '../ui/Page.tsx';
import { Sponsor } from '../ui/Sponsor.tsx';
import { moneyShort } from '../ui/format.ts';

export function Classifieds({ state }: { state: GameState }) {
  const list = candidates(state);
  const staff = state.volume.managers
    .map((m, i) => (m ? { ...m, business: i } : null))
    .filter((m) => m !== null);
  return (
    <Page newsprint>
      <p class="masthead">{t('paper.name')}</p>
      <h1
        class="print"
        style={{ fontSize: '34px', textAlign: 'center', textTransform: 'uppercase' }}
      >
        {t('classifieds.title')}
      </h1>
      <p class="print center" style={{ fontStyle: 'italic' }}>
        {t('classifieds.subtitle')}
      </p>
      {list.length === 0 && (
        <p class="hand center" style={{ fontSize: '20px' }}>
          {t('classifieds.none')}
        </p>
      )}
      {sponsorsOffered() && list.length > 0 && (
        <Sponsor
          title={t('headhunter.title')}
          reward={t('headhunter.reward')}
          detail={t('sponsor.left', { count: offerLeft(state, 'headhunter', today()) })}
          spent={offerLeft(state, 'headhunter', today()) === 0}
          onEarned={() => grant((s) => headhunt(s, today()))}
        />
      )}
      <div class="grid2" style={{ gap: '8px' }}>
        {list.map((c) => (
          <div
            key={c.business}
            style={{
              border: '1.5px solid #2b2620',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              background: 'var(--newsprint)',
            }}
          >
            <p
              class="print"
              style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              {t('classifieds.for', { business: tk(`biz.${BUSINESSES[c.business]!.id}`) })}
            </p>
            <div class="row" style={{ gap: '6px' }}>
              <Portrait seed={c.face} size={42} />
              <p class="hand" style={{ fontWeight: 700, fontSize: '21px', lineHeight: 1 }}>
                {c.name}
              </p>
            </div>
            <p class="print" style={{ fontSize: '13px', lineHeight: 1.25 }}>
              {t('classifieds.cv', { years: c.years, trait: tk(`trait.${c.trait}`) })} —{' '}
              {tk(`trait.${c.trait}.desc`)}.
            </p>
            {c.star && (
              <p class="hand loss" style={{ fontWeight: 700, fontSize: '18px', lineHeight: 1.1 }}>
                {t('classifieds.star')}
              </p>
            )}
            <button
              type="button"
              class="btn"
              style={{ fontSize: '18px' }}
              disabled={state.volume.cash < c.cost}
              onClick={() => {
                if (act((s) => hire(s, c.business)).ok) void askIfDue();
              }}
            >
              {t('classifieds.hire', { amount: moneyShort(c.cost) })}
            </button>
          </div>
        ))}
      </div>
      {staff.length > 0 && (
        <>
          <p class="masthead" style={{ marginTop: '10px' }}>
            {t('classifieds.staff')}
          </p>
          {staff.map((m) => (
            <div key={m.business} class="row">
              <Portrait seed={m.face} size={36} />
              <p class="hand" style={{ fontSize: '19px' }}>
                {m.star ? '★ ' : ''}
                {m.name} · {tk(`biz.${BUSINESSES[m.business]!.id}`)} · {tk(`trait.${m.trait}`)}
              </p>
            </div>
          ))}
        </>
      )}
    </Page>
  );
}
