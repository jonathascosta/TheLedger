import {
  comboMultiplier,
  currentCombo,
  stamp,
  stampBase,
  STAMPS_PER_INVOICE,
  UPGRADES,
  buyUpgrade,
  type GameState,
} from '@ledger/engine';
import { useState } from 'preact/hooks';
import { Icon } from '../art/Doodles.tsx';
import { PaidMark } from '../art/Badges.tsx';
import { t, tk } from '../i18n/index.ts';
import { platform } from '../platform/index.ts';
import { act } from '../store.ts';
import { Page } from '../ui/Page.tsx';
import { money, moneyShort, plain } from '../ui/format.ts';

const SPOTS: readonly (readonly [number, number, number])[] = [
  [18, 116, -12],
  [150, 92, 10],
  [64, 196, -5],
  [176, 186, 14],
  [22, 262, 7],
  [150, 262, -9],
  [96, 140, 3],
  [192, 36, -15],
  [36, 30, 11],
  [118, 20, -4],
];

function Tally({ count }: { count: number }) {
  const groups: number[] = [];
  for (let n = count; n > 0; n -= 5) groups.push(Math.min(5, n));
  return (
    <div class="tally" role="img" aria-label={t('desk.comboLabel', { count })}>
      {groups.map((g, i) => (
        <svg key={i} aria-hidden="true" viewBox="0 0 36 30" width="36" height="30">
          <g fill="none" style={{ stroke: 'var(--ink)' }} stroke-width="2.2" stroke-linecap="round">
            {[6, 13, 20, 27].slice(0, Math.min(g, 4)).map((x) => (
              <path key={x} d={`M${x} 5 L${x} 26`} />
            ))}
            {g === 5 && <path d="M2 22 L32 8" />}
          </g>
        </svg>
      ))}
    </div>
  );
}

