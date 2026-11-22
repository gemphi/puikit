import { useEffect } from 'react';
import { usePuiTheme } from '../../../providers/PuiProvider';
import { GROUND_SETS, groundTokens, type GroundSet } from '../../../phisvg';

export type PhiSvgProps = {
  /** The sets of grounds to dress the page from; the kit's base sets when none are given. */
  sets?: GroundSet[];
};

/**
 * Dresses the page in phisvg's grounds. It takes the set that names the look that is on, reads the theme's colours as they are
 * now (the brand's, or a palette a person picked), has phisvg draw each ground from them, and writes the results on
 * the root as the ground tokens every component already reads. In a look no set names it takes them off again, and
 * the look's own tokens show. It draws nothing itself. Mount it once, inside the theme provider.
 */
export const PhiSvg = ({ sets = GROUND_SETS }: PhiSvgProps) => {
  const { themeStyle, isDark, brandId, paletteId } = usePuiTheme();
  useEffect(() => {
    const root = document.documentElement;
    const names = [...new Set(sets.flatMap((s) => Object.keys(s.ground).flatMap((t) => Object.keys(s.strength).map((k) => t + k))))];
    const clear = () => names.forEach((n) => root.style.removeProperty(n));
    const set = sets.find((s) => s.look.includes(themeStyle));
    if (!set) { clear(); return; }
    // The provider writes the theme's colours on the root in its own effect; read them after it has.
    const draw = () => {
      clear();
      const seen = getComputedStyle(root); const first = seen.getPropertyValue('--phi-color-primary').trim();
      // A theme colour may be written any way CSS allows (a mix, an hsl); a probe gives it back as one plain colour.
      const probe = document.createElement('span'); probe.style.display = 'none'; root.appendChild(probe);
      const plain = (value: string) => { probe.style.color = ''; probe.style.color = value; return getComputedStyle(probe).color; };
      const colour = Object.fromEntries(Object.entries(set.colour).map(([role, token]) => [role, plain(seen.getPropertyValue(token).trim() || first)]));
      const scale = set.scale ? (parseFloat(seen.getPropertyValue(set.scale)) || 0) / 100 : 1;
      probe.remove();
      for (const [name, value] of Object.entries(groundTokens(set, colour, scale))) root.style.setProperty(name, value);
    };
    const frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); clear(); };
  }, [sets, themeStyle, isDark, brandId, paletteId]);
  return null;
};
