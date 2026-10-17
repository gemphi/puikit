# Phiegg (`apps/phiegg`, port 3101)

Virtual worlds run by clubs: feed, explore, worlds, SS26 shows, series & films (Watch), hosts and nests, agents, quests/coins/pools,
the League (standings + knockout rounds), events, Phipad and Lora's Spark shop (look viewer, cart, offers, buy from the wallet).
Built from the Phiegg prototype port (formerly the `phiegg-v2` draft). The previous social app is `apps/phiegg-v1`; both share the `owned` and `cartOffers` state documents.

```bash
cd apps/phiegg && npm install && npm run dev   # http://localhost:3101
```

- Markup: puijs only (`Box`, `Stack`, `Grid`/`Col`, `Button`, `Input`, …). No raw `div`/`span`/`button` in the app.
- Content: `src/data/*.json` (copy in `site.json`, every UI string goes through `t()`).
- Depth: `npm run data:deepen` fills every level — districts and places per city (`places.json`), a store per club (`stores.json`),
  12 pieces per club, messages in every nest, moments, ≥3 shots per user, comment threads on every post, episode synopses.
  Seeded and idempotent (generated ids start with `g_`); hand-written records are never touched.
- State: `src/state/phieggStore.ts`. Likes/saves/follows/RSVPs and agent chats persist through `@phi-kit/api`
  (Phiora `/state/flags`, `/state/chats` when `VITE_PHI_API` is set, localStorage otherwise).
- Agent chat: `POST {VITE_PHI_API}/chat` (Phiora model proxy); `src/lib/agent.ts` is the offline fallback.
- Against the real API: `cd apps/phiora-server && npm start`, then run with `VITE_PHI_API=http://localhost:4300`. Purchases, offers and the wallet are then settled by the server.
- Bundle: `places.json` and `threads.json` load on demand (`src/lib/lazy.ts`: `usePlaces()`, `useThreads()`), and lucide icons are named imports
  (add new site.json icon names to the map in `components/Shell/Sidebar.tsx`).
- Heavy data streams in after mount: `stores.json`, `shows.json` and `sales.json` are their own lazy chunks (`src/lib/heavy.ts loadHeavy()`),
  cut out of the main chunk (13.8 MB → 7.8 MB, gzip 2.1 MB → 1.2 MB). Their database ids are mapped at build time — `npm run data:ids`
  (`scripts/heavy-ids.mjs`) writes `src/data/heavyIds.json`, merged into `ID_MAP`, so references resolve before the rows arrive; rerun it whenever
  those three files change. `main.tsx` mounts at once, then `loadHeavy()` → `bootLive()` → `dataRev` bump re-renders open pages; modules with
  their own caches over the data register with `onDataRefresh` (`lib/depth.ts` look pools, `lib/relations.ts` index).

## Themes, header, rich screens

- **Themes**: Apple (default), SpaceX, Organic — header palette button or You → Appearance. A theme = puijs style + brand (`@phi-kit/looks`);
  Apple is the default for every Phi app (`mountWith`). Mode, accent, radius, gradient, sidebar/content shade, surface opacity and motion persist (`/state/appearance`).
- **Header** (`components/Shell/Header.tsx`, `HeaderMenus.tsx`): brand, rotating tagline, back + crumbs, search (`/`, Ctrl/⌘K, arrows, Enter, Esc, "see all"),
  wallet, cart, Phipad, mode, theme, account menu (profile, appearance, sign in/out). Below `site.compactBelow` (1100px) it folds and the sidebar panel floats;
  below 720px the rail becomes bottom tabs (`site.mobileTabs`) and search is an icon.
- **Sign-in** (`components/Shell/SignIn.tsx`): the `site.signin` flow — provider → verify → role → say hi in your host's lobby (`/state/onboarding`).
- **Rich screens**: Search page (all matches), Recent (visited places), Messages (every thread in `messages.json`, `/state/dms`), voice rooms (join, mute, hand, leave),
  quests (enter/leave), pools (stake USD, yield at APR, unstake), coins (buy/sell club coins) — money through the phi-kit wallet (`lib/economy.ts`).

## Items: colour, specs, activity

