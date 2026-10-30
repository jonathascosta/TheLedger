import type { UpgradeDef } from '@ledger/engine';
import { factor } from '../ui/format.ts';
import { BusinessDoodle, Icon } from './Doodles.tsx';

/** The red ink stamp in the corner that marks an upgrade: "×3", "×2", or a green tick once bought. */
function Mark({ text, bought, size }: { text: string; bought: boolean; size: number }) {
  const ink = bought ? 'var(--profit)' : 'var(--loss)';
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 30 30"
      width={size}
      height={size}
      style={{ position: 'absolute', right: '-6px', bottom: '-5px', transform: 'rotate(-12deg)' }}
    >
      <circle cx="15" cy="15" r="13" style={{ fill: 'var(--paper-white)' }} />
      <g filter="url(#ink-stamp)">
        <circle cx="15" cy="15" r="13" fill="none" style={{ stroke: ink }} stroke-width="2.4" />
        <circle cx="15" cy="15" r="9.5" fill="none" style={{ stroke: ink }} stroke-width="0.9" />
      </g>
      <g>
        {bought ? (
          <path
            d="M9 15.5 L13.5 20 L21.5 10"
            fill="none"
            style={{ stroke: ink }}
            stroke-width="2.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        ) : (
          <text
            x="15"
            y="19.5"
            text-anchor="middle"
            font-family="Courier Prime, monospace"
            font-weight="700"
            font-size="11"
            style={{ fill: ink }}
          >
            {text}
          </text>
        )}
      </g>
    </svg>
  );
}

function Sticker({ children, size }: { children: preact.ComponentChildren; size: number }) {
  return (
    <span
      class="sticker"
      style={{ width: `${size}px`, height: `${size}px`, position: 'absolute', inset: 0 }}
    >
      {children}
    </span>
  );
}

/**
 * An upgrade's icon: the business's own sticker stamped "×3"; for the ledger upgrades, three
 * stickers fanned out; for the desk, the rubber stamp marked "×2".
 */
export function UpgradeIcon({
  upgrade,
  bought = false,
  size = 46,
}: {
  upgrade: UpgradeDef;
  bought?: boolean;
  size?: number;
}) {
  const e = upgrade.effect;
  const mark = (
    <Mark text={factor(e.factor)} bought={bought} size={Math.max(21, Math.round(size * 0.56))} />
  );
  if (e.kind === 'all') {
    const mini = Math.round(size * 0.62);
    return (
      <span
        class="upgrade-icon"
        aria-hidden="true"
        style={{ position: 'relative', width: `${size}px`, height: `${size}px`, flex: 'none' }}
      >
        {[0, 1, 9].map((business, i) => (
          <span
            key={business}
            class="sticker"
            style={{
              position: 'absolute',
              width: `${mini}px`,
              height: `${mini}px`,
              left: `${i * (size - mini) * 0.5}px`,
              top: `${i === 1 ? 0 : (size - mini) * 0.6}px`,
              transform: `rotate(${(i - 1) * 12}deg)`,
            }}
          >
            <BusinessDoodle index={business} size={Math.round(mini * 0.68)} />
          </span>
        ))}
        {mark}
      </span>
    );
  }
  return (
    <span
      class="upgrade-icon"
      aria-hidden="true"
      style={{ position: 'relative', width: `${size}px`, height: `${size}px`, flex: 'none' }}
    >
      <Sticker size={size}>
        {e.kind === 'business' ? (
          <BusinessDoodle index={e.business} size={Math.round(size * 0.7)} />
        ) : (
          <Icon.stamp size={Math.round(size * 0.66)} />
        )}
      </Sticker>
      {mark}
    </span>
  );
}
