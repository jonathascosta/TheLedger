import {
  businessIncome,
  classValues,
  CLASS_UNLOCKS,
  isUnlocked,
  netWorth,
  type AssetClass,
  type GameState,
} from '@ledger/engine';
import { Icon } from '../art/Doodles.tsx';
import { Donut, Swatch } from '../art/Donut.tsx';
import { t } from '../i18n/index.ts';
import { go, type Route } from '../router.ts';
import { Page } from '../ui/Page.tsx';
import { moneyShort } from '../ui/format.ts';

const ROUTES: Record<AssetClass, Route> = {
  businesses: { name: 'ledger' },
  stocks: { name: 'market', kind: 'stock' },
  bonds: { name: 'bonds' },
  realEstate: { name: 'estate' },
  commodities: { name: 'market', kind: 'commodity' },
  crypto: { name: 'market', kind: 'coin' },
  startups: { name: 'startups' },
  art: { name: 'art' },
  energy: { name: 'energy' },
};

export function Portfolio({ state }: { state: GameState }) {
  const values = classValues(state, businessIncome(state) * 3600);
  const classes = CLASS_UNLOCKS.map((c, i) => ({
    ...c,
    pattern: i + 1,
    value: values[c.id],
    open: isUnlocked(state, c.id),
  }));
  const open = classes.filter((c) => c.open);
  const locked = classes.filter((c) => !c.open);
  const total = open.reduce((s, c) => s + c.value, 0);
  return (
    <Page>
      <div class="between">
        <h1 class="h1">{t('portfolio.title')}</h1>
        <p class="small">{t('portfolio.classes', { open: open.length, total: classes.length })}</p>
      </div>
      <Donut
        parts={open.map((c) => ({ value: c.value, pattern: c.pattern }))}
        label={t('portfolio.chartLabel')}
        center={moneyShort(netWorth(state))}
        caption={t('ledger.netWorth').toLowerCase()}
      />
      <div class="stack" style={{ gap: 0 }}>
        {open.map((c) => (
          <button
            key={c.id}
            type="button"
            class="row"
            style={{
              minHeight: '44px',
              border: 'none',
              background: 'transparent',
              padding: 0,
              textAlign: 'left',
            }}
            onClick={() => go(ROUTES[c.id])}
          >
            <Swatch pattern={c.pattern} />
            <span class="hand grow" style={{ fontSize: '22px' }}>
              {t(`class.${c.id}`)}
            </span>
            <span class="small">{moneyShort(c.value)}</span>
            <span class="hand" style={{ fontSize: '21px', minWidth: '48px', textAlign: 'right' }}>
              {total > 0 ? `${Math.round((c.value / total) * 100)}%` : '–'}
            </span>
          </button>
        ))}
      </div>
      <p class="tiny">{t('portfolio.businessesNote')}</p>
      {locked.length > 0 && (
        <>
          <h2 class="h2" style={{ fontSize: '26px' }}>
            {t('portfolio.toUnlock')}
          </h2>
          <div class="grid2">
            {locked.map((c) => (
              <div key={c.id} class="locked-card">
                <Icon.lock />
                <span style={{ display: 'flex', flexDirection: 'column' }}>
                  <span
                    class="hand"
                    style={{ fontWeight: 700, fontSize: '19px', lineHeight: 1.05 }}
                  >
                    {t(`class.${c.id}`)}
                  </span>
                  <span class="tiny">{t('portfolio.at', { amount: moneyShort(c.at) })}</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Page>
  );
}