- **Colour comes from the render.** `npm run data` starts with `python3 scripts/item-colors.py`, which measures the garment colour of every
  render in `public/items/**` (mannequin grey, shadow and highlights ignored; k-means, largest cluster) into `src/data/itemColors.json`.
  `scripts/items.mjs` then gives every rendered look that colour (`hex` is a display tint of it, `specs.colour.measured` the raw value,
  `palette` the top three). A look named for a colour its render is not ("Amber Sailor Top" on a crimson dress) is renamed to the
  render's colour; a look without a render borrows the closest one, or stays a swatch when none is close (black, white, purple, brown).
  The colour it was first named for is kept as `specs.colour.designer`.
- **Backgrounds follow the dress.** `Tile` picks its middle render to be the card's colour and takes that render's measured colour for its
  scene (`lib/depth.ts`: `renderFor`, `renderColour`), so the dress and the background always match; `LookImage`, the item sheet and posts use the look's `hex`.
  Runway looks link to the store look they walk (`shows.json looks[].lookId`) and take its name and colour.
- **Specs.** Every look carries `specs` (types: `LookSpecs`): colour, theme (thematic kinds, `source: 'pending'` until the designers supply them),
  category, silhouette, fabric, finish, garments, sizes and fits, season and collection, renders, provenance (store, club, pool, world, designer, mint date),
  supply, utility, tags and the physical twin. The item sheet shows them all (Specs row).
- **Designer themes.** `lib/themes.ts`: the house's designer sets thematic kinds and a mood in the item sheet (Phiora `PUT /items/<id>/theme`; offline, on the device). Everyone reads them (`GET /items/themes`).
- **Activity.** Every look has a ledger in `sales.json` (mint, list, offers, sales, transfers; `items.mjs` adds one where missing, ids `ia_`).
  Every action a person takes is recorded by `src/lib/activity.ts` (`record(kind, ref, extra)`, `/state/activity`): views, angles, cart, offers,
  buys, checkouts, swaps, lot buys, quests, coins, stakes, follows, RSVPs, likes, saves, comments, chats and posts opened; with Phiora they are sent in batches (`POST /activity`). The item sheet shows
  the item's ledger and your events (Activity row, sortable); Recent lists all of yours with Filter & sort.

## Lists, sheets and the play page

- **Every list** is `ListView` (`components/Phiegg/Views.tsx`): view icons (tile = slider with 1 · 2 · 3 per view, list, grid), Filter & sort
  built from the rows (`facets`, `sorts`), a sortable `DataTable` in list mode (`table`), `onRow`, and `slider` for a page's own tile view.
- **Bottom sheets** carry the traffic: the item sheet (variants · item · chat), `CollectionSheet` (drops, clubs, events: filters · grid · layout and chat),
  and the play page's docked sheet. All use `Drawer position="bottom"` with `Columns` (each column expands or closes) and expand to the window.
- **Play page** (`pages/phiegg/ShowPage.tsx`): the stage shows the look walking now; the player is a docked bottom sheet
  (`Drawer docked`) whose header is the controls (previous · play / pause · next · progress · open the PFT) and whose columns are every look,
  the look and its PFT (open, the drop), the poses and a chat with the host. The sheet folds to its header and unfolds.
- **Comments**: `CommentThread` from puijs, 3 to 6 reply levels per thread (`scripts/threads.mjs`), counts on cards from `threadCounts.json`; threads load per post from 16 shards (`src/data/threads/`, `useThreadFor`).

## Data pipeline

`npm run data` runs, in order: `item-colors.py` → `brands` → `deepen-data` → `hosts-casts` → `celebs` → `items` → `pools` → `threads` → `check-relations`.
Every step is seeded and idempotent. Copy uses no em dashes: titles take a colon, sentences a comma, empty values a middle dot.

## Productions, item types, portraits, studio

- **Productions**: `scripts/productions.mjs` writes `src/data/productions/NN.json` (16 shards, `lib/productions.ts` `useProduction(id)`) and
  `roleIndex.json` (person → credits, `useCredits`). The Watch sheet shows seasons, episodes, the cast and their roles, and the look to shop.
- **Item types**: PFT (looks and profile PFTs), EGG (gate pass, earnings share, land per host) and SUM (one machine per pool) in `assets.json`
  (`scripts/assets.mjs`); `itemTypeOf(id)`; pools list all three (`PoolItems`); EGG, SUM and profile PFTs open in the asset sheet.
  Storyline → roles → people → hosts (their PFT roles) → EGG; title → club pool → looks worn on screen (PFT) and the SUM compounding the club's EGG.
