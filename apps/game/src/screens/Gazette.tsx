import {
  answer,
  boldWins,
  EDITION_SECONDS,
  eventOf,
  grant,
  hasPartner,
  isUnlocked,
  markRead,
  type ChoiceId,
  type GameState,
} from '@ledger/engine';
import { useEffect } from 'preact/hooks';
import { Engraving } from '../art/Engraving.tsx';
import { t, tk } from '../i18n/index.ts';
import { act } from '../store.ts';
import { go } from '../router.ts';
import { Page } from '../ui/Page.tsx';
import { duration, moneyShort } from '../ui/format.ts';

const COUPONS: readonly {
  id: ChoiceId;
  title: 'paper.bold' | 'paper.careful' | 'paper.hold';
  desc: 'paper.boldDesc' | 'paper.carefulDesc' | 'paper.holdDesc';
  rot: string;
}[] = [
  { id: 'bold', title: 'paper.bold', desc: 'paper.boldDesc', rot: '-0.6deg' },
  { id: 'careful', title: 'paper.careful', desc: 'paper.carefulDesc', rot: '0.5deg' },
  { id: 'hold', title: 'paper.hold', desc: 'paper.holdDesc', rot: '-0.3deg' },
];

export function Gazette({ state }: { state: GameState }) {
  const paper = state.volume.paper;
  const event = eventOf(state);
  useEffect(() => {
    if (paper.unread) act((s) => markRead(s));
  }, [paper.edition, paper.unread]);
  const choose = (choice: ChoiceId): void => {
    act((s) => {
      const r = answer(s, choice);
      if (r.steady) grant(s, 'nervesOfSteel', Date.now());
      if (choice === 'bold' && r.delta > 0) grant(s, 'gambler', Date.now());
      return r;
    });
  };
  const nextIn = Math.max(0, (paper.nextAt - Date.now()) / 1000);
  return (
    <Page newsprint>
      <header class="center">
        <p class="print" style={{ fontSize: '36px', lineHeight: 1 }}>
          {t('paper.name')}
        </p>
        <p class="masthead" style={{ marginTop: '6px', fontSize: '11px' }}>
          {t('paper.edition', { number: paper.edition })}
        </p>
      </header>
      {!event ? (
        <p class="print center" style={{ fontSize: '18px' }}>
          {isUnlocked(state, 'stocks') ? t('paper.printing') : t('paper.none')}
        </p>
      ) : (
        <>
          <div class="center">
            <h1
              class="print"
              style={{
                fontWeight: 400,
                fontSize: '32px',
                lineHeight: 1,
                textTransform: 'uppercase',
              }}
            >
              {tk(`event.${event.id}.head`)}
            </h1>
            <p class="print" style={{ fontStyle: 'italic', fontSize: '16px', marginTop: '6px' }}>
              {tk(`event.${event.id}.deck`)}
            </p>
          </div>
          <Engraving event={event.id} label={t('paper.engraving')} />
          <div
            class="grid2"
            style={{ columnGap: '18px', fontSize: '13px', lineHeight: 1.35, textAlign: 'justify' }}
          >
            <p class="print" style={{ paddingRight: '9px', borderRight: '1px solid #2b2620' }}>
              {tk(`event.${event.id}.a`)}
            </p>
            <p class="print">{tk(`event.${event.id}.b`)}</p>
          </div>
          <p class="h2" style={{ color: 'var(--ink)' }}>
            {t('paper.what')}
          </p>
          {paper.answer ? (
            <p
              class="hand"
              style={{
                fontSize: '22px',
                color: paper.answer.delta >= 0 ? 'var(--profit)' : 'var(--loss)',
              }}
            >
              {paper.answer.choice === 'hold'
                ? t('paper.result.hold')
                : t(paper.answer.delta >= 0 ? 'paper.result.win' : 'paper.result.lose', {
                    choice: t(paper.answer.choice === 'bold' ? 'paper.bold' : 'paper.careful'),
                    amount: moneyShort(Math.abs(paper.answer.delta)),
                  })}
            </p>
          ) : (
            <div class="stack" style={{ gap: '8px' }}>
              {hasPartner(state, 'insider') && (
                <p class="hand loss" style={{ fontSize: '19px' }}>
                  {t('paper.insider', {
                    result: t(boldWins(state) ? 'paper.insiderWin' : 'paper.insiderLose'),
                  })}
                </p>
              )}
              {COUPONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  class="coupon"
                  style={{ transform: `rotate(${c.rot})`, color: 'var(--ink)' }}
                  onClick={() => choose(c.id)}
                >
                  <span style={{ display: 'flex', flexDirection: 'column' }}>
                    <span class="hand" style={{ fontWeight: 700, fontSize: '22px', lineHeight: 1 }}>
                      {t(c.title)}
                    </span>
                    <span class="type tiny">{t(c.desc)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
      <p class="type tiny">
        {t('paper.next', { duration: duration(paper.edition > 0 ? nextIn : EDITION_SECONDS) })}
      </p>
      <button
        type="button"
        class="btn-link print"
        style={{ fontSize: '18px', alignSelf: 'flex-end' }}
        onClick={() => go({ name: 'classifieds' })}
      >
        {t('paper.classifieds')}
      </button>
    </Page>
  );
}
