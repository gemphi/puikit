# Phiegg on puijs

The Phiace community platform, added to the existing `apps/phiegg` cockpit.
The AIP cockpit pages are untouched and sit under **OPERATIONS** in the sidebar.

## What was added

```
src/data/*.json              shared page data (same files as the web and Rust apps)
                             core.json: 64 worlds / 131 cities · shows.json: 64 SS26 shows × 64 looks, 64 poses with rigs
                             site.json: nav, copy, glyphs, agent intents, autoplay timings
src/types/phiegg.ts          TypeScript types for every file above
src/lib/data.ts              typed accessors + t() copy lookup
src/lib/agent.ts             offline agent brain (style a look, RSVP, open a world)
src/state/phieggStore.ts     one @pui/store: tab + params, likes/follows/RSVPs, nests, comments, chats, overlays
src/components/Phiegg/       Tile (tones from --phi-* tokens), PersonLine, ShotCard,
                             Overlays: story viewer, shot carousel + comments, agent chat drawer, nest modal, toast
src/pages/phiegg/            Feed, Explore, Hosts, Club, Worlds, World, Shows, Show (runway · looks · poses),
                             Agents hub, Profile, Events, Messages, Phipad
src/App.tsx                  one tab map for community + cockpit, reads the store
src/components/Shell/Sidebar.tsx   PHIEGG group (from site.json nav) + OPERATIONS group
```

## Rules followed

- Only `@pui/components` primitives: Page, Stack, Grid, Col, Card, Title, Text, Tag, Badge, Button, Icon,
  Input, Avatar, ProgressBar, Modal, Drawer, Sidebar.
- No colour or size literals in components: tones come from `--phi-color-*` in `Tile.module.scss`.
- Every UI string goes through `t()` from `data/site.json`.

## Run

```bash
cd apps/phiegg
npm install
npm run dev   # http://localhost:3000
```

## Navigation (data/site.json → rail, secondary)

- **Primary rail** (icons): Home · Chat · Host at the top, Menu (three bars, short centred middle) in the centre, You at the bottom.
  The active icon drops its right radius and joins the secondary panel.
- **Secondary panel** per rail item, sections top / centre / bottom. Items with a `source` open an accordion
  with the top `previewCount` (4) rows: worlds + visitors, quest titles + entrants, recipients, nests, hosts, coins, pools, shows, drops.
- **Profile clicks** open a drawer from the right (bio, stories, six shots); "View profile" goes to the page.
- **Appearance** (You → Appearance): radius, theme, brand, gradients, motion — options in `site.appearance`.
- **Slides** animate (`Tile animate`); motion can be reduced from Appearance.
- **Scrollbars** follow the theme (`styles/phiegg.scss`).
- **Marks**: `components/Phiegg/Marks.tsx` — Phiegg, Phipad (Phiegg + a round pill slanting from the bottom-left corner into the oval), menu bars.
- **Economy**: `data/economy.json` (coins, pools, quests) → Coins, Pools, Quests, Play pages.
- **Search** (`components/Phiegg/Search.tsx`): header box over clubs, worlds, people, agents, shows, hosts (top 4 each); empty = "Jump to" pages.
  `/` or Ctrl/Cmd+K focuses, ↑/↓ + Enter picks, Esc closes.
- **Back + breadcrumbs**: store keeps a 40-step `hist`; `back()` restores tab + params. Trail: Home › Clubs/Worlds/Shows/Creators › item.
- **Explore**: staggered grid (`Explore.module.scss`) — first two clubs double-size, others tall (ar/pfp/agentic/pre-mint) or wide; worlds tall if agentic/AR.
- **Shows**: Slider (default) or Grid. Square stage centre, faded neighbours, arrows on hover, play → show page, progress + counter.
