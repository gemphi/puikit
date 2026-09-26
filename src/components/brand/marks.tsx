import React from 'react';

/**
 * The phi ecosystem's brand marks — sixteen brands, each with FOUR options
 * drawn from pure SVG paths on a 24-grid, stroked in `currentColor`:
 *
 *   0 — the base geometric mark
 *   1 — the same motif with CONCAVE sides
 *   2 — the motif as WAVES
 *   3 — RECURSION to three levels, or the brand's GREEK letterform
 *
 * The hue is the brand's identity color as DATA; surfaces derive washes from
 * it rather than hardcoding a palette.
 */
export interface BrandMarkDef {
  name: string;
  tagline: string;
  /** Identity hue, 0-360. */
  hue: number;
  /** Four options; each option is a set of paths. */
  variants: string[][];
}

const EGG = 'M12 3c-4 0-7 5.5-7 10a7 7 0 0 0 14 0c0-4.5-3-10-7-10z';
const TILE = 'M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z';
const ROCKET = 'M12 3c2.6 2.1 3.6 5.2 3.6 8.2L12 14.4l-3.6-3.2C8.4 8.2 9.4 5.1 12 3z';
const PORT = 'M12 8.3a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z';
const PAD = 'M5.5 21h13';
const NODE = 'M12 10a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4z';
const SATS = 'M5.5 5a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zM18.5 5a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zM12 17.5a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4z';
const LINKS = 'M10.4 10.7 6.8 7.6M13.6 10.7l3.6-3.1M12 14.4v3.1';
const CUBE = 'M12 3l7 4v10l-7 4-7-4V7z';
const CUBE_IN = 'M12 11l7-4M12 11L5 7M12 11v10';
const HEAD = 'M6 8.5h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z';
const ANT = 'M12 8.5V6M12 4.8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z';
const FILE = 'M7 3h7l5 5v13H7z';
const FOLD = 'M14 3v5h5';
const PRISM = 'M10 4l7 14H3z';
const CAL = 'M5 6h14a1.5 1.5 0 0 1 1.5 1.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6z';
const CAL_TOP = 'M8 3.5V8M16 3.5V8M3.5 11h17';
const KEYS = 'M4 6h16v12H4z';
const BOOK = 'M4 5.5c2.5-1.2 5.5-1.2 8 0 2.5-1.2 5.5-1.2 8 0V19c-2.5-1.2-5.5-1.2-8 0-2.5-1.2-5.5-1.2-8 0z';
const ENV = 'M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z';
const PHI_STEM = 'M12 2.5v19';

