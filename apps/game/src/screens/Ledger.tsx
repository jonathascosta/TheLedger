import {
  BUSINESSES,
  businessIncome,
  businessRate,
  buyBusiness,
  buyOffer,
  candidates,
  claimable,
  collect,
  cycleOf,
  goodwillMultiplier,
  GOODWILL_BONUS,
  isAvailable,
  isUnlocked,
  levelCost,
  netWorth,
  passiveRate,
  shouldClose,
  UPGRADES,
  type BuyMode,
  type GameState,
} from '@ledger/engine';
import { BusinessDoodle, Icon } from '../art/Doodles.tsx';
import { InkChart } from '../art/InkChart.tsx';
import { roman, t, tk } from '../i18n/index.ts';
import { act } from '../store.ts';
import { go } from '../router.ts';
import { Page, Underline } from '../ui/Page.tsx';
import { money, moneyShort, plain } from '../ui/format.ts';

const MODES: readonly BuyMode[] = [1, 10, 100, 'max'];

function BusinessRow({ state, index }: { state: GameState; index: number }) {
  const b = state.volume.businesses[index]!;
  const name = tk(`biz.${BUSINESSES[index]!.id}`);
  const managed = state.volume.managers[index] !== null;
  if (b.level === 0) {
    const cost = levelCost(state, index, 1);
    return (
      <div class="biz">
        <button
          type="button"
          class="sticker"
          style={{ opacity: 0.55 }}
          aria-label={name}
          onClick={() => go({ name: 'business', index })}
        >
          <BusinessDoodle index={index} />
        </button>
        <div class="grow">
          <p class="h3">{name}</p>
          <p class="small">
            {t('common.perSecond', {
              amount: moneyShort(BUSINESSES[index]!.baseRevenue / BUSINESSES[index]!.cycle),
            })}
          </p>
        </div>
        <button
          type="button"
          class="btn"
          disabled={state.volume.cash < cost}
          onClick={() => act((s) => buyBusiness(s, index))}
        >
          {t('ledger.open')}
          <br />
          <strong>{moneyShort(cost)}</strong>
        </button>
      </div>
    );
  }
  const { seconds } = cycleOf(state, index);
  const full = b.till > 0;
  const fraction = managed && seconds < 0.3 ? 1 : Math.min(1, b.progress / seconds);
  const offer = buyOffer(state, index);
  return (
    <div class="biz">
      <button
        type="button"
        class="sticker"
        style={{ transform: `rotate(${(index % 3) * 4 - 4}deg)` }}
        aria-label={name}
        onClick={() => go({ name: 'business', index })}
      >
        <BusinessDoodle index={index} />
      </button>
      <div class="grow">
        <button
          type="button"
          class="btn-link"
          style={{ minHeight: 0, padding: 0 }}
          onClick={() => go({ name: 'business', index })}
        >
          <span class="h3">{name}</span>
        </button>
        <p class="small">
          {t('common.level', { level: b.level })} ·{' '}
          {t('common.perSecond', { amount: moneyShort(businessRate(state, index)) })}
          {managed ? ` · ${t('ledger.running')}` : ''}
        </p>
        <button
          type="button"
          class={full ? 'bar-btn full' : 'bar-btn'}
          disabled={!full}
          aria-label={full ? `${t('ledger.collect')} ${moneyShort(b.till)}` : undefined}
          onClick={() => act((s) => collect(s, index))}
        >
          <span class={full ? 'bar full' : 'bar'}>
            <span style={{ width: `${(full ? 1 : fraction) * 100}%` }} />
          </span>
          {full && (
            <span class="bar-label" aria-hidden="true">
              <span class="bar-word">{t('ledger.collect')}&nbsp;</span>
              {moneyShort(b.till)}
            </span>
          )}
        </button>
      </div>
      <button
        type="button"
        class="btn buy-btn"
        disabled={state.volume.cash < offer.cost}
        onClick={() => act((s) => buyBusiness(s, index))}
      >
        {t('ledger.buy', { count: offer.count })}
        <br />
        <strong>{moneyShort(offer.cost)}</strong>
      </button>
    </div>
  );
}

