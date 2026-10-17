import { RADIUS_PRESETS, usePuiTheme, type GradientLevel, type RadiusPreset, type ThemeStyle } from '@pui/providers';

/** A look = a puijs theme style + the brand that voices it. Apple is the default for every Phi app. */
/** A look = a puijs theme style + the brand that voices it + the seeded palette that colours it ('none' = brand colours). */
/** Each look also carries its gradient level and corner preset; picking the look applies all of them, and the
 *  Gradients and Corners pickers then fine-tune on top. */
export type Look = { id: string; label: string; style: ThemeStyle; brand: string; palette: string; gradient: GradientLevel; radius: RadiusPreset };
export const LOOKS: Look[] = [
  // SpaceX first: the rocket-interior look is the house default — instrument-blue seams, brushed panels, square edges.
  { id: 'spacex', label: 'SpaceX', style: 'spacex', brand: 'spacex', palette: 'none', gradient: 'soft', radius: 'small' },
  { id: 'apple', label: 'Apple', style: 'apple', brand: 'apple', palette: 'apple', gradient: 'soft', radius: 'medium' },
  { id: 'organic', label: 'Organic', style: 'organic', brand: 'phiegg', palette: 'opal', gradient: 'vivid', radius: 'pill' },
];
/** Gradient level every app starts on (Settings / Appearance change it). */
export const DEFAULT_GRADIENT = 'soft' as const;
export const DEFAULT_LOOK = LOOKS[0];

/** Bumped when the default look changes: stored style/brand/mode choices from before are dropped once so the new default shows. */
const LOOK_VERSION = '3';
export function migrateLook(): void {
  try {
    const ls = window.localStorage;
    if (ls.getItem('phi-look-version') === LOOK_VERSION) return;
    // Drop prior look AND mode choices so the new default (SpaceX, dark) shows once for everyone.
    for (let i = ls.length - 1; i >= 0; i--) { const k = ls.key(i); if (k && /^phi-(style|brand|palette|gradient|theme)(::|$)/.test(k)) ls.removeItem(k); }
    ls.setItem('phi-look-version', LOOK_VERSION);
  } catch { /* storage blocked: defaults apply anyway */ }
}

/** Current look (matched on style) and a setter that switches style + brand together. */
export function useLook(): [Look, (id: string) => void] {
  const { themeStyle, setThemeStyle, setBrandId, setPaletteId, setGradientLevel, setBorderRadius } = usePuiTheme();
  const cur = LOOKS.find((l) => l.style === themeStyle) ?? DEFAULT_LOOK;
  const set = (id: string) => {
    const l = LOOKS.find((x) => x.id === id); if (!l) return;
    setThemeStyle(l.style); setBrandId(l.brand); setPaletteId(l.palette); setGradientLevel(l.gradient); setBorderRadius(RADIUS_PRESETS[l.radius]);
  };
  return [cur, set];
}
