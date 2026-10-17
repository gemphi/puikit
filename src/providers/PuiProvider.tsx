'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Theme, ThemeStyle, ThemePreferences, PuiContextValue } from './types';
import { BRAND_THEMES } from './themes';
import {
  SITE_ARCHETYPES,
  DEFAULT_ARCHETYPE_ID,
  resolveArchetype,
  resolveBrandId,
} from './archetypes';
import { deriveGradientTreatment } from './gradient';
import { PALETTES, PALETTE_TOKEN_NAMES, brandGradientTokens, derivePaletteTokens, paletteOf, type GradientLevel, type SeedPalette } from './palette';
import {
  PREF_KEYS,
  DEFAULT_USER_ID,
  loadUserPreference,
  persistUserPreference,
  loadUserNumberPreference,
} from './preferences';
import { ServiceProvider } from '../services/ServiceProvider';
import { IServiceContainer } from '../services/types';

export * from './types';
export * from './themes';
export * from './palette';
import { radiusPresetOf } from './palette';

const PuiContext = createContext<PuiContextValue>({
  theme: 'system',
  setTheme: () => {},
  themeStyle: 'apple',
  setThemeStyle: () => {},
  brandId: 'foundry',
  setBrandId: () => {},
  archetypeId: DEFAULT_ARCHETYPE_ID,
  setArchetypeId: () => {},
  activeArchetype: resolveArchetype(DEFAULT_ARCHETYPE_ID),
  brandExplicit: false,
  borderRadius: 1,
  setBorderRadius: () => {},
  density: 1,
  setDensity: () => {},
  userId: DEFAULT_USER_ID,
  setUserId: () => {},
  preferences: {
    theme: 'system',
    themeStyle: 'apple',
    brandId: 'foundry',
    archetypeId: DEFAULT_ARCHETYPE_ID,
    borderRadius: 1,
    density: 1,
  },
  setPreferences: () => {},
  brands: BRAND_THEMES,
  archetypes: SITE_ARCHETYPES,
  isDark: false,
  paletteId: '',
  setPaletteId: () => {},
  gradientLevel: '',
  setGradientLevel: () => {},
  palettes: PALETTES,
  paletteOverride: null,
  setPaletteOverride: () => {},
});

export const usePuiTheme = () => useContext(PuiContext);
export const usePhiTheme = usePuiTheme;
export const usePTheme = usePuiTheme;

