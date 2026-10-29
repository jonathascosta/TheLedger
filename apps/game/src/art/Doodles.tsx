import type { JSX } from 'preact';

interface Props {
  size?: number | undefined;
}

const ink = { stroke: 'var(--ink)' };

function Svg({
  size = 34,
  children,
  view = '0 0 40 40',
}: Props & { children: JSX.Element | JSX.Element[]; view?: string }) {
  return (
    <svg aria-hidden="true" viewBox={view} width={size} height={size}>
      <g fill="none" style={ink} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        {children}
      </g>
    </svg>
  );
}

const fill = (v: string) => ({ fill: `var(${v})` });

/** The ten businesses' stickers, in the order of BUSINESSES. */
export const BUSINESS_DOODLES: readonly ((p: Props) => JSX.Element)[] = [
  (p) => (
    <Svg {...p}>
      <path d="M9 16h18v9a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8z" style={fill('--sticker-cafe')} />
      <path d="M27 19h3a4 4 0 0 1 0 8h-3" />
      <path d="M14 5c-2 3 2 4 0 7M20 4c-2 3 2 4 0 7" />
    </Svg>
  ),
  (p) => (
    <Svg {...p}>
      <path d="M5 26c0-8 7-13 15-13s15 5 15 13v3H5z" style={fill('--sticker-warm')} />
      <path d="M13 18l3 5M19 16l3 6M26 17l3 5" />
    </Svg>
  ),
  (p) => (
    <Svg {...p}>
      <rect x="8" y="5" width="24" height="30" rx="3" style={fill('--paper-white')} />
      <circle cx="20" cy="22" r="8" style={fill('--water')} />
      <path d="M8 11h24M12 8h2M17 8h2" />
      <path d="M15 23c2-2 4 2 6 0s3-1 4 0" />
    </Svg>
  ),
  (p) => (
    <Svg {...p}>
      <path d="M6 9 L34 9 L20 35 Z" style={fill('--sticker-warm')} />
      <path d="M6 9 q14 -6 28 0" />
      <circle cx="16" cy="15" r="2.4" style={fill('--loss')} />
      <circle cx="23" cy="20" r="2.4" style={fill('--loss')} />
      <circle cx="19" cy="26" r="2" style={fill('--loss')} />
    </Svg>
  ),
  (p) => (
    <Svg {...p}>
      <path d="M5 26v-6l5-8h20l5 8v6z" style={fill('--highlight')} />
      <path d="M12 12l3-5h10l3 5M5 20h30" />
      <circle cx="12" cy="27" r="4" style={fill('--paper-white')} />
      <circle cx="28" cy="27" r="4" style={fill('--paper-white')} />
    </Svg>
  ),
  (p) => (
    <Svg {...p}>
      <path d="M8 35V9h24v26" style={fill('--water')} />
      <path d="M13 14h4M23 14h4M13 20h4M23 20h4M13 26h4M23 26h4M17 35v-5h6v5M5 35h30" />
      <path d="M8 9l12-5 12 5" />
    </Svg>
  ),
  (p) => (
    <Svg {...p}>
      <rect x="5" y="14" width="30" height="20" rx="2" style={fill('--ink')} />
      <path d="M5 14l4-8 26 0-4 8z" style={fill('--paper-white')} />
      <path d="M13 6l-4 8M21 6l-4 8M29 6l-4 8" />
      <path
        d="M17 20l7 4-7 4z"
        style={{ fill: 'var(--paper-white)', stroke: 'var(--paper-white)' }}
      />
    </Svg>
  ),
  (p) => (
    <Svg {...p}>
      <circle cx="20" cy="20" r="14" style={fill('--paper-white')} />
      <path d="M20 13l6 4-2 7h-8l-2-7z" style={fill('--ink')} />
      <path d="M20 13V6M26 17l7-2M24 24l4 6M16 24l-4 6M14 17l-7-2" />
    </Svg>
  ),
  (p) => (
    <Svg {...p}>
      <path d="M5 15L20 6l15 9z" style={fill('--sticker-roof')} />
      <path d="M9 18v11M16 18v11M24 18v11M31 18v11" />
      <path d="M5 32h30" />
    </Svg>
  ),
  (p) => (
    <Svg {...p}>
      <path d="M7 35V16h7v19M18 35V10h7v25" style={fill('--pencil')} />
      <path d="M28 35V20h6v15M4 35h32" />
      <path d="M21 10c-2-3 2-5 0-8M10 16c-2-3 2-4 0-7" />
    </Svg>
  ),
];

export function BusinessDoodle({ index, size }: { index: number; size?: number }) {
  const Doodle = BUSINESS_DOODLES[index] ?? BUSINESS_DOODLES[0]!;
  return <Doodle size={size} />;
}

