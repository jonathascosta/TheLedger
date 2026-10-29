/** A pie coloured in with pencils, one hatching per class. */
export function Donut({
  parts,
  label,
  center,
  caption,
}: {
  parts: readonly { value: number; pattern: number }[];
  label: string;
  center: string;
  caption: string;
}) {
  const r = 66;
  const c = 2 * Math.PI * r;
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  let offset = 0;
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 318 196"
      style={{ width: '100%', height: 'auto', overflow: 'visible' }}
    >
      <g transform="rotate(-90 159 98)" fill="none" stroke-width="36">
        {parts.map((p, i) => {
          const len = (p.value / total) * c;
          const dash = `${len.toFixed(2)} ${c.toFixed(2)}`;
          const off = -offset;
          offset += len;
          if (len <= 0) return null;
          return (
            <g key={i}>
              <circle
                cx="159"
                cy="98"
                r={r}
                style={{ stroke: `var(--pie-${p.pattern})` }}
                opacity="0.2"
                stroke-dasharray={dash}
                stroke-dashoffset={off}
              />
              <circle
                cx="159"
                cy="98"
                r={r}
                stroke={`url(#pie-${p.pattern})`}
                stroke-dasharray={dash}
                stroke-dashoffset={off}
              />
            </g>
          );
        })}
      </g>
      <g filter="url(#wobble)" fill="none" style={{ stroke: 'var(--ink)' }} stroke-width="1.6">
        <circle cx="159" cy="98" r="85" />
        <circle cx="159" cy="98" r="47" />
      </g>
      <text
        x="159"
        y="96"
        text-anchor="middle"
        font-family="Caveat, cursive"
        font-weight="700"
        font-size="26"
        style={{ fill: 'var(--ink)' }}
      >
        {center}
      </text>
      <text
        x="159"
        y="114"
        text-anchor="middle"
        font-family="Courier Prime, monospace"
        font-size="11"
        style={{ fill: 'var(--ink-soft)' }}
      >
        {caption}
      </text>
    </svg>
  );
}

export function Swatch({ pattern }: { pattern: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" width="18" height="18" style={{ flex: 'none' }}>
      <rect
        x="2"
        y="2"
        width="14"
        height="14"
        style={{ fill: `var(--pie-${pattern})` }}
        opacity="0.2"
      />
      <rect x="2" y="2" width="14" height="14" fill={`url(#pie-${pattern})`} />
    </svg>
  );
}
