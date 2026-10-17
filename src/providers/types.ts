import type React from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ThemeStyle = 'apple' | 'flat' | 'gradient' | 'elevated' | 'glass' | 'organic' | 'spacex';

export interface BrandColors {
  primary: string;
  primaryHover: string;
  /**
   * Primary for dark mode. Optional: brands with a mid-tone primary read
   * correctly on both surfaces and can omit it. Brands at either extreme —
   * a near-black or near-white primary — need it, or their primary buttons
   * disappear into one of the two backgrounds.
   */
  primaryDark?: string;
  primaryHoverDark?: string;
  primaryLight: string;
  primaryLightDark: string;
  secondary: string;
  secondaryHover: string;
  success: string;
  successLight: string;
  successLightDark: string;
  warning: string;
  warningLight: string;
  warningLightDark: string;
  error: string;
  errorHover: string;
  errorLight: string;
  errorLightDark: string;
  info: string;
  infoHover: string;
  infoLight: string;
  infoLightDark: string;
}

export interface BrandTheme {
  id: string;
  name: string;
  colors: BrandColors;
  gradient: string;
  gradientDark: string;
  /**
   * A brand may render its primary controls as a gradient rather than a fill —
   * left to right at rest, opposed on hover. Absent means solid primary.
   */
  controlGradient?: string;
  controlGradientHover?: string;
}

/**
 * Props supplied to a Site_Archetype's layout composition. Kept intentionally
 * open (children plus an archetype id) so any puijs layout composition can be
 * referenced by an archetype without coupling to a specific layout shape.
 */
export interface ArchetypeLayoutProps {
  children?: React.ReactNode;
  /** The active archetype id driving this layout composition. */
  archetypeId?: string;
  /**
   * Sidebar content for archetypes that declare `supportsSidebar`. Ignored by
   * archetypes whose structure has no sidebar region.
   */
  sidebar?: React.ReactNode;
  /**
   * Whether the sidebar is currently expanded. Archetypes that support a
   * sidebar collapse to their no-sidebar structure when this is `false`,
   * letting the main region reclaim the full width.
   */
  sidebarOpen?: boolean;
}

/**
 * Props supplied to a Site_Archetype's navigation composition. Kept
 * intentionally open so any puijs navigation composition can be referenced by
 * an archetype.
 */
export interface ArchetypeNavProps {
  children?: React.ReactNode;
  /** The active archetype id driving this navigation composition. */
  archetypeId?: string;
}

/** Gradient participation defaults for a Site_Archetype. */
export interface GradientDefaults {
  /** Whether the archetype opts into gradient-by-default participation. */
  enabled: boolean;
}

/**
 * A Site_Archetype composes a layout, a navigation composition, a default
 * Brand_Theme, and gradient defaults. Selecting an archetype changes the
 * structural shape of a site, not just its colors.
 */
export interface SiteArchetype {
  /** Unique archetype identifier (archetypeId). */
  id: string;
  /** Human-readable archetype name. */
  name: string;
  /** puijs layout composition component reference (kit-specific view). */
  layout: React.ComponentType<ArchetypeLayoutProps>;
  /** puijs navigation composition component reference (kit-specific view). */
  navigation: React.ComponentType<ArchetypeNavProps>;
  /** Default Brand_Theme applied when the app has not overridden the brand. */
  defaultBrandId: string;
  /** Archetype gradient participation. */
  gradientDefaults: GradientDefaults;
  /**
   * Whether this archetype has a sidebar region a host app can toggle. When
   * false (the default) the layout ignores `sidebar`/`sidebarOpen` entirely.
   */
  supportsSidebar?: boolean;
  /** Initial sidebar state for archetypes that support one. Defaults to true. */
  defaultSidebarOpen?: boolean;
}

export interface ThemePreferences {
  theme: Theme;
  themeStyle: ThemeStyle;
  brandId: string;
  /** First-class Site_Archetype preference. */
  archetypeId: string;
  /**
   * Border-radius scale multiplier. `1` is the default (no change); the
   * sensible range is ~0..2. Applied as the unitless `--phi-radius-scale`
   * custom property so all `--phi-radius-*` tokens scale together.
   */
  borderRadius: number;
  /**
   * Spacing/density scale multiplier. `1` is the default (no change). Applied
   * as the unitless `--phi-space-scale` custom property so all `--phi-space-*`
   * tokens scale together.
   */
  density: number;
}

export interface PuiContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themeStyle: ThemeStyle;
  setThemeStyle: (style: ThemeStyle) => void;
  brandId: string;
  setBrandId: (id: string) => void;
  /** Active Site_Archetype identifier. */
  archetypeId: string;
  /** Update the active Site_Archetype. */
  setArchetypeId: (id: string) => void;
  /** Border-radius scale multiplier (1 = default). */
  borderRadius: number;
  /** Update the border-radius scale multiplier. */
  setBorderRadius: (value: number) => void;
  /** Spacing/density scale multiplier (1 = default). */
  density: number;
  /** Update the spacing/density scale multiplier. */
  setDensity: (value: number) => void;
  /**
   * The active user identity. Always present; defaults to `'guest'`.
   * Preferences are namespaced per user, so switching the user swaps the
   * entire persisted preference set live.
   */
  userId: string;
  /** Switch the active user identity, loading that user's persisted prefs. */
  setUserId: (id: string) => void;
  /** Resolved archetype descriptor for the active archetypeId. */
  activeArchetype: SiteArchetype;
  /** True when brandId was explicitly set (overrides archetype default). */
  brandExplicit: boolean;
  preferences: ThemePreferences;
  setPreferences: (preferences: Partial<ThemePreferences>) => void;
  brands: BrandTheme[];
  /** Available Site_Archetypes exposed through the provider. */
  archetypes: SiteArchetype[];
  isDark: boolean;
  /** Active seeded palette id ('' = none). */
  paletteId: string;
  setPaletteId: (id: string) => void;
  /** Gradient level for every surface ('' = off). */
  gradientLevel: import('./palette').GradientLevel | '';
  setGradientLevel: (level: import('./palette').GradientLevel | '') => void;
  /** The seeded palettes (phiber v2 + Phiegg). */
  palettes: import('./palette').SeedPalette[];
  /**
   * A palette that wins over the saved one until cleared (`null`): a page that wears the theme of what it
   * shows (an item, a look). Never persisted. `level` sets the gradient level while it is on.
   */
  paletteOverride: import('./palette').SeedPalette | null;
  setPaletteOverride: (palette: import('./palette').SeedPalette | null, level?: import('./palette').GradientLevel) => void;
}