export const Icon = {
  ledger: () => (
    <Svg size={24} view="0 0 24 24">
      <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
      <path d="M9 9h6M9 13h6" />
    </Svg>
  ),
  market: () => (
    <Svg size={24} view="0 0 24 24">
      <path d="M3 18l5-6 4 3 7-9" />
    </Svg>
  ),
  portfolio: () => (
    <Svg size={24} view="0 0 24 24">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4v8l6 5" />
    </Svg>
  ),
  achievements: () => (
    <Svg size={24} view="0 0 24 24">
      <circle cx="12" cy="10" r="6" />
      <path d="M8 15l-2 6 6-2 6 2-2-6" />
    </Svg>
  ),
  lock: ({ size = 22 }: Props) => (
    <Svg size={size} view="0 0 24 24">
      <rect x="5" y="11" width="14" height="10" rx="2" style={{ stroke: 'var(--pencil)' }} />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" style={{ stroke: 'var(--pencil)' }} />
    </Svg>
  ),
  stamp: ({ size = 30 }: Props) => (
    <Svg size={size}>
      <circle cx="20" cy="9" r="6" style={fill('--pie-3')} />
      <path d="M17 15h6v9h-6z" style={fill('--sticker-warm')} />
      <path d="M8 24h24v6H8z" style={fill('--sticker-warm')} />
      <path d="M6 30h28v5H6z" style={fill('--loss')} />
    </Svg>
  ),
  paper: ({ size = 30 }: Props) => (
    <Svg size={size}>
      <path d="M6 8h24v24a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" style={fill('--paper-white')} />
      <path d="M30 14h4v18a3 3 0 0 1-3 3" />
      <path d="M10 13h16M10 18h7M10 23h7M10 28h7M20 18h6v10h-6z" />
    </Svg>
  ),
  person: ({ size = 30 }: Props) => (
    <Svg size={size}>
      <circle cx="20" cy="13" r="7" />
      <path d="M7 35c1-8 6-12 13-12s12 4 13 12" />
      <path d="M16 26l4 5 4-5" />
    </Svg>
  ),
  arrowUp: ({ size = 30 }: Props) => (
    <Svg size={size}>
      <path d="M20 34V8M10 18l10-10 10 10" />
      <path d="M8 34h24" />
    </Svg>
  ),
  shelf: ({ size = 30 }: Props) => (
    <Svg size={size}>
      <path d="M8 8h5v26H8zM14 11h5v23h-5zM21 6h5v28h-5z" style={fill('--paper-white')} />
      <path d="M27 12l5 1-4 21-5-1z" style={fill('--sticker-roof')} />
      <path d="M4 34h32" />
    </Svg>
  ),
  handshake: ({ size = 30 }: Props) => (
    <Svg size={size}>
      <path d="M4 18l8-6 8 4 8-4 8 6" />
      <path d="M12 20l6 6c2 2 4 2 6 0l6-6" />
      <path d="M16 24l3 3M20 22l3 3" />
    </Svg>
  ),
  gear: ({ size = 30 }: Props) => (
    <Svg size={size}>
      <circle cx="20" cy="20" r="6" />
      <path d="M20 5v5M20 30v5M5 20h5M30 20h5M9 9l4 4M27 27l4 4M9 31l4-4M27 13l4-4" />
    </Svg>
  ),
  coffee: ({ size = 30 }: Props) => BUSINESS_DOODLES[0]!({ size }),
  play: ({ size = 20 }: Props) => (
    <Svg size={size} view="0 0 24 24">
      <path d="M7 5 L19 12 L7 19 Z" />
    </Svg>
  ),
  check: ({ size = 20 }: Props) => (
    <svg aria-hidden="true" viewBox="0 0 22 22" width={size} height={size}>
      <rect x="2" y="3" width="16" height="16" fill="none" style={ink} stroke-width="1.6" />
      <path
        d="M5 11 L9 16 L20 2"
        fill="none"
        style={{ stroke: 'var(--profit)' }}
        stroke-width="2.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  ),
  box: ({ size = 20 }: Props) => (
    <svg aria-hidden="true" viewBox="0 0 22 22" width={size} height={size}>
      <rect x="2" y="3" width="16" height="16" fill="none" style={ink} stroke-width="1.6" />
    </svg>
  ),
  pencilArrow: () => (
    <svg aria-hidden="true" viewBox="0 0 40 30" width="40" height="30">
      <g
        fill="none"
        style={{ stroke: 'var(--loss)' }}
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M4 6 C14 6, 24 12, 34 22" />
        <path d="M26 22 L34 22 L33 14" />
      </g>
    </svg>
  ),
};
