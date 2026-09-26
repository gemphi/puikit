import { describe, expect, it } from 'vitest';
import { deriveGradientTreatment } from './gradient';
import { BRAND_THEMES } from './themes';
import type { BrandTheme, ThemeStyle } from './types';

const phi = BRAND_THEMES.find((b) => b.id === 'phi') as BrandTheme;

describe('deriveGradientTreatment', () => {
  it('returns null when style is not gradient', () => {
    const nonGradientStyles: ThemeStyle[] = ['apple', 'flat', 'elevated', 'glass'];
    for (const style of nonGradientStyles) {
      expect(deriveGradientTreatment(phi, style, false)).toBeNull();
      expect(deriveGradientTreatment(phi, style, true)).toBeNull();
    }
  });

  it('layers ambient radial tints over the surface gradient, quieter for child', () => {
    const treatment = deriveGradientTreatment(phi, 'gradient', false);
    expect(treatment).not.toBeNull();

    const surface =
      'linear-gradient(180deg, var(--phi-color-surface-raised, transparent), var(--phi-color-surface, transparent))';
    // #6366f1 -> rgb(99, 102, 241); light alphas: top 0.05, bottom 0.035.
    // parent: two low-alpha radial tints over the vertical surface gradient
    expect(treatment?.parent).toBe(
      `radial-gradient(ellipse 60% 45% at 25% 0%, rgba(99, 102, 241, 0.05), transparent 55%), ` +
        `radial-gradient(ellipse 45% 45% at 85% 100%, rgba(99, 102, 241, 0.035), transparent 55%), ` +
        surface,
    );
    // child: a single radial tint at half strength, from the opposing corner
    expect(treatment?.child).toBe(
      `radial-gradient(ellipse 55% 45% at 85% 0%, rgba(99, 102, 241, 0.025), transparent 55%), ` +
        surface,
    );
  });

  it('uses the light gradient in light mode and the dark gradient in dark mode', () => {
    // phi light gradient starts with #6366f1, dark gradient also starts with #6366f1;
    // use obsidian which differs between light (#52525b) and dark (#27272a).
    const obsidian = BRAND_THEMES.find((b) => b.id === 'obsidian') as BrandTheme;

    // #52525b -> rgb(82, 82, 91); #27272a -> rgb(39, 39, 42). Hex colors are
    // embedded as rgba(...) tints inside the layered treatment.
    const light = deriveGradientTreatment(obsidian, 'gradient', false);
    expect(light?.parent).toContain('rgba(82, 82, 91,');
    expect(light?.child).toContain('rgba(82, 82, 91,');

    const dark = deriveGradientTreatment(obsidian, 'gradient', true);
    expect(dark?.parent).toContain('rgba(39, 39, 42,');
    expect(dark?.child).toContain('rgba(39, 39, 42,');
  });

  it('produces usable treatments for every brand in gradient style', () => {
    const surface =
      'linear-gradient(180deg, var(--phi-color-surface-raised, transparent), var(--phi-color-surface, transparent))';
    for (const brand of BRAND_THEMES) {
      const light = deriveGradientTreatment(brand, 'gradient', false);
      const dark = deriveGradientTreatment(brand, 'gradient', true);
      for (const treatment of [light, dark]) {
        expect(treatment?.parent.startsWith('radial-gradient(')).toBe(true);
        expect(treatment?.child.startsWith('radial-gradient(')).toBe(true);
        expect(treatment?.parent.endsWith(surface)).toBe(true);
        expect(treatment?.child.endsWith(surface)).toBe(true);
        // parent carries two ambient tints; child a single quieter one.
        expect(treatment?.parent.match(/radial-gradient/g)).toHaveLength(2);
        expect(treatment?.child.match(/radial-gradient/g)).toHaveLength(1);
        expect(treatment?.parent).not.toBe(treatment?.child);
      }
    }
  });
});
