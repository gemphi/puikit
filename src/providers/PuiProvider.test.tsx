import React, { useEffect } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import fc from 'fast-check';

import { PuiProvider, usePuiTheme } from './PuiProvider';
import { BRAND_THEMES } from './themes';
import {
  archetypeIdArb,
  brandIdArb,
  themeArb,
  themeStyleArb,
} from '../test/arbitraries';
import { setPrefersDark } from '../test/setup';

/**
 * Property tests for the real `PuiProvider` DOM application and cross-provider
 * isolation (Test_Platform, Task 4.3).
 *
 * These tests mount the actual provider and assert against
 * `document.documentElement`, which `setup.ts` resets between tests. The
 * `localStorage`, `matchMedia`, and `setPrefersDark` shims from `setup.ts`
 * make preference persistence and system-mode resolution deterministic.
 *
 * Kit-agnostic test logic: only puijs theming values are referenced and no
 * other UI kit is imported ("One UI Kit Per App").
 */

const RUNS = 120;
const root = () => document.documentElement;

/**
 * Reset the harness between fast-check iterations. `setup.ts` only resets the
 * DOM/storage between test cases (`afterEach`), but a single property test runs
 * many iterations that each mount a provider. Without an explicit per-iteration
 * reset, a previous iteration's applied `data-*` attributes leak into the next
 * one's initial assertions. This resets the same state `setup.ts` does, so each
 * iteration observes a clean document element.
 */
function resetIteration(): void {
  cleanup();
  globalThis.localStorage?.clear();
  const el = document.documentElement;
  el.removeAttribute('data-theme');
  el.removeAttribute('data-theme-style');
  el.removeAttribute('data-brand');
  el.removeAttribute('data-archetype');
  el.removeAttribute('data-gradient-default');
  el.classList.remove('dark');
  el.removeAttribute('style');
}

/** Expose the provider context setters to a test through a ref-like callback. */
type Ctx = ReturnType<typeof usePuiTheme>;
function CtxCapture({ onCtx }: { onCtx: (ctx: Ctx) => void }): null {
  const ctx = usePuiTheme();
  useEffect(() => {
    onCtx(ctx);
  });
  return null;
}

afterEach(() => {
  setPrefersDark(false);
});

