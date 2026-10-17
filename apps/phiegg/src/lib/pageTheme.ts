// A page that wears what it shows. Opening a PFT with a set theme (a designer's kinds and colours on a look, the
// background and outfit of a profile PFT) swaps the whole app palette to it through puijs `setPaletteOverride`,
// and closing it puts back whatever was under it: a sheet over a themed profile returns to the profile's theme,
// and the last one closed returns to the user's own palette. Nothing is saved: the override never touches preferences.
import { useEffect } from 'react';
import { usePuiTheme } from '@pui/hooks';
import { paletteFromHex, type GradientLevel, type SeedPalette } from '@pui/providers';

type Entry = { key: symbol; palette: SeedPalette; level: GradientLevel };
const stack: Entry[] = [];

export function usePageTheme(hex?: string | null, accent2?: string | null, level: GradientLevel = 'vivid', id = 'page') {
  const { setPaletteOverride } = usePuiTheme();
  useEffect(() => {
    if (!hex) return undefined;
    const e: Entry = { key: Symbol(id), palette: paletteFromHex(hex, id, accent2), level };
    stack.push(e); setPaletteOverride(e.palette, e.level);
    return () => {
      const i = stack.indexOf(e); if (i >= 0) stack.splice(i, 1);
      const top = stack[stack.length - 1];
      setPaletteOverride(top ? top.palette : null, top?.level);
    };
  }, [hex, accent2, level, id, setPaletteOverride]);
}
