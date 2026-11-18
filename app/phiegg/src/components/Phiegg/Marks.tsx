import { Image } from '@pui/components';
import React from 'react';
import { site } from '../../lib/data';
import { mediaUrl } from '../../lib/media';

const M = site.brand;
/**
 * Wordmark: "phiegg" in soft 3D Phifing (public/logo/phiegg-3d.svg). Sized by font-size. `lead` cuts it to its first
 * letter, the p, at the same size and place: the brand's icon is the letter already in the logo, so the header can
 * close to the p and open to the whole word without anything moving (share and aspect from scripts/logo-letter.py).
 */
export const Wordmark: React.FC<{ lead?: boolean }> = ({ lead }) => (
  <Image className="ph-wordmark" src={mediaUrl('logo/phiegg-3d.svg')} alt={M.name.toLowerCase()} fit={lead ? 'cover' : 'contain'}
    style={{ height: '1.9em', width: lead ? `calc(1.9em * ${M.wordmarkAspect * M.wordmarkLead})` : 'auto', objectPosition: 'left center', display: 'block' }} />
);
/** Phiegg icon: the chick on its own (site.brand.iconPath, written with the file site.brand.iconFile by
 *  scripts/logo-trace.py --bird), drawn in the text's colour (currentColor) like the wordmark it stands in for. */
export const Icon: React.FC<{ size?: string }> = ({ size = 'calc(var(--pui-shell-control, 2.25rem) * 0.72)' }) => (
  <svg className="ph-icon" viewBox="0 0 100 100" role="img" aria-label={M.name.toLowerCase()} style={{ height: size, width: size, display: 'block' }}>
    <path d={M.iconPath} fill="currentColor" fillRule="evenodd" />
  </svg>
);
/** The original Phiegg egg (site.brand.egg.shape): egg and cone in one filled shape, its wall thinner up and to the
 *  left, the thinner parting between them (scripts/logo-egg.py). Upright: the marks turn it egg.rotate degrees. */
const EggOutline: React.FC = () => <path d={M.egg.shape} fill="currentColor" stroke="none" />;
/** Phiegg mark: the egg with the bird in its oval, in one colour (the same drawing as the icon file). */
export const PhieggMark: React.FC<{ size?: string }> = ({ size = '1.5rem' }) => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" width={size} height={size} aria-hidden="true">
    <g transform={`rotate(${M.egg.rotate} 50 50)`}><EggOutline /><path d={M.egg.bird} fill="currentColor" fillRule="evenodd" stroke="none" /></g>
  </svg>
);
/** Phipad mark: the egg plus a round pill slanting from the bottom-left corner into the oval's centre (site.brand.phipadPill). */
export const PhipadMark: React.FC<{ size?: string }> = ({ size = '1.5rem' }) => {
  const p = M.phipadPill;
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" width={size} height={size} aria-hidden="true">
      <g transform={`rotate(${M.egg.rotate} 50 50)`}><EggOutline />
        <line x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} strokeWidth={p.width} strokeLinecap="round" /></g>
    </svg>
  );
};
/**
 * The rail's glyphs, drawn as one family in the look of Phi-Pill, the 3D font: every one fills the same 24-unit box
 * (about 2.5 to 21.5 both ways), every stroke is the same round-capped pill, and every glyph carries the font's side,
 * a soft copy of itself set down and to the right (the font's (45, -45) sweep), so they read as one set of 3D letters.
 */
type GlyphProps = { size?: number | string; className?: string; color?: string };
export const GLYPH_SIZE = '1.25rem'; // the shell's icon size (--pui-shell-icon)
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
/** Shop glyph, the roller: the basket is Phi Soft's v, short upright arms (its top third) slanting in to a blunt flat
    bottom (44% of its width), so the trolley has short arms and soft corners like the font. Over its mouth an egg
    drawn like a robot's face: a round top narrowing to a square-ish chin with soft corners (a fingernail), tilted 30
    degrees like the Phiegg mark. Two wheels under the bottom. */
export const ShopNest: React.FC<GlyphProps> = (p) => (
  <Glyph {...p}>
    <path d="M4.5 8.2V11.1L8.7 16.2H15.3L19.5 11.1V8.2" />
    <path d="M9.6 4.6C9.6 2.3 10.6 1.2 12 1.2S14.4 2.3 14.4 4.6L13.9 6.9Q13.8 7.4 13.3 7.4H10.7Q10.2 7.4 10.1 6.9Z" transform="rotate(30 12 4.3)" />
    <circle cx="8.6" cy="20" r="1.7" fill="currentColor" stroke="none" />
    <circle cx="15.4" cy="20" r="1.7" fill="currentColor" stroke="none" />
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
