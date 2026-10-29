import { BUSINESSES, collectAway, type AwayReceipt } from '@ledger/engine';
import { t, tk } from '../i18n/index.ts';
import { sponsorsOffered } from '../sponsor.ts';
import { act, grant } from '../store.ts';
import { Sponsor } from '../ui/Sponsor.tsx';
import { duration, moneyShort, percent } from '../ui/format.ts';

const NAMES: Record<string, () => string> = {
  rent: () => t('away.rent'),
  bonds: () => t('away.bonds'),
  energy: () => t('away.energy'),
};

/** The adding machine's receipt for an absence. */
export function Away({ receipt }: { receipt: AwayReceipt }) {
  return (
    <div class="modal page">
      <div class="scroll">
        <div class="stack">
          <h1 class="h1">{t('away.title')}</h1>
          <p class="hand" style={{ fontSize: '21px', lineHeight: 1.15 }}>
            {t('away.subtitle', { duration: duration(receipt.seconds) })}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg aria-hidden="true" viewBox="0 0 240 78" width="240" height="78">
              <g style={{ stroke: 'var(--ink)' }} stroke-width="2" stroke-linejoin="round">
                <path
                  d="M10 70 L22 14 Q24 6 32 6 H208 Q216 6 218 14 L230 70 Z"
                  style={{ fill: 'var(--pie-8)' }}
                  opacity="0.85"
                />
                <rect x="36" y="16" width="168" height="14" rx="3" style={{ fill: 'var(--ink)' }} />
                <g style={{ fill: 'var(--paper)' }} stroke-width="1.4">
                  {[58, 78, 98, 118, 138, 158].map((x) => (
                    <circle key={x} cx={x} cy="44" r="6" />
                  ))}
                  {[58, 78, 98, 118, 138].map((x) => (
                    <circle key={x} cx={x} cy="60" r="6" />
                  ))}
                </g>
                <rect
                  x="152"
                  y="54"
                  width="34"
                  height="13"
                  rx="3"
                  style={{ fill: 'var(--loss)' }}
                  stroke-width="1.4"
                />
                <path d="M196 40 L214 30" stroke-width="3" stroke-linecap="round" />
                <circle cx="216" cy="29" r="5" style={{ fill: 'var(--loss)' }} />
              </g>
            </svg>
            <div class="receipt">
              <p style={{ justifyContent: 'center', fontSize: '11px', letterSpacing: '0.08em' }}>
                {t('away.header', {
                  duration: duration(receipt.seconds).toUpperCase(),
                  rate: percent(receipt.rate, false),
                })}
              </p>
              {receipt.lines.map((l, i) => (
                <p key={i}>
                  <span
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {l.kind === 'business'
                      ? tk(`biz.${BUSINESSES[Number(l.id)]!.id}`).toUpperCase()
                      : (NAMES[l.kind]?.() ?? l.kind)}
                  </span>
                  <span style={{ whiteSpace: 'nowrap' }}>{moneyShort(l.amount).slice(1)} +</span>
                </p>
              ))}
              <p
                style={{
                  marginTop: '6px',
                  paddingTop: '4px',
                  borderTop: '1px dashed currentColor',
                  fontWeight: 700,
                  fontSize: '15px',
                  color: 'var(--loss)',
                }}
              >
                <span>{t('away.total')}</span>
                <span>{moneyShort(receipt.total)} *</span>
              </p>
              <svg
                aria-hidden="true"
                viewBox="0 0 260 12"
                preserveAspectRatio="none"
                style={{
                  position: 'absolute',
                  left: 0,
                  bottom: '-11px',
                  width: '100%',
                  height: '12px',
                }}
              >
                <path
                  d={`M0 0 H260 V2 ${Array.from({ length: 13 }, (_, i) => `L${250 - i * 20} 12 L${240 - i * 20} 2`).join(' ')} L0 12 Z`}
                  style={{ fill: 'var(--paper-white)' }}
                />
              </svg>
            </div>
          </div>
          <button
            type="button"
            class="stamp-btn green"
            style={{ alignSelf: 'center', marginTop: '22px', minWidth: '240px' }}
            onClick={() => act((s) => collectAway(s))}
          >
            {t('away.collect', { amount: moneyShort(receipt.total) })}
          </button>
          {sponsorsOffered() && (
            <div style={{ alignSelf: 'center', marginTop: '12px' }}>
              <Sponsor
                title={t('audit.title')}
                reward={t('audit.reward', { amount: moneyShort(receipt.total * 2) })}
                onEarned={() => grant((s) => collectAway(s, true))}
              />
            </div>
          )}
          <p class="note" style={{ marginTop: '8px' }}>
            {t('away.tip')}
          </p>
        </div>
      </div>
    </div>
  );
}
