import type { JSX } from 'preact';

type Shape = 'house' | 'tower' | 'wide' | 'light';

/** Where each property stands on the map, and how it is drawn. */
const SPOTS: Record<string, { x: number; y: number; shape: Shape }> = {
  cornerFlat: { x: 16, y: 142, shape: 'house' },
  oldMill: { x: 84, y: 140, shape: 'house' },
  bluePlaza: { x: 96, y: 228, shape: 'tower' },
  grandArcade: { x: 40, y: 244, shape: 'wide' },
  hilltopVilla: { x: 236, y: 30, shape: 'house' },
  skyTower: { x: 176, y: 14, shape: 'tower' },
  harbourLoft: { x: 284, y: 228, shape: 'wide' },
  lighthouse: { x: 246, y: 226, shape: 'light' },
};

function building(shape: Shape, fill: string): JSX.Element {
  const f = { fill };
  switch (shape) {
    case 'house':
      return (
        <>
          <path d="M0 12 L12 0 L24 12 V32 H0 Z" style={f} />
          <path d="M9 32 V24 H15 V32" />
        </>
      );
    case 'tower':
      return (
        <>
          <path d="M0 0 H22 V58 H0 Z" style={f} />
          <path d="M5 8 h3 M13 8 h3 M5 18 h3 M13 18 h3 M5 28 h3 M13 28 h3 M5 38 h3 M13 38 h3 M5 48 h3 M13 48 h3" />
        </>
      );
    case 'wide':
      return (
        <>
          <path d="M0 10 H38 V46 H0 Z" style={f} />
          <path d="M0 10 L19 0 L38 10" />
          <path d="M6 20 h6 M26 20 h6 M6 30 h6 M26 30 h6" />
        </>
      );
    case 'light':
      return (
        <>
          <path d="M6 50 L9 8 H19 L22 50 Z" style={f} />
          <path d="M7 4 H21 V8 H7 Z M10 20 H18 M9 34 H19" />
        </>
      );
  }
}

