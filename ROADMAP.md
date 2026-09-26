# Phient UI (`@pui/components`) Architectural Roadmap

> _Milestone roadmap for Phient UI component library, Palantir Blueprint parity, and standalone applications._

---

## 1. Roadmap Milestones

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'background': 'transparent', 'mainBkg': 'transparent', 'nodeBorder': '#3b82f6', 'clusterBkg': 'transparent', 'clusterBorder': '#475569', 'lineColor': '#60a5fa', 'textColor': '#ffffff', 'primaryTextColor': '#ffffff', 'nodeTextColor': '#ffffff', 'edgeLabelBackground': '#0f172a'}}}%%
graph LR
    M1["Phase 1: Foundation<br/>- Palantir Blueprint Core Primitives<br/>- Tokens & PuiProvider<br/>- Strict Decoupling"] --> M2["Phase 2: Applications<br/>- docs-app (Workbench)<br/>- demo-app (Cockpit)<br/>- landing-app"]
    M2 --> M3["Phase 3: Advanced Ecosystem<br/>- Virtualized Spreadsheet Table<br/>- MultiSelect & Suggest<br/>- Topos Graph Canvas"]
```

---

## 2. Milestone Breakdown

### Phase 1: Core Foundation & Rebranding (Completed)
- [x] Establish the `@phiace/puijs` package and the `@pui/*` import namespaces
- [x] Purge domain shop/cart state from core library
- [x] Implement Palantir Blueprint standard design tokens (`--phi-*`)
- [x] Build `PuiProvider` with Foundry, Blueprint, Emerald, and Midnight presets
- [x] Create `Tree`, `Tag`, `Callout`, `NonIdealState`, `Switch`, `FormGroup`, `ProgressBar`
- [x] Remove legacy `.storybook` in favor of `apps/docs-app`

### Phase 2: Standalone Applications (`apps/`) (Completed)
- [x] `apps/docs-app`: Interactive component playground, live props inspector, and code examples
- [x] `apps/demo-app`: Enterprise operations showcase with live agent swarms, telemetry drawer, and ontology trees
- [x] `apps/landing-app`: Design system landing showcase

### Phase 3: Advanced Data Structures & Virtualization (Upcoming)
- [ ] `@pui/components-table`: Virtualized spreadsheet table supporting 100k+ rows with column pinning and sorting
- [ ] `@pui/components-select`: Filterable `Select`, `MultiSelect`, `Suggest`, and `Omnibar`
- [ ] `@pui/components-graph`: Continuous phase manifold & Topos ontology graph visualizer
