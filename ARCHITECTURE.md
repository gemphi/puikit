# Phient UI (`@pui/components`) Architecture

> _Technical architecture, design token system, package boundaries, and application layout for Phient UI._

---

## 1. Architectural Goals

1. **Palantir Blueprint Parity**: Pure composable primitives engineered for dense, complex, enterprise web applications and AI agent cockpits.
2. **Zero Business Logic Coupling**: Strictly state-library agnostic (supports Zustand, Redux, Jotai, or plain React state). No e-shop domain carts or mock store services in the core library.
3. **Multi-Brand Theming**: Built-in Foundry Blue, Blueprint Slate, Emerald, Midnight, and Amber palettes with instant light/dark mode and flat/elevated/glass surface modes.
4. **Strict Token System**: Centralized design tokens in `src/tokens/tokens.scss` using `--phi-*` custom properties with zero runtime JavaScript overhead.
5. **Standalone Applications (`apps/`)**: Replaces heavy third-party storybooks with lightweight, tailored Vite applications (`pui-book` for `puijs.com`, `demo-app`, `landing-app`).

---

## 2. Directory Structure

```
pui/
├── package.json               # @pui/components package manifest & exports
├── README.md                  # Master documentation & quick start
├── ARCHITECTURE.md            # Architecture & boundary definitions
├── COMPONENTS.md              # Full component catalog & APIs
├── ROADMAP.md                 # Phased rollout & feature roadmap
├── specs.md                   # Formal component specifications
├── flows.md                   # Interaction & navigation flows
├── tasks.md                   # Maintenance & execution tasks
│
├── src/                       # Core Component Library (All files <= 120 LOC)
│   ├── index.ts               # Public API barrel export
│   ├── styles/
│   │   └── core.scss          # Core typography, resets & utilities
│   ├── tokens/
│   │   └── tokens.scss        # CSS custom properties (--phi-*)
│   ├── utils/
│   │   └── cn.ts              # Class name merging helper
│   ├── hooks/
│   │   └── usePuiTheme.ts     # Theme state access hook
│   ├── providers/
│   │   ├── PuiProvider.tsx    # Primary theme provider
│   │   ├── themes.ts          # Brand theme definitions
│   │   ├── types.ts           # Theme context types
│   │   └── PProvider.tsx      # Re-export alias
│   └── components/
│       ├── primitives/        # Button, Tag, Badge, Icon, Title, Text, Span, Divider
│       ├── layout/            # Card, Stack, Grid, Container, Row, Col, Page, Collapse
│       ├── forms/             # Input, Select, Switch, Checkbox, Radio, Slider, FormGroup
│       ├── overlays/          # Modal, Drawer, Toast, Tooltip, Popover, Menu
│       ├── feedback/          # Callout, Alert, NonIdealState, ProgressBar, Skeleton, Spinner
│       ├── navigation/        # Navbar, Breadcrumbs, Tabs, Sidebar, Pagination
│       └── data-display/      # Table, Tree, TreeView, Card, Accordion, List, Rating
│
└── apps/                      # Standalone Vite Applications (All files <= 120 LOC)
    ├── README.md              # Application guide & port reference
    ├── pui-book/              # Documentation & Live Workbench at puijs.com (Port 3001)
    ├── demo-app/              # Enterprise Operations Showcase (Port 3002)
    └── landing-app/           # Design System Landing Page (Port 3003)
```

---

## 3. Design Token Hierarchy

Design tokens are defined in `src/tokens/tokens.scss` under the `--phi-*` namespace:

| Category | Token Pattern | Example Value |
|:---|:---|:---|
| **Intent Colors** | `--phi-color-primary`, `--phi-color-success`, `--phi-color-error` | `#3b82f6`, `#10b981`, `#ef4444` |
| **Grayscale Ramps**| `--phi-color-gray-50` through `950` | Slate palette (`#f8fafc` to `#020617`) |
| **Surfaces & Text**| `--phi-color-background`, `--phi-color-text-primary` | Dynamic based on light/dark mode |
| **Elevation** | `--phi-shadow-0` through `4` | Elevation levels 0–4 |
| **Radii** | `--phi-radius-sm`, `md`, `lg`, `xl`, `full` | `4px`, `6px`, `8px`, `12px`, `9999px` |
| **Typography** | `--phi-font-family`, `--phi-font-mono` | Inter / SF Pro / JetBrains Mono |

---

## 4. State Management Boundary

Phient UI is **100% UI-only**. Components accept state via props and notify changes through standard callback handlers (`onClick`, `onChange`, `onNodeClick`, `onDismiss`).
Consumers can integrate Phient UI with any state solution (Zustand, Redux, React Context, TanStack Query) without friction.
