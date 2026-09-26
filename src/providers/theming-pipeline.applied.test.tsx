import React from 'react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import * as sass from 'sass';
import { render, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PuiProvider } from './PuiProvider';
import { BRAND_THEMES } from './themes';
import { deriveGradientTreatment } from './gradient';
import type { BrandTheme } from './types';

/**
 * Applied-behavior regression guard for the end-to-end theming pipeline.
 *
 * The reported visual regressions (gradients not rendering, missing padding,
 * inconsistent themes) were suspected to stem from a disconnected pipeline —
 * either the provider no longer applying theming to `document.documentElement`,
 * or the SCSS entrypoint the app imports (`@pui/tokens/tokens.scss`) no longer
 * emitting the theme-style / gradient-by-default / spacing rules.
 *
 * Unlike a pure token/attribute contract test, this file mounts the provider
 * EXACTLY the way `apps/pui-book/src/main.tsx` does (`defaultTheme="system"`,
 * `defaultBrand="foundry"`, and — deliberately — no `defaultThemeStyle`, so it
 * defaults to `apple`) and asserts the APPLIED result on the real document
 * root. It also compiles the actual SCSS entrypoint the app imports and asserts
 * the emitted CSS carries the rules those symptoms depend on.
 *
 * If the pipeline is ever disconnected again (provider stops applying theming,
 * or the SCSS entrypoint drops the theme-style/gradient/padding rules), this
 * test fails.
 *
 * Kit-agnostic: only puijs theming values are referenced ("One UI Kit Per App").
 */

const here = dirname(fileURLToPath(import.meta.url));
// src/providers -> src/tokens/tokens.scss (the specifier `@pui/tokens/tokens.scss`
// resolves to this file via pui-book's vite alias `@pui/tokens -> ../../src/tokens`).
const TOKENS_ENTRY = resolve(here, '../tokens/tokens.scss');
const CORE_ENTRY = resolve(here, '../styles/core.scss');

const root = () => document.documentElement;
const foundry = BRAND_THEMES.find((b) => b.id === 'foundry') as BrandTheme;

afterEach(() => {
  cleanup();
});

/** Mount the provider tree the same way `apps/pui-book/src/main.tsx` does. */
function renderLikeMain() {
  return render(
    <PuiProvider defaultTheme="system" defaultBrand="foundry">
      <div data-testid="app-root">app</div>
    </PuiProvider>
  );
}

describe('Theming pipeline — applied provider behavior (main.tsx-equivalent mount)', () => {
  it('applies data-theme / data-theme-style / data-brand to the document root', () => {
    renderLikeMain();

    // The system theme resolves to light in the test shim (no dark preference).
    expect(root().getAttribute('data-theme')).toBe('light');
    // main.tsx supplies no defaultThemeStyle, so the applied style is `apple`.
    expect(root().getAttribute('data-theme-style')).toBe('apple');
    // The default brand supplied by main.tsx is `foundry`.
    expect(root().getAttribute('data-brand')).toBe('foundry');
    // An archetype is always resolved and applied.
    expect(root().getAttribute('data-archetype')).not.toBeNull();
  });

  it('applies the active brand --phi-color-* and brand gradient custom properties', () => {
    renderLikeMain();

    // Theme consistency depends on the provider pushing the brand palette onto
    // the root as custom properties. Assert the applied values match the brand.
    expect(root().style.getPropertyValue('--phi-color-primary')).toBe(foundry.colors.primary);
    expect(root().style.getPropertyValue('--phi-color-primary-hover')).toBe(foundry.colors.primaryHover);
    // Brand surface gradient tokens are applied regardless of theme style so
    // brand-driven surfaces (cards, navbars) render their gradients.
    expect(root().style.getPropertyValue('--phi-brand-gradient')).toBe(foundry.gradient);
    expect(root().style.getPropertyValue('--phi-gradient-brand')).toBe(foundry.gradient);
  });

  it('does NOT enable gradient-by-default in the default apple style (by design)', () => {
    renderLikeMain();

    // Gradient-by-default activates only for themeStyle `gradient` (Req 8.3).
    // In the app's default `apple` style, the attribute is absent and the
    // parent/child gradient custom properties are cleared. This documents that
    // "no gradient-by-default in the default app" is EXPECTED, not a regression.
    expect(root().getAttribute('data-gradient-default')).toBeNull();
    expect(root().style.getPropertyValue('--phi-gradient-parent')).toBe('');
    expect(root().style.getPropertyValue('--phi-gradient-child')).toBe('');
    expect(deriveGradientTreatment(foundry, 'apple', false)).toBeNull();
  });

  it('enables gradient-by-default with derived parent/child gradients in gradient style', () => {
    render(
      <PuiProvider defaultTheme="light" defaultThemeStyle="gradient" defaultBrand="foundry">
        <div>app</div>
      </PuiProvider>
    );

    const expected = deriveGradientTreatment(foundry, 'gradient', false);
    expect(expected).not.toBeNull();
    expect(root().getAttribute('data-gradient-default')).toBe('true');
    expect(root().style.getPropertyValue('--phi-gradient-parent')).toBe(expected!.parent);
    expect(root().style.getPropertyValue('--phi-gradient-child')).toBe(expected!.child);
  });
});

describe('Theming pipeline — compiled SCSS entrypoint the app imports', () => {
  // The app imports `@pui/tokens/tokens.scss`, which `@use`s `./variables` and
  // `./theme-styles`. If those partials stop being emitted, all three symptoms
  // (gradients, padding, theme consistency) appear at once. Compile the real
  // entrypoint and assert the emitted CSS carries the rules each depends on.
  const tokensCss = sass.compile(TOKENS_ENTRY).css;
  const coreCss = sass.compile(CORE_ENTRY).css;

  it('emits every [data-theme-style=...] block (theme consistency)', () => {
    for (const style of ['apple', 'glass', 'elevated', 'gradient']) {
      expect(tokensCss).toContain(`data-theme-style=${style}`);
    }
  });

  it('emits the gradient-by-default binding rules (gradients)', () => {
    expect(tokensCss).toContain('data-gradient-default=true] [data-gradient-parent]');
    expect(tokensCss).toContain('data-gradient-default=true] [data-gradient-child]');
    expect(tokensCss).toContain('--phi-gradient-parent');
    expect(tokensCss).toContain('--phi-gradient-child');
  });

  it('emits spacing, radius and surface-gradient tokens (padding + surfaces)', () => {
    expect(tokensCss).toContain('--phi-space-4');
    expect(tokensCss).toContain('--phi-radius-lg');
    expect(tokensCss).toContain('--phi-gradient-card');
    // core.scss (the app's other entrypoint) paints the page background from
    // the main gradient token; if this binding is dropped, backgrounds break.
    expect(coreCss).toContain('var(--phi-gradient-main');
  });
});
