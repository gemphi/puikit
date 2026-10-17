# puikit ⟷ edX Paragon Design System Mapping

> _Comprehensive mapping between `@edx/paragon` (`REFS/@edx/paragon/src`) and `@puikit` enterprise design systems._

---

## 1. Executive Summary & Design System Alignment

`@puikit` unites **Palantir Blueprint** density and statecraft with **edX Paragon** enterprise design system ergonomics. This specification maps all 80+ Paragon primitives and patterns directly to `@puikit` components.

---

## 2. Component Taxonomy & Direct Parity Table

| Category | edX Paragon (`@edx/paragon/src`) | puikit (`@puikit`) | Status | Parity & Capabilities |
|:---|:---|:---|:---|:---|
| **Buttons & Triggers** | `Button`, `ButtonGroup`, `ButtonToolbar` | `Button`, `ButtonGroup` | ✅ Complete | Primary, secondary, outline, ghost, danger variants with loading states |
| | `IconButton`, `IconButtonWithTooltip` | `IconButton`, `Button[variant="icon"]` | ✅ Complete | Compact icon triggers with automated tooltip integration |
| | `IconButtonToggle`, `ToggleButton` | `IconButtonToggle`, `Button[selected]` | ✅ Complete | Dual-state boolean toggles |
| | `CloseButton` | `CloseButton` | ✅ Complete | Standardized accessible modal / drawer dismiss trigger |
| **Typography & Primitives** | `Badge` | `Badge` | ✅ Complete | Numeric counts, status indicators, pill styles |
| | `Chip`, `ChipCarousel` | `Tag`, `Chip` | ✅ Complete | Removable interactive metadata filters and carousel scrolling |
| | `Code` | `Code`, `CodeBlock` | ✅ Complete | Inline monospace tags and multi-line syntax highlighted code blocks |
| | `Icon` | `Icon` | ✅ Complete | Universal icon renderer with Lucide / SVG integration |
| | `Hyperlink`, `MailtoLink` | `Link`, `Hyperlink` | ✅ Complete | Standard external and mailto links with accessibility tags |
| **Layout & Structure** | `Container` | `Container` | ✅ Complete | Responsive max-width container with breakpoint containment |
| | `Layout`, `Row`, `Col` | `Row`, `Col`, `Grid` | ✅ Complete | 12-column responsive flexbox and CSS Grid layout system |
| | `Stack` | `Stack` | ✅ Complete | Dense flexbox gap alignment with horizontal/vertical orientation |
| | `Card`, `CardGrid`, `CardColumns` | `Card`, `CardHeader`, `CardBody` | ✅ Complete | Multi-variant surface containers (hero, compact, flat, elevated) |
| | `Sticky` | `Sticky` | ✅ Complete | Sticky header/sidebar viewport pin wrapper |
| | `Scrollable`, `OverflowScroll` | `Scrollable` | ✅ Complete | Sleek custom non-white themed scrollbar containers |
| **Navigation** | `Nav`, `NavItem`, `NavLink` | `Nav`, `NavItem`, `NavLink` | ✅ Complete | Semantic navigation links and bar wrappers |
| | `Navbar`, `NavbarBrand` | `Navbar`, `NavbarBrand` | ✅ Complete | Enterprise top navigation header with platform brand switchers |
| | `Breadcrumb` | `Breadcrumbs` | ✅ Complete | Hierarchical route ancestry tracker |
| | `Tabs` | `Tabs`, `TabList` | ✅ Complete | Accessible tabbed panel switching |
| | `Pagination` | `Pagination` | ✅ Complete | Multi-page pagination controls |
| | `Menu`, `MenuItem`, `SelectMenu` | `Menu`, `MenuItem`, `MenuDivider` | ✅ Complete | Dense context and dropdown menus with keyboard navigation |
| | `Dropdown`, `DropdownToggle` | `Dropdown`, `PlatformDropdown` | ✅ Complete | Accessible floating dropdowns with minimum widths and top-to-bottom gradients |
| **Documentation & Portals** | `ProductTour`, `Annotation` | `Docs`, `DocsPortal`, `DocsNavbar` | ✅ Complete | Automated markdown documentation portal with TOC & search |
| **Forms & User Inputs** | `Form`, `FormGroup`, `FormLabel` | `Form`, `FormGroup` | ✅ Complete | Validated form layouts with inline error feedback |
| | `Input`, `InputText` | `Input` | ✅ Complete | Single-line text input with left/right element adornments |
| | `InputSelect`, `ListBox`, `SelectableBox` | `Select`, `ListBox` | ✅ Complete | Custom select pickers and selectable card boxes |
| | `TextArea` | `Textarea` | ✅ Complete | Auto-resizing multi-line text input |
| | `CheckBox`, `CheckBoxGroup` | `Checkbox`, `CheckboxGroup` | ✅ Complete | Accessible multi-choice checkboxes with indeterminate support |
| | `RadioButtonGroup`, `FormRadioSet` | `Radio`, `RadioGroup` | ✅ Complete | Single-choice radio groupings |
| | `SwitchControl`, `FormSwitchSet` | `Switch` | ✅ Complete | Modern boolean switches |
| | `Slider` | `Slider` | ✅ Complete | Continuous numeric and range slider |
| | `Dropzone`, `FormFile` | `Dropzone` | ✅ Complete | Drag-and-drop file uploaders |
| **Overlays & Dialogs** | `Modal`, `StandardModal`, `FullscreenModal` | `Modal`, `Dialog` | ✅ Complete | Accessible modal overlays with backdrop blur |
| | `Popover`, `PopperElement` | `Popover` | ✅ Complete | Floating tooltips and anchored popovers |
| | `Tooltip` | `Tooltip` | ✅ Complete | Micro-interaction hover text hints |
| | `Toast` | `Toast`, `Toaster` | ✅ Complete | Ephemeral notification banners |
| | `Sheet`, `Overlay` | `Drawer` | ✅ Complete | Slide-out overlay sheets (left, right, top, bottom) |
| **Feedback & Data Display** | `Alert`, `StatusAlert`, `PageBanner` | `Alert`, `Callout` | ✅ Complete | Intent-based alert callouts (info, success, warning, danger) |
| | `Spinner` | `Spinner` | ✅ Complete | Fluid SVG loading indicators |
| | `ProgressBar` | `ProgressBar` | ✅ Complete | Determinate and indeterminate progress indicators |
| | `Skeleton` | `Skeleton` | ✅ Complete | Shimmering placeholder bones for async data loading |
| | `Table`, `DataTable` | `Table` | ✅ Complete | High-density sortable, striped, and interactive data tables |
| | `Avatar`, `AvatarButton` | `Avatar` | ✅ Complete | User avatars with fallback monograms |

---

## 3. Brand Theming & Token Architecture

Paragon uses CSS Custom Properties with SCSS design token generators. In `@puikit`:
* **Design Tokens (`src/tokens/tokens.scss`)**: Maps `--phi-color-*`, `--phi-space-*`, and `--phi-radius-*` directly to semantic design tokens.
* **Vertical Gradient Engine**: Built-in top-to-bottom gradients (`--gradient-bg`, `--gradient-header`, `--gradient-sidebar`, `--gradient-card`, `--gradient-dropdown`).
* **Multi-Brand Switcher**: Instant switching between `phiano`, `foundry`, `blueprint`, `emerald`, `midnight`, and `amber`.
