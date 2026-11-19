# Phiegg — feedback log

Every request raised, in order, with where the work lives and its status. Statuses: **Done** (checked in the browser
or by a script), **Partly** (what is left is said), **Open** (not started), **Waiting** (needs something from you).
Kept up to date as work lands; nothing is dropped, only marked. Started 2026-11-18.

## 1 — Marks and the EGG sign
- Phiegg bird with the gem eye as the mark everywhere — **Done** (commit 160b1b9, deployed)
- Media icons: bird in the eye's diamond, in the original egg, in the 8's square — **Done** (`scripts/logo-media.py`, `public/logo/media/`)
- EGG token sign like the £, on the capital E, with options — **Waiting**: pick one of the five (`egg-sign-*`)

## 2 — The 16 cities
- Find the 16 cities on the Drive and set them up with their images — **Done** (`BOLDCITIES-LANDTYPES`; `scripts/media/bold-cities.json`, `scripts/bold-cities.py`)
- Each city is a world, not one world holding 16 cities ("worlds are the city; only the name differs") — **Done** (`w_<slug>`; a world's inner "cities" are labelled Zones)
- What a city has: zones and places (World → City → Zones → Places, and Lands) — **Done** (Fashion / Entertainment / Social Districts from BOLD-CITY-README, 8 places each)
- Each city needs posts and PFTs — **Done** (16 posts per city; a land EGG per zone; Bold Pups PFTs through the club)
- Images resized, never heavy files — **Done** (480 px for cards, 1,280 px only on the page)
- Show each world's mark like a flag — **Done** (EntityAvatar wears the world's mark)
- Real city names; the red one is Lava City — **Done** (12 named: Lava, Naim, Loon, Skim, Acro, Wand, Once, Roid, Warp, Bozo, Lace, Peep; Forest, Desert, Swamp, City Ruins keep their land names)
- Files standardised `world/<slug>/…`, our own names, never the Drive's file or folder names — **Done** (`world/<slug>/mark.webp`, `world/<slug>/view/<view>-<width>.webp`, `world/<slug>/post/character-<nn>-<k>.webp`)
- 64 characters per city with classic-film names; 6 hosts per city; posts located at the city with a pin; chat — **Done** (`scripts/media/city-life.json`, `scripts/city-life.py`: 1,024 residents, 96 hosts, 192 nests with chat, 256 posts, 1,536 comments; 0 dangling relations)
- Location pin on posts, shows and reels — **Partly**: posts and the post viewer show "📍 City · Zone"; shows and the reels feed do not yet
- Every world needs the full relation tree (hosts, nests, pools, clubs, shows, series, events, quests, casts, stories, posts, comments), at least 64 rows each — **Open**: audit done (existing worlds are mostly under 64 too); filling it 64 deep belongs in the API seed, paged (**Waiting**: your go on doing it there)
- Old relations, nests and hosts checked against the existing definitions and API — **Done** (relations come from `…Id` fields; `scripts/check-relations.mjs`)

## 3 — Pictures
- Replace the temporary mannequin look pictures — **Partly**: the five @POSTS renders that match a look are in (Indigo Tier back and side, Magenta Bow front and back, Style 05 Look 06 front); look files standardised to `look/<look-id>/<view>.webp` (`scripts/look-files.py`)
- Remove all the temporary images (the gold Style 05 and the Style 08 mannequins) — **Open**: removing them empties those looks; they need the finished poses first
- Mix the @POSTS images into Lora's Spark as well as the posts (loosely; we can rearrange) — **Open**: one pass once the showcase poses are down; every mannequin look gets a finished render, its mannequin views dropped
- Find the showcase images (with backgrounds) and city images from July–November 2025 on the Drive for endless posts and reels — **Partly**: the 16 finalised PR/CW showcase poses are downloaded (Downloads/SHOWCASE-2025) and each city's feed opens with one; the rest (RENDERS-WITH-BG ×7, BS-POSES-WITH-BG, the Bozo / Boldroid / Bold Chap / BC Building / Povo showcases, POSE-01…16 ×4, PR-RENDER) are being inventoried for download
- Remove all missing images — **Partly**: 328 dead look covers removed; the media.json entries are bucket keys served locally under other names (not missing)
- One consistent way to manage images — **Partly**: the file standard and the scripts above; a `check-media` script that fails on any missing picture is still to write
- Automatically centre an image that has to fit a card — **Done** (shared `Image`: centred in its box; renders are cropped to the figure when sized)
- Missing PFT images: Bold Pups (BPSC, finals), Epic Pods, BBPC, the final EPAC set — **Waiting**: thousands of files; download the Drive folders as zips, or connect Drive to the server
- Push media to AWS since local is limited — **Waiting**: your `aws sso login` and go-ahead to create the bucket and CloudFront (`deploy/aws/media`, `scripts/media/sync.sh`)

## 4 — Look and feel, everywhere
- No long, empty cards; centralise the look, not page by page — **Done** (shared Rows mosaic fills any layered card)
- Test in dark mode — **Done** for the world, zone, shop, post and item pages; **Open** for the rest (see §6)
- Every row with a card or info on the gradient; no thin rows; an icon on every section — **Partly**: page sections are gradient cards with icons and pinned headers; thin rows on hosts, casts and shows remain
- Tabs sticky under the header when scrolling — **Partly**: section headers and centred page tabs pin; check every page
- Overflowing tabs centred at half the width; menus and filters in the sidebar, filters in the drawer — **Partly**: shop store tabs moved to the sidebar; tabs centred where updated; filters already open in a drawer
- Hosts, casts and shows still on the old look — **Open**
- No "Store" in shop names (a house like Chanel would not call itself one) — **Done** (63 names in `stores.json`; `scripts/deepen-data.mjs` no longer adds it)
- Collapsed sections and columns show their actions as icons — **Open**

