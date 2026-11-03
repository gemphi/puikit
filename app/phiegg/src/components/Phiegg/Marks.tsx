import { Box } from '@pui/components';
import React from 'react';
import { site } from '../../lib/data';
import WORDMARK from './wordmark.json';

const M = site.brand;
/** Wordmark: "phiegg" in the Phiegg font (Square, 1d); the last two g's are a 6 spun 180° and a 9 moved down. Sized by font-size (1em = cap height). */
export const Wordmark: React.FC = () => {
  const uid = React.useId().replace(/:/g, '');
  return (
    <Box as="span" role="img" aria-label={M.name.toLowerCase()} className="ph-wordmark">
      {WORDMARK.map((g, i) => (
        <svg key={i} viewBox={g.vb} width={g.w + 'em'} height={g.h + 'em'} overflow="visible" aria-hidden="true">
          <defs><mask id={uid + i} maskUnits="userSpaceOnUse" x={-60} y={-60} width={400} height={600}><rect x={-60} y={-60} width={400} height={600} fill="white" />{g.cuts.map((d, k) => <path key={k} d={d} fill="black" />)}</mask></defs>
          <g transform={g.tf}><g mask={'url(#' + uid + i + ')'}>{g.parts.map((p, k) => <path key={k} d={p.d} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} strokeLinecap="round" strokeLinejoin="round" />)}</g></g>
        </svg>
      ))}
    </Box>
  );
};
/** Phiegg mark: egg ∪ triangle, tilted, with a pill inside the oval: parallel to it, 1/3 of the inner height, 75% of the inner width; the oval's right end is softly flattened like a nail tip (site.brand.mark). */
export const PhieggMark: React.FC<{ size?: string }> = ({ size = '1.5rem' }) => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={11} strokeLinejoin="round" width={size} height={size}>
    <path d={M.mark} transform={`rotate(${M.markRotate} 50 50)`} />
    <path d="M35,56.06 C43,56.06 45,57.9 50,57.9 C55,57.9 57,56.06 65,56.06 A6,6 0 0 1 65,68.06 C57,68.06 55,66.22 50,66.22 C45,66.22 43,68.06 35,68.06 A6,6 0 0 1 35,56.06 Z" transform={`rotate(${M.markRotate} 50 50)`} fill="currentColor" stroke="none" />
  </svg>
);
/** Phipad mark: the Phiegg mark plus a round pill slanting from the bottom-left corner into the oval's centre. */
export const PhipadMark: React.FC<{ size?: string }> = ({ size = '1.5rem' }) => {
  const p = M.phipadPill;
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeLinejoin="round" width={size} height={size}>
      <g transform={`rotate(${M.markRotate} 50 50)`}><path d={M.mark} strokeWidth={11} /><line x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} strokeWidth={p.width} strokeLinecap="round" /></g>
    </svg>
  );
};
/** Menu glyph: three bars, the middle one shorter and centred. */
export const MenuBars: React.FC<{ size?: string }> = ({ size = '1.25rem' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" width={size} height={size}>
    <path d="M4 6h16M8 12h8M4 18h16" />
  </svg>
);

/** Host glyph: a pyramid of three bars, narrowing to the top. */
export const HostPyramid: React.FC<{ size?: string }> = ({ size = '1.25rem' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.75} strokeLinecap="round" width={size} height={size}>
    <path d="M9.5 5h5M6.5 12h11M3.5 19h17" />
  </svg>
);
/** Chat glyph: a bubble whose right half is a half-hexagon with 45° corners. */
export const ChatHex: React.FC<{ size?: string }> = ({ size = '1.25rem' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M7.5 3h9L21 7.5v9L16.5 21H12a9 9 0 0 1-4.1-.9L2 22l2-5.9-1-8.6zM10 9.5h3.5l1.5 2.5-1.5 2.5H10L8.5 12z" />
  </svg>
);

/** Shop glyph: an open trolley — the bottom half of a hexagon with no top edge, the right arm longer than the left
    but both tips at the same level — on two small circles set apart, a small egg in the air over the mouth, tilted
    30 degrees like the Phiegg mark. Takes the LucideIcon props, so it drops into Icon and Button slots. */
export const ShopNest: React.FC<{ size?: number | string; className?: string; color?: string }> = ({ size = 24, className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={className} aria-hidden="true">
    <path d="M3.8 6.5 7.2 15.5h7.8l5.8-9" />
    <path d="M12 1.6c1.7 0 2.7 1.9 2.7 3.7 0 1.7-1.1 2.8-2.7 2.8S9.3 7 9.3 5.3c0-1.8 1-3.7 2.7-3.7Z" transform="rotate(30 12 4.9)" />
    <circle cx="8" cy="18.2" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="16" cy="18.2" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

/** Apps glyph: the four boxes, with the top-right box cut diagonally and its right half thrown away. */
export const GridCut: React.FC<{ size?: number | string; className?: string; color?: string }> = ({ size = 24, className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={className} aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <path d="M14 3v7h7z" />
  </svg>
);

/** Home glyph: both legs sliced diagonally (right leg outer corner, left leg inner corner), the roof's apex
    sliced off slightly, and the door raised, its top a point rather than a flat cut. */
export const HomeCut: React.FC<{ size?: string }> = ({ size = '1.25rem' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M3 10l7.7-6h2.6L21 10v9l-3 3h-3v-7.5l-3-2.7-3 2.7v4.5l-3 3H3z" />
  </svg>
);
