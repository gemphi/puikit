import { Image } from '@pui/components';
import React from 'react';
import { site } from '../../lib/data';
import { mediaUrl } from '../../lib/media';

const M = site.brand;
/** Wordmark: "phiegg" in soft 3D Phifing (scripts/media/build_media.py). Sized by font-size. */
export const Wordmark: React.FC = () => <Image className="ph-wordmark" src={mediaUrl('logo/phiegg-3d.svg')} alt={M.name.toLowerCase()} fit="contain" style={{ height: '1.9em', width: 'auto', display: 'block' }} />;
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
/**
 * The rail's glyphs, drawn as one family in the look of Phi-Pill, the 3D font: every one fills the same 24-unit box
 * (about 2.5 to 21.5 both ways), every stroke is the same round-capped pill, and every glyph carries the font's side,
 * a soft copy of itself set down and to the right (the font's (45, -45) sweep), so they read as one set of 3D letters.
 */
type GlyphProps = { size?: number | string; className?: string; color?: string };
export const GLYPH_SIZE = '1.375rem';
const Glyph: React.FC<GlyphProps & { children: React.ReactNode }> = ({ size = GLYPH_SIZE, className, children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={['ph-glyph', className ?? ''].join(' ')} aria-hidden="true">
    <g className="ph-glyph-side" transform="translate(0.9 0.9)">{children}</g>
    <g>{children}</g>
  </svg>
);

/** Menu glyph: three bars, the middle one shorter and centred. */
export const MenuBars: React.FC<GlyphProps> = (p) => <Glyph {...p}><path d="M3 4.5h18M7.5 12h9M3 19.5h18" /></Glyph>;
/** Host glyph: a pyramid of three bars, narrowing to the top. */
export const HostPyramid: React.FC<GlyphProps> = (p) => <Glyph {...p}><path d="M9 4.5h6M5.5 12h13M2.5 19.5h19" /></Glyph>;
/** Chat glyph: a bubble whose right half is a half-hexagon with 45 degree corners. */
export const ChatHex: React.FC<GlyphProps> = (p) => <Glyph {...p}><path d="M7.5 2.5h9L21 7v9l-4.5 4.5H12a9 9 0 0 1-4.1-.9L2.5 21.5l1.9-5.6-1.4-8.4zM10 9.5h3.5l1.5 2.5-1.5 2.5H10L8.5 12z" /></Glyph>;
/** Shop glyph, the roller: an open trolley, the bottom half of a hexagon with no top edge, the right arm longer than
    the left with both tips level, a small egg in the air over the mouth tilted 30 degrees like the Phiegg mark. The
    bottom is a little shorter than the span of the wheels, so the two wheels peek out at its ends. */
export const ShopNest: React.FC<GlyphProps> = (p) => (
  <Glyph {...p}>
    <path d="M2.5 5 7.6 15.2H14.6L21.5 5" />
    <path d="M12 1.2c1.6 0 2.5 1.7 2.5 3.4 0 1.6-1 2.6-2.5 2.6s-2.5-1-2.5-2.6c0-1.7.9-3.4 2.5-3.4Z" transform="rotate(30 12 4.4)" />
    <circle cx="6.4" cy="19.6" r="1.9" fill="currentColor" stroke="none" />
    <circle cx="15.9" cy="19.6" r="1.9" fill="currentColor" stroke="none" />
  </Glyph>
);
/** Apps glyph: the four boxes, with the top-right box cut diagonally and its right half thrown away. */
export const GridCut: React.FC<GlyphProps> = (p) => (
  <Glyph {...p}><rect x="2.5" y="2.5" width="7.5" height="7.5" rx="2" /><rect x="2.5" y="14" width="7.5" height="7.5" rx="2" /><rect x="14" y="14" width="7.5" height="7.5" rx="2" /><path d="M14 2.5V10h7.5z" /></Glyph>
);
/** Home glyph: both legs sliced diagonally (right leg outer corner, left leg inner corner), the roof's apex sliced off
    slightly, and the door raised, its top a point rather than a flat cut. */
export const HomeCut: React.FC<GlyphProps> = (p) => <Glyph {...p}><path d="M2.5 10l8-6.8h3L21.5 10v8.5l-3 3h-3v-7.5l-3.5-3-3.5 3v4.5l-3 3h-3z" /></Glyph>;
/** You glyph: a pill head over a pill of shoulders. */
export const YouPill: React.FC<GlyphProps> = (p) => <Glyph {...p}><rect x="8" y="2.5" width="8" height="9" rx="4" /><rect x="3" y="14.5" width="18" height="7" rx="3.5" /></Glyph>;
/** Sidebar pin: a rounded square with a vertical pill at its left; the pill widens towards the middle while the
 *  sidebar is open, and narrows back to a sliver when it is closed. */
export const SidePin: React.FC<GlyphProps & { open: boolean }> = ({ open, ...p }) => (
  <Glyph {...p}>
    <rect x="2.5" y="3.5" width="19" height="17" rx="5.5" />
    <rect x="6" y="7" height="10" width={open ? 6.5 : 3} rx={open ? 3.25 : 1.5} fill="currentColor" stroke="none" style={{ transition: 'width 0.25s, rx 0.25s' }} />
  </Glyph>
);
