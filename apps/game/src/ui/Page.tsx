import { businessIncome, passiveRate } from '@ledger/engine';
import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { t } from '../i18n/index.ts';
import { back, canGoBack } from '../router.ts';
import { game } from '../store.ts';
import { moneyShort } from './format.ts';

/** How far a page scrolls before the cash strip shows. */
const STRIP_AFTER = 120;

/** The cash and the income, pinned at the top while the page is scrolled. */
function CashStrip({ shown }: { shown: boolean }) {
  const state = game();
  const income = businessIncome(state) + passiveRate(state);
  return (
    <div class={shown ? 'cash-strip on' : 'cash-strip'} aria-hidden={!shown}>
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
  const [scrolled, setScrolled] = useState(false);
  return (
    <>
      <CashStrip shown={scrolled} />
      <div
        class="scroll"
        key="scroll"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > STRIP_AFTER)}
      >
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
