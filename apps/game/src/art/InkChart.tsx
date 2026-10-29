/** A line drawn in ink as it happens, with the area under it shaded in pencil. */
export function InkChart({
  values,
  width = 318,
  height = 150,
  label,
  highlightLast = 0,
  marks,
}: {
  values: readonly number[];
  width?: number;
  height?: number;
  label: string;
  /** Highlights the last n points in yellow. */
  highlightLast?: number;
  /** Labels on the right edge: [value, text]. */
  marks?: readonly (readonly [number, string])[];
}) {
  const pad = 6;
  const right = marks ? 52 : 6;
  const data = values.length > 1 ? values : [values[0] ?? 0, values[0] ?? 0];
  let min = Math.min(...data);
  let max = Math.max(...data);
  if (max - min < Math.abs(max) * 1e-6 + 1e-9) {
    max += Math.abs(max) * 0.05 + 1;
    min -= Math.abs(min) * 0.05 + 1;
  }
  const w = width - pad - right;
  const h = height - pad * 2 - 14;
  const x = (i: number): number => pad + (i / (data.length - 1)) * w;
  const y = (v: number): number => pad + h - ((v - min) / (max - min)) * h;
  const points = data.map((v, i) => `${x(i).toFixed(1)} ${y(v).toFixed(1)}`);
  const line = `M${points.join(' L')}`;
  const area = `${line} L${x(data.length - 1).toFixed(1)} ${pad + h} L${pad} ${pad + h} Z`;
  const hl = Math.min(highlightLast, data.length - 1);
  const highlight = hl > 0 ? `M${points.slice(data.length - 1 - hl).join(' L')}` : null;
  const last = data[data.length - 1]!;
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', height: 'auto', overflow: 'visible' }}
    >
      <g filter="url(#wobble)">
        {marks?.map(([v]) => (
          <path
            key={v}
            d={`M${pad} ${y(v)} H${pad + w}`}
            fill="none"
            style={{ stroke: 'var(--pencil)' }}
            stroke-width="1"
            stroke-dasharray="2 5"
          />
        ))}
        <path d={area} fill="url(#hatch)" opacity="0.5" />
        {highlight && (
          <path
            d={highlight}
            fill="none"
            style={{ stroke: 'var(--highlight)' }}
            stroke-width="14"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.55"
          />
        )}
        <path
          key={data.length > 2 ? 'line' : 'flat'}
          d={line}
          fill="none"
          style={{ stroke: 'var(--ink)', animation: 'draw 1.6s ease-out both' }}
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-linejoin="round"
          pathLength={1}
          stroke-dasharray="1"
        />
        <path
          d={`M${pad} ${pad + h} L${pad + w + 2} ${pad + h}`}
          fill="none"
          style={{ stroke: 'var(--ink)' }}
          stroke-width="1.4"
        />
        <circle cx={x(data.length - 1)} cy={y(last)} r="3.5" style={{ fill: 'var(--ink)' }} />
      </g>
      {marks?.map(([v, text]) => (
        <text
          key={text}
          x={pad + w + 8}
          y={y(v) + 5}
          font-family="Caveat, cursive"
          font-size="16"
          style={{ fill: 'var(--ink-soft)' }}
        >
          {text}
        </text>
      ))}
    </svg>
  );
}

/** A tiny sparkline for lists. */
export function Sparkline({ values, up }: { values: readonly number[]; up: boolean }) {
  const data = values.slice(-40);
  if (data.length < 2) return <svg width="70" height="24" aria-hidden="true" />;
  const min = Math.min(...data);
  const max = Math.max(...data) || 1;
  const span = max - min || 1;
  const d = data
    .map(
      (v, i) =>
        `${i === 0 ? 'M' : 'L'}${((i / (data.length - 1)) * 68 + 1).toFixed(1)} ${(22 - ((v - min) / span) * 20).toFixed(1)}`,
    )
    .join(' ');
  return (
    <svg width="70" height="24" viewBox="0 0 70 24" aria-hidden="true">
      <path
        d={d}
        fill="none"
        style={{ stroke: up ? 'var(--profit)' : 'var(--loss)' }}
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}
