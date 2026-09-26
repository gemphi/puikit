# Phlick / puijs — feedback log

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

## Where changes land
Reusable behavior and styling go in the puijs library (`src/` — social module,
sidebar, overlays, providers/brand tokens); the app (`apps/phlick/`) carries
only pages, routes, mocks, taxonomy, locales and composition. Edits are made
directly in `C:\Users\phiac\Workspace\gemphi\puijs`, verified by running the
real apps in Chromium, then the running app is published to the artifact.
