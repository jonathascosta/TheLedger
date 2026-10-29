import { BUSINESSES, buyUpgrade, UPGRADES, type GameState, type UpgradeDef } from '@ledger/engine';
import { UpgradeIcon } from '../art/UpgradeIcon.tsx';
import { t, tk } from '../i18n/index.ts';
import { act } from '../store.ts';
import { Page } from '../ui/Page.tsx';
import { moneyShort } from '../ui/format.ts';

function effectText(u: UpgradeDef): string {
  const e = u.effect;
  if (e.kind === 'business')
    return t('upgrades.effect.business', { name: tk(`biz.${BUSINESSES[e.business]!.id}`) });
  return e.kind === 'all' ? t('upgrades.effect.all') : t('upgrades.effect.desk');
}

export function Upgrades({ state }: { state: GameState }) {
  const v = state.volume;
  const usable = (u: UpgradeDef): boolean =>
    u.effect.kind !== 'business' || v.businesses[u.effect.business]!.level > 0;
  const offer = UPGRADES.filter((u) => !v.upgrades.includes(u.id) && usable(u)).slice(0, 12);
  const bought = UPGRADES.filter((u) => v.upgrades.includes(u.id));
  return (
    <Page>
      <h1 class="h1">{t('upgrades.title')}</h1>
      <p class="caps">{t('upgrades.available')}</p>
      {offer.length === 0 && (
        <p class="hand" style={{ fontSize: '20px' }}>
          {t('upgrades.none')}
        </p>
      )}
      <div class="stack" style={{ gap: '6px' }}>
        {offer.map((u) => (
          <div key={u.id} class="row" style={{ minHeight: '52px' }}>
            <UpgradeIcon upgrade={u} />
            <div class="grow">
              <p class="h3" style={{ fontSize: '20px' }}>
                {tk(`upgrade.${u.id}`)}
              </p>
              <p class="tiny">{effectText(u)}</p>
            </div>
            <button
              type="button"
              class="btn"
              disabled={v.cash < u.cost}
              onClick={() => act((s) => buyUpgrade(s, u.id))}
            >
              {t('upgrades.buy')}
              <br />
              <strong>{moneyShort(u.cost)}</strong>
            </button>
          </div>
        ))}
      </div>
      {bought.length > 0 && (
        <>
          <p class="caps" style={{ marginTop: '8px' }}>
            {t('upgrades.bought')} · {bought.length}
          </p>
          <div class="stack" style={{ gap: 0 }}>
            {bought.map((u) => (
              <div key={u.id} class="row" style={{ minHeight: '44px' }}>
                <UpgradeIcon upgrade={u} bought size={34} />
                <p class="hand" style={{ fontSize: '19px' }}>
                  {tk(`upgrade.${u.id}`)} <span class="tiny">· {effectText(u)}</span>
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </Page>
  );
}
