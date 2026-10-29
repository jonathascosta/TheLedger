import type { AchievementStyle } from '@ledger/engine';
import { cyrb53 } from '@ledger/engine';

const COLORS = ['--ink', '--loss', '--profit', '--gold-dark'] as const;

/** An achievement drawn as a rubber stamp, wax seal, diamond stamp or boxed stamp. */
export function Badge({
  id,
  style,
  earned,
  text,
  size = 80,
}: {
  id: string;
  style: AchievementStyle;
  earned: boolean;
  text: string;
  size?: number;
}) {
  const [h1, h2] = cyrb53(id);
  const color = `var(${COLORS[h1 % COLORS.length]!})`;
  const rot = ((h2 % 21) - 10).toFixed(0);
  if (!earned) {
    const dash = { stroke: 'var(--pencil)' };
    return (
      <svg aria-hidden="true" viewBox="0 0 100 100" width={size} height={size}>
        {style === 'diamond' ? (
          <path
            d="M50 8 L90 50 L50 92 L10 50 Z"
            fill="none"
            style={dash}
            stroke-width="1.6"
            stroke-dasharray="4 5"
          />
        ) : style === 'box' ? (
          <rect
            x="10"
            y="24"
            width="80"
            height="52"
            rx="4"
            fill="none"
            style={dash}
            stroke-width="1.6"
            stroke-dasharray="4 5"
          />
        ) : (
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            style={dash}
            stroke-width="1.6"
            stroke-dasharray="4 5"
          />
        )}
        <text
          x="50"
          y="62"
          text-anchor="middle"
          font-family="Caveat, cursive"
          font-weight="700"
          font-size="34"
          style={{ fill: 'var(--pencil)' }}
        >
          ?
        </text>
      </svg>
    );
  }
  if (style === 'seal') {
    const wax = h1 % 2 === 0 ? 'var(--wax)' : 'var(--gold)';
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        width={size}
        height={size}
        style={{ transform: `rotate(${rot}deg)` }}
      >
        <g filter="url(#wax)">
          <path
            d="M50 7 C63 6 71 13 80 18 C91 25 93 38 93 50 C94 63 88 74 80 82 C71 91 61 94 50 93 C37 94 26 89 19 81 C10 72 6 61 7 50 C6 37 12 26 20 19 C29 11 38 8 50 7Z"
            style={{ fill: wax }}
          />
          <circle
            cx="50"
            cy="50"
            r="30"
            fill="none"
            style={{ stroke: 'rgba(0,0,0,0.3)' }}
            stroke-width="3"
          />
          <path
            d="M27 32 C34 22 46 18 58 20"
            fill="none"
            style={{ stroke: 'rgba(255,255,255,0.3)' }}
            stroke-width="3"
            stroke-linecap="round"
          />
        </g>
        <text
          x="50"
          y="58"
          text-anchor="middle"
          font-family="IM Fell English, serif"
          font-size="24"
          style={{ fill: 'rgba(0,0,0,0.45)' }}
        >
          {text.slice(0, 1).toUpperCase()}
        </text>
      </svg>
    );
  }
  const words = text.toUpperCase();
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ transform: `rotate(${rot}deg)` }}
    >
      <g filter="url(#ink-stamp)" fill="none" style={{ stroke: color }}>
        {style === 'diamond' ? (
          <>
            <path d="M50 6 L94 50 L50 94 L6 50 Z" stroke-width="3.5" />
            <path d="M50 15 L85 50 L50 85 L15 50 Z" stroke-width="1.2" />
          </>
        ) : style === 'box' ? (
          <>
            <rect x="6" y="26" width="88" height="48" rx="4" stroke-width="3.5" />
            <rect x="11" y="31" width="78" height="38" rx="2" stroke-width="1.2" />
          </>
        ) : (
          <>
            <circle cx="50" cy="50" r="45" stroke-width="3.5" />
            <circle cx="50" cy="50" r="36" stroke-width="1.2" />
          </>
        )}
        <foreignObject x="14" y="34" width="72" height="32">
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              fontFamily: 'var(--print)',
              fontSize: words.length > 14 ? '9px' : '11px',
              lineHeight: 1.05,
              color,
            }}
          >
            {words}
          </div>
        </foreignObject>
      </g>
    </svg>
  );
}

/** The red stamp that falls on the invoice. */
export function PaidMark({ text }: { text: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" width="92" height="92">
      <g filter="url(#ink-stamp)" fill="none" style={{ stroke: 'var(--loss)' }} opacity="0.85">
        <circle cx="50" cy="50" r="44" stroke-width="4" />
        <circle cx="50" cy="50" r="36" stroke-width="1.2" />
        <text
          x="50"
          y="59"
          text-anchor="middle"
          font-family="IM Fell English, serif"
          font-size="25"
          style={{ fill: 'var(--loss)', stroke: 'none' }}
          letter-spacing="1"
        >
          {text}
        </text>
        <text
          x="50"
          y="32"
          text-anchor="middle"
          font-family="Courier Prime, monospace"
          font-weight="700"
          font-size="9"
          style={{ fill: 'var(--loss)', stroke: 'none' }}
        >
          ★ ★ ★
        </text>
      </g>
    </svg>
  );
}
