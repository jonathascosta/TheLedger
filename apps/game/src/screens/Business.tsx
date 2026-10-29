import {
  BUSINESSES,
  businessRate,
  buyBusiness,
  buyOffer,
  buyUpgrade,
  candidateFor,
  cycleOf,
  hire,
  milestonesReached,
  MILESTONES,
  nextMilestone,
  profitPerCycle,
  UPGRADES,
  type GameState,
} from '@ledger/engine';
import { BusinessDoodle } from '../art/Doodles.tsx';
import { Portrait } from '../art/Portrait.tsx';
import { UpgradeIcon } from '../art/UpgradeIcon.tsx';
import { Storefront } from '../art/Storefront.tsx';
import { t, tk } from '../i18n/index.ts';
import { act } from '../store.ts';
import { Page } from '../ui/Page.tsx';
import { duration, moneyShort } from '../ui/format.ts';

export function Business({ state, index }: { state: GameState; index: number }) {
  const def = BUSINESSES[index]!;
  const b = state.volume.businesses[index]!;
  const name = tk(`biz.${def.id}`);
  const manager = state.volume.managers[index];
  const next = nextMilestone(b.level);
  const prev = MILESTONES[milestonesReached(b.level) - 1] ?? 0;
  const steps = next ? Math.min(10, Math.floor(((b.level - prev) / (next - prev)) * 10)) : 10;
  const offer = buyOffer(state, index);
  const upgrades = UPGRADES.filter(
    (u) => u.effect.kind === 'business' && u.effect.business === index,
  );
  const candidate = candidateFor(state, index);
  return (
    <Page>
      <div class="row">
        <span class="sticker" style={{ width: '56px', height: '56px', transform: 'rotate(-6deg)' }}>
          <BusinessDoodle index={index} size={40} />
        </span>
        <h1 class="h1" style={{ fontSize: '36px' }}>
          {name}
        </h1>
      </div>
      <Storefront index={index} name={name} />
      {b.level === 0 ? (
        <p class="hand" style={{ fontSize: '20px' }}>
          {t('business.openFirst')}
        </p>
      ) : (
        <>
          <div class="row">
            <div class="grow">
              <p class="h3">
                {next
                  ? t('business.levelTo', { level: b.level, next })
                  : t('business.maxLevel', { level: b.level })}
              </p>
              <div
                role="img"
                aria-label={next ? t('business.toMilestone', { count: next - b.level }) : ''}
                style={{ marginTop: '4px' }}
              >
                <svg aria-hidden="true" viewBox="0 0 160 18" width="160" height="18">
                  <g style={{ stroke: 'var(--ink)' }} stroke-width="1.4">
                    {Array.from({ length: 10 }, (_, i) => (
                      <rect
                        key={i}
                        x={1 + i * 16}
                        y="1"
                        width="14"
                        height="16"
                        fill={i < steps ? 'url(#hatch-ink)' : 'none'}
                      />
                    ))}
                  </g>
                </svg>
              </div>
              {next && <p class="tiny">{t('business.toMilestone', { count: next - b.level })}</p>}
            </div>
            <button
              type="button"
              class="btn"
              disabled={state.volume.cash < offer.cost}
              onClick={() => act((s) => buyBusiness(s, index))}
            >
              {t('ledger.buy', { count: offer.count })}
              <br />
              <strong>{moneyShort(offer.cost)}</strong>
            </button>
          </div>
          <div class="stack" style={{ gap: '2px' }}>
            <p class="dotted">
              <span>{t('business.income')}</span>
              <span class="leader" />
              <b>{t('common.perSecond', { amount: moneyShort(businessRate(state, index)) })}</b>
            </p>
            <p class="dotted">
              <span>{t('business.perCycle')}</span>
              <span class="leader" />
              <b>{moneyShort(profitPerCycle(state, index))}</b>
            </p>
            <p class="dotted">
              <span>{t('business.cycle')}</span>
              <span class="leader" />
              <b>
                {cycleOf(state, index).seconds < 1
                  ? `${cycleOf(state, index).seconds.toFixed(2)} s`
                  : duration(cycleOf(state, index).seconds)}
              </b>
            </p>
          </div>
        </>
      )}
      <h2 class="h2" style={{ fontSize: '26px' }}>
        {t('business.improvements')}
      </h2>
      <div class="stack" style={{ gap: 0 }}>
        {upgrades.map((u) => {
          const owned = state.volume.upgrades.includes(u.id);
          return (
            <button
              key={u.id}
              type="button"
              class="check"
              disabled={owned || b.level === 0 || state.volume.cash < u.cost}
              style={owned ? { opacity: 1 } : undefined}
              onClick={() => act((s) => buyUpgrade(s, u.id))}
            >
              <UpgradeIcon upgrade={u} bought={owned} size={34} />
              <span class="grow">{tk(`upgrade.${u.id}`)} · ×3</span>
              <span class={owned ? 'cost profit' : 'cost'}>{owned ? '✓' : moneyShort(u.cost)}</span>
            </button>
          );
        })}
      </div>
      <div class="index-card row" style={{ transform: 'rotate(1deg)', marginTop: '6px' }}>
        <Portrait seed={manager?.face ?? candidate.face} />
        <div class="grow">
          {manager ? (
            <>
              <p class="h3">{t('business.manager', { name: manager.name })}</p>
              <p class="tiny">
                {tk(`trait.${manager.trait}`)} · {tk(`trait.${manager.trait}.desc`)}
              </p>
            </>
          ) : (
            <>
              <p class="h3">{t('business.noManager')}</p>
              <p class="tiny">
                {candidate.name} · {tk(`trait.${candidate.trait}`)} ·{' '}
                {tk(`trait.${candidate.trait}.desc`)}
              </p>
            </>
          )}
        </div>
        {!manager && b.level > 0 && (
          <button
            type="button"
            class="btn"
            disabled={state.volume.cash < candidate.cost}
            onClick={() => act((s) => hire(s, index))}
          >
            {t('classifieds.hire', { amount: moneyShort(candidate.cost) })}
          </button>
        )}
      </div>
    </Page>
  );
}