export function Ledger({ state }: { state: GameState }) {
  const v = state.volume;
  const worth = netWorth(state);
  const income = businessIncome(state) + passiveRate(state);
  const open = v.businesses.filter((b) => b.level > 0).length;
  const visible = BUSINESSES.map((_, i) => i).filter(
    (i) => v.businesses[i]!.level > 0 || isAvailable(state, i),
  );
  const nextLocked = BUSINESSES.findIndex((_, i) => !isAvailable(state, i));
  const affordableUpgrades = UPGRADES.filter(
    (u) =>
      !v.upgrades.includes(u.id) &&
      u.cost <= v.cash &&
      (u.effect.kind !== 'business' || v.businesses[u.effect.business]!.level > 0),
  ).length;
  const applicants = candidates(state).length;
  const claim = claimable(state);
  const factor = (1 + GOODWILL_BONUS * (state.meta.goodwill + claim)) / goodwillMultiplier(state);
  const hint =
    open === 0
      ? t('ledger.hintFirst')
      : v.businesses.some((b) => b.till > 0) && !v.managers.some((m) => m)
        ? t('ledger.hintCollect')
        : open >= 3 && !v.managers.some((m) => m)
          ? t('ledger.hintManager')
          : null;
  return (
    <Page>
      <div class="between">
        <p
          class="print"
          style={{
            fontSize: '13px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink-soft)',
          }}
        >
          {t('ledger.header', { roman: roman(v.number) })}
        </p>
        <p class="small">{t('ledger.cash', { amount: moneyShort(v.cash) })}</p>
      </div>
      <div>
        <p class="caps">{t('ledger.netWorth')}</p>
        <p class="big-money">{money(worth)}</p>
        <Underline>
          <span class="hand profit" style={{ fontWeight: 700, fontSize: '23px' }}>
            {t('ledger.perSecond', { amount: money(income) })}
          </span>
        </Underline>
      </div>
      {v.history.length > 2 && (
        <InkChart values={[...v.history, worth]} label={t('ledger.chartLabel')} height={120} />
      )}
      {shouldClose(state) && (
        <div class="note">
          <Icon.pencilArrow />
          <button
            type="button"
            class="btn-link"
            style={{ color: 'var(--loss)', fontSize: '20px', minHeight: 0 }}
            onClick={() => go({ name: 'close' })}
          >
            {t('ledger.closeNote', { goodwill: plain(claim), factor: plain(factor, 1) })}
          </button>
        </div>
      )}
      <div class="grid2">
        <button type="button" class="card-link" onClick={() => go({ name: 'desk' })}>
          <Icon.stamp />
          <span class="grow">
            <span class="h3" style={{ display: 'block' }}>
              {t('ledger.desk')}
            </span>
            <span class="tiny">{t('ledger.deskHint')}</span>
          </span>
        </button>
        <button type="button" class="card-link alt" onClick={() => go({ name: 'upgrades' })}>
          <Icon.arrowUp />
          <span class="grow">
            <span class="h3" style={{ display: 'block' }}>
              {t('ledger.upgrades')}
            </span>
            <span class="tiny">{affordableUpgrades > 0 ? `${affordableUpgrades} ✓` : ' '}</span>
          </span>
          {affordableUpgrades > 0 && <span class="badge-dot" />}
        </button>
        {open > 0 && (
          <button type="button" class="card-link" onClick={() => go({ name: 'classifieds' })}>
            <Icon.person />
            <span class="grow">
              <span class="h3" style={{ display: 'block' }}>
                {t('ledger.classifieds')}
              </span>
              <span class="tiny">{applicants > 0 ? `${applicants}` : ' '}</span>
            </span>
            {applicants > 0 && v.cash >= 1000 && <span class="badge-dot" />}
          </button>
        )}
        {isUnlocked(state, 'stocks') && (
          <button type="button" class="card-link alt" onClick={() => go({ name: 'gazette' })}>
            <Icon.paper />
            <span class="grow">
              <span class="h3" style={{ display: 'block' }}>
                {t('ledger.paper')}
              </span>
              <span class="tiny">{v.paper.edition > 0 ? `No. ${v.paper.edition}` : ' '}</span>
            </span>
            {v.paper.unread && <span class="badge-dot" />}
          </button>
        )}
      </div>
      {hint && (
        <div class="note">
          <Icon.pencilArrow />
          <span>{hint}</span>
        </div>
      )}
      <div class="between" style={{ marginTop: '4px', alignItems: 'center' }}>
        <h2 class="h2">{t('ledger.businesses')}</h2>
        <p class="small">{t('ledger.count', { open, total: BUSINESSES.length })}</p>
      </div>
      <div
        class="row"
        role="group"
        aria-label={t('ledger.buyMode')}
        style={{ gap: '4px', marginTop: '-8px' }}
      >
        <span class="small">{t('ledger.buyMode')}</span>
        {MODES.map((m) => (
          <button
            key={String(m)}
            type="button"
            class={state.settings.buyMode === m ? 'chip on' : 'chip'}
            aria-pressed={state.settings.buyMode === m}
            onClick={() => act((s) => (s.settings.buyMode = m))}
          >
            {m === 'max' ? t('market.max') : `×${m}`}
          </button>
        ))}
      </div>
      <div class="stack" style={{ gap: '4px' }}>
        {visible.map((i) => (
          <BusinessRow key={i} state={state} index={i} />
        ))}
      </div>
      {nextLocked > 0 && (
        <p class="hand muted" style={{ fontSize: '19px' }}>
          {t('ledger.nextBusiness', {
            name: tk(`biz.${BUSINESSES[nextLocked]!.id}`),
            amount: moneyShort(levelCost(state, nextLocked, 1)),
          })}
        </p>
      )}
      <div class="grid2" style={{ marginTop: '8px' }}>
        <button type="button" class="card-link" onClick={() => go({ name: 'shelf' })}>
          <Icon.shelf />
          <span class="h3">{t('ledger.shelf')}</span>
        </button>
        <button type="button" class="card-link alt" onClick={() => go({ name: 'partners' })}>
          <Icon.handshake />
          <span class="h3">{t('ledger.partners')}</span>
        </button>
        {claim > 0 && (
          <button type="button" class="card-link" onClick={() => go({ name: 'close' })}>
            <Icon.ledger />
            <span class="h3">{t('ledger.closeVolume')}</span>
          </button>
        )}
        <button type="button" class="card-link alt" onClick={() => go({ name: 'settings' })}>
          <Icon.gear />
          <span class="h3">{t('ledger.settings')}</span>
        </button>
      </div>
    </Page>
  );
}
