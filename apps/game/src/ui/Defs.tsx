/** Shared SVG filters and patterns: the stamp's worn ink, the hand's wobble, pencil hatching. */
export function Defs() {
  return (
    <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        <filter id="ink-stamp">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="1"
            seed="11"
            result="n"
          />
          <feColorMatrix
            in="n"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.8 1.9"
            result="m"
          />
          <feComposite in="SourceGraphic" in2="m" operator="in" />
        </filter>
        <filter id="wobble">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="3" />
        </filter>
        <filter id="wax">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="2" />
          <feDisplacementMap in="SourceGraphic" scale="4" />
        </filter>
        <pattern
          id="hatch"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(35)"
        >
          <line x1="0" y1="0" x2="0" y2="6" style={{ stroke: '#7e8ba6' }} stroke-width="1.2" />
        </pattern>
        <pattern
          id="hatch-ink"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(40)"
        >
          <line x1="0" y1="0" x2="0" y2="5" style={{ stroke: 'var(--ink)' }} stroke-width="1.2" />
        </pattern>
        <pattern
          id="hatch-red"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-30)"
        >
          <line x1="0" y1="0" x2="0" y2="6" style={{ stroke: 'var(--loss)' }} stroke-width="1.6" />
        </pattern>
        <pattern
          id="hatch-green"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(30)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="5"
            style={{ stroke: 'var(--profit)' }}
            stroke-width="1.3"
          />
        </pattern>
        <pattern
          id="hatch-terra"
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-35)"
        >
          <line x1="0" y1="0" x2="0" y2="4" style={{ stroke: 'var(--pie-3)' }} stroke-width="1.5" />
        </pattern>
        {[30, -40, 60, 10, -20, 45, -60, 80, -10].map((angle, i) => (
          <pattern
            key={i}
            id={`pie-${i + 1}`}
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
            patternTransform={`rotate(${angle})`}
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="5"
              style={{ stroke: `var(--pie-${i + 1})` }}
              stroke-width="1.7"
            />
          </pattern>
        ))}
      </defs>
    </svg>
  );
}
