import { usePuiTheme, type GradientLevel, type ThemeStyle } from '@pui/providers';
import { PALETTES, type SeedPalette } from '@pui/providers/palette';
import THEME_DATA from './theme.json';
import SURFACE_DATA from './surface.json';

/** How a person has every app look, by four choices made apart (Settings): the theme (colours, theme.json), the mode
 *  (dark, light, auto), the surface (surface.json) and the corners and spacing (the kit's own). A theme or surface
 *  is data; this only reads and sets them. */
type HSL = [number, number, number];
export type ThemeChoice = { id: string; label: string; swatch: string[]; seed?: string; lightSeed?: string; accent?: HSL; accent2?: HSL; accent3?: HSL };
export type SurfaceChoice = { id: string; label: string; style: ThemeStyle; gradient: GradientLevel; swatch: string[] };
export const THEMES = THEME_DATA.theme as ThemeChoice[];
export const SURFACES = SURFACE_DATA.surface as SurfaceChoice[];

// A theme the kit has no palette for yet becomes one, so the kit derives its colours, stores the choice by its id and
// brings it back on the next visit like any other palette.
for (const t of THEMES) {
  if (t.seed && t.accent && t.accent2 && !PALETTES.some((p) => p.id === t.id)) {
    PALETTES.push({ id: t.id, name: t.label, seed: t.seed, lightSeed: t.lightSeed, accent: t.accent, accent2: t.accent2, accent3: t.accent3, source: 'theme.json' } as SeedPalette);
  }
}

/** Whether the person has picked a theme or a surface in Settings: an app's own default look (Phiegg's listed one)
 *  then no longer takes over on opening. */
const CHOSEN = 'phi-appearance-chosen';
export const chosenAppearance = () => { try { return window.localStorage.getItem(CHOSEN) === '1'; } catch { return false; } };
const choose = () => { try { window.localStorage.setItem(CHOSEN, '1'); } catch { /* storage blocked: the choice still holds for this visit */ } };

/** The theme a person wears (by its palette) and the way to pick one. The card a person clicks is what the site
 *  becomes: every card is its theme's colours as a strong gradient on its dark ground, so the pick sets the palette,
 *  dark and the vivid gradient together (Mode and Surface can change them after). */
export function useThemeChoice(): [ThemeChoice | undefined, (id: string) => void] {
  const { paletteId, setPaletteId, setTheme, setGradientLevel } = usePuiTheme();
  const id = typeof paletteId === 'string' ? paletteId : (paletteId as SeedPalette | undefined)?.id;
  return [THEMES.find((t) => t.id === id), (next: string) => { choose(); setPaletteId(next); setTheme('dark'); setGradientLevel('vivid'); }];
}

/** The surface a person wears (by its style) and the way to pick one: its style and its gradient level together. */
export function useSurface(): [SurfaceChoice | undefined, (id: string) => void] {
  const { themeStyle, setThemeStyle, setGradientLevel } = usePuiTheme();
  const set = (next: string) => { const s = SURFACES.find((x) => x.id === next); if (!s) return; choose(); setThemeStyle(s.style); setGradientLevel(s.gradient); };
  return [SURFACES.find((s) => s.style === themeStyle), set];
}
