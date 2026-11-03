# phi-kit — shared shell for the Phiace apps

Not published. Every `apps/phi*` app imports it through the `@phi-kit` alias.

- **Theme:** `PuiProvider defaultThemeStyle="organic" defaultBrand="phiegg"` (tokens in `src/tokens/_organic.scss`).
- **Shell (`PhiShell`):** rail (apps, You, Settings) → section menu (the app's `nav`, ending with You + Settings) → content → optional right-bar. Mobile: Menu button opens rail + menu as a drawer.
- **Content:** each app is data — `public/data/<key>.json` with `nav` + `views` → `blocks`. Block kinds: chat, grid, table, terminal, swap, stats (`src/blocks/`). Add a kind once here; every app gets it.
- **Data source:** `VITE_PHI_API` set → `GET {api}/apps/<key>` (Phiora). Unset → the bundled JSON.
- **Cross-app links:** `VITE_PHI_APPS_BASE` (prod, e.g. `https://phiace.com/`) or localhost ports from `registry.json` in dev.
- **Items and kinds (`src/kinds.ts`):** one model for every record (`Item { id, kind, name, attrs }`), links from every `*Id` / `*Ids` field, kind summaries.
- **Relations (`src/relations.ts`):** the shared relations index. `indexRelations(sources, specs)` names each link both ways (a club's "Founder", the person's "Clubs founded"), indexes it in both directions and answers `relationsOf`, `degreeOf`, `ranked` (most linked), `linksOf`, the `schema` (every link type with its count) and the values that point at nothing. Apps with typed kinds pass their own specs (Phiegg); apps on the items model derive them (`relationsOfDB`, Phidata). Usual names are in `REL_NAMES`.
- **Agents (`src/phient.ts`, `src/blocks/Agent.tsx`, `src/presets.ts`):** the Phient platform client, the `agent` block (verbs, parameters, output, runs; `verb` and `autorun` to open on a verb) and ready-made runs per agent. Phione's console and every Platform view use the same block.
- **Database ids (`src/md5.ts`, `src/normalize.ts`):** the one database's id rules on the client — md5 of `kind:originalId`, slugs, reference remapping — so an app can normalize its bundled data to the ids Phiora serves (Phiegg's `lib/ids.ts`).
- **Lists (`src/ListView.tsx`):** the view toolbar (tile, list, grid), Filter & sort as a drawer from the right (facets from the rows, search, sorts), cards or a sortable table, pages.
- **Wallet:** `src/wallet.ts` is a localStorage stand-in for the ledger API (same `usd/egg/sum/eth` shape as the prototype).

New app: copy any `apps/phi*` folder, change the key in `src/main.tsx`, `package.json` name, port, and its `public/data/<key>.json`; add it to `registry.json`.