/** The city, drawn by hand: river, park, streets, districts and the properties. */
export function CityMap({
  owned,
  selected,
  prices,
  names,
  districts,
  label,
  yours,
  thisOne,
  onPick,
}: {
  owned: readonly string[];
  selected: string | null;
  prices: Readonly<Record<string, string>>;
  names: Readonly<Record<string, string>>;
  districts: { oldTown: string; hilltop: string; harbour: string; riverLane: string };
  label: string;
  yours: string;
  thisOne: string;
  onPick: (id: string) => void;
}) {
  const stroke = { stroke: 'var(--ink)' };
  const road = (d: string, w: number) => (
    <>
      <path d={d} style={stroke} stroke-width={w} />
      <path d={d} style={{ stroke: 'var(--paper-white)' }} stroke-width={w - 3.5} />
    </>
  );
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 350 400"
      style={{
        display: 'block',
        width: '100%',
        height: 'auto',
        background: 'var(--paper-white)',
        boxShadow: '1px 3px 6px var(--shadow)',
      }}
    >
      <g filter="url(#wobble)">
        <path
          d="M360 50 C300 90, 250 120, 228 172 S180 262, 120 300 S40 356, -10 378"
          fill="none"
          style={{ stroke: 'var(--water)' }}
          stroke-width="34"
          stroke-linecap="round"
        />
        <path
          d="M360 50 C300 90, 250 120, 228 172 S180 262, 120 300 S40 356, -10 378"
          fill="none"
          style={{ stroke: 'var(--water-line)' }}
          stroke-width="1.2"
          stroke-dasharray="7 9"
        />
        <path
          d="M18 22 C50 6, 120 10, 132 40 C142 70, 110 92, 70 90 C30 88, 6 60, 18 22 Z"
          fill="url(#hatch-green)"
          style={{ stroke: 'var(--profit)' }}
          stroke-width="1.6"
        />
        <g style={{ fill: 'var(--paper-white)', stroke: 'var(--profit)' }} stroke-width="1.6">
          <circle cx="44" cy="40" r="9" />
          <circle cx="70" cy="30" r="11" />
          <circle cx="100" cy="46" r="9" />
          <circle cx="62" cy="64" r="10" />
        </g>
        <g fill="none">
          {road('M0 212 H350', 14)}
          {road('M150 104 V400', 12)}
          {road('M0 332 L350 312', 12)}
          {road('M0 104 H350', 10)}
        </g>
        <g fill="none" style={stroke} stroke-width="1.5">
          <g transform="translate(50 146)">
            <path d="M0 12 L11 0 L22 12 V28 H0 Z" />
          </g>
          <g transform="translate(116 148)">
            <path d="M0 10 L9 0 L18 10 V26 H0 Z" />
          </g>
          <g transform="translate(206 40)">
            <path d="M0 0 H22 V40 H0 Z" />
          </g>
          <g transform="translate(176 346)">
            <path d="M0 10 L10 0 L20 10 V26 H0 Z" />
          </g>
          <g transform="translate(212 344)">
            <path d="M0 10 L10 0 L20 10 V26 H0 Z" />
          </g>
          <g transform="translate(250 340)">
            <path d="M0 0 H30 V30 H0 Z" />
          </g>
          <g transform="translate(14 236)">
            <path d="M0 12 L11 0 L22 12 V28 H0 Z" />
          </g>
        </g>
        <g transform="translate(316 362)" fill="none" style={stroke} stroke-width="1.4">
          <circle r="16" />
          <path d="M0 -22 L5 0 L0 22 L-5 0 Z" style={{ fill: 'var(--ink)' }} />
          <path d="M-22 0 H22" />
        </g>
      </g>
      {Object.entries(SPOTS).map(([id, spot]) => {
        const mine = owned.includes(id);
        const fill = mine ? 'url(#hatch-terra)' : 'var(--paper-white)';
        return (
          <g
            key={id}
            transform={`translate(${spot.x} ${spot.y})`}
            role="button"
            tabIndex={0}
            aria-label={names[id]}
            onClick={() => onPick(id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onPick(id);
            }}
            style={{ cursor: 'pointer' }}
          >
            <rect x="-8" y="-12" width="54" height="74" fill="transparent" />
            <g
              fill="none"
              style={stroke}
              stroke-width="1.7"
              stroke-linejoin="round"
              stroke-linecap="round"
            >
              {building(spot.shape, fill)}
            </g>
            {mine ? (
              <g style={stroke} stroke-width="1.4">
                <path d="M11 0 V-14" />
                <path d="M11 -14 L22 -10 L11 -6 Z" style={{ fill: 'var(--profit)' }} />
              </g>
            ) : (
              <g transform="translate(-6 34) rotate(-6)">
                <path
                  d="M8 0 H56 V18 H8 L0 9 Z"
                  style={{ fill: 'var(--paper-white)', stroke: 'var(--ink)' }}
                  stroke-width="1.3"
                />
                <circle cx="7" cy="9" r="1.6" style={{ fill: 'var(--ink)' }} />
                <text
                  x="32"
                  y="14"
                  text-anchor="middle"
                  font-family="Caveat, cursive"
                  font-weight="700"
                  font-size="13"
                  style={{ fill: 'var(--ink)' }}
                >
                  {prices[id]}
                </text>
              </g>
            )}
            {selected === id && (
              <ellipse
                cx="14"
                cy="22"
                rx="34"
                ry="38"
                fill="none"
                style={{ stroke: 'var(--loss)' }}
                stroke-width="2.2"
              />
            )}
          </g>
        );
      })}
      <text
        x="18"
        y="198"
        font-family="Caveat, cursive"
        font-size="19"
        style={{ fill: 'var(--ink-soft)' }}
      >
        {districts.oldTown}
      </text>
      <text
        x="176"
        y="96"
        font-family="Caveat, cursive"
        font-size="19"
        style={{ fill: 'var(--ink-soft)' }}
      >
        {districts.hilltop}
      </text>
      <text
        x="196"
        y="298"
        font-family="Caveat, cursive"
        font-size="19"
        style={{ fill: 'var(--ink-soft)' }}
      >
        {districts.harbour}
      </text>
      <text
        x="14"
        y="300"
        font-family="Caveat, cursive"
        font-size="19"
        style={{ fill: 'var(--ink-soft)' }}
      >
        {districts.riverLane}
      </text>
      <text
        x="310"
        y="335"
        text-anchor="middle"
        font-family="IM Fell English, serif"
        font-size="11"
        style={{ fill: 'var(--ink)' }}
      >
        N
      </text>
      {owned.length > 0 && (
        <text
          x="40"
          y="128"
          font-family="Caveat, cursive"
          font-size="15"
          style={{ fill: 'var(--profit)' }}
        >
          {yours}
        </text>
      )}
      {selected && !owned.includes(selected) && (
        <text
          x={(SPOTS[selected]?.x ?? 0) - 30}
          y={(SPOTS[selected]?.y ?? 0) - 18}
          font-family="Caveat, cursive"
          font-weight="700"
          font-size="17"
          style={{ fill: 'var(--loss)' }}
        >
          {thisOne}
        </text>
      )}
    </svg>
  );
}
