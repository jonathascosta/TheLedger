import { businessIncome, passiveRate } from '@ledger/engine';
import type { ComponentChildren } from 'preact';
import { t } from '../i18n/index.ts';
import { back, canGoBack } from '../router.ts';
import { game } from '../store.ts';
import { moneyShort } from './format.ts';

/** The cash and the income, pinned at the top of every page. */
function CashStrip() {
  const state = game();
  const income = businessIncome(state) + passiveRate(state);
  return (
    <div class="cash-strip">
      <span>{t('strip.cash', { amount: moneyShort(state.volume.cash) })}</span>
      <span class="profit">{t('strip.income', { amount: moneyShort(income) })}</span>
    </div>
  );
}

/** A page of the notebook: ruled paper with the red margin, or newsprint. */
export function Page({
  children,
  newsprint = false,
  backLabel,
  right,
}: {
  children: ComponentChildren;
  newsprint?: boolean;
  backLabel?: string;
  right?: ComponentChildren;
}) {
  return (
    <>
      <CashStrip />
      <div class="scroll" key="scroll">
        <div class="stack">
          {(canGoBack() || right) && (
            <div class="between" style={{ alignItems: 'center', marginTop: '-8px' }}>
              {canGoBack() ? (
                <button
                  type="button"
                  class="btn-link"
                  style={{ marginLeft: '-4px' }}
                  onClick={back}
                >
                  {backLabel ?? t('common.back')}
                </button>
              ) : (
                <span />
              )}
              {right}
            </div>
          )}
          <div class={newsprint ? 'stack print' : 'stack'}>{children}</div>
        </div>
      </div>
    </>
  );
}

export function Underline({
  children,
  color = 'var(--profit)',
}: {
  children: ComponentChildren;
  color?: string;
}) {
  return (
    <span class="underline-hand">
      {children}
      <svg viewBox="0 0 200 10" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M2 6 C40 2, 80 9, 120 4 S180 3, 198 6"
          fill="none"
          style={{ stroke: color }}
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </span>
  );
}