export function Desk({ state }: { state: GameState }) {
  const [floats, setFloats] = useState<{ id: number; value: number; x: number }[]>([]);
  const now = Date.now();
  const desk = state.volume.desk;
  const combo = currentCombo(state, now);
  const base = stampBase(state);
  const nextValue = base * comboMultiplier(Math.min(20, combo + 1));
  const deskUpgrades = UPGRADES.filter(
    (u) => u.effect.kind === 'desk' && !state.volume.upgrades.includes(u.id),
  ).slice(0, 2);
  const onStamp = (): void => {
    platform().tap();
    const result = act((s) => stamp(s, Date.now()));
    const id = state.meta.totalStamps;
    setFloats((f) => [...f.slice(-4), { id, value: result.value, x: 90 + ((id * 37) % 100) }]);
  };
  const client = t('client.cafe');
  return (
    <Page
      right={
        <p class="hand" style={{ fontWeight: 700, fontSize: '24px' }}>
          {moneyShort(state.volume.cash)}
        </p>
      }
    >
      <div>
        <h1 class="h1">{t('desk.title')}</h1>
        <p class="small">{t('desk.subtitle')}</p>
      </div>
      <div class="invoice-stack">
        <div
          aria-hidden="true"
          class="invoice"
          style={{ transform: 'rotate(4deg)', top: '14px', left: '10px', boxShadow: 'none' }}
        />
        <div
          aria-hidden="true"
          class="invoice"
          style={{ transform: 'rotate(-3deg)', top: '8px', left: '6px', boxShadow: 'none' }}
        />
        <button
          type="button"
          class="invoice"
          aria-label={t('desk.stampLabel', { amount: money(nextValue) })}
          onClick={onStamp}
        >
          <span class="line" style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '0.1em' }}>
            <span>{t('desk.invoice')}</span>
            <span>{t('desk.no', { number: String(desk.invoice).padStart(4, '0') })}</span>
          </span>
          <span
            style={{
              borderTop: '1px solid currentColor',
              borderBottom: '1px solid currentColor',
              padding: '4px 0',
            }}
          >
            {t('desk.billTo', { client })}
          </span>
          <span class="line">
            <span>{t('desk.line.goods')}</span>
            <span>{moneyShort(nextValue * 0.52)}</span>
          </span>
          <span class="line">
            <span>{t('desk.line.service')}</span>
            <span>{moneyShort(nextValue * 0.34)}</span>
          </span>
          <span class="line">
            <span>{t('desk.line.delivery')}</span>
            <span>{moneyShort(nextValue * 0.14)}</span>
          </span>
          <span
            class="line"
            style={{ borderTop: '3px double currentColor', paddingTop: '4px', fontWeight: 700 }}
          >
            <span>{t('desk.total')}</span>
            <span>{money(nextValue)}</span>
          </span>
          <span style={{ flex: 1 }} />
          <span class="line" style={{ alignItems: 'baseline', fontSize: '12px' }}>
            <span>{t('desk.stamps')}</span>
            <span class="hand" style={{ fontWeight: 700, fontSize: '22px', color: 'var(--ink)' }}>
              {desk.stamps} / {STAMPS_PER_INVOICE}
            </span>
          </span>
          {SPOTS.slice(0, desk.stamps).map(([x, y, r], i) => (
            <span
              key={`${desk.invoice}-${i}`}
              class="paid-mark"
              style={{ left: `${x}px`, top: `${y}px`, ['--r' as string]: `${r}deg` }}
            >
              <PaidMark text={t('desk.paid')} />
            </span>
          ))}
        </button>
        {floats.map((f) => (
          <p
            key={f.id}
            aria-hidden="true"
            class="float-gain"
            style={{ left: `${f.x}px`, top: '150px' }}
          >
            + {moneyShort(f.value)}
          </p>
        ))}
        <svg
          aria-hidden="true"
          viewBox="0 0 80 120"
          style={{
            position: 'absolute',
            right: '-6px',
            top: '236px',
            width: '64px',
            height: '96px',
            transform: 'rotate(18deg)',
            pointerEvents: 'none',
          }}
        >
          <g style={{ stroke: 'var(--ink)' }} stroke-width="2" stroke-linejoin="round">
            <circle cx="40" cy="18" r="13" style={{ fill: 'var(--pie-3)' }} />
            <path d="M34 30 h12 v40 h-12 z" style={{ fill: 'var(--sticker-warm)' }} />
            <path d="M14 70 h52 v18 h-52 z" style={{ fill: 'var(--sticker-warm)' }} />
            <path d="M10 88 h60 v10 h-60 z" style={{ fill: 'var(--loss)' }} />
          </g>
        </svg>
        {state.meta.totalStamps < 3 && (
          <p
            aria-hidden="true"
            class="hand loss"
            style={{
              position: 'absolute',
              right: '6px',
              top: '340px',
              fontSize: '22px',
              transform: 'rotate(-6deg)',
            }}
          >
            {t('desk.tap')}
          </p>
        )}
      </div>
      <div class="row">
        <p class="h3">{t('desk.combo')}</p>
        <Tally count={combo} />
        <p class="hand loss" style={{ fontWeight: 700, fontSize: '26px' }}>
          ×{plain(comboMultiplier(combo), 2)}
        </p>
      </div>
      {deskUpgrades.length > 0 && (
        <>
          <p class="caps">{t('desk.upgrades')}</p>
          <div class="grid2">
            {deskUpgrades.map((u, i) => (
              <button
                key={u.id}
                type="button"
                class={i % 2 ? 'card-link alt' : 'card-link'}
                disabled={state.volume.cash < u.cost}
                style={{ opacity: state.volume.cash < u.cost ? 0.55 : 1 }}
                onClick={() => act((s) => buyUpgrade(s, u.id))}
              >
                <Icon.stamp size={26} />
                <span class="grow">
                  <span class="h3" style={{ display: 'block', fontSize: '19px' }}>
                    {tk(`upgrade.${u.id}`)}
                  </span>
                  <span class="tiny">
                    {t('upgrades.effect.desk')} · {moneyShort(u.cost)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </Page>
  );
}
