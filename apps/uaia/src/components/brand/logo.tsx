import React from 'react';

export type MarkVariant = 'line' | 'filled' | 'mono';

/**
 * The UAIA mark — an original "aperture knot": six slender crescent petals
 * (thin, fingernail-like arcs) revolving inside a near-oval super-ellipse
 * ring. Three faces: `line` (gradient strokes on transparent), `filled`
 * (gradient tile behind a white knot — the home-page face), and `mono`
 * (all white — the footer face).
 */
export const Mark: React.FC<{ size?: number; variant?: MarkVariant }> = ({ size = 30, variant = 'line' }) => {
  const petals = Array.from({ length: 6 }, (_, i) => i * 60);
  const uid = React.useId().replace(/[:]/g, '');
  const gradId = `uaia-sig-${uid}`;
  const ink = variant === 'line' ? `url(#${gradId})` : '#ffffff';
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="UAIA">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      {variant === 'filled' && (
        <rect x="1" y="1" width="62" height="62" rx="18" ry="18" fill={`url(#${gradId})`} />
      )}
      {/* near-oval super-ellipse ring */}
      <rect
        x="8"
        y="10.5"
        width="48"
        height="43"
        rx="21.5"
        ry="20"
        fill="none"
        stroke={ink}
        strokeWidth="1.6"
        opacity={variant === 'filled' ? 0.9 : 0.85}
      />
      {/* six fingernail crescents */}
      <g>
        {petals.map((deg) => (
          <path
            key={deg}
            d="M32 15 C 40 18.5, 42.6 26.5, 39 32.5 C 40 24.5, 36.4 19.4, 32 15 Z"
            fill={ink}
            opacity="0.94"
            transform={`rotate(${deg} 32 32)`}
          />
        ))}
      </g>
      <circle cx="32" cy="32" r="3" fill={ink} />
    </svg>
  );
};

/** Squarish, almost-oval wordmark lockup. */
export const Logo: React.FC<{ size?: number; wordmark?: boolean; variant?: MarkVariant }> = ({
  size = 30,
  wordmark = true,
  variant = 'line',
}) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
    <Mark size={size} variant={variant} />
    {wordmark && (
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          letterSpacing: '0.34em',
          fontSize: Math.round(size * 0.5),
          transform: 'scaleY(0.94)',
          color: variant === 'mono' ? '#ffffff' : undefined,
        }}
      >
        UAIA
      </span>
    )}
  </span>
);