## 5 — Sidebar and navigation
- A world, shop, item, host or zone takes over the sidebar with its own menu; it switches back only on Back — **Done** for world, zone, shop and show (`AppShell record`, `site.json recordMenus`); **Open** for host and item
- Back always at the top — **Done** (the header's first cell, where the logo was)
- Each sidebar region on a gradient card; responsive — **Done** at desktop and pane sizes; **Open**: a real phone check
- The sidebar feels heavy when clicking — **Done** (the record menu is built once per open record)
- The sidebar receives new data (data driven) — **Done** (menus from `site.json`, lists from the record's data)
- Items open full screen like TikTok: big centred square, scroll things over it, a third of the next cards below, buttons at the bottom opening drawers, no header — **Done** for posts (`FullScreen`, `PostPage`); **Open** for looks, world views and the reels feed
- Full screen the YouTube way (not a copy): the item fills the screen, title and Close at the top left, an icon pill of actions at the bottom right, a handle at the bottom centre bringing the rest up — **Done** (shared `FullScreen`)
- Every new page scrolls to the top — **Done** (`App.tsx`, on every page or record change)
- No `#` in the URLs — **Open** (needs the server to serve the app for every path; nginx and Caddy config)
- A look's picture section closing for good after a click on a related item — **Done** (a page's first section can fold but never close)

## 6 — The item (look) page
- Actions (like, save, share, cart) as icons over the picture's empty corner, or floating to open the right column — **Done** (kit `MediaStage actions`, icons at the top left)
- Angle tabs centred — **Done**
- Middle column bigger, the sides smaller and top-aligned — **Open**
- A menu of icons (info, stats, chat…) always there; a click opens it — **Open**
- Variants as thumbnails; Related, "Like this" and other categories as sliders; space used like YouTube on TV and Horizon Worlds — **Open**
- Full screen available — **Done** (the full-screen icon; steps through the angles)

## 7 — Data, actions and testing
- Every action through one bus, the reply listened for, state from it; pages as reusable kit blocks with variations (WordPress-like) — **Open** (needs a design first)
- Clean up every page and test with the data: hosts, chat pages, profiles — **Open**
- Privacy and hiding of details — **Waiting**: what to hide, and from whom

## 8 — The shop
- Never compound tabs ("Packs and drops"): Looks, Drops, Packs, Items, Shows, Sales and so on each a tab of their own — **Open**
- Use the original shop design, not guesses: `@pui/shop` (the Chanel storefront is its config plus pages: a header with search, wishlist, shopping bag and account; a category bar; a filter rail; a footer) — **Open**
- The shop drives the header: in the shop the bag replaces Phipad, and the cart button leaves the page — **Open**
- Every section (shop, category pages…) has its own set of data for the header and the sidebar; no blank or irrelevant header items; inside the shop it feels like its own site — **Partly**: the sidebar's record menu is per record; the header is still the same everywhere
- Make use of the database API, our plans and docs — **Open**
- Clean the dirty shop screens (pack cards as text ladders, thin rows) and bring more data; learn from OpenSea (banner, stats row, one tab per kind, filter rail, picture-first cards with price and last sale, a buy bar at the foot) and TikTok — **Open**

## 9 — Profile pages: clubs, people, feed (2026-11-18)
- Related: one row per relation with its own heading (icon, name, count; layout icons and Show all on the right, clear of the edge), picture-first cards three across, grid or slider; never one heap of cards tagged "Worlds", "Store" — **Done** (kit RelationList)
- Cards show finished pictures (world views, look renders, PFT sprites); no drawn stand-in scenes on related cards — **Partly**: 137 older worlds still have only drawn scenes (`public/worlds/w_*.png`) and show their mark face instead; they need finished art
- A club's tabs are its relations, every one the data has (PFTs, Pieces, Store, Worlds, Shots, EGG items, Members, Host, Events, Quests, Coin…); Bold Pups opens on its 711 PFTs — **Done** (relation index now links PFTs, EGG items and SUMs; `site.json clubTabsFirst`)
- Tabs never take the full width, scroll sideways, are sticky, and a tab that is one record carries its picture — **Done** (TabList `place="center"`, RelationTabs)
- Club and profile pages on the shared entity page: identity in the side column, the feed or tabs in a held middle column that stays while the side scrolls, related on the right — **Done** for Club and Profile; **Open** for hosts and shops
- Every kind opens its own page when clicked; only people open on the right; the drawer only when not navigating — **Done** for every kind with a page (`openDetails` routes them); **Open**: hosts, casts, pieces and roles have no page of their own yet
- Section controls never take the title's room or touch the edge (they float over the header's end) — **Done** (kit Sections)
- Headings are one word with an icon and one action: "Clubs to join" → Clubs, "What I can do" → Abilities, "Roles & badges" → Badges — **Partly**: the feed's right column and the profile; the rest of the app still to sweep
- Feed tabs only Recent, Following, Popular, Favourite; Worlds and Agents are regions of the right column — **Done**
- No hash in the address: /feed, /club/<id>; old #/ links still open — **Done** in the app; **Open**: the server (nginx/Caddy) must send index.html for every path before this is deployed
- Likes, saves and every action work the same way everywhere — **Open** (the actions bus, section 7)
- Tile titles clip on small post tiles in the profile feed — **Open**

## 10 — Welcome page, glass and section spacing (2026-11-18)
- Welcome page after Apple TV, Siri and Horizon Worlds (ideas only, our own look and words): a screen-filling stage of the 16 cities, an Ask section with Lora's Spark between fanned city posts, a Step-in band with floating capsules, a tour with dots, shelves (Worlds, Posts, Rides, Stories), Compare, and a closing city — **Done** (copy in `data/landing.json`; old page in `_temp/puikit-welcome-before-showcase`)
- The world takes the whole stage yet stays whole on the screen (contained over a blur of its own colours) — **Done** (kit `Showcase`)
- Apple's glass under the title and text: the picture blurs and darkens progressively towards the bottom, with no box; the same frosted caption on related cards — **Done** (Showcase, RelationList)
- The agent chat scrolled the whole page to its last message — **Done** (it scrolls its own list)
- Club actions: Enter host → View, Follow → Like, one row of icons (View, Like, Shop, Share, Edit), the club's name not repeated on its picture — **Done**
- Room inside every closable section: content never touches the heading or the section's edges — **Done** (kit Sections)
- Sentences out of section headings (they open the section's body instead) — **Done** (PageSections)
- Pool page: Linked on the shared related cards, hidden when empty — **Done**; the pool quest card still repeats "Pool quest" inside its own section — **Open**
- Coherent gradients on nested cards across every page — **Partly**: sections and related cards share one surface; the remaining pages still need a pass
- No old screenshots of the site on the welcome page: the tour shows finished city renders and showcase posts, as a stage of its own — **Done**
- Pictures bigger, floating and lifting on hover, with the theme's corners (cards at the container corner, capsules at the theme's pill) in round glass; no fixed radii, no literal colours, no second colour — **Done** (welcome styles, Showcase, RelationList)
- Too many live blurs made the page paint slowly (header and sidebar dropped out of frames): off-screen cards no longer paint, pills add light without their own blur — **Done**
- Closer to the Horizon Worlds, Meta and Muse welcome pages and Siri (round glass, futuristic) — **Partly**: first pass in; waiting on the user's review

## 11 — Corners, rail and sidebar groups (2026-11-18)
- Phiegg's default corner is large (48px); a saved appearance still on the old default (medium) moves to large once — **Done** (`site.json appearance.defaults` and `appearance.rev`, App.tsx)
- Cards stay proportional to the corner: nested cards stop at the second step (an eighth of the option, 6px at large) instead of going sharp — **Done** (tokens.scss)
- Small tiles kept their ring and cut their titles to a letter; now a small card drops the ring and keeps its title — **Done** (DepthMedia)
- The sidebar's icon rail is narrower (2.75rem) — **Done**
- Sidebar entries that fold are containers like the drawer's filter groups (same corner and top-down shade), open or folded — **Done** (AppShell; same shade as Facets)
- DepthMedia's caption still uses literal colours for its shade and text (older kit code) — **Open**

