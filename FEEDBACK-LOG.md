# Phlick / puikit — feedback log

Every issue raised, in order, with where the fix lives and its status. All
"Done" items are verified by the browser suite (`scripts/ssr-smoke/drive-phlick.js`,
178 checks) and are in the latest artifact publish. If the page still shows an
old look, hard-refresh (Ctrl+F5) — the artifact viewer caches aggressively.

## 1 — Spotlight geometry + shops/lands + catalogues
- Middle view 1/2, sides 1/4 each — **Done** (`src/components/social/styles.module.scss`, measured 0.50/0.25)
- Slider takes the full stage minus the sidebar — **Done**
- Middle full height, sides half its height — **Superseded** by your later "square views" ask: all views are now squares, sides at exactly half the middle's edge
- Overlay buttons: opacity/lightness-only gradient, no color — **Done** (glass tokens; suite parses the computed stops and asserts greyscale)
- Add Lands to More, show content — **Done** (More tab + 64+ catalogue)
- Every menu section ≥64 items, tiers 64/128/256/512 — **Done** (seeded generator, tier by section name)
- Shops under Menu: 64 picks across high-end fashion, jewelry, watches, travel, leisure, tropicals, couture, hip-hop, sport — **Done** (badged tiles)

## 2 — "UI is not responsive and ugly"
- Rail auto-contracts below 1024px — **Done** (`SidebarProvider collapseBelow`)
- Comments take the whole screen on phones; pager hidden on touch widths — **Done**
- Suite drives 1440 / 900 / 420 viewports asserting no overflow — **Done**

## 3 — Post/reel views messed up
- Square views on the post page (frame trades 9/16 for 1/1) — **Done** (`PostStage shape="square"`, overlay too)
- Slider uses its full space — **Done**
- Arrows repositioned — **Done**, then refined per round 4 below