const getIsDark = (t: Theme) => {
  if (t === 'dark') return true;
  if (t !== 'system') return false;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const writeRootPreferences = (
  theme: Theme,
  brandId: string,
  style: ThemeStyle,
  archetypeId: string,
  borderRadius: number,
  density: number,
  paletteId: string | SeedPalette = '',
  gradientLevel: GradientLevel | '' = '',
  darkOverride?: boolean,
) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const isDark = darkOverride ?? getIsDark(theme);
  // Clear whatever the palette system wrote last time before the brand writes its own values.
  if (root.hasAttribute('data-palette') || root.hasAttribute('data-gradient-level')) {
    for (const name of PALETTE_TOKEN_NAMES) root.style.removeProperty(name);
    root.style.removeProperty('--phi-gradient-control-text');
    root.removeAttribute('data-palette');
    root.removeAttribute('data-gradient-level');
  }
  root.classList.toggle('dark', isDark);
  root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  root.setAttribute('data-theme-style', style);
  root.setAttribute('data-archetype', archetypeId);

  // Radius/density scales are applied as unitless numbers so the SCSS token
  // definitions can multiply their base values via calc() (Part B).
  root.style.setProperty('--phi-radius-scale', String(borderRadius));
  // Named preset (small · medium · large · pill) so styles can switch shape, not just size — pill makes controls round.
  root.setAttribute('data-radius', radiusPresetOf(borderRadius));
  root.style.setProperty('--phi-space-scale', String(density));

  const brand = BRAND_THEMES.find((b) => b.id === brandId) || BRAND_THEMES[0];
  const { colors } = brand;
  const gradient = isDark ? brand.gradientDark : brand.gradient;
  root.setAttribute('data-brand', brand.id);
  // A brand may supply a dark-mode primary; otherwise the single primary is
  // used for both, which is correct for mid-tone brand colors.
  root.style.setProperty('--phi-color-primary', (isDark && colors.primaryDark) || colors.primary);
  root.style.setProperty(
    '--phi-color-primary-hover',
    (isDark && (colors.primaryHoverDark || colors.primaryDark)) || colors.primaryHover
  );
  root.style.setProperty('--phi-color-primary-light', isDark ? colors.primaryLightDark : colors.primaryLight);
  root.style.setProperty('--phi-color-primary-dark', isDark ? colors.primary : colors.primaryHover);
  root.style.setProperty('--phi-color-secondary', colors.secondary);
  root.style.setProperty('--phi-color-secondary-hover', colors.secondaryHover);
  root.style.setProperty('--phi-color-success', colors.success);
  root.style.setProperty('--phi-color-success-light', isDark ? colors.successLightDark : colors.successLight);
  root.style.setProperty('--phi-color-warning', colors.warning);
  root.style.setProperty('--phi-color-warning-light', isDark ? colors.warningLightDark : colors.warningLight);
  root.style.setProperty('--phi-color-error', colors.error);
  root.style.setProperty('--phi-color-error-hover', colors.errorHover);
  root.style.setProperty('--phi-color-error-light', isDark ? colors.errorLightDark : colors.errorLight);
  root.style.setProperty('--phi-color-info', colors.info);
  root.style.setProperty('--phi-color-info-hover', colors.infoHover);
  root.style.setProperty('--phi-color-info-light', isDark ? colors.infoLightDark : colors.infoLight);
  root.style.setProperty('--phi-brand-gradient', gradient);
  root.style.setProperty('--phi-gradient-brand', gradient);

  // A brand's control gradient: primary controls wear it left to right and
  // oppose it on hover. Cleared for solid-primary brands so nothing leaks.
  if (brand.controlGradient) {
    root.style.setProperty('--phi-gradient-control', brand.controlGradient);
    root.style.setProperty('--phi-gradient-control-hover', brand.controlGradientHover ?? brand.controlGradient);
    root.style.setProperty('--phi-gradient-control-text', '#fff');
  } else {
    root.style.removeProperty('--phi-gradient-control');
    root.style.removeProperty('--phi-gradient-control-hover');
    root.style.removeProperty('--phi-gradient-control-text');
  }

  // Gradient-by-default: applied only when the theme style is `gradient`.
  // The parent/child/accent values are derived from the active brand's
  // light/dark gradient source following the resolved mode, as layered
  // low-alpha radial tints over a vertical surface gradient.
  // When the style is not `gradient`, the attribute and custom properties are
  // cleared so no default gradient treatment leaks into other styles.
  const gradientTreatment = deriveGradientTreatment(brand, style, isDark);
  if (gradientTreatment) {
    root.setAttribute('data-gradient-default', 'true');
    root.style.setProperty('--phi-gradient-parent', gradientTreatment.parent);
    root.style.setProperty('--phi-gradient-child', gradientTreatment.child);
    root.style.setProperty('--phi-gradient-accent', gradientTreatment.accent);
    root.style.setProperty('--phi-gradient-rail', gradientTreatment.rail);
    root.style.setProperty('--phi-gradient-rail-reverse', gradientTreatment.railReverse);
    root.style.setProperty('--phi-gradient-card-wash', gradientTreatment.card);
    root.style.setProperty('--phi-gradient-card-wash-reverse', gradientTreatment.cardReverse);
  } else {
    root.removeAttribute('data-gradient-default');
    root.style.removeProperty('--phi-gradient-parent');
    root.style.removeProperty('--phi-gradient-child');
    root.style.removeProperty('--phi-gradient-accent');
    root.style.removeProperty('--phi-gradient-rail');
    root.style.removeProperty('--phi-gradient-rail-reverse');
    root.style.removeProperty('--phi-gradient-card-wash');
    root.style.removeProperty('--phi-gradient-card-wash-reverse');
  }

  // The full gradient system: a seeded palette (surfaces, text, accents and every gradient level), or the
  // gradient levels alone from the brand. Applied last so it wins over the brand and the theme style; an app
  // opts in with defaultPalette / defaultGradientLevel or the setters, and nothing is written otherwise.
  const palette = typeof paletteId === 'string' ? paletteOf(paletteId) : paletteId;
  const level: GradientLevel | '' = gradientLevel || (palette ? 'soft' : '');
  const tokens = palette
    ? derivePaletteTokens(palette, isDark, level || 'soft')
    : level ? brandGradientTokens((isDark && colors.primaryDark) || colors.primary, colors.info, isDark, level) : null;
  if (tokens) {
    for (const [name, value] of Object.entries(tokens)) root.style.setProperty(name, value);
    if (palette) root.setAttribute('data-palette', palette.id);
    root.setAttribute('data-gradient-level', level);
  }
};

