# Phient UI (`@pui/components`) Component Catalog

> _Complete catalog of enterprise UI primitives, layout containers, forms, navigation, and data display components._

---

## 1. Primitives

| Component | Blueprint Equivalent | Description | Props & Features |
|:---|:---|:---|:---|
| `Button` | `Button` | Interactive action trigger | `variant` (primary, secondary, outline, ghost, danger), `size` (sm, md, lg), `icon`, `loading` |
| `ButtonGroup` | `ButtonGroup` | Grouped button container | `vertical`, `fill`, `minimal` |
| `Tag` | `Tag` | Status chips & label markers | `intent` (primary, success, warning, error, info), `round`, `minimal`, `interactive`, `onRemove` |
| `Badge` | `Badge` | Count badge & indicator | `variant`, `size`, `pill` |
| `Callout` | `Callout` | Contextual alert banner | `intent` (primary, success, warning, error), `title`, `icon`, `compact` |
| `Icon` | `Icon` | Lucide icon wrapper | `name`, `size`, `color` |
| `Title` | `H1`–`H6` | Heading typography | `level` (1–6), `weight`, `color` |
| `Text` | `Text` | Body typography | `variant` (sm, base, lg), `color`, `weight` |
| `Divider` | `Divider` | Structural separator | `orientation` (horizontal, vertical), `spacing` |

---

## 2. Layout

| Component | Description | Props & Features |
|:---|:---|:---|
| `Card` | Surface container | `elevation` (0–4), `interactive`, `compact`, `selected` |
| `Stack` | Flexbox layout wrapper | `direction` (row, column), `gap` (1–6), `align`, `justify`, `wrap` |
| `Grid` | CSS Grid container | `columns` (string / number), `gap` (1–6) |
| `Container` | Responsive max-width wrapper | `size` (sm, md, lg, xl, fluid) |
| `Collapse` | Animated accordion fold | `isOpen`, `duration` |

---

## 3. Forms & Controls

| Component | Blueprint Equivalent | Description | Props & Features |
|:---|:---|:---|:---|
| `Input` | `InputGroup` | Single-line text input | `icon`, `rightElement`, `size`, `disabled`, `intent` |
| `Select` | `HTMLSelect` | Dropdown selection | `options`, `size`, `disabled`, `intent` |
| `Switch` | `Switch` | Boolean toggle switch | `checked`, `label`, `size`, `disabled` |
| `Checkbox` | `Checkbox` | Multi-choice checkbox | `checked`, `indeterminate`, `label`, `disabled` |
| `Radio` | `Radio` | Single-choice radio button | `checked`, `label`, `name`, `value` |
| `Slider` | `Slider` | Continuous value slider | `min`, `max`, `step`, `value`, `onChange` |
| `Textarea` | `TextArea` | Multi-line text field | `rows`, `resize`, `intent` |
| `FormGroup` | `FormGroup` | Form label & error wrapper | `label`, `labelInfo`, `helperText`, `intent`, `inline` |

---

## 4. Overlays & Floating Surfaces

| Component | Blueprint Equivalent | Description | Props & Features |
|:---|:---|:---|:---|
| `Dialog` / `Modal` | `Dialog` | Modal focus container | `isOpen`, `onClose`, `title`, `size`, `backdrop` |
| `Drawer` | `Drawer` | Slide-out panel or bottom sheet | `isOpen`, `onClose`, `position` (left, right, bottom), `size`, `expandable`; `docked` (stays on the page, no backdrop), `folded` / `onFoldedChange` (fold to the header), `header` (controls in place of the title) |
| `CommentThread` | `CommentThread` | Nested replies | `comments` (`id`, `parentId`, `author`, `meta`, `text`), `maxDepth` (6), `openDepth`, `depth` (card cascade, 2), `maxHeight`, `onReply`, `labels`; each reply level is a shade fading left to right |
| `DataTable` | `DataTable` | Column-driven table | `columns` (`sortValue` makes a heading sort asc / desc), `rows`, `getKey`, `defaultSort`, `onRowClick` |
| `Toast` / `Toaster` | `Toast` | Ephemeral notification | `message`, `intent`, `timeout`, `onDismiss` |
| `Tooltip` | `Tooltip` | Hover hint | `content`, `position`, `hoverOpenDelay` |
| `Popover` | `Popover` | Floating popover menu | `content`, `position`, `target` |
| `Menu` | `Menu` | Dropdown / context menu list | `MenuItem`, `MenuDivider` |

---

## 5. Navigation

| Component | Blueprint Equivalent | Description | Props & Features |
|:---|:---|:---|:---|
| `Navbar` | `Navbar` | Top navigation header | `NavbarGroup`, `NavbarHeading`, `NavbarDivider` |
| `Breadcrumbs` | `Breadcrumbs` | Hierarchy path tracker | `items`, `current`, `separator` |
| `Tabs` | `Tabs` | Tabbed section switcher | `selectedTabId`, `onChange`, `TabList`, `Tab` |
| `Sidebar` | `Sidebar` | Collapsible side navigation | `collapsed`, `width`, `onToggle` |
| `Pagination` | `Pagination` | Page navigation controls | `currentPage`, `totalPages`, `onPageChange` |

---

## 6. Data Display & Trees

