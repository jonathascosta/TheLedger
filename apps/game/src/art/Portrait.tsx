import { createRng } from '@ledger/engine';

/** A pencil portrait made from parts chosen by a seed. */
export function Portrait({ seed, size = 50 }: { seed: number; size?: number }) {
  const rng = createRng(`face:${seed}`);
  const hair = rng.int(4);
  const glasses = rng.int(3) === 0;
  const moustache = rng.int(4) === 0;
  const hat = rng.int(6) === 0;
  const tones = ['--sticker-cafe', '--sticker-warm', '--paper-white', '--sticker-roof'];
  const skin = `var(${tones[rng.int(tones.length)]!})`;
  const stroke = { stroke: 'var(--ink)' };
  return (
    <svg aria-hidden="true" viewBox="0 0 50 50" width={size} height={size} style={{ flex: 'none' }}>
      <g
        fill="none"
        style={stroke}
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="25" cy="25" r="23" style={{ fill: 'var(--paper)', ...stroke }} />
        <path d="M10 47 c2 -6 8 -9 15 -9 s13 3 15 9" />
        <path
          d="M14 22 c0 -10 22 -10 22 0 c0 8 -4 14 -11 14 s-11 -6 -11 -14z"
          style={{ fill: skin, ...stroke }}
        />
        {hair === 0 && (
          <path
            d="M13 22 c2 -8 8 -11 14 -10 c6 1 10 5 10 10"
            style={{ fill: 'var(--ink-soft)', ...stroke }}
          />
        )}
        {hair === 1 && (
          <path
            d="M13 24 c-2 -12 26 -14 24 0 M13 24 v8 M37 24 v8"
            style={{ fill: 'none', ...stroke }}
          />
        )}
        {hair === 2 && <path d="M14 18 q11 -10 22 0" />}
        {hair === 3 && (
          <path
            d="M12 26 c-1 -14 27 -16 26 0 c0 10 -3 12 -3 12 M15 38 c-3 -6 -3 -10 -3 -12"
            style={{ fill: 'none', ...stroke }}
          />
        )}
        <path d="M20 24 h2 M28 24 h2" />
        {glasses && (
          <path
            d="M17 24 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M27 24 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M23 24 h4"
            stroke-width="1.3"
          />
        )}
        {moustache ? (
          <path d="M20 30 q5 -3 10 0" stroke-width="2.4" />
        ) : (
          <path d="M21 30 q4 3 8 0" />
        )}
        {hat && (
          <path d="M11 16 h28 M15 16 c0 -8 20 -8 20 0" style={{ fill: 'var(--ink)', ...stroke }} />
        )}
      </g>
    </svg>
  );
}
