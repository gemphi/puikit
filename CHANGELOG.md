# Changelog

All notable changes to `@puikit` are documented here.

## [Unreleased]

### Added (round 50: the media store, collections, 3D logos)
- One set of keys for all media, built locally by `scripts/media/build_media.py` into `media/phi-media/` and read through `mediaUrl` (`VITE_PHI_MEDIA`): worlds and their zones, lands, collections, feeds, posts, profiles and assets. `scripts/media/catalog.json` names the finished art, file by file; drafts and art with no known owner stay out.
- `scripts/media/import_collections.py`: Bold Pups (6,902 tokens, 32,750 attributes) and Epic Pods (150, 900) from the old seed, BBPC from its asset sheet, Bold Ape Epic Club and HHOC from their zips, and the 16 official land types. Third-party NFT collections in the old seed are left out.
- `scripts/media/drive-map.json` maps the finished sets on Google Drive (EPAC, Bold Pups by club, city logos, the 16 land types), and the importer reads them by file name from zips or folders, attributes included.
- Worlds carry soft 3D logos in Phifing, generated as SVG in each world's colours; so does Phiegg's header mark.
- DevOps: `app/docker-compose.media.yml` (a local S3 store), `scripts/media/sync.sh` (local or AWS), `deploy/aws/media` (private S3, CloudFront, versioning, lifecycle, CORS).
- Barlow, the conventional text face, is self-hosted and in the font switch. Phifing now takes each letter's spacing from Barlow, weight for weight.

### Removed
- Phiegg Square, the display face with colliding letters, from every font stack (kept in `_temp/phiegg-square-font`).

### Added (round 49: Phifing, the Muse look, the Phiegg welcome)
- Phifing: Phi-Soft shorter for reading on the web, in Light, Regular, SemiBold and Bold (`scripts/phifing.py`, `--phi-font-fing`). Square inside the a in Light and Regular, centred bars in H and the other capitals with straight stems, shorter tails, thinner upright stems in Light and Regular, more space between letters, and a V in one piece.
- Muse look: theme style and brand after Meta's Muse and Worlds pages (`_muse.scss`): white ground, one blue, pill controls, 24px cards, set in Phifing with rem at 112.5%. In the look switcher, light and dark. `mountWith` takes an app's own look and mode; `LOOK_VERSION` is bumped, so stored look choices reset once.
- Phiegg opens on Muse in light mode, and its welcome page is rebuilt: a big scene, world portals, a tour of real product shots beside choices, rides, stories and the comparison.

- Phifing 1 to 4: the same face wider, the white inside each letter and digit grown by an eighth, a quarter, three eighths and a half of itself, stems and heights unchanged.
- Font switch in Phiegg's account menu: every Light family at normal width, Phifing's options and Phiber among them (`phi-kit/src/fonts.ts`), saved on the device and set on boot in every app.
- Phiegg's side panel closes from a pin beside its title or by clicking the current rail icon; it stays closed across visits and any other icon reopens it.

- Phifing 5: double the white. Every look in every app now reads in Phifing 4, half as much white again, Light throughout and Regular only for emphasis, with rem at 112.5%. The tall Phi-Soft and Phiber are off the default stacks; they stay in the font switch.
- The welcome page has characters: renders in `public/welcome`, named in `landing.json` (`art`), around the hero and closing panels and in the world portals and stories; they drift, lean with the pointer, and sections rise in as they scroll into view. `CONTENT-SERVING.md` sets out how content gets served next.
- A post click goes to the post's own page (`#/post/<id>`); comments open from there, or from a card, in a bottom sheet, and the look and author keep their sheets.
- The profile button opens a drawer from the right, with your moving card at its head and its rows rising in turn.

### Fixed
- Clicks that record activity, and the Recent page, crashed when the server held the activity log as a bare list. `persisted` no longer lets a list replace an object default.

### Changed
- The token is `$UM`, not `$SUM`, in all app copy. Phisum's name, the `sum` coin key and Phiegg's SUM machines are unchanged.

### Added (round 48: the production stack)
- `apps/docker-compose.yml`: Postgres, Phiora and nginx as one origin — the apps under `/<key>/`, `/api` proxied to Phiora (no CORS), demo sign-in off, every policy setting passed through the environment, data in volumes. `node build-all.mjs --dist` builds every app under its own base with `VITE_PHI_API=/api`, collects them into `dist-all/` and writes the `nginx.conf` compose serves. The Phiora image installs its one dependency (`pg`).
- `PHI_EDITORS` takes handles as well as ids; `PHI_CREATE_KINDS`, when set, is the comma list of kinds anyone signed in may create — other kinds answer 403 `kind_closed` unless an editor asks. Tests 59 pass.
- The whole one-origin topology verified end to end (a stand-in gateway in place of nginx, everything else real): `/phiegg/` reads live records over `/api` on the same origin, `/phidao/` shows the API-created proposal with its Live tag.

### Added (round 47: collections in Explore and search)
- Explore has a Collections section: the real families (two clubs or more) ranked by rolled-up sales volume, each tile carrying its club count and volume with trending badges on the top three, opening the collection wall. `collectionFamilies()` in Phiegg's data library rolls every collection up once (clubs, holders, supply, PFT count, volume from the sales ledger) for any page to use.
- Search knows collections: typing a mark offers #Satin with its club count beside clubs, worlds and people, and opens the wall.

