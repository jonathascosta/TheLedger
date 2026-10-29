import { BusinessDoodle } from './Doodles.tsx';

const AWNINGS = [
  '--loss',
  '--profit',
  '--spiral',
  '--pie-3',
  '--highlight',
  '--pie-8',
  '--pie-5',
  '--pie-2',
  '--gold-dark',
  '--pie-4',
];

/** An ink sketch of a business's front: awning, sign, window, door. */
export function Storefront({ index, name }: { index: number; name: string }) {
  const awning = `var(${AWNINGS[index % AWNINGS.length]!})`;
  const stroke = { stroke: 'var(--ink)' };
  const stripes = [14, 74, 134, 194, 254]
    .map((x) => `M${x} 24 L${x + 12} 52 L${x + 30} 24 Z`)
    .join(' ');
  return (
    <svg
      role="img"
      aria-label={name}
      viewBox="0 0 318 150"
      style={{ width: '100%', height: 'auto' }}
    >
      <g
        filter="url(#wobble)"
        fill="none"
        style={stroke}
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
      >
        <path d="M20 146 V24 H298 V146" />
        <path d="M8 146 H310" />
        <path d="M14 24 H304 L292 52 H26 Z" style={{ fill: 'var(--paper)', ...stroke }} />
        <path d={stripes} style={{ fill: awning, stroke: 'none' }} opacity="0.75" />
        <path d="M26 52 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 16 0" />
        <rect
          x="36"
          y="70"
          width="150"
          height="66"
          style={{ fill: 'var(--paper-white)', ...stroke }}
        />
        <path d="M111 70 V136" />
        <rect x="206" y="70" width="44" height="76" fill="url(#hatch-ink)" opacity="0.5" />
        <rect x="206" y="70" width="44" height="76" />
        <circle cx="242" cy="110" r="2.5" style={{ fill: 'var(--ink)' }} />
        <path
          d="M264 146 L272 104 H296 L304 146 M268 126 H300"
          style={{ fill: 'var(--ink)', ...stroke }}
        />
      </g>
      <text
        x="159"
        y="17"
        text-anchor="middle"
        font-family="IM Fell English, serif"
        font-size="15"
        letter-spacing="2"
        style={{ fill: 'var(--ink)' }}
      >
        {name.toUpperCase()}
      </text>
      <g transform="translate(55 82)">
        <BusinessDoodle index={index} size={44} />
      </g>
      <g transform="translate(128 82)">
        <BusinessDoodle index={index} size={44} />
      </g>
    </svg>
  );
}
