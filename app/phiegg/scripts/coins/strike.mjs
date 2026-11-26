// Striking a coin: a glyph (an SVG painted in currentColor) raised in the wordmark's 3D, five side layers stepping down
// and right, then a face light at its foot and darker at its head, set on a round metal disc with a reeded edge, a
// bevelled rim, an embossed ring, a glare across it and a shadow under it. 256 square.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
/** What a glyph file draws: everything inside its <svg>, its comments left out. */
export const readGlyph = (dir, symbol) => readFileSync(join(dir, `${symbol}.svg`), 'utf8')
  .replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<!--[\s\S]*?-->/g, '').trim();
/** A club coin's glyph: its symbol in letters, sized to how long it is. */
export const lettersGlyph = (symbol) => {
  const n = symbol.length, size = n <= 1 ? 104 : n === 2 ? 86 : n === 3 ? 66 : n === 4 ? 52 : 44;
  const text = symbol.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<text x="0" y="${size * 0.35}" text-anchor="middle" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="${size}" fill="currentColor" stroke="currentColor" stroke-width="3">${text}</text>`;
};
const paint = (glyph, colour) => glyph.replace(/currentColor/g, colour);
const raised = (glyph, m) => {
  const layers = [4, 3, 2, 1, 0].map((i) => `<g transform="translate(${(i + 1) * 1.7} ${(i + 1) * 2.1})">${paint(glyph, m.side[i])}</g>`).join('');
  return `<g stroke-linecap="round" stroke-linejoin="round">${layers}${paint(glyph, 'url(#gf)')}</g>`;
};
/** One coin as an SVG. */
export const coinSvg = (symbol, glyph, m) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="${symbol.replace(/[&<"]/g, '')}"><defs>
<linearGradient id="rim" x1=".12" y1=".05" x2=".88" y2=".95"><stop offset="0" stop-color="${m.rimLight}"/><stop offset=".5" stop-color="${m.rimMid}"/><stop offset="1" stop-color="${m.rimDark}"/></linearGradient>
<linearGradient id="bevel" x1=".88" y1=".95" x2=".12" y2=".05"><stop offset="0" stop-color="${m.rimLight}"/><stop offset=".55" stop-color="${m.rimMid}"/><stop offset="1" stop-color="${m.rimDark}"/></linearGradient>
<radialGradient id="face" cx=".36" cy=".3" r=".95"><stop offset="0" stop-color="${m.faceLight}"/><stop offset=".55" stop-color="${m.faceMid}"/><stop offset="1" stop-color="${m.faceDark}"/></radialGradient>
<linearGradient id="gf" gradientUnits="userSpaceOnUse" x1="0" y1="64" x2="0" y2="-64"><stop offset="0" stop-color="${m.foot}"/><stop offset=".55" stop-color="${m.mid}"/><stop offset="1" stop-color="${m.top}"/></linearGradient>
<linearGradient id="glare" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity=".08"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
<filter id="soft" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="7"/></filter><filter id="fine"><feGaussianBlur stdDeviation="1.2"/></filter>
<clipPath id="disc"><circle cx="128" cy="122" r="101"/></clipPath></defs>
<ellipse cx="128" cy="238" rx="84" ry="9" fill="#000" opacity=".3" filter="url(#soft)"/>
<circle cx="128" cy="122" r="118" fill="url(#rim)"/>
<circle cx="128" cy="122" r="116.5" fill="none" stroke="${m.rimDark}" stroke-width="3" stroke-dasharray="1.6 2.4" opacity=".55"/>
<circle cx="128" cy="122" r="111" fill="url(#bevel)"/>
<circle cx="128" cy="122" r="104" fill="${m.rimDark}" opacity=".5"/>
<circle cx="128" cy="122" r="101" fill="url(#face)"/>
<circle cx="128" cy="122" r="90" fill="none" stroke="${m.ink}" stroke-opacity=".38" stroke-width="2.2" transform="translate(1.2 1.4)"/><circle cx="128" cy="122" r="90" fill="none" stroke="${m.faceLight}" stroke-width="2"/>
<g transform="translate(128 122)">${raised(glyph, m)}</g>
<g clip-path="url(#disc)"><path d="M0 0 L256 0 L0 256 Z" fill="url(#glare)"/></g>
<path d="M44 70 A92 92 0 0 1 150 18" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3.5" stroke-linecap="round" filter="url(#fine)"/>
<path d="M214 176 A92 92 0 0 1 118 226" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="3" stroke-linecap="round" filter="url(#fine)"/>
</svg>
`;
