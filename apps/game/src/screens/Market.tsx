import {
  affordableUnits,
  buyUnits,
  CLASS_UNLOCKS,
  INSTRUMENT_BY_ID,
  INSTRUMENTS,
  isUnlocked,
  price,
  sellUnits,
  grant,
  unitsHeld,
  type GameState,
  type InstrumentKind,
} from '@ledger/engine';
import { useState } from 'preact/hooks';
import { Icon } from '../art/Doodles.tsx';
import { InkChart, Sparkline } from '../art/InkChart.tsx';
import { t, tk } from '../i18n/index.ts';
import { act } from '../store.ts';
import { go, replace } from '../router.ts';
import { Page } from '../ui/Page.tsx';
import { PostIt } from '../ui/PostIt.tsx';
import { money, moneyShort, percent, units } from '../ui/format.ts';

const KIND_CLASS = { stock: 'stocks', commodity: 'commodities', coin: 'crypto' } as const;
const KIND_LABEL = {
  stock: 'market.stocks',
  commodity: 'market.commodities',
  coin: 'market.crypto',
} as const;

function change(state: GameState, id: string): number {
  const h = state.volume.market.history[id] ?? [];
  const first = h[Math.max(0, h.length - 60)] ?? price(state, id);
  return price(state, id) / first - 1;
}

