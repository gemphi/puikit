import React from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { PuiProvider } from '../providers/PuiProvider';
import { DEFAULT_ARCHETYPE_ID } from '../providers/archetypes';
import type { ThemePreferences } from '../providers/types';

/**
 * Reusable render helper for the Test_Platform (Requirement 2.3).
 *
 * Renders a component inside `PuiProvider` with a supplied `ThemePreferences`,
 * so render, accessibility, and gradient/preference tests can mount components
 * under a known theming configuration without repeating provider boilerplate.
 *
 * The supplied preferences are applied through the provider's `default*` props.
 * `localStorage` is shimmed and reset per test (see `setup.ts`), so persisted
 * values never leak between tests and the defaults are honored deterministically.
 */

/** The default preferences used when a test does not override a field. */
export const DEFAULT_PREFERENCES: ThemePreferences = {
  theme: 'light',
  themeStyle: 'apple',
  brandId: 'foundry',
  archetypeId: DEFAULT_ARCHETYPE_ID,
  // Radius/density default to `1` (no scale change), matching the provider
  // defaults. Tests that need to explore other scales override via
  // `preferences` on the render helper.
  borderRadius: 1,
  density: 1,
};

export interface RenderWithPuiOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Theme preferences to apply to the wrapping `PuiProvider`. */
  preferences?: Partial<ThemePreferences>;
}

/**
 * Render `ui` wrapped in a `PuiProvider` configured with the given
 * `preferences` (merged over `DEFAULT_PREFERENCES`). Returns the standard
 * Testing Library `RenderResult`.
 */
export function renderWithPui(
  ui: React.ReactElement,
  options: RenderWithPuiOptions = {}
): RenderResult {
  const { preferences, ...renderOptions } = options;
  const prefs: ThemePreferences = { ...DEFAULT_PREFERENCES, ...preferences };

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <PuiProvider
      defaultTheme={prefs.theme}
      defaultThemeStyle={prefs.themeStyle}
      defaultBrand={prefs.brandId}
      defaultArchetype={prefs.archetypeId}
      defaultBorderRadius={prefs.borderRadius}
      defaultDensity={prefs.density}
    >
      {children}
    </PuiProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export default renderWithPui;