describe('PuiProvider DOM application and isolation', () => {
  // Feature: puijs-theming-and-test-platform, Property 5: Archetype application
  // and runtime switching (data-archetype reflects archetypeId; setArchetypeId
  // updates it)
  // Validates: Requirements 5.4, 6.1, 10.4
  it('Property 5: applies archetypeId to data-archetype and updates it at runtime', () => {
    fc.assert(
      fc.property(archetypeIdArb, archetypeIdArb, (first, second) => {
        resetIteration();
        let captured: Ctx | undefined;
        const view = render(
          <PuiProvider defaultArchetype={first}>
            <CtxCapture onCtx={(c) => (captured = c)} />
          </PuiProvider>
        );

        // Initial archetype is applied to the root and the context.
        expect(root().getAttribute('data-archetype')).toBe(first);
        expect(captured?.archetypeId).toBe(first);

        // Runtime switch via setArchetypeId reflects in data-archetype.
        act(() => {
          captured!.setArchetypeId(second);
        });
        expect(root().getAttribute('data-archetype')).toBe(second);

        view.unmount();
      }),
      { numRuns: RUNS }
    );
  });

  // Feature: puijs-theming-and-test-platform, Property 8: Cross-provider
  // preference isolation
  // Validates: Requirements 7.2
  it('Property 8: independent providers retain and apply their own preferences', () => {
    fc.assert(
      fc.property(
        fc.record({ theme: themeArb, themeStyle: themeStyleArb, brandId: brandIdArb, archetypeId: archetypeIdArb }),
        fc.record({ theme: themeArb, themeStyle: themeStyleArb, brandId: brandIdArb, archetypeId: archetypeIdArb }),
        (prefsA, prefsB) => {
          resetIteration();
          let ctxA: Ctx | undefined;
          let ctxB: Ctx | undefined;

          const view = render(
            <>
              <PuiProvider
                defaultTheme={prefsA.theme}
                defaultThemeStyle={prefsA.themeStyle}
                defaultBrand={prefsA.brandId}
                defaultArchetype={prefsA.archetypeId}
              >
                <CtxCapture onCtx={(c) => (ctxA = c)} />
              </PuiProvider>
              <PuiProvider
                defaultTheme={prefsB.theme}
                defaultThemeStyle={prefsB.themeStyle}
                defaultBrand={prefsB.brandId}
                defaultArchetype={prefsB.archetypeId}
              >
                <CtxCapture onCtx={(c) => (ctxB = c)} />
              </PuiProvider>
            </>
          );

          // Each provider's own context reflects its own preferences,
          // unaffected by the other instance.
          expect(ctxA?.theme).toBe(prefsA.theme);
          expect(ctxA?.themeStyle).toBe(prefsA.themeStyle);
          expect(ctxA?.brandId).toBe(prefsA.brandId);
          expect(ctxA?.archetypeId).toBe(prefsA.archetypeId);

          expect(ctxB?.theme).toBe(prefsB.theme);
          expect(ctxB?.themeStyle).toBe(prefsB.themeStyle);
          expect(ctxB?.brandId).toBe(prefsB.brandId);
          expect(ctxB?.archetypeId).toBe(prefsB.archetypeId);

          view.unmount();
        }
      ),
      { numRuns: RUNS }
    );
  });

  // Feature: puijs-theming-and-test-platform, Property 12: Preference change
  // applies to the DOM (data-theme/data-theme-style/data-brand/
  // data-gradient-default reflect prefs)
  // Validates: Requirements 10.1, 11.1, 11.2, 11.3
  it('Property 12: preference changes reflect in the mapped DOM attributes', () => {
    fc.assert(
      fc.property(themeArb, themeStyleArb, brandIdArb, archetypeIdArb, (theme, style, brand, archetype) => {
        resetIteration();
        // Keep system-mode deterministic (light) so data-theme is predictable.
        setPrefersDark(false);

        let captured: Ctx | undefined;
        const view = render(
          <PuiProvider>
            <CtxCapture onCtx={(c) => (captured = c)} />
          </PuiProvider>
        );

        act(() => {
          captured!.setTheme(theme);
          captured!.setThemeStyle(style);
          captured!.setBrandId(brand);
          captured!.setArchetypeId(archetype);
        });

        const expectedDark = theme === 'dark';
        const expectedMode = expectedDark ? 'dark' : 'light';

        // data-theme reflects resolved mode (Requirement 11.1).
        expect(root().getAttribute('data-theme')).toBe(expectedMode);
        // data-theme-style reflects the style (Requirement 11.2).
        expect(root().getAttribute('data-theme-style')).toBe(style);
        // data-brand reflects the explicitly set brand (Requirement 11.3).
        expect(root().getAttribute('data-brand')).toBe(brand);
        // data-archetype reflects the archetype (Requirement 10.1).
        expect(root().getAttribute('data-archetype')).toBe(archetype);

        // Brand-derived primary color custom property is applied. Brands may
        // supply a dark-mode primary (primaryDark), which wins in dark mode.
        const brandTheme = BRAND_THEMES.find((b) => b.id === brand)!;
        const expectedPrimary =
          (expectedDark && brandTheme.colors.primaryDark) || brandTheme.colors.primary;
        expect(root().style.getPropertyValue('--phi-color-primary')).toBe(expectedPrimary);

        // data-gradient-default appears only for the gradient style.
        if (style === 'gradient') {
          expect(root().getAttribute('data-gradient-default')).toBe('true');
        } else {
          expect(root().getAttribute('data-gradient-default')).toBeNull();
        }

        view.unmount();
      }),
      { numRuns: RUNS }
    );
  });

  // Feature: puijs-theming-and-test-platform, Property 15: System mode
  // resolution (theme='system' follows matchMedia prefers-color-scheme via
  // setPrefersDark)
  // Validates: Requirements 11.4
  it("Property 15: theme='system' resolves to the OS prefers-color-scheme value", () => {
    fc.assert(
      fc.property(fc.boolean(), (osPrefersDark) => {
        resetIteration();
        // Set the simulated OS preference BEFORE rendering so the provider
        // reads it on mount (the matchMedia shim's change listener is inert).
        setPrefersDark(osPrefersDark);

        let captured: Ctx | undefined;
        const view = render(
          <PuiProvider defaultTheme="system">
            <CtxCapture onCtx={(c) => (captured = c)} />
          </PuiProvider>
        );

        const expectedMode = osPrefersDark ? 'dark' : 'light';
        expect(root().getAttribute('data-theme')).toBe(expectedMode);
        expect(root().classList.contains('dark')).toBe(osPrefersDark);
        expect(captured?.isDark).toBe(osPrefersDark);

        view.unmount();
      }),
      { numRuns: RUNS }
    );
  });
});
