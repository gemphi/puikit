/**
 * Property-based tests for gradient-by-default derivation
 * (`deriveGradientTreatment` in `./gradient.ts`).
 *
 * Deterministic example-based coverage lives alongside in
 * `gradient.unit.test.ts`; this suite adds the fast-check property suite that
 * exercises the whole (19 brand × 5 style × 2 mode) input space via the shared
 * arbitraries in `../test/arbitraries.ts`. Kit-agnostic logic only, per the
 * "One UI Kit Per App" steering rule — it references puijs theming values and
 * imports no other UI kit.
 *
 * Feature: puijs-theming-and-test-platform
 */
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { deriveGradientTreatment } from './gradient';
import { BRAND_THEMES } from './themes';
import type { BrandTheme } from './types';
import { brandIdArb, themeArb, themeStyleArb } from '../test/arbitraries';

const MIN_RUNS = 100;

/** Resolve a generated Brand_Theme id to its real descriptor. */
function brandFor(id: string): BrandTheme {
  return BRAND_THEMES.find((b) => b.id === id) as BrandTheme;
}

/** Extract the `r, g, b` triplet embedded in the first radial tint. */
function rgbTripletOf(treatment: string): string {
  const match = treatment.match(/rgba\((\d+, \d+, \d+), /);
  return match ? match[1] : '';
}

/** Convert a `#rrggbb` hex color to its `r, g, b` triplet string. */
function hexToTriplet(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

describe('deriveGradientTreatment (property-based)', () => {
  // Feature: puijs-theming-and-test-platform, Property 9: Ambient gradient
  // layer structure in gradient style (parent two radial tints, child one
  // quieter tint, both over the vertical surface gradient)
  // Validates: Requirements 8.1, 8.2
  it('Property 9: parent carries two ambient radial tints and child one, both over the surface gradient', () => {
    const surface =
      'linear-gradient(180deg, var(--phi-color-surface-raised, transparent), var(--phi-color-surface, transparent))';
    fc.assert(
      fc.property(brandIdArb, themeArb, (brandId, theme) => {
        const isDark = theme === 'dark';
        const treatment = deriveGradientTreatment(
          brandFor(brandId),
          'gradient',
          isDark,
        );
        expect(treatment).not.toBeNull();
        // 8.1 — parent: two low-alpha radial tints layered over the vertical
        // surface-to-surface gradient.
        expect(treatment?.parent.startsWith('radial-gradient(')).toBe(true);
        expect(treatment?.parent.match(/radial-gradient/g)).toHaveLength(2);
        expect(treatment?.parent.endsWith(surface)).toBe(true);
        // 8.2 — child: a single quieter radial tint over the same surface
        // gradient, so nesting does not double the tint.
        expect(treatment?.child.startsWith('radial-gradient(')).toBe(true);
        expect(treatment?.child.match(/radial-gradient/g)).toHaveLength(1);
        expect(treatment?.child.endsWith(surface)).toBe(true);
        // The two treatments genuinely differ in strength.
        expect(treatment?.parent).not.toBe(treatment?.child);
      }),
      { numRuns: MIN_RUNS },
    );
  });

  // Feature: puijs-theming-and-test-platform, Property 10: Gradient color source
  // follows mode (light uses gradient, dark uses gradientDark)
  // Validates: Requirements 8.4
  it('Property 10: color source follows mode — light uses brand.gradient, dark uses brand.gradientDark', () => {
    fc.assert(
      fc.property(brandIdArb, themeArb, (brandId, theme) => {
        const brand = brandFor(brandId);
        const isDark = theme === 'dark';
        const treatment = deriveGradientTreatment(brand, 'gradient', isDark);
        expect(treatment).not.toBeNull();

        // The color embedded in the derived treatment must originate from the
        // mode-appropriate source gradient (dark => gradientDark, else
        // gradient). Hex colors are embedded as `rgba(r, g, b, alpha)` tints,
        // so compare the leading hex of the source with the tint's triplet.
        const source = isDark ? brand.gradientDark : brand.gradient;
        const sourceHex = source.match(
          /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/,
        );
        expect(sourceHex).not.toBeNull();
        const triplet = hexToTriplet(
          sourceHex![0].length > 5
            ? sourceHex![0].slice(0, 7)
            : sourceHex![0],
        );
        const parentTriplet = rgbTripletOf(treatment!.parent);
        expect(parentTriplet.length).toBeGreaterThan(0);
        expect(parentTriplet).toBe(triplet);
        // parent and child share the same color source.
        expect(rgbTripletOf(treatment!.child)).toBe(triplet);
      }),
      { numRuns: MIN_RUNS },
    );
  });

  // Feature: puijs-theming-and-test-platform, Property 11: No gradient-by-default
  // outside gradient style (returns null)
  // Validates: Requirements 8.3
  it('Property 11: returns null for every non-gradient style, in any mode', () => {
    const nonGradientStyleArb = themeStyleArb.filter((s) => s !== 'gradient');
    fc.assert(
      fc.property(brandIdArb, nonGradientStyleArb, themeArb, (brandId, style, theme) => {
        const isDark = theme === 'dark';
        expect(
          deriveGradientTreatment(brandFor(brandId), style, isDark),
        ).toBeNull();
      }),
      { numRuns: MIN_RUNS },
    );
  });
});
