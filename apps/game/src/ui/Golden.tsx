import {
  goldenOnDesk,
  goldenValue,
  offerLeft,
  payGolden,
  takeGolden,
  type GameState,
} from '@ledger/engine';
import { t } from '../i18n/index.ts';
import { today, sponsorsOffered, useWatching } from '../sponsor.ts';
import { act, grant } from '../store.ts';
import { moneyShort } from './format.ts';
import { Sponsor } from './Sponsor.tsx';

/** Whether a sponsor can still raise the golden invoice today. */
function sponsorable(state: GameState): boolean {
  return sponsorsOffered() && offerLeft(state, 'golden', today()) > 0;
}

/**
 * The golden invoice on the desk or the ledger page (docs/PRODUCT.md, The front desk): the tap
 * takes it; with a sponsor on offer the choice opens (`GoldenOffer`), otherwise it pays its
 * minute at once.
 */
export function GoldenInvoice({ state }: { state: GameState }) {
  if (!goldenOnDesk(state, Date.now())) return null;
  const onClick = (): void => {
    act((s) => {
      if (!takeGolden(s, Date.now())) return;
      if (!sponsorable(s)) payGolden(s, today(), false);
    });
  };
  return (
    <button type="button" class="golden" onClick={onClick}>
      <span class="golden-title">{t('golden.title')}</span>
      <span class="golden-amount">+{moneyShort(goldenValue(state, false))}</span>
      <span class="tiny">{t('golden.tap')}</span>
    </button>
  );
}

/** The taken golden invoice: its minute, or fifteen with a sponsor. Waits while the ad plays. */
export function GoldenOffer({ state }: { state: GameState }) {
  const watching = useWatching();
  if (!state.volume.golden.taken) return null;
  const plainValue = goldenValue(state, false);
  return (
    <div class="modal page">
      <div class="scroll">
        <div class="stack" style={{ alignItems: 'center', paddingTop: '40px' }}>
          <h1 class="h1 center">{t('golden.title')}</h1>
          {sponsorable(state) && (
            <Sponsor
              title={t('golden.sponsorTitle')}
              reward={t('golden.sponsorReward', {
                amount: moneyShort(goldenValue(state, true)),
              })}
              detail={t('sponsor.left', { count: offerLeft(state, 'golden', today()) })}
              onEarned={() => grant((s) => payGolden(s, today(), true))}
            />
          )}
          <button
            type="button"
            class="stamp-btn green"
            style={{ minWidth: '240px' }}
            disabled={watching}
            onClick={() => act((s) => payGolden(s, today(), false))}
          >
            {t('golden.take', { amount: moneyShort(plainValue) })}
          </button>
        </div>
      </div>
    </div>
  );
}
