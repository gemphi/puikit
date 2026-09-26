// ============================================================================
// Root component barrel — stable public named-export surface.
//
// The shop/display/navigation groups were restructured into the
// singular-family + role-file + family-barrel layout (tasks 7.1–7.3). Each
// group barrel re-exports its family barrels via `export *`, so every
// pre-restructure public named export remains importable by the same name
// from the package root (Requirement 15.3). Only intra-package deep-import
// paths changed; the public surface below is backward compatible.
// ============================================================================

export * from './primitives';
export * from './layout';
export * from './forms';
export * from './overlays';
export * from './feedback';

// navigation: Link, Menu, Breadcrumbs, Tabs, TabList, Pagination, Navbar,
// BrandSelector, and (from ./sidebar) Sidebar, SidebarHeader, SidebarBody,
// SidebarFooter, SidebarNav, useSidebarContext.
export * from './navigation';

// display: Table, Accordion, Rating, Tree, and (restructured) Card,
// CardHeader, CardBody, CardFooter, CardImage, CARD_VARIANTS, List, ListItem.
export * from './display';

// shop: Price, ProductCard, ProductGrid, ProductList, ProductItem,
// FacetFilter, CartItem, CartSummary, CartDrawer, OrderCard, AddressCard,
// PaymentMethod, WishlistItem.
export * from './shop';
export * from './social'; // SocialProvider, useSocial, PostList, EngagementRail, CommentsDrawer
export * from './brand'; // BRAND_MARKS, BrandMark — the phi ecosystem's marks

export * from '../store';
export * from '../services';
export * from '../api';
export * from '../hooks';
export * from '../providers';
export * from './media'; // Image, Avatar
