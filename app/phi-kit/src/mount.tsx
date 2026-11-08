import React from 'react';
import ReactDOM from 'react-dom/client';
import '@pui/tokens/phi-fonts.css';
import '@pui/styles/core.scss';
import { PuiProvider } from '@pui/providers';
import { appMeta } from './data';
import { PhiApp } from './PhiApp';
import { AccountLinks } from './AccountDialog';
import { applySavedFont } from './fonts';
import { DEFAULT_GRADIENT, DEFAULT_LOOK, LOOKS, migrateLook } from './looks';

/** Boot a Phi app: the SpaceX look (rocket-interior style + brand), dark by default, unless the app names its own look
 *  and mode, and the look's own face unless the app names a font (an id from fonts.ts). Users switch look and mode in
 *  Settings / Appearance and the font in the header menu.
 *  AccountLinks finishes emailed account links (?phi_verify / ?phi_reset) in whichever app they land on. */
export const mountWith = (node: React.ReactNode, lookId?: string, mode: 'light' | 'dark' = 'dark', fontId?: string) => {
  migrateLook();
  applySavedFont(fontId);
  const look = LOOKS.find((l) => l.id === lookId);
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <PuiProvider defaultTheme={mode} defaultThemeStyle={(look ?? DEFAULT_LOOK).style} defaultBrand={(look ?? DEFAULT_LOOK).brand} defaultPalette={(look ?? DEFAULT_LOOK).palette} defaultGradientLevel={look?.gradient ?? DEFAULT_GRADIENT}>{node}<AccountLinks /></PuiProvider>
    </React.StrictMode>
  );
};

/** Data-driven app (nav + views + blocks from public/data/<key>.json). */
export const mountPhiApp = (appKey: string) => {
  const app = appMeta(appKey);
  mountWith(<PhiApp appKey={appKey} />, app?.look, app?.mode);
};