## 4 — Grids, arrows, quiet open, tucked slider
- Not 5 cards per row; Explore big images 2–3 per row — **Done** (Explore 3, Shops 3, sections 4, Live 4 — rows differentiated per page; verified by measuring rendered rows)
- Arrows always on the right with a gap from the ends, never inside the images — **Done** (both chevrons grouped in a column at the slider's right)
- Opening a post/reel must NOT open comments — **Done** (post page and overlay open quiet)
- Asking for comments shrinks the image to half; the thread slides into the other half — **Done**
- Side images cut off in half — never shown whole — only the active square on top — **Done** (neighbours tuck half under the active square, which rides on top with a shadow; paint order verified with elementFromPoint)

## 5 — Depth, floating panels, active controls
- Every list ≥64 entries — **Done**: feed 64, Explore 96, each topic tab 64+, Live 64 rooms, every creator grid 64, sections 64/128/256/512 — all seeded, all opening for real
- Sidebar margin top and bottom; same for the drawers — **Done** (rail, comments panel, overlay panel, bag drawer all float)
- Apple rounded corners from the default theme settings — **Done** (radius tokens, nothing hardcoded)
- User and Settings show a background when clicked/open — **Done** (avatar lit on your profile, cog lit while Preferences is open)

## 6 — "Still 5 per row / arrows inside"
- The build is correct (explore measures 3 per row, 96 tiles; arrows grouped right) — **the page you saw was cached.** Republished again; hard-refresh, or pick the newest version in the artifact's version history.

## Earlier rounds (before these six), all done unless noted
- Theme switch must repaint the whole app → fixed (the publish wrapper was hardcoding a black body; the library was clean)
- Pink→blue gradient on login + active sidebar entries, darker blue, hover reversed, no color leaking past edges, all matching from one brand token — done (`controlGradient` on the phlick brand)
- Comment form always full width; every comment has a Reply action, threading recursively — done
- Thread rules run from the parent avatar's midline at every depth; reply actions align right — done
- One comments surface reused everywhere (feed/post/overlay), sidebar-skinned, contracting the rail, pushing (or floating beside) the content, correct close icon — done
- Sidebar header: one block, no big conditional, pui components only — done
- Tabs on Explore; theme switcher + notifications on the header's right — done
- TikTok functionality: back/close navigation, prev/next chevrons, keyboard, working search, comment likes — done
- Two-part sidebar (Home/Chat/Menu head, More middle, user+Settings foot), text-only entries except Sign up/Create — done
- 3 post types reusing reel + card; photo reels carry 4–7 images — done
- Standing: **never `npm publish`** — respected throughout

## Phiegg round 24: colours, specs, activity, play sheet, threads
- Dress colours and backgrounds match; items associated with their colours — done (renders measured, `itemColors.json`, `items.mjs`, `Tile` picks a render of its colour)
- Thematic kinds on item specs, supplied by designers over time — done (`specs.theme`, pending until supplied)
- Enough spec fields on every item; every activity recorded — done (`specs`, `sales.json` ledger, `lib/activity.ts`)
- Play page controls at the bottom as the bottom sheet's header; the sheet drives the traffic with expandable columns — done (`Drawer docked`, `ShowPage`)
- Comment column has its own cascade; each reply level a shade fading to transparent left to right — done (`CommentThread`)
- Docs updated — done (CHANGELOG, COMPONENTS, apps/phiegg/README, this log, project notes)

## Phiegg round 25: next steps after 24
- Designers supply thematic kinds: done (item sheet editor for the house's designer; Phiora `PUT /items/<id>/theme`, designer-only, tested)
- Every activity recorded on the server: done (Phiora `POST /activity`, batched from the app; verified end to end against a running Phiora)
- Threads loaded per post instead of 3.7 MB at once: done (16 shards)
- Search with filters like every other list: done

## Phiegg rounds 26 and 27
- Cards: header and body in two rows when narrow; responsive grids; props only, no style overrides: done (`ItemCard`, `Rows minItemWidth`, `Card onClick`, `Text numeric / truncate`)
- More item attributes (occasion, gender, high-fashion fields), casts it appears in, price and stats tables: done
- Tables: header rounded at the top only, table rounded at the bottom: done
- Profiles show likes, items, hosts and credits in shows, films and series: done
- Productions with 16 to 64 roles, 7 seasons of 5 to 13 episodes, synopsis, director, actionable roles and themes: done
- Items as PFT (profile), EGG (host earnings, gate takings, land) and SUM (machines playing the EGG summation): done
- Persona scenarios, flows, greetings and customer agents: done (Studio)
- Beta portraits randomised across every host and profile: done (711 portraits, 12 sheets)

## Phiegg round 28
- Wondrous and Verbum worlds with flying cars and modern fashion clubs, reusing the club portrait art: done (6 houses and clubs, 64 cars, scenes with cars and portrait billboards)
- Missing images in worlds and content: done (every world its own scene, 67 drawn; every store look a render, 20 recoloured dresses for the colours the flagship never rendered)
- Post / shot card parent in the same colour as its content: done (`Card tint`, and cards take the colour their tile or look reports, `useCardTint`)
- Opening a PFT with a set theme dresses the whole page in it: done (`setPaletteOverride`, `paletteFromHex`; looks with designer themes, profile PFTs, flying cars)
- Royal and screen stories, all fictional: The Deer and the Princess (Naim, the Naimian Horse Show every summer, its riders), The Royal Bride, How to Wed a Fortune (British comedy), Mara: Lights of the Lot (a screen-siren drama told in phone calls); chats in the Naim Palace lobby and a princess to talk to: done
- Plain labels, no adjective phrases (Related, Like this, Themes, Value, Agent): done
- Sections that fold, close and move up or down with arrows on the right, kept per page (stats included): done (`Sections reorderable storageKey`)
- Feeds, Reels and Shows dropdowns in the Home sidebar; feed filter tabs: done
- Cascades below and to the right as well as above (`deckDirection` down / right / left / both): done
- Filters open as a drawer from the right on every grid (`FilterLayout mode="drawer"`): done
- Card gradients are a shade fading to nothing so cards merge into the page; menu items a shade at the foot to nothing at the top: done
- Tables without solid fills or rules: rows in opposing shades, header the deepest: done
- Tile view is a stage: side slides half the height, half tucked under the centre, arrows on the sides, one-colour progress: done (`StageSlider`)

## Phiegg round 29
- Fictional content and storylines after James Joyce for Lora Land, Chatty Valley, Bozo City, Skim City, Loon City, Wand City and Once City (jewellery and watches): done (`houses-r29.mjs`, series `after`)
- Robo cabs, robo vans, jetskis, flying saucers, rides for fun and for sale; Rides missing under Menu: done (`rides.mjs`, Rides page in the Menu)
- Public home page: done (`welcome`)
- Run all the linked apps and give the commands: done (all 15 build and run; `npm run dev:all`, `build:all`, `serve:all`, `api`)
- Connected content: done (rides and jewels in the relation index, Connected on every sheet; 0 dangling links)
- Singular names in the APIs, lists and items: done (singular routes with plural aliases, `ride.json` / `jewel.json` with `list`)
- No extra parent background on cities and content cards; profile cards in their world, profile or host colour; status cards in different colours: done (`Card` bare, `lib/colour.ts`, `StatusRail color`)
- Style 05 looks in the feeds, reels, chats and shows: done
- Filters: accordions, equal cells in a row, 1, 2 or 3 a row by the kind of filter, geometric not organic widths: done (`FacetFilters`)

## Phiegg round 30
- Fill up and complete: done. The show page overlap (player sheet over the sidebar, page showing through) is fixed in `Drawer docked`; the Style 05 show is gold (`showLead`); Create, Search and Recent are full pages instead of near-empty ones; the unused fleet files are gone; every inline style in the apps is now a puikit prop (`Pressable`, `Frame`, layout style props, Button, Image, ProgressBar, Text, Toast, Sticky).

## Phiegg round 31
- Use puikit everywhere, no raw elements in the apps: done for phi-kit (every data-driven app), Phipad, Phidao, Phidata and Phiegg (`Title`, `Text`, `Pressable`, `Table`, `Stack as`); only layout landmarks stay as `Box as`.

## Phiegg round 32
- Cards, grids and menu items as props, no card classes in the apps: done (`surface`, `autoFill`, `Pressable card` / `accent`).

## Where changes land
Reusable behavior and styling go in the puikit library (`src/` — social module,
sidebar, overlays, providers/brand tokens); the app (`apps/phlick/`) carries
only pages, routes, mocks, taxonomy, locales and composition. Edits are made
directly in `C:\Users\phiac\Workspace\gemphi\puikit`, verified by running the
real apps in Chromium, then the running app is published to the artifact.
