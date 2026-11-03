import { mountWith } from '@phi-kit/mount';
import { hasApi } from '@phi-kit/api';
import './styles/phiegg.scss';
import { App } from './App';
import { D } from './lib/data';
import { loadHeavy } from './lib/heavy';
import { bootLive } from './lib/live';
import { bootMenus } from './lib/menus';
import { bootKinds } from './lib/kindsLive';
import { phieggStore } from './state/phieggStore';

// Mount at once on the light bundle; the heavy chunks (stores, shows, sales) stream in right behind it, and with
// Phiora on, its changes land after them so the overlay always finds its rows. The store's nests snapshot was taken
// at import, so it re-syncs from the landed data; dataRev re-renders open pages.
mountWith(<App />);
// The menus and the kind declarations (fields, filters, sorts) come from Phiora too: an edit there redraws them.
if (hasApi) void Promise.all([bootMenus().catch(() => false), bootKinds().catch(() => 0)])
  .then(([menus, kinds]) => { if (menus || kinds) phieggStore.setState({ dataRev: Date.now() }); });
void loadHeavy()
  .then(() => (hasApi ? bootLive().catch(() => 0) : 0))
  .finally(() => phieggStore.setState({ nests: D.hosts.nests.slice(), dataRev: Date.now() }));
