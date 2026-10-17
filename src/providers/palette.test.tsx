import React from 'react';
import { describe, expect, it, beforeEach } from 'vitest';
import { act, render } from '@testing-library/react';
import { PALETTES, derivePaletteTokens, deriveGradientTokens, hexToHsl, paletteColors } from './palette';
import { PuiProvider, usePuiTheme } from './PuiProvider';

const root = () => document.documentElement;

describe('seeded palettes', () => {
  it('carries the 16 phiber v2 + Phiegg palettes', () => {
    expect(PALETTES).toHaveLength(16);
    expect(PALETTES.map((p) => p.id)).toContain('apple');
    expect(PALETTES.map((p) => p.id)).toContain('opal');
  });
  it('converts hex to hsl', () => {
    expect(hexToHsl('#ffffff')).toEqual([0, 0, 100]);
    expect(hexToHsl('#000')).toEqual([0, 0, 0]);
    const [h, s] = hexToHsl('#3B4657'); expect(Math.round(h)).toBe(216); expect(s).toBeGreaterThan(15);
  });
  it('orders the dark ramp ground < secondary < card < elevated', () => {
    for (const p of PALETTES) {
      const c = paletteColors(p, true);
      expect(c.ground[2]).toBeLessThan(c.secondary[2]);
      expect(c.secondary[2]).toBeLessThan(c.card[2]);
      expect(c.card[2]).toBeLessThan(c.elevated[2]);
    }
  });
  it('uses a near-white light ground and dark text', () => {
    for (const p of PALETTES) { const c = paletteColors(p, false); expect(c.ground[2]).toBeGreaterThanOrEqual(90); expect(c.text[2]).toBeLessThan(20); }
  });
  it('flat keeps painted surfaces solid and drops every tint; other levels layer gradients per depth', () => {
    const flat = derivePaletteTokens(PALETTES[0], true, 'flat');
    for (const [k, v] of Object.entries(flat).filter(([k]) => k.startsWith('--phi-gradient-'))) expect(v === 'none' || !/(radial|160deg|340deg)/.test(v)).toBe(true);
    expect(flat['--phi-gradient-card']).toMatch(/^linear-gradient\(color-mix/);
    expect(flat['--phi-gradient-parent']).toBe('none');
    const vivid = derivePaletteTokens(PALETTES[0], true, 'vivid');
    for (const k of ['main', 'parent', 'child', 'grandchild', 'card', 'card-child', 'card-grandchild', 'media', 'drawer', 'rail', 'sidebar', 'navbar', 'control']) expect(vivid['--phi-gradient-' + k]).toMatch(/gradient\(/);
    expect(vivid['--phi-gradient-control-text']).toBe('#fff');
  });
  it('aurora adds a third hue; soft keeps controls solid', () => {
    const c = paletteColors(PALETTES[5], false);
    expect(deriveGradientTokens(c, false, 'aurora')['--phi-gradient-main'].match(/radial-gradient/g)!.length).toBe(3);
    expect(deriveGradientTokens(c, false, 'vivid')['--phi-gradient-main'].match(/radial-gradient/g)!.length).toBe(2);
    expect(deriveGradientTokens(c, false, 'soft')['--phi-gradient-control']).toBe('none');
  });
});

describe('PuiProvider palette + gradient level', () => {
  beforeEach(() => { localStorage.clear(); root().removeAttribute('style'); root().removeAttribute('data-palette'); root().removeAttribute('data-gradient-level'); });

  it('writes nothing unless an app opts in', () => {
    render(<PuiProvider defaultTheme="light"><span /></PuiProvider>);
    expect(root().hasAttribute('data-gradient-level')).toBe(false);
    expect(root().style.getPropertyValue('--phi-gradient-card-child')).toBe('');
  });

  it('applies a palette, switches it and clears it', () => {
    const ref: { api?: ReturnType<typeof usePuiTheme> } = {};
    const Probe = () => { ref.api = usePuiTheme(); return null; };
    render(<PuiProvider defaultTheme="dark" defaultPalette="opal" defaultGradientLevel="vivid"><Probe /></PuiProvider>);
    expect(root().getAttribute('data-palette')).toBe('opal');
    expect(root().getAttribute('data-gradient-level')).toBe('vivid');
    expect(root().style.getPropertyValue('--phi-color-primary')).toBe('hsl(24 55% 50%)');
    expect(root().style.getPropertyValue('--phi-gradient-card-grandchild')).toMatch(/radial-gradient/);
    act(() => ref.api!.setPaletteId('barbie'));
    expect(root().getAttribute('data-palette')).toBe('barbie');
    act(() => ref.api!.setGradientLevel('flat'));
    expect(root().style.getPropertyValue('--phi-gradient-main')).toBe('linear-gradient(var(--phi-color-background), var(--phi-color-background))');
    act(() => ref.api!.setPaletteId('none'));
    expect(root().hasAttribute('data-palette')).toBe(false);
    // a level with no palette derives the gradients from the brand
    expect(root().getAttribute('data-gradient-level')).toBe('flat');
  });
});
