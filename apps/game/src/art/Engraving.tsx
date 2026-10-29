/** Front-page engravings: a ship, a factory, a crowd at the exchange, a field. */
export function Engraving({ event, label }: { event: string; label: string }) {
  const kind =
    event === 'tanker' || event === 'touristSummer'
      ? 'ship'
      : event === 'cocoaBlight' || event === 'frost' || event === 'goldRush'
        ? 'field'
        : event === 'satellite' || event === 'techBoom' || event === 'cloudOutage'
          ? 'sky'
          : 'exchange';
  const s = { stroke: '#2b2620' };
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 346 130"
      style={{
        width: '100%',
        height: 'auto',
        borderTop: '1px solid #2b2620',
        borderBottom: '1px solid #2b2620',
      }}
    >
      <defs>
        <pattern id="engrave" width="4" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="4" y2="0" style={s} stroke-width="1" />
        </pattern>
        <pattern
          id="engraveD"
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="4" style={s} stroke-width="1" />
        </pattern>
      </defs>
      <g
        filter="url(#wobble)"
        style={s}
        stroke-width="1.6"
        stroke-linejoin="round"
        stroke-linecap="round"
        fill="none"
      >
        {kind === 'ship' && (
          <>
            <path
              d="M0 130 V40 C20 30, 40 46, 56 38 C70 52, 84 70, 92 130 Z"
              fill="url(#engraveD)"
            />
            <path
              d="M346 130 V30 C326 24, 312 40, 296 36 C282 52, 268 76, 262 130 Z"
              fill="url(#engraveD)"
            />
            <path d="M88 92 H262 L250 112 H104 Z" fill="url(#engrave)" />
            <path d="M210 92 V64 H240 V92 M216 64 V56 H234 V64 M226 56 V44" />
            <path d="M226 42 C232 32, 222 26, 230 16" stroke-width="1.2" />
            <path d="M60 118 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0" />
          </>
        )}
        {kind === 'field' && (
          <>
            <path
              d="M0 80 C60 60, 120 70, 180 62 S300 56, 346 66 V130 H0 Z"
              fill="url(#engraveD)"
            />
            {Array.from({ length: 12 }, (_, i) => (
              <path key={i} d={`M${20 + i * 28} 100 v-22 m0 6 l-7 -6 m7 10 l7 -6`} />
            ))}
            <circle cx="280" cy="30" r="16" fill="url(#engrave)" />
          </>
        )}
        {kind === 'sky' && (
          <>
            <path d="M0 110 H346" />
            <path
              d="M40 110 V70 H70 V110 M90 110 V50 H120 V110 M150 110 V80 H190 V110 M260 110 V60 H300 V110"
              fill="url(#engrave)"
            />
            <path
              d="M200 40 l20 -10 l10 12 l-20 10 z M210 35 l-14 -12 M224 38 l14 -14"
              fill="url(#engraveD)"
            />
            <path d="M120 28 c40 -20 80 -20 120 0" stroke-dasharray="4 5" />
          </>
        )}
        {kind === 'exchange' && (
          <>
            <path d="M60 118 V50 H286 V118 M50 50 L173 14 L296 50 Z" fill="url(#engrave)" />
            <path
              d="M86 118 V60 M120 118 V60 M154 118 V60 M192 118 V60 M226 118 V60 M260 118 V60"
              stroke-width="3"
            />
            <path d="M40 118 H306 M30 126 H316" />
          </>
        )}
      </g>
    </svg>
  );
}
