# Changelog

All notable changes to `@phiace/puijs` are documented here.

## [0.4.0] - 2026-09-26

### Breaking
- Removed the legacy `commerce` component suite and `mockCommerceApi`. Use the new `shop` suite (`@phiace/puijs/shop`), `shopService`, and `mockShopApi` instead.
- Renamed/lowercased several component entry points (`display/card`, `display/list`, `navigation/sidebar`).

### Added
- 16-brand theming engine: site archetypes, per-user persisted preferences, mode-aware brand colors (`primaryDark`/`primaryHoverDark`), and gradient-by-default ambient surface treatments (`--phi-gradient-parent/child/accent/rail/card-wash`).
- New components: `PreferencesModal`, `Box`, `ResizablePanel`, `ProgressSteps`, `FileBrowser`/`AssetBrowser`, `Carousel`, `Collection`, rebuilt `Sidebar` (brand/nav variants), compound `Card` and `List` suites, brand marks, and a `social` module.
- New stores (`auth`, `cart`, `catalog`, `wishlist`, `order`, `payment`, `address`, `alert`, `recent`, `social`) wired to `shopService`.
- Overlay hooks `useDismiss` and `usePortalTarget`.
- Property-based test platform (fast-check): barrel integrity, single-base `<div>` enforcement, theming/gradient/archetype/preference property suites, and gradient snapshots.

### Changed
- Package build now excludes test files and stories from `dist`, keeping the published tarball to runtime code only.

## [0.3.5] - 2026-08-25

### Added
- Formalized Chapter 14 3D visual specifications in `specs/` (VolSurface 3D Manifold, Kuramoto Phase Sphere, Dual Cognition Inspector, and Strategy AST Tree Viewer).
- Enhanced Three.js WebGL shaders for geometric volatility curvature rendering.
- Interactive DocsPortal showcasing cognitive visual components.

### Changed
- Bumped version to `0.3.5`.
- Standardized git author to `bdizha <bdizha@gmail.com>`.

## [0.3.4] - 2026-08-25
- Added faint smooth gradients, rich Markdown AST parser, and EdX Paragon design token alignments.
