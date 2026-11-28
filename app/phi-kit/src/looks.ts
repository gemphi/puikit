import { RADIUS_PRESETS, useLayout, usePuiTheme, type GradientLevel, type RadiusPreset, type ThemeStyle } from '@pui/providers';
import LOOK_DATA from './looks.json';

/** A look = a puikit theme style + the brand that voices it + the seeded palette that colours it ('none' = brand
 *  colours), its gradient level and corner preset; picking the look applies all of them, and the Gradients and
 *  Corners pickers then fine-tune on top. A look may open in its own mode (Apple opens dark) and lay its own ground
 *  under the window (tokens/_ground.scss); the light is still a switch. The looks are data: looks.json. */
export type Look = { id: string; label: string; style: ThemeStyle; brand: string; palette: string; gradient: GradientLevel; radius: RadiusPreset; mode?: 'light' | 'dark'; ground?: string; swatch?: string[] };
export const LOOKS: Look[] = LOOK_DATA.looks as Look[];
/** Gradient level every app starts on (Settings / Appearance change it). */
export const DEFAULT_GRADIENT = 'soft' as const;
export const DEFAULT_LOOK = LOOKS[0];

/** Bumped when the default look changes: stored style/brand/mode choices from before are dropped once so the new default shows. */
const LOOK_VERSION = '4';
export function migrateLook(): void {
  try {
    const ls = window.localStorage;
    if (ls.getItem('phi-look-version') === LOOK_VERSION) return;
    // Drop prior look AND mode choices so each app's default look shows once for everyone.
    for (let i = ls.length - 1; i >= 0; i--) { const k = ls.key(i); if (k && /^phi-(style|brand|palette|gradient|theme)(::|$)/.test(k)) ls.removeItem(k); }
    ls.setItem('phi-look-version', LOOK_VERSION);
  } catch { /* storage blocked: defaults apply anyway */ }
}

/** Current look (matched on style and brand, so two looks of one style, Jingle and Phiogy, stay apart) and a setter
 *  that switches style + brand together. */
export function useLook(): [Look, (id: string) => void] {
  const { themeStyle, brandId, setThemeStyle, setBrandId, setPaletteId, setGradientLevel, setBorderRadius, setTheme } = usePuiTheme();
  const [, setGround] = useLayout('ground');
  const cur = LOOKS.find((l) => l.style === themeStyle && l.brand === brandId) ?? LOOKS.find((l) => l.style === themeStyle) ?? DEFAULT_LOOK;
  const set = (id: string) => {
    const l = LOOKS.find((x) => x.id === id); if (!l) return;
    setThemeStyle(l.style); setBrandId(l.brand); setPaletteId(l.palette); setGradientLevel(l.gradient); setBorderRadius(RADIUS_PRESETS[l.radius]);
    // The look's own mode and ground: Apple opens dark on its night; a look with none leaves the page's own.
    if (l.mode) setTheme(l.mode);
    setGround(l.ground ?? '');
  };
  return [cur, set];
}

/** What a bought thing puts on when it is worn (a shop's theme): one of the kit's palettes by its name, or a ground
 *  under the whole window (tokens/_ground.scss: Ripple). */
export type Wear = { palette?: string; ground?: string };
/** Wearing: is this on now, put it on, and take it off again (back to what the look itself wears). */
export function useWear() {
  const { paletteId, setPaletteId } = usePuiTheme();
  const [look] = useLook();
  const [ground, setGround] = useLayout('ground');
  return {
    on: (w?: Wear) => (!!w?.palette && w.palette === paletteId) || (!!w?.ground && w.ground === ground),
    put: (w?: Wear) => { if (w?.palette) setPaletteId(w.palette); if (w?.ground) setGround(w.ground); },
    off: () => { setPaletteId(look.palette); setGround(look.ground ?? ''); },
  };
}
