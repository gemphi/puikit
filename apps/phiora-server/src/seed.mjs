// Put the app data into Phiora's one database, the way the server does on start in development.
//   npm run seed            load when the data files changed since the last load
//   npm run seed -- --force load again regardless
// Same settings as the server: DATABASE_URL / PHI_PG_URL or PHI_STORE, PHI_DATA_DIR, PHI_ITEMS_DIR.
import { createPhiora } from './server.mjs';
import { seedItems } from './tree.mjs';

const force = process.argv.includes('--force');
const { server, store, itemsDir, appsDir } = createPhiora({ env: { ...process.env, PHI_SEED: '0', PHI_QUIET: '1' } });
const t0 = Date.now();
const d = await seedItems(store, itemsDir, { force, appsDir });
if (d.missing) console.log('no tree.json in ' + itemsDir);
else console.log(`${d.loaded ? 'loaded' : 'unchanged'}: ${d.items} records${d.skipped ? ` (${d.skipped} skipped)` : ''}\n  ${(d.kinds ?? []).map((k) => `${k.kind} ${k.count}`).join(', ')}`);
console.log(`store: ${store.kind} · ${Date.now() - t0} ms`);
server.close(); // closes the store too