| Component | Blueprint Equivalent | Description | Props & Features |
|:---|:---|:---|:---|
| `Table` | `HTMLTable` | Data table | `headers`, `rows`, `striped`, `interactive`, `bordered` |
| `Tree` / `TreeView` | `Tree` | Hierarchical node tree | `nodes`, `onNodeClick`, `onNodeExpand`, `onNodeCollapse` |
| `Accordion` | `Accordion` | Collapsible section list | `items`, `allowMultiple` |
| `Rating` | `Rating` | Star / metric rating | `value`, `max`, `readOnly` |
| `List` | `List` | Structured item list | `items`, `bordered` |

---

## 7. Feedback & Status

| Component | Blueprint Equivalent | Description | Props & Features |
|:---|:---|:---|:---|
| `NonIdealState` | `NonIdealState` | Empty / error / loading placeholder | `icon`, `title`, `description`, `action` |
| `ProgressBar` | `ProgressBar` | Linear progress indicator | `value` (0–1), `intent`, `indeterminate`, `striped` |
| `Spinner` | `Spinner` | Circular loading spinner | `size` (sm, md, lg), `intent` |
| `Skeleton` | `Skeleton` | Content loading placeholder | `width`, `height`, `variant` (text, circle, rectangle) |

## Round 28 additions

| Component | Description | Props & Features |
|:---|:---|:---|
| `StageSlider` | Centre slide with neighbours a side, each half the height and half tucked under | `items`, `index` / `defaultIndex` / `onIndexChange`, `sides` (0–3), `sideScale`, `overlap`, `stageWidth`, `progress`, `footer`, `prevLabel`, `nextLabel`, `positionLabel` |
| `Swatch` | One exact colour | `color`, `size` (xs–lg), `label`, `shape` (round, square) |
| `Card` (tint) | The card and its deck take one colour, head to nothing | `tint` (hex or `none`), `tintPrimary`, `tintStrength`, `deckDirection` (up, down, right, left, both); content reports its colour with `useCardTint(hex, strength)` |
| `Sections` (reorder) | Rows that fold, close, expand and move | `reorderable`, `storageKey`, `size` (sm, lg), `variant` (card, plain), `hint` per section, `upLabel`, `downLabel`, `resetLabel` |
| `FilterLayout` (drawer) | Filter & sort | `mode` (drawer from the right by default, or aside) |
| `PuiProvider` (override) | A page wears what it shows | `setPaletteOverride(palette, level)`, `paletteOverride`, `paletteFromHex(hex, id, accent2)` |

## Round 29 additions

| Component | Description | Props & Features |
|:---|:---|:---|
| `Card` (bare) | A card whose content is already a tile drops its own surface | content calls `useCardTint(undefined, undefined, true)`; the first reported colour wins; an explicit `tint` stops the report |
| `FacetFilters` (accordion) | Each facet folds; options are equal cells | `openGroups` (default 3), `Facet.cols` (1, 2 or 3; otherwise `facetCols(labels)` by the longest label) |
| `StatusRail` (color) | Each status in its own colour | item `color` |

## Round 30 additions

| Component | Description | Props & Features |
|:---|:---|:---|
| `Pressable` | A clickable with no look of its own | `row`, `gap` (0–4), `fill`, `pad` (none, sm, md), `hover`, `selected`, `inline`, `href`, style props |
| `Frame` | A fixed shape that centres its content on a ground | `ratio`, `rounded` (none, md, lg, full), `place` (center, end-start), `tint`, `tintStrength`, `ink`, `width`, `maxWidth` |
| Style props | On Box, Stack, Text, Title, Link | `width`, `height`, `maxWidth`, `minWidth`, `minHeight`, `maxHeight`, `flex`, `scroll` (x, y), `centered`, `pushEnd`, `pushDown`, `rounded`, spacing, `background`, `color`, `opacity` |
| `Button` (rows) | List rows and tree rows | `align` (center, start), `tall`, `indent` |
| `Image` (fit) | | `fit` (contain, cover), `fill` |
| `ProgressBar` (color) | One colour for the meter | `color` |
| `Text` (pre) | Code and JSON keep their lines | `pre` |
| `Toast` (placement) | | `placement` (end, center), `onClose` optional |
| `Sticky` (surface) | A composer that hides what scrolls under it | `surface` |
| `Drawer` (docked) | In the page flow at the foot of the main area | `docked` with `position="bottom"` |

## Round 31 additions

| Component | Description | Props & Features |
|:---|:---|:---|
| `Stack` (as) | Any element with stack layout | `as` (form, ul, section, label, nav…) |
| `Input` / `Select` / `Textarea` (size) | Sized in their row | `width`, `maxWidth`, `flex`; Textarea `minRows` |
| `ProgressBar` (rest) | Two shares on one bar | `color`, `rest` |
| `Text` (more) | | `as` (strong, em, b, small, kbd, figcaption, li, dt, dd, time), `intent="inherit"`, `weight="inherit"`, `size="3xl"` |
| `Pressable` (divider) | A rule under a list row | `divider` |
| Style props | | `lineHeight`, `font` (heading, body, mono) |

## Round 32 additions

| Component | Description | Props & Features |
|:---|:---|:---|
| Style props (surfaces) | Theme surfaces and grids without classes | `surface` (card, panel, sunken, hero), `autoFill` (min column width), `rule` (top, bottom); spacing 0.5, 1.5, 2.5 |
| `Pressable` (cards, nav) | Clickable cards and menu rows | `card`, `column`, `current`, `accent` |
| `Td` (intent) | Coloured and numeric cells | `intent`, `numeric` |

