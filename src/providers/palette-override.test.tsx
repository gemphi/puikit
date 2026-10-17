import React from 'react';
import { describe, expect, it } from 'vitest';
import { act, render } from '@testing-library/react';
import { hexToHsl, hslToHex, paletteFromHex, type SeedPalette, type GradientLevel } from './palette';
import { PuiProvider, usePuiTheme } from './PuiProvider';

const root = () => document.documentElement;

describe('palette from one colour', () => {
  it('round-trips hex and hsl', () => {
    for (const hex of ['#c2185b', '#1565c0', '#2e7d32', '#ffb300']) {
      const back = hslToHex(hexToHsl(hex)); const [a, b] = [parseInt(hex.slice(1), 16), parseInt(back.slice(1), 16)];
      expect(Math.abs((a >> 16) - (b >> 16))).toBeLessThanOrEqual(2);
    }
  });
  it('takes the hue for the grounds and a readable accent', () => {
    const p = paletteFromHex('#140d38', 'pft');
    const [h] = hexToHsl('#140d38');
    expect(Math.abs(hexToHsl(p.seed)[0] - h)).toBeLessThan(4);
    expect(p.accent[2]).toBeGreaterThanOrEqual(48);
    expect(p.lightSeed && hexToHsl(p.lightSeed)[2]).toBeGreaterThan(90);
  });
  it('uses a second colour as the second accent when given', () => {
    const p = paletteFromHex('#c2185b', 'look', '#00e5ff');
    expect(Math.round(p.accent2[0])).toBe(Math.round(hexToHsl('#00e5ff')[0]));
  });
});

describe('palette override', () => {
  let api: { set: (p: SeedPalette | null, l?: GradientLevel) => void; current: () => SeedPalette | null } | null = null;
  const Probe = () => { const t = usePuiTheme(); api = { set: t.setPaletteOverride, current: () => t.paletteOverride }; return null; };
  it('wins over the saved palette until cleared, and is not persisted', () => {
    render(<PuiProvider defaultPalette="sage"><Probe /></PuiProvider>);
    expect(root().getAttribute('data-palette')).toBe('sage');
    act(() => api!.set(paletteFromHex('#c2185b', 'look'), 'vivid'));
    expect(root().getAttribute('data-palette')).toBe('look');
    expect(root().getAttribute('data-gradient-level')).toBe('vivid');
    expect(JSON.stringify(Object.values(localStorage))).not.toContain('look');
    act(() => api!.set(null));
    expect(root().getAttribute('data-palette')).toBe('sage');
  });
});