## 12 — Glass everywhere, headings, posts and cities (2026-11-18)
- Centred tabs and the icon menu wear the page's glass, never a painted colour — **Done** (TabList, IconMenu)
- Full screen: the item's own picture, blurred, is the whole ground (no grey); the sheet is wider; its buttons are glass — **Done** (FullScreen `fill`)
- Faces on character cards were stretched — **Done** (a sprite keeps its own shape)
- A relation of one record is never a grid: single records share one strip of small cards — **Done** (RelationList)
- Each kind's card shape and whether its row slides come from data — **Done** (`site.json kindCards`)
- The post's sheet in columns like a profile: the post and its glass icon actions, slide thumbnails, more of its city, related — **Done**
- Buttons' gradient was too faint to read (the arrows looked flat): every button now runs from the faintest shade to the strongest, with a deeper layer on hover — **Done** (Button)
- Picture tiles on a blur of their own picture (no colour bands), filling the card from its middle — **Done** (Tile)
- City page: the city as a square on its own blur, its views as the picker, glass actions at its foot, content below; full screen reuses the post's view and sheet with the same sections — **Done** (WorldPage, Showcase `ratio`)
- Glass bottom on every card with text at its foot — **Done** (DepthMedia caption: glass, theme ink, no literal colours)
- Section arrows always sit in a heading, never over content; a record's first section is "Info" — **Done** (Sections, Profile, Club)
- Status row with at least 8 cards, scrollable — **Done** for profiles (story sets, then the person's posts; `site.json profileRail.min`)
- Headings one word of four to six letters: relations via `site.json relationNames` (checked: every relation passes), Linked, Skills, Chat, Person, Gems — **Done**; a sweep of every other page's headings — **Open**
- Every section filled from relations, the API and configs, 8-64 rows per relation for testing — **Open**: needs the generators and the API seed (section 7); hosts, chats and profiles still have few rows
- A Chat region on every profile (not only agents) — **Open**

## 13 — Audit, chat, Home (2026-11-19)
- Audit of every routed page (31 tabs): content left outside any surface and sharp surfaces. Messages 129, Feed 184 (inside post cards), Recent 132 (list rows), Hosts / Nests / Channels 16 each (chat column); most others only a loose item count; no sharp surfaces anywhere — **Partly**: Messages fixed; Feed, Recent and Hosts still to do
- Messages on one shared chat component (conversations, thread with composer, people with their details; each column expands or closes) — **Done** (`ChatColumns`); the agent sheet and the hosts' nests still to move onto it — **Open**
- Secondary sidebar: a faint glass light at its edge with the rail, fading to nothing, no box — **Done**
- Folding groups (sidebar, drawer) shade left to right only — **Done**
- Home is the welcome page; the separate Welcome row is gone from the sidebar (data/phiegg.json; the Phiora menu seed needs a rerun to match) and the trail reads Home — **Done**
- The slide shown is the whole page's blurred ground and changes with it — **Done** (Showcase `onChange`, shell Backdrop)
- Each stage picture in a rounded glass card of itself — **Done** (Showcase)
- One picture shape per block: thumbnails fill their frame, sprite cells take their row's shape, shelves use the kinds' shapes — **Done**
- Shelves show only cards with a finished picture (the empty Stories cards are gone) — **Done**; the older worlds' stories have no finished art — **Open**
- Worlds stage: 7 cities picked at random, three in view, the middle the largest over its neighbours; no thumbnails on the welcome stages — **Done** (`landing.json worldStage`)
- Chat and Compare at the standard heading size — **Done**
- Posts with loads of comments in the voice of top creators (fictional residents, no real names), more posts, reels and renders — **Open**
- Every slider on Home is one cascade: three in view (the middle about two thirds of the row, a half-size card each side) and the next two as thin edges, each with at least 7 cards (Worlds 7 picked at random, Posts 26, Rides 8) — **Done** (StageSlider `outerOverlap`; `landing.json cascade`)
- Three rims of light on every card and tile with content, like neon rings round a stage: they spring in one after another under the pointer and settle; on Home they glow softly all the time, brighter under the pointer — **Done** (tokens.scss `.pui-light`, Card, DepthMedia; Home `data-light="on"`); the rims sit inside each card's edge so sliders never clip them, in the theme's one light
- Layers sit close to their child like a tight grid: outer to middle 24px, middle to child 16px at the top and right, the left half of the right and the bottom half of the top — **Done** for the stage (stage → glass card → picture; measured 24 top / 12 bottom, padding 16 16 8 8) and the light rims (tokens `--phi-layer-out`, `--phi-layer-in`); other nested surfaces still use the older padding ladder — **Open**
- Slider arrows are two doors: as tall as the stage, flush with its ends, rounded only on the inner side, glass; the slides run to the edges — **Done** (StageSlider)
- Stage layers as light only (no lines): outer band 32px (16px left and bottom), card 24px (12px), each band's light running the other way; measured exactly; the band's second blur removed — **Done** (`--phi-layer-out` 32px, `--phi-layer-in` 24px)
- The stage showed an empty, blurred frame for seconds on every slide change: its neighbours are now loaded under it and it fades between them — **Done**
- Secondary sidebar: light at the rail fading to nothing across the panel, no ground or blur, so the column disappears on its right — **Done**
- No extra colour: the glass light carries no share of the theme colour (`--phi-card-hue-pct` 0); chat bubbles, headings, icon menu, related faces and rims wear the page's light only — **Done**
- Every wash runs across only (light to nothing, or nothing to light), the glass "down" tokens included; no dark heading bands — **Done** (Sections, Columns, ChatBubble, card, StepForm, social, AppShell)
- The light rims (lines) on every card are gone; Home's cards, chat and fan pictures sit inside two bands of light instead (kit `Bands`: 32/16 then 24/12, opposite directions, a spring under the pointer) — **Done**
- Home's sections have no dark ground: a band of light fading to nothing that hugs its content (Sections `variant="band"`), measured 12px and 24px from the content — **Done**
- Tile captions shorter, their glass softer, so the picture runs almost to the foot — **Done** (DepthMedia)
- The sidebar cut off its content: a row of tabs stretched the panel to 720px; the panel's column now holds to its width and its tab rows wrap — **Done** (AppShell)
- Appearance rows in order, broad choices first (mode, theme, accent, palette, corners, gradient, opacity, shades, motion), the order in `site.json appearance.order` — **Done**
- The Wand City ride post shows the Skim City showcase picture (city-life.json character 8 `picture`; the old render in `_temp`) — **Done**
- Slider doors two thirds as wide and half again the old square's height, centred, 8px in from the row's edges — **Done** (measured 33×95, 8px)
- Every card's owner at its top right (a post's author, a city's creator); like, comment, save and share down the right on hover, springing in — **Done** (DepthMedia `owner`, `actions`; Home)
- Full screen: the picture rises a third as fast as the sheet scrolls, the controls fade as it comes up, an i button brings the sheet up — **Done** (measured 417 of 1,250px; controls at 0)
- Pictures never sit on a card: a blurred copy as ground, a glass band, the picture fitted whole (object-fit) — **Done** (Tile, RelationList); related cards wear their picture's blur as the whole card's ground; no colour added to captions — **Done**
- Buttons and headings: light fading to nothing, never a solid chip or band; heading light runs the same way as its section; the full-screen and stage grounds carry no added colour — **Done** (26 fills; Sections, Button, FullScreen, Showcase)
- One layout icon in a grid section's header: Tile, Grid and List under it on hover, a click switches the layout and the icon (`site.json layouts`; PageSections `switchable`) — **Done** on the post sheet; other grids still to mark — **Open**
- The post sheet's middle and right went blank: dozens of full-size blurred grounds and per-card live blurs stalled painting. Grounds are now drawn at a quarter size and scaled up (the same blur, a sixteenth of the work), per-card caption blurs are gone (soft text shadow instead), cards no longer skip painting — **Done**
- A menu of icons in the post sheet's left column (Post, Views, City, Links, Chat, Hosts, Join, Shop, Hide; `site.json postMenu`), each entry shown only when it can act — **Done**
- One click hides the sheet or brings it up (the menu's Hide, the i button toggles; kit `useFullScreen`) — **Done**
- An icon that cannot act is not shown at all, never greyed out: full-screen steps, section moves, carousel and social arrows; `[hidden]` always hides — **Done**
- Full-screen menu: a vertical rail of icons with their words at the centre of the left edge, only in full screen (kit FullScreen `menu`; an entry names its section or does its thing). Post: About, Views, City, Links, Chat, Hosts, Join, Shop (`site.json postMenu`); city: About, Zones, Posts, PFTs, Clubs, Rides, Gems, Links (`site.json worldMenu`); each entry shown only when it can act; the row menu inside the sheet is gone — **Done** (checked: City brings its section to 24px from the top)
- Feed likes looked dead (the heart never changed): likes, comments, reshare and save are now the post's hover actions on its picture, filled when on, with the count below (checked: Like on, 1 like) — **Done** (ShotCard)
- Feed post: no solid card, the page's light from nothing to light; room between the author and the picture — **Done**
- Headings line up with their content (one side padding for head and body: title and first row at the same x); a head's buttons have no ground of their own; the section controls sit in the head's row on hover, never over the action or layout icons; the layout icon only on grid sections — **Done** (Sections)
- No theme colour under the pointer on cards, deck copies or a chosen card: the page's light only — **Done** (Card)
- Your two renders open the Home stage (landing.json stage.lead), then the cities — **Done**
- Feed: more room between posts and between their parts — **Done**
- No search in page content (Explore; the header has search) — **Done**
- Every main page's tabs centred and sticky by default (kit TabList; the sidebar keeps its rows plain) — **Done**
- Heads sit straight on their region; each region (section, each relation group such as Pieces) is one container with one background — **Done**
- Shop: one tab per kind, never compound — Items, Looks, Packs, Drops, Sales, Nests, Shows, Posts, Reels, each only when it has rows (`site.json shopTabs`); the 142-shop picker gone (a Shops button) — **Done**
- Shop header: the bag in place of Phipad, the cart out of the page (`site.json headerSets`) — **Done**
- Every card as one component with variants (a review of puikit's cards for the dev team) — **Open**
- In a shop the sidebar is that brand's own menu, like a storefront: its kinds at the top, its categories (the garments its looks are made of) in the middle, all shops at the foot; the page and the menu share one view (state shopView); leaving the shop returns to Home's menu — **Done** (shellData shopGroup, App); the category list is long (every garment name) and wants grouping — **Open**
- Shop tabs sometimes miss Sales and Shows on first load (the datasets arrive after the page is drawn) — **Open**, to check
- Nests (what people buy, as containers) filled to at least 16 per shop through the generators or the API seed — **Open**
- Consolidation across every page: three journeys (shopping, joining, exploring), one card component with variants on a shared glass base, the same item tabs wherever the database uses the same names (OpenSea and our docs as the reference for an item's tabs) — **Open**: needs a plan from the docs and the Figma pages before code
- The Skim City showcase picture is gone (file in `_temp`, both its posts turned off in city-life.json; each city still has 16 posts) — **Done**
- Home regions have no backgrounds: the band sections (Worlds, Posts, Rides, Compare) and the Step-in band sit straight on the page — **Done** (Sections `band`; checked: every Home section without a background)
- 2026-11-19 Home regions back, light only like a shop's columns: Sections `variant="band"` and the Step-in band are a top-to-bottom gradient from the page's light (`--phi-shade-3`) to transparent; no colour, no blur, no border or shadow. Measured on Worlds, Posts, Rides, Compare and Step at 1900x1000. Done.
- 2026-11-19 "These bgs don't look right" (tour stage): the kit Showcase had a saturated blur of the picture, a dark wash under the words and two bands running opposite ways. Now the blurred copy is quiet (no saturation, 35%), both bands are light from the top fading to nothing (outer shade-3, card shade-2), and the words keep only the blur. Covers Home's lead, tour and closing stages and the city stage. Checked at 1900x1000 - **Done**

## 14. Post page, one surface, pictures, comments (2026-11-19)
- One gradient for every card: the HTML showed six surfaces (blue `--phi-gradient-media/-child/-grandchild` on picture tiles and the relation list, a second saturated blur on cards in a column, opposite directions). Now one kit token `--phi-surface` (tokens.scss) on cards, rows, tiles, picture bands, Cascade, StatusRail, Tag; only the outermost layer blurs - **Done** (measured on the post sheet)
- Pictures contained: each tile's band hugs its picture (container units), so cut-out and opaque pictures get the same corners and band - **Done**
- Low-quality pictures: city-life.py shrank renders to 720 px at WEBP 80; now the render's own size (crop only) at 92; the 42 old files are in `_temp/puikit-city-posts-720`. City views open full screen at their large file (`itemImageLarge`, from core.json gallery) - **Done**; the API's posts still name the small view files until the next seed - **Open**
- Post menu inside the sheet: its first column, full height, entries held below the close button (FullScreen `menu`) - **Done**
- City post sheet: Info (post, Chat, Links) on the left; the city's Views, Zones, Posts, PFTs, Hosts, Clubs, Rides, Gems at the bottom, the same sections as the city page (`useCityParts`); the menu lists only sections on the sheet (site.json postMenu) - **Done**
- Comments: the same ChatBubble as every chat; each comment and reply in a bubble with its picture; no rails; Reply opens a box under the comment and threads (store `comment(postId, text, parentId)`); Like toggles through the API record. Outside the post page they open in a right drawer with the post's picture at its head - **Done** (tested reply and like)
- Showcase stages and Home regions: light only, top to bottom - **Done**
- Item (shop) page: separate regions in the left column (Like this, Related...), each its own background and expand action - **Open**
- Semantic URLs (city, zone, feed, reel, post in the path, ids only where needed) - **Open**
- Fashion shop menu: gender and categories (tops, dresses, skirts, boots...) with sub-menus of at least 6 items, created on the API, product data - **Open**

### Pages checked in the browser this round
Welcome (Home), Post, World (city), Club, Profile, Feed, Messages, Shop, Pool, Explore.
### Pages not yet checked
AgentsHub, City (zone), Collection, Create, Events, Hosts, Join, League, List, Phipad, Recent, Rides, Search, Series, Show, Shows, Studio, Worlds, and the item (look) sheet.

## 15. Fashion shop menu and the item page (2026-11-19)
- Storefront menu like a high-fashion house: departments (Women, Men; unisex and genderless products in both), categories (Ready-to-wear, Shoes, Accessories, Length, Sleeves, Necklines, Fabrics, Occasions, Collections) and their items (Dresses, Gowns, Tops, Skirts, Trousers, Coats and jackets, Tailoring, Knitwear, Corsets, Slips; Ankle, Knee, Thigh, Platform boots...). One taxonomy in `data/catalog.json`; where a product sits is worked out from its own fields by `lib/catalog.js` (no second copy in the data) - **Done**
- The kit menu handles sub-menus at any depth (AppShell entry `items`), opening by itself when the page is inside; tested - **Done**
- The shop page filters by the entry picked and shows it ("Women · Dresses") with the way back - **Done** (checked: Dresses gives 11 looks)
- On the API: `GET /shop/catalog?store=<id>` (Phiora shop.mjs) runs the same lib/catalog.js on the same data; tested - **Done**; the app here runs without Phiora (no VITE_PHI_API), so it builds the same menu itself
- `scripts/catalog.mjs` in the data pipeline: prints each menu and fails when a product has no place (1307 products, 0 without) - **Done**
- At least 6 items per sub-menu: across all shops every category has 7-14 except Shoes and Accessories (5 each: the products only hold 4 kinds of boot and 4 accessories). A single shop shows only what its products fill: Lora's Spark (25 products) has Ready-to-wear 3, Shoes 4, Accessories 2, Length 6, Sleeves 8, Necklines 10, Fabrics 6, Occasions 6; the other shops hold 6-8 products each - **Partly**: more products per shop needs new product data with finished pictures
- Item page: the left column is separate regions, each with its heading, icon, background and fold/expand: Angles, Lots (only when in one), Alike, Linked; no colour tints on its cards - **Done**

## 16. More products (2026-11-19)
- 21 new Lora's Spark products from finished single renders (Downloads/SINGLE-RENDERS-*), each with its own views at 1080 px: 6 dresses, 5 mini dresses, 5 crop-top and painted-trouser sets, 3 Style 07 looks, an ankle boot and a heeled sandal; three new pools (The Outfit Edit, Style 07 · The Garden Cage, The Shoe Room). Data in `scripts/media/ls-looks.json` (each product's source, base family and its own fields); `scripts/look-files.py` draws the pictures and adds the records, and adds nothing twice - **Done**
- Lora's Spark goes from 25 to 46 products; its menu: Ready-to-wear 8, Length 7, Sleeves 8, Necklines 11, Fabrics 6, Occasions 11, Collections 6; Shoes 5 (All, Ankle, Knee, Thigh, Heeled sandals); Accessories 2 (its only accessories are sashes) - **Partly**: Shoes and Accessories need more finished shoe and accessory renders
- New taxonomy items: Mini dresses, Co-ords, All shoes, Heeled sandals - **Done**
- An item opens in its own shop (header bag and brand menu are that shop's) - **Done**
- Checks: catalog 1328 products, 0 without a place; relations 0 dangling; checked in the browser (Co-ords 5, Women · Shoes 14, Heeled sandals 1, Looks 46) - **Done**
- Not added: OUTFIT-TUTU-DRESS (it is Porcelain Tutu, already in the shop), LS-STYLE-07-LOOK-03 option 02 (same piece as Look 03) - **Done**

## 17. One surface, one label, one picture, for every page (2026-11-19)
- Root cause found in the HTML: the kit's `flat` card variant switched the card's gradient off (19 bare rows on the club page alone: facts, stats, place rows), and the card module set `--card-face*` in a dozen rules that nothing read, so hover and selected light never showed. Now `.card` paints `var(--pui-card-face, var(--phi-surface))` for every variant; the dead rules are gone - **Done**
- The original default restored (commit 899fadf, the Sable Cranes design): `--phi-surface` is light at the head fading to nothing at the foot, so a card merges into what holds it. The four glass tokens are that surface, so tab bars, drawers, columns, fields and cards cannot drift - **Done**
- One corner inside a region: nested cards and sections use the controls' corner (`--phi-radius-md`), the same as tabs, buttons and labels (measured 12px on all at corner option 48) - **Done**
- Icons never bare: `--phi-label` (light from the icon through the words to nothing) on every section heading, every relation heading and the new kit `Label`; six named label tokens replace 67 hand-written gradients in 21 files - **Done**
- Every picture has a ground we control: Avatar and Frame sit on the surface (no theme colour); captions over pictures get light under the words; the blur no longer saturates - **Done**
- One picture component: kit `media/Picture` (blurred ground, a room of the surface, the picture whole, lazy) replaces the two copies in RelationList and the app's Tile - **Done**
- Table and FilterLayout no longer mix the theme colour - **Done**
- Club page: the bare mark-and-sentence line is a `Label`; "97 places run by the club" is "Places" with its count - **Done**
- Performance: a size container on each tile's picture made the feed lay out 35 times slower (2884 ms to 82 ms measured back to back), and auto-sized pictures in a centring grid kept the feed from finishing; both removed (plain 100% box, object-fit contain) - **Done**; first draws are still heavy while the machine is saturated by other builds - **Open** (re-time when idle)
- Audit (no bare icon or picture, no card without the surface, one corner): Club, Explore, Feed clean - **Done**; Worlds, Profile, Shows, Hosts, Messages and the rest not audited (dev server too slow under load) - **Done in section 19**
- Still separate card implementations to fold into Card variants: DepthMedia tile, ItemCard, StatusRail, Cascade, the shop's LookImage frame, LotCard - **Open**
- About page (Philab the design house, Gemphi the proof of the Phiace ecosystem, Phiogy its Discord), privacy page, Meta and TikTok format copies - **Open** (asked, not started)

## 18. Agent chat, rows, messages, icon chips (2026-11-19)
- The light is only round the icon: `.pui-label-icon` is a chip (32px, the label's light fading towards the words); the words sit on nothing. Section headings, relation headings and the kit `Label` use it (measured on the club page) - **Done**
- Every profile and agent row is a full-width row on the surface: the chat list and the details lists use the kit ItemCard `flat` (measured 287 of 287 px, selected row lit) - **Done**
- Too much space on two-line rows: a flat card is compact (8/12px inset, no deep foot): agent rows 98px to 60px, facts 101px to 62px (Stats on a plain Grid, not the card-shaped Rows) - **Done**
- Messages: one band round the whole item (picture, name, words), full width, lit from the left for them and from the right for me; actions at the right as icons only (run/try on, save; like, reply and fold on comments). Kit `ChatBubble` `actions`, so Messages, the agent sheet, the home chat, comments and profile messages all change together - **Done**
- Dark band behind the composer removed: the agent sheet had its own copy of the chat with a `Sticky surface`; it now uses the shared `ChatColumns` (rows, lines, prompts, details column with its back and close), 101 lines to 60 - **Done**
- Copy out of code and no uppercase: "MY CHATS", "ALL AGENTS", "Search agents" and the rest are site.json copy (chMine, chAll, chSearch...) - **Done**
- Not checked by screenshot (the browser pane was behind another window); checked by measurement - **Open**

## 19. Audit of the remaining pages (2026-11-19)
Method: one script run in the browser on each page at 1900x1000, dark. It lists icons with no ground of their own, pictures with no container, cards without the surface, every corner in use, grounds painted dark, colours written inline, and uppercase copy.
- Measured: Welcome, Worlds, World, Zone, Place, Shows, Show, Shop (items, looks, a pack's drawer), Item, Asset, Series, Title, Profile, Hosts, Messages, Events, Drops, Create, Join, League, Phipad, Recent, Rides, Search, Studio, Agents, Shops, Quests, Feed, the post's full screen - **Done**
- Not measured: Pool page, Collection page, Casts and Play lists, the post page under its full screen, and the overlays (bag, sign in, create form, story viewer, filter drawer). Club and Explore were clean in section 17 and not run again - **Open**
- One corner: inputs, selects, checkboxes and the tab bar's sliding pill were 10px beside 12px buttons and tabs. `--phi-control-radius` is now the container corner (md). Five corners computed by hand (Bands, Showcase band and picture, the show stage, the welcome fan: 28px, 19px, 0px) and the full screen bar's pill are md too - **Done** (measured on Shop, Messages, Welcome; the full screen bar and the show stage not measured again)
- Icons with no ground: the kit Pressable's reset beat the surface of whatever was built on it, so a folded column's strip and a picture's action buttons lost their ground. The reset now weighs nothing (`:where`); the strip is a surface with its arrow in the label chip; Pressable's hover, selected and current states wear the label light, not the theme colour or a side line - **Done** (World, Item)
- Icons written into text on the zone page (rating, visitors, hours) and the welcome heading are kit `Label`s - **Done**
- Tags painted intent colours with rims (dark blue on the show page, green on Agents). Every tag is the label light, an intent a stronger light, a minimal tag's icon in a chip - **Done** (Show, Agents)
- Colours of a record's own: tiles mixed the record's hex behind their pictures and about twenty cards, frames and stacks were handed `tint`. Tiles now use the kit's layers as they are, and no call site in the app passes a tint or reports one (`useCardTint` gone from the app) - **Done** (Shop, Feed: no inline colour left on a card or layer)
- Columns (Messages, the chat sheet, the show page): each column and the reopen strip is the one surface with the one corner and the shared gap; the lines between them and the duplicate rules are gone - **Done** (Messages screenshot)
- Uppercase from code: Studio and the profile's items wrote a type's id in capitals ("HOST · EGG · PFT · AGENT"). Type names are copy now (site.json `typeNames`, `typeName()`) - **Done**
- A slide's mark (Showcase) sits in a plate of the surface - **Done**
- The app's old `EntityPage.module.scss` (nothing imported it, bordered columns) moved to `_temp/puikit-phiegg-entity-page-scss` - **Done**
- Hosts draws 237 tab buttons (11,700 nodes) and Join draws 238 cards at once (34,800 nodes); both are slow to settle - **Open**
- The story rail draws 189 items, each with its own ring colours inline - **Open** (a ring is the one place a person's colour still shows; to decide)
- The kit Card still carries the `tint` and deck props and their tests; Phiegg no longer uses them, phi-kit, phidao and phipad each do in one file - **Open**
- Table rows are square bands inside the table's rounded box - **Open** (to decide)

## 20. The site is data: one lookup, one path file (2026-11-19)
Asked: Lora's Spark tabs as before; a shop item opens a page, not a drawer (drawers are for a record's relations); no code per kind (worldOf, clubOf...) but one itemOf() over data and keys; no ifs in the header; the site says per path its menu, tabs and attributes and the code loops; one family per component with variants (Drawer, Tab{List, Item, Slider}, List, Grid), no phrases or plurals in components; no JSX in the apps; do not repeat a character across assets. Directus pulled as the reference (`puikit/reference/directus`, sparse: its one items router, one ItemsService, `readItems(collection)`, one item page for every collection).
- One lookup: `itemOf(kind, id)` and `itemsOf(kind)` (lib/data.ts) read `data/source.json`, which says where each of 40 kinds' rows live. The 25 lookups written per kind (worldOf, clubOf, lookOf, poolOf...), their ten index maps and the code registry in lib/live.ts are gone; 332 call sites changed - **Done** (type-checks; World, Profile, Shop render as before)
- One path file: `data/route.json` says per path the kind it shows, the id it carries, its menu, its header tools and its tabs (`lib/route.ts`). It replaces `pages.json`, the store's id map, and site.json `headerSets` and `shopTabs` - **Done**
- Header: its tools are the path's list drawn in a loop, no condition per tool - **Done** (shop: search, bag, account; profile: search, Phipad, account)
- Lora's Spark tabs: the shop opens on Looks again (it opened on Items), the order is the path's data; the chain of `on === ...` is one view per tab id - **Done**. Sales and Shows still appear a few seconds late, when the heavy data lands - **Open**
- A shop item opens its own page (`/piece/<id>`): a path with `param: recordId` shows its kind's record, so a kind gets a page with one line of data. The record drawer stays for records opened from another - **Done** (measured: no dialog, title shown). Packs and drops (lots) not changed - **Open**
- API: `GET /shop/catalog` and `loadCatalog` still know looks and stores by name; to become menu rows per path, read by one route - **Done in section 22** (`loadCatalog` still prices looks for buying)
- The shop page's views, and every other page, are still JSX in the app; kinds do not yet declare their card and list - **Open**
- Kit: one family per component with variants (Drawer, Tab{List, Item, Slider}, List, Grid, one slider, one card), copy and plurals out of components - **Open**
- A lookup written per relation (ridesOfWorld, eggsOfHost...) is the same problem one level up: `itemsOf(kind, where)` from the kinds' declared links - **Open**
- Do not repeat a character across assets (every tile of a shop shows its club's same face) - **Open**

## 21. Pages from kind data: the shop (2026-11-19)
Checked in Directus first (`puikit/reference/directus/app/src/modules/content/routes/collection.vue`, `layouts/cards`): one page for every collection picks a named layout and feeds it options kept as data (cards: a `title` and `subtitle` template, an `imageSource` field, a size); a saved filter plus a layout is a preset.
- A tab is a kind and a filter (`data/route.json`): `where` and `not` map a field of the row to a value or to `$path` into the path's record (`$pools.*.lookIds.*`), `menu` says the menu entry picked narrows it. `rowsOf(tab, record)` in `lib/route.ts` is the one reader - **Done**
- A kind's card is data (`data/card.json`): a layout name and its options (title and sub templates, the fields that say tone, club, world, person, the path it opens on). The layouts (tile, row, look, lot, post, sale) are written once in `components/Phiegg/KindList.tsx` - **Done**
- One list of any kind (`KindList`): toolbar, Filter and sort and the table from the kind's declared fields, each row its kind's card - **Done**
- The shop page loops over its path's tabs and names no kind and no card: 109 lines to 58 - **Done** (measured: Looks 46, Items 12, Packs 5, Drops 1, Sales 64, Nests 1, Shows 11, Posts 27, Reels 1, the same counts as before, every tab draws its cards)
- Every shop tab now has the same toolbar and filters (Items, Sales, Nests, Shows, Posts and Reels were plain grids) - **Done**
- A look's and a lot's live columns and sorts (a price that moves, what the viewer owns) are still code, keyed by kind in `KindList.tsx`; fields worked out from others should be declared on the kind - **Open**
- The other pages still draw their own lists and cards: ListPage (quests, coins, pools, shops, casts and their four cards), Worlds, Shows, Series, Hosts, Agents, Events, Rides, Search, Recent, Join, and the entity pages - **Open**
- Not checked by screenshot this round (measured in the browser) - **Open**

## 22. Menus per path on the API (2026-11-19)
- A path's menu is an array of entries `{ id, label, count, items }` in `data/menu.json`, keyed by path. The path `shop` is written by the pipeline (`scripts/catalog.mjs`, from `catalog.json` and the products): one array, 377 items, 29 KB - **Done**
- Phiora answers any path's menu from that data with one route, `GET /menu?path=&id=` (`src/menu.mjs`, 21 lines). `GET /shop/catalog`, `shopMenu` and the taxonomy code in `shop.mjs` are gone; nothing in the route knows a kind - **Done** (3 tests in `test/menu.test.mjs`)
- The app's rail reads the same array (`lib/menus.ts` `menuOf`). A shop shows the entries that hold its own products: `menuWith(entries, rows, holds)` is the generic step, the rows are those of the path's tab that follows the menu - **Done** (measured on Lora's Spark: All, Women, and under Women the same nine categories as before)
- One menu shape: `catalogMenu` returns nested entries (no separate departments/categories/items shape) - **Done**
- The flagship shop's id is its id in the data like every other record's (it was the literal `ls`), so a menu or an API call needs no special case; an old `/shop/ls` link still opens it - **Done**
- First try wrote a menu per shop: 699 KB for 142 shops. Dropped for the one array - **Done**
- The app does not yet ask Phiora for a path's menu at start (it reads the bundled file, as the API is the same data) - **Open**
- `store.test.mjs:66` (json: session metadata) fails; the file and `store.mjs` are unchanged from the last commit, so it was failing before this work. Three more fail only on the Windows temp-folder delete (EPERM) - **Open**

## 23. The list pages on the one list (2026-11-19)
- Quests, sponsored quests, coins, pools, shops and casts are paths in `data/route.json` with a title, a line and tabs (a kind and a filter); the list page draws any of them: 125 lines to 19. The shop page uses the same tab component (`TabLists`) - **Done** (measured: each list's title, cards and counts; Pools tabs All 436, PFTs 3, Show drop 143, Club drop 77, Store 213; a shop opens its page, a cast its drawer)
- What each list filters, sorts and tabulates by is declared on the kind in `data/kinds.json` (quest, coin, store, cast); their cards are in `data/card.json` (quest, coin, pool, store, cast); the quest and coin cards moved as they were to `components/Phiegg/Economy.tsx` - **Done**
- A row layout takes its mark, the figure at its end and a flag from data (a cast that is live says so) - **Done**
- Opening: `openRef` keeps a kind's own opener by name in one map (a look sets its shop, a post counts the view), so every card and table row opens the same way - **Done**
- Fixed from section 20: live removal took a record out of a copy of its list. `listsOf(kind)` gives the lists themselves from `data/source.json`; the four special cases in `removeFrom` are gone - **Done** (type-checks; not exercised against a running API)
- Pools read only `pools.pools`: the three pools added with the new products (The Outfit Edit, Style 07 - The Garden Cage, The Shoe Room) had no pool record - **Done** (see below)
- Pool, look and lot lists still work their live columns out in code keyed by kind - **Open**

### A mistake to know about: the pools step was run on its own
To give those three pools their records I ran `node scripts/pools.mjs`. It rewrites far more than pools.json: it re-picks the look each feed shot, agent post and show look wears from the current products, adds a party event per world, sets each world's pool, and rewords copy. I had checksums of every data file from before the run.
- Put back byte-for-byte (checksum matches): `pools.json`, `ls.json`, `stores.json`, `landing.json`, `club.json` - **Done**
- `agents.json`, `shows.json`, `events.json` were equal to the last commit before the run; put back from it on the user's go (the commit's own bytes, since a checkout here writes CRLF) - **Done** (checksum matches)
- `core.json`, `feed.json`, `hosts.json` carried uncommitted work, so they were rebuilt on copies and kept only when the checksum from before the run matched - **Done** (checksum matches):
  - core: the 16 Bold Cities lose the `poolId` and `colors` the step gave them
  - feed: the 51 older shots take their look and colour from the last commit; the 272 new shots lose the step's `hex` and `family`, and the city look posts get their own look id back (read from the picture they show)
  - hosts: the nest kind `collection` is labelled "Collection" again
- All 51 files in `src/data` now match their checksum from before the run; `check-relations` reports 0 dangling links; the versions the step wrote are kept in the session scratchpad (`pools-after`) - **Done**
- The app runs on the restored data (feed, events 369, shows 143, worlds 153, pools 436, hosts measured) - **Done**

### The three pools get their records (2026-11-19)
- The Outfit Edit, Style 07 - The Garden Cage and The Shoe Room now have a pool record each, their pool quest, and The Outfit Edit its two packs: 3 pools, 2 lots, 3 quests added to `pools.json`, placed with the shop's other pools - **Done**
- How: every data file was copied aside first; the pools step ran inside a scratchpad copy of the data, never on the app's; only the records for those three pools were taken from its output. Every record already in `pools.json` is unchanged and no other data file changed (checked by checksum) - **Done**
- Measured: Pools All 439, Store 216; each of the three pool pages opens with its name, season, value and 36 stats; Lora's Spark shows Packs 7 (was 5); `check-relations` 0 dangling - **Done**
- The three pools have no eggs or sum yet (`eggIds`, `sumIds` come from the assets step, which was not run); their pages draw without them - **Open**

## 24. Asks of 2026-11-19, evening

### The next pages on the one list
- Worlds, Shows, Events, Drops and Hosts are list paths in `data/route.json` (title, line, tabs); `WorldsPage`, `ShowsPage`, `EventsPage` and `HostsPage` are set aside in `_temp/puikit-phiegg-list-pages-2` - **Done** (measured: Worlds 153 with Virtual 95, AR 28, Agentic 30; Shows 143 with 85, 28, 30; Events 369 with Drops 73, Runways 100, Parties 160, Talks 35, Shows 1; Drops opens on its Drops tab; Hosts 238; type-check passes)
- What the list had to learn, each once and told in data (`data/card.json`), none for one kind: a tile's own picture, floor grid, badges and the values listed under it; the look it wears (`lead`); tile mode as a stage with its button (`slider`); how many columns (`cols`); a search that reads what the card says - **Done**
- A rule or a template may step through a link: `worldId.kind` is the kind of a show's world, `{clubId.ticker}` a world's club's ticker (`valueAt` in `lib/data.ts`); the same reader serves declared fields, so a show's venue is a declared field (`venueCityId.name`), not a function in a page - **Done**
- A path's words carry figures from data (`{count}`, `{shows.season}`); a path can be like another (`drops` is `events` opening on Drops) - **Done**
- The event card moved as it was to `components/Phiegg/EventCard.tsx`; a show's card is the same in the shop's Shows tab and on the Shows page - **Done**
- Hosts: the list is `hosts`; one host is `host/<id>` (`HostPage.tsx`). The row of all 238 hosts as tabs is gone, and the side column lists the host's own people, at most `site.json hostPeople` (it drew all 1,473 people) - **Done** (a host page measured at 295 elements). The host page itself is still written as a page - **Open**
- Fixed in passing: the Shows title read " shows" because the season never reached the loaded data (`lib/heavy.ts`); it reads "SS26 shows" - **Done**
- Small changes to know: an event with no world shows a dot in the table's World column, not "Phiegg" (1 of 369); tabs on these pages now show their counts; the worlds sort is named "Busiest" - **Done**
- Still written as pages: Series, League, Agents, Rides, Search, Recent, Join, Explore, Feed and the entity pages - **Open**

### Home pictures
- "Replace the other gals on the home page with these" and "replace the old Laura's images, they were temp": the renders in `Downloads/SHOWCASE-2025/Laura's-Spark/LS-DRESS-PHI-BIRD` - **Done on Home**, read as: no old Lora's Spark render shows on the home page any more.
  - The six cards round Lora's Spark's chat are the new renders (back, violet rain, phantom gold, beach day, plain, front), named in `landing.json ask.fan`; written whole on 3:4 cards by `scripts/home-pictures.py` from `scripts/media/home-pictures.json` to `public/home/phi-bird/` (seven pictures; the side view is written and not shown)
  - The floating pills and the posts row show only the cities' showcase scenes (`landing.json post`); the nine character posts, which wore the old renders, are left out of Home
  - The view from below is not used on Home
  - Measured: no `character-` picture on Home, six `phi-bird` pictures, pills are showcase scenes
- The old renders are still in the cities' feeds (9 posts, 27 pictures: `world/<city>/post/character-*.webp`) and Lora's Spark's 46 shop looks keep their pictures. One dress (seven pictures) cannot replace them without showing the same dress nine times - **Open** (needs the user's say: which old pictures, and whether to wait for more renders)
- The Phi Bird dress is not yet a product in Lora's Spark (it has the front, side, back and below views a look needs, and three colourways) - **Open**

### Deeper records
- "We need 16, 32, 64, 128, 256 records of each kind", with comments, likes and the rest - **Partly** (the 16 Bold Cities; read as: how many of a thing a record has is a rung of that ladder, so lists come in every size. Every kind but tracks already had 16 or more records overall)
- Done for the Bold Cities, in their own generator (`scripts/city-life.py`, data in `scripts/media/city-life.json`: `ladder`, `spread`, 64 comment lines, 16 events), every record marked `city-life` and replaced on a rerun:
  - each post has 16, 32, 64, 128 or 256 comments (six posts on the first rung down to one on the last, per city) and likes on the same ladder: 14,848 comments where there were 1,536; no city post has 0 likes
  - each city has 16 events at its hosts' places (runway nights, markets, talks, drops, concerts): 256 events, each with 16 to 256 going
  - each resident follows and is followed by 16 to 256; each host has people online
  - a post's card counts its thread (`threadCounts.json`); city posts showed 2
- Checked: every data file was copied first; the changes are only in `city-life` records (1,024 residents, 96 hosts, 256 posts, the comments) plus the 256 new events; a second run changes nothing; `check-relations` 0 dangling; Events lists 625; a post with 256 comments opens with 256 likes and 258 comments; type-check passes - **Done**
- To know: 91 city posts that show a Lora's Spark look now show a different one, because a rerun follows the current catalogue (the look list grew since the last run) - **Done**
- Fixed in passing: comment writers showed their raw ids (`u_forest_11`, `u_zara`) on every post, because the thread files never took the database's ids; they do now on load (`lib/lazy.ts`), and the two stock comments too - **Done**
- A city's page has no Events section yet (its events are in the Events list, filtered by world) - **Open**
- The 137 older worlds are on the ladder too (see section 25) - **Done**
- For the Bold Cities, their shows, casts, pools, quests, series and nests are still none or few - **Open**
- `threads.mjs` rewrites the thread files from its own list, so `city-life.py` must run after it (written in its header); the `data` script in `package.json` does not include `city-life.py` - **Open**

### The original site
- Found at `D:\Dowloads\Workspace\gemrepo\gemphi` (the D drive's folder is spelled "Dowloads"). What it holds:
  - `phiadk/phiadk-js/web/lib/data/worlds-data.ts` (Feb 2026): 32 hand-written worlds with 5 cities each (Boldland, Naimia, Chatty Valley, Zudaland, Acro World, Gemium, Roidium, Hero City, Bozo City, Nebula, Aurora Land, Horizon World, Iceberg Kingdom, Rock Valley, Ocean Realm, Safari World, and 16 gem worlds). `scripts/media/old-worlds.json` already lists them; Phiegg carries Nebula, Naimia, Chatty Valley, Acro World, Bozo City and Opalia
  - `phiadk/phiadk-js/web/data/seeds/geography.ts`: 64 each of worlds, cities, zones, places, lands, hubs and rooms; `lib/data/shows.ts`: 9 series of 4 seasons of 16 episodes
  - `phiadk/old-phiadk-js/app/gembar/lib` (March to April 2026): 32 users, 64 posts, 128 reels, 64 shows, stories for 16 users, and comments on six kinds of thing (reel, shot, show, cast, drop, post), 3 to 6 each; all made by loops in code
  - ideas: the feed as "worlds shown like movie scripts" (`web/docs/phikit.md`), "Interactive Worlds of Stories" with characters, backstories and branching storylines (`README.md`), the feed with a stories bar and ten actions (`gembar/docs/feed.md`)
  - no written fiction and nothing called movies or films was found there; Phiegg's own `stories.json` has 374 storylines
- Bring over the old worlds not yet in Phiegg (26 of 32), and the stories ideas - **Open** (the worlds need finished pictures; none were looked for yet)

## 25. Late asks of 2026-11-19

### The older worlds on the ladder
- A second generator, `scripts/ladder.py` (data in `scripts/media/ladder.json`), for every world that has no generator of its own. Each count is brought up to the lowest rung that holds what is there (`rule: fit`; `spread` is the other choice and makes far more): 958 posts (every world has 16, 32 or 64), 1,824 events (16 a world), 26,445 comments (every thread has 16, 32, 64, 128 or 256). Each new post is by someone of the world's club and wears a look from its shop. Every record added is marked `ladder`; nothing already there changed - **Done** (every data file copied first; a second run changes nothing; `check-relations` 0 dangling; thread files 6.9 MB to 12 MB)
- `scripts/data_file.py` holds the reading and writing both generators share (a file keeps its indent and line ends) - **Done** (`city-life.py` still carries its own copy - **Open**)
- Neither generator is in the `data` script of `package.json` - **Open**

### "Still getting shitty layout": hosts, cards, comments
- The host page was its own rows. It is now the chat every other chat uses (`ChatColumns`): its nests on the left, the open nest's messages and composer in the middle, its people on the right, a header like the shop's above - **Done** (measured: 7 messages as bubbles on the thread's surface, one composer, the trail reads Home, Hosts, Runway Commons)
- "Are we now using the same cards": hosts, shops and casts were rows; they are the same tile as worlds and shows now (`data/card.json`, no code for a kind) - **Done** (hosts and shops seen at 1440 wide; casts not looked at)
- "Many duplicate comment components": the kit has one message (`ChatBubble`), one thread (`CommentThread`) and now one composer (`ChatComposer`). The app's six hand-written composers (post comments, story reply, the share box, chat columns, agent chat, a cast's chat) are that one; chat columns draw their lines with the kit's thread - **Done** (kit thread tests pass, 4 of 4). The kit's older `social/comment/panel.tsx` is still there for other apps - **Open**
- "Each comment encloses its children in a gradient, each level 16px in": a comment is a surface that holds its own replies; replies step in by one space (16px) a level; the thread and the composer at its foot are surfaces too - **Done** (measured on a post: comment on the surface with a 12px corner, replies 16px in)

### Gradients, bottom to top
- The kit's one surface (`--phi-surface`, worn by every card, row, drawer, column, thread and composer) ran light from the head down. It now runs from the foot up, so a heading at the top of a surface stands free - **Done** (one line in `src/tokens/tokens.scss`; measured `linear-gradient(0deg, ...)`)
- Gradients written by hand outside that token: swept (see the sweep below) - **Done**

### "Radius stuck on 16px, where did sm, md, lg, xl go"
- My mistake of 2026-11-18: I made lg, xl and 2xl all a quarter of the option, the same as md, so at 64 every corner was 16px. The scale is four sizes again, each half the one above: xl the option itself, lg a half (a card, a tile, a drawer), md a quarter (sidebar, side panels, a surface in a surface, buttons and inputs), sm an eighth, xs a sixteenth - **Done** (measured at option 48: xl 48, lg 24, md 12, sm 6, xs 3)
- Tiles, the filter panel, the status rail and the step form's rail used xl; they are surfaces on the page, so lg - **Done**
- Other apps on the kit (phi-kit, phidao, phipad) get the same scale and gradient; not looked at - **Open**

### Routes, data, menus, paths
- The trail at the top was a chain of one branch per page and read "Home, Host". It is one rule read from `data/route.json`: `name` (what a path is called), `up` (the list it sits under), `record` (the kind it names), and the record that holds its record comes from `data/source.json` (a zone's world, a look's shop). `site.json crumbLandings` is gone - **Done** (type-check passes; measured on hosts and a host)
- Every page path is now declared in `route.json` (feed, explore, search, recent, messages, phipad, agents, studio, rides, series, league, create, join, and nests and channels as the host's); every menu entry in `data/phiegg.json` has a page (`appearance` is a panel) - **Done** (checked by script)
- A place's trail lost its world step (places load with their page); which component a path draws is still a switch in `App.tsx`; the menus themselves were not reshaped - **Open**

### The sweep for hand-written gradients and corners
- The app has none on a surface: its only gradients are the pattern art of pool cards (`lib/collection.ts`), which is content. One corner was a percentage (a tab's thumbnail) - **Done**
- Kit, moved onto the label tokens (`--phi-label` and its soft, strong and mirrored forms): table rows, heads, hover, sticky cells and group rows (8 lights mixed by hand from their own shade); the filter chips (3); a section's head; the shell's open group and its bar; the older social kit's glass (5). A tile's sheen was a painted white; it is the kit's shade - **Done**
- Kit, a circle is the full corner, never 50%: 16 places (avatars, swatches, radio, skeleton, status ring, icon buttons) and one 999px - **Done**
- Left as they are, because they are not surfaces: masks that fade an edge, the status and tile rings, a tile's floor grid, the radio's dot, the shell's backdrop wash, and the card's stacked-copies code, which is switched off - **Open** (the stacked-copies code is dead and could go)
- The step form's rail and the product and social cards still paint a fade from a theme colour - **Open**
- Checked: type-check passes; a table in list mode draws its rows on the tokens; avatars measure as full circles. Other apps on the kit not opened - **Open**

## 26. Right sidebar, avatar grounds, old pictures, the PR (2026-11-19, night)
- "These pages must have a sidebar too, the same sidebar, icons by default, on the right; in a world: Switch, Center, Market": the kit shell takes a second sidebar (`side`), built from the same rail and menu components as the left one, mirrored; it starts as icons and an icon opens its menu beside it - **Done** (measured on Forest: three icons, 65px wide; Center opens to 308px with its three zones and Hosts, Shows, Events)
- "Dynamically pass menus and sidebars to each page and path": the right sidebar is `side` in `data/route.json`, a default for every path and a path's own (world). A group's menu is the rows of a kind that belong to the path's record (other worlds; this world's zones; its club's shops), then plain links. No path is named in code - **Done**. What Switch, Center and Market should hold on other kinds of page is my reading (Switch: others of the same kind; Center and Market: links) - **Open** (needs the user's word)
- "The background of each profile, city or thumbnail must be the colours that divide the circle, as glass; logos do not work on dark": a mark or logo stood on the theme's card colour (dark in a dark look). It stands on glass of the record's own two colours now, and the default split icon lets its colours through as glass, in the kit's `Avatar` - **Done in code** (type-check passes; not yet looked at in the browser)
- "Remove old Lora's Spark images except those that came today": the nine character posts are off in `scripts/media/city-life.json`, both generators rerun, and their 27 pictures moved to `_temp/puikit-phiegg-old-lora-posts`. No post shows a `character-` picture - **Done** (81 city posts changed their picture, 0 dangling links). Lora's Spark's 46 shop looks, the look posts that show them and the look every tile wears are also older renders and are still there - **Open** (needs the user's word: removing them empties the shop until new renders come)
- "All the comments and all the kinds must use the shared component with variants": comments, done in section 25; kinds draw through `KindList` and `card.json` on the list pages; the entity pages (world, club, show, asset, profile) are still their own pages - **Open**
- "Send the PR": committed and pushed on `ui-core-defaults`; `reference/` (the Directus copy) left out - see the reply for the link

## 27. No strips, columns that drag, folds lit from the foot (2026-11-19, midnight)
- "Remove that weird chat and the related vertical things; the menu drives what is in": a folded column left a tall strip with its name running down it (Chat, Linked). The strips are gone from both column layouts in the kit. A column that is closed is listed in the kit's `columnStore`, and the right sidebar has a Panels group (`columns` in `route.json`) that shows and hides the page's columns - **Done** (measured on Forest: nothing written vertically; Panels lists Chat; picking it opens the chat column)
- "Columns must be resizable on all screens": every edge between two columns drags (`Columns`), and a side column's inner edge drags (`EntityLayout`) - **Done in code** (kit tests pass; the drag itself was not exercised in the browser)
- "Header actions on hover, three dots on smaller screens": a column's expand and close show while the pointer is over the column; under 900px they sit behind a three-dots button - **Done in code** (not looked at on a narrow screen)
- "Swap the gradients of the accordions: nothing at the top, the shade at the bottom": the accordion's item, the sidebar's folding group and open group, and the filter group are the one surface (lit from the foot); they were lit across the head - **Done** (not compared side by side in the browser)
- A width that was dragged is not remembered after a reload - **Open**

### Where "common components only" stands
- One component each, used everywhere it applies: the shell and both sidebars; the list (toolbar, filter, table, grid, stage); the card of a kind (`card.json`); the message, the thread and the composer; the chat layout; the trail; the avatar; the surface and label lights; the corner scale.
- Pages: 25. On the one list and route data with no page of their own: 11 paths (worlds, shows, events, drops, hosts, quests, play, coins, pools, shops, casts). On the shared chat layout: host, messages, the agent sheet. On the shared entity layout: world, club, profile, look, asset, title, place.
- Not there yet:
  - 18 pages still write cards themselves (`Card`, `ItemCard`) instead of a declared card: agents, city, club, collection, create, explore, feed, join, league, messages (voice rooms), phipad, pool, recent, search, series, show, studio, welcome
  - two column layouts exist in the kit (`Columns` and `EntityLayout`); they share the store and the drag, and should be one component with variants
  - which component a path draws is still a switch in `App.tsx`
  - the app keeps 7 style files of its own (search, shot card, tile, header, explore, post page, welcome)
  - the kit still has the older `social/comment/panel.tsx` and the card's switched-off stacked copies