export function Market({ state, kind }: { state: GameState; kind: InstrumentKind }) {
  const cls = KIND_CLASS[kind];
  const open = isUnlocked(state, cls);
  const list = INSTRUMENTS.filter((i) => i.kind === kind);
  const at = CLASS_UNLOCKS.find((c) => c.id === cls)!.at;
  return (
    <Page>
      <div class="between">
        <h1 class="h1">{t('market.title')}</h1>
        {open && <p class="small">{t('market.marketOpen', { tick: state.volume.market.tick })}</p>}
      </div>
      <div class="row" role="tablist" style={{ gap: '4px' }}>
        {(['stock', 'commodity', 'coin'] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={k === kind}
            class={k === kind ? 'chip on' : 'chip'}
            onClick={() => replace({ name: 'market', kind: k })}
          >
            {t(KIND_LABEL[k])}
          </button>
        ))}
      </div>
      <PostIt state={state} cls={cls} />
      {!open ? (
        <div class="stack" style={{ gap: '6px' }}>
          <div class="locked-card">
            <Icon.lock />
            <span class="hand" style={{ fontSize: '21px' }}>
              {t('common.locked', { amount: moneyShort(at) })}
            </span>
          </div>
          <p class="small">
            {t('market.progress', {
              now: moneyShort(state.volume.peakNetWorth),
              at: moneyShort(at),
            })}
          </p>
          <div class="bar">
            <div style={{ width: `${Math.min(100, (state.volume.peakNetWorth / at) * 100)}%` }} />
          </div>
        </div>
      ) : (
        <div class="stack" style={{ gap: '4px' }}>
          {list.map((i) => {
            const c = change(state, i.id);
            const held = unitsHeld(state, i.id);
            return (
              <button
                key={i.id}
                type="button"
                class="row"
                style={{
                  minHeight: '60px',
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  padding: 0,
                }}
                onClick={() => go({ name: 'instrument', id: i.id })}
              >
                <div class="grow">
                  <p
                    class="type"
                    style={{
                      fontWeight: 700,
                      fontSize: '12px',
                      letterSpacing: '0.18em',
                      color: 'var(--ink-soft)',
                    }}
                  >
                    {i.ticker}
                  </p>
                  <p class="h3" style={{ fontSize: '21px' }}>
                    {tk(`instrument.${i.id}`)}
                  </p>
                  {held > 0 && (
                    <p class="tiny">
                      {t('market.value', { amount: moneyShort(held * price(state, i.id)) })}
                    </p>
                  )}
                </div>
                <Sparkline values={state.volume.market.history[i.id] ?? []} up={c >= 0} />
                <div style={{ textAlign: 'right', minWidth: '80px' }}>
                  <p class="hand" style={{ fontWeight: 700, fontSize: '22px' }}>
                    {moneyShort(price(state, i.id))}
                  </p>
                  <p class={c >= 0 ? 'small profit' : 'small loss'}>{percent(c)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Page>
  );
}

const QTY = [1, 10, 100, 'max'] as const;

export function Instrument({ state, id }: { state: GameState; id: string }) {
  const def = INSTRUMENT_BY_ID.get(id)!;
  const [qty, setQty] = useState<(typeof QTY)[number]>(def.kind === 'stock' ? 10 : 'max');
  const [message, setMessage] = useState<string | null>(null);
  const p = price(state, id);
  const history = state.volume.market.history[id] ?? [p];
  const c = change(state, id);
  const holding = state.volume.holdings[id];
  const held = holding?.units ?? 0;
  const avg = holding && held > 0 ? holding.cost / held : 0;
  const pnl = held * p - (holding?.cost ?? 0);
  const affordable = affordableUnits(state, id);
  const buyCount = qty === 'max' ? affordable : Math.min(qty, affordable);
  const sellCount = qty === 'max' ? held : Math.min(qty, held);
  const lo = Math.min(...history);
  const hi = Math.max(...history);
  const unlocked = isUnlocked(state, KIND_CLASS[def.kind]);
  return (
    <Page
      right={<p class="small">{t('market.cash', { amount: moneyShort(state.volume.cash) })}</p>}
    >
      <div>
        <p
          class="type"
          style={{
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.2em',
            color: 'var(--ink-soft)',
          }}
        >
          {def.ticker}
        </p>
        <h1 class="h1" style={{ fontSize: '36px' }}>
          {tk(`instrument.${id}`)}
        </h1>
      </div>
      <div class="between" style={{ alignItems: 'flex-end' }}>
        <p class="big-money" style={{ fontSize: '50px' }}>
          {money(p)}
        </p>
        <p
          class={c >= 0 ? 'hand profit' : 'hand loss'}
          style={{ fontWeight: 700, fontSize: '24px' }}
        >
          {t('market.today', { change: percent(c) })}
        </p>
      </div>
      <InkChart
        values={history}
        label={t('market.chartLabel')}
        highlightLast={c > 0.05 ? 8 : 0}
        marks={[
          [hi, moneyShort(hi)],
          [lo, moneyShort(lo)],
        ]}
      />
      <div class="between">
        <p class="hand" style={{ fontSize: '21px' }}>
          {held > 0
            ? t('market.youOwn', { units: units(held), avg: moneyShort(avg) })
            : t('market.youOwnNone')}
        </p>
        {held > 0 && (
          <p
            class={pnl >= 0 ? 'hand profit' : 'hand loss'}
            style={{ fontWeight: 700, fontSize: '21px' }}
          >
            {pnl >= 0 ? '+ ' : ''}
            {moneyShort(pnl)}
          </p>
        )}
      </div>
      {def.dividend > 0 && <p class="tiny">{t('market.dividend')}</p>}
      <div class="row" role="group" aria-label={t('market.qty')} style={{ gap: '4px' }}>
        {QTY.map((q) => (
          <button
            key={String(q)}
            type="button"
            class={qty === q ? 'chip on' : 'chip'}
            aria-pressed={qty === q}
            onClick={() => setQty(q)}
          >
            {q === 'max' ? t('market.max') : q}
          </button>
        ))}
      </div>
      <div class="row" style={{ justifyContent: 'center', gap: '16px' }}>
        <button
          type="button"
          class="stamp-btn green"
          disabled={!unlocked || buyCount <= 0}
          onClick={() => {
            act((s) => buyUnits(s, id, buyCount));
            setMessage(t('market.bought', { units: units(buyCount) }));
          }}
        >
          {t('market.buy')}
          <br />
          <span style={{ fontSize: '13px' }}>{units(buyCount)}</span>
        </button>
        <button
          type="button"
          class="stamp-btn red alt"
          disabled={sellCount <= 0}
          onClick={() => {
            const sale = act((s) => {
              const r = sellUnits(s, id, sellCount);
              if (r.atTop) grant(s, 'soldAtTop', Date.now());
              return r;
            });
            setMessage(t('market.sold', { amount: moneyShort(sale.proceeds) }));
          }}
        >
          {t('market.sell')}
          <br />
          <span style={{ fontSize: '13px' }}>{units(sellCount)}</span>
        </button>
      </div>
      {message && (
        <p class="hand center" style={{ fontSize: '20px' }}>
          {message}
        </p>
      )}
    </Page>
  );
}
