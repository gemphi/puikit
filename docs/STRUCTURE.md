# Structure

What every page of every running site is built from, and which layer each piece lives in.
Measured on 2026-11-20 on the `ui-core-defaults` branch, from the running sites and the source together.

## The rule

There are two shared layers and every site is built from them.

| Layer | What it holds | Where it is | Imported as |
|:---|:---|:---|:---|
| **puikit** | General components that know nothing about any app: drawer, card, tab row, slider, table, shell, picture, form parts. | `src/components` | `@pui/components` |
| **puiapp** | App-specific components shared by every app: feed, record sheet, profile, account, the config blocks (hero, grid, stats, chat, form, table, terminal, swap, agent, query, runway). Each one is built from puikit components. | `app/phi-kit/src` (shell, `blocks`, `module`) | `@phi-kit` |
| **a site** | Data, and nothing else where that is possible: its config (`app/<key>/public/data/<key>.json`), its menus, its records. A site turns a puiapp module on by naming it, and picks a variant of it. | `app/<key>` | - |

1. A component that could serve any app is puikit. A drawer is puikit.
2. A component that knows what an app does is puiapp. A feed is puiapp: `app/phi-kit/src/module/feed.tsx` pulls records and maps them onto puikit's `PostList`.
3. A site pulls from either layer and adds only what is its own by data. The same feed shows on a real site as a config line, with a variant: `{ "kind": "feed", "variant": "card", "pull": { "kind": "shot" } }`. A slider, a card, a list are the same: the component once, a variant per use.
4. Everything extends. A new need becomes a new variant or a new prop on the component that exists, in the layer it belongs to. It never becomes a second component beside the first, and never a copy inside a site.
5. A site never writes plain HTML or its own styles where a puikit component exists, never hard-codes a colour, and never keeps its own copy of a puiapp component.

No folder is called `puiapp`. The layer is `app/phi-kit`; `app/phiapp` is the runnable app that shows it (the landing and demo, and the home of its tests), and `app/phi` is the host that serves every config app at `/<key>/`.

## How the sites run

| What | Address | Started with |
|:---|:---|:---|
| Phiora API | `localhost:4300` | launch entry `phiora` |
| Host: the thirteen config apps | `localhost:3100/<key>/` | launch entry `phi` |
| Phiapp alone | `localhost:3114` | launch entry `phiapp` |
| Phiegg | `localhost:3101` | launch entry `phiegg` |
| Phipad | `localhost:3102` | launch entry `phipad` |
| Phidao | `localhost:3112` | launch entry `phidao` |
| Phione | `localhost:3115` | launch entry `phione` |

The launch entries are in `gemphi/.claude/launch.json`; `node app/dev-all.mjs` starts them all from a terminal.
The host entry `phi` points at the Python API on port 8000. When that is not running, use the entry `phi-phiora` (the same host on `localhost:3120` against Phiora on 4300); the pages below were recorded there, so lists that pull records have their rows.

`uaia`, `chanel`, `phlick` and `phiegg-v1` are older apps that are not in the registry (`app/phi-kit/src/registry.json`) and are not run; they are not in the tables.

## How this was measured

