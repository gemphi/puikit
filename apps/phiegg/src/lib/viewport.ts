import { useSyncExternalStore } from 'react';
import { site } from './data';

const sub = (f: () => void) => { window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); };
/** Below this the rail becomes a bottom tab bar (the `mobile` menus). */
export const MOBILE_BELOW = 720;
/** Viewport class: compact (< site.compactBelow) folds the header and sidebar; mobile swaps the rail for tabs. */
export const useViewport = () => {
  const w = useSyncExternalStore(sub, () => window.innerWidth, () => 1440);
  return { width: w, compact: w < site.compactBelow, mobile: w < MOBILE_BELOW };
};
