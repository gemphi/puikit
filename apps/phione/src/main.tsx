import React from 'react';
import ReactDOM from 'react-dom/client';
import { PuiProvider } from '@pui/providers';
import { App } from './App';
import { connectPhiadk } from './state/phiadk';
import '@pui/tokens/tokens.scss';
import '@pui/styles/core.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PuiProvider defaultTheme="system" defaultThemeStyle="apple" defaultBrand="apple" defaultPalette="apple" defaultGradientLevel="soft">
      <App />
    </PuiProvider>
  </React.StrictMode>
);

void connectPhiadk();