### Added (round 46: the collection wall)
- Phiegg has a Collection page: open a collection nest (from any club's Related panel, or the switcher on the page) and get the whole family. The hero wears the lead club's scene with the member clubs named under it; six stat cards roll the family up (clubs, PFTs, holders, supply, the lowest floor, and volume summed from the sales of the family's PFTs); the Clubs grid (chain badges, Filter & sort, each opening its club) and the PFT grid across every member club (looks, pieces, eggs, machines, profile PFTs, rides and jewellery as one list, facets by kind and club, sorted by price, each opening its own sheet); Connected underneath.
- `go('collection', { nestId })` is a view like club or world (history and back included); a collection nest in any Related panel now opens it.

### Added (round 45: collections — nests clubs break out of)
- Collections are authored data: `apps/phiegg/scripts/collections.mjs` reads the club families already in the names (clubs sharing a mark: Calla has 5 clubs, Gilt, Satin, Saffron, Cobalt, Ivory, Velvet and Delphine 4 each) and writes 73 collection nests (`data/collections.json`, nest kind `collection`, 34 families of two or more, a lone club is a collection of one), each with its home world. Rerunnable.
- Membership is props only: every club gets `nestId` (its collection) and 4,741 PFTs (looks, eggs, machines, profile PFTs, rides, jewellery, pieces) get `nestId` through their club. `data:check` covers the new field and rows (259,539 links, 0 dangling). The manifest serves collection nests to the database; reseeded (20,855 records).
- Phiegg: collection nests sit with the other nests, `collectionOf` and `clubsOfCollection`, and the relations index names the link both ways, so a club's Related panel shows its COLLECTION and the collection answers with its clubs. `NestKind` gains `collection`; the nest kind list labels it.

### Added (round 44: Phipad and Phidao read the database; governance is in it; props are queryable SQL)
- Phidao's governed records are database kinds: `proposal` and `delegate` seed from `apps/phiegg/src/data/dao.json` (the seed corpus). A proposal created through `POST /tree/item` is on the ballot at once.
- Phipad and Phidao read the one database when `VITE_PHI_API` is set (`GET /tree?kind=…`): Phipad's clubs, tracks and applications, Phidao's proposals and delegates, each with a "Live from Phiora" tag; the bundled files stand in fully when the API is off, and a kind the database does not hold yet never empties a list.
- Postgres: `items.doc` is JSONB, so props are SQL (`SELECT doc->>'title' FROM items WHERE kind='proposal'`); an older text column converts in place. API-created records take their slug from name, title, label or handle.
- The PFT ontology as props, nothing else: at seed, every PFT names its pool (egg, sum and profile PFTs get `poolId` inverted from the pool's lists; looks carry it already) and a club names the pool that funds it. Nests are the collections clubs break out of and pools are the pools of quests (the ways of making the next hatch); nest membership props wait on authored data, since today's nests link hosts, worlds and cities only. Tests 58 pass; reseeded.

### Added (round 43: Phiegg reads the one database)
- phi-kit `md5.ts` (the same digest node gives, in the browser) and `normalize.ts` (`treeId`, `slugify`, `buildIdMap`, `remapDeep`, `mapKeys`, `reverseOf`): the database's id rules on the client, locked to the server by test. Tests 192 pass.
- Phiegg speaks the database's ids. `lib/ids.ts` normalizes the bundled data at import time with the same rules the seed used — md5 ids, slugs, every reference remapped, nested ones included — so bundle and database agree without fetching anything. The seams keyed on original names go back through the map (`srcId`): thread shards, production shards, role credits, thread counts; places and productions remap as they lazily load.
- With `VITE_PHI_API` set, `lib/live.ts` lays Phiora's changes over the bundle at boot: the change log (one small call), then only the changed records; edits land in place on the row objects every page already holds, created records join their lists, deleted ones leave, and the lookup indexes rebuild. The bundle stands when the API is off or slow (1.5 s cap), so the preview build is unchanged in behaviour.
- Metrics keep their code-level ids (`sold`, `vol24h`): the manifest marks the kind `keepIds` and both the seed and the client leave those ids as they are (references to them still follow). Reseeded.

### Changed (round 42: one database, Postgres, md5 ids and slugs; Phidata removed)
- One database. The per-dataset split (rounds 40–41) is gone: every record of every kind lives once in Phiora's `items` table, seeded from `apps/phiegg/src/data` (its `tree.json` now also lists moments, tracks and applications). `GET /tree`, `/tree/info`, `/tree/change`, `/tree/item/<kind>/<id>` — no dataset anywhere.
- Postgres in production: set `DATABASE_URL` (or `PHI_PG_URL`) and Phiora runs on Postgres (`src/pgstore.mjs`, the `pg` driver — `npm install`); SQLite stays the local default, JSON files the fallback. The whole store API is awaited, so backends can be async. Tests run against a real Postgres with `PHI_TEST_PG_URL` (58 pass there; 57 locally).
- Ids are md5 and every record has a `slug` (the full name with underscores): at seed time ids become md5 of `kind:originalId` (stable across reseeds) and every reference — nested ones included — follows; records created through the API get md5 of a fresh UUID and their slug from the name. `slug` is its own column, so `WHERE slug = 'maison_opal'` works in SQL. Demo sign-in puts accounts under the same md5 ids, so founders still own their records and designers their looks.
- The Phidata app is deleted. Phiora exposes the data through its API and every product system reads it from there; the browsing and relations machinery lives on in phi-kit (`kinds.ts`, `relations.ts`, `ListView`).

### Added (round 41: records change in the database)
- Phiora: the items database is the source; data files only seed it. `GET /tree/item/<dataset>/<kind>/<id>` (with who may change it and its changes), `POST /tree/item`, `PATCH` and `DELETE /tree/item/<dataset>/<kind>/<id>`, `GET /tree/change`. Owners, the person a record is or names, and `PHI_EDITORS` may change a record; guests never. Every change is logged with who and when (`item_changes`). Seeding keeps created, edited and deleted records (deleted file records stay as tombstones). In production a start loads only datasets the database does not have; `npm run seed` brings file changes in. Tests added (56 pass).
- Phidata: an item's "In the database" section (from the files or added in Phiora, edited, owner, Edit with a field form, Delete with a second step) and its Changes; "New <kind>" for signed-in people.

### Added (round 40: the app data in Phiora's database)
- Phiora keeps every record in an items table (SQLite, or one file per dataset with the JSON store): datasets `phidata` (2,093 records, 16 kinds) and `phiegg` (20,648 records, 34 kinds), each loaded from its folder by a `tree.json` manifest (new for Phiegg: `apps/phiegg/src/data/tree.json`; entries may `omit` fields already stored as their own kind). Loaded on start when the files changed, or with `npm run seed` (`-- --force` for all). `PHI_DATASETS`, `PHI_SEED`.
- `GET /tree?dataset=` reads the database (plus live designer themes); `GET /tree/dataset` lists the datasets with their kinds and counts. Tests added (53 pass).
- Phidata: when live, a dataset switch (Phidata, Phiegg) above every view, and the time the dataset was loaded into the database.

### Added (round 39: Phiora serves the items, Phidata reads them live)
- Phiora `GET /tree` (`src/tree.mjs`): every record of every kind from Phidata's data files, by a manifest (`apps/phidata/public/data/tree.json`: a list, a list inside each row with the parent id, or one object), plus Phiora's own live records: designer themes as items linked to their look and designer. `?kind=` filters. Files are re-read when they change. `PHI_ITEMS_DIR`. Tests added (51 pass).
- Phidata reads `GET /tree` when `VITE_PHI_API` is set (the bundled files, by the same manifest, otherwise or when Phiora does not answer), shows where the items came from (Live from Phiora, the read time and the live kinds, or Bundled data) and reloads on demand. A theme a designer sets in Phiora appears as an item, linked both ways to the look and the designer.
- phi-kit `ListView` opens on cards on phones (tables stay a choice); `REL_NAMES` for themes (Look / Themes, Designer / Themes set).

### Added (round 38: Phione's console is the phi-kit agent block)
- phi-kit `presets.ts`: ready-made runs (a verb, a plain label, parameters checked against the real platform) for PhiOne, PhiOra, PhiGit, PhiLog, PhiLLM, PhiCal, PhiRAG, PhiDoc, PhiMen, PhiBot and PhiBrd. The `agent` block uses them when the app's data gives none.
- `agent` block: `verb` (start on a verb) and `autorun` (run it once when shown); runs are kept per agent for the session, so switching agents and back keeps them; the runs table scrolls sideways in narrow columns.
- Phione Agents: the console beside the agent cards is the phi-kit `agent` block, so Phione and the apps' Platform views run verbs one way (presets, sign-in note for writes, refusals, "by @handle", runs). A card's verb opens the console on that verb and runs it. Verified against the real Phient and Phiora: a guest's commit is refused, a signed-in commit runs by @noor.hale. The old `AgentChat` component is no longer used.

### Added (round 37: relations in Phidata, a shared relations index in phi-kit)
- phi-kit `relations.ts`: the shared relations index. Link types name both ways (`REL_NAMES`, or the field and the source kind), are indexed in both directions, and give each record its relations grouped by name, its link count, the most linked records, every link type with its count and the values that point at nothing. Typed specs (Phiegg) or specs derived from the items model (`specsFromDB`, `relationsOfDB`). Tests added (189 pass).
- phi-kit `ListView`: the shared list (view toolbar, Filter & sort drawer from the right, cards or a sortable table, pages). `kindLabel` plurals (Cities, Series, People); `nameOf` falls back to a media title or caption before the id. Nav icons `link` and `network`.
- Phiegg: its relations index runs on phi-kit (same SPECS and names; 25,265 links, none pointing at nothing).
- Phidata: Browse (kind buttons, items as cards or a sortable table with Filter & sort, a sortable Kinds table), Relations (every link type: from, reads as, to, read back as, links, pointing at nothing; and the values that point at nothing), Most linked, and an item panel with its relations both ways, fields and the stored record, each section closable, foldable and reorderable. Worlds, cities and the store are now items, so their links resolve. Styles are props (`app.module.scss` is empty).

### Added (round 36: Phient write policy, the actor and an audit trail)
- Phient (gemphi/phient): verbs that change the platform (provision and disable identities, group and licence changes, PhiOra writes, PhiGit commits and refs, playbooks, onboarding, circuits and training, PhiLLM params, regulations, audits, PhiDoc pages, delegated tasks, PhiRAG indexing) need a Phiora delegation. `PHI_REQUIRE_DELEGATION` is `writes` (the default when delegation is configured), `all` or `off` (the default when it is not, so a local platform stays open). Guests are refused. `phiadk/phiapi/policy.py`.
- Every run carries `results.actor` (sub, handle, name); a morphism records `requested_by`. Each write is recorded in PhiLog as an audit with the public actor (no email) and a telemetry line such as "noor.hale ran phigit.commit". `GET /v2/audit/tail?n=50`; `GET /v2/identity/delegation` adds `require` and `write_verbs`. Tests added (137 pass).
- phi-kit `phient.ts`: `phientPolicy()`, `needsSignIn()`, refusals as `{ refused, status, error, message }`; the delegation is reissued when the signed-in user changes. The `agent` block marks verbs that change the platform, says who they run as, shows a refusal and the actor of each run ("by @handle").
- Phione: Audit and governance has an Audit trail table (time, agent, action, by, status); the console and identity request show a refusal with its reason.

### Added (round 35: agents in the apps, a look switcher, Apple and SpaceX review)
- phi-kit `phient.ts` (the Phient platform client for every app: the agent catalogue and verb runs, each run carrying the signed-in Phiora user's delegation) and an `agent` block: the agent, its verbs (the app's presets first), JSON parameters, the output and a sortable list of runs.
- A Platform view in the apps whose agent lives on Phient: Phihub (PhiGit), Phiora (PhiOra), Phiano (PhiLLM), Phinet (PhiCal), Phiace (PhiRAG and PhiMen), Phient (PhiBot and PhiBrd). Presets checked against the real platform.
- PhiShell: the look (Apple, SpaceX, Organic) and light or dark in every app's menu.
- Review under Apple and SpaceX, light and dark: neutral `Tag` is mixed from the text colour (it was grey-on-grey in dark); Phione's selected nav label inherits the button colour; Phione styles use `--phi-*` tokens (they named `--pui-*` tokens that do not exist).

### Added (round 34: identity delegation, Phiora to Phient to PhiOne)
- Phiora: `POST /auth/delegation` issues a short-lived HS256 JWT for the signed-in user (audience `phient` or `phione`); `POST /auth/delegation/verify` checks one for services. Settings: `PHI_DELEGATION_SECRET`, `PHI_DELEGATION_AUDIENCES`, `PHI_DELEGATION_MINUTES`. Tests added (49 pass).
- Phient (gemphi/phient): `GET /v2/identity/me` checks the delegation (locally with the shared secret, or by asking Phiora at `PHIORA_URL`) and returns the PhiOne identity for its email; `GET /v2/identity/delegation`. `phiadk/phiapi/delegation.py`, `tests/test_phiapi_delegation.py` (2 pass; `test_phiapi.py` 10 pass).
- Phione: an Identity page (Phiora account with the phi-kit account dialog, the delegation and its claims with a countdown, the PhiOne identity with groups and licences, link and unlink kept on Phiora at `/state/phione-link`, and an approval-gated identity request). Every Phient call carries the delegation as `Authorization: Bearer`.
- `dev-all.mjs --phiadk` gives Phiora and Phient one shared delegation secret and `PHIORA_URL` per run.

### Added (round 33: Phione streams and governance on the Phient API)
- Phione PhiBus streams read the Phient bus (`GET /v2/bus/events`, polled while running) and publish to it (`POST /v2/bus/pub`); topics come from the bus, with search, sortable columns and live counts. Audit and governance shows the PhiLog telemetry tail (`GET /v2/telemetry/tail`) with a level filter and runs PhiGov compliance verbs, each written to PhiLog. Sample data without `VITE_PHIADK_API`. Verified against the real `phiadk.phiapi` (FastAPI TestClient capture). `apps/phione/README.md`.
- `Stack`: a card in a column Stack is as tall as its content (no longer takes the column height and clips); `Stack` writes `data-dir`.

### Added (round 32: cards and grids as props)
- Style props `surface` (card, panel, sunken, hero: the theme background, radius and padding; padding props still win), `autoFill` (a grid of as many columns as stay that wide, sharing the row) and `rule` (top, bottom). Half-step spacing (0.5, 1.5, 2.5) for style props and `Stack gap`.
- `Pressable card` (the card gradient, radius, padding and a lifted shadow on hover), `column`, `current` (highlighted, `aria-current`, not a pressed toggle) and `accent` (an inset bar on the start when selected or current, a nav item).
- `Td intent` and `numeric`.
- phi-kit, Phipad, Phidao and Phidata: cards, stat rows, grids, heroes, table frames, FAQ rows and the section menu items are props (`surface`, `autoFill`, `rule`, `Pressable card` and `accent`); the inner card Stacks inside clickable cards are gone; inputs and selects use the puikit look. Unused classes removed. Tests added (185 pass).

### Added (round 31: puikit components everywhere)
- `Stack as` (a form, a list, a section, a label); `Input`, `Select` and `Textarea` take `width`, `maxWidth`, `flex` (Textarea also `minRows`); `ProgressBar rest` (a second colour for the rest of the track: for and against); `Pressable divider`.
- `Text`: `as` takes strong, em, b, small, kbd, figcaption, li, dt, dd and time; `intent="inherit"` and `weight="inherit"` take the colour and weight of what holds them; `size="3xl"`; `lineHeight` now wins over the size's own line height.
- Style props `lineHeight` and `font` (heading, body, mono).
- phi-kit, Phipad, Phidao, Phidata and Phiegg: headings are `Title`, text is `Text`, clickable rows and cards are `Pressable` or `Button`, tables are `Table`/`Thead`/`Tbody`/`Tr`/`Th`/`Td`, forms and lists are `Stack as`. What is left as `Box as` is a landmark (nav, aside, main, header, section) whose class carries a layout no prop covers. Unused CSS-module classes removed. Phidao's vote bar is for and against again.
- All 15 apps build and load; puikit 182 tests pass.

### Added (round 30: fill and finish)
- `Pressable` (primitives): a control with no look of its own (no border, background or padding, a pointer and a focus ring) for avatars, list rows and card faces; `row`, `gap`, `fill`, `pad`, `hover`, `selected`, `inline`, `href`. Tests added.
- `Frame` (media): a box of a fixed shape that centres what it holds on a ground; `ratio`, `rounded` (none, md, lg, full), `place` (center, end-start), `tint`, `tintStrength`, `ink`, `width`, `maxWidth`.
- Style props on every Box, Stack, Text, Title and Link: `width`, `height`, `maxHeight`, `flex`, `scroll` (x, y), `centered`, `pushEnd`, `pushDown`, `rounded`. One shared `STYLE_PROP_KEYS` / `omitStyleProps`, so no component forwards them to the DOM.
- `Button align="start"`, `tall`, `indent`; `Image fit`, `fill`; `ProgressBar color`; `Text pre`; `Toast placement="center"` and an optional close; `Sticky surface`.
- `Drawer docked` is part of the page: it sits in the flow, stuck to the foot of the scrolling main area, as wide as the content (never over a sidebar), opaque, and the page scrolls clear of it with no spacer.
- `Columns`: sized columns give way together (down to 14rem or `minWidth`) before the row scrolls.
- `Card`: goes bare only when it holds exactly one tile (a card holding several is a list or a sheet and keeps its surface); a tile leaving is reported, so the card comes back. `Drawer`, `Modal` and `CommentThread` cards are `tint="none"` and never take a content colour. Tests added (182 pass).
- Apps: no `style={...}` left in Phiegg, phi-kit, Phione, Phipad, Phidao or Phidata; everything is props.
- Phiegg: the show page fits (the player sheet no longer covers the sidebar or shows the page through it); every show card and hero wears its lead look's render and colour (`showLead`), so the Style 05 show is gold.
- Phiegg: Create is a page of things to make (show, channel, pool, ride, flow, club) with open quests and coming events; Search shows popular searches, worlds, rides, shows and stories before a query; Recent offers places to start.
- Phiegg: `scripts/fleet.mjs`, `data/fleet.json` and `public/cars` removed.

### Added (round 29: seven worlds, rides, jewellery, public home, singular API names)
- `Card` bare: content that reports `useCardTint(undefined, undefined, true)` (a `Tile`) makes the card around it drop its own surface and deck (`data-surface="none"`), so a tile is never wrapped in a second background. The first colour reported wins. Tests added.
- `FacetFilters`: every facet is an accordion (the header shows the current choice and a chevron, `aria-expanded`, the first three open, `openGroups`); options are equal-width cells in a grid, 3, 2 or 1 a row by the longest label (`facetCols`), or `Facet.cols`. Options are `role="checkbox"` / `"radio"`. Test added.
- `StatusRail` item `color`: each status ring and card takes its own colour.
- `TabList` never shrinks inside a flex column (it collapsed to 5 px in the feed).
- Phiora: canonical singular routes (`/item/theme`, `/item/<id>/theme`, `/app/<key>`, `/auth/session`, `/auth/session/revoke`, `/auth/demo-user`); the plural forms still work (`singular(path)`). Test added (46 pass). Clients use the singular names.
- Phiegg: seven new worlds and houses (`scripts/houses-r29.mjs`): Lora Land, Chatty Valley, Bozo City, Skim City, Loon City, Wand City and Once City (Maison Once, jewellery and watches), with cities, place kinds (robo cab rank, robo van depot, jetski slip, saucer pad, jeweller), founders, clubs, chats, quests and recurring events.
- Phiegg: storylines retold after James Joyce in our own words with every name changed (series `after`): One Day in Lora Land (after Ulysses), The Sisters of Echo Falls, The Bazaar at Bozo City, Eveline at Dock Nine, Clay in Loon City, A Portrait of the Wand-Maker as a Young Man, A Little Cloud, The Dead of Once City.
- Phiegg: Rides (`scripts/rides.mjs`, `data/ride.json`, replaces `fleet.json`): 128 rides, flying cars, robo cabs, robo vans, jetskis, flying saucers and fun rides, for sale, for fun (tickets) or for hire; a Rides page in the Menu; rides on world pages, in search, the asset sheet and profiles.
- Phiegg: Jewellery and watches (`scripts/jewels.mjs`, `data/jewel.json`): 32 one-off pieces from Once City.
- Phiegg: a public home page (`welcome`, `data/landing.json`) for visitors before onboarding.
- Phiegg: Style 05, The Gilded Zip: nine renders (`scripts/looks-import.py`) in the feed, reels, lobby and DM chats (look attachments) and a show (`scripts/style05.mjs`).
- Phiegg: profile and host cards take the colour of the world, profile or host (`lib/colour.ts`); post and city cards are bare tiles.
- Repo: `npm run dev:all`, `build:all` (`apps/build-all.mjs`), `serve:all`, `api`, `data:phiegg`.

### Added (round 28: sky worlds, page themes, card colours, stage slider)
- `PuiProvider setPaletteOverride(palette | null, level?)` and `paletteOverride`: a palette that wins over the saved one until cleared, never persisted (a page that wears what it shows). `paletteFromHex(hex, id, accent2?)` builds a whole palette from one colour; `hslToHex`. Tests added.
- `Card tint`, `tintPrimary`, `tintStrength`: the card (and its deck) is mixed from one colour, head to nothing. Without `tint` a card takes the colour its content reports with `useCardTint(hex, strength)`; `tint="none"` keeps the theme; an explicit tint stops the report. Tests added.
- `Card deckDirection` takes `right`, `left` and `both` as well as `up` and `down`; the copies are a shade of the card's colour masked to the strip they peek from.
- `Sections reorderable` (up and down arrows on the right of every header), `storageKey` (the reader's order, folded and closed sections kept on the device, with a reset), `size="lg"` and `variant="plain"` for page sections, `hint`. Test added.
- `StageSlider` (layout): the centre slide and 1 to 3 levels a side, each `sideScale` (half) of the one in front with `overlap` (half) of it tucked under, arrows on the sides, keyboard steps, a progress bar and position, `footer` for actions. Tests added.
- `Swatch` (display): one colour exactly, ringed by the theme border. Test added.
- `FilterLayout mode="drawer"` (default): the filters are a drawer from the right; `mode="aside"` keeps the third-sidebar layout. `FacetFilters` sorts are wrapping chips like the facets.
- `Table`: no fills and no rules; rows are a shade fading to nothing in opposing directions, the header the deepest shade.
- `ProgressBar`: one colour, the track is a faint shade of the meter.
- Palette cards (`--phi-gradient-card*`) fade from the card colour to transparent, so cards merge into the page.
- Phiora `PUT /items/<id>/theme` keeps up to three theme colours. Test added (45 pass).
- Phiegg: the sky worlds Wondrous (Wondrous Motor Couture, Skylane Social, Hover House) and Verbum (Verbum Atelier, Inkwell Club, Syntax Society), the Royal House of Naim in Naimia, 64 flying cars (`scripts/fleet.mjs`, `data/fleet.json`, a sheet drawn by `scripts/world-images.py`), clubs and cars on world pages, cars in the asset sheet and search.
- Phiegg: `scripts/world-images.py` gives every world its own scene (flying cars and portrait billboards in the sky worlds, letter towers in Verbum); `scripts/recolour-renders.py` recolours two flagship dresses into ten colours so no store look is a bare swatch.
- Phiegg: one look in three (and every round-28 look) ships with designer themes; opening it, a profile PFT or a car dresses the page (`lib/pageTheme.ts`, stacked so closing a sheet returns to the page under it).
- Phiegg: Feeds, Reels and Shows dropdowns in the Home sidebar and feed tabs; plain labels; page sections on Pool and World pages and in the sheets; events can recur (`recurring`, the Naimian Horse Show every summer).

### Added (rounds 26 and 27: responsive cards, productions, PFT / EGG / SUM, beta portraits, studio)
- `ItemCard` (display): one card for a record in a list. Wide it is one row (media · title, meta and body · aside · actions); narrow the header (media and title) and the body take two rows (`stackBelow` sm / md / lg / always / never, a container query); `layout="vertical"` is a product card, and any card under 10rem becomes one. `aside` stays in the header (a price), `actions` get their own row when stacked. Tests added.
- `Rows minItemWidth`: the grid measures its own width and fits as many cards as stay that wide, up to `cols` (`fitCols`). Test added.
- `Card` with `onClick` is a control: pointer, focusable, Enter and Space activate it. `Text numeric` (tabular figures) and `Text truncate`. Apps no longer need style props for these.
- `Table` / `DataTable`: one theme radius; the header is rounded at the top only, the table at the bottom.
- `Avatar sprite` and `SpriteImage` (media): images cut from sprite sheets (`spriteVars`), so hundreds of portraits ship as a few files. Test added.
- Phiegg beta portraits: the Bold Pups Space Club and Chic & Famous art (711 portraits, `apps/phiegg/art/clubs`, moved out of `public/` so builds stay small) become 12 sheets (`npm run data:portraits` → `public/portraits`) and are dealt to every profile, agent and host (`lib/portraits.ts`). Each is a profile PFT in the Bold Pups pool, held by the person who wears it.
- Phiegg productions (`scripts/productions.mjs`): every title has a director, writers, a producer, 16 to 64 roles (character, part, arc, traits, actionable behaviours from the role type of the host they play through, wardrobe looks) and themes; series run 7 seasons of 5 to 13 episodes, each with a synopsis, crew, guests and a look to shop. The Watch sheet (bottom sheet: seasons and episodes · episode · cast and roles · chat) replaces the series drawer.
- Phiegg item types (`scripts/assets.mjs`): EGG items per host (gate pass, earnings share, land), a SUM machine per pool, profile PFTs; pools list all of them with type filters; the asset sheet buys with EGG or deposits into a SUM (`lib/holdings.ts`).
- Phiegg item specs: gender, occasion, neckline, sleeve, length, waist, closure, embellishment, craft (hours, technique, artisans, atelier), inspiration, care, sustainability, price; where it appears (titles, shows, casts); Price and Stats as sortable tables.
- Phiegg profiles: Likes, Items (profile PFT, looks, EGG of their hosts), Hosts and Credits (every role in every title).
- Phiegg Studio: scenarios (runway night, pop-up, watch party, resale loop, fan club, profile drop) that link your PFT, EGG, SUM, host, title and customer agent, a persona (voice, audience), an editable greeting with a preview, projected value, and saved flows to run with the agent (`lib/flows.ts`, `/state/flows`).
- Data check covers EGG, SUM, profile PFTs, production roles and episodes: 37,309 items, 230,244 links, 0 dangling.

### Added (round 25: designer themes, activity on Phiora, thread shards, search as a list)
- Phiora: `POST /activity` (batches of up to 100 validated events; the server-owned `activity` document keeps the newest 1,000), `GET /activity?ref=`, `GET /items/themes` and `PUT /items/<id>/theme` (only the look's designer, `specs.provenance.designerId`, or `PHI_DESIGNERS`; guests get 401). Shared documents live in a new `globals` store (JSON files or a SQLite table). 3 tests added (45 pass).
- Phiegg: `lib/activity.ts` sends events to Phiora in 1.5 s batches when `VITE_PHI_API` is set; `lib/themes.ts` reads designer themes and saves them. The item sheet's Specs row shows the designer's kinds, mood and name; the house's designer gets an editor (vocabulary from `site.json themeKinds` plus their own kinds). Offline it saves on the device.
- Comment threads load per post: `scripts/threads.mjs` writes 16 shards (`src/data/threads/NN.json`, about 230 KB each) and `useThreadFor(postId, poseId)` loads only the one it needs.
- Search page is a `ListView`: kind is a filter (clubs, worlds, people, agents, shows, hosts), best match or A to Z, a sortable table in list mode.
- Agent greetings address whoever is signed in.

### Added (round 24: dress colours, item specs, activity, the play sheet)
- `Drawer docked`: a bottom sheet that is part of the page (no backdrop, no focus trap, the page stays live). It folds to its header (`folded`, `onFoldedChange`, fold arrow and handle) and takes `header` content in place of the title, for a player's controls. Test added.
- `CommentThread`: the thread sits on its own card with a cascade above it (`depth`, default 2; `maxHeight` scrolls inside the card), and every reply level is a shade of the theme colour fading to transparent, left to right, deeper with each level. Test added.
- Phiegg play page: the controls are the header of a docked bottom sheet; its columns (every look, the look and its PFT, poses, chat with the host) drive the page and expand or close.
- Phiegg items: the colour of every look is measured from its render (`scripts/item-colors.py` → `itemColors.json`, `scripts/items.mjs`); names that said another colour are renamed; cards pick a render of their colour and paint their scene with the render's measured colour, so the dress and the background match. Runway looks link to the PFT they walk.
- Phiegg specs: every look has `specs` (colour with palette and designer colour, theme kinds pending from designers, category, silhouette, fabric, finish, sizes, season, collection, renders, provenance, supply, utility, tags, physical twin), shown in the item sheet.
- Phiegg activity: `lib/activity.ts` records every action (views, angles, cart, offers, buys, swaps, lots, quests, coins, stakes, follows, RSVPs, likes, saves, comments, chats); every look has a ledger; the item sheet and Recent show both, sortable.
- `npm run data` runs the whole Phiegg data pipeline in order.

### Added (round 23: filters on every grid, sortable stats, 128 records, deep threads)
- `CommentThread` (display): nested replies as a tree on a theme-coloured rail, each level indented by a token, replies fold and unfold, depth capped (default 6). Phiegg's post viewer uses it.
- `DataTable`: right-aligned cells never wrap. Every heading with a `sortValue` sorts ascending, then descending.
- `ViewToolbar`: the 1 · 2 · 3 per-view numbers only show in tile (slider) mode and hide when a page brings its own slider.
- `DepthMedia`: captions clamp the title to two lines and the subtitle to one, so long titles never run into the badges.
- Phiegg `ListView` everywhere: Pools, Quests, Sponsored, Coins, Watch, Worlds, City places, Shop looks and lots, Shows, Events and drops, Agents, Club pieces, worlds, shots and places, a World's cities, Recent, Profile posts, reels and clubs, and a pool's Stats. Each has the view icons, Filter & sort (facets read from the rows) and, in list mode, a table sortable by its headings. Second tab rows moved into filters or a select (club switcher, league rounds, city districts, pool stat groups, show mode).
- Data: procedural fictional houses so clubs, worlds, hosts, shows, stores, coins and agents reach 128 (`scripts/brands.mjs`, ids `c_gx_` / `ag_h_`); `scripts/threads.mjs` gives every post, shot and pose a thread 3 to 6 reply levels deep, plus `threadCounts.json` for the counts on cards.

### Changed (round 23)
- Em dashes removed from all visible copy and data: titles take a colon, sentences a comma, empty values a middle dot (`·`). The data scripts write the same way.
- Run order for the Phiegg data: brands → deepen-data → hosts-casts → celebs → pools → threads → check-relations (12,776 items, 94,012 links, 0 dangling).

### Added (round 22)
- `Sections` (layout): the vertical twin of `Columns` — rows (top · centre · bottom) that expand over the column, fold to their header or close into a reopen strip, controls on the right of each header. Tested.
- Phiegg ItemSheet: a PFT opens as a bottom sheet with Columns — variants & more (angles, sheer/opaque, the packs and drops it is in, more looks from its pool) · the item as content (look · buy/offer/swap · item stats, each a Section) · chat with the store's agent. Replaces the old look drawer.
- One tab style everywhere: every remaining button row (Appearance, header menus, view switch, slides, nest kinds, league rounds, Phipad routes, Shows slider/grid, sign-in roles, series genres, phi-kit Settings) is a `TabList`. View "Tile" is a slider row of large cards.
- Data (all fictional, scripts/brands.mjs + scripts/celebs.mjs): Calder Brothers Pictures (studio), The Venus Girls (reality family), Halo Models (model house), Supernova Records (singers, super fashion music), Velvet Lip Co. (beauty); 128 films from the 1940s–1960s across 12 genres with year, studio, box office and awards; 28 new dramas plus four house pilots grown into full seasons; a golden-age roster; star statements and Venus Girls gossip shots; fashion casts with cast names; concerts; star / singer / model / reality stats on profiles; four beauty lines of 64 shades as pools.

### Changed (round 21)
- Parent card gradient (`--phi-gradient-parent` / `--phi-gradient-card`): clear at the top, then a shade of the theme colour over the rest, deepest at the foot.
- Phiegg Menu panel: Shop moved from the top section to the foot, beside Join (site.json items take `inline: true` to share the previous item's row).
- `Card depth`: the deck is now real copies of the card's own surface (gradient, wash, border, theme radius) stacked behind it — each a level narrower, a step further out and a shade deeper — instead of flat box-shadow lines, so card decks match the image decks. The card sits on a solid ground so copies only show where they peek out. `deckDirection` still hangs them below.
- `Card variant="flat"` keeps the theme radius (it used to square the corners).
- `StatusRail`: each capsule cascades upward with two copies above it, matching the card decks.

### Added (round 20 — pools, moving prices, utility PFTs)
- `TabList`: one row that never wraps; scrolls sideways with soft edges; the active pill slides between tabs; labels take icons and counts. `Tabs` rows no longer wrap either. Buttons never break onto two lines.
- Theme radius: four presets, Small · Medium · Large · Pill (egg) (`RADIUS_PRESETS`, `RadiusPicker`, `data-radius` on the root). Every `--phi-radius-*` token follows it; with Pill, controls (`--phi-control-radius`, `--phi-chip-radius`) go fully round. Hard-coded radii across the kit and apps are now tokens; Phiegg's own radius scale is gone. Looks carry a gradient level and a radius preset (Apple soft/medium, SpaceX flat/small, Organic vivid/pill).
- Motion tokens: `--phi-ease`, `--phi-ease-spring`, `--phi-duration-*`, `--phi-motion-scale` (0 under reduced motion); cards, tabs, drawers, columns and buttons use them.
- `DepthMedia`: the slanted look card gets a fanned cascade behind it (`midDeck`); `deckDirection="down"` hangs the deck below. `Card` takes `deckDirection` too; deck layers are tinted by the theme primary so they show on gradient surfaces; decked cards no longer overflow their cell.
- `StatusRail` (display): the stories / status slider — capsules on the theme gradient holding thumbnail and caption; live rings spin, seen rings go quiet.
- `Rows` (layout): only full rows — an optional feature row, complete rows, leftovers in a slider row; `slider` for a single scrolling row.
- `--phi-control-shade`, `--phi-gradient-control-fade(-radial)`: menu items rest on a light shade; hover / active fade the theme colours into each other.
- phi-kit `pricing.ts`: lots (solo, pack 4–7, drop up to 64 units), a 64-value shelf per lot, unit prices picked by index each 30 s and glided, transitory totals, sold counters; `quoteSwap` for fungible swaps with a weekly withdraw limit, fair band and pool reserve. Tested (`apps/phi-kit/src/pricing.test.ts`).

### Added
- `DepthMedia` (media): three nested image layers in decreasing size — parent scene, a framed image inside it, a round photo inside that — with pointer parallax (`tilt`), an optional perspective floor grid (`grid`) and a game-style hover (`game`: lift, glow edge, shine sweep, spinning ring). The frame reads `--phi-gradient-media`.
- `ChatBubble` (display): one chat message, `side="me" | "them"`, avatar/name/time; fills from `--phi-bubble-me` / `--phi-bubble-them` so an app's gradient choice reaches its chats.
- `Drawer` `expandable` (+ `expanded`, `onExpandedChange`, `expandLabel`, `collapseLabel`): a Maximize/Minimize button grows the drawer to the window and back.
- Drawer and Modal surfaces read `--phi-gradient-drawer` over their opaque ground.
- The full gradient system (`providers/palette.ts`): 16 seeded palettes (phiber v2 + Phiegg: seed, light seed, accent, accent 2) and four gradient levels (flat · soft · vivid · aurora) derive every surface colour and every gradient token by nesting depth — page, parent, child, grandchild — plus chrome, overlays, controls and the accent rim. PuiProvider takes `defaultPalette` / `defaultGradientLevel` and exposes `paletteId`, `setPaletteId`, `gradientLevel`, `setGradientLevel`, `palettes`; nothing is written unless an app opts in. Cards in cards pick up the child / grandchild levels; `[data-gradient-grandchild]` and `[data-gradient-text]` markers.
- `PalettePicker` and `GradientLevelPicker` (forms).
- Decks: `Card depth={n}` and `DepthMedia deck={n}` stack the card behind itself, each level narrower and higher, fanning out on hover; `Avatar deck` stacks smaller circles behind the profile icon.
- `WorldScene` (media): a seeded SVG world backdrop; its sun is cut like the profile circles.
- `Cascade` (display): any item card repeated behind itself, decreasing, fanning on hover.
- Theme-controlled control surfaces: `--phi-control-bg`, `-hover`, `-active`, `-border`, `-text` and the palette's `--phi-gradient-control-soft`; ghost, outline and icon buttons, Tabs, TabList and interactive minimal Tags rest on them; active pills wear the primary/control gradient.
- `DepthMedia footerIcon` (bottom-left of the footer) and a footer shade strongest at the bottom, fading upward (`--pui-depth-scrim`).
- `Drawer position="bottom"` (bottom sheet) and `Columns` (layout): columns that go back, expand over the row, close into a reopen strip.
- `Avatar` default profile icon: without a photo the disc is cut horizontally (one shade on the top semicircle) and the bottom semicircle is cut in half again (two shades), inside an outer ring of a fourth shade; six shade sets picked by `seed`, all mixed from the theme/palette accents. `icon` shows a glyph instead of initials; `shades={false}` keeps the flat circle; new `xs` size.
- `RelationList` (display): a record's links in both directions, grouped by relation, each item opening its record.
- Apple theme style: clean surfaces (flat grounds, hairline borders, no gradients or shadows unless an app opts in).

## [0.4.0] - 2026-09-26

### Breaking
- Removed the legacy `commerce` component suite and `mockCommerceApi`. Use the new `shop` suite (`@puikit/shop`), `shopService`, and `mockShopApi` instead.
- Renamed/lowercased several component entry points (`display/card`, `display/list`, `navigation/sidebar`).

### Added
- 16-brand theming engine: site archetypes, per-user persisted preferences, mode-aware brand colors (`primaryDark`/`primaryHoverDark`), and gradient-by-default ambient surface treatments (`--phi-gradient-parent/child/accent/rail/card-wash`).
- New components: `PreferencesModal`, `Box`, `ResizablePanel`, `ProgressSteps`, `FileBrowser`/`AssetBrowser`, `Carousel`, `Collection`, rebuilt `Sidebar` (brand/nav variants), compound `Card` and `List` suites, brand marks, and a `social` module.
- New stores (`auth`, `cart`, `catalog`, `wishlist`, `order`, `payment`, `address`, `alert`, `recent`, `social`) wired to `shopService`.
- Overlay hooks `useDismiss` and `usePortalTarget`.
- Property-based test platform (fast-check): barrel integrity, single-base `<div>` enforcement, theming/gradient/archetype/preference property suites, and gradient snapshots.

### Changed
- Package build now excludes test files and stories from `dist`, keeping the published tarball to runtime code only.

## [0.3.5] - 2026-08-25

### Added
- Formalized Chapter 14 3D visual specifications in `specs/` (VolSurface 3D Manifold, Kuramoto Phase Sphere, Dual Cognition Inspector, and Strategy AST Tree Viewer).
- Enhanced Three.js WebGL shaders for geometric volatility curvature rendering.
- Interactive DocsPortal showcasing cognitive visual components.

### Changed
- Bumped version to `0.3.5`.
- Standardized git author to `bdizha <bdizha@gmail.com>`.

## [0.3.4] - 2026-08-25
- Added faint smooth gradients, rich Markdown AST parser, and EdX Paragon design token alignments.
