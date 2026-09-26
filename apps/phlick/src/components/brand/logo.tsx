import React from 'react';

/**
 * The phlick mark: a rounded tile carrying the brand's two-tone pulse — the
 * cyan echo behind the red stroke, the same offset-echo trick the reference's
 * own mark uses — with a play wedge cut by the pulse line.
 */
export const Logo: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="phlick">
    <defs>
      <linearGradient id="phlick-tile" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1d1d29" />
        <stop offset="100%" stopColor="#0b0b0f" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="12" fill="url(#phlick-tile)" />
    {/* cyan echo, offset like a chromatic ghost */}
    <path d="M19 14v20l16-10z" fill="#25f4ee" transform="translate(-1.6 1.6)" opacity="0.9" />
    {/* red pulse on top */}
    <path d="M19 14v20l16-10z" fill="#fe2c55" />
    {/* the pulse line crossing the wedge */}
    <path d="M10 27h7l3-8 4 12 3-6h11" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
  </svg>
);