- **Beta portraits**: put PNGs in `art/clubs/<SET>/` and run `npm run data:portraits` (12 sprite sheets in `public/portraits`, colours in `portraits.json`).
  Every profile, agent and host gets one (`lib/portraits.ts`); `npm run data` then makes them profile PFTs.
- **Studio** (`pages/phiegg/StudioPage.tsx`, scenarios in `src/data/scenarios.json`): link your items to a scenario's steps, choose the voice and
  audience, edit the greeting, see the projected value, save the flow and run it with the customer agent.
- **Data pipeline** now: item-colors.py → brands → deepen-data → hosts-casts → celebs → productions → items → pools → assets → threads → check-relations.

## Round 28: sky worlds, flying cars, page themes

- `npm run data` now runs `recolour-renders.py` first (ten colours the flagship never rendered, two dresses each, every angle, `public/items/gen`), `fleet.mjs` after `items.mjs` (64 flying cars, `src/data/fleet.json`) and `world-images.py` before the relation check (a scene per world in `public/worlds/gen`, the fleet sheet `public/cars/sheet-00.webp`). `npm run data:worlds` and `npm run data:renders` run those steps alone.
- New houses in `scripts/brands.mjs`: Wondrous Motor Couture (owns Wondrous), Skylane Social and Hover House (live in it, `inWorld`), Verbum Atelier (owns Verbum), Inkwell Club and Syntax Society, and the Royal House of Naim in Naimia. A house can add cities to another world (`inWorld`), name its own place kinds (`placeKinds`), bring lobby chat (`chat`), a character to talk to (`agent`), full stories for its titles and recurring events (`[kind, title, startsAt, recurring]`). They come on top of the 128, so procedural ids never move.
- Stories (all fictional): The Deer and the Princess, The Royal Bride (Naim); Mara: Lights of the Lot, How to Wed a Fortune (Calder Brothers).
- Page themes: `lib/pageTheme.ts usePageTheme(hex, accent2, level)` wraps puijs `setPaletteOverride`; the item sheet uses a look's designer theme colours, the asset sheet a profile PFT's background and outfit or a car's theme, the profile page the PFT its person holds, the opened post its slide colour.
- Card colours: `Tile` and `LookImage` report their colour (`useCardTint`), so every card around them is that colour; `postTile(post, slide)` gives the same tile everywhere a post shows.

## Round 29: seven worlds, rides, jewellery, public home

- Houses in `scripts/houses-r29.mjs` (pushed in `brands.mjs` on top of the 128): Lora Land, Chatty Valley, Bozo City, Skim City, Loon City, Wand City and Once City. Series take `after` (the work they are retold after: Ulysses, Dubliners stories, A Portrait of the Artist), in our own words with every name changed and no quotes.
- `scripts/rides.mjs` writes `src/data/ride.json` (128 rides: car, cab, van, jetski, saucer, fun; mode sale, fun or hire) and `scripts/jewels.mjs` writes `src/data/jewel.json` (32 pieces). `world-images.py` draws the ride sheets (`public/rides`), the jewel sheet (`public/jewels`) and the new world scenes. `fleet.json` and `public/cars` are no longer used and can be deleted.
- Pages: `rides` (Menu, For sale / For fun / For hire), `welcome` (public home from `data/landing.json`, shown before onboarding). Open any tab with `#<tab>` in the URL.
- Style 05: put renders in `art/looks/` and run `npm run data:looks` (`looks-import.py` → item-colors → items → `style05.mjs`): looks, a pool, feed shots, reels, lobby and DM messages with `lookId`, and a show.
- Colours: `lib/colour.ts personColour(id)` and `entityColour(id)`; avatars report them to their card, tiles make the card bare.
- `npm run data`: looks-import.py → recolour-renders.py → item-colors.py → brands → deepen-data → hosts-casts → celebs → productions → items → rides → jewels → style05 → pools → assets → threads → world-images.py → check-relations (41,112 items, 254,583 links, 0 dangling).

## Round 30: fill and finish

- No inline styles anywhere in the app: clickable rows and avatars are `Pressable`, framed media are `Frame`, sizes and scrolling are style props.
- Show cards and the show hero use `showLead(show)` (the first runway look with a render) for their picture and colour.
- `pages/phiegg/CreatePage.tsx` reads `site.json createKinds`; the Search page's empty state reads `site.json searchPopular` and `landing.json featured`.

