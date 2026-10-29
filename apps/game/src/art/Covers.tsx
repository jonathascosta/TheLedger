/** The notebook's cover by peak net worth: notepad, spiral notebook, leather ledger. */
export type CoverKind = 'notepad' | 'spiral' | 'leather';

export function coverFor(peak: number): CoverKind {
  return peak >= 1e9 ? 'leather' : peak >= 1e6 ? 'spiral' : 'notepad';
}

export function Cover({
  kind,
  title,
  subtitle,
  width = 120,
}: {
  kind: CoverKind;
  title: string;
  subtitle: string;
  width?: number;
}) {
  const height = width * 1.3;
  const common = { width: `${width}px`, height: `${height}px` };
  if (kind === 'notepad') {
    return (
      <div
        class="cover"
        style={{
          ...common,
          background: 'var(--kraft)',
          boxShadow: '2px 3px 0 #9d7a4c, 3px 6px 12px var(--shadow)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '22%',
            left: '14%',
            right: '14%',
            padding: '6px',
            background: 'var(--paper-white)',
            transform: 'rotate(-2deg)',
          }}
        >
          <p class="hand" style={{ fontWeight: 700, fontSize: `${width / 6}px`, lineHeight: 1 }}>
            {title}
          </p>
          <p class="hand muted" style={{ fontSize: `${width / 9}px` }}>
            {subtitle}
          </p>
        </div>
      </div>
    );
  }
  if (kind === 'spiral') {
    return (
      <div
        class="cover"
        style={{
          ...common,
          background: 'var(--spiral)',
          boxShadow: '2px 3px 0 #1e3350, 3px 6px 12px var(--shadow)',
        }}
      >
        <svg
          aria-hidden="true"
          viewBox={`0 0 20 ${height}`}
          width="20"
          height={height}
          style={{ position: 'absolute', left: '-8px', top: 0 }}
        >
          {Array.from({ length: Math.floor(height / 18) }, (_, i) => (
            <ellipse
              key={i}
              cx="10"
              cy={12 + i * 18}
              rx="8"
              ry="3.5"
              fill="none"
              style={{ stroke: '#c9ccd1' }}
              stroke-width="2.4"
            />
          ))}
        </svg>
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '16%',
            right: '12%',
            padding: '8px 4px',
            background: 'var(--paper)',
            textAlign: 'center',
            border: '2px solid var(--ink)',
          }}
        >
          <p
            class="print"
            style={{
              fontSize: `${width / 9}px`,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </p>
          <p class="hand" style={{ fontSize: `${width / 8}px` }}>
            {subtitle}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div
      class="cover"
      style={{
        ...common,
        background: 'var(--leather)',
        boxShadow: '3px 4px 0 #142619, 4px 8px 14px var(--shadow)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '8% 8% 8% 14%',
          border: '2px solid var(--gold)',
          outline: '1px solid var(--gold)',
          outlineOffset: '-6px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '14%',
          right: '8%',
          textAlign: 'center',
          color: 'var(--gold)',
        }}
      >
        <p
          class="print"
          style={{
            fontSize: `${width / 8}px`,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            lineHeight: 1.1,
          }}
        >
          {title}
        </p>
        <p
          class="print"
          style={{ fontSize: `${width / 11}px`, fontStyle: 'italic', marginTop: '6px' }}
        >
          {subtitle}
        </p>
      </div>
      <div
        style={{
          position: 'absolute',
          right: '18%',
          bottom: '-14px',
          width: '12px',
          height: '28px',
          background: 'var(--wax)',
          clipPath: 'polygon(0 0,100% 0,100% 100%,50% 80%,0 100%)',
        }}
      />
    </div>
  );
}