export const BRAND_MARKS: Record<string, BrandMarkDef> = {
  phiegg: {
    name: 'phiegg',
    tagline: 'The social gallery for NFT collections — the feed meets the vault.',
    hue: 45,
    variants: [
      [EGG, 'M12 10.4l3.1 5.4H8.9z'],
      [EGG, 'M12 10.2C12.7 12.2 13.8 13.5 15.1 14.5C13.1 14.1 10.9 14.1 8.9 14.5C10.2 13.5 11.3 12.2 12 10.2Z'],
      [EGG, 'M12 9.4C12.93 9.77 12.63 11.73 13.56 12.1C14.49 12.46 14.19 14.43 15.12 14.8C14.34 15.42 12.78 14.18 12 14.8C11.22 15.42 9.66 14.18 8.88 14.8C8.74 13.82 10.59 13.09 10.44 12.1C10.29 11.12 12.15 10.38 12 9.4Z'],
      [EGG, 'M12 9.4l3.8 6.6H8.2z', 'M12 11.2l2.5 4.3H9.5z', 'M12 13l1.2 2.1h-2.4z'],
    ],
  },
  phlick: {
    name: 'phlick',
    tagline: 'The short-video feed.',
    hue: 350,
    variants: [
      [TILE, 'M10.5 9l5.5 3-5.5 3z', 'M7.5 17h9'],
      [TILE, 'M10 8.6c2.2 1 4.1 2.1 5.8 3.4-1.7 1.3-3.6 2.4-5.8 3.4.6-2.2.6-4.6 0-6.8z'],
      [TILE, 'M7 12h1.8l1.2-2.5 1.8 5 1.2-2.5H17'],
      [TILE, 'M9.2 8.8l6.6 3.2-6.6 3.2z', 'M10.8 10.4l3.4 1.6-3.4 1.6z', 'M12 11.6l1 .4-1 .4z'],
    ],
  },
  phipad: {
    name: 'phipad',
    tagline: 'The launching pad for every NFT drop.',
    hue: 15,
    variants: [
      [ROCKET, PORT, 'M9 15.5l-1.6 3.5M15 15.5l1.6 3.5M12 15v4.5', PAD],
      ['M12 3c1.7 2.5 2.4 5.3 2.3 8.1-.6 1.3-1.4 2.4-2.3 3.3-.9-.9-1.7-2-2.3-3.3-.1-2.8.6-5.6 2.3-8.1z', PORT, PAD],
      [ROCKET, PORT, 'M8 17.2c1.3-1 2.7-1 4 0s2.7 1 4 0', 'M8 20c1.3-1 2.7-1 4 0s2.7 1 4 0'],
      [ROCKET, PORT, 'M9.2 15.6l2.8 1.9 2.8-1.9', 'M9.9 17.9l2.1 1.4 2.1-1.4', 'M10.6 20.2l1.4.9 1.4-.9'],
    ],
  },
  phient: {
    name: 'phient',
    tagline: 'The agentic platform — operations, reasoned end to end.',
    hue: 265,
    variants: [
      [NODE, SATS, LINKS],
      ['M12 8.6c1 .9 2.1 1.5 3.3 1.8-.4 1.2-.4 2.4 0 3.6-1.2.3-2.3.9-3.3 1.8-1-.9-2.1-1.5-3.3-1.8.4-1.2.4-2.4 0-3.6 1.2-.3 2.3-.9 3.3-1.8z', SATS, LINKS],
      [NODE, SATS, 'M10.4 10.6c-1.7-.4-2.9-1.4-3.6-3M13.6 10.6c1.7-.4 2.9-1.4 3.6-3M12 14.4c.7 1 .7 2 0 3.1'],
      ['M8 5.5c1.9 0 2.8 1.1 3.5 2.9L16 18.5', 'M11.3 12.7 8.3 18.5'],
    ],
  },
  phigal: {
    name: 'phigal',
    tagline: 'The 3D spatial platform.',
    hue: 200,
    variants: [
      [CUBE, CUBE_IN],
      ['M12 3l7 4c-.6 3.3-.6 6.7 0 10l-7 4-7-4c.6-3.3.6-6.7 0-10z', CUBE_IN],
      [CUBE, CUBE_IN, 'M8.5 15.5c1.2-.9 2.3-.9 3.5 0s2.3.9 3.5 0'],
      [CUBE, 'M12 7.2l4.2 2.4v4.8L12 16.8l-4.2-2.4V9.6z', 'M12 10.2l1.7 1v1.9l-1.7 1-1.7-1v-1.9z'],
    ],
  },
  phiace: {
    name: 'phiace',
    tagline: 'The robotics development kit.',
    hue: 145,
    variants: [
      [HEAD, 'M9 12.5v2M15 12.5v2', ANT],
      [HEAD, 'M8 12.2c1.3 1.1 2.7 1.6 4 1.6s2.7-.5 4-1.6', ANT],
      [HEAD, 'M8 13.6h1.6l1-2 1.4 3.4 1-1.9H16', ANT],
      [HEAD, 'M9.3 11.5v.7a2.7 2.7 0 0 0 5.4 0v-.7', 'M12 11.2v5.1', ANT],
    ],
  },
  phiphx: {
    name: 'phiphx',
    tagline: 'The interchange format of the phiace ecosystem.',
    hue: 285,
    variants: [
      [FILE, FOLD, 'M10.5 13l-2 2.5 2 2.5M13.5 13l2 2.5-2 2.5'],
      [FILE, FOLD, 'M10.6 12.8c-1.1.6-1.6 1.5-1.6 2.7s.5 2.1 1.6 2.7M13.4 12.8c1.1.6 1.6 1.5 1.6 2.7s-.5 2.1-1.6 2.7'],
      [FILE, FOLD, 'M9.3 14.6c.9-.8 1.8-.8 2.7 0s1.8.8 2.7 0', 'M9.3 17c.9-.8 1.8-.8 2.7 0s1.8.8 2.7 0'],
      [FILE, FOLD, 'M10 13.2l2 2.3-2 2.3', 'M12 13.7l1.6 1.8-1.6 1.8', 'M13.9 14.2l1.1 1.3-1.1 1.3'],
    ],
  },
  phiray: {
    name: 'phiray',
    tagline: 'The rendering engine.',
    hue: 55,
    variants: [
      [PRISM, 'M13 9.5l7-2.5M14.5 13.5H21M13.5 17l6.5 3'],
      ['M10 4c1.9 4.9 4.2 9.6 7 14-4.9-1-9.1-1-14 0 2.8-4.4 5.1-9.1 7-14z', 'M13 9.5l7-2.5M14.5 13.5H21M13.5 17l6.5 3'],
      [PRISM, 'M13.2 9.3c1.2-.9 2.4-.4 3.4.2s2.2 1 3.4.4', 'M14 13.4c1.2-.9 2.4-.4 3.4.2s2.1 1 3.1.4'],
      [PRISM, 'M10 8.2l4.4 8.8H5.6z', 'M10 12.4l2.1 4.6H7.9z'],
    ],
  },
  phical: {
    name: 'phical',
    tagline: 'Shared time across the ecosystem.',
    hue: 220,
    variants: [
      [CAL, CAL_TOP, 'M12 13.5V18M12 14.6a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z'],
      [CAL, CAL_TOP, 'M12 12.8c.5 1 1.2 1.7 2.2 2.2-1 .5-1.7 1.2-2.2 2.2-.5-1-1.2-1.7-2.2-2.2 1-.5 1.7-1.2 2.2-2.2z'],
      [CAL, CAL_TOP, 'M8 14.8c1.3-1 2.7-1 4 0s2.7 1 4 0', 'M8 17.4c1.3-1 2.7-1 4 0s2.7 1 4 0'],
      [CAL, CAL_TOP, 'M8.6 12.8h6.8v5H8.6z', 'M10.1 14.1h3.8v2.4h-3.8z', 'M11.3 15.1h1.4v.6h-1.4z'],
    ],
  },
  puijs: {
    name: 'puijs',
    tagline: 'The design system every phi surface is built from.',
    hue: 230,
    variants: [
      ['M4 8l8-4 8 4-8 4z', 'M4 12l8 4 8-4', 'M4 16l8 4 8-4'],
      ['M4 8c2.7-2.4 5.3-3.6 8-3.6s5.3 1.2 8 3.6c-2.7 2.4-5.3 3.6-8 3.6S6.7 10.4 4 8z', 'M4 12c2.7 2.4 5.3 3.6 8 3.6s5.3-1.2 8-3.6', 'M4 16c2.7 2.4 5.3 3.6 8 3.6s5.3-1.2 8-3.6'],
      ['M4 8c1.3-1.2 2.7-1.2 4 0s2.7 1.2 4 0 2.7-1.2 4 0 2.7 1.2 4 0', 'M4 12c1.3-1.2 2.7-1.2 4 0s2.7 1.2 4 0 2.7-1.2 4 0 2.7 1.2 4 0', 'M4 16c1.3-1.2 2.7-1.2 4 0s2.7 1.2 4 0 2.7-1.2 4 0 2.7 1.2 4 0'],
      ['M6 8.5h12', 'M9 8.5V18', 'M15 8.5v7.5c0 1.4.8 2.1 2.2 1.9'],
    ],
  },
  phi: {
    name: 'phi',
    tagline: 'The core platform.',
    hue: 245,
    variants: [
      [PHI_STEM, 'M12 5.2c-3.7 0-6.6 3-6.6 6.8s2.9 6.8 6.6 6.8 6.6-3 6.6-6.8-2.9-6.8-6.6-6.8z'],
      [PHI_STEM, 'M12 5.2c-3.4 1.9-5.1 4.2-5.1 6.8s1.7 4.9 5.1 6.8c3.4-1.9 5.1-4.2 5.1-6.8s-1.7-4.9-5.1-6.8z'],
      [PHI_STEM, 'M5.5 12c2.2-1.7 4.3-1.7 6.5 0s4.3 1.7 6.5 0'],
      [PHI_STEM, 'M12 6c-3.2 0-5.8 2.7-5.8 6s2.6 6 5.8 6 5.8-2.7 5.8-6-2.6-6-5.8-6z', 'M12 9.1c-1.6 0-2.9 1.3-2.9 2.9s1.3 2.9 2.9 2.9 2.9-1.3 2.9-2.9-1.3-2.9-2.9-2.9z'],
    ],
  },
  phiano: {
    name: 'phiano',
    tagline: 'The sound and audio workspace.',
    hue: 320,
    variants: [
      [KEYS, 'M8.5 6v7M12 6v7M15.5 6v7'],
      [KEYS, 'M8.5 6c-.4 2.4-.4 4.6 0 7M12 6c.4 2.4.4 4.6 0 7M15.5 6c-.4 2.4-.4 4.6 0 7'],
      [KEYS, 'M6 15.3c1.3-1 2.7-1 4 0s2.7 1 4 0 2.7-1 4 0'],
      [KEYS, 'M7 8.5h10v7H7z', 'M9.5 10.7h5v2.6h-5z'],
    ],
  },
  phidoc: {
    name: 'phidoc',
    tagline: 'Documents with a pulse.',
    hue: 175,
    variants: [
      [FILE, FOLD, 'M9 15.5h2l1-2.5 1.5 4 1-1.5h1.5'],
      ['M7 3h7l5 5v12.6c-3.2-1-6.8-1-10 0z', FOLD, 'M9 15.5h2l1-2.5 1.5 4 1-1.5h1.5'],
      [FILE, FOLD, 'M9.5 13.6c.8-.7 1.7-.7 2.5 0s1.7.7 2.5 0', 'M9.5 16.2c.8-.7 1.7-.7 2.5 0s1.7.7 2.5 0'],
      [FILE, FOLD, 'M13.8 11.9c-.7-.4-1.7-.4-2.4.2-.7.7-.5 1.6.4 2.2.9.5 1.3 1.2 1.1 2.1a2 2 0 1 1-3.2-2'],
    ],
  },
  phixum: {
    name: 'phixum',
    tagline: 'Options, priced and pictured.',
    hue: 205,
    variants: [
      ['M7 7.5v9M5.5 9.5h3v4h-3z', 'M12 4.5v15M10.5 8h3v6h-3z', 'M17 8.5v9M15.5 11h3v4h-3z'],
      ['M7 7.5v9M7 9.5c1.2 1.2 1.2 2.8 0 4-1.2-1.2-1.2-2.8 0-4z', 'M12 4.5v15M12 8c1.4 1.7 1.4 4.3 0 6-1.4-1.7-1.4-4.3 0-6z', 'M17 8.5v9M17 11c1.2 1.2 1.2 2.8 0 4-1.2-1.2-1.2-2.8 0-4z'],
      ['M7 7.5v9M5.5 9.5h3v4h-3z', 'M12 4.5v15M10.5 8h3v6h-3z', 'M17 8.5v9M15.5 11h3v4h-3z', 'M4 12.8c2.7-1.6 5.3-1.6 8 0s5.3 1.6 8 0'],
      ['M16 6.5H8.5l4.8 5.5-4.8 5.5H16'],
    ],
  },
  phibook: {
    name: 'phibook',
    tagline: 'The living documentation book.',
    hue: 25,
    variants: [
      [BOOK, 'M12 5.5V19'],
      ['M4 5.5c2.5-1.8 5.5-1.8 8 .6 2.5-2.4 5.5-2.4 8-.6V19c-2.5-1.8-5.5-1.8-8 .6-2.5-2.4-5.5-2.4-8-.6z', 'M12 6.1v13.5'],
      [BOOK, 'M12 5.5V19', 'M6.2 10.5c1.1-.8 2.2-.8 3.3 0M14.5 10.5c1.1-.8 2.2-.8 3.3 0M6.2 13.5c1.1-.8 2.2-.8 3.3 0M14.5 13.5c1.1-.8 2.2-.8 3.3 0'],
      ['M7.5 18.5h3.2v-1.8a4.8 4.8 0 1 1 2.6 0v1.8h3.2'],
    ],
  },
  phimail: {
    name: 'phimail',
    tagline: 'Mail that keeps the thread.',
    hue: 0,
    variants: [
      [ENV, 'M3.5 7.5L12 13.5l8.5-6'],
      [ENV, 'M3.5 7.5c2.8 3 5.7 4.5 8.5 4.5s5.7-1.5 8.5-4.5'],
      [ENV, 'M3.5 8.5c2.8 1.8 5.7 2.7 8.5 2.7s5.7-.9 8.5-2.7', 'M3.5 11.8c2.8 1.8 5.7 2.7 8.5 2.7s5.7-.9 8.5-2.7'],
      [ENV, 'M6 8.5l6 4 6-4', 'M8 10.8l4 2.6 4-2.6', 'M10 13.1l2 1.3 2-1.3'],
    ],
  },
};

/** Slugs in display order. */
export const BRAND_MARK_ORDER = Object.keys(BRAND_MARKS);

export const BRAND_MARK_VARIANTS = 4;

export interface BrandMarkProps {
  brand: string;
  /** Which of the four options to draw (0-3). */
  variant?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  title?: string;
}

/** One mark, stroked in `currentColor`, sized by its box. */
export const BrandMark: React.FC<BrandMarkProps> = ({
  brand,
  variant = 0,
  size = 24,
  strokeWidth = 1.7,
  className,
  title,
}) => {
  const def = BRAND_MARKS[brand];
  if (!def) return null;
  const paths = def.variants[Math.min(Math.max(variant, 0), def.variants.length - 1)];
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className}
      data-brand-mark={brand}
      data-mark-variant={variant}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
};
