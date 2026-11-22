import { describe, expect, it } from 'vitest';
import { GROUND_SETS, groundSetFor, groundSvg, groundTokens, svgUrl } from './index';

const GROUND_SET = GROUND_SETS[0];

const colour = { cool: '#7c5cff', hot: '#ff5ca8', third: '#f59e0b' };

describe('phisvg grounds', () => {
  it('draws a ground as an SVG with its stops in order, blended in linear light, and let out at every edge', () => {
    const svg = groundSvg({ stop: [['cool', 0, 0.2], ['hot', 1, 0]], feather: [0.1, 0.2] }, colour);
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg).toContain('color-interpolation="linearRGB"');
    expect(svg.indexOf('#7c5cff')).toBeLessThan(svg.indexOf('#ff5ca8'));
    expect(svg).toContain('stop-opacity="0.2"');
    // Two fades, sides and top-to-foot, each clear at both of its ends.
    expect(svg.match(/<mask /g)).toHaveLength(2);
    expect(svg).toContain('offset="10%"'); expect(svg).toContain('offset="80%"');
    // No size of its own: it takes the size of what it is the ground of.
    expect(svg).not.toMatch(/<svg[^>]*(width|height|viewBox)=/);
  });
  it('scales a ground by its strength and never past whole', () => {
    expect(groundSvg({ stop: [['cool', 0, 0.4]], feather: [0, 0] }, colour, 0.5)).toContain('stop-opacity="0.2"');
    expect(groundSvg({ stop: [['cool', 0, 0.8]], feather: [0, 0] }, colour, 2)).toContain('stop-opacity="1"');
  });
  it('gives every ground of the base set at every strength, as an image a component can wear', () => {
    const tokens = groundTokens(GROUND_SET, colour);
    expect(Object.keys(tokens)).toHaveLength(Object.keys(GROUND_SET.ground).length * Object.keys(GROUND_SET.strength).length);
    expect(tokens['--phi-surface']).toMatch(/^url\("data:image\/svg\+xml,/);
    expect(tokens['--phi-label-back-strong']).toBeTruthy();
    expect(svgUrl('<svg/>')).toBe('url("data:image/svg+xml,%3Csvg%2F%3E")');
  });
  it('dresses only the looks a set names; no look is named now, so every look keeps its own gradients', () => {
    for (const look of ['gradient', 'apple', 'flat', 'elevated', 'glass', 'organic', 'spacex', 'muse', 'jingle', 'nothing']) expect(groundSetFor(look), look).toBeUndefined();
    expect(GROUND_SETS).toHaveLength(1);
    // A set may name a share of light in the theme; every stop is then multiplied by it.
    expect(decodeURIComponent(groundTokens({ look: ['x'], colour: { light: '--l' }, scale: '--s', strength: { '': 0.72 }, ground: { '--g': { stop: [['light', 0, 1]], feather: [0, 0] } } }, { light: 'rgb(255, 255, 255)' }, 0.06)['--g'])).toContain('stop-opacity="0.043"');
  });
  it('a child ground is clear where its parent is fullest', () => {
    const at = (token: string, where: number) => GROUND_SET.ground[token].stop.filter((s) => s[1] === where).map((s) => s[2]);
    expect(Math.max(...at('--phi-surface', 0))).toBeGreaterThan(0);   // the surface is full at its left
    expect(Math.max(...at('--phi-label-back', 0))).toBe(0);          // a row on it is clear there
    expect(Math.max(...at('--phi-label', 0.5))).toBe(0);             // a label is clear at the surface's hot middle
  });
});
