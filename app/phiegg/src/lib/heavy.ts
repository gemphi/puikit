// The heavy data (stores 6.6MB, shows 3.3MB, sales 1.2MB) stays out of the main bundle: Vite splits these dynamic
// imports into their own chunks, fetched right after mount. Their ids were mapped at build time (data/heavyIds.json,
// scripts/heavy-ids.mjs), so ID_MAP already knows every row here; this module remaps the documents with that same
// map and lands the rows in D, then rebuilds the indexes. main.tsx runs loadHeavy() before bootLive(), so Phiora's
// overlay always finds its rows.
import { remapDeep } from '@phi-kit/normalize';
import { MAP } from './ids';
import { D, refreshIndexes, STORES } from './data';
import type { SalesData, ShowsData, StoresData, TrailData } from '../types/phiegg';

let DONE: Promise<void> | null = null;

/** Fetch the lazy chunks once, remap to database ids, land them in D and refresh every index. */
export function loadHeavy(): Promise<void> {
  DONE ??= Promise.all([
    import('../data/stores.json'),
    import('../data/shows.json'),
    import('../data/sales.json'),
    import('../data/trail.json'),
  ]).then(([storesMod, showsMod, salesMod, trailMod]) => {
    const stores = storesMod.default as unknown as StoresData;
    const shows = showsMod.default as unknown as ShowsData;
    const sales = salesMod.default as unknown as SalesData;
    const trail = trailMod.default as unknown as TrailData;
    for (const f of [stores, shows, sales, trail]) remapDeep(f, MAP);
    D.stores.stores.push(...stores.stores);
    STORES.push(...stores.stores);
    D.shows.shows.push(...shows.shows);
    D.shows.poses.push(...shows.poses);
    D.shows.season = shows.season; // the season the shows' own title and line name
    D.sales.sales.push(...sales.sales);
    D.trail.sales.push(...trail.sales);
    refreshIndexes();
  });
  return DONE;
}