Each page was opened in the running site and its React tree was read: every component mounted, and every plain HTML element with the component that wrote it. Each component name was then matched to the file that defines it (`src/` is puikit, `app/phi-kit/` is puiapp, `app/<key>/` is the site's own). 234 pages on 17 sites.

In the tables, `*every page*` is what the shell mounts on all of a site's pages; each page's row lists what it adds to that. Icons (lucide) and providers are left out. A name with `*` is also the name of a component in a shared layer (two components, one name; see the list at the end).

## Totals

| Site | Pages | puikit components | puiapp components | Its own components |
|:---|---:|---:|---:|---:|
| phiapp | 9 | 32 | 21 | 0 |
| phient | 13 | 47 | 28 | 0 |
| phihub | 15 | 48 | 26 | 0 |
| phiace | 13 | 46 | 27 | 0 |
| phiora | 12 | 41 | 28 | 0 |
| phiano | 19 | 41 | 27 | 0 |
| phinet | 13 | 44 | 27 | 0 |
| phiber | 11 | 39 | 24 | 0 |
| phinux | 11 | 39 | 25 | 0 |
| phiret | 11 | 39 | 24 | 0 |
| phisum | 20 | 51 | 28 | 0 |
| phipal | 12 | 44 | 27 | 0 |
| spark | 4 | 20 | 11 | 0 |
| phione | 12 | 43 | 16 | 12 |
| phipad | 10 | 27 | 8 | 7 |
| phidao | 9 | 35 | 9 | 9 |
| phiegg | 40 | 76 | 8 | 107 |

The thirteen config apps have no component of their own: every one of their 163 pages is puiapp modules on puikit components, chosen by data. Phione, Phipad and Phidao wear the shared shell and bring a few page components each. Phiegg is the exception: 107 components of its own against 8 from puiapp.

## What breaks the rule

### Fixed on 2026-11-20

| What | Where | Fix |
|:---|:---|:---|
| Every config app showed "Failed to fetch" when its API was not running; the site did not open. | `app/phi-kit/src/data.ts` (`loadApp`) | An API that cannot be reached falls back to the app's own config file, like an API that does not know the app. |
| The chat block drew its own bubbles and input from six style classes. | `app/phi-kit/src/blocks/Chat.tsx` | It is puikit's `ChatBubble` and `ChatComposer` on a theme surface. |
| The terminal block had two hard-coded colours. | `app/phi-kit/src/blocks/Terminal.tsx`, `kit.module.scss` | It sits on the theme's sunken surface; the stylesheet keeps only its shape. |
| The table block restyled puikit's table head with added letter-spacing. | `app/phi-kit/src/blocks/Table.tsx` | It is puikit's `Table` as it is. |
| The runway module wrote plain `<button>`s and grids with inline styles. | `app/phi-kit/src/module/runway.tsx` | Its buttons are `Pressable`, its colour dots `Swatch`, its grids `Rows` and `Stack`. |
| The page head (title and one line) was written four times. | `PhiApp.tsx`, `views.tsx`, `app/phipad/src/pages.tsx`, `app/phidao/src/pages.tsx` | One `Head` in `app/phi-kit/src/views.tsx`; the config apps, Phipad and Phidao use it. |
| Unused imports of the shared stylesheet. | `blocks/Stats.tsx`, `blocks/Swap.tsx`, Phipad, Phidao | Removed. |
| Phione kept its own header, sidebar, agent chat and two stylesheets (with their own colours and tracking) that nothing imported. | `app/phione/src/components/Shell`, `AgentChat`, `AgentCard.module.scss` | Moved to `gemphi/_temp/puikit-phione-old-shell` (listed in `_temp/INVENTORY.md`). |

### Open, with the reason

| What | Where | Why it is not fixed here |
|:---|:---|:---|
| Phiegg has its own list (`ListView`), record sheet (`RecordSheet`), item card (`ItemCard`), cart drawer (`CartDrawer`), stats (`Stats`) and agent chat (`AgentChat`), each beside a component of the same name in puiapp or puikit. | `app/phiegg/src/components/Phiegg` (`Views.tsx`, `RecordSheet.tsx`, `Details.tsx`, `Commerce.tsx`, `AgentChat.tsx`) | Another session is rebuilding Phiegg's profile and data files on this branch today; these are the next ones to fold into the shared layer, one at a time, as variants. |
| puiapp's `ListView` is imported by nothing; Phiegg's list does the same job. | `app/phi-kit/src/ListView.tsx` | It is the one to keep: Phiegg's `ListView` should become it (same reason as above). |
| Phiegg's feed is its own page, not the puiapp feed module. | `app/phiegg/src/pages/phiegg/FeedPage.tsx` | The puiapp feed has the `card` variant only; Phiegg's needs stories, tabs and a composer as variants first. |
| Plain HTML in Phiegg pages: 12 `<img>` and 6 `<span>` on the welcome page, 2 `<div>` on the agents hub, 1 `<img>` in the relation tabs. | `WelcomePage.tsx`, `AgentsHubPage.tsx`, `Connected.tsx` | Phiegg is being edited by another session; puikit's `Picture` and `Box` replace them. |
| App-level features sit in puikit: `social` (feed, home, mail, post, profile, show, comment) and `shop` (cart, order, payment, address, wishlist, product, category, editorial). By the rule the general parts (post card, product card, comment row) stay and the features move to puiapp. | `src/components/social`, `src/components/shop` | The social stylesheet is being split by another session right now (staged, not committed); a move would collide with it. |
| App marks inside puikit. | `src/components/brand/marks.tsx` (phiegg, phipad) | Marks are data; they belong in the registry with the other app glyphs. Small, not done to keep this change to the app layer. |
| Phipad and Phidao each carry `Home`, `About`, `NewsPage` and `Panel`, the same shapes the config apps get from the hero, prose, news and grid blocks. | `app/phipad/src/pages.tsx`, `app/phidao/src/pages.tsx` | Moving them onto config is the README's stated direction ("until they move onto the host"); it is a move of the whole app, not a fix. |
| One hard-coded ink colour in two tone tables. | `app/phipad/src/data.ts`, `app/phidao/src/data.ts` (`TONE.ink`) | Needs an ink-on-fill token in puikit; no token gives a readable ink on that fill in every theme today. |
| Two components, one name: puiapp's `Table`, `Form` and `Grid` blocks wrap puikit's `Table`, `Form` and `Grid`. | `app/phi-kit/src/blocks` | They follow the rule (a block over the kit component); only the names collide. Renaming touches every config, so it is listed, not done. |
| The shared stylesheet still carries about thirty classes of the shell from before `AppShell`. | `app/phi-kit/src/kit.module.scss` | Only `app/phiegg-v1` names them. They go when that app does. |
| Per-user state that was never saved answers 404, which the browser logs as an error on every page. | `GET /state/<name>` in `app/phiora-server` | Not a component matter; noted so the console noise is not mistaken for a fault. |

## Sites and pages

### phiapp

config app on the host, `localhost:3100/phiapp/` · 9 pages

| Page | puikit | puiapp (`phi-kit`) |
|:---|:---|:---|
| *every page* | AppShell, Avatar, Box, Button, Drawer, Menu, Modal, Rail, ServiceProvider, ShellBrand, ShellPin, Span, Stack, TabList, Text | AccountDialog, AccountDrawer, AppGlyph, LookSwitch, NavIcon, PhiApp, PhiShell |
| `_welcome` | Card, Entry, Frame, PageMenu, Run, Tag, Title | AppLanding, FeatureShowcase, Shot |
| `home` | Card, Entry, ItemCard, List, PageMenu, Rows, Run, Tag, Title, ViewToolbar | Block, Grid, Hero, Stats |
| `apps` | Card, Caret, Entry, GroupMenu, ItemCard, List, Rows, Run, Tag, Title, ViewToolbar | Block, Grid, Head |
| `pages` | Caret, Entry, GroupMenu, List, Rows, Run, Title, ViewToolbar | Block, Grid, Head |
| `menus` | Card, Caret, Entry, Frame, GroupMenu, Image, ItemCard, List, Rows, Run, Tag, Title, ViewToolbar | Block, Grid, Head |
| `kinds` | Card, ItemCard, List, Rows, Tag, Title, ViewToolbar | Block, Grid, Head |
| `agents` | Caret, Entry, GroupMenu, List, Rows, Run, Title, ViewToolbar | Block, Grid, Head, Prose |
| `_you` | Caret, Entry, FormGroup, GroupMenu, Input, Label, Run, Tag, Title | AccountPanel, DevLink, Identity, Profile, ProfileView |
| `_settings` | Caret, Entry, GroupMenu, Run | - |

### phient

config app on the host, `localhost:3100/phient/` · 13 pages

| Page | puikit | puiapp (`phi-kit`) |
|:---|:---|:---|
| *every page* | AppShell, Avatar, Box, Button, Drawer, Entry, Menu, Modal, Rail, Run, ServiceProvider, ShellBrand, ShellPin, Span, Stack, TabList, Text, Title | AccountDialog, AccountDrawer, AppGlyph, LookSwitch, NavIcon, PhiApp, PhiShell, Terminal |
| `_welcome` | Card, Frame, Image, PageMenu, Spinner, Tag | AppLanding, FeatureShowcase, Shot |
| `agent` | Caret, ChatBubble, ChatComposer, GroupMenu, Input | Block, Chat, Head |
| `tasks` | Caret, GroupMenu, Table, Tbody, Td, Th, Thead, Tr | Block, Head, Table |
| `models` | Card, Caret, Frame, GroupMenu, Image, ItemCard, List, Rows, ViewToolbar | Block, Grid, Head |
| `terminal` | Caret, GroupMenu, Input | Block, Head |
| `docs` | Card, Caret, GroupMenu, ItemCard, List, Rows, Table, Tbody, Td, Th, Thead, Tr, ViewToolbar | Block, Grid, Head, Table |
| `home` | Card, Divider, Frame, Image, ItemCard, List, PageMenu, Rows, Tag, ViewToolbar | Block, Grid, Hero, News, Stats |
| `news` | Caret, Divider, Frame, GroupMenu, Image | Block, Head, News |
| `about` | Caret, GroupMenu | Block, Head, Prose |
| `faq` | Caret, Divider, GroupMenu | Block, Faq, Head |
| `platform` | Caret, GroupMenu, Icon, Tag, Textarea | Agent, Block, Head |
| `_you` | Caret, FormGroup, GroupMenu, Input, Label, Tag | AccountPanel, DevLink, Identity, Profile, ProfileView |
| `_settings` | Caret, GradientLevelPicker, GroupMenu, PalettePicker, RadiusPicker | Head, SettingsView |

### phihub

config app on the host, `localhost:3100/phihub/` · 15 pages

| Page | puikit | puiapp (`phi-kit`) |
|:---|:---|:---|
| *every page* | AppShell, Avatar, Box, Button, Drawer, Menu, Modal, Rail, ServiceProvider, ShellBrand, ShellPin, Span, Stack, TabList, Text, Title | AccountDialog, AccountDrawer, AppGlyph, LookSwitch, NavIcon, PhiApp, PhiShell |
| `_welcome` | Card, Entry, Frame, Image, PageMenu, Run, Tag | AppLanding, FeatureShowcase, Shot |
| `discover` | Card, Caret, Entry, Frame, GroupMenu, Image, ItemCard, List, Rows, Run, ViewToolbar | Block, Grid, Head |
| `apps` | Card, Caret, Entry, Frame, GroupMenu, Image, ItemCard, List, Rows, Run, ViewToolbar | Block, Grid, Head |
| `repos` | Caret, Entry, GroupMenu, Run | Head |
| `installed` | Card, Caret, Entry, Frame, GroupMenu, Image, ItemCard, List, Rows, Run, ViewToolbar | Block, Grid, Head |
| `docs` | Card, ItemCard, List, Rows, Table, Tbody, Td, Th, Thead, Tr, ViewToolbar | Block, Grid, Head, Table |
| `home` | Card, Divider, Frame, Image, ItemCard, List, Rows, Tag, ViewToolbar | Block, Grid, Hero, News, Stats |
| `news` | Divider, Frame, Image | Block, Head, News |
| `about` | Caret, Entry, GroupMenu, Run | Block, Head, Prose |
| `faq` | Caret, Entry, GroupMenu, Run | Head |
| `platform` | Caret, Entry, GroupMenu, Icon, Run, Tag, Textarea | Agent, Block, Head |
| `catalog` | Caret, Entry, GroupMenu, List, Rows, Run, Table, Tbody, Th, Thead, Tr, ViewToolbar | Block, Grid, Head, Stats, Table |
| `feed` | Collection, EmptyState, Entry, PageMenu, PostItem, PostList, Run | Block, Feed, Grid, Head |
| `_you` | FormGroup, Input, Label, Tag | AccountPanel, DevLink, Identity, Profile, ProfileView |
| `_settings` | Caret, Entry, GradientLevelPicker, GroupMenu, PalettePicker, RadiusPicker, Run | Head, SettingsView |

### phiace

config app on the host, `localhost:3100/phiace/` · 13 pages

| Page | puikit | puiapp (`phi-kit`) |
|:---|:---|:---|
| *every page* | AppShell, Avatar, Box, Button, Drawer, Entry, Menu, Modal, Rail, Run, ServiceProvider, ShellBrand, ShellPin, Span, Stack, TabList, Text, Title | AccountDialog, AccountDrawer, AppGlyph, LookSwitch, NavIcon, PhiApp, PhiShell |
| `_welcome` | Card, Frame, Image, PageMenu, Tag | AppLanding, FeatureShowcase, Shot |
| `assistant` | Caret, ChatBubble, ChatComposer, GroupMenu, Input | Block, Chat, Head |
| `personas` | Card, Caret, Frame, GroupMenu, Image, ItemCard, List, Rows, ViewToolbar | Block, Grid, Head |
| `memory` | Caret, GroupMenu, Table, Tbody, Td, Th, Thead, Tr | Block, Head, Table |
| `docs` | Card, Caret, GroupMenu, ItemCard, List, Rows, Table, Tbody, Td, Th, Thead, Tr, ViewToolbar | Block, Grid, Head, Table |
| `home` | Card, Divider, Frame, Image, ItemCard, List, PageMenu, Rows, Tag, ViewToolbar | Block, Grid, Hero, News, Stats |
| `news` | Caret, Divider, Frame, GroupMenu, Image | Block, Head, News |
| `about` | Caret, GroupMenu | Block, Head, Prose |
| `faq` | Caret, Divider, GroupMenu | Block, Faq, Head |
| `platform` | Caret, GroupMenu, Icon, Tag, Textarea | Agent, Block, Head |
| `workspace` | Caret, GroupMenu, Table, Tbody, Th, Thead, Tr | Block, Head, Stats, Table |
| `_you` | Caret, FormGroup, GroupMenu, Input, Label, Tag | AccountPanel, DevLink, Identity, Profile, ProfileView |
| `_settings` | Caret, GradientLevelPicker, GroupMenu, PalettePicker, RadiusPicker | Head, SettingsView |

### phiora

config app on the host, `localhost:3100/phiora/` · 12 pages

| Page | puikit | puiapp (`phi-kit`) |
|:---|:---|:---|
| *every page* | AppShell, Avatar, Box, Button, Drawer, Entry, Menu, Modal, PageMenu, Rail, Run, ServiceProvider, ShellBrand, ShellPin, Span, Stack, TabList, Text, Title | AccountDialog, AccountDrawer, AppGlyph, LookSwitch, NavIcon, PhiApp, PhiShell, Terminal |
| `_welcome` | Card, Frame | AppLanding, FeatureShowcase, Shot |
| `query` | Textarea | Block, Head, Query |
| `docs` | Card, ItemCard, List, Rows, Table, Tbody, Td, Th, Thead, Tr, ViewToolbar | Block, Grid, Head, Table |
| `home` | - | Block, Hero |
| `news` | Divider | Block, Head, News |
| `about` | - | Block, Head, Prose |
| `faq` | Divider | Block, Faq, Head |
| `platform` | Icon, Tag, Textarea | Agent, Block, Head |
| `dashboard` | - | Block, Head, Stats |
| `database` | Table, Tbody, Td, Th, Thead, Tr | Block, Head, Table |
| `_you` | FormGroup, Input, Label, Tag | AccountPanel, DevLink, Identity, Profile, ProfileView |
| `_settings` | GradientLevelPicker, PalettePicker, RadiusPicker | Head, SettingsView |

### phiano

config app on the host, `localhost:3100/phiano/` · 19 pages

| Page | puikit | puiapp (`phi-kit`) |
|:---|:---|:---|
| *every page* | AppShell, Avatar, Box, Button, Drawer, Entry, Menu, Modal, PageMenu, Rail, Run, ServiceProvider, ShellBrand, ShellPin, Span, Stack, TabList, Text | AccountDialog, AccountDrawer, AppGlyph, LookSwitch, NavIcon, PhiApp, PhiShell, Terminal |
| `_welcome` | Card, Frame, Title | AppLanding, FeatureShowcase, Shot |
| `play` | ChatBubble, ChatComposer, Input, Title | Block, Chat, Head |
| `versions` | Table, Tbody, Td, Th, Thead, Title, Tr | Block, Head, Table |
| `news` | Divider, Title | Block, Head, News |
| `faq` | Title | Head |
| `api` | Input, Title | Block, Head |
| `docs` | Card, ItemCard, List, Rows, Title, ViewToolbar | Block, Grid, Head |
| `home` | Title | Block, Hero, Prose, Stats |
| `forest` | Image, Table, Tbody, Td, Th, Thead, Title, Tr | Block, Figure, Head, Stats, Table |
| `trees` | Card, Image, ItemCard, List, Rows, Title, ViewToolbar | Block, Figure, Grid, Head |
| `strand` | Image, Title | Block, Figure, Head, Prose |
| `words` | Image, Table, Tbody, Td, Th, Thead, Title, Tr | Block, Figure, Head, Stats, Table |
| `unheard` | Image, Table, Tbody, Td, Th, Thead, Title, Tr | Block, Figure, Head, Prose, Table |
| `world` | Image, Table, Tbody, Td, Th, Thead, Title, Tr | Block, Figure, Head, Stats, Table |
| `readers` | Image, Title | Block, Figure, Head, Prose, Stats |
| `understood` | Card, ItemCard, List, Rows, Title, ViewToolbar | Block, Grid, Head, Prose |
| `platform` | Icon, Tag, Textarea, Title | Agent, Block, Head |
| `_you` | FormGroup, Input, Label, Tag, Title | AccountPanel, DevLink, Identity, Profile, ProfileView |
| `_settings` | - | - |

### phinet

config app on the host, `localhost:3100/phinet/` · 13 pages

| Page | puikit | puiapp (`phi-kit`) |
|:---|:---|:---|
| *every page* | AppShell, Avatar, Box, Button, Drawer, Entry, Menu, Modal, Rail, Run, ServiceProvider, ShellBrand, ShellPin, Span, Stack, TabList, Text, Title | AccountDialog, AccountDrawer, AppGlyph, LookSwitch, NavIcon, PhiApp, PhiShell |
| `_welcome` | Card, Frame, Image, PageMenu, Tag | AppLanding, FeatureShowcase, Shot |
| `runs` | Caret, GroupMenu, Table, Tbody, Td, Th, Thead, Tr | Block, Head, Stats, Table, Terminal |
| `modules` | Card, Caret, Frame, GroupMenu, Image, ItemCard, List, Rows, ViewToolbar | Block, Grid, Head, Terminal |
| `cli` | Caret, GroupMenu, Input | Block, Head, Terminal |
| `docs` | Card, Caret, GroupMenu, ItemCard, List, Rows, Table, Tbody, Td, Th, Thead, Tr, ViewToolbar | Block, Grid, Head, Table |
| `home` | Card, Divider, Frame, Image, ItemCard, List, PageMenu, Rows, Tag, ViewToolbar | Block, Grid, Hero, News, Stats |
| `news` | Caret, Divider, Frame, GroupMenu, Image | Block, Head, News |
| `about` | Caret, GroupMenu | Block, Head, Prose |
| `faq` | Caret, Divider, GroupMenu | Block, Faq, Head |
| `platform` | Caret, GroupMenu, Icon, Tag, Textarea | Agent, Block, Head |
| `network` | Caret, GroupMenu, Table, Tbody, Th, Thead, Tr | Block, Head, Stats, Table, Terminal |
| `_you` | Caret, FormGroup, GroupMenu, Input, Label, Tag | AccountPanel, DevLink, Identity, Profile, ProfileView |
| `_settings` | Caret, GradientLevelPicker, GroupMenu, PalettePicker, RadiusPicker | Head, SettingsView |

### phiber

config app on the host, `localhost:3100/phiber/` · 11 pages

| Page | puikit | puiapp (`phi-kit`) |
|:---|:---|:---|
| *every page* | AppShell, Avatar, Box, Button, Drawer, Entry, Menu, Modal, PageMenu, Rail, Run, ServiceProvider, ShellBrand, ShellPin, Span, Stack, TabList, Text, Title | AccountDialog, AccountDrawer, AppGlyph, LookSwitch, NavIcon, PhiApp, PhiShell |
| `_welcome` | Card, Frame | AppLanding, FeatureShowcase, Shot |
| `scenes` | Card, ItemCard, List, Rows, ViewToolbar | Block, Grid, Head |
| `workspaces` | Card, ItemCard, List, Rows, ViewToolbar | Block, Grid, Head |
| `docs` | Card, ItemCard, List, Rows, Table, Tbody, Td, Th, Thead, Tr, ViewToolbar | Block, Grid, Head, Table |
| `home` | - | Block, Hero |
| `news` | Divider | Block, Head, News |
| `about` | - | Block, Head, Prose |
| `faq` | Divider | Block, Faq, Head |
| `gallery` | Card, ItemCard, List, Rows, ViewToolbar | Block, Grid, Head |
| `_you` | FormGroup, Input, Label, Tag | AccountPanel, DevLink, Identity, Profile, ProfileView |
| `_settings` | GradientLevelPicker, PalettePicker, RadiusPicker | Head, SettingsView |

### phinux

config app on the host, `localhost:3100/phinux/` · 11 pages

| Page | puikit | puiapp (`phi-kit`) |
|:---|:---|:---|
| *every page* | AppShell, Avatar, Box, Button, Drawer, Entry, Menu, Modal, PageMenu, Rail, Run, ServiceProvider, ShellBrand, ShellPin, Span, Stack, TabList, Text, Title | AccountDialog, AccountDrawer, AppGlyph, LookSwitch, NavIcon, PhiApp, PhiShell, Terminal |
| `_welcome` | Card, Frame | AppLanding, FeatureShowcase, Shot |
| `markets` | Table, Tbody, Td, Th, Thead, Tr | Block, Head, Table |
| `orders` | Table, Tbody, Td, Th, Thead, Tr | Block, Head, Table |
| `strategies` | Input | Block, Head |
| `docs` | Card, ItemCard, List, Rows, Table, Tbody, Td, Th, Thead, Tr, ViewToolbar | Block, Grid, Head, Table |
| `home` | - | Block, Hero |
| `news` | Divider | Block, Head, News |
| `about` | - | Block, Head, Prose |
| `faq` | Divider | Block, Faq, Head |
| `_you` | FormGroup, Input, Label, Tag | AccountPanel, DevLink, Identity, Profile, ProfileView |
| `_settings` | GradientLevelPicker, PalettePicker, RadiusPicker | Head, SettingsView |

### phiret

config app on the host, `localhost:3100/phiret/` · 11 pages

| Page | puikit | puiapp (`phi-kit`) |
|:---|:---|:---|
| *every page* | AppShell, Avatar, Box, Button, Drawer, Entry, Menu, Modal, PageMenu, Rail, Run, ServiceProvider, ShellBrand, ShellPin, Span, Stack, TabList, Text, Title | AccountDialog, AccountDrawer, AppGlyph, LookSwitch, NavIcon, PhiApp, PhiShell |
| `_welcome` | Card, Frame | AppLanding, FeatureShowcase, Shot |
| `land` | Table, Tbody, Td, Th, Thead, Tr | Block, Head, Table |
| `hearings` | Card, ItemCard, List, Rows, ViewToolbar | Block, Grid, Head |
| `docs` | Card, ItemCard, List, Rows, Table, Tbody, Td, Th, Thead, Tr, ViewToolbar | Block, Grid, Head, Table |
| `home` | - | Block, Hero |
| `news` | Divider | Block, Head, News |
| `about` | - | Block, Head, Prose |
| `faq` | Divider | Block, Faq, Head |
| `parcels` | Table, Tbody, Td, Th, Thead, Tr | Block, Head, Table |
| `_you` | FormGroup, Input, Label, Tag | AccountPanel, DevLink, Identity, Profile, ProfileView |
| `_settings` | GradientLevelPicker, PalettePicker, RadiusPicker | Head, SettingsView |

### phisum

config app on the host, `localhost:3100/phisum/` · 20 pages

| Page | puikit | puiapp (`phi-kit`) |
|:---|:---|:---|
| *every page* | AppShell, Avatar, Box, Button, Drawer, Menu, Modal, Rail, ServiceProvider, ShellBrand, ShellPin, Span, Stack, TabList, Text, Title | AccountDialog, AccountDrawer, AppGlyph, LookSwitch, NavIcon, PhiApp, PhiShell |
| `_welcome` | Card, Entry, Frame, Image, PageMenu, Run, Tag | AppLanding, FeatureShowcase, Shot |
| `home` | Card, Divider, Entry, Frame, Image, ItemCard, List, PageMenu, Rows, Run, Tag, ViewToolbar | Block, Grid, Hero, News, Stats |
| `pools` | Card, Caret, Entry, Frame, GroupMenu, Image, ItemCard, List, Rows, Run, Tag, ViewToolbar | Block, Grid, Head |
| `rounds` | Caret, Entry, GroupMenu, List, Rows, Run, ViewToolbar | Block, Grid, Head |
| `nests` | Card, Caret, Entry, Frame, GroupMenu, Image, ItemCard, List, Rows, Run, Tag, ViewToolbar | Block, Grid, Head |
| `news` | Divider, Frame, Image | Block, Head, News |
| `about` | Caret, Entry, GroupMenu, Run | Block, Head, Prose |
| `faq` | Caret, Divider, Entry, GroupMenu, Run | Block, Faq, Head |
| `docs` | Card, Caret, Entry, GroupMenu, ItemCard, List, Rows, Run, Table, Tbody, Td, Th, Thead, Tr, ViewToolbar | Block, Grid, Head, Table |
| `portfolio` | Card, Caret, Entry, Frame, GroupMenu, Image, ItemCard, List, Rows, Run, Tag, ViewToolbar | Block, Grid, Head, Stats |
| `create-pool` | Caret, Entry, FieldGroup, GroupMenu, Input, Run, StepBody, StepForm, Textarea | Block, Control, Form, Head |
| `open-round` | Caret, Entry, FieldGroup, GroupMenu, Input, Run, Select, StepBody, StepForm | Block, Control, Form, Head |
| `open-nest` | Caret, Entry, FieldGroup, GroupMenu, Input, Run, Select, StepBody, StepForm | Block, Control, Form, Head |
| `add-zone` | Caret, Entry, FieldGroup, GroupMenu, Input, Run, Select, StepBody, StepForm, Textarea | Block, Control, Form, Head |
| `add-area` | Caret, Entry, FieldGroup, GroupMenu, Input, Run, Select, StepBody, StepForm, Textarea | Block, Control, Form, Head |
| `back-round` | Caret, Entry, FieldGroup, GroupMenu, Run, Select, StepBody, StepForm | Block, Control, Form, Head |
| `stake-pool` | Caret, Entry, FieldGroup, GroupMenu, Run, Select, StepBody, StepForm | Block, Control, Form, Head |
| `feed` | Collection, EmptyState, Entry, PageMenu, PostItem, PostList, Run | Block, Feed, Grid, Head |
| `_you` | Caret, Entry, FormGroup, GroupMenu, Input, Label, Run, Tag | AccountPanel, DevLink, Identity, Profile, ProfileView |
| `_settings` | Caret, Entry, GradientLevelPicker, GroupMenu, PalettePicker, RadiusPicker, Run | Head, SettingsView |

### phipal

config app on the host, `localhost:3100/phipal/` · 12 pages

| Page | puikit | puiapp (`phi-kit`) |
|:---|:---|:---|
| *every page* | AppShell, Avatar, Box, Button, Drawer, Entry, Menu, Modal, Rail, Run, ServiceProvider, ShellBrand, ShellPin, Span, Stack, TabList, Text, Title | AccountDialog, AccountDrawer, AppGlyph, LookSwitch, NavIcon, PhiApp, PhiShell |
| `_welcome` | Card, Frame, Image, PageMenu, Tag | AppLanding, FeatureShowcase, Shot |
| `home` | Card, Divider, Frame, Image, ItemCard, List, PageMenu, Rows, Tag, ViewToolbar | Block, Grid, Hero, News, Stats |
| `muse` | Caret, GroupMenu | Block, Head, Prose, Stats |
| `agents` | Card, Caret, Frame, GroupMenu, Image, ItemCard, List, Rows, ViewToolbar | Block, Grid, Head |
| `phient` | Caret, GroupMenu, Input, Table, Tbody, Td, Th, Thead, Tr | Block, Head, Prose, Table, Terminal |
| `phiecs` | Card, Caret, Frame, GroupMenu, Image, ItemCard, List, Rows, Table, Tbody, Td, Th, Thead, Tr, ViewToolbar | Block, Grid, Head, Prose, Table |
| `api` | Caret, GroupMenu, Table, Tbody, Td, Th, Thead, Tr | Block, Head, Table |
| `talk` | Caret, ChatBubble, ChatComposer, GroupMenu, Input | Block, Chat, Head |
| `faq` | Caret, Divider, GroupMenu | Block, Faq, Head |
| `news` | Caret, Divider, Frame, GroupMenu, Image | Block, Head, News |
| `_you` | Caret, FormGroup, GroupMenu, Input, Label, Tag | AccountPanel, DevLink, Identity, Profile, ProfileView |
| `_settings` | Caret, GradientLevelPicker, GroupMenu, PalettePicker, RadiusPicker | Head, SettingsView |

### spark

config app on the host, `localhost:3100/spark/` · 4 pages

| Page | puikit | puiapp (`phi-kit`) |
|:---|:---|:---|
| *every page* | Box, ServiceProvider, Stack, Text | PhiApp |
| `show` | Frame, Image, Rows | Block, Runway |
| `_you` | Avatar, Button, FormGroup, Input, Label, Span, TabList, Tag, Title | AccountPanel, DevLink, Identity, Profile, ProfileView |
| `_settings` | GradientLevelPicker, PalettePicker, RadiusPicker, TabList, Title | Head, SettingsView |
| `show (one look)` | Button, Frame, Image, Span, Swatch, Title | Block, LookPage, Runway |

### phione

own server, `localhost:3115` · 12 pages

| Page | puikit | puiapp (`phi-kit`) | Its own (`app/phione`) |
|:---|:---|:---|:---|
| *every page* | AppShell, Avatar, Box, Button, Drawer, Menu, Modal, Rail, ServiceProvider, ShellBrand, ShellPin, Span, Stack, TabList, Text | AccountDialog, AccountDrawer, AppGlyph, LookSwitch, NavIcon, PhiShell | - |
| `identity` | Card, CardBody, CardHeader, Caret, Entry, GroupMenu, Icon, Page, Run, Section, Title | - | EnrollFlow, IdentityPage |
| `agents` | Card, CardBody, CardHeader, Caret, Col, Entry, GroupMenu, Icon, Page, Run, Section, Sticky, Tag, Textarea, Title | Agent, Grid, Terminal | AgentCard, AgentsPage, Stat |
| `ontology` | Badge, Card, CardBody, CardHeader, Caret, Col, Entry, GroupMenu, Icon, Page, Run, Section, Tag, Tbody, Td, Th, Thead, Title, Tr | Grid, Table | OntologyDrawer, OntologyPage, OntologyTable |
| `streams` | Caret, Entry, GroupMenu, Run | - | - |
| `spatial` | Badge, Card, CardBody, CardHeader, Caret, Col, Entry, GroupMenu, Icon, Page, ProgressBar, Run, Section, Tag, Tbody, Td, Th, Thead, Title, Tr | Grid, Table | SpatialPage |
| `logs` | Badge, Card, CardBody, CardHeader, Caret, DataTable, Entry, GroupMenu, Icon, Input, Page, Run, Section, Tag, Tbody, Td, Th, Thead, Title, Tr | Table | LogsPage |
| `security` | Caret, Entry, GroupMenu, Run | - | - |
| `orchestration` | Badge, Callout, Card, CardBody, CardHeader, Icon, Page, ProgressBar, Section, Tag, Title | - | OrchestrationPage |
| `governance` | Badge, Card, CardBody, CardHeader, Caret, DataTable, Entry, GroupMenu, Icon, Page, Run, Section, Tag, Tbody, Td, Th, Thead, Title, Tr | Table | GovernancePage |
| `docs` | Caret, Entry, GroupMenu, Run | - | - |
| `_you` | Caret, Entry, GroupMenu, Run, Tag, Title | AccountPanel, Head, Identity, Profile, YouView | - |
| `_settings` | Caret, Entry, GradientLevelPicker, GroupMenu, PalettePicker, RadiusPicker, Run, Title | Head, SettingsView | - |

### phipad

own server, `localhost:3102` · 10 pages

| Page | puikit | puiapp (`phi-kit`) | Its own (`app/phipad`) |
|:---|:---|:---|:---|
| *every page* | AppShell, Avatar, Box, Button, Drawer, Menu, Modal, Rail, ServiceProvider, ShellBrand, ShellPin, Span, Stack, TabList, Text | AccountDialog, AccountDrawer, AppGlyph, LookSwitch, NavIcon, PhiShell | - |
| `home` | Entry, Frame, PageMenu, ProgressBar, Run, Tag, Title | - | AppCard, Home |
| `launchpad` | Tag, Title | Head | Launchpad |
| `tracks` | Caret, Entry, Frame, GroupMenu, Run, Tag, Title | Head | Tracks |
| `pipeline` | Caret, Entry, GroupMenu, Run | - | - |
| `portfolio` | Caret, Entry, Frame, GroupMenu, Run, Tag, Title | Head | Portfolio |
| `apply` | Caret, Entry, GroupMenu, Run | - | - |
| `news` | Tag, Title | Head | NewsPage |
| `about` | Caret, Entry, GroupMenu, Run, Tag, Title | Head | About |
| `faq` | Caret, Entry, GroupMenu, Run | - | - |
| `_settings` | Caret, Entry, GradientLevelPicker, GroupMenu, PalettePicker, RadiusPicker, Run, Tag, Title | Head, SettingsView | - |

### phidao

own server, `localhost:3112` · 9 pages

| Page | puikit | puiapp (`phi-kit`) | Its own (`app/phidao`) |
|:---|:---|:---|:---|
| *every page* | AppShell, Avatar, Box, Button, Drawer, Entry, Menu, Modal, Rail, Run, ServiceProvider, ShellBrand, ShellPin, Span, Stack, TabList, Tag, Text, Title | AccountDialog, AccountDrawer, AppGlyph, LookSwitch, NavIcon, PhiShell | - |
| `home` | PageMenu, ProgressBar | - | Home, VoteBar |
| `proposals` | Caret, GroupMenu, ProgressBar | Head | Proposals, VoteBar |
| `treasury` | Caret, GroupMenu, Tbody, Td, Th, Thead, Tr | Head, Table | Treasury |
| `swap` | Caret, GroupMenu, Input, Select | Head | SwapPage |
| `delegates` | Caret, Frame, GroupMenu | Head | Delegates |
| `news` | Caret, Divider, GroupMenu | Head | NewsPage |
| `about` | Caret, GroupMenu, Tbody, Td, Tr | Head, Table | About |
| `docs` | Caret, GroupMenu | Head | Docs* |
| `_settings` | Caret, GradientLevelPicker, GroupMenu, PalettePicker, RadiusPicker | Head, SettingsView | - |

### phiegg

own server, `localhost:3101` · 40 pages

| Page | puikit | puiapp (`phi-kit`) | Its own (`app/phiegg`) |
|:---|:---|:---|:---|
| *every page* | AppShell, Avatar, Box, Button, Drawer, Image, Input, Menu, Modal, PhoneTabs, Rail, ServiceProvider, ShellBack, ShellBackButton, ShellBrand, ShellPin, Span, Stack, Text, Title | AccountDialog, AccountDrawer | ChatHex, CommerceOverlays, Crumbs, Glyph, GridCut, HeaderEnd, HomeCut, HostPyramid, Icon*, MenuBars, Overlays, PoolOverlays, SearchBox, ShopNest, SignIn, YouPill |
| `feed` | Card, CardBody, Caret, ChatComposer, Col, DepthMedia, Entry, GroupMenu, Layer, Page, ProgressBar, Run, Section, Sections, SectionTitle, StatusRail, TabList, Tag, WorldScene | Grid | Composer, EggOutline, EntityAvatar, FeedPage, ItemCard*, MarketMoment, PageSections, PersonAvatar, PersonLine, PhipadMark, Pinned, SeeAll, ShotCard, Tile, Wordmark |
| `welcome` | Backdrop, Bands, Card, CardBody, Caret, ChatBubble, ChatComposer, Col, DataTable, DepthMedia, Entry, GroupMenu, Label, Layer, Page, Picture, ProgressBar, Run, Section, Sections, SectionTitle, Showcase, SpriteImage, StageSlider, StatusRail, TabList, Tag, Tbody, Td, Th, Thead, Tr, WorldScene | Grid, Table | AgentChat, Composer, EggOutline, EntityAvatar, FeedPage, ItemCard*, MarketMoment, PageSections, PersonAvatar, PersonLine, PhipadMark, Pinned, SeeAll, ShotCard, Tile, WelcomePage, Wordmark |
| `explore` | Card, CardBody, Caret, ChatComposer, Col, DepthMedia, Entry, GroupMenu, Layer, Page, ProgressBar, Rows, Run, Section, Sections, SectionTitle, StatusRail, TabList, Tag, WorldScene | Grid | Composer, EggOutline, EntityAvatar, ExplorePage, FeedPage, ItemCard*, MarketMoment, PageSections, PersonAvatar, PersonLine, PhipadMark, Pinned, SeeAll, ShotCard, Tile, Wordmark |
| `search` | Card, CardBody, Caret, ChatComposer, Col, DepthMedia, Entry, GroupMenu, Layer, Page, ProgressBar, Rows, Run, Section, Sections, SectionTitle, SpriteImage, StatusRail, TabList, Tag, WorldScene | Grid | Composer, EggOutline, EntityAvatar, FeedPage, ItemCard*, MarketMoment, PageSections, PersonAvatar, PersonLine, PhipadMark, Pinned, SearchPage, SeeAll, ShotCard, Suggestions, Tile, Wordmark |
| `recent` | Card, CardBody, Caret, ChatComposer, Col, DepthMedia, Entry, FilterLayout, GroupMenu, Layer, List, Page, ProgressBar, Rows, Run, Section, Sections, SectionTitle, StatusRail, TabList, Tag, ViewToolbar, WorldScene | Grid | Composer, EggOutline, EntityAvatar, FeedPage, ItemCard*, ListView*, MarketMoment, PageSections, PersonAvatar, PersonLine, PhipadMark, Pinned, RecentPage, SeeAll, ShotCard, Tile, ViewGrid, ViewSwitch, Wordmark |
| `studio` | Card, CardBody, Caret, ChatBubble, ChatComposer, ChoiceRow, Col, DataTable, DepthMedia, Entry, FilterLayout, GroupMenu, Layer, List, Page, ProgressBar, Run, Section, Sections, SectionTitle, StatusRail, TabList, Tag, Tbody, Td, Textarea, Th, Thead, Tr, ViewToolbar, WorldScene | Grid, Table | Composer, EggOutline, EntityAvatar, FeedPage, ItemCard*, ListView*, MarketMoment, PageSections, PersonAvatar, PersonLine, PhipadMark, Pinned, SeeAll, ShotCard, StudioPage, Tile, ViewSwitch, Wordmark |
| `rides` | Card, CardBody, Caret, ChatComposer, Col, DepthMedia, Entry, FilterLayout, GroupMenu, Layer, List, Page, ProgressBar, Rows, Run, Section, Sections, SectionTitle, SpriteImage, StatusRail, TabList, Tag, ViewToolbar, WorldScene | Grid | Composer, EggOutline, EntityAvatar, FeedPage, ItemCard*, ListView*, MarketMoment, PageSections, PersonAvatar, PersonLine, PhipadMark, Pinned, RideList, RidesPage, SeeAll, ShotCard, Tile, ViewGrid, ViewSwitch, Wordmark |
| `messages` | Card, CardBody, Caret, Cascade, ChatBubble, ChatComposer, Col, Columns, CommentThread, DepthMedia, Entry, FilterLayout, Frame, GroupMenu, Item, Label, Layer, List, Page, Picture, ProgressBar, RelationList, Rows, Run, Section, Sections, SectionTitle, StatusRail, TabList, Tag, Textarea, ViewToolbar, WorldScene | Grid, Identity, Note, ProfileView, Relations | ChatColumns, Composer, Details, EggOutline, EntityAvatar, Facts*, FeedPage, ItemCard*, ListView*, LookAttachment, LookImage, MarketMoment, MessagesPage, PageSections, PersonAvatar, PersonLine, PersonProfile, PhipadMark, Pinned, SeeAll, ShotCard, Shots, Tile, ViewGrid, ViewSwitch, Wordmark |
| `agents-hub` | Card, CardBody, Caret, ChatComposer, Col, DepthMedia, Entry, FilterLayout, GroupMenu, Layer, List, Page, ProgressBar, Rows, Run, Section, Sections, SectionTitle, StatusRail, TabList, Tag, ViewToolbar, WorldScene | Grid | AgentsHubPage, Composer, EggOutline, EntityAvatar, FeedPage, ItemCard*, ListView*, MarketMoment, PageSections, PersonAvatar, PersonLine, PhipadMark, Pinned, Ring, SeeAll, ShotCard, Tile, ViewGrid, ViewSwitch, Wordmark |
| `phipad` | Card, CardBody, Caret, DepthMedia, Entry, GroupMenu, Layer, Page, ProgressBar, Run, Section, Tag, WorldScene | Grid | EggOutline, EntityAvatar, PhipadMark, PhipadPage, Tile, Wordmark |
| `create` | Card, CardBody, Caret, ChatComposer, Entry, GroupMenu, Page, Rows, Run, Section, Sections, SectionTitle, Tag | - | Composer, CreatePage, EggOutline, EntityAvatar, ItemCard*, PageSections, PhipadMark, Wordmark |
| `join` | Card, CardBody, Caret, DepthMedia, Entry, GroupMenu, Layer, Page, Run, Section, Tag, WorldScene | Grid | EggOutline, EntityAvatar, JoinPage, PhipadMark, Tile, Wordmark |
| `series` | Card, CardBody, Caret, DepthMedia, Entry, FilterLayout, GroupMenu, Layer, List, Page, Rows, Run, Section, TabList, Tag, ViewToolbar, WorldScene | - | EggOutline, EntityAvatar, ListView*, PersonAvatar, PhipadMark, SeriesPage, Tile, ViewGrid, ViewSwitch, Wordmark |
| `league` | Card, CardBody, Caret, DataTable, Entry, GroupMenu, Page, Run, Section, TabList, Tbody, Td, Th, Thead, Tr | Table | EggOutline, LeaguePage, PhipadMark, Wordmark |
| `worlds` | Caret, DepthMedia, Entry, FilterLayout, GroupMenu, Layer, List, Page, Rows, Run, Section, TabList, Tag, ViewToolbar | - | EggOutline, EntityAvatar, KindCard, KindList, KindList.tile, ListPage, ListView*, PersonAvatar, PhipadMark, TabLists, Tile, ViewGrid, ViewSwitch, Wordmark |
| `shows` | Caret, DepthMedia, Entry, FilterLayout, GroupMenu, Layer, List, Page, Rows, Run, Section, TabList, Tag, ViewToolbar, WorldScene | - | EggOutline, EntityAvatar, KindCard, KindList, KindList.tile, ListPage, ListView*, PersonAvatar, PhipadMark, TabLists, Tile, ViewGrid, ViewSwitch, Wordmark |
| `events` | Card, Caret, Entry, FilterLayout, Frame, GroupMenu, List, Page, Rows, Run, Section, TabList, Tag, ViewToolbar | - | EggOutline, EventCard, ItemCard*, KindCard, KindList, KindList.event, ListPage, ListView*, PhipadMark, TabLists, ViewGrid, ViewSwitch, Wordmark |
| `drops` | Card, Caret, Entry, FilterLayout, Frame, GroupMenu, List, Page, Rows, Run, Section, TabList, Tag, ViewToolbar | - | EggOutline, EventCard, ItemCard*, KindCard, KindList, KindList.event, ListPage, ListView*, PhipadMark, TabLists, ViewGrid, ViewSwitch, Wordmark |
| `hosts` | Caret, DepthMedia, Entry, FilterLayout, GroupMenu, Layer, List, Page, Rows, Run, Section, Tag, ViewToolbar, WorldScene | - | EggOutline, EntityAvatar, KindCard, KindList, KindList.tile, ListPage, ListView*, PersonAvatar, PhipadMark, TabLists, Tile, ViewGrid, ViewSwitch, Wordmark |
| `shops` | Caret, DepthMedia, Entry, FilterLayout, GroupMenu, Layer, List, Page, Rows, Run, Section, Tag, ViewToolbar, WorldScene | - | EntityAvatar, KindCard, KindList, KindList.tile, ListPage, ListView*, TabLists, Tile, ViewGrid, ViewSwitch, Wordmark |
| `casts` | Caret, DepthMedia, Entry, FilterLayout, GroupMenu, Layer, List, Page, Rows, Run, Section, Tag, ViewToolbar, WorldScene | - | EggOutline, EntityAvatar, KindCard, KindList, KindList.tile, ListPage, ListView*, PhipadMark, TabLists, Tile, ViewGrid, ViewSwitch, Wordmark |
| `quests` | Card, CardBody, Caret, DepthMedia, Entry, FilterLayout, GroupMenu, Layer, List, Page, ProgressBar, Rows, Run, Section, Tag, ViewToolbar, WorldScene | - | EggOutline, EntityAvatar, KindCard, KindList, KindList.quest, ListPage, ListView*, PhipadMark, QuestCard, TabLists, Tile, ViewGrid, ViewSwitch, Wordmark |
| `play` | Card, CardBody, Caret, DepthMedia, Entry, FilterLayout, GroupMenu, Layer, List, Page, ProgressBar, Rows, Run, Section, Tag, ViewToolbar, WorldScene | - | EggOutline, EntityAvatar, KindCard, KindList, KindList.quest, ListPage, ListView*, PhipadMark, QuestCard, TabLists, Tile, ViewGrid, ViewSwitch, Wordmark |
| `coins` | Card, Caret, Entry, FilterLayout, GroupMenu, List, Page, Popover, Rows, Run, Section, ViewToolbar | - | Amount, CoinCard, EggOutline, EntityAvatar, ItemCard*, KindCard, KindList, KindList.coin, ListPage, ListView*, PhipadMark, TabLists, ViewGrid, ViewSwitch, Wordmark |
| `pools` | Card, CardBody, Caret, DepthMedia, Entry, FilterLayout, GroupMenu, Layer, List, Page, ProgressBar, Rows, Run, Section, TabList, Tag, ViewToolbar, WorldScene | - | EggOutline, EntityAvatar, KindCard, KindList, ListPage, ListView*, PhipadMark, PoolCard, PoolTile, TabLists, Tile, ViewGrid, ViewSwitch, Wordmark |
| `world` | Backdrop, Card, CardBody, Caret, ColumnHead, DepthMedia, EntityLayout, Entry, GroupMenu, Item, Layer, Link, Picture, Radio, RelationList, Rows, Run, Sections, SectionTitle, ShownTitle, SpriteImage, Tag, WorldScene | Grid | Connected, EggOutline, EntityAvatar, EntityPage, ItemCard*, PageSections, PersonAvatar, PhipadMark, Stat, Stats*, Tile, Wordmark, WorldPage |
| `city` | Card, CardBody, Caret, DepthMedia, Entry, FilterLayout, GroupMenu, Item, Label, Layer, List, Page, RelationList, Rows, Run, Section, TabList, Tag, ViewToolbar, WorldScene | - | CityPage, Connected, EggOutline, EntityAvatar, ListView*, PhipadMark, Tile, ViewGrid, ViewSwitch, Wordmark |
| `club` | Card, Caret, ChoiceRow, ColumnHead, DepthMedia, EntityLayout, Entry, GroupMenu, Item, Label, Layer, Picture, RelationList, Run, Sections, SectionTitle, ShownTitle, TabList, Tag, WorldScene | Grid | ClubIcon, ClubPage, EggOutline, EntityAvatar, EntityPage, ItemCard*, PageSections, PersonAvatar, PhipadMark, RelationTabs, Stat, Stats*, Tile, Wordmark |
| `show` | Card, CardBody, CardHeader, Caret, Cascade, ChatBubble, ChatComposer, Columns, DepthMedia, Entry, Frame, GroupMenu, Layer, Page, ProgressBar, Radio, RelationList, Rows, Run, Section, SpriteImage, TabList, Tag, WorldScene | - | AgentChat, Connected, EggOutline, EntityAvatar, ItemCard*, LookImage, PersonAvatar, PhipadMark, Rig, ShowPage, Tile, Wordmark |
| `profile` | Caret, DepthMedia, Entry, FilterLayout, GroupMenu, Layer, List, Run, TabList, ViewToolbar, WorldScene | Identity, ProfileView, Relations | EggOutline, ListView*, PersonAvatar, PersonProfile, PhipadMark, ProfilePage, ProfileTab, Tile, ViewSwitch, Wordmark |
| `collection` | Card, CardBody, Caret, ChoiceRow, DepthMedia, Entry, FilterLayout, GroupMenu, Item, Layer, List, Page, Picture, RelationList, Rows, Run, Section, SpriteImage, Tag, ViewToolbar, WorldScene | Grid | CollectionPage, Connected, EggOutline, EntityAvatar, ListView*, PersonAvatar, PhipadMark, Tile, ViewGrid, ViewSwitch, Wordmark |
| `post` | Card, CardBody, Caret, ChatBubble, ChatComposer, CommentThread, DepthMedia, Entry, FilterLayout, FullScreen, GroupMenu, Layer, Link, List, RelationList, Rows, Run, Sections, SectionTitle, SpriteImage, Tag, ViewToolbar, WorldScene | - | Composer, Connected, EggOutline, EntityAvatar, ItemCard*, ListView*, PageSections, PersonAvatar, PersonLine, PhipadMark, Pinned, PostComments, PostPage, RideList, Tile, ViewGrid, ViewSwitch, Wordmark |
| `place` | Caret, Entry, GroupMenu, Run | - | EggOutline, PhipadMark, PlacePage, Wordmark |
| `title` | Backdrop, Card, Caret, Cascade, ChatBubble, ChatComposer, ChoiceRow, ColumnHead, DepthMedia, EntityLayout, Entry, Frame, GroupMenu, Layer, Rows, Run, ShownTitle, Tag, WorldScene | - | AgentChat, EggOutline, EntityAvatar, EntityPage, ItemCard*, LookImage, PersonAvatar, PhipadMark, Tile, WatchSheet, Wordmark |
| `asset` | Backdrop, Card, ChatBubble, ChatComposer, ColumnHead, DataTable, DepthMedia, EntityLayout, Layer, Sections, SectionTitle, ShownTitle, Tag, Tbody, Td, Th, Thead, Tr, WorldScene | Table | AgentChat, AssetSheet, EggOutline, EntityAvatar, EntityPage, Facts*, ItemCard*, PageSections, PersonAvatar, PhipadMark, Tile |
| `host` | Card, ChatBubble, ChatComposer, Columns, CommentThread, DepthMedia, FilterLayout, Item, Label, Layer, List, Page, Picture, RelationList, Rows, Section, StatusRail, TabList, Tag, Textarea, ViewToolbar, WorldScene | Identity, Note, ProfileView, Relations | ChatColumns, Details, EggOutline, EntityAvatar, Facts*, HostPage, ItemCard*, ListView*, PersonAvatar, PersonLine, PersonProfile, PhipadMark, Shots, Tile, ViewGrid, ViewSwitch |
| `shop` | Card, CardBody, Caret, Cascade, Entry, FilterLayout, Frame, GroupMenu, List, Page, Rows, Run, Section, TabList, Tag, ViewToolbar | - | KindCard, KindList, ListView*, LookCard, LookImage, ShopPage, TabLists, ViewGrid, ViewSwitch, Wordmark |
| `look` | Backdrop, Card, CardBody, Caret, Cascade, ColumnHead, DataTable, EntityLayout, Entry, Fit, Frame, GroupMenu, Link, MediaStage, Radio, RelationList, Rows, Run, Sections, SectionTitle, ShownTitle, Swatch, TabList, Tag, Tbody, Td, Th, Thead, Tr | Table | Activity, Connected, EntityAvatar, EntityPage, ItemActivity, ItemAppears, ItemCard*, ItemPrice, ItemSheet, ItemSpecs, ItemStatsTable, LookImage, PageSections, Wordmark |
| `pool` | Card, CardBody, Caret, Cascade, DepthMedia, Entry, FilterLayout, Frame, GroupMenu, Layer, Link, List, Page, ProgressBar, RelationList, Rows, Run, Section, Sections, SectionTitle, TabList, Tag, ViewToolbar, WorldScene | Grid | EntityAvatar, ItemCard*, ListView*, LookImage, LotCard, PageSections, PersonAvatar, PersonLine, PoolItems, PoolPage, PoolQuestCard, StatGrid, Tile, ViewGrid, ViewSwitch, Wordmark |
| `piece` | Card, CardBody, Caret, DepthMedia, Entry, GroupMenu, Layer, Page, Rows, Run, Section, TabList, Tag, WorldScene | - | EntityAvatar, RecordView, Tile, Wordmark |