export interface PuiProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultThemeStyle?: ThemeStyle;
  defaultBrand?: string;
  defaultArchetype?: string;
  defaultBorderRadius?: number;
  defaultDensity?: number;
  /** The initial user identity. Defaults to `'guest'`. */
  defaultUserId?: string;
  container?: IServiceContainer;
  /** Seeded palette id (see PALETTES); '' = none, the brand colours stand. */
  defaultPalette?: string;
  /** Gradient level for every surface: flat · soft · vivid · aurora; '' = off (theme style decides). */
  defaultGradientLevel?: GradientLevel | '';
}

export const PuiProvider: React.FC<PuiProviderProps> = ({
  children,
  defaultTheme = 'system',
  defaultThemeStyle = 'apple',
  defaultBrand,
  defaultArchetype = DEFAULT_ARCHETYPE_ID,
  defaultBorderRadius = 1,
  defaultDensity = 1,
  defaultUserId = DEFAULT_USER_ID,
  container,
  defaultPalette = '',
  defaultGradientLevel = '',
}) => {
  // The active user identity. Preferences are namespaced per user, so the
  // initial load and every persist is scoped to this id (defaults to 'guest').
  const [userId, setUserIdState] = useState<string>(defaultUserId || DEFAULT_USER_ID);

  // Preferences are initialized with default precedence: a persisted value
  // beats the initialization default (Requirement 10.2), scoped to the user.
  const [theme, setThemeState] = useState<Theme>(() => loadUserPreference<Theme>(PREF_KEYS.theme, defaultUserId, defaultTheme));
  const [themeStyle, setThemeStyleState] = useState<ThemeStyle>(() => loadUserPreference<ThemeStyle>(PREF_KEYS.themeStyle, defaultUserId, defaultThemeStyle));
  const [archetypeId, setArchetypeIdState] = useState<string>(() => loadUserPreference<string>(PREF_KEYS.archetypeId, defaultUserId, defaultArchetype));
  const [borderRadius, setBorderRadiusState] = useState<number>(() => loadUserNumberPreference(PREF_KEYS.borderRadius, defaultUserId, defaultBorderRadius));
  const [density, setDensityState] = useState<number>(() => loadUserNumberPreference(PREF_KEYS.density, defaultUserId, defaultDensity));
  const [paletteId, setPaletteIdState] = useState<string>(() => loadUserPreference<string>(PREF_KEYS.palette, defaultUserId, defaultPalette));
  const [gradientLevel, setGradientLevelState] = useState<GradientLevel | ''>(() => loadUserPreference<GradientLevel | ''>(PREF_KEYS.gradientLevel, defaultUserId, defaultGradientLevel));

  // Brand tracking: a brand is "explicit" when the app supplied a default brand
  // or a persisted brand exists. Otherwise the active archetype's default brand
  // is used (Requirements 6.2, 7.1). We track the explicit brand separately
  // from the resolved effective brand so archetype switches can fall back to
  // the archetype default until the user picks a brand.
  const [explicitBrandId, setExplicitBrandIdState] = useState<string | null>(() => {
    const persisted = loadUserPreference<string>(PREF_KEYS.brandId, defaultUserId, '');
    if (persisted) return persisted;
    return defaultBrand ?? null;
  });

  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );
  const isDark = theme === 'dark' || (theme === 'system' && systemDark);

  const activeArchetype = useMemo(() => resolveArchetype(archetypeId), [archetypeId]);
  const brandExplicit = explicitBrandId !== null;
  const brandId = useMemo(
    () => resolveBrandId(activeArchetype, explicitBrandId),
    [activeArchetype, explicitBrandId]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    setSystemDark(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  // A transient palette (the page wears what it shows); never persisted, cleared with null.
  const [paletteOverride, setOverride] = useState<{ palette: SeedPalette; level?: GradientLevel } | null>(null);
  const setPaletteOverride = useCallback((palette: SeedPalette | null, level?: GradientLevel) => setOverride(palette ? { palette, level } : null), []);

  useEffect(() => {
    writeRootPreferences(theme, brandId, themeStyle, activeArchetype.id, borderRadius, density, paletteOverride?.palette ?? paletteId, (paletteOverride && paletteOverride.level) || gradientLevel, isDark);
  }, [theme, brandId, themeStyle, activeArchetype.id, borderRadius, density, systemDark, paletteId, gradientLevel, paletteOverride]);

  // Every setter persists per-user so switching identity swaps the entire
  // persisted preference set (guest and named users each keep their own).
  const setTheme = (t: Theme) => { setThemeState(t); persistUserPreference(PREF_KEYS.theme, userId, t); };
  const setThemeStyle = (s: ThemeStyle) => { setThemeStyleState(s); persistUserPreference(PREF_KEYS.themeStyle, userId, s); };
  const setBrandId = (b: string) => { setExplicitBrandIdState(b); persistUserPreference(PREF_KEYS.brandId, userId, b); };
  const setArchetypeId = (a: string) => { setArchetypeIdState(a); persistUserPreference(PREF_KEYS.archetypeId, userId, a); };
  const setBorderRadius = (n: number) => { setBorderRadiusState(n); persistUserPreference(PREF_KEYS.borderRadius, userId, String(n)); };
  const setDensity = (n: number) => { setDensityState(n); persistUserPreference(PREF_KEYS.density, userId, String(n)); };
  const setPaletteId = (id: string) => { setPaletteIdState(id); persistUserPreference(PREF_KEYS.palette, userId, id); };
  const setGradientLevel = (l: GradientLevel | '') => { setGradientLevelState(l); persistUserPreference(PREF_KEYS.gradientLevel, userId, l); };

  /**
   * Switch the active user identity. When the id changes, we reload every
   * preference from that user's namespaced storage so the whole UI adopts
   * their saved theme/style/brand/archetype/radius/density.
   */
  const setUserId = (nextUserId: string) => {
    const id = nextUserId || DEFAULT_USER_ID;
    setUserIdState(id);
    setThemeState(loadUserPreference<Theme>(PREF_KEYS.theme, id, defaultTheme));
    setThemeStyleState(loadUserPreference<ThemeStyle>(PREF_KEYS.themeStyle, id, defaultThemeStyle));
    setArchetypeIdState(loadUserPreference<string>(PREF_KEYS.archetypeId, id, defaultArchetype));
    setBorderRadiusState(loadUserNumberPreference(PREF_KEYS.borderRadius, id, defaultBorderRadius));
    setDensityState(loadUserNumberPreference(PREF_KEYS.density, id, defaultDensity));
    setPaletteIdState(loadUserPreference<string>(PREF_KEYS.palette, id, defaultPalette));
    setGradientLevelState(loadUserPreference<GradientLevel | ''>(PREF_KEYS.gradientLevel, id, defaultGradientLevel));
    const persistedBrand = loadUserPreference<string>(PREF_KEYS.brandId, id, '');
    setExplicitBrandIdState(persistedBrand ? persistedBrand : (defaultBrand ?? null));
  };

  const setPreferences = (prefs: Partial<ThemePreferences>) => {
    if (prefs.theme) setTheme(prefs.theme);
    if (prefs.themeStyle) setThemeStyle(prefs.themeStyle);
    if (prefs.brandId) setBrandId(prefs.brandId);
    if (prefs.archetypeId) setArchetypeId(prefs.archetypeId);
    if (prefs.borderRadius !== undefined) setBorderRadius(prefs.borderRadius);
    if (prefs.density !== undefined) setDensity(prefs.density);
  };
  const preferences = useMemo<ThemePreferences>(
    () => ({ theme, themeStyle, brandId, archetypeId, borderRadius, density }),
    [theme, themeStyle, brandId, archetypeId, borderRadius, density]
  );

  return (
    <PuiContext.Provider
      value={{
        theme,
        setTheme,
        themeStyle,
        setThemeStyle,
        brandId,
        setBrandId,
        archetypeId,
        setArchetypeId,
        activeArchetype,
        brandExplicit,
        borderRadius,
        setBorderRadius,
        density,
        setDensity,
        userId,
        setUserId,
        preferences,
        setPreferences,
        brands: BRAND_THEMES,
        archetypes: SITE_ARCHETYPES,
        isDark,
        paletteId,
        setPaletteId,
        gradientLevel,
        setGradientLevel,
        palettes: PALETTES,
        paletteOverride: paletteOverride?.palette ?? null,
        setPaletteOverride,
      }}
    >
      <ServiceProvider container={container}>{children}</ServiceProvider>
    </PuiContext.Provider>
  );
};

export const PhiProvider = PuiProvider;
export const PProvider = PuiProvider;
export default PuiProvider;
