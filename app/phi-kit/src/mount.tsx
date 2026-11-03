import React from 'react';
import ReactDOM from 'react-dom/client';
import '@pui/styles/core.scss';
import { PuiProvider } from '@pui/providers';
import { PhiApp } from './PhiApp';
import { AccountLinks } from './AccountDialog';
import { DEFAULT_GRADIENT, DEFAULT_LOOK, migrateLook } from './looks';

/** Boot a Phi app: the SpaceX look (rocket-interior style + brand), dark by default. Users switch look and mode in Settings / Appearance.
 *  AccountLinks finishes emailed account links (?phi_verify / ?phi_reset) in whichever app they land on. */
export const mountWith = (node: React.ReactNode) => {
  migrateLook();
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <PuiProvider defaultTheme="dark" defaultThemeStyle={DEFAULT_LOOK.style} defaultBrand={DEFAULT_LOOK.brand} defaultPalette={DEFAULT_LOOK.palette} defaultGradientLevel={DEFAULT_GRADIENT}>{node}<AccountLinks /></PuiProvider>
    </React.StrictMode>
  );
};

/** Data-driven app (nav + views + blocks from public/data/<key>.json). */
export const mountPhiApp = (appKey: string) => mountWith(<PhiApp appKey={appKey} />);
